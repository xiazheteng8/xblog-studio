# Xblog Pages（最新版前端静态版）

[GitHub Pages 示范站点](https://xiazheteng8.github.io/xblog-studio/) · [VPS 示范站点](https://xiazheteng.fun/) · [YouTube @xiazheteng8](https://www.youtube.com/@xiazheteng8) · [Telegram @xiazheteng8](https://t.me/xiazheteng8)

第一次部署？先按 [本地 / VPS 新手教程](../README.md) 或 [GitHub / Cloudflare Pages 新手教程](../README-PAGES.md) 操作。下面是本目录的功能和配置参考。

本版本来自 Xblog-repaired/public 最新前端，保留富文本编辑器、页面管理、文章、分类与标签、广告展示配置、导航页脚、会员等级展示、关于/法律页面和五套主题。

## 打开与编辑

使用 HTTP(S) 静态服务访问根目录 index.html。不要双击 file://。后台入口 `#admin`，默认账号 `admin`，密码 `password`。

**纯静态模式的后台保存只写入当前浏览器的 localStorage，不会修改托管文件。** 刷新可以恢复；换浏览器、清除网站数据、切换域名或部署路径，不会自动共享编辑。编辑入口不是安全认证，任何人均可修改自己的本地副本，因此不要放置私密资料。修改账号/密码也只影响本浏览器。

在后台点击“导出公开 data-seed.js”，将下载文件替换项目的 `js/data-seed.js`，再重新部署。新访客会读到更新；已有本地编辑的浏览器仍优先使用其 localStorage，清除该站点数据可重新载入部署种子。保留公开 JS 文件格式 `window.APP_STATE = {...};`，不要把它作为 JSON 导入。导出会移除密码、密钥/token、OAuth/GoogleAuth、用户、评论、私有标识、API 地址等字段，并清空广告自定义 HTML。默认种子只包含一篇示范文章，不含原站密码、广告 token 或 API key。导出后仍请检查正文和链接中是否手工写入了不应公开的内容。

## GitHub Pages

1. 将此目录全部内容放到 GitHub 仓库根目录，包含 `.github/workflows/deploy-pages.yml` 和 `.nojekyll`。
2. 使用 `main` 分支；仓库 Settings → Pages → Source 选择 GitHub Actions。
3. 推送 main 或手动执行 Deploy static Pages。工作流上传当前目录并部署，不需要 Node/Python 构建。
4. 支持 `https://用户名.github.io/仓库名/` 项目子路径。资源使用相对路径、页面路由使用 hash，不需 SPA 重写。

## Cloudflare Pages 直接上传

打开 Cloudflare 控制台 → Workers & Pages → 创建应用 → Pages → 使用直接上传。将本目录内容拖入上传器（上传后的顶层应直接是 index.html、js、assets，而非再套一层目录），部署即可。也可以先将目录内容压缩后按控制台支持的 ZIP 上传方式发布。无需构建命令、Functions、D1、KV 或 Worker。使用 Git 集成时，构建命令留空，输出目录选项目根目录。

## 与 VPS 版的差异

- 文章/首页/关于/法律、导航、广告和主题可在本地编辑、刷新恢复，公开发布需要导出并部署。
- 默认主题含五种风格和深浅切换；用户本地主题优先于种子默认。
- 评论只有浏览器本地演示状态，不提供跨访客评论数据库或审核；不会进入公开导出。
- 会员等级与游客词库是公开展示配置；真实注册、会员账户、OAuth、广告 token 授权、YouTube 统计、AI 与字幕获取需要服务器，纯静态模式不会模拟成功。
- 广告授权面板明确停用，不能把可公开查看的静态 token 当成权限验证。公开广告内容仍可在广告配置中编辑。
- OAuth/用户配置面板提示在 VPS 端配置，静态站不收集 Client Secret 或模型密钥。

## 可选 VPS API

后台静态发布面板可填写 `https://api.example.com` 这样的 API 基址。地址仅存当前浏览器，不包含在导出中。请求会实际发送到 `基址/api/...`。不配置时会明确提示不可用；服务器错误会如实显示，不生成假数据。

受保护接口可通过同一面板的“登录可选 VPS API”取得真实 VPS 会话；该会话仅保存在 sessionStorage。VPS 需实现对应 Xblog 接口并允许当前 Pages Origin 的 CORS，以及 Authorization/Content-Type 请求头和预检。HTTPS Pages 应连接 HTTPS API。AI、模型、YouTube 与 OAuth 所需服务端密钥只在 VPS 配置。OAuth 回调及返回静态站的跳转由 VPS 提供；本包没有部署/验证生产 VPS，跨域 OAuth 兼容性需按所用 VPS 实现配置。

可选 API 不会自动接管本地编辑保存，也不会自动把本站 localStorage 上传到 VPS。需要持续的多人管理、真正受保护后台、OAuth 管理员登录或跨访客实时数据时使用完整 VPS 版。

## 验证范围

已用本机真实 Google Chrome + Playwright 经静态 HTTP 测试根路径和 `/repo/` 子路径：默认登录、首页保存刷新与公开渲染、可视化文章保存刷新与加粗渲染、所有后台面板、主题/深浅持久化、无 API 明确不可用、真实下载的公开导出脱敏，以及用导出文件替换种子在新浏览器中公开渲染。未发布真实 GitHub/Cloudflare 站点，未使用生产 VPS/第三方 OAuth/AI 凭据。


## 本次更新
自适应顶栏与后台布局；页面管理新增自定义页面（含公开导航）；编辑器支持图片/视频/附件上传、粘贴图片、按行列插入及删除表格；数据备份和登录配置使用单平台选择。AI创作接受任意公网视频/网页链接，抓取效果取决于网站限制，实际模型调用仍需凭据。
内嵌30首音乐，首页悬浮播放器支持随机播放、暂停、停止、选曲和自定义歌单。本地自定义音乐保存在浏览器IndexedDB，设置保存在localStorage；浏览器可能要求首次点击才允许播放。
VPS上传保存到data/uploads，需连同数据库一并备份。Pages图片/音视频可内嵌，附件需外链或后端，公开更新仍需导出重新部署。
