# 🚀 部署 Xblog Studio

[← 功能介绍](../README.md) · [API 配置](API.md)

## 1. 先分清完整版与静态版

- **希望后台改文章后立即公开生效、使用真实登录与 API：选 VPS `server/`。**
- 只需要静态展示、可以每次导出再发布：选 `site/`。

静态 Pages 不运行 Python，不能把完整版后端直接上传后当作已经部署成功。

## 2. 本地运行完整版

安装 Python 3 和 Git，然后执行：

```bash
git clone https://github.com/xiazheteng8/xblog-studio.git
cd xblog-studio/server
python -m pip install -r requirements.txt
python server.py
```

访问 `http://127.0.0.1:8080/`，管理入口 `/#admin`。Windows 也可双击 `启动博客.bat`。首次默认账号 `admin`、密码 `password`，先修改再对外开放。

## 3. VPS：使用 Docker Compose

服务器需安装 Docker 与 Compose 插件。

```bash
git clone https://github.com/xiazheteng8/xblog-studio.git
cd xblog-studio/server
docker compose up -d --build
docker compose ps
docker compose logs --tail=50
```

Compose 默认绑定 **`127.0.0.1:8080`**，这是供反向代理访问的本机端口。不能直接用公网 `IP:8080` 访问是正常现象。

### 域名与反向代理

将域名解析到服务器，在同一宿主机的 Nginx 配置中转发至：

```nginx
server {
    listen 80;
    server_name blog.example.com;
    client_max_body_size 32m;
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

替换域名，测试配置后重载 Nginx，再使用面板或证书工具启用 HTTPS。OAuth 的 `SITE_URL` 和回调地址须与最终 HTTPS 域名一致。

若使用容器版 Nginx Proxy Manager，推荐把 NPM 与应用接入共同 Docker 网络，转发到服务名 `xblog:8080`；不要把 NPM 容器内的 `127.0.0.1` 当成宿主机应用。

### 私密配置持久化

基础博客可不配外部 API。需要配置时参考 [API.md](API.md)，在 `server/config.json` 填写私密参数，并给 `compose.yaml` 的 `volumes` 增加：

```yaml
      - ./config.json:/app/config.json:ro
```

保留原有 `./data:/app/data`，不要替换掉。保存后 `docker compose up -d --force-recreate`。密钥文件不要提交到 Git。

`.env.example` 是参数说明，**应用不会自动读取 `.env`**。使用环境变量时，应显式通过 Compose 的 `environment` 或 `env_file` 注入。

## 4. GitHub Pages：发布静态版

1. Fork 仓库。
2. **Settings → Pages → Source** 选 **GitHub Actions**。
3. **Actions** 启用并运行 **Deploy GitHub Pages demo**。
4. 工作流发布 `site/`，完成后在 Pages 设置打开站点。

静态版编辑保存在本浏览器；需要让所有人看到新内容时，使用界面提供的导出方式生成站点文件，再更新仓库 / 重新部署。静态登录界面不等于服务端身份验证，不能用它保护公开资源或密钥。

## 5. Cloudflare Pages：发布静态版

创建 Pages 项目连接自己的仓库：分支 `main`、根目录 `site`、框架 **None**、构建命令留空、输出目录 `.`。也可以直接上传 `site/` 的完整内容。

这份仓库没有与静态站配套的完整 Worker / 数据库后端；不要把 `server/` 当作 Pages 构建产物。需要完整版请使用 VPS。

## 6. 更新与备份

VPS 必须备份完整 `server/data/` 和私密配置。SQLite 与 `data/uploads` 要一起保存。建议停服后备份，完成再启动：

```bash
docker compose stop
cp -a data ../xblog-data-backup
docker compose start
```

每次备份使用不同目录，确认备份可读后再 `git pull --ff-only` 并 `docker compose up -d --build`。不要删除数据目录，不要用演示数据库覆盖现有数据。

## 🔎 验收与排错

| 检查 | 预期 |
| --- | --- |
| 修改密码，退出再登录 | 使用新密码成功 |
| 新建测试博文并刷新 | 完整版能读到保存内容 |
| 上传图片 | 图片可显示；重建容器后仍在 |
| 打开后台 API 配置 | 未配置服务不会伪装调用成功 |
| OAuth 失败 | 检查站点 HTTPS 域名、回调、应用权限与凭据 |
| 上传失败 | 同时检查应用限制、反向代理上传限制与磁盘空间 |

外部平台能力取决于实际申请权限与服务可用性，先保证基础博客可用，再逐项开启 API。
