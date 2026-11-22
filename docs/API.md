# 🔑 API 与第三方登录配置

[← 功能介绍](../README.md) · [部署教程](DEPLOY.md)

下列配置用于 **VPS 完整版**。所有真实密钥保留在服务端；静态 Pages 不提供安全的私密代理。可只用手动写文章，不配置任何外部 API。

## 1. 配置写在哪里？

服务端读取私密 `config.json`，也支持环境变量覆盖。Docker 使用配置文件时，按部署教程只读挂载 `/app/config.json`；修改后重建容器。

示例仅展示字段，不含真实密钥：

```json
{
  "siteUrl": "https://blog.example.com",
  "youtubeHandle": "@your-channel",
  "youtubeApiKey": "替换为自己的YouTubeKey",
  "aiProvider": "openai",
  "aiBaseUrl": "https://api.openai.com/v1",
  "aiModel": "填写账户实际可用的模型ID",
  "aiModelKey": "替换为自己的AIKey"
}
```

没有启用的功能可删除对应字段。`server/.env.example` 列出环境变量；应用不会自行加载 `.env`。

## 2. 📺 YouTube Data API v3

1. 进入 [Google Cloud Console](https://console.cloud.google.com/)，创建或选择项目。
2. 在 API 库启用 **YouTube Data API v3**。
3. 在凭据页面创建 API Key；API 限制选择 YouTube Data API v3。
4. 将 Key 写入 `youtubeApiKey`，将频道账号写入 `youtubeHandle`，例如 `@your-channel`。
5. 重启服务，检查频道与视频统计是否能更新。

环境变量对应 `YOUTUBE_API_KEY`。服务器调用时如配置来源限制，应选择适合服务端请求的限制方式，避免使用仅允许网页 Referer 的 Key 导致服务器请求被拒绝。

YouTube 播放器和统计 API 是不同能力；可播放视频不代表统计 Key 已生效。遇到失败，检查启用状态、配额、Key 限制与频道名称。

## 3. 🤖 AI 辅助创作

### OpenAI 兼容 API

在服务商控制台申请 Key，填写端点、模型 ID 和密钥。环境变量为：

```dotenv
AI_PROVIDER=openai
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=填写实际支持的模型ID
AI_MODEL_KEY=填写自己的Key
```

使用兼容服务时，地址填服务商给出的基础地址，一般截止 `/v1`，不要重复附加 `/chat/completions`。模型必须真实可用，有的模型不接受相同输入能力。

### Google Gemini 原生接口

代码支持 `aiProvider=gemini` 或 `google`；基础地址使用 `https://generativelanguage.googleapis.com/v1beta`，模型填写当前账户可用的 Gemini 模型 ID，Key 填入同一个 `aiModelKey` 字段。

申请入口：[Google AI Studio](https://aistudio.google.com/)。地区、权限与限额以账号实际显示为准。

### 视频 / 网页素材抓取

先安装 `server/requirements.txt` 中的依赖；Dockerfile 会安装随仓库声明的依赖。可提交公开视频或网页链接，能否抓取受网站限制与网络条件影响。AI 结果发布前应核对，避免将无法访问的来源当成已完整读取。

## 4. 👤 OAuth：Google / GitHub / QQ / 微信

注册各平台应用，申请对应网站登录能力，在服务端保存 Client Secret，并在后台登录配置中启用相应平台。

| 平台 | 环境变量前缀 | 固定回调路径 | 管理入口 |
| --- | --- | --- | --- |
| Google | `GOOGLE_` | `/api/auth/google/callback` | [Google Cloud](https://console.cloud.google.com/) |
| GitHub | `GITHUB_` | `/api/auth/github/callback` | [OAuth Apps](https://github.com/settings/developers) |
| QQ | `QQ_` | `/api/auth/qq/callback` | [QQ 互联](https://connect.qq.com/) |
| 微信 | `WECHAT_` | `/api/auth/wechat/callback` | [微信开放平台](https://open.weixin.qq.com/) |

每个平台使用 `CLIENT_ID`、`CLIENT_SECRET`、`ADMIN_IDENTIFIER`，例如 `GITHUB_CLIENT_ID`。申请能力需符合平台要求，个人账号并不一定具有所有平台的网站登录权限。

回调 URL 必须包含完整域名，例如 `https://blog.example.com/api/auth/github/callback`，并与 `SITE_URL` 及后台配置一致。

公开设置 `oauthConfig` 中填写 `enabled`、`clientId`、`callbackUrl`、`adminIdentifier`；Secret 保留在服务端私密配置，例如：

```json
{
  "siteUrl": "https://blog.example.com",
  "oauthConfig": {
    "github": {
      "enabled": true,
      "clientId": "你的应用ID",
      "clientSecret": "你的私密Secret",
      "callbackUrl": "https://blog.example.com/api/auth/github/callback",
      "adminIdentifier": "你的平台身份ID"
    }
  }
}
```

Google / GitHub 管理员标识可使用平台数字身份 ID 或已验证邮箱；QQ / 微信使用应用内 OpenID，不会自动按邮箱合并。先保留本地管理员登录作为恢复方式。OAuth 状态有效期和会话保存在内存，服务重启后可能需要重新登录。

## 5. 🔐 上线检查

- 默认管理员密码已更换，HTTP 已跳转 HTTPS。
- 私密 Key 没有出现在公开前端、导出包和 Git 提交中。
- 每个平台单独测试，不把展示按钮视为已经完成接口接入。
- 数据库与上传文件一起备份，保留私密配置的安全副本。

详细参数以 [服务端环境变量模板](../server/.env.example) 和 [集成代码](../server/integration.py) 为准。
