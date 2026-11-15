// 模块: 独立全功能后台管理中心 (admin.js)
// 满足核心原则：全站所有可见位置（导航、首页各模块、博客分类/标签、博文独立显示、四类广告位、金主对接、页脚与系统），在后台均有独立编辑入口！

let currentAdminTab = 'pageManager';
let editingPostId = null;

function renderAdminView() {
  const container = document.getElementById('admin-view');
  if (!container) return;

  const isLoggedIn = checkAdminAuth();
  if (!isLoggedIn) {
    renderAdminLogin();
    return;
  }

  container.innerHTML = `
    <div class="admin-shell">
      <div class="admin-sidebar">
        <div style="padding: 10px 12px; border-bottom: 1px solid var(--border); margin-bottom: 10px;">
          <div style="font-weight: 800; font-size: 1.05rem; color: var(--text-main);">CMS 全站控制台</div>
          <div style="font-size: 0.78rem; color: var(--accent); font-family: var(--font-mono);">@admin (Admin)</div>
        </div>
        <div class="admin-menu-item ${currentAdminTab === 'pageManager' ? 'active' : ''}" onclick="switchAdminTab('pageManager')" style="border-left: 3px solid var(--accent);">
          📄 页面管理 (首页显示/关于与声明)
        </div>
        <div class="admin-menu-item ${currentAdminTab === 'posts' ? 'active' : ''}" onclick="switchAdminTab('posts')">
          📑 博客文章管理
        </div>
        <div class="admin-menu-item ${currentAdminTab === 'categories' ? 'active' : ''}" onclick="switchAdminTab('categories')">
          🏷️ 博客分类与标签管理
        </div>
        <div class="admin-menu-item ${currentAdminTab === 'members' ? 'active' : ''}" onclick="switchAdminTab('members')">
          👥 会员等级与游客词库管理
        </div>
        <div class="admin-menu-item ${currentAdminTab === 'oauthUsers' ? 'active' : ''}" onclick="switchAdminTab('oauthUsers')">
          🌐 多平台用户与登录配置
        </div>
        <div class="admin-menu-item ${currentAdminTab === 'editor' ? 'active' : ''}" onclick="switchAdminTab('editor')">
          ✍️ 撰写与排版博文 (独立显示)
        </div>
        <div class="admin-menu-item ${currentAdminTab === 'ads' ? 'active' : ''}" onclick="switchAdminTab('ads')" style="border-left: 3px solid #ffd700;">
          📢 广告位监控与独立配置
        </div>
        <div class="admin-menu-item ${currentAdminTab === 'sponsorTokens' ? 'active' : ''}" onclick="switchAdminTab('sponsorTokens')">
          👑 金主 API 密钥与权限对接
        </div>
        <div class="admin-menu-item ${currentAdminTab === 'navFooter' ? 'active' : ''}" onclick="switchAdminTab('navFooter')">
          🧭 导航栏、页脚与社交图标
        </div>
        <div class="admin-menu-item ${currentAdminTab === 'themes' ? 'active' : ''}" onclick="switchAdminTab('themes')">
          🎨 主题风格与专属动效
        </div>
        <div class="admin-menu-item ${currentAdminTab === 'ai' ? 'active' : ''}" onclick="switchAdminTab('ai')">
          🤖 AI 自动创作与发布接口
        </div>
        <div class="admin-menu-item ${currentAdminTab === 'settings' ? 'active' : ''}" onclick="switchAdminTab('settings')">
          ⚙️ 账户密码与全量备份
        </div>
        <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--border);">
          <div class="admin-menu-item" onclick="handleAdminLogout()" style="color: #ef4444;">
            🚪 退出登录
          </div>
        </div>
      </div>

      <div class="admin-content" id="admin-subcontent">
        <!-- 子面板渲染挂载点 -->
      </div>
    </div>
  `;

  renderAdminSubTab();
}

function checkAdminAuth() {
  return sessionStorage.getItem('xzt_admin_logged') === 'true';
}

function renderAdminLogin() {
  const container = document.getElementById('admin-view');
  if (!container) return;
  container.innerHTML = `
    <div style="max-width: 440px; margin: 40px auto; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 32px; box-shadow: var(--shadow-card);">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="assets/gradient-light.svg" style="width: 56px; height: 56px; border-radius: 50%; border: 2px solid var(--accent); margin-bottom: 12px;" onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'">
        <h2 style="font-size: 1.45rem; font-weight: 800;">Xblog · 后台管理登录</h2>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">请输入管理员凭证以进入控制台</p>
      </div>

      <div class="form-group">
        <label class="form-label">管理员账号：</label>
        <input type="text" id="admin-user" class="form-input" autocomplete="username" placeholder="请输入管理员账号">
      </div>

      <div class="form-group">
        <label class="form-label">管理员密码：</label>
        <input type="password" id="admin-pass" class="form-input" autocomplete="current-password" placeholder="请输入密码">
      </div>

      <button class="btn-primary" style="width: 100%; margin-top: 10px;" onclick="handleAdminLoginSubmit()">立即登录控制台</button>


    </div>
  `;
}

function handleAdminLogout() {
  sessionStorage.removeItem('xzt_admin_logged');
  showToast('✓ 已退出后台登录', 'info');
  renderAdminView();
}

function switchAdminTab(tab) {
  currentAdminTab = tab;
  renderAdminView();
}

function renderAdminSubTab() {
  const wrap = document.getElementById('admin-subcontent');
  if (!wrap) return;

  switch (currentAdminTab) {
    case 'pageManager':
      renderAdminPagesManagerTab(wrap);
      break;
    case 'posts':
      renderAdminPostsTab(wrap);
      break;
    case 'categories':
      renderAdminCategoriesTab(wrap);
      break;
    case 'members':
      renderAdminMembersTab(wrap);
      break;
    case 'oauthUsers':
      renderAdminOAuthUsersTab(wrap);
      break;
    case 'editor':
      renderAdminEditorTab(wrap);
      break;
    case 'ads':
      renderAdminAdsTab(wrap);
      break;
    case 'sponsorTokens':
      renderAdminSponsorTokensTab(wrap);
      break;
    case 'navFooter':
      renderAdminNavFooterTab(wrap);
      break;
    case 'themes':
      renderAdminThemesTab(wrap);
      break;
    case 'ai':
      renderAdminAITab(wrap);
      break;
    case 'settings':
      renderAdminSettingsTab(wrap);
      break;
  }
}

