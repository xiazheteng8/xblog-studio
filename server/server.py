#!/usr/bin/env python3
"""
Xblog · 动态博客与 CMS 后端服务 (server.py)
基于 Python 3 标准库 (http.server + sqlite3)，无须 pip 安装任何第三方依赖。
包含：文章管理与单独显示配置、HORO 多主题、4 类广告位自动空闲隐藏、金主 API 自助对接平台、AI 自动发帖开放 API。
"""
import ast
import copy
import json
import traceback
from contextlib import closing
import os
import re
import secrets
import sqlite3
import sys
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit
from uploads import JSON_LIMIT, save_upload, serve_upload

MAX_BYTES = 10 * 1024 * 1024
ACTIVE_TOKENS = set()
if __name__ == '__main__':
    # integration imports server; share the running process's APIError and tokens.
    sys.modules['server'] = sys.modules[__name__]


class APIError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


class SeedParts(tuple):
    def __new__(cls, state):
        obj = super().__new__(cls, (state.get('posts', []), state.get('ads', {}),
                                   state.get('settings', {}), state.get('comments', []),
                                   state.get('adTokens', []), state))
        return obj


def extract_seed_from_public(public_dir: Path):
    private_seed = public_dir.parent / 'seed.json'
    if private_seed.exists():
        return SeedParts(json.loads(private_seed.read_text(encoding='utf-8')))
    seed_js = public_dir / "js" / "data-seed.js"
    if not seed_js.exists():
        return SeedParts({})
    text = seed_js.read_text(encoding="utf-8")
    m = re.search(r'window\.APP_STATE\s*=\s*(\{[\s\S]*?\})\s*;', text)
    if m:
        try:
            raw = m.group(1).rstrip(';').strip()
            data = json.loads(raw)
            return SeedParts(data)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid seed JSON: {seed_js}") from exc
    raise ValueError(f"APP_STATE assignment not found: {seed_js}")


