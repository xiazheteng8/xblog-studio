"""Bounded public-HTTP video ingestion. Every connection is DNS-pinned.

No proxy, browser cookies, external downloader or manifest downloader is used.
"""
import base64
import http.client
from html.parser import HTMLParser
import io
import ipaddress
import json
import re
import socket
import ssl
import time
from urllib.parse import urlsplit, urljoin


class SourceError(Exception):
    def __init__(self, message, status=502):
        super().__init__(message)
        self.status = status


def validate_url(value):
    try:
        value = str(value).strip()
        p = urlsplit(value)
        if p.scheme not in ('http', 'https') or not p.hostname or p.username is not None or p.password is not None or p.port == 0 or any(ord(c) < 33 for c in value) or '\\' in value:
            raise ValueError()
        host = p.hostname.rstrip('.').lower()
        if host == 'localhost' or host.endswith(('.localhost', '.local', '.internal')) or host in ('metadata.google.internal', 'metadata'):
            raise ValueError()
        try:
            address = ipaddress.ip_address(host)
        except ValueError:
            address = None
        if address is not None and not address.is_global:
            raise ValueError()
        return value
    except (ValueError, TypeError):
        raise SourceError('视频链接必须是 HTTP/HTTPS 公网地址，禁止内网、localhost 和凭据', 400) from None


def _resolve(host, port):
    return list(dict.fromkeys(item[4][0] for item in socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)))


def _transport(url, address, timeout, headers, data, method):
    p = urlsplit(url)
    port = p.port or (443 if p.scheme == 'https' else 80)
    conn = http.client.HTTPConnection(p.hostname, port, timeout=timeout)
    # Connect to the validated numeric address, preserving TLS SNI and Host.
    sock = socket.create_connection((address, port), timeout)
    if p.scheme == 'https':
        try:
            sock = ssl.create_default_context().wrap_socket(sock, server_hostname=p.hostname)
        except Exception:
            sock.close()
            raise
    conn.sock = sock
    try:
        conn.request(method, (p.path or '/') + ('?' + p.query if p.query else ''), body=data, headers=headers)
        response = conn.getresponse()
        response._source_connection = conn
        return response
    except Exception:
        conn.close()
        raise


class PublicHTTP:
    def __init__(self, *, resolver=None, transport=None, timeout=60, max_total=40 * 1024 * 1024):
        self.resolver = resolver or _resolve
        self.transport = transport or _transport
        self.deadline = time.monotonic() + timeout
        self.remaining = max_total

    def check(self, url):
        url = validate_url(url)
        p = urlsplit(url)
        try:
            addresses = self.resolver(p.hostname, p.port or (443 if p.scheme == 'https' else 80))
            if not addresses or any(not ipaddress.ip_address(a).is_global or getattr(ipaddress.ip_address(a), 'ipv4_mapped', None) is not None for a in addresses):
                raise SourceError('视频链接 DNS 指向非公网地址，已拒绝', 400)
            return url, addresses[0]
        except (OSError, ValueError):
            raise SourceError('视频网站 DNS 解析失败', 502) from None

    def get(self, url, *, limit=2 * 1024 * 1024, headers=None, data=None, method='GET'):
        headers = {k: v for k, v in dict(headers or {}).items() if k.lower() not in ('host', 'cookie', 'authorization', 'proxy-authorization', 'accept-encoding')}
        headers.update({'User-Agent': 'Mozilla/5.0 Xblog/1.0', 'Accept-Encoding': 'identity'})
        for _ in range(6):
            url, address = self.check(url)
            remaining_time = self.deadline - time.monotonic()
            if remaining_time <= 0:
                raise SourceError('视频抓取超过总时间限制')
            response = None
            try:
                response = self.transport(url, address, min(10, remaining_time), headers, data, method)
                status, response_headers = response.status, dict(response.headers)
                lower = {k.lower(): v for k, v in response_headers.items()}
                if status in (301, 302, 303, 307, 308):
                    if not lower.get('location'):
                        raise SourceError('视频网站重定向缺少地址')
                    url = urljoin(url, lower['location'])
                    if status in (301, 302, 303):
                        data, method = None, 'GET'
                    continue
                if status >= 400:
                    raise SourceError(f'视频网站返回 HTTP {status}；请检查访问权限')
                if lower.get('content-encoding', 'identity').lower() != 'identity':
                    raise SourceError('视频网站返回不受支持的压缩响应')
                if int(lower.get('content-length') or 0) > min(limit, self.remaining):
                    raise SourceError('视频材料超过下载大小限制')
                chunks, size = [], 0
                while True:
                    if time.monotonic() >= self.deadline:
                        raise SourceError('视频抓取超过总时间限制')
                    chunk = response.read(min(65536, limit - size + 1))
                    if not chunk:
                        break
                    size += len(chunk)
                    self.remaining -= len(chunk)
                    if size > limit or self.remaining < 0:
                        raise SourceError('视频材料超过下载大小限制')
                    chunks.append(chunk)
                return b''.join(chunks), response_headers, url, status
            except (OSError, ValueError, http.client.HTTPException):
                raise SourceError('视频网站连接失败、响应无效或请求超时') from None
            finally:
                if response is not None:
                    response.close()
                    conn = getattr(response, '_source_connection', None)
                    if conn:
                        conn.close()
        raise SourceError('视频网站重定向次数过多')


class _Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ''
        self.description = ''
        self.in_title = False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'title': self.in_title = True
        if tag == 'meta':
            name = (attrs.get('property') or attrs.get('name') or '').lower()
            if name == 'og:title': self.title = attrs.get('content', '')
            if name in ('og:description', 'description'): self.description = attrs.get('content', '')
    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
    def handle_data(self, data):
        if self.in_title: self.title += data


