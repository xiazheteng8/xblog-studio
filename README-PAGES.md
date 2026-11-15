# 瞎折腾博客 · Pages 部署教程

[GitHub Pages 示范站点](https://xiazheteng8.github.io/xblog-studio/) · [VPS 示范站点](https://xiazheteng.fun/) · [YouTube @xiazheteng8](https://www.youtube.com/@xiazheteng8) · [Telegram @xiazheteng8](https://t.me/xiazheteng8)

[返回本地 / VPS 教程](README.md)

## 初始账号与密码

自己新部署时，后台入口为 /#admin，源码默认账号为 `admin`，默认密码为 `password`。首次登录后请立即修改密码，公网部署前确认新密码已生效。

## 1. 先把源码放到 GitHub

1. 登录 GitHub，打开 [新建仓库](https://github.com/new)。在 **Repository name** 填 `xblog-studio`。需要发布公开示范站点时，确认源码已清理，再选 **Public**。
2. 手头只有 ZIP 时，先解压。上传前逐项检查：源码、运行资源和公开测试样例可以提交；个人数据、真实名单、数据库、上传目录、各类备份、`.env` 和密钥保留在本机。
3. 安装 [Git](https://git-scm.com/downloads)，打开项目根目录的终端。空仓库页面会显示推送命令。首次使用时先配置 Git 提交姓名和邮箱，然后在项目目录按下列顺序运行。把仓库地址换成 GitHub 页面显示的 HTTPS 地址。

```text
git init -b main
git add .
git status --short
git commit -m "Initial source release"
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

看完 `git status --short` 的待提交名单，再执行提交。推送时按 Git 的提示登录。刷新仓库页面，确认能看到项目目录。

## 2. GitHub Pages 示范站点

1. 在 GitHub 仓库打开 **Settings → Pages**，把 **Source** 选为 **GitHub Actions**。
2. 打开 **Actions → Deploy GitHub Pages demo → Run workflow**，选择 **main** 并确认。仓库已带工作流，从 `site` 发布演示。
3. 等部署任务显示绿色勾，再回到 **Settings → Pages** 点击 **Visit site**。

[GitHub Pages 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 3. Cloudflare Pages

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)，打开 **Workers & Pages → Create application → Pages → Connect to Git**，授权 Cloudflare 访问你的仓库并选中它。
2. 生产分支填 `main`，项目根目录填 `site`，框架选择 **None**，构建命令留空，构建输出目录填 `.`。
3. 点击 **Save and Deploy**，部署完成后打开项目的 `pages.dev` 地址。

博客的静态版可浏览已导出的内容。后台通过浏览器保存的变更需要导出并重新部署；需要服务器数据库、登录和上传时，用 VPS 版。

[Cloudflare Pages 官方部署说明](https://developers.cloudflare.com/pages/get-started/git-integration/)
