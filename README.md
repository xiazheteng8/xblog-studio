<div align="center">

# ✦ Xblog Studio · 瞎折腾博客工作台

### 把文章、视频与个人作品，整理成自己的内容主场。

博客 CMS · 视频教程 · 可视化编辑 · 多主题 · AI 辅助创作

[🌐 VPS 演示](https://xiazheteng.fun/) · [☁️ Pages 演示](https://xiazheteng-blog.pages.dev/) · [📖 部署教程](docs/DEPLOY.md) · [🔑 API 配置](docs/API.md)

![Backend](https://img.shields.io/badge/Backend-Python%20%2B%20SQLite-2563eb?style=flat-square)
![Frontend](https://img.shields.io/badge/Frontend-Vanilla%20JavaScript-059669?style=flat-square)
![Deploy](https://img.shields.io/badge/Deploy-VPS%20%7C%20Static%20Pages-7c3aed?style=flat-square)

</div>

---

面向个人站长与视频创作者的博客工作台：用首页展示频道与作品，用图文整理完整教程，用后台管理文章、主题、页面和推广内容。完整版使用 Python 与 SQLite，前端不需要复杂构建；也提供可静态部署的 Pages 版本。

## ✨ 内容、展示与管理，一套完成

| 模块 | 实际能力 |
| --- | --- |
| 🏠 品牌首页 | 频道资料、探索领域、原创项目与精选教程卡片 |
| ✍️ 博文管理 | 创建、编辑、分类与标签，结合视频、链接和正文展示 |
| 🧩 可视化编辑 | 富文本、表格、图片 / 视频 / 附件上传，支持粘贴图片 |
| 📺 视频内容 | YouTube 播放、频道与视频统计；AI 视频 / 网页内容辅助创作 |
| 🎨 多套外观 | 内置 5 套主题，配合页面布局与主题动效 |
| 📄 页面管理 | 首页、关于、声明、自定义页面与公开导航 |
| 🎵 音乐播放器 | 内置曲库、随机播放、暂停 / 停止、选曲及自定义歌单 |
| 👥 用户与会员 | 用户资料、会员等级、评论与 OAuth 接入配置 |
| 📣 运营模块 | 广告位置、赞助相关配置和对外内容接口 |
| 💾 数据管理 | 后台备份与恢复；VPS 使用 SQLite 和上传目录持久化 |

### ✍️ 图文不只是视频简介

在同一篇文章中组织视频、操作步骤、表格、配图和相关链接。后台管理站点内容，无需为了改一段介绍反复编辑 HTML。AI 功能可辅助整理素材，发布前仍应核对内容与来源。

### 🏠 让首页成为作品入口

配置站点介绍、频道信息、技术领域与原创项目，把分散的文章、视频和 GitHub 项目放到统一入口。关于、声明及自定义页面也可从后台管理。

## 🚀 先选对版本

| 方式 | 使用目录 | 保存与发布 | 适合场景 |
| --- | --- | --- | --- |
| VPS 完整版 | `server/` | 服务端 SQLite；上传存入 `data/uploads` | 正式博客、远程管理、真实 API 与登录 |
| 静态 Pages 版 | `site/` | 本浏览器编辑与导出；公开更新需重新部署 | 静态展示、低维护成本、功能演示 |

**GitHub Pages / 静态 Cloudflare Pages 不会运行 Python 后端。** 把 `site/` 上传后，不会自动获得服务端登录、数据库、OAuth 回调或私密 API 代理。需要这些能力请部署 VPS 完整版。

## 🧑‍💻 本地启动完整版

先安装 Python 3，再下载并解压仓库，在项目目录运行：

```bash
cd server
python -m pip install -r requirements.txt
python server.py
```

打开 `http://127.0.0.1:8080/`，后台为 `http://127.0.0.1:8080/#admin`。Windows 也可运行 `server/启动博客.bat`。

首次初始化的示例账号为 **`admin` / `password`**。请在本机完成密码修改和基本设置后再公开访问。博客与数据库基础服务使用 Python 标准库；视频抓取扩展依赖 `requirements.txt`。

👉 **[完整部署教程：Docker、域名 HTTPS、更新备份与静态 Pages](docs/DEPLOY.md)**

## 🔑 外部 API：按需要开启

| 功能 | 需要什么 | 不配置时 |
| --- | --- | --- |
| YouTube 频道 / 视频统计 | YouTube Data API v3 Key 与频道 Handle | 不进行对应统计同步；文章仍可展示 |
| AI 辅助创作 | OpenAI 兼容接口或 Gemini 的端点、模型、Key | 可手动编辑文章 |
| 第三方登录 | Google / GitHub / QQ / 微信应用凭据及回调地址 | 使用本地账号 |
| 视频 / 网页抓取 | 抓取依赖、可访问的公开来源 | 网站限制、登录墙或来源变动可能导致失败 |

👉 **[逐项 API 配置：申请入口、环境变量、私密配置与 OAuth 回调](docs/API.md)**

源码不附带真实 API Key、OAuth Secret 或生产数据库。VPS 的密钥应放服务端配置；不要写进 `site/`、`server/public/` 或公开 Git 仓库。

## 📦 仓库结构

```text
server/
  server.py              HTTP 服务、文章与用户 API
  integration.py         AI、YouTube、OAuth 等集成
  video_sources.py       视频 / 网页素材抓取
  uploads.py             上传处理
  public/                完整版前端
  compose.yaml           Docker Compose
  config.json            私密配置入口，仓库内为空配置
site/                    可独立部署的静态版
.github/workflows/       GitHub Pages 发布 site/
docs/                    部署与 API 教程
```

## 💬 使用前了解这些

- **备份数据库也要备份上传文件。** VPS 请保存完整 `server/data/`；只保存数据库不会带走图片、音视频和附件。
- **静态站编辑不等于公开发布。** 本机改动需要导出并重新部署，其他访客才能看到。
- **音乐受浏览器自动播放策略约束。** 通常先点击页面才能播放；自定义曲库保存在本浏览器。
- **AI 抓取不是任意网站都保证成功。** 受来源权限、反爬限制、网络和模型能力影响。
- **演示站可能先于仓库上线更新。** 本文以当前仓库提供的能力和目录为准。

## 🤝 反馈与交流

[提交 Issue](https://github.com/xiazheteng8/xblog-studio/issues) 时，请说明所用版本、部署方式和复现步骤，日志中请隐藏密钥。

[📺 YouTube](https://www.youtube.com/@xiazheteng8) · [💬 Telegram](https://t.me/xiazheteng8) · [🏠 博客](https://xiazheteng.fun/)