def _extract(url, client):
    import yt_dlp
    from yt_dlp.networking.common import Response
    from yt_dlp.networking.exceptions import HTTPError
    class SafeYDL(yt_dlp.YoutubeDL):
        def urlopen(self, request):
            # All extractor HTTP calls, including embedded APIs and manifests,
            # must traverse the same pinned, bounded transport.
            if isinstance(request, str):
                target, headers, data, method = request, {}, None, 'GET'
            else:
                target = request.url if hasattr(request, 'url') else request.full_url
                headers = dict(request.headers)
                data = request.data
                method = request.method if hasattr(request, 'method') else request.get_method()
            try:
                raw, hs, final, status = client.get(target, headers=headers, data=data, method=method)
            except SourceError as exc:
                if exc.status == 400:
                    self.source_violation = exc
                raise
            response = Response(io.BytesIO(raw), final, hs, status)
            return response
    with SafeYDL({'quiet': True, 'no_warnings': True, 'noplaylist': True, 'ignore_no_formats_error': True, 'skip_download': True, 'cachedir': False, 'extractor_retries': 0, 'retries': 0, 'socket_timeout': 10}) as ydl:
        ydl.source_violation = None
        try:
            info = ydl.extract_info(url, download=False)
        finally:
            if ydl.source_violation:
                raise ydl.source_violation
        if not info or info.get('_type') in ('playlist', 'multi_video'):
            raise SourceError('请使用单个视频链接，不支持播放列表', 400)
        return info


def load_video_media(url, *, video=False, fetch=None, client=None, extractor=None):
    client = client or PublicHTTP()
    url, _ = client.check(url)
    result = {'sourceUrl': url, 'title': '', 'description': '', 'transcript': '', 'sources': [], 'warnings': []}
    info = None
    if extractor is not False:
        try:
            info = (extractor or _extract)(url, client)
        except SourceError as exc:
            if exc.status == 400: raise
            result['warnings'].append(str(exc))
        except ImportError:
            result['warnings'].append('未安装 yt-dlp，改为读取公开网页或直链')
        except Exception:
            result['warnings'].append('视频平台解析失败（可能需要登录、地区权限或更新 yt-dlp），尝试公开网页')
    if info:
        result.update(title=str(info.get('title') or '')[:2000], description=str(info.get('description') or '')[:40000])
        result['sources'].append('yt-dlp-metadata')
        subtitles = info.get('subtitles') or info.get('automatic_captions') or {}
        for lang in sorted(subtitles, key=lambda s: (not s.startswith('zh'), not s.startswith('en'), s)):
            entries = sorted(subtitles[lang], key=lambda s: s.get('ext') != 'json3')
            for item in entries[:3]:
                try:
                    raw, _, _, _ = client.get(item['url'])
                    if item.get('ext') == 'json3':
                        data = json.loads(raw)
                        text = '\n'.join(''.join(s.get('utf8', '') for s in e.get('segs', [])) for e in data.get('events', []))
                    else:
                        text = raw.decode('utf-8', errors='replace')
                        text = re.sub(r'<[^>]*>|\d\d:\d\d[^\n]*|WEBVTT|^\d+$', '', text, flags=re.M)
                    result['transcript'] = text.strip()[:160000]
                    if result['transcript']:
                        result['sources'].append('video-captions:' + lang)
                        break
                except SourceError as exc:
                    if exc.status == 400: raise
                except (ValueError, KeyError): pass
            if result['transcript']: break
    direct = urlsplit(url).path.lower().endswith(('.mp4', '.webm', '.mov'))
    if not info and not direct:
        raw, headers, _, _ = client.get(url)
        content_type = next((v for k, v in headers.items() if k.lower() == 'content-type'), '')
        if content_type.startswith('video/'):
            direct = True
        else:
            page = _Page()
            page.feed(raw.decode('utf-8', errors='replace'))
            result.update(title=page.title.strip()[:2000], description=page.description[:40000])
            result['sources'].append('page-metadata')
            result['warnings'].append('仅取得普通网页标题/说明，尚未确认或读取网页中的视频')
    if video:
        candidates = [f for f in ((info or {}).get('formats') or ([info] if info else [])) if f.get('ext') == 'mp4' and f.get('protocol') in ('http', 'https') and f.get('vcodec') != 'none' and (f.get('filesize') or 0) <= 18 * 1024 * 1024]
        candidates.sort(key=lambda f: (f.get('height') or 99999, f.get('tbr') or 99999))
        target = candidates[0]['url'] if candidates else url if direct else None
        if target:
            try:
                raw, hs, _, _ = client.get(target, limit=18 * 1024 * 1024)
                mime = next((v.split(';')[0] for k, v in hs.items() if k.lower() == 'content-type'), 'video/mp4')
                if not mime.startswith('video/') and mime != 'application/octet-stream':
                    raise SourceError('直链未返回视频内容，未进行视频分析')
                result.update(videoData=base64.b64encode(raw).decode(), videoMimeType=mime if mime.startswith('video/') else 'video/mp4')
                result['sources'].append('public-video')
            except SourceError as exc:
                if exc.status == 400: raise
                result['warnings'].append(str(exc))
        if not result.get('videoData'):
            result['warnings'].append('未取得可分析的视频（需公开直链且不超过 18MB）；未进行视频理解')
    if not result['transcript']:
        result['warnings'].append('未取得可用字幕；可手动提供字幕以提高准确度')
    if not result['title'] and not result['description'] and not result.get('videoData'):
        raise SourceError('无法取得视频、字幕或网页标题说明；请检查公开访问权限或手动提供材料')
    return result
