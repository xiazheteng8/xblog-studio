# Xblog 纯净开源完整版

[VPS 示范站点](https://xiazheteng.fun/) · [YouTube @xiazheteng8](https://www.youtube.com/@xiazheteng8) · [Telegram @xiazheteng8](https://t.me/xiazheteng8)

第一次部署？先按 [本地 / VPS 新手教程](../README.md) 或 [GitHub / Cloudflare Pages 新手教程](../README-PAGES.md) 操作。下面是本目录的功能和配置参考。

默认账号 admin，默认密码 password；登录后请修改。仅保留一个示范页面，API/OAuth/AI均需自行配置。

Windows双击启动博客.bat，或 python server.py。访问 http://127.0.0.1:8080/#admin 。
视频抓取依赖：python -m pip install -r requirements.txt
Docker：docker compose up -d --build；默认仅绑定本机8080，公网请配置反向代理和HTTPS。

包含首页/关于/声明管理、富文本博文、主题、广告、会员、OAuth、YouTube统计、AI视频创作等同一套功能。真实外部功能需要对应凭据；密钥只放服务端。
保留data目录即可保留数据。


## 本次更新
自适应顶栏与后台布局；页面管理新增自定义页面（含公开导航）；编辑器支持图片/视频/附件上传、粘贴图片、按行列插入及删除表格；数据备份和登录配置使用单平台选择。AI创作接受任意公网视频/网页链接，抓取效果取决于网站限制，实际模型调用仍需凭据。
内嵌30首音乐，首页悬浮播放器支持随机播放、暂停、停止、选曲和自定义歌单。本地自定义音乐保存在浏览器IndexedDB，设置保存在localStorage；浏览器可能要求首次点击才允许播放。
VPS上传保存到data/uploads，需连同数据库一并备份。Pages图片/音视频可内嵌，附件需外链或后端，公开更新仍需导出重新部署。
