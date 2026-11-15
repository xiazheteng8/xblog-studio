"""Authenticated uploads stored alongside the configured database."""
import base64
import binascii
import re
import secrets
from pathlib import Path

IMAGE_LIMIT = 10 * 1024 * 1024
MEDIA_LIMIT = 50 * 1024 * 1024
ATTACHMENT_LIMIT = 20 * 1024 * 1024
JSON_LIMIT = (MEDIA_LIMIT * 4 // 3) + 8192
TYPES = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
         '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4',
         '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4',
         '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.pdf': 'application/pdf',
         '.txt': 'text/plain', '.csv': 'text/csv', '.zip': 'application/zip'}


def save_upload(body, data_dir, error):
    filename, encoded, mime = (body.get(key) for key in ('filename', 'data', 'mime'))
    if not all(isinstance(value, str) for value in (filename, encoded, mime)):
        raise error('filename, data and mime must be strings')
    if len(filename) > 200 or not filename or any(c in filename for c in '/\\:\x00') or filename in ('.', '..'):
        raise error('Invalid filename')
    suffix = Path(filename).suffix.lower()
    expected = TYPES.get(suffix)
    if not expected or mime.lower() != expected:
        raise error('Unsupported file type or MIME mismatch')
    limit = IMAGE_LIMIT if expected.startswith('image/') else MEDIA_LIMIT if expected.startswith(('audio/', 'video/')) else ATTACHMENT_LIMIT
    if len(encoded) > ((limit + 2) // 3) * 4:
        raise error('File too large', 413)
    try:
        data = base64.b64decode(encoded, validate=True)
    except (ValueError, binascii.Error):
        raise error('Invalid base64 data')
    if not data:
        raise error('Empty file')
    if len(data) > limit:
        raise error('File too large', 413)
    signatures = {
        '.png': data.startswith(b'\x89PNG\r\n\x1a\n'),
        '.jpg': data.startswith(b'\xff\xd8\xff'), '.jpeg': data.startswith(b'\xff\xd8\xff'),
        '.gif': data.startswith((b'GIF87a', b'GIF89a')),
        '.webp': data.startswith(b'RIFF') and data[8:12] == b'WEBP',
        '.pdf': data.startswith(b'%PDF-'), '.zip': data.startswith((b'PK\x03\x04', b'PK\x05\x06')),
        '.mp4': data[4:8] == b'ftyp', '.m4a': data[4:8] == b'ftyp',
        '.webm': data.startswith(b'\x1aE\xdf\xa3'), '.ogg': data.startswith(b'OggS'),
        '.wav': data.startswith(b'RIFF') and data[8:12] == b'WAVE',
        '.mp3': data.startswith(b'ID3') or (len(data) >= 2 and data[0] == 255 and data[1] & 224 == 224),
    }
    if suffix in signatures and not signatures[suffix]:
        raise error('File contents do not match extension')
    directory = Path(data_dir) / 'uploads'
    directory.mkdir(parents=True, exist_ok=True)
    name = secrets.token_hex(16) + suffix
    with (directory / name).open('xb') as stream:
        stream.write(data)
    return {'url': '/uploads/' + name, 'filename': filename, 'mime': expected, 'size': len(data)}


def serve_upload(handler, path, method, data_dir):
    name = path.removeprefix('/uploads/')
    if not re.fullmatch(r'[0-9a-f]{32}\.[a-z0-9]+', name) or Path(name).suffix not in TYPES:
        handler.send_error(404)
        return
    directory = (Path(data_dir) / 'uploads').resolve()
    target = (directory / name).resolve()
    if not target.is_relative_to(directory) or not target.is_file():
        handler.send_error(404)
        return
    data = target.read_bytes()
    handler.send_response(200)
    handler.send_header('Content-Type', TYPES[target.suffix])
    handler.send_header('Content-Length', str(len(data)))
    handler.send_header('X-Content-Type-Options', 'nosniff')
    handler.send_header('Content-Security-Policy', "default-src 'none'; sandbox")
    handler.send_header('Cache-Control', 'public, max-age=31536000, immutable')
    if not TYPES[target.suffix].startswith(('image/', 'video/', 'audio/')):
        handler.send_header('Content-Disposition', 'attachment; filename="' + name + '"')
    handler.end_headers()
    if method != 'HEAD':
        handler.wfile.write(data)
