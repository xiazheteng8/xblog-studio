window.APP_STATE = {
  "themes": [
    {
      "id": "tech",
      "name": "Xblog 黑客绿 (默认)",
      "badge": "原汁原味",
      "desc": "延续技术博客硬核深色极简风，黑绿荧光终端，黑客代码雨与 CRT 扫描线专属启动。",
      "primary": "#b7f568",
      "bg": "#090d13",
      "card": "#10161f",
      "animName": "Matrix 扫描线启动"
    },
    {
      "id": "cyber",
      "name": "赛博朋克 2077 霓虹",
      "badge": "潮流冲击",
      "desc": "高对比青粉双色霓虹辉光，深邃暗紫背景，RGB 色散故障风专属跳转动效。",
      "primary": "#00f0ff",
      "secondary": "#ff007f",
      "bg": "#0c0714",
      "card": "#181028",
      "animName": "全息色彩抖动 (Glitch)"
    },
    {
      "id": "github",
      "name": "GitHub Dark 极客暗黑",
      "badge": "开发者首选",
      "desc": "经典 GitHub 暗色系，Octocat 极客代码折叠，优雅沉稳的 Commit 分支平滑展开动画。",
      "primary": "#58a6ff",
      "bg": "#0d1117",
      "card": "#161b22",
      "animName": "Git Commit 脉冲展开"
    },
    {
      "id": "notion",
      "name": "Notion 简约纸白",
      "badge": "清爽护眼",
      "desc": "米白色温润纸质质感，清晰排版，专属水墨墨晕淡入与轻质卡片翻页过渡效果。",
      "primary": "#2eaadc",
      "bg": "#f7f6f3",
      "card": "#ffffff",
      "animName": "水墨浸润 (Ink Bleed)"
    },
    {
      "id": "dracula",
      "name": "Dracula 德古拉暮光紫",
      "badge": "神秘优雅",
      "desc": "经典德古拉吸血鬼主题，天鹅绒暮光紫黑配合薄荷荧光，薄雾星芒专属微粒动效。",
      "primary": "#bd93f9",
      "secondary": "#50fa7b",
      "bg": "#282a36",
      "card": "#383a59",
      "animName": "德古拉暮光迷雾"
    }
  ],
  "memberLevels": {
    "guest": {
      "name": "游客",
      "desc": "未登录访客，享有全站文章阅读与评论权限",
      "badgeColor": "#94a3b8",
      "canComment": true
    },
    "member": {
      "name": "志同道合",
      "desc": "登录会员，尊享「志同道合」专属认证徽章与评论标识",
      "badgeColor": "#4ade80",
      "canComment": true
    },
    "admin": {
      "name": "站长 · 管理员",
      "desc": "博客创始人与超级管理员，拥有全站全部模块独立管理权限",
      "badgeColor": "#ffd700",
      "canComment": true
    }
  },
  "guestKeywords": {
    "prefixes": [
      "沉迷",
      "玩转",
      "优选",
      "解锁",
      "搭建",
      "编译",
      "精简",
      "折腾",
      "爆改",
      "研究",
      "秒开"
    ],
    "nouns": [
      "HyperOS",
      "8K节点",
      "黑苹果",
      "软路由",
      "SmartTV",
      "KernelSU",
      "Docker",
      "Magisk",
      "晶晨盒子",
      "CUPS打印",
      "OpenCore",
      "WLOC定位"
    ],
    "personas": [
      "折腾党",
      "极客",
      "老司机",
      "骇客",
      "工程师",
      "刷机狂",
      "发烧友",
      "极客猫",
      "技术宅",
      "极客虾"
    ],
    "avatarStyle": "bottts"
  },
  "settings": {
    "siteName": "Xblog",
    "siteSub": "静态博客示范",
    "adminUser": "admin",
    "currentTheme": "tech",
    "avatarUrl": "assets/gradient-dark.svg",
    "youtubeUrl": "https://www.youtube.com/",
    "tgUrl": "https://t.me/",
    "githubUrl": "https://github.com/",
    "emailContact": "hello@example.com"
  },
  "posts": [
    {
      "id": "demo-post",
      "title": "欢迎使用 Xblog Pages",
      "category": "系统管理",
      "date": "2026-11-01",
      "status": "published",
      "summary": "一个可在后台可视化编辑的示范文章。",
      "content": "<h2>开始写作</h2><p>打开后台，用 <strong>admin / password</strong> 登录，编辑后保存在本浏览器。</p><p>导出公开 data-seed.js 并重新部署后，所有访客才会看到更新。</p>",
      "contentFormat": "html",
      "tags": [
        "示范"
      ],
      "links": [],
      "youtubeId": "",
      "views": 0,
      "likes": 0,
      "displayConfig": {
        "contentFormat": "html",
        "coverType": "custom",
        "customCoverUrl": "assets/gradient-dark.svg",
        "topDisplayMode": "cover",
        "showLinks": true,
        "showToc": true,
        "showComments": true,
        "showAd": false
      }
    }
  ],
  "homeIntro": {
    "channelName": "Xblog",
    "handle": "@example",
    "badge": "PAGES DEMO",
    "slogan": "记录想法，分享知识",
    "bio": "这是纯静态示范站。编辑仅保存在当前浏览器；公开发布请导出并重新部署。",
    "stats": [
      {
        "num": "1",
        "label": "示范文章",
        "sub": "可视化编辑"
      },
      {
        "num": "静态",
        "label": "Pages 部署",
        "sub": "无需服务端"
      }
    ],
    "domains": [
      {
        "icon": "💡",
        "title": "技术笔记",
        "desc": "分享你的实践",
        "tags": [
          "教程"
        ]
      }
    ],
    "projects": [],
    "featuredPostIds": [
      "demo-post"
    ]
  },
  "ads": {
    "homeAd": {
      "enabled": false
    },
    "postAd": {
      "enabled": false
    },
    "bottomAd": {
      "enabled": false
    },
    "floatAd": {
      "enabled": false
    }
  },
  "comments": [],
  "adTokens": [],
  "users": [],
  "headerFooter": {
    "brandTitle": "Xblog",
    "brandBadge": "PAGES",
    "navHomeText": "首页",
    "navBlogText": "博客",
    "navAdminText": "后台",
    "youtubeUrl": "https://www.youtube.com/",
    "tgUrl": "https://t.me/",
    "githubUrl": "https://github.com/",
    "emailContact": "hello@example.com",
    "adsContactText": "联系站长",
    "adsContactUrl": "mailto:hello@example.com",
    "footerCopyright": "© 2026 Xblog · 静态博客示范",
    "footerLinks": []
  },
  "aboutPage": {
    "title": "关于 Xblog",
    "subtitle": "一个静态博客示范",
    "storyTitle": "我们的故事",
    "storyContent": "<p>在后台页面管理中填写你的故事。</p>",
    "contentFormat": "html",
    "milestones": [],
    "principles": []
  },
  "legalDocs": {
    "activeTab": "terms",
    "terms": {
      "title": "服务条款",
      "updated": "2026-11-01",
      "sections": [
        {
          "title": "示范说明",
          "content": "<p>请按实际站点情况编辑本页。本站本地编辑仅保存在当前浏览器。</p>"
        }
      ]
    },
    "privacy": {
      "title": "隐私政策",
      "updated": "2026-11-01",
      "sections": [
        {
          "title": "示范说明",
          "content": "<p>请按实际站点情况编辑本页。本站本地编辑仅保存在当前浏览器。</p>"
        }
      ]
    },
    "disclaimer": {
      "title": "免责声明",
      "updated": "2026-11-01",
      "sections": [
        {
          "title": "示范说明",
          "content": "<p>请按实际站点情况编辑本页。本站本地编辑仅保存在当前浏览器。</p>"
        }
      ]
    },
    "license": {
      "title": "开源许可",
      "updated": "2026-11-01",
      "sections": [
        {
          "title": "示范说明",
          "content": "<p>请按实际站点情况编辑本页。本站本地编辑仅保存在当前浏览器。</p>"
        }
      ]
    },
    "contentFormat": "html"
  }
};
