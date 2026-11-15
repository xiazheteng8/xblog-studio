# 瞎折腾博客

[GitHub Pages 示范站点](https://xiazheteng8.github.io/xblog-studio/) · [Cloudflare Pages 示范站点](https://xiazheteng-blog.pages.dev/) · [VPS 示范站点](https://xiazheteng.fun/) · [YouTube @xiazheteng8](https://www.youtube.com/@xiazheteng8) · [Telegram @xiazheteng8](https://t.me/xiazheteng8)

[跳到 GitHub Pages / Cloudflare Pages 教程](README-PAGES.md)

## 初始账号与密码

自己新部署时，后台入口为 /#admin，源码默认账号为 `admin`，默认密码为 `password`。首次登录后请立即修改密码，公网部署前确认新密码已生效。

## 1. 准备源码

如果你已经打开 GitHub 仓库，点绿色 **Code → Download ZIP**。下载后右键 ZIP → **全部解压缩**，打开含本 README 的文件夹。若命令要求进入某个文件夹，先打开它，再在资源管理器地址栏输入 `cmd` 并回车。命令在弹出的窗口里逐条输入，每次按回车。

## 2. 先在自己的电脑上试运行

需要 `python` 命令时，从 [Python 官网](https://www.python.org/downloads/) 安装，Windows 安装时勾选 **Add Python to PATH**。摇奖吧使用 [Node.js](https://nodejs.org/en/download)，安装后重新打开终端，输入 `node -v` 检查是否能显示版本号。

打开 `site` 文件夹，在该文件夹的终端运行 `python -m http.server 8080`，再打开 [本地博客](http://localhost:8080/)。想写文章、用后台或保存到数据库时，回到项目目录，打开 `server` 文件夹，双击 `启动博客.bat`，或运行 `python server.py`。打开 [本地后台](http://localhost:8080/#admin)。用包内说明提供的初始账号登录后，先改密码，再考虑公网开放。

## 3. 部署到自己的 VPS

VPS 是一台可从互联网访问的服务器。先在服务商面板确认公网 IP，通过面板的终端或 SSH 登录。把对应的源码目录上传到服务器。以下步骤中，项目若提供 `compose.yaml`，先在 VPS 安装 [Docker Engine 和 Compose 插件](https://docs.docker.com/engine/install/)，再执行项目命令。

进入 `server`，执行 `docker compose up -d --build`。用 `docker compose ps` 检查容器是否在运行。反向代理转到 `127.0.0.1:8080`。`data` 目录是数据库和上传内容的保存位置，升级前单独备份。

使用自己的域名时，在 DNS 控制台添加指向 VPS 公网 IP 的 A 记录。在网站面板添加同一个域名，按上一步设置静态根目录或反向代理，随后申请 HTTPS 证书。最后用手机流量打开自己的域名测试。若访问失败，先检查 DNS 是否指到这台 VPS，再检查服务器的 80、443 端口和网站配置。使用 Docker 时，可在项目目录运行 `docker compose logs --tail=50` 查看启动报错。