def initialize_database(db_path: Path, seed_posts, seed_ads, seed_settings, seed_comments, seed_tokens, seed_state=None):
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()
    cur.execute("CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
    first_init = cur.execute("SELECT value FROM app_state WHERE key = 'initialized'").fetchone() is None
    if seed_state is not None and first_init:
        cur.execute("INSERT OR REPLACE INTO app_state VALUES ('state', ?)", (json.dumps(seed_state),))

    cur.execute("""
    CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT,
        youtube_id TEXT,
        category TEXT,
        date TEXT,
        tags TEXT,
        views TEXT,
        duration TEXT,
        external_links TEXT,
        content TEXT,
        display_config TEXT,
        created_at INTEGER
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS ads (
        slot_key TEXT PRIMARY KEY,
        enabled INTEGER,
        badge TEXT,
        title TEXT,
        desc TEXT,
        link_text TEXT,
        link_url TEXT,
        image_url TEXT,
        custom_html TEXT,
        apply_all INTEGER,
        target_posts TEXT,
        impressions INTEGER,
        clicks INTEGER
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT,
        author TEXT,
        text TEXT,
        date TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT NOT NULL,
        nickname TEXT,
        avatar TEXT,
        role TEXT DEFAULT 'member',
        level_name TEXT DEFAULT '志同道合',
        created_at TEXT
    )
    """)
    
    cur.execute("SELECT COUNT(*) FROM users")
    if cur.fetchone()[0] == 0 and os.environ.get('BLOG_SKIP_DEMO_USERS', '1') != '1':
        cur.executemany("""
        INSERT INTO users (id, username, password, nickname, avatar, role, level_name, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            ("u_admin_root", "admin", "password", "admin (站长)", "https://unavatar.io/youtube/admin", "admin", "站长 · 管理员", "2026-10-01"),
            ("u_member_geek01", "geek_player", "123456", "沉迷黑苹果的极客", "https://api.dicebear.com/7.x/bottts/svg?seed=geek01", "member", "志同道合", "2026-10-25"),
            ("u_member_geek02", "hyperos_fan", "123456", "爆改HyperOS的折腾党", "https://api.dicebear.com/7.x/bottts/svg?seed=hyper02", "member", "志同道合", "2026-10-28")
        ])
        conn.commit()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS ad_tokens (
        token TEXT PRIMARY KEY,
        name TEXT,
        allowed_slots TEXT,
        expire_at TEXT,
        created_at TEXT,
        active INTEGER
    )
    """)
    conn.commit()

    # Seed data if empty
    cur.execute("SELECT COUNT(*) FROM posts")
    if first_init and cur.fetchone()[0] == 0 and seed_posts:
        for p in seed_posts:
            yt_id = p.get("youtubeId") or p.get("videoId") or ""
            dc = p.get("displayConfig") or {
                "coverType": "youtube",
                "customCoverUrl": "",
                "topDisplayMode": "player",
                "showLinks": True,
                "showToc": True,
                "showComments": True,
                "showAd": True
            }
            cur.execute("""
            INSERT INTO posts (id, title, summary, youtube_id, category, date, tags, views, duration, external_links, content, display_config, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                p.get("id"), p.get("title"), p.get("summary"), yt_id,
                p.get("category"), p.get("date"), json.dumps(p.get("tags", [])),
                str(p.get("views", "1k")), p.get("duration", "精讲"), json.dumps(p.get("links") or p.get("externalLinks") or []),
                p.get("content"), json.dumps(dc), int(time.time())
            ))
        conn.commit()

    cur.execute("SELECT COUNT(*) FROM ads")
    if first_init and cur.fetchone()[0] == 0 and seed_ads:
        for k, a in seed_ads.items():
            cur.execute("""
            INSERT INTO ads (slot_key, enabled, badge, title, desc, link_text, link_url, image_url, custom_html, apply_all, target_posts, impressions, clicks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                k, 1 if a.get("enabled", True) else 0, a.get("badge", ""),
                a.get("title", ""), a.get("desc", ""), a.get("linkText", ""),
                a.get("linkUrl", ""), a.get("imageUrl", ""), a.get("customHtml", ""),
                1 if a.get("applyAll", False) else 0, json.dumps(a.get("targetPostIds", [])),
                a.get("impressions", 0), a.get("clicks", 0)
            ))
        conn.commit()

    cur.execute("SELECT COUNT(*) FROM settings")
    if first_init and cur.fetchone()[0] == 0 and seed_settings:
        for k, v in seed_settings.items():
            cur.execute("INSERT INTO settings (key, value) VALUES (?, ?)", (k, json.dumps(v)))
        conn.commit()

    cur.execute("SELECT COUNT(*) FROM comments")
    if first_init and cur.fetchone()[0] == 0 and seed_comments:
        for c in seed_comments:
            cur.execute("""
            INSERT INTO comments (id, post_id, author, text, date)
            VALUES (?, ?, ?, ?, ?)
            """, (c.get("id"), c.get("postId"), c.get("author"), c.get("text"), c.get("date")))
        conn.commit()

    cur.execute("SELECT COUNT(*) FROM ad_tokens")
    if first_init and cur.fetchone()[0] == 0 and seed_tokens:
        for t in seed_tokens:
            cur.execute("""
            INSERT INTO ad_tokens (token, name, allowed_slots, expire_at, created_at, active)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (
                t.get("token"), t.get("name"), json.dumps(t.get("allowedSlots", [])),
                t.get("expireAt", "永久有效"), t.get("createdAt", ""), 1 if t.get("active", True) else 0
            ))
        conn.commit()

    cur.execute("INSERT OR REPLACE INTO app_state VALUES ('initialized', 'true')")
    conn.commit()
    conn.close()


def load_all_from_db(db_path: Path):
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("SELECT * FROM posts ORDER BY created_at DESC")
    posts = []
    for r in cur.fetchall():
        posts.append({
            "id": r["id"],
            "title": r["title"],
            "summary": r["summary"],
            "youtubeId": r["youtube_id"],
            "category": r["category"],
            "date": r["date"],
            "tags": json.loads(r["tags"] or "[]"),
            "views": r["views"],
            "duration": r["duration"],
            "externalLinks": json.loads(r["external_links"] or "[]"),
            "content": r["content"],
            "displayConfig": json.loads(r["display_config"] or '{"coverType":"youtube","topDisplayMode":"player","showLinks":true,"showToc":true,"showComments":true,"showAd":true}'),
            "createdAt": r["created_at"]
        })

    cur.execute("SELECT * FROM ads")
    ads = {}
    for r in cur.fetchall():
        ads[r["slot_key"]] = {
            "enabled": bool(r["enabled"]),
            "badge": r["badge"],
            "title": r["title"],
            "desc": r["desc"],
            "linkText": r["link_text"],
            "linkUrl": r["link_url"],
            "imageUrl": r["image_url"],
            "customHtml": r["custom_html"],
            "applyAll": bool(r["apply_all"]),
            "targetPostIds": json.loads(r["target_posts"] or "[]"),
            "impressions": r["impressions"] or 0,
            "clicks": r["clicks"] or 0
        }

    cur.execute("SELECT * FROM settings")
    settings = {r["key"]: decode_setting(r["value"]) for r in cur.fetchall()}

    cur.execute("SELECT * FROM comments")
    comments = [{"id": r["id"], "postId": r["post_id"], "author": r["author"], "text": r["text"], "date": r["date"]} for r in cur.fetchall()]

    cur.execute("SELECT * FROM ad_tokens")
    tokens = []
    for r in cur.fetchall():
        tokens.append({
            "token": r["token"],
            "name": r["name"],
            "allowedSlots": json.loads(r["allowed_slots"] or "[]"),
            "expireAt": r["expire_at"],
            "createdAt": r["created_at"],
            "active": bool(r["active"])
        })

    conn.close()
    return posts, ads, settings, comments, tokens


def decode_setting(value):
    try:
        return json.loads(value)
    except (ValueError, TypeError):
        # Recover structured settings written by older versions using str(dict).
        try:
            recovered = ast.literal_eval(value)
            return recovered if isinstance(recovered, (dict, list, bool, int, float)) else value
        except (ValueError, SyntaxError, TypeError):
            return value


def load_app_state(db_path):
    posts, ads, settings, comments, tokens = load_all_from_db(db_path)
    with closing(sqlite3.connect(str(db_path))) as conn:
        row = conn.execute("SELECT value FROM app_state WHERE key = 'state'").fetchone()
        state = json.loads(row[0]) if row else {}
        conn.row_factory = sqlite3.Row
        users = [dict(r) for r in conn.execute(
            'SELECT id, username, nickname, avatar, role, level_name AS levelName, created_at AS createdAt FROM users')]
    def merge_record(saved, current):
        merged = dict(saved, **current)
        for key, value in current.items():
            if key in saved and isinstance(saved[key], (int, float)) and not isinstance(saved[key], bool) and str(saved[key]) == value:
                merged[key] = saved[key]
        return merged

    def merge_list(key, records, identity):
        saved = {item[identity]: item for item in state.get(key, [])}
        return [merge_record(saved.get(item[identity], {}), item) for item in records]

    # SQL fields remain authoritative for legacy publish and integration routes.
    state['posts'] = merge_list('posts', posts, 'id')
    old_ads = state.get('ads', {})
    state['ads'] = {key: merge_record(old_ads.get(key, {}), value) for key, value in ads.items()}
    state['comments'] = merge_list('comments', comments, 'id')
    state['adTokens'] = merge_list('adTokens', tokens, 'token')
    state.update(settings=settings, users=users)
    return state


def save_app_state(db_path, state):
    if not isinstance(state, dict):
        raise APIError('APP_STATE must be an object')
    for key, kind in [('posts', list), ('ads', dict), ('settings', dict),
                      ('comments', list), ('adTokens', list)]:
        if key not in state or not isinstance(state[key], kind):
            raise APIError(f'APP_STATE.{key} must be a {kind.__name__}')
    state = copy.deepcopy(state)
    # Users are managed by authentication; a state snapshot must never copy passwords.
    state.pop('users', None)
    ids = set()
    for post in state['posts']:
        if not isinstance(post, dict) or not isinstance(post.get('id'), str) or not post['id'] or not isinstance(post.get('title'), str):
            raise APIError('Each post requires a string id and title')
        if post['id'] in ids:
            raise APIError('Duplicate post id')
        ids.add(post['id'])
    with closing(sqlite3.connect(str(db_path))) as conn, conn:
        for table in ('posts', 'ads', 'settings', 'comments', 'ad_tokens'):
            conn.execute(f'DELETE FROM {table}')
        for p in state['posts']:
            conn.execute('INSERT INTO posts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', (
                p['id'], p['title'], p.get('summary', ''), p.get('youtubeId') or p.get('videoId', ''),
                p.get('category', ''), p.get('date', ''), json.dumps(p.get('tags', [])),
                str(p.get('views', 0)), p.get('duration', ''),
                json.dumps(p.get('externalLinks', p.get('links', []))), p.get('content', ''),
                json.dumps(p.get('displayConfig', {})), p.get('createdAt', int(time.time()))))
        for key, a in state['ads'].items():
            conn.execute('INSERT INTO ads VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', (
                key, bool(a.get('enabled', True)), a.get('badge', ''), a.get('title', ''),
                a.get('desc', ''), a.get('linkText', ''), a.get('linkUrl', ''), a.get('imageUrl', ''),
                a.get('customHtml', ''), bool(a.get('applyAll', False)),
                json.dumps(a.get('targetPostIds', [])), a.get('impressions', 0), a.get('clicks', 0)))
        for key, value in state['settings'].items():
            conn.execute('INSERT INTO settings VALUES (?, ?)', (key, json.dumps(value)))
        for c in state['comments']:
            conn.execute('INSERT INTO comments VALUES (?, ?, ?, ?, ?)', (
                c['id'], c.get('postId'), c.get('author', ''), c.get('text', ''), c.get('date', '')))
        for t in state['adTokens']:
            conn.execute('INSERT INTO ad_tokens VALUES (?, ?, ?, ?, ?, ?)', (
                t['token'], t.get('name', ''), json.dumps(t.get('allowedSlots', [])),
                t.get('expireAt', ''), t.get('createdAt', ''), bool(t.get('active', True))))
        conn.execute("INSERT OR REPLACE INTO app_state VALUES ('state', ?)", (json.dumps(state),))


def integration_routes(handler, path, method, body, db_path):
    # Lazy import avoids the integration module's imports of server causing cycles.
    try:
        from integration import integration_routes as routes
    except ModuleNotFoundError as exc:
        if exc.name != 'integration':
            raise
        return False
    return routes(handler, path, method, body, db_path)


def public_state(value):
    if isinstance(value, dict):
        safe = {}
        for key, item in value.items():
            normalized = re.sub(r'[^a-z0-9]', '', key.lower())
            if (normalized in ('adtokens', 'adminpass', 'password', 'passwd', 'authorization', 'credentials')
                    or 'secret' in normalized or normalized.endswith(('apikey', 'token', 'privatekey'))
                    or normalized in ('key', 'aikey')):
                continue
            safe[key] = public_state(item)
        return safe
    if isinstance(value, list):
        return [public_state(item) for item in value]
    return value


def make_handler(public_dir: Path, db_path: Path):
    class BlogHandler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(public_dir), **kwargs)

        def send_json(self, data, status=200):
            payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
            self.end_headers()
            self.wfile.write(payload)

        def read_json_body(self):
            try:
                length = int(self.headers.get("Content-Length", 0))
            except ValueError:
                raise APIError('Invalid Content-Length')
            if length < 0:
                raise APIError('Invalid Content-Length')
            if length > (JSON_LIMIT if unquote(urlsplit(self.path).path) == '/api/admin/upload' else MAX_BYTES):
                raise APIError("Payload too large", 413)
            try:
                raw = self.rfile.read(length).decode("utf-8")
                body = json.loads(raw) if raw else {}
            except (UnicodeDecodeError, json.JSONDecodeError):
                raise APIError("Invalid JSON body", 400)
            if not isinstance(body, dict):
                raise APIError('JSON body must be an object')
            return body

        def dispatch(self, method):
            path = unquote(urlsplit(self.path).path)
            try:
                if path.startswith('/api/admin/') or (method in ('POST', 'PUT', 'DELETE') and path in ('/api/settings', '/api/ads')):
                    auth = self.headers.get('Authorization', '').split()
                    if len(auth) != 2 or auth[0].lower() != 'bearer' or auth[1] not in ACTIVE_TOKENS:
                        raise APIError('Admin authentication required', 401)
                if path.startswith('/uploads/') and method in ('GET', 'HEAD'):
                    serve_upload(self, path, method, db_path.parent)
                    return
                self.request_body = self.read_json_body() if method in ('POST', 'PUT') else {}
                if path == '/api/admin/upload' and method == 'POST':
                    self.send_json(save_upload(self.request_body, db_path.parent, APIError), 201)
                    return
                if method in ('GET', 'POST', 'PUT') and integration_routes(self, path, method, self.request_body, db_path):
                    return
                getattr(self, 'handle_' + method)()
            except APIError as exc:
                self.send_json({'error': str(exc)}, exc.status)
            except Exception as exc:
                traceback.print_exc()
                self.send_json({'error': 'Internal server error', 'type': type(exc).__name__}, 500)

        def do_GET(self):
            self.dispatch('GET')

        def do_HEAD(self):
            self.dispatch('HEAD')

        def handle_HEAD(self):
            target = Path(self.translate_path(unquote(urlsplit(self.path).path))).resolve()
            if target.name.lower() in ('seed.json', 'config.json') or target.suffix.lower() in ('.sqlite3', '.sqlite', '.db') or not target.is_relative_to(public_dir.resolve()):
                self.send_error(404)
                return
            super().do_HEAD()

        def do_POST(self):
            self.dispatch('POST')

        def do_PUT(self):
            self.dispatch('PUT')

        def do_DELETE(self):
            self.dispatch('DELETE')

        def do_OPTIONS(self):
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
            self.end_headers()

        def handle_GET(self):
            url = urlsplit(self.path)
            path = unquote(url.path)

            target = Path(self.translate_path(path)).resolve()
            if target.name.lower() in ('seed.json', 'config.json') or target.suffix.lower() in ('.sqlite3', '.sqlite', '.db') or not target.is_relative_to(public_dir.resolve()):
                self.send_json({'error': 'Not Found'}, 404)
                return

            if path == '/api/admin/state':
                self.send_json(load_app_state(db_path))
                return

            if path == "/api/bootstrap":
                self.send_json(public_state(load_app_state(db_path)))
                return

            if path == "/api/admin/ad-tokens":
                _, _, _, _, tokens = load_all_from_db(db_path)
                self.send_json({"tokens": tokens})
                return

            if path == "/api/sponsor/verify":
                qs = parse_qs(url.query)
                key = qs.get("key", [""])[0]
                _, ads, _, _, tokens = load_all_from_db(db_path)
                found = next((t for t in tokens if t["token"] == key and t["active"]), None)
                if not found:
                    self.send_json({"error": "Invalid or expired sponsor key"}, 403)
                    return
                allowed_ads = {k: ads.get(k, {}) for k in found["allowedSlots"]}
                self.send_json({
                    "sponsor": found,
                    "ads": allowed_ads
                })
                return

            super().do_GET()

        def handle_POST(self):
            url = urlsplit(self.path)
            path = unquote(url.path)
            body = self.request_body

            if path == "/api/auth/login":
                user = (body.get("user") or body.get("username") or "").strip()
                password = (body.get("password") or "").strip()
                _, _, settings, _, _ = load_all_from_db(db_path)
                admin_user = settings.get("adminUser", "admin")
                admin_pass = settings.get("adminPass", "password")

                # 站长/管理员登录核验
                if (user == admin_user or user.lower() == "contact@example.com") and password == admin_pass:
                    token = secrets.token_hex(24)
                    ACTIVE_TOKENS.add(token)
                    self.send_json({
                        "token": token,
                        "role": "admin",
                        "user": {
                            "id": "u_admin_root",
                            "username": admin_user,
                            "nickname": "admin (站长)",
                            "avatar": "https://unavatar.io/youtube/admin",
                            "role": "admin",
                            "levelName": "站长 · 管理员"
                        }
                    })
                    return

                # 普通会员登录核验
                conn = sqlite3.connect(str(db_path))
                cur = conn.cursor()
                cur.execute("SELECT id, username, password, nickname, avatar, role, level_name FROM users WHERE LOWER(username) = LOWER(?)", (user,))
                row = cur.fetchone()
                conn.close()

                if row and row[2] == password:
                    token = secrets.token_hex(24)
                    self.send_json({
                        "token": token,
                        "role": row[5] or "member",
                        "user": {
                            "id": row[0],
                            "username": row[1],
                            "nickname": row[3] or row[1],
                            "avatar": row[4],
                            "role": row[5] or "member",
                            "levelName": row[6] or "志同道合"
                        }
                    })
                    return

                self.send_json({"error": "账号或登录密码错误，请检查输入或前往注册！"}, 401)
                return

            if path == "/api/auth/register":
                username = (body.get("username") or "").strip()
                password = (body.get("password") or "").strip()
                nickname = (body.get("nickname") or "").strip()
                avatar = (body.get("avatar") or "").strip()

                if not username or not password:
                    self.send_json({"error": "账号和密码不能为空！"}, 400)
                    return
                if len(password) < 6:
                    self.send_json({"error": "登录密码长度不能少于 6 位！"}, 400)
                    return
                if username.lower() in ("admin", "contact@example.com"):
                    self.send_json({"error": "该账号为站长专属资产，禁止普通注册！"}, 403)
                    return

                conn = sqlite3.connect(str(db_path))
                cur = conn.cursor()
                cur.execute("SELECT id FROM users WHERE LOWER(username) = LOWER(?)", (username,))
                if cur.fetchone():
                    conn.close()
                    self.send_json({"error": "该账号已被注册，请直接登录或更换账号名！"}, 400)
                    return

                user_id = "u_" + secrets.token_hex(6)
                if not nickname:
                    nickname = f"折腾极客_{username[:6]}"
                if not avatar:
                    avatar = f"https://api.dicebear.com/7.x/bottts/svg?seed={user_id}"

                now_date = time.strftime("%Y-%m-%d")
                cur.execute("""
                INSERT INTO users (id, username, password, nickname, avatar, role, level_name, created_at)
                VALUES (?, ?, ?, ?, ?, 'member', '志同道合', ?)
                """, (user_id, username, password, nickname, avatar, now_date))
                conn.commit()
                conn.close()

                token = secrets.token_hex(24)
                self.send_json({
                    "success": True,
                    "token": token,
                    "user": {
                        "id": user_id,
                        "username": username,
                        "nickname": nickname,
                        "avatar": avatar,
                        "role": "member",
                        "levelName": "志同道合"
                    }
                })
                return
            if path == "/api/admin/ad-tokens":
                name = body.get("name")
                allowed_slots = body.get("allowedSlots", [])
                expire_at = body.get("expireAt", "永久有效")
                token = "SPON_" + secrets.token_hex(4).upper()
                conn = sqlite3.connect(str(db_path))
                conn.execute("""
                INSERT INTO ad_tokens (token, name, allowed_slots, expire_at, created_at, active)
                VALUES (?, ?, ?, ?, ?, 1)
                """, (token, name, json.dumps(allowed_slots), expire_at, time.strftime("%Y-%m-%d")))
                conn.commit()
                conn.close()
                self.send_json({"token": token, "name": name, "allowedSlots": allowed_slots})
                return

            if path == "/api/sponsor/update":
                key = body.get("apiKey")
                slot = body.get("slot")
                ad_data = body.get("adData", {})
                _, _, _, _, tokens = load_all_from_db(db_path)
                found = next((t for t in tokens if t["token"] == key and t["active"]), None)
                if not found:
                    self.send_json({"error": "Invalid sponsor key"}, 403)
                    return
                if slot not in found["allowedSlots"]:
                    self.send_json({"error": f"Not authorized for slot {slot}"}, 403)
                    return

                conn = sqlite3.connect(str(db_path))
                conn.execute("""
                UPDATE ads SET 
                    enabled = ?, badge = ?, title = ?, desc = ?, 
                    link_text = ?, link_url = ?, custom_html = ?
                WHERE slot_key = ?
                """, (
                    1 if ad_data.get("enabled", True) else 0,
                    ad_data.get("badge", "SPONSOR"),
                    ad_data.get("title", ""),
                    ad_data.get("desc", ""),
                    ad_data.get("linkText", "立即了解 ↗"),
                    ad_data.get("linkUrl", "#"),
                    ad_data.get("customHtml", ""),
                    slot
                ))
                conn.commit()
                conn.close()
                self.send_json({"success": True, "slot": slot})
                return

            if path == "/api/ai/publish":
                auth = self.headers.get("Authorization", "")
                token = auth.replace("Bearer ", "").strip()
                _, _, settings, _, _ = load_all_from_db(db_path)
                valid_key = settings.get("aiApiKey", "")
                if not valid_key or (token != valid_key and body.get("apiKey") != valid_key):
                    self.send_json({"error": "Invalid AI API Key"}, 401)
                    return

                post_id = body.get("id") or ("vid-ai-" + secrets.token_hex(4))
                title = body.get("title", "未命名 AI 教程")
                summary = body.get("summary", "")
                youtube_id = body.get("youtubeId", "")
                category = body.get("category", "折腾教程")
                tags = body.get("tags", ["AI自动发布"])
                content = body.get("content", "")
                links = body.get("externalLinks", [])
                dc = body.get("displayConfig", {
                    "coverType": "youtube",
                    "topDisplayMode": "player",
                    "showLinks": True,
                    "showToc": True,
                    "showComments": True,
                    "showAd": True
                })

                conn = sqlite3.connect(str(db_path))
                conn.execute("""
                INSERT INTO posts (id, title, summary, youtube_id, category, date, tags, views, duration, external_links, content, display_config, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    post_id, title, summary, youtube_id, category,
                    time.strftime("%Y-%m-%d"), json.dumps(tags),
                    "1", "精讲", json.dumps(links), content, json.dumps(dc), int(time.time())
                ))
                conn.commit()
                conn.close()
                self.send_json({"success": True, "id": post_id, "title": title})
                return

            if path == "/api/comments":
                post_id = body.get("postId")
                author = body.get("author", "@匿名折腾党")
                text = body.get("text", "")
                cid = "cm_" + secrets.token_hex(4)
                conn = sqlite3.connect(str(db_path))
                conn.execute("""
                INSERT INTO comments (id, post_id, author, text, date) VALUES (?, ?, ?, ?, ?)
                """, (cid, post_id, author, text, time.strftime("%Y-%m-%d")))
                conn.commit()
                conn.close()
                self.send_json({"success": True, "id": cid})
                return

            self.send_json({"error": "Not Found"}, 404)

        def handle_PUT(self):
            url = urlsplit(self.path)
            path = unquote(url.path)
            body = self.request_body

            if path == '/api/admin/state':
                save_app_state(db_path, body)
                self.send_json({'success': True})
                return

            if path == "/api/ads":
                conn = sqlite3.connect(str(db_path))
                for slot_key, a in body.items():
                    conn.execute("""
                    UPDATE ads SET enabled = ?, badge = ?, title = ?, desc = ?, link_text = ?, link_url = ?, custom_html = ?
                    WHERE slot_key = ?
                    """, (
                        1 if a.get("enabled", True) else 0,
                        a.get("badge", ""), a.get("title", ""), a.get("desc", ""),
                        a.get("linkText", ""), a.get("linkUrl", ""), a.get("customHtml", ""),
                        slot_key
                    ))
                conn.commit()
                conn.close()
                self.send_json({"success": True})
                return

            if path == "/api/settings":
                conn = sqlite3.connect(str(db_path))
                for k, v in body.items():
                    conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, json.dumps(v)))
                conn.commit()
                conn.close()
                self.send_json({"success": True})
                return

            self.send_json({"error": "Not Found"}, 404)

        def handle_DELETE(self):
            url = urlsplit(self.path)
            path = unquote(url.path)
            if path.startswith("/api/admin/ad-tokens/"):
                token = path.split("/")[-1]
                conn = sqlite3.connect(str(db_path))
                conn.execute("UPDATE ad_tokens SET active = 0 WHERE token = ?", (token,))
                conn.commit()
                conn.close()
                self.send_json({"success": True, "revoked": token})
                return
            self.send_json({"error": "Not Found"}, 404)

    return BlogHandler


def main():
    base_dir = Path(__file__).resolve().parent
    public_dir = base_dir / "public"
    db_path = Path(os.environ.get('BLOG_DATA_DIR', str(base_dir / 'data'))) / 'blog.sqlite3'

    initialize_database(db_path, *extract_seed_from_public(public_dir))

    port = int(os.environ.get("PORT", "8080"))
    handler_class = make_handler(public_dir, db_path)
    server = ThreadingHTTPServer(("0.0.0.0", port), handler_class)
    print(f"🚀 Xblog动态博客 CMS 已就绪: http://localhost:{port}")
    print('管理员凭据由私有种子或数据库设置提供。')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务已停止")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