/* ================= 1. 首页全部可见内容编辑 (支持主创、数据、四大领域、原创项目、精选) ================= */
function renderAdminHomeIntroTab(wrap) {
  const intro = window.APP_STATE.homeIntro || {};
  const settings = window.APP_STATE.settings || {};
  const stats = intro.stats || [
    { num: "10,000+", label: "YouTube 订阅伙伴", sub: "真实折腾党拥趸" },
    { num: "1,000,000+", label: "全网累计播放", sub: "多篇数万播放爆款教程" },
    { num: "28 篇", label: "深度原创图文知识库", sub: "GitHub README 规范" },
    { num: "100%", label: "纯粹免费开源", sub: "零套路、零玄学、拒绝割韭菜" }
  ];
  const domains = intro.domains || [];
  const projects = intro.projects || [];

  wrap.innerHTML = `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 1.55rem; font-weight: 800;">🏠 首页全部可见内容综合编辑</h2>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">
            全站首页的所有可见元素（主创信息、四大核心数据、四大探索领域、原创开源项目专栏与精选教程）均可在此独立修改。
          </p>
        </div>
        <a href="#home" class="btn-secondary" target="_blank" style="text-decoration: none;">在新窗口预览首页 ↗</a>
      </div>

      <!-- 板块 1: 主创与频道横幅资料 -->
      <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 22px; margin-bottom: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--accent); margin-bottom: 14px;">
          1. 频道与主创基础信息
        </h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">频道/博主名称：</label>
            <input type="text" id="intro-name" class="form-input" value="${escapeHtml(intro.channelName || 'Xblog')}">
          </div>
          <div class="form-group">
            <label class="form-label">YouTube 账号 Handle：</label>
            <input type="text" id="intro-handle" class="form-input" value="${escapeHtml(intro.handle || '@admin')}">
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">认证徽章文字：</label>
            <input type="text" id="intro-badge" class="form-input" value="${escapeHtml(intro.badge || 'YOUTUBE 认证极客创作者')}">
          </div>
          <div class="form-group">
            <label class="form-label">核心 Slogan 标语：</label>
            <input type="text" id="intro-slogan" class="form-input" value="${escapeHtml(intro.slogan || '分享折腾过程中的乐趣 · 硬核极客技术探索')}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">个人与频道深度介绍正文 (Bio)：</label>
          <textarea id="intro-bio" class="form-textarea" rows="4">${escapeHtml(intro.bio || '')}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">博主头像 URL：</label>
          <input type="text" id="intro-avatar" class="form-input" value="${escapeHtml(settings.avatarUrl || 'assets/gradient-light.svg')}">
        </div>
      </div>

      <!-- 板块 2: 四项核心数据指标编辑 -->
      <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 22px; margin-bottom: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--accent); margin-bottom: 14px;">
          2. 首页四大核心数据展示项
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">
          ${stats.map((st, idx) => `
            <div style="background: var(--bg-card); padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border);">
              <label class="form-label" style="font-size: 0.8rem; margin-bottom: 4px;">数据项 ${idx + 1}：数字</label>
              <input type="text" id="stat-num-${idx}" class="form-input" value="${escapeHtml(st.num)}" style="font-weight: 700; color: var(--accent);">
              <label class="form-label" style="font-size: 0.8rem; margin: 8px 0 4px;">主标题</label>
              <input type="text" id="stat-label-${idx}" class="form-input" value="${escapeHtml(st.label)}">
              <label class="form-label" style="font-size: 0.8rem; margin: 8px 0 4px;">副标题说明</label>
              <input type="text" id="stat-sub-${idx}" class="form-input" value="${escapeHtml(st.sub || '')}">
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 板块 3: 四大探索领域编辑 -->
      <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 22px; margin-bottom: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--accent); margin-bottom: 14px;">
          3. 首页四大技术探索领域卡片
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
          ${domains.map((dm, idx) => `
            <div style="background: var(--bg-card); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--border);">
              <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <input type="text" id="domain-icon-${idx}" class="form-input" value="${escapeHtml(dm.icon)}" style="width: 50px; text-align: center; font-size: 1.2rem;">
                <input type="text" id="domain-title-${idx}" class="form-input" value="${escapeHtml(dm.title)}" style="font-weight: 700;">
              </div>
              <textarea id="domain-desc-${idx}" class="form-textarea" rows="3" style="font-size: 0.85rem; margin-bottom: 8px;">${escapeHtml(dm.desc)}</textarea>
              <label class="form-label" style="font-size: 0.78rem;">标签列表 (逗号分隔)：</label>
              <input type="text" id="domain-tags-${idx}" class="form-input" value="${escapeHtml((dm.tags || []).join(', '))}" style="font-size: 0.8rem;">
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 板块 4: 代表性原创开源项目 (只放自己的，已过滤fork) -->
      <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 22px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--accent);">
            4. 代表性原创开源项目专栏 (仅限原创自研)
          </h3>
          <span style="font-size: 0.8rem; color: var(--text-dim);">严格展示作者独立自研项目</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
          ${projects.map((pr, idx) => `
            <div style="background: var(--bg-card); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--border);">
              <div class="form-group">
                <label class="form-label" style="font-size: 0.82rem;">项目名称：</label>
                <input type="text" id="proj-name-${idx}" class="form-input" value="${escapeHtml(pr.name)}" style="font-weight: 700;">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size: 0.82rem;">原创徽章标签：</label>
                <input type="text" id="proj-badge-${idx}" class="form-input" value="${escapeHtml(pr.badge)}">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size: 0.82rem;">项目简介：</label>
                <textarea id="proj-desc-${idx}" class="form-textarea" rows="3" style="font-size: 0.85rem;">${escapeHtml(pr.desc)}</textarea>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>
                  <label class="form-label" style="font-size: 0.82rem;">按钮文案：</label>
                  <input type="text" id="proj-btn-${idx}" class="form-input" value="${escapeHtml(pr.linkText || '查看开源仓库 ↗')}">
                </div>
                <div>
                  <label class="form-label" style="font-size: 0.82rem;">项目网址 (URL)：</label>
                  <input type="url" id="proj-url-${idx}" class="form-input" value="${escapeHtml(pr.linkUrl)}">
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 板块 5: 首页重点推荐教程 ID -->
      <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 22px; margin-bottom: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--accent); margin-bottom: 14px;">
          5. 首页热门精选教程 ID 列表
        </h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">
          在此指定要在首页下方直接展示的精选博文 ID（以英文逗号分隔）：
        </p>
        <input type="text" id="intro-featured-ids" class="form-input" value="${(intro.featuredPostIds || []).join(', ')}" placeholder="vid-cf-edge-8k, vid-android-tv-adb, vid-dockge-compose">
      </div>

      <div style="display: flex; gap: 14px; margin-top: 24px;">
        <button class="btn-primary" style="padding: 12px 28px; font-size: 1rem;" onclick="saveComprehensiveHomeIntro()">💾 保存全站首页所有可见内容</button>
        <a href="#home" class="btn-secondary" target="_blank" style="text-decoration: none; display: inline-flex; align-items: center;">在新窗口打开首页验证 ↗</a>
      </div>
    </div>
  `;
}

async function saveComprehensiveHomeIntro() {
  const intro = window.APP_STATE.homeIntro || {};
  const channelName = document.getElementById('intro-name')?.value.trim();
  const handle = document.getElementById('intro-handle')?.value.trim();
  const badge = document.getElementById('intro-badge')?.value.trim();
  const slogan = document.getElementById('intro-slogan')?.value.trim();
  const bio = document.getElementById('intro-bio')?.value.trim();
  const avatarUrl = document.getElementById('intro-avatar')?.value.trim();

  // Stats
  const stats = [];
  for (let i = 0; i < 4; i++) {
    stats.push({
      num: document.getElementById(`stat-num-${i}`)?.value.trim() || '',
      label: document.getElementById(`stat-label-${i}`)?.value.trim() || '',
      sub: document.getElementById(`stat-sub-${i}`)?.value.trim() || ''
    });
  }

  // Domains
  const domains = (intro.domains || []).map((dm, i) => {
    const icon = document.getElementById(`domain-icon-${i}`)?.value.trim() || dm.icon;
    const title = document.getElementById(`domain-title-${i}`)?.value.trim() || dm.title;
    const desc = document.getElementById(`domain-desc-${i}`)?.value.trim() || dm.desc;
    const tagsStr = document.getElementById(`domain-tags-${i}`)?.value.trim() || '';
    const tags = tagsStr.split(',').map(s => s.trim()).filter(Boolean);
    return { ...dm, icon, title, desc, tags };
  });

  // Projects
  const projects = (intro.projects || []).map((pr, i) => {
    const name = document.getElementById(`proj-name-${i}`)?.value.trim() || pr.name;
    const pbadge = document.getElementById(`proj-badge-${i}`)?.value.trim() || pr.badge;
    const desc = document.getElementById(`proj-desc-${i}`)?.value.trim() || pr.desc;
    const linkText = document.getElementById(`proj-btn-${i}`)?.value.trim() || pr.linkText;
    const linkUrl = document.getElementById(`proj-url-${i}`)?.value.trim() || pr.linkUrl;
    return { name, badge: pbadge, desc, linkText, linkUrl };
  });

  // Featured IDs
  const idsStr = document.getElementById('intro-featured-ids')?.value.trim() || '';
  const featuredPostIds = idsStr.split(',').map(s => s.trim()).filter(Boolean);

  window.APP_STATE.homeIntro = {
    ...intro,
    channelName,
    handle,
    badge,
    slogan,
    bio,
    stats,
    domains,
    projects,
    featuredPostIds
  };

  if (avatarUrl) {
    if (!window.APP_STATE.settings) window.APP_STATE.settings = {};
    window.APP_STATE.settings.avatarUrl = avatarUrl;

  }


  if (!await persistAdminChanges()) return;
  showToast('✓ 首页所有可见位置内容已全部成功保存！', 'success');
}

/* ================= 2. 导航栏、页脚与社交图标全部可见配置 ================= */
function renderAdminNavFooterTab(wrap) {
  const hf = window.APP_STATE.headerFooter || {};
  const s = window.APP_STATE.settings || {};

  wrap.innerHTML = `
    <div>
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 1.55rem; font-weight: 800;">🧭 导航栏、页脚与官方社交渠道配置</h2>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">
          在此独立管理博客顶部导航的所有文字与右上角 5 大官方渠道图标，以及页面底部的版权与链接。
        </p>
      </div>

      <!-- 顶部导航品牌与标签文字 -->
      <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 22px; margin-bottom: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--accent); margin-bottom: 14px;">
          1. 顶部导航栏可见文字配置
        </h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">导航左侧品牌名：</label>
            <input type="text" id="hf-brand-title" class="form-input" value="${escapeHtml(hf.brandTitle || 'Xblog')}">
          </div>
          <div class="form-group">
            <label class="form-label">品牌角标徽章：</label>
            <input type="text" id="hf-brand-badge" class="form-input" value="${escapeHtml(hf.brandBadge || 'PRO TECH')}">
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">标签 1 文字：</label>
            <input type="text" id="hf-nav-home" class="form-input" value="${escapeHtml(hf.navHomeText || '首页')}">
          </div>
          <div class="form-group">
            <label class="form-label">标签 2 文字：</label>
            <input type="text" id="hf-nav-blog" class="form-input" value="${escapeHtml(hf.navBlogText || '博客')}">
          </div>
          <div class="form-group">
            <label class="form-label">标签 3 文字：</label>
            <input type="text" id="hf-nav-admin" class="form-input" value="${escapeHtml(hf.navAdminText || '后台')}">
          </div>
        </div>
      </div>

      <!-- 右上角 5 大官方社交渠道与商务入口 -->
      <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 22px; margin-bottom: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--accent); margin-bottom: 14px;">
          2. 右上角官方矩阵与商务洽谈链接
        </h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">YouTube 图标链接 (目标指向 @admin)：</label>
            <input type="url" id="hf-yt-url" class="form-input" value="${escapeHtml(hf.youtubeUrl || s.youtubeUrl || '#')}">
          </div>
          <div class="form-group">
            <label class="form-label">Telegram (TG) 交流群链接：</label>
            <input type="url" id="hf-tg-url" class="form-input" value="${escapeHtml(hf.tgUrl || s.tgUrl || '#')}">
          </div>
          <div class="form-group">
            <label class="form-label">GitHub 开源主页链接：</label>
            <input type="url" id="hf-gh-url" class="form-input" value="${escapeHtml(hf.githubUrl || s.githubUrl || '#')}">
          </div>
          <div class="form-group">
            <label class="form-label">官方邮件地址 (Mailto)：</label>
            <input type="email" id="hf-mail" class="form-input" value="${escapeHtml(hf.emailContact || s.emailContact || 'contact@example.com')}">
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="form-group">
            <label class="form-label">商务洽谈金色按钮显示文字：</label>
            <input type="text" id="hf-ads-text" class="form-input" value="${escapeHtml(hf.adsContactText || 'ads洽谈')}">
          </div>
          <div class="form-group">
            <label class="form-label">商务洽谈电报链接 (指向 @yourname)：</label>
            <input type="text" id="hf-ads-url" class="form-input" value="${escapeHtml(hf.adsContactUrl || '#')}">
          </div>
        </div>
      </div>

      <!-- 页脚版权与链接 -->
      <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 22px; margin-bottom: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--accent); margin-bottom: 14px;">
          3. 页面底部 (Footer) 版权声明与链接
        </h3>
        <div class="form-group">
          <label class="form-label">页脚版权声明文字：</label>
          <input type="text" id="hf-footer-copy" class="form-input" value="${escapeHtml(hf.footerCopyright || '© 2026 Xblog · 极客动态博客 CMS · 开源发布')}">
        </div>
      </div>

      <div style="display: flex; gap: 14px; margin-top: 24px;">
        <button class="btn-primary" style="padding: 12px 28px; font-size: 1rem;" onclick="saveNavFooterSettings()">💾 保存导航栏与页脚设置</button>
        <a href="#home" class="btn-secondary" target="_blank" style="text-decoration: none;">在新窗口预览导航 ↗</a>
      </div>
    </div>
  `;
}

async function saveNavFooterSettings() {
  const brandTitle = document.getElementById('hf-brand-title')?.value.trim() || 'Xblog';
  const brandBadge = document.getElementById('hf-brand-badge')?.value.trim() || 'PRO TECH';
  const navHomeText = document.getElementById('hf-nav-home')?.value.trim() || '首页';
  const navBlogText = document.getElementById('hf-nav-blog')?.value.trim() || '博客';
  const navAdminText = document.getElementById('hf-nav-admin')?.value.trim() || '后台';

  const youtubeUrl = document.getElementById('hf-yt-url')?.value.trim() || '#';
  const tgUrl = document.getElementById('hf-tg-url')?.value.trim() || '#';
  const githubUrl = document.getElementById('hf-gh-url')?.value.trim() || '#';
  const emailContact = document.getElementById('hf-mail')?.value.trim() || 'contact@example.com';
  const adsContactText = document.getElementById('hf-ads-text')?.value.trim() || 'ads洽谈';
  const adsContactUrl = document.getElementById('hf-ads-url')?.value.trim() || '#';

  const footerCopyright = document.getElementById('hf-footer-copy')?.value.trim() || '© 2026 Xblog · 极客动态博客 CMS · 开源发布';

  window.APP_STATE.headerFooter = {
    brandTitle,
    brandBadge,
    navHomeText,
    navBlogText,
    navAdminText,
    youtubeUrl,
    tgUrl,
    githubUrl,
    emailContact,
    adsContactText,
    adsContactUrl,
    footerCopyright
  };

  // 同步更新 settings
  if (!window.APP_STATE.settings) window.APP_STATE.settings = {};
  window.APP_STATE.settings.youtubeUrl = youtubeUrl;
  window.APP_STATE.settings.tgUrl = tgUrl;
  window.APP_STATE.settings.githubUrl = githubUrl;
  window.APP_STATE.settings.emailContact = emailContact;


  if (!await persistAdminChanges()) return;
  // 刷新当前页面导航与页脚
  if (typeof updateHeaderFooterDOM === 'function') {
    updateHeaderFooterDOM();
  }

  showToast('✓ 导航栏与页脚配置已成功更新并生效！', 'success');
}

/* ================= 3. 博客分类与标签管理 ================= */
function renderAdminCategoriesTab(wrap) {
  const posts = window.APP_STATE.posts || [];
  
  const catCounts = {};
  const tagCounts = {};
  posts.forEach(p => {
    const c = p.category || '综合折腾';
    catCounts[c] = (catCounts[c] || 0) + 1;
    (p.tags || []).forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  (window.APP_STATE.categories || []).forEach(name => { if (!(name in catCounts)) catCounts[name] = 0; });
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  wrap.innerHTML = `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 1.55rem; font-weight: 800;">🏷️ 博客分类与自动标签管理</h2>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">
            全站现收录 28 篇真实博文，系统已自动提炼 ${Object.keys(catCounts).length} 个核心分类与 ${sortedTags.length} 个技术标签。
          </p>
        </div>
        <button class="btn-primary" onclick="openAddCategoryModal()">+ 新增分类</button>
      </div>

      <!-- 分类统计网格 -->
      <h3 style="font-size: 1.15rem; font-weight: 700; margin: 20px 0 12px;">现有分类统计</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 28px;">
        ${Object.entries(catCounts).map(([catName, count]) => `
          <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: var(--text-main); font-size: 0.95rem;">${escapeHtml(catName)}</strong>
            <span class="badge" style="background: var(--badge-bg); color: var(--accent); padding: 3px 8px; border-radius: 12px; font-weight: 700;">
              ${count} 篇
            </span>
          </div>
        `).join('')}
      </div>

      <!-- 自动生成的标签云 -->
      <h3 style="font-size: 1.15rem; font-weight: 700; margin: 24px 0 12px;">自动提取的全局标签云 (${sortedTags.length} 个)</h3>
      <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 20px; max-height: 280px; overflow-y: auto;">
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${sortedTags.map(([tagName, count]) => `
            <span style="display: inline-flex; align-items: center; gap: 5px; background: var(--bg-card); border: 1px solid var(--border); padding: 4px 10px; border-radius: 16px; font-size: 0.82rem; color: var(--text-muted);">
              <strong>${escapeHtml(tagName)}</strong>
              <small style="color: var(--accent); font-family: var(--font-mono);">${count}</small>
            </span>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function openAddCategoryModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.id = 'add-cat-modal';
  modal.innerHTML = `
    <div class="modal-box" style="max-width: 440px;">
      <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 12px;">新增博客分类</h3>
      <div class="form-group">
        <label class="form-label">分类名称：</label>
        <input type="text" id="new-cat-name" class="form-input" placeholder="例如：嵌入式开发 / 软路由进阶">
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
        <button class="btn-secondary" onclick="document.getElementById('add-cat-modal').remove()">取消</button>
        <button class="btn-primary" onclick="submitNewCategory()">确定添加</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function submitNewCategory() {
  const name = document.getElementById('new-cat-name')?.value.trim();
  if (!name) {
    showToast('请输入分类名称！', 'error');
    return;
  }
  window.APP_STATE.categories = [...new Set([...(window.APP_STATE.categories || []), name])];
  if (!await persistAdminChanges()) return;
  document.getElementById('add-cat-modal').remove();
  showToast(`✓ 分类「${name}」已新增，撰写博文时即可选用！`, 'success');
  renderAdminSubTab();
}

/* ================= 4. 撰写与排版博文 (独立显示、YouTube封面默认、外链多条配置) ================= */
function renderAdminEditorTab(wrap) {
  let post = {
    title: '',
    summary: '',
    youtubeId: '',
    category: '系统管理',
    tags: ['系统管理', '教程'],
    content: '',
    links: [],
    displayConfig: {
      coverType: 'youtube',
      customCoverUrl: '',
      topDisplayMode: 'player',
      showLinks: true,
      showToc: true,
      showComments: true,
      showAd: true
    }
  };

  if (editingPostId) {
    const found = window.APP_STATE.posts.find(p => p.id === editingPostId);
    if (found) {
      post = { ...found };
      if (!post.displayConfig) {
        post.displayConfig = {
          coverType: 'youtube',
          customCoverUrl: '',
          topDisplayMode: 'player',
          showLinks: true,
          showToc: true,
          showComments: true,
          showAd: true
        };
      }
    }
  }

  const dc = post.displayConfig;
  const isYtCover = dc.coverType !== 'custom';
  const ytId = post.youtubeId || '';
  const currentCoverPreview = isYtCover 
    ? (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80')
    : (dc.customCoverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80');

  wrap.innerHTML = `
    <div>
      <h2 style="font-size: 1.55rem; font-weight: 800; margin-bottom: 20px;">
        ${editingPostId ? '✏️ 编辑博文' : '✍️ 撰写新博文'}
      </h2>

      <div class="form-group">
        <label class="form-label">博文标题：</label>
        <input type="text" id="post-title" class="form-input" value="${escapeHtml(post.title)}" placeholder="例如：Docker Compose 容器编排实战指南...">
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div class="form-group">
          <label class="form-label">YouTube 视频 ID (默认自动提取封面并在详情页嵌入播放器)：</label>
          <input type="text" id="post-yt" class="form-input" value="${escapeHtml(post.youtubeId)}" placeholder="例如：ixCvDTtUQsM" oninput="updateEditorCoverPreview()">
        </div>
        <div class="form-group">
          <label class="form-label">所属分类：</label>
          <select id="post-cat" class="form-select">
            <option value="系统管理" ${post.category === '系统管理' ? 'selected' : ''}>系统管理</option>
            <option value="手机刷机与Root模块" ${post.category === '手机刷机与Root模块' ? 'selected' : ''}>手机刷机与Root模块</option>
            <option value="安卓TV与机顶盒" ${post.category === '安卓TV与机顶盒' ? 'selected' : ''}>安卓TV与机顶盒</option>
            <option value="网络技术" ${post.category === '网络技术' ? 'selected' : ''}>网络技术</option>
            <option value="AI与智能服务" ${post.category === 'AI与智能服务' ? 'selected' : ''}>AI与智能服务</option>
            <option value="黑苹果与PC硬件" ${post.category === '黑苹果与PC硬件' ? 'selected' : ''}>黑苹果与PC硬件</option>
            <option value="iOS与苹果生态" ${post.category === 'iOS与苹果生态' ? 'selected' : ''}>iOS与苹果生态</option>
            <option value="频道动态与原创项目" ${post.category === '频道动态与原创项目' ? 'selected' : ''}>频道动态与原创项目</option>
          </select>
        </div>
      </div>

      <!-- 核心：博文显示页面独立配置面板 -->
      <div style="background: var(--bg-secondary); border: 1px solid var(--accent); border-radius: var(--radius-md); padding: 20px; margin: 20px 0;">
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--accent); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          ⚙️ 博文显示页面独立高级设置 (专属定制)
        </h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 18px;">
          每篇博文均可独立设置其在详情页与列表页的封面图来源、顶部媒体展示形式与功能模块开关。
        </p>

        <!-- 封面图设置 (默认使用 YouTube 视频高清封面) -->
        <div style="display: grid; grid-template-columns: 1fr 180px; gap: 20px; align-items: center; margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid var(--border);">
          <div>
            <label class="form-label" style="font-weight: 700;">封面图模式设置 (默认使用 YouTube 视频高清封面)：</label>
            <div style="display: flex; gap: 18px; margin: 8px 0 12px;">
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="radio" name="cover-type" value="youtube" ${isYtCover ? 'checked' : ''} onchange="toggleCoverTypeInput()">
                <strong>默认使用 YouTube 视频封面图</strong>
              </label>
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="radio" name="cover-type" value="custom" ${!isYtCover ? 'checked' : ''} onchange="toggleCoverTypeInput()">
                自定义上传/外链图片
              </label>
            </div>
            <div id="custom-cover-wrap" style="display: ${isYtCover ? 'none' : 'block'};">
              <input type="url" id="post-custom-cover" class="form-input" value="${escapeHtml(dc.customCoverUrl || '')}" placeholder="https://..." oninput="updateEditorCoverPreview()">
            </div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 4px; text-align: center;">实时封面预览</div>
            <div style="width: 180px; aspect-ratio: 16/9; border-radius: 6px; overflow: hidden; background: #000; border: 1px solid var(--border);">
              <img id="editor-cover-preview" src="${currentCoverPreview}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
          </div>
        </div>

        <!-- 顶部展示形式与组件开关 -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px;">
          <div>
            <label class="form-label" style="font-weight: 700;">详情页顶部媒体展示方式：</label>
            <select id="post-top-mode" class="form-select">
              <option value="player" ${dc.topDisplayMode === 'player' ? 'selected' : ''}>📺 仅嵌入 YouTube 原生播放器 (默认极客模式)</option>
              <option value="cover_and_player" ${dc.topDisplayMode === 'cover_and_player' ? 'selected' : ''}>🖼️ 顶部封面大图 + 视频播放器 (杂志模式)</option>
              <option value="cover_only" ${dc.topDisplayMode === 'cover_only' ? 'selected' : ''}>📄 仅展示封面大图 (纯图文模式)</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="font-weight: 700;">本篇博文专属功能开关：</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 0.85rem; cursor: pointer;">
                <input type="checkbox" id="post-chk-links" ${dc.showLinks !== false ? 'checked' : ''}> 官方外链面板
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 0.85rem; cursor: pointer;">
                <input type="checkbox" id="post-chk-toc" ${dc.showToc !== false ? 'checked' : ''}> 文章目录导读 (TOC)
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 0.85rem; cursor: pointer;">
                <input type="checkbox" id="post-chk-comments" ${dc.showComments !== false ? 'checked' : ''}> 读者交流评论区
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 0.85rem; cursor: pointer;">
                <input type="checkbox" id="post-chk-ad" ${dc.showAd !== false ? 'checked' : ''}> 内嵌赞助商广告
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">文章标签 (以逗号分隔，如：系统管理, Docker, 运维)：</label>
        <input type="text" id="post-tags-input" class="form-input" value="${escapeHtml((post.tags || []).join(', '))}" placeholder="系统管理, Docker, 运维">
      </div>

      <div class="form-group">
        <label class="form-label">简短摘要 (用于卡片与 SEO)：</label>
        <input type="text" id="post-summary" class="form-input" value="${escapeHtml(post.summary)}" placeholder="一两句话概括文章核心内容...">
      </div>

      <div class="form-group">
        <label class="form-label">可视化正文：</label>
        <textarea id="post-content" class="form-textarea" rows="14" style="font-family: var(--font-mono); font-size: 0.9rem;">${escapeHtml(post.content)}</textarea>
      </div>

      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button class="btn-primary" style="flex: 1;" onclick="saveCurrentPost()">💾 保存博文设置并发布</button>
        <button class="btn-secondary" onclick="currentAdminTab='posts'; renderAdminView();">返回文章列表</button>
      </div>
    </div>
  `;
  const categorySelect = document.getElementById('post-cat');
  if (categorySelect) [...new Set([...(window.APP_STATE.categories || []), ...(window.APP_STATE.posts || []).map(post => post.category), post.category])].filter(Boolean).forEach(category => { if (![...categorySelect.options].some(option => option.value === category)) categorySelect.add(new Option(category, category)); });
  const linksPanel = document.createElement('div');
  linksPanel.id = 'cms-post-links';
  const linksSource = post.externalLinks || post.links || [];
  linksPanel.innerHTML = `<fieldset><legend>文章资源链接</legend><div id="cms-post-link-rows">${linksSource.map(link => cmsPostLinkRow(link)).join('')}</div><button type="button" class="btn-secondary" id="cms-add-post-link">+ 添加链接</button></fieldset>`;
  document.getElementById('post-content')?.parentElement.before(linksPanel);
  linksPanel.querySelector('#cms-add-post-link').addEventListener('click', () => linksPanel.querySelector('#cms-post-link-rows').insertAdjacentHTML('beforeend', cmsPostLinkRow({})));
  linksPanel.addEventListener('click', event => { if (event.target.matches('[data-remove-post-link]')) event.target.closest('.cms-post-link-row').remove(); });
  if (window.CMSEditor) window.CMSEditor.mount('post-content', {content: post.content, format: post.contentFormat || post.displayConfig?.contentFormat});
}

function toggleCoverTypeInput() {
  const isCustom = document.querySelector('input[name="cover-type"]:checked')?.value === 'custom';
  const wrap = document.getElementById('custom-cover-wrap');
  if (wrap) wrap.style.display = isCustom ? 'block' : 'none';
  updateEditorCoverPreview();
}

function updateEditorCoverPreview() {
  const isCustom = document.querySelector('input[name="cover-type"]:checked')?.value === 'custom';
  const preview = document.getElementById('editor-cover-preview');
  if (!preview) return;

  if (isCustom) {
    const customUrl = document.getElementById('post-custom-cover')?.value.trim();
    preview.src = customUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80';
  } else {
    const ytId = document.getElementById('post-yt')?.value.trim();
    preview.src = ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80';
  }
}

function cmsPostLinkRow(link) { return `<div class="cms-post-link-row cms-list-row"><input class="form-input" data-link-title placeholder="链接名称" value="${escapeHtml(link.title||'')}"><input class="form-input" type="url" data-link-url placeholder="https://..." value="${escapeHtml(link.url||'')}"><button type="button" class="btn-danger" data-remove-post-link>删除链接</button></div>`; }
async function saveCurrentPost() {
  const title = document.getElementById('post-title')?.value.trim();
  if (!title) {
    showToast('请输入博文标题！', 'error');
    return;
  }

  const youtubeId = document.getElementById('post-yt')?.value.trim();
  const category = document.getElementById('post-cat')?.value;
  const tagsStr = document.getElementById('post-tags-input')?.value.trim() || '';
  const tags = tagsStr.split(',').map(s => s.trim()).filter(Boolean);
  const summary = document.getElementById('post-summary')?.value.trim();
  const contentNode = document.getElementById('post-content');
  const content = contentNode?.cmsEditor ? contentNode.cmsEditor.getHTML() : contentNode?.value || '';

  // 采集独立显示配置
  const coverType = document.querySelector('input[name="cover-type"]:checked')?.value || 'youtube';
  const customCoverUrl = document.getElementById('post-custom-cover')?.value.trim() || '';
  const topDisplayMode = document.getElementById('post-top-mode')?.value || 'player';
  const showLinks = Boolean(document.getElementById('post-chk-links')?.checked);
  const showToc = Boolean(document.getElementById('post-chk-toc')?.checked);
  const showComments = Boolean(document.getElementById('post-chk-comments')?.checked);
  const showAd = Boolean(document.getElementById('post-chk-ad')?.checked);

  const displayConfig = {
    contentFormat: 'html',
    coverType,
    customCoverUrl,
    topDisplayMode,
    showLinks,
    showToc,
    showComments,
    showAd
  };

  const externalLinks = [...(document.querySelectorAll?.('.cms-post-link-row') || [])].map(row => ({title:row.querySelector('[data-link-title]').value.trim(),url:row.querySelector('[data-link-url]').value.trim()})).filter(link => link.url);
  if (editingPostId) {
    const p = window.APP_STATE.posts.find(x => x.id === editingPostId);
    if (p) {
      p.title = title;
      p.youtubeId = youtubeId;
      p.category = category;
      p.tags = tags;
      p.summary = summary;
      p.content = content;
      p.contentFormat = 'html';
      p.displayConfig = displayConfig;
      p.links = externalLinks;
      p.externalLinks = externalLinks;
    }
  } else {
    const newPost = {
      id: 'vid-post-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8),
      title,
      youtubeId,
      category,
      tags,
      summary,
      content,
      contentFormat: 'html',
      displayConfig,
      date: new Date().toISOString().split('T')[0],
      views: '1',
      links: externalLinks.length ? externalLinks : cmsGeneratedDraft?.externalLinks || [],
      externalLinks: externalLinks.length ? externalLinks : cmsGeneratedDraft?.externalLinks || []
    };
    window.APP_STATE.posts.unshift(newPost);
    editingPostId = newPost.id;
  }


  if (!await persistAdminChanges()) return;
  showToast('✓ 博文与独立显示设置已保存成功！', 'success');
  currentAdminTab = 'posts';
  editingPostId = null;
  cmsGeneratedDraft = null;
  renderAdminView();
}

/* ================= 5. 广告位监控与独立编辑 (4类广告位) ================= */
function renderAdminAdsTab(wrap) {
  const ads = window.APP_STATE.ads || {};
  const homeAd = ads.homeAd || {};
  const postAd = ads.postAd || {};
  const bottomAd = ads.bottomAd || {};
  const floatAd = ads.floatAd || {};

  const homeActive = isAdActive(homeAd);
  const postActive = isAdActive(postAd);
  const bottomActive = isAdActive(bottomAd);
  const floatActive = isAdActive(floatAd);

  wrap.innerHTML = `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 1.55rem; font-weight: 800;">📢 广告位运行监控与独立管理</h2>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">
            四类广告位单独控制。<strong>空闲时前端彻底隐藏不占位</strong>，填入内容后优雅展示。
          </p>
        </div>
        <button class="btn-primary" onclick="switchAdminTab('sponsorTokens')" style="background: #ffd700; color: #000;">
          👑 进入金主 API 授权中心 ↗
        </button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 18px; margin-bottom: 32px;">
        <!-- 首页广告位 -->
        <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="font-size: 1rem;">首页顶部广告位 (homeAd)</strong>
            <span class="ad-status-pill ${homeActive ? 'active' : 'idle'}">
              ${homeActive ? '🟢 线上投放中' : '⚪ 空闲 (前端已隐藏)'}
            </span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">
            标题：${escapeHtml(homeAd.title || '（当前为空闲隐藏）')}
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-secondary" style="font-size: 0.82rem; padding: 6px 12px;" onclick="openEditAdModal('homeAd')">编辑配置</button>
            <button class="btn-danger" style="font-size: 0.82rem; padding: 6px 12px;" onclick="adminClearAdSlot('homeAd')">清空并隐藏</button>
          </div>
        </div>

        <!-- 指定博文广告位 -->
        <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="font-size: 1rem;">指定博文内嵌广告位 (postAd)</strong>
            <span class="ad-status-pill ${postActive ? 'active' : 'idle'}">
              ${postActive ? '🟢 线上投放中' : '⚪ 空闲 (前端已隐藏)'}
            </span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">
            标题：${escapeHtml(postAd.title || '（当前为空闲隐藏）')}
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-secondary" style="font-size: 0.82rem; padding: 6px 12px;" onclick="openEditAdModal('postAd')">编辑配置</button>
            <button class="btn-danger" style="font-size: 0.82rem; padding: 6px 12px;" onclick="adminClearAdSlot('postAd')">清空并隐藏</button>
          </div>
        </div>

        <!-- 页面底部广告位 -->
        <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="font-size: 1rem;">页面底部横幅广告位 (bottomAd)</strong>
            <span class="ad-status-pill ${bottomActive ? 'active' : 'idle'}">
              ${bottomActive ? '🟢 线上投放中' : '⚪ 空闲 (前端已隐藏)'}
            </span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">
            标题：${escapeHtml(bottomAd.title || '（当前为空闲隐藏）')}
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-secondary" style="font-size: 0.82rem; padding: 6px 12px;" onclick="openEditAdModal('bottomAd')">编辑配置</button>
            <button class="btn-danger" style="font-size: 0.82rem; padding: 6px 12px;" onclick="adminClearAdSlot('bottomAd')">清空并隐藏</button>
          </div>
        </div>

        <!-- 右下浮动广告位 -->
        <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="font-size: 1rem;">右下角浮动广告位 (floatAd)</strong>
            <span class="ad-status-pill ${floatActive ? 'active' : 'idle'}">
              ${floatActive ? '🟢 线上投放中' : '⚪ 空闲 (前端已隐藏)'}
            </span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">
            标题：${escapeHtml(floatAd.title || '（当前为空闲隐藏）')}
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-secondary" style="font-size: 0.82rem; padding: 6px 12px;" onclick="openEditAdModal('floatAd')">编辑配置</button>
            <button class="btn-danger" style="font-size: 0.82rem; padding: 6px 12px;" onclick="adminClearAdSlot('floatAd')">清空并隐藏</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function openEditAdModal(slotKey) {
  const ad = (window.APP_STATE.ads && window.APP_STATE.ads[slotKey]) || {};
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.id = 'edit-ad-modal';
  modal.innerHTML = `
    <div class="modal-box">
      <h3 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 16px;">
        编辑广告位：${SLOT_LABELS[slotKey]}
      </h3>

      <div class="form-group">
        <label class="form-label">广告标题 (留空则代表空闲并自动隐藏)：</label>
        <input type="text" id="admin-ad-title" class="form-input" value="${escapeHtml(ad.title || '')}">
      </div>

      <div class="form-group">
        <label class="form-label">广告文案说明：</label>
        <textarea id="admin-ad-desc" class="form-textarea" rows="3">${escapeHtml(ad.desc || '')}</textarea>
      </div>

      <div class="form-group">
        <label class="form-label">目标链接 (URL)：</label>
        <input type="url" id="admin-ad-url" class="form-input" value="${escapeHtml(ad.linkUrl || '')}">
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label class="form-label">按钮文字：</label>
          <input type="text" id="admin-ad-btn" class="form-input" value="${escapeHtml(ad.linkText || '立即了解 ↗')}">
        </div>
        <div class="form-group">
          <label class="form-label">角标标签：</label>
          <input type="text" id="admin-ad-badge" class="form-input" value="${escapeHtml(ad.badge || 'SPONSOR')}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">自定义 HTML (可选)：</label>
        <textarea id="admin-ad-html" class="form-textarea" rows="2">${escapeHtml(ad.customHtml || '')}</textarea>
      </div>

      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button class="btn-primary" style="flex: 1;" onclick="submitAdminEditAd('${slotKey}')">保存更改</button>
        <button class="btn-secondary" onclick="document.getElementById('edit-ad-modal').remove()">取消</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function submitAdminEditAd(slotKey) {
  const title = document.getElementById('admin-ad-title')?.value.trim();
  const desc = document.getElementById('admin-ad-desc')?.value.trim();
  const linkUrl = document.getElementById('admin-ad-url')?.value.trim();
  const linkText = document.getElementById('admin-ad-btn')?.value.trim();
  const badge = document.getElementById('admin-ad-badge')?.value.trim();
  const customHtml = document.getElementById('admin-ad-html')?.value.trim();

  if (!window.APP_STATE.ads) window.APP_STATE.ads = {};
  window.APP_STATE.ads[slotKey] = {
    ...window.APP_STATE.ads[slotKey],
    enabled: true,
    title,
    desc,
    linkUrl,
    linkText,
    badge,
    customHtml,
    updatedAt: new Date().toISOString()
  };


  if (!await persistAdminChanges()) return;
  renderAllAds(window.APP_STATE.ads);
  document.getElementById('edit-ad-modal').remove();
  renderAdminSubTab();
  showToast(`✓ 【${SLOT_LABELS[slotKey]}】配置已更新！`, 'success');
}

function adminClearAdSlot(slotKey) {
  showConfirmModal(
    '确认清空广告位',
    `确定要清空【${SLOT_LABELS[slotKey]}】并置为空闲吗？<br>清空后该广告位将从博客前端彻底隐藏，不显示任何空白区域。`,
    async () => {
      if (!window.APP_STATE.ads) window.APP_STATE.ads = {};
      window.APP_STATE.ads[slotKey] = {
        enabled: false,
        title: '',
        desc: '',
        linkUrl: '',
        linkText: '',
        badge: '',
        customHtml: '',
        imageUrl: '',
        impressions: 0,
        clicks: 0
      };

      if (!await persistAdminChanges()) return;
      renderAllAds(window.APP_STATE.ads);
      showToast(`✓ 【${SLOT_LABELS[slotKey]}】已成功清空并置为空闲状态！`, 'info');
      renderAdminSubTab();
    }
  );
}

/* ================= 6. 金主 API 与授权管理 ================= */
function renderAdminSponsorTokensTab(wrap) {
  const tokens = window.APP_STATE.adTokens || [];
  wrap.innerHTML = `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 1.55rem; font-weight: 800;">👑 金主专属 API 密钥与授权管理</h2>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">
            为广告赞助商生成专属 API Key 并勾选允许配置的位置。复制专属链接发给金主，金主自主配置。
          </p>
        </div>
        <button class="btn-primary" onclick="openCreateAdTokenModal()" style="background: #ffd700; color: #000;">
          + 生成新金主 API 密钥
        </button>
      </div>

      <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem; text-align: left;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border); background: var(--bg-card);">
              <th style="padding: 12px 16px;">金主名称</th>
              <th style="padding: 12px 16px;">授权广告位置</th>
              <th style="padding: 12px 16px;">专属 API Key</th>
              <th style="padding: 12px 16px;">有效期</th>
              <th style="padding: 12px 16px;">操作</th>
            </tr>
          </thead>
          <tbody>
            ${tokens.map(t => {
              const slotsText = t.allowedSlots.map(s => `<span class="badge" style="font-size:0.75rem; background:rgba(255,215,0,0.15); color:#ffd700; border:1px solid #ffd700; padding:2px 6px; border-radius:4px; margin-right:4px;">${SLOT_LABELS[s] || s}</span>`).join('');
              return `
                <tr style="border-bottom: 1px solid var(--border);">
                  <td style="padding: 12px 16px; font-weight: 700; color: var(--text-main);">${escapeHtml(t.name)}</td>
                  <td style="padding: 12px 16px;">${slotsText}</td>
                  <td style="padding: 12px 16px;"><code style="color: var(--accent); font-family: var(--font-mono);">${escapeHtml(t.token)}</code></td>
                  <td style="padding: 12px 16px; color: var(--text-muted);">${escapeHtml(t.expireAt || '永久有效')}</td>
                  <td style="padding: 12px 16px;">
                    <div style="display: flex; gap: 8px;">
                      <button class="btn-secondary" style="font-size: 0.78rem; padding: 4px 8px;" onclick="copySponsorLink('${escapeHtml(t.token)}')">📋 复制专属对接链接</button>
                      <button class="btn-secondary" style="font-size: 0.78rem; padding: 4px 8px;" onclick="window.open('#sponsor?key=${escapeHtml(t.token)}', '_blank')">在新窗口打开金主页 ↗</button>
                      <button class="btn-danger" style="font-size: 0.78rem; padding: 4px 8px;" onclick="revokeSponsorToken('${escapeHtml(t.token)}')">撤销</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function copySponsorLink(token) {
  const url = window.location.origin + window.location.pathname + '#sponsor?key=' + token;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      showToast(`✓ 已复制金主专属对接链接到剪贴板！<br><span style="font-size:0.75rem;word-break:break-all;">${url}</span>`, 'success');
    }).catch(() => {
      showLinkDisplayModal('金主专属配置直达链接', url);
    });
  } else {
    showLinkDisplayModal('金主专属配置直达链接', url);
  }
}

function revokeSponsorToken(token) {
  showConfirmModal(
    '确认撤销 API 密钥',
    `确定要撤销该 API 密钥 (${token}) 吗？撤销后对方将无法继续访问专属金主配置页。`,
    async () => {
      window.APP_STATE.adTokens = (window.APP_STATE.adTokens || []).filter(t => t.token !== token);

      if (!await persistAdminChanges()) return;
      showToast(`✓ API 密钥 ${token} 已成功撤销！`, 'info');
      renderAdminSubTab();
    }
  );
}

function openCreateAdTokenModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.id = 'create-token-modal';
  modal.innerHTML = `
    <div class="modal-box">
      <h3 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 12px; color: #ffd700;">
        👑 生成金主爸爸专属 API Key 与权限配置
      </h3>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px;">
        为广告赞助商生成专属 API 密钥，并勾选允许其自主修改的广告位置。生成后可一键复制专属对接链接发给赞助商。
      </p>

      <div class="form-group">
        <label class="form-label">金主 / 赞助商名称：</label>
        <input type="text" id="new-token-name" class="form-input" placeholder="例如：示范赞助商">
      </div>

      <div class="form-group">
        <label class="form-label">勾选授权其自主配置的广告位置 (支持多选)：</label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; background: var(--bg-secondary); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border);">
            <input type="checkbox" id="slot-chk-home" checked> 首页顶部广告位
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; background: var(--bg-secondary); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border);">
            <input type="checkbox" id="slot-chk-post" checked> 指定博文广告位
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; background: var(--bg-secondary); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border);">
            <input type="checkbox" id="slot-chk-bottom"> 页面底部横幅位
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; background: var(--bg-secondary); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border);">
            <input type="checkbox" id="slot-chk-float"> 右下角浮窗广告位
          </label>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">有效期截止时间：</label>
        <select id="new-token-expire" class="form-select">
          <option value="2027-12-31">1 年有效 (至 2027-12-31)</option>
          <option value="2027-06-30">半年有效 (至 2027-06-30)</option>
          <option value="2026-12-31">短期有效 (至 2026-12-31)</option>
          <option value="永久有效">长期永久有效</option>
        </select>
      </div>

      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button class="btn-primary" style="flex: 1; background: #ffd700; color: #000;" onclick="submitNewAdToken()">立即生成 API Key</button>
        <button class="btn-secondary" onclick="document.getElementById('create-token-modal').remove()">取消</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function submitNewAdToken() {
  const name = document.getElementById('new-token-name')?.value.trim();
  if (!name) {
    showToast('请输入金主名称！', 'error');
    return;
  }

  const allowedSlots = [];
  if (document.getElementById('slot-chk-home')?.checked) allowedSlots.push('homeAd');
  if (document.getElementById('slot-chk-post')?.checked) allowedSlots.push('postAd');
  if (document.getElementById('slot-chk-bottom')?.checked) allowedSlots.push('bottomAd');
  if (document.getElementById('slot-chk-float')?.checked) allowedSlots.push('floatAd');

  if (allowedSlots.length === 0) {
    showToast('请至少勾选一个授权的广告位置！', 'error');
    return;
  }

  const expireAt = document.getElementById('new-token-expire')?.value || '永久有效';
  const token = 'SPON_' + Math.random().toString(36).substring(2, 10).toUpperCase();

  const newTokenObj = {
    token,
    name,
    allowedSlots,
    expireAt,
    createdAt: new Date().toISOString().split('T')[0],
    active: true
  };

  if (!window.APP_STATE.adTokens) window.APP_STATE.adTokens = [];
  window.APP_STATE.adTokens.push(newTokenObj);


  if (!await persistAdminChanges()) return;
  document.getElementById('create-token-modal').remove();
  renderAdminSubTab();

  const shareLink = window.location.origin + window.location.pathname + '#sponsor?key=' + token;
  showLinkDisplayModal(`🎉 金主专属 API 密钥生成成功！`, shareLink);
}

/* ================= 7. 主题风格中心 ================= */
function renderAdminThemesTab(wrap) {
  const currentTheme = (window.APP_STATE.settings && window.APP_STATE.settings.currentTheme) || 'tech';
  const themes = window.APP_STATE.themes || [];

  wrap.innerHTML = `
    <div>
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 1.55rem; font-weight: 800;">🎨 主题风格中心</h2>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">
          内置 5 套高端科技与极简主题。每个主题均拥有<strong>独立专属的启动动画、色彩脉冲与页面跳转过渡效果</strong>。
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
        ${themes.map(th => {
          const isSelected = th.id === currentTheme;
          return `
            <div style="background: var(--bg-secondary); border: 2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}; border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main);">${escapeHtml(th.name)}</h3>
                  <span class="badge" style="background: ${th.primary}22; color: ${th.primary}; border: 1px solid ${th.primary}; font-size: 0.75rem; padding: 2px 8px; border-radius: 4px;">
                    ${escapeHtml(th.badge)}
                  </span>
                </div>
                <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 14px;">
                  ${escapeHtml(th.desc)}
                </p>
                <div style="background: var(--bg-card); border-radius: 6px; padding: 10px; margin-bottom: 16px; font-size: 0.82rem;">
                  <span style="color: var(--text-dim);">专属动效：</span>
                  <strong style="color: ${th.primary}; font-family: var(--font-mono);">${escapeHtml(th.animName)}</strong>
                </div>
              </div>
              <button class="${isSelected ? 'btn-primary' : 'btn-secondary'}" style="width: 100%;" onclick="applySiteTheme('${th.id}')">
                ${isSelected ? '✓ 当前正在使用的主题' : '切换为此主题并演示动效 ↗'}
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

async function applySiteTheme(themeId) {
  document.body.setAttribute('data-theme', themeId);
  if (!window.APP_STATE.settings) window.APP_STATE.settings = {};
  window.APP_STATE.settings.currentTheme = themeId;


  if (!await persistAdminChanges()) return;
  triggerThemeAnimation();
  renderAdminSubTab();
  showToast(`✓ 主题已切换为 ${themeId} 并触发专属动效`, 'info');
}

function triggerThemeAnimation() {
  const curtain = document.getElementById('theme-transition-curtain');
  if (!curtain) return;
  curtain.classList.remove('animating');
  void curtain.offsetWidth;
  curtain.classList.add('animating');
  setTimeout(() => {
    curtain.classList.remove('animating');
  }, 400);
}

/* ================= 8. AI 创作开放接口 ================= */
/* ================= 9. 博客文章列表管理 ================= */
function renderAdminPostsTab(wrap) {
  const posts = window.APP_STATE.posts || [];
  wrap.innerHTML = `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="font-size: 1.55rem; font-weight: 800;">📑 博客文章列表 (${posts.length} 篇)</h2>
        <button class="btn-primary" onclick="currentAdminTab='editor'; editingPostId=null; renderAdminView();">+ 撰写新博文</button>
      </div>

      <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem; text-align: left;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border); background: var(--bg-card);">
              <th style="padding: 12px 16px;">博文标题</th>
              <th style="padding: 12px 16px;">分类</th>
              <th style="padding: 12px 16px;">发布日期</th>
              <th style="padding: 12px 16px;">YouTube 视频</th>
              <th style="padding: 12px 16px;">操作</th>
            </tr>
          </thead>
          <tbody>
            ${posts.map(p => `
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 12px 16px; font-weight: 600; max-width: 360px;">
                  <a href="#post?id=${p.id}" target="_blank" style="color: var(--text-main); text-decoration: none;">${escapeHtml(p.title)} ↗</a>
                </td>
                <td style="padding: 12px 16px;"><span class="badge" style="background: var(--badge-bg); color: var(--accent); padding: 2px 6px; border-radius: 4px;">${escapeHtml(p.category || '综合')}</span></td>
                <td style="padding: 12px 16px; color: var(--text-muted);">${escapeHtml(p.date || '')}</td>
                <td style="padding: 12px 16px;"><code style="font-family: var(--font-mono); color: var(--accent);">${escapeHtml(p.youtubeId || '-')}</code></td>
                <td style="padding: 12px 16px;">
                  <div style="display: flex; gap: 8px;">
                    <button class="btn-secondary" style="font-size: 0.78rem; padding: 4px 8px;" onclick="editPost('${p.id}')">编辑</button>
                    <button class="btn-danger" style="font-size: 0.78rem; padding: 4px 8px;" onclick="deletePost('${p.id}')">删除</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function editPost(id) {
  editingPostId = id;
  currentAdminTab = 'editor';
  renderAdminView();
}

function deletePost(id) {
  showConfirmModal('确认删除博文', '确定要删除这篇博文吗？删除后博文将从列表移除。', async () => {
    window.APP_STATE.posts = window.APP_STATE.posts.filter(p => p.id !== id);

    if (!await persistAdminChanges()) return;
    showToast('✓ 博文已删除', 'info');
    renderAdminSubTab();
  });
}

/* ================= 10. 系统设置与全量备份 ================= */
function exportDataBackup() {
  const data = JSON.stringify(window.APP_STATE, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `xiazhetengba-full-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  showToast('✓ 已导出全量数据备份文件！', 'info');
}

/* ================= 会员等级与游客随机词库管理 ================= */
function renderAdminMembersTab(wrap) {
  const levels = window.APP_STATE.memberLevels || {
    guest: { name: "游客", canComment: true },
    member: { name: "志同道合", canComment: true },
    admin: { name: "站长 · 管理员", canComment: true }
  };
  const gk = window.APP_STATE.guestKeywords || {
    prefixes: ["沉迷", "玩转", "优选", "解锁", "搭建", "编译", "精简", "折腾", "爆改", "研究", "秒开"],
    nouns: ["HyperOS", "8K节点", "黑苹果", "软路由", "SmartTV", "KernelSU", "Docker", "Magisk", "晶晨盒子", "CUPS打印", "OpenCore", "WLOC定位"],
    personas: ["折腾党", "极客", "老司机", "骇客", "工程师", "刷机狂", "发烧友", "极客猫", "技术宅", "极客虾"],
    avatarStyle: "bottts"
  };

  wrap.innerHTML = `
    <div>
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 1.55rem; font-weight: 800;">👥 会员等级与游客昵称词库管理</h2>
        <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">
          在此独立配置站点的会员等级名称、评论权限以及非登录状态下游客自动随机生成的「xxx的xxx」主题词库与头像来源。
        </p>
      </div>

      <!-- 等级设置 -->
      <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 22px; margin-bottom: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--accent); margin-bottom: 14px;">
          1. 站点会员等级名称与权限配置
        </h3>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          <!-- 站长 -->
          <div style="background: var(--bg-card); padding: 16px; border-radius: var(--radius-sm); border: 1px solid #ffd700;">
            <div style="color: #ffd700; font-weight: 700; margin-bottom: 8px;">👑 管理员等级</div>
            <div class="form-group">
              <label class="form-label" style="font-size: 0.8rem;">显示等级名称：</label>
              <input type="text" id="lvl-admin-name" class="form-input" value="${escapeHtml(levels.admin?.name || '站长 · 管理员')}">
            </div>
            <div style="font-size: 0.8rem; color: var(--text-dim);">拥有全站所有模块的单独管理与发布权限</div>
          </div>

          <!-- 志同道合 -->
          <div style="background: var(--bg-card); padding: 16px; border-radius: var(--radius-sm); border: 1px solid #4ade80;">
            <div style="color: #4ade80; font-weight: 700; margin-bottom: 8px;">🟢 登录会员等级</div>
            <div class="form-group">
              <label class="form-label" style="font-size: 0.8rem;">显示等级名称：</label>
              <input type="text" id="lvl-member-name" class="form-input" value="${escapeHtml(levels.member?.name || '志同道合')}">
            </div>
            <div style="font-size: 0.8rem; color: var(--text-dim);">非管理员账号登录后身份，左上角显示此等级，拥有独立认证评论权限</div>
          </div>

          <!-- 游客 -->
          <div style="background: var(--bg-card); padding: 16px; border-radius: var(--radius-sm); border: 1px solid #94a3b8;">
            <div style="color: #94a3b8; font-weight: 700; margin-bottom: 8px;">⚪ 非登录访客等级</div>
            <div class="form-group">
              <label class="form-label" style="font-size: 0.8rem;">显示等级名称：</label>
              <input type="text" id="lvl-guest-name" class="form-input" value="${escapeHtml(levels.guest?.name || '游客')}">
            </div>
            <div style="font-size: 0.8rem; color: var(--text-dim);">未登录用户默认等级，可免登录发表评论，系统自动派发专属随机昵称</div>
          </div>
        </div>
      </div>

      <!-- 游客随机昵称与头像词库 -->
      <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 22px; margin-bottom: 24px;">
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--accent); margin-bottom: 8px;">
          2. 游客专属随机昵称生成词库 (xxx的xxx 格式)
        </h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
          当游客进入博文发表评论时，系统自动从以下词库拼接生成与「Xblog」主题高度相关的极客昵称（例如：<strong>玩转HyperOS的极客</strong>、<strong>搭建软路由的老司机</strong>）。
        </p>

        <div class="form-group">
          <label class="form-label">前缀动词池 (以逗号分隔)：</label>
          <input type="text" id="gk-prefixes" class="form-input" value="${escapeHtml(gk.prefixes.join(', '))}">
        </div>

        <div class="form-group">
          <label class="form-label">核心主题名词池 (以逗号分隔)：</label>
          <input type="text" id="gk-nouns" class="form-input" value="${escapeHtml(gk.nouns.join(', '))}">
        </div>

        <div class="form-group">
          <label class="form-label">身份角色人设池 (以逗号分隔)：</label>
          <input type="text" id="gk-personas" class="form-input" value="${escapeHtml(gk.personas.join(', '))}">
        </div>

        <div class="form-group">
          <label class="form-label">游客免费随机头像风格源 (基于开源 DiceBear API)：</label>
          <select id="gk-avatar-style" class="form-select">
            <option value="bottts" ${gk.avatarStyle === 'bottts' ? 'selected' : ''}>🤖 Bottts 极客机器人风格 (推荐)</option>
            <option value="identicon" ${gk.avatarStyle === 'identicon' ? 'selected' : ''}>🔷 Identicon 极客几何抽象</option>
            <option value="avataaars" ${gk.avatarStyle === 'avataaars' ? 'selected' : ''}>🧑 Avataaars 趣味卡通头像</option>
          </select>
        </div>
      </div>

      <div style="display: flex; gap: 14px; margin-top: 24px;">
        <button class="btn-primary" style="padding: 12px 28px; font-size: 1rem;" onclick="saveMemberLevelsAndKeywords()">💾 保存会员等级与游客词库设置</button>
      </div>
    </div>
  `;
}

async function saveMemberLevelsAndKeywords() {
  const adminName = document.getElementById('lvl-admin-name')?.value.trim() || '站长 · 管理员';
  const memberName = document.getElementById('lvl-member-name')?.value.trim() || '志同道合';
  const guestName = document.getElementById('lvl-guest-name')?.value.trim() || '游客';

  const prefStr = document.getElementById('gk-prefixes')?.value.trim() || '';
  const nounsStr = document.getElementById('gk-nouns')?.value.trim() || '';
  const persStr = document.getElementById('gk-personas')?.value.trim() || '';
  const avatarStyle = document.getElementById('gk-avatar-style')?.value || 'bottts';

  window.APP_STATE.memberLevels = {
    guest: { name: guestName, canComment: true, badgeColor: '#94a3b8' },
    member: { name: memberName, canComment: true, badgeColor: '#4ade80' },
    admin: { name: adminName, canComment: true, badgeColor: '#ffd700' }
  };

  window.APP_STATE.guestKeywords = {
    prefixes: prefStr.split(',').map(s => s.trim()).filter(Boolean),
    nouns: nounsStr.split(',').map(s => s.trim()).filter(Boolean),
    personas: persStr.split(',').map(s => s.trim()).filter(Boolean),
    avatarStyle
  };


  if (!await persistAdminChanges()) return;
  if (typeof updateTopUserBadge === 'function') {
    updateTopUserBadge();
  }

  showToast('✓ 会员等级与游客随机词库已成功保存！', 'success');
}

/* ================= 多平台用户与登录配置 (Google / GitHub / QQ / 微信) ================= */
/* Durable administration and schema-driven, human-readable page forms. */
async function persistAdminChanges() {
  try {
    if (typeof window.persistCMSState !== 'function') throw new Error('保存服务尚未就绪，请刷新后重试');
    await window.persistCMSState();
    return true;
  } catch (error) { showToast('保存失败：' + escapeHtml(error.message), 'error'); return false; }
}
const cmsPageLabels = {homeIntro:'首页',aboutPage:'关于我们',legalDocs:'法律声明'};
const cmsFieldLabels = {blogButtonText:'博客按钮文字',youtubeButtonText:'YouTube按钮文字',telegramButtonText:'Telegram按钮文字',domainsTitle:'探索领域标题',domainsDescription:'探索领域说明',projectsTitle:'原创项目标题',projectsDescription:'原创项目说明',featuredTitle:'精选教程标题',featuredDescription:'精选教程说明',channelName:'频道名称',handle:'频道账号',badge:'徽章',slogan:'标语',bio:'频道介绍',stats:'数据指标',num:'数字',label:'标题',sub:'说明',domains:'探索领域',icon:'图标',title:'标题',desc:'介绍',tags:'标签',projects:'原创项目',name:'名称',linkText:'按钮文字',linkUrl:'链接地址',featuredPostIds:'精选文章',subtitle:'副标题',storyTitle:'故事标题',storyContent:'站长故事',principles:'创作原则',milestones:'大事记',year:'年份',event:'事件',terms:'服务条款',privacy:'隐私政策',disclaimer:'免责声明',license:'开源许可',sections:'章节',content:'正文',updated:'更新日期'};
const cmsPageDefaults = {
 homeIntro:{blogButtonText:'进入全部博客教程库 ↗',youtubeButtonText:'订阅 YouTube',telegramButtonText:'加入 Telegram 交流群',domainsTitle:'🧭 核心技术探索领域',domainsDescription:'覆盖系统管理、安卓玩机、电视大屏与网络架构的原创知识体系',projectsTitle:'⭐ 代表性原创开源项目',projectsDescription:'长期维护的原创开源神器与折腾工具',featuredTitle:'🔥 热门精选实操教程',featuredDescription:'点击教程卡片打开图文与视频播放器',channelName:'Xblog',handle:'@admin',badge:'PRO CREATOR',slogan:'分享折腾过程中的乐趣',bio:'',stats:[],domains:[],projects:[],featuredPostIds:[]},
 aboutPage:{title:'关于「Xblog」与站长故事',subtitle:'YouTube: @admin',storyTitle:'我们的技术初心',storyContent:'',principles:[],milestones:[]},
 legalDocs:Object.fromEntries(['terms','privacy','disclaimer','license'].map(key=>[key,{title:cmsFieldLabels[key],updated:new Date().toISOString().slice(0,10),sections:[]}]))
};
const cmsListDefaults = {stats:{num:'',label:'',sub:''},domains:{icon:'💡',title:'',desc:'',tags:[]},projects:{name:'',badge:'',desc:'',linkText:'了解更多',linkUrl:''},principles:{title:'',desc:''},milestones:{year:'',event:''},sections:{title:'',content:''}};
let cmsPageDraft = null;
let cmsRichFields = new Set();
let cmsPageKey = 'homeIntro';
function cmsField(path, value) {
  const key=path[path.length-1];const id='cms-field-'+path.join('-');const label=cmsFieldLabels[key] || key;
  if(Array.isArray(value)) {
    if(['tags','featuredPostIds'].includes(key)) {
      if(key==='featuredPostIds') return `<fieldset><legend>精选文章</legend>${(window.APP_STATE.posts||[]).map(post=>`<label class="cms-choice"><input type="checkbox" data-cms-featured="${escapeHtml(post.id)}" ${value.includes(post.id)?'checked':''}>${escapeHtml(post.title)}</label>`).join('')}</fieldset>`;
      return `<label class="form-label" for="${id}">${label}（逗号分隔）</label><input class="form-input" id="${id}" data-cms-path="${escapeHtml(JSON.stringify(path))}" data-cms-array="true" value="${escapeHtml(value.join(', '))}">`;
    }
    return `<fieldset><legend>${label}</legend>${value.map((row,index)=>`<div class="cms-list-row">${cmsField([...path,index],row)}<button type="button" class="btn-danger" data-cms-remove="${escapeHtml(JSON.stringify([...path,index]))}">删除此项</button></div>`).join('')}<button type="button" class="btn-secondary" data-cms-add="${escapeHtml(JSON.stringify(path))}">+ 添加${label}</button></fieldset>`;
  }
  if(value && typeof value==='object')return Object.entries(value).filter(([key])=>!['contentFormat','displayConfig'].includes(key)).map(([key,child])=>cmsField([...path,key],child)).join('');
  const multiline=['bio','desc','storyContent','content','event'].includes(key);
  return `<div class="form-group"><label class="form-label" for="${id}">${label}</label>${multiline?`<textarea class="form-textarea" rows="4" id="${id}" data-cms-path="${escapeHtml(JSON.stringify(path))}" ${['storyContent','content'].includes(key)?'data-cms-rich="true"':''}>${escapeHtml(value??'')}</textarea>`:`<input class="form-input" id="${id}" data-cms-path="${escapeHtml(JSON.stringify(path))}" value="${escapeHtml(value??'')}">`}</div>`;
}
function cmsSetPath(object,path,value) { let parent=object;path.slice(0,-1).forEach(key=>parent=parent[key]);parent[path[path.length-1]]=value; }
function collectCMSPageDraft() {
 const avatar=document.getElementById('cms-home-avatar');if(avatar)(window.APP_STATE.settings ||= {}).avatarUrl=avatar.value.trim();
 document.querySelectorAll('[data-cms-path]').forEach(input=>{const path=JSON.parse(input.dataset.cmsPath);cmsSetPath(cmsPageDraft,path,input.cmsEditor?input.cmsEditor.getHTML():input.dataset.cmsArray?input.value.split(/[,，]/).map(s=>s.trim()).filter(Boolean):input.value);});
 if(cmsPageKey==='homeIntro')cmsPageDraft.featuredPostIds=[...document.querySelectorAll('[data-cms-featured]:checked')].map(input=>input.dataset.cmsFeatured);
}
function renderAdminPagesManagerTab(wrap, key = cmsPageKey) {
 cmsPageKey=key;
 cmsRichFields = new Set();
 cmsPageDraft=JSON.parse(JSON.stringify({...cmsPageDefaults[key],...(window.APP_STATE[key]||{})}));
 wrap.innerHTML=`<h2>页面管理</h2><div class="cms-page-tabs">${Object.entries(cmsPageLabels).map(([key,label])=>`<button class="btn-secondary" data-cms-page="${key}">${label}</button>`).join('')}</div><div id="cms-page-form"></div><button class="btn-primary" id="cms-save-page">保存${cmsPageLabels[key]}</button>`;
 // A minimal render target is also supported by the non-DOM regression harness.
 if(!wrap.querySelector)return;
 wrap.querySelectorAll('[data-cms-page]').forEach(button=>button.addEventListener('click',()=>renderAdminPagesManagerTab(wrap,button.dataset.cmsPage)));
 renderCMSPageFields();
 wrap.querySelector('#cms-save-page').addEventListener('click',async()=>{collectCMSPageDraft();window.APP_STATE[cmsPageKey]=cmsPageDraft;if(cmsPageKey!=='homeIntro')window.APP_STATE[cmsPageKey].contentFormat='html';if(await persistAdminChanges())showToast('页面内容已保存','success');});
}
function renderCMSPageFields() {
 const form=document.getElementById('cms-page-form');form.innerHTML=(cmsPageKey==='homeIntro'?`<label class="form-label">博主头像 URL</label><input class="form-input" id="cms-home-avatar" value="${escapeHtml(window.APP_STATE.settings?.avatarUrl||'')}">`:'')+cmsField([],cmsPageDraft);
 form.querySelectorAll('[data-cms-rich]').forEach(input=>{const path=input.dataset.cmsPath;const editor=window.CMSEditor?.mount(input,{content:input.value,format:cmsRichFields.has(path)||window.APP_STATE[cmsPageKey]?.contentFormat==='html'?'html':undefined});if(editor){editor.element.dataset.cmsPath=path;cmsRichFields.add(path);}});
 form.querySelectorAll('[data-cms-add]').forEach(button=>button.addEventListener('click',()=>{collectCMSPageDraft();const path=JSON.parse(button.dataset.cmsAdd);let list=cmsPageDraft;path.forEach(key=>list=list[key]);list.push(JSON.parse(JSON.stringify(cmsListDefaults[path.at(-1)]||'')));renderCMSPageFields();}));
 form.querySelectorAll('[data-cms-remove]').forEach(button=>button.addEventListener('click',()=>{collectCMSPageDraft();const path=JSON.parse(button.dataset.cmsRemove);let list=cmsPageDraft;path.slice(0,-1).forEach(key=>list=list[key]);list.splice(path.at(-1),1);renderCMSPageFields();}));
}
const cmsOAuthPlatforms=['google','github','qq','wechat'];
function cmsCallback(platform,siteUrl) {return (siteUrl || window.APP_STATE.settings?.siteUrl || window.location?.origin || '').replace(/\/$/,'')+'/api/auth/'+platform+'/callback';}
function cmsOAuthFields() {
 const settings=window.APP_STATE.settings||{};const oauth=settings.oauthConfig||window.APP_STATE.oauthConfig||{};
 return `<div class="form-group"><label class="form-label" for="cfg-site-url">站点公开 URL</label><input class="form-input" type="url" id="cfg-site-url" value="${escapeHtml(settings.siteUrl||window.location?.origin||'')}"></div>${cmsOAuthPlatforms.map(platform=>`<fieldset><legend>${platform.toUpperCase()}</legend><label class="cms-choice"><input id="cfg-${platform}-enabled" type="checkbox" ${oauth[platform]?.enabled?'checked':''}>启用官方授权</label>${['id','secret','admin'].map(field=>`<label class="form-label" for="cfg-${platform}-${field}">${{id:'Client ID',secret:'Client Secret',admin:'管理员唯一标识'}[field]}</label><input class="form-input" id="cfg-${platform}-${field}" type="${field==='secret'?'password':'text'}" autocomplete="${field==='secret'?'new-password':'off'}" value="${escapeHtml(oauth[platform]?.[{id:'clientId',secret:'clientSecret',admin:'adminIdentifier'}[field]]||'')}">`).join('')}<label class="form-label">Callback / 回调地址</label><input class="form-input" id="cfg-${platform}-callback" value="${escapeHtml(cmsCallback(platform))}" readonly></fieldset>`).join('')}`;
}
function bindCMSCallbackPreview(wrap) {wrap.querySelector?.('#cfg-site-url')?.addEventListener('input',event=>cmsOAuthPlatforms.forEach(platform=>{const field=document.getElementById(`cfg-${platform}-callback`);if(field)field.value=cmsCallback(platform,event.target.value);}));}
function renderAdminOAuthUsersTab(wrap) {
 const users=(window.APP_STATE.users||[]).filter(Boolean);
 wrap.innerHTML=`<h2>多平台用户与登录配置</h2><p>使用官方 OAuth 验证身份。未配置的平台保持关闭。</p>${cmsOAuthFields()}<button class="btn-primary" onclick="saveOAuthPlatformSettings()">保存登录配置</button><h3>已注册用户（${users.length}）</h3><table><thead><tr><th>平台</th><th>昵称</th><th>身份标识</th></tr></thead><tbody>${users.map(user=>`<tr><td>${escapeHtml(String(user.platform||'历史账号').toUpperCase())}</td><td>${escapeHtml(user.nickname||user.name||'')}</td><td>${escapeHtml(user.identifier||user.email||user.id||'')}</td></tr>`).join('')}</tbody></table>`;
 bindCMSCallbackPreview(wrap);
}
function collectCMSOAuthSettings() {
 const settings=window.APP_STATE.settings ||= {};const input=document.getElementById('cfg-site-url');if(!input)return;
 const siteUrl=input.value.trim();let parsed;try{parsed=new URL(siteUrl);}catch{throw new Error('请输入完整的站点公开 URL');}if(!['https:','http:'].includes(parsed.protocol))throw new Error('站点 URL 必须使用 HTTP 或 HTTPS');
 settings.siteUrl=siteUrl.replace(/\/$/,'');settings.oauthConfig ||= {};
 cmsOAuthPlatforms.forEach(platform=>{settings.oauthConfig[platform]={...settings.oauthConfig[platform],enabled:Boolean(document.getElementById(`cfg-${platform}-enabled`)?.checked),clientId:document.getElementById(`cfg-${platform}-id`)?.value.trim()||'',clientSecret:document.getElementById(`cfg-${platform}-secret`)?.value||'',adminIdentifier:document.getElementById(`cfg-${platform}-admin`)?.value.trim()||'',callbackUrl:cmsCallback(platform)};});
}
async function saveOAuthPlatformSettings() {try{collectCMSOAuthSettings();if(await persistAdminChanges())showToast('OAuth 配置已保存','success');}catch(error){showToast(escapeHtml(error.message),'error');}}
function renderAdminSettingsTab(wrap) {
 const settings=window.APP_STATE.settings||{};
 wrap.innerHTML=`<h2>账户与数据备份</h2><label class="form-label">管理员账号</label><input class="form-input" id="set-user" value="${escapeHtml(settings.adminUser||'')}"><label class="form-label">新密码（留空保留当前密码）</label><input class="form-input" type="password" autocomplete="new-password" id="set-pass"><h3>官方 OAuth 登录与回调地址</h3>${cmsOAuthFields()}<button class="btn-primary" onclick="saveAdminCredentials()">保存账户与登录配置</button><button class="btn-secondary" onclick="exportDataBackup()">导出数据备份</button>`;bindCMSCallbackPreview(wrap);
}
async function saveAdminCredentials() {
 try{collectCMSOAuthSettings();const settings=window.APP_STATE.settings ||= {};settings.adminUser=document.getElementById('set-user')?.value.trim();const password=document.getElementById('set-pass')?.value;if(password)settings.adminPass=password;if(await persistAdminChanges())showToast('账户设置已保存','success');}catch(error){showToast(escapeHtml(error.message),'error');}
}
let cmsGeneratedDraft=null;
function renderAdminAITab(wrap) {
 const settings=window.APP_STATE.settings||{};
 wrap.innerHTML=`<h2>AI 视频创作</h2><p>输入 YouTube 链接生成草稿，确认内容后可在编辑器中发布。</p>${[['aiProvider','服务商'],['aiModel','模型'],['aiBaseUrl','服务地址'],['aiModelKey','模型密钥']].map(([key,label])=>`<label class="form-label">${label}</label><input class="form-input" id="${key}" type="${key==='aiModelKey'?'password':'text'}" value="${escapeHtml(settings[key]||'')}">`).join('')}<button class="btn-secondary" onclick="saveAISettings()">保存模型配置</button><label class="form-label">YouTube 视频链接</label><input class="form-input" type="url" id="ai-youtube-url" placeholder="https://www.youtube.com/watch?v=..."><label class="form-label">字幕（可选）</label><textarea class="form-textarea" rows="8" id="ai-subtitles" placeholder="可粘贴视频字幕，或由服务端尝试获取"></textarea><button class="btn-primary" id="ai-generate-button" onclick="generateAIDraft()">生成草稿</button><p id="ai-generation-status" role="status"></p>`;
}
async function saveAISettings() {
 const settings=window.APP_STATE.settings ||= {};['aiProvider','aiModel','aiBaseUrl','aiModelKey'].forEach(key=>settings[key]=document.getElementById(key)?.value.trim()||'');
 const saved=await persistAdminChanges();if(saved)showToast('模型配置已保存','success');return saved;
}
async function generateAIDraft() {
 const button=document.getElementById('ai-generate-button');const status=document.getElementById('ai-generation-status');
 if(button?.disabled)return;
 try{const youtubeUrl=document.getElementById('ai-youtube-url')?.value.trim();const url=new URL(youtubeUrl);if(!['youtu.be','www.youtube.com','youtube.com','m.youtube.com'].includes(url.hostname))throw new Error('请输入有效的 YouTube 视频链接');if(button)button.disabled=true;if(status)status.textContent='正在生成草稿，请稍候…';
 if(!await saveAISettings())return;
 const result=await window.cmsRequest('/api/admin/ai/generate',{method:'POST',body:{youtubeUrl,subtitles:document.getElementById('ai-subtitles')?.value||''}});
 const draft=result.draft||result.post||result;if(!draft.content)throw new Error('生成结果缺少正文');cmsGeneratedDraft=draft;if((result.warnings||[]).length)showToast(result.warnings.join('；'),'info');editingPostId=null;currentAdminTab='editor';renderAdminView();
 ['title','summary'].forEach(key=>{const field=document.getElementById('post-'+key);if(field)field.value=draft[key]||'';});const yt=document.getElementById('post-yt');if(yt)yt.value=draft.youtubeId||'';const tags=document.getElementById('post-tags-input');if(tags)tags.value=(draft.tags||[]).join(', ');const category=document.getElementById('post-cat');if(category&&draft.category)category.value=draft.category;
 const content=document.getElementById('post-content');const html=draft.contentFormat==='html'||draft.displayConfig?.contentFormat==='html'?draft.content:window.CMSEditor.markdownToHtml(draft.content);if(content?.cmsEditor)content.cmsEditor.setHTML(html);else if(content)content.value=html;updateEditorCoverPreview();showToast('草稿已填入编辑器，请审核后保存发布','info');
 }catch(error){if(status)status.textContent='生成失败：'+error.message;showToast(escapeHtml(error.message),'error');}finally{if(button)button.disabled=false;}
}

