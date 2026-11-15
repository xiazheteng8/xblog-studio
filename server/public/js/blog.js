// 模块: 核心博客引擎与路由分发 (blog.js)
let currentFilterCategory = 'all';
let currentSearchQuery = '';
let currentFilterTag = 'all';
let currentLegalTab = 'terms';
let activeLoginPlatform = 'google';
let currentGuestIdentity = null;
let googleQrPollTimer = null;
let currentQrSessionId = null;


function initBlog() {
  window.addEventListener('hashchange', handleRoute);
  
  const savedTheme = localStorage.getItem('xzt_theme') || (window.APP_STATE.settings && window.APP_STATE.settings.currentTheme) || 'tech';
  document.body.setAttribute('data-theme', savedTheme);

  updateHeaderFooterDOM();
  updateTopUserBadge();
  handleRoute();
}

function handleRoute() {
  const hash = window.location.hash || '#home';
  triggerThemeAnimation();

  // 隐藏所有主视图
  const homeView = document.getElementById('home-intro-view');
  const blogView = document.getElementById('blog-library-view');
  const postView = document.getElementById('post-detail-view');
  const sponsorView = document.getElementById('sponsor-portal-view');
  const adminView = document.getElementById('admin-view');
  const aboutView = document.getElementById('about-view');
  const legalView = document.getElementById('legal-view');

  if (homeView) homeView.style.display = 'none';
  if (blogView) blogView.style.display = 'none';
  if (postView) postView.style.display = 'none';
  if (sponsorView) sponsorView.style.display = 'none';
  if (adminView) adminView.style.display = 'none';
  if (aboutView) aboutView.style.display = 'none';
  if (legalView) legalView.style.display = 'none';

  // 更新顶部标签页激活状态 (首页、博客、后台)
  document.querySelectorAll('.nav-tab-btn').forEach(el => el.classList.remove('active'));

  if (hash.startsWith('#about')) {
    if (aboutView) {
      aboutView.style.display = 'block';
      renderAboutView();
    }
  } else if (hash.startsWith('#legal')) {
    if (legalView) {
      legalView.style.display = 'block';
      renderLegalView();
    }
  } else if (hash.startsWith('#blog')) {
    if (blogView) {
      blogView.style.display = 'block';
      renderBlogLibrary();
    }
    const tab = document.getElementById('nav-tab-blog');
    if (tab) tab.classList.add('active');
  } else if (hash.startsWith('#admin')) {
    if (adminView) {
      adminView.style.display = 'block';
      renderAdminView();
    }
    const tab = document.getElementById('nav-tab-admin');
    if (tab) tab.classList.add('active');
  } else if (hash.startsWith('#sponsor')) {
    if (sponsorView) {
      sponsorView.style.display = 'block';
      initSponsorPortal();
    }
  } else if (hash.startsWith('#post?') || hash.startsWith('#vid-')) {
    if (postView) {
      postView.style.display = 'block';
      let postId = '';
      if (hash.startsWith('#post?id=')) {
        postId = hash.split('id=')[1].split('&')[0];
      } else {
        postId = hash.replace('#', '');
      }
      renderPostDetail(postId);
    }
  } else {
    // 默认展示固定首页介绍
    if (homeView) {
      homeView.style.display = 'block';
      renderHomeIntro();
      renderAllAds(window.APP_STATE.ads);
    }
    const tab = document.getElementById('nav-tab-home');
    if (tab) tab.classList.add('active');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateTo(route) {
  window.location.hash = '#' + route;
}

function updateHeaderFooterDOM() {
  const hf = window.APP_STATE.headerFooter || {};
  const settings = window.APP_STATE.settings || {};

  const brandTitleEl = document.querySelector('.brand-title');
  if (brandTitleEl && hf.brandTitle) brandTitleEl.textContent = hf.brandTitle;
  const brandBadgeEl = document.querySelector('.brand-badge');
  if (brandBadgeEl && hf.brandBadge && !brandBadgeEl.id.includes('header-user-level')) {
    brandBadgeEl.textContent = hf.brandBadge;
  }

  const navHome = document.getElementById('nav-tab-home');
  if (navHome && hf.navHomeText) navHome.textContent = hf.navHomeText;
  const navBlog = document.getElementById('nav-tab-blog');
  if (navBlog && hf.navBlogText) navBlog.textContent = hf.navBlogText;
  const navAdmin = document.getElementById('nav-tab-admin');
  if (navAdmin && hf.navAdminText) navAdmin.textContent = hf.navAdminText;

  const ytBtn = document.querySelector('.social-icon-btn[title*="YouTube"]');
  if (ytBtn && (hf.youtubeUrl || settings.youtubeUrl)) ytBtn.href = hf.youtubeUrl || settings.youtubeUrl;
  const tgBtn = document.querySelector('.social-icon-btn[title*="Telegram"]');
  if (tgBtn && (hf.tgUrl || settings.tgUrl)) tgBtn.href = hf.tgUrl || settings.tgUrl;
  const ghBtn = document.querySelector('.social-icon-btn[title*="GitHub"]');
  if (ghBtn && (hf.githubUrl || settings.githubUrl)) ghBtn.href = hf.githubUrl || settings.githubUrl;
  const mailBtn = document.querySelector('.social-icon-btn[title*="邮件"]');
  if (mailBtn && (hf.emailContact || settings.emailContact)) mailBtn.href = `mailto:${hf.emailContact || settings.emailContact}`;
  const footer = document.querySelector('footer > div > div');
  if (footer && hf.footerCopyright) footer.textContent = hf.footerCopyright;
  const adsBtn = document.querySelector('.ads-contact-btn');
  if (adsBtn) {
    if (hf.adsContactUrl) adsBtn.href = hf.adsContactUrl;
    if (hf.adsContactText) adsBtn.innerHTML = `<span>💼</span><span>${escapeHtml(hf.adsContactText)}</span>`;
  }
}

// 用户身份与会员等级系统
function getCurrentUserSession() {
  const isAdmin = sessionStorage.getItem('xzt_admin_logged') === 'true';
  if (isAdmin) {
    return {
      role: 'admin',
      name: window.APP_STATE?.settings?.adminUser || 'admin',
      levelName: (window.APP_STATE?.memberLevels?.admin?.name) || '站长 · 管理员',
      badgeColor: '#ffd700',
      avatar: 'assets/gradient-light.svg'
    };
  }

  const memberName = localStorage.getItem('xzt_member_username');
  if (memberName) {
    return {
      role: 'member',
      name: memberName,
      levelName: (window.APP_STATE?.memberLevels?.member?.name) || '志同道合',
      badgeColor: '#4ade80',
      avatar: localStorage.getItem('xzt_member_avatar') || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(memberName)}`
    };
  }

  if (!currentGuestIdentity) {
    currentGuestIdentity = generateRandomGuestIdentity();
  }

  return {
    role: 'guest',
    name: currentGuestIdentity.name,
    levelName: (window.APP_STATE?.memberLevels?.guest?.name) || '游客',
    badgeColor: '#94a3b8',
    avatar: currentGuestIdentity.avatar
  };
}

function generateRandomGuestIdentity() {
  const gk = window.APP_STATE?.guestKeywords || {
    prefixes: ["沉迷", "玩转", "优选", "解锁", "搭建", "编译", "精简", "折腾", "爆改", "研究", "秒开"],
    nouns: ["HyperOS", "8K节点", "黑苹果", "软路由", "SmartTV", "KernelSU", "Docker", "Magisk", "晶晨盒子", "CUPS打印", "OpenCore", "WLOC定位"],
    personas: ["折腾党", "极客", "老司机", "骇客", "工程师", "刷机狂", "发烧友", "极客猫", "技术宅", "极客虾"],
    avatarStyle: "bottts"
  };

  const p = gk.prefixes[Math.floor(Math.random() * gk.prefixes.length)];
  const n = gk.nouns[Math.floor(Math.random() * gk.nouns.length)];
  const pe = gk.personas[Math.floor(Math.random() * gk.personas.length)];
  const nickname = `${p}${n}的${pe}`;

  const seed = Math.random().toString(36).substring(2, 8);
  const style = gk.avatarStyle || 'bottts';
  const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;

  return { name: nickname, avatar: avatarUrl, seed };
}

function randomizeGuestIdentity() {
  currentGuestIdentity = generateRandomGuestIdentity();
  const nameEl = document.getElementById('comment-guest-name');
  if (nameEl) nameEl.textContent = currentGuestIdentity.name;
  const avatarEl = document.getElementById('comment-guest-avatar');
  if (avatarEl) avatarEl.src = currentGuestIdentity.avatar;
  showToast(`🎲 随机昵称已刷新：${currentGuestIdentity.name}`, 'info');
}

function updateTopUserBadge() {
  const user = getCurrentUserSession();
  
  const badgeEl = document.getElementById('header-user-level-badge');
  if (badgeEl) {
    badgeEl.textContent = user.levelName;
    badgeEl.style.color = user.badgeColor;
    badgeEl.style.borderColor = user.badgeColor;
    badgeEl.style.background = `${user.badgeColor}18`;
    badgeEl.title = `当前账号身份等级：${user.levelName}`;
  }

  const statusWrap = document.getElementById('nav-user-status-wrap');
  if (statusWrap) {
    if (user.role === 'admin') {
      statusWrap.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;background:var(--bg-card);border:1px solid #ffd700;padding:3px 12px;border-radius:16px;">
          <img src="${user.avatar}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;">
          <span style="font-size:0.8rem;color:#ffd700;font-weight:700;">👑 站长已登录</span>
          <a href="#admin" onclick="navigateTo('admin');" style="color:var(--accent);font-size:0.75rem;text-decoration:none;" title="进入后台">后台</a>
          <a href="javascript:void(0)" onclick="handleUserLogout()" style="color:var(--text-dim);font-size:0.75rem;text-decoration:none;margin-left:4px;" title="退出登录">退出</a>
        </div>
      `;
    } else if (user.role === 'member') {
      statusWrap.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;background:var(--bg-card);border:1px solid #4ade80;padding:3px 12px;border-radius:16px;">
          <img src="${user.avatar}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;">
          <span style="font-size:0.8rem;color:#4ade80;font-weight:700;">${escapeHtml(user.name)}</span>
          <span style="font-size:0.72rem;background:#4ade8022;color:#4ade80;padding:1px 5px;border-radius:4px;font-weight:700;">志同道合</span>
          <a href="javascript:void(0)" onclick="handleUserLogout()" style="color:var(--text-dim);font-size:0.75rem;text-decoration:none;margin-left:4px;" title="退出登录">退出</a>
        </div>
      `;
    } else {
      statusWrap.innerHTML = `
        <button onclick="openAuthModal('login')" class="btn-primary" style="font-size:0.8rem;padding:5px 12px;border-radius:16px;background:var(--accent);color:#000;font-weight:700;display:flex;align-items:center;gap:6px;box-shadow:0 0 10px rgba(183,245,104,0.25);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          登录 / 注册
        </button>
      `;
    }
  }
}

let currentAuthTab = 'login';
let currentRegAvatar = '';
let currentRegNickname = '';

function generateRandomNickname() {
  const gk = window.APP_STATE?.guestKeywords || {
    prefixes: ["沉迷", "玩转", "优选", "解锁", "搭建", "编译", "精简", "折腾", "爆改", "研究", "秒开"],
    nouns: ["HyperOS", "8K节点", "黑苹果", "软路由", "SmartTV", "KernelSU", "Docker", "Magisk", "晶晨盒子", "CUPS打印", "OpenCore", "WLOC定位"],
    personas: ["折腾党", "极客", "老司机", "骇客", "工程师", "刷机狂", "发烧友", "极客猫", "技术宅", "极客虾"]
  };
  const p = gk.prefixes[Math.floor(Math.random() * gk.prefixes.length)];
  const n = gk.nouns[Math.floor(Math.random() * gk.nouns.length)];
  const pe = gk.personas[Math.floor(Math.random() * gk.personas.length)];
  return `${p}${n}的${pe}`;
}

function generateRandomAvatarUrl(preferredStyle) {
  const styles = ['bottts', 'identicon', 'pixel-art', 'lorelei'];
  const style = preferredStyle || styles[Math.floor(Math.random() * styles.length)];
  const seed = Math.random().toString(36).substring(2, 9);
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
}

function openAuthModal(initialTab = 'login') {
  currentAuthTab = initialTab;
  const existing = document.getElementById('auth-dialog-modal');
  if (existing) existing.remove();

  if (initialTab === 'register') {
    if (!currentRegNickname) currentRegNickname = generateRandomNickname();
    if (!currentRegAvatar) currentRegAvatar = generateRandomAvatarUrl('bottts');
  }

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.id = 'auth-dialog-modal';

  modal.innerHTML = `
    <div class="modal-box" style="max-width: 500px; padding: 26px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
        <div>
          <h3 style="font-size: 1.3rem; font-weight: 800; margin: 0; color: var(--text-main);">极客通行证 · 登录 / 注册</h3>
          <p style="color: var(--text-muted); font-size: 0.82rem; margin-top: 4px;">加入「Xblog」极客大家庭，拥有专属身份头衔与互动交流权限</p>
        </div>
        <button onclick="closeAuthModal()" style="background:transparent;border:none;color:var(--text-dim);font-size:1.4rem;cursor:pointer;line-height:1;" title="关闭">✕</button>
      </div>

      <div class="login-tabs-nav" style="display:flex; gap:8px; margin-bottom:20px; border-bottom:1px solid var(--border); padding-bottom:8px;">
        <button class="login-tab-item ${currentAuthTab === 'login' ? 'active' : ''}" id="tab-btn-login" onclick="switchAuthTab('login')" style="flex:1; text-align:center;">
          🔑 账号登录
        </button>
        <button class="login-tab-item ${currentAuthTab === 'register' ? 'active' : ''}" id="tab-btn-register" onclick="switchAuthTab('register')" style="flex:1; text-align:center;">
          ✨ 极客快速注册
        </button>
      </div>

      <div id="auth-tab-content">
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  renderAuthTabContent();
}

function closeAuthModal() {
  const modal = document.getElementById('auth-dialog-modal');
  if (modal) modal.remove();
}

function switchAuthTab(tab) {
  currentAuthTab = tab;
  document.querySelectorAll('.login-tab-item').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`tab-btn-${tab}`);
  if (btn) btn.classList.add('active');

  if (tab === 'register') {
    if (!currentRegNickname) currentRegNickname = generateRandomNickname();
    if (!currentRegAvatar) currentRegAvatar = generateRandomAvatarUrl('bottts');
  }
  renderAuthTabContent();
}

function renderAuthTabContent() {
  const wrap = document.getElementById('auth-tab-content');
  if (!wrap) return;

  if (currentAuthTab === 'login') {
    wrap.innerHTML = `
      <div class="auth-panel-login">
        <div class="form-group" style="margin-bottom: 14px;">
          <label class="form-label" style="font-weight: 700;">登录账号 / 电子邮箱</label>
          <input type="text" id="login-account-input" class="form-input" 
                 placeholder="输入账号或电子邮箱（站长请输入管理邮箱/账号）" 
                 style="font-family: var(--font-mono); font-size: 0.95rem;">
        </div>

        <div class="form-group" style="margin-bottom: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label class="form-label" style="font-weight: 700; margin-bottom: 0;">登录密码</label>
            <span style="font-size: 0.78rem; color: var(--text-dim);">请输入您的登录密码</span>
          </div>
          <input type="password" id="login-password-input" class="form-input" 
                 placeholder="输入登录密码" 
                 style="font-family: var(--font-mono); font-size: 0.95rem;"
                 onkeydown="if(event.key === 'Enter') handleAccountLogin()">
        </div>

        <button class="btn-primary" style="width: 100%; padding: 12px; font-size: 1rem; font-weight: 800; margin-bottom: 14px; background: var(--accent); color: #000;" onclick="handleAccountLogin()">
          🔑 立即登录
        </button>

        <div style="background: var(--bg-secondary); border: 1px dashed var(--border); border-radius: 8px; padding: 12px; margin-bottom: 14px; font-size: 0.8rem; color: var(--text-muted); line-height: 1.5;">
          💡 <strong>说明</strong>：读者登录后认证为「志同道合」会员；站长输入管理账号（<code>admin</code> 或 <code>contact@example.com</code>）及安全密码，即可直接进入后台超级管理员控制台。
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; color: var(--text-dim); flex-wrap: wrap; gap: 8px;">

          <a href="javascript:void(0)" onclick="switchAuthTab('register')" style="color: var(--accent); font-weight: 700; text-decoration: none;">
            没有账号？立即注册 👉
          </a>
        </div>
      </div>
    `;
  } else {
    wrap.innerHTML = `
      <div class="auth-panel-register">
        <div style="background: rgba(183, 245, 104, 0.08); border: 1px solid rgba(183, 245, 104, 0.3); border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 0.82rem; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.1rem;">🎲</span>
          <span><strong>随机生成规则</strong>：头像与昵称均已默认按规则自动生成，支持随意点击刷新或手动编辑！</span>
        </div>

        <!-- 1. 头像设置 -->
        <div class="form-group" style="margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label class="form-label" style="font-weight: 700; margin-bottom: 0;">1. 极客头像设置 (支持随机换取与直链自定义)</label>
            <button type="button" class="btn-secondary" style="font-size: 0.75rem; padding: 2px 8px;" onclick="rerollRegisterAvatar()">
              🎲 换一个头像
            </button>
          </div>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <img id="reg-avatar-preview" src="${currentRegAvatar}" 
                 style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid var(--accent); background: var(--bg-card); object-fit: cover; flex-shrink: 0; box-shadow: 0 0 10px rgba(183,245,104,0.25);"
                 onerror="this.src='https://api.dicebear.com/7.x/bottts/svg?seed=fallback'">
            <div style="flex: 1;">
              <input type="text" id="reg-avatar-input" class="form-input" 
                     value="${escapeHtml(currentRegAvatar)}" 
                     placeholder="头像直链（支持自由编辑修改）" 
                     style="font-family: var(--font-mono); font-size: 0.8rem;"
                     oninput="onRegAvatarInputChanged(this.value)">
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--text-dim); flex-wrap: wrap;">
            <span>快速风格预设：</span>
            <button type="button" class="btn-secondary" style="font-size: 0.72rem; padding: 1px 6px;" onclick="setRegAvatarStyle('bottts')">🤖 极客机器人</button>
            <button type="button" class="btn-secondary" style="font-size: 0.72rem; padding: 1px 6px;" onclick="setRegAvatarStyle('identicon')">🔷 极客几何</button>
            <button type="button" class="btn-secondary" style="font-size: 0.72rem; padding: 1px 6px;" onclick="setRegAvatarStyle('pixel-art')">👾 像素骇客</button>
            <button type="button" class="btn-secondary" style="font-size: 0.72rem; padding: 1px 6px;" onclick="setRegAvatarStyle('lorelei')">🎨 原创插画</button>
          </div>
        </div>

        <!-- 2. 昵称设置 -->
        <div class="form-group" style="margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label class="form-label" style="font-weight: 700; margin-bottom: 0;">2. 极客昵称 (已按「xxx的xxx」规则生成，可自由清空编辑)</label>
            <button type="button" class="btn-secondary" style="font-size: 0.75rem; padding: 2px 8px;" onclick="rerollRegisterNickname()">
              🎲 换个昵称
            </button>
          </div>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="reg-nickname-input" class="form-input" 
                   value="${escapeHtml(currentRegNickname)}" 
                   placeholder="输入你的极客昵称（可自由修改）" 
                   style="font-size: 0.95rem; font-weight: 700; color: var(--accent);">
          </div>
        </div>

        <!-- 3. 登录账号 -->
        <div class="form-group" style="margin-bottom: 14px;">
          <label class="form-label" style="font-weight: 700;">3. 登录账号 / 电子邮箱 (必填，用于后续登录)</label>
          <input type="text" id="reg-username-input" class="form-input" 
                 placeholder="例如：geek2026 或 your_email@example.com" 
                 style="font-family: var(--font-mono); font-size: 0.9rem;">
        </div>

        <!-- 4. 设置密码与确认 -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700;">4. 设置密码</label>
            <input type="password" id="reg-password-input" class="form-input" 
                   placeholder="至少 6 位字符" 
                   style="font-family: var(--font-mono); font-size: 0.9rem;">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700;">5. 确认密码</label>
            <input type="password" id="reg-password-confirm" class="form-input" 
                   placeholder="再次确认密码" 
                   style="font-family: var(--font-mono); font-size: 0.9rem;">
          </div>
        </div>

        <div style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; background: var(--bg-secondary); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); font-size: 0.8rem;">
          <span style="color: var(--text-dim);">注册后身份等级：</span>
          <span style="color: #4ade80; font-weight: 700; background: rgba(74, 222, 128, 0.15); border: 1px solid #4ade80; padding: 2px 8px; border-radius: 4px;">
            🟢 志同道合 (拥有专属头衔与评论权限)
          </span>
        </div>

        <button class="btn-primary" style="width: 100%; padding: 12px; font-size: 1rem; font-weight: 800; background: var(--accent); color: #000;" onclick="handleAccountRegister()">
          ✨ 完成注册并自动登录
        </button>

        <div style="text-align: center; margin-top: 14px; font-size: 0.82rem; color: var(--text-dim);">
          已有账号？<a href="javascript:void(0)" onclick="switchAuthTab('login')" style="color: var(--accent); font-weight: 700; text-decoration: none;">直接返回登录 👉</a>
        </div>
      </div>
    `;
  }
  if (currentAuthTab === 'login') {
    const oauth = window.APP_STATE.settings?.oauthConfig || window.APP_STATE.oauthConfig || {};
    const names = {google:'Google',github:'GitHub',qq:'QQ',wechat:'微信'};
    const enabled = Object.keys(names).filter(platform => oauth[platform]?.enabled);
    wrap.insertAdjacentHTML('beforeend', `<div class="cms-oauth-options">${enabled.length ? enabled.map(platform => `<button type="button" class="btn-secondary" onclick="beginOAuthLogin('${platform}')">${names[platform]} 授权登录</button>`).join('') : '<span style="font-size:.82rem;color:var(--text-muted)">第三方登录尚未启用，可由管理员在后台配置。</span>'}</div>`);
  }
}

function quickFillLogin(acc, pwd) {
  const accInput = document.getElementById('login-account-input');
  const pwdInput = document.getElementById('login-password-input');
  if (accInput) accInput.value = acc;
  if (pwdInput) pwdInput.value = pwd;
}

function rerollRegisterAvatar() {
  currentRegAvatar = generateRandomAvatarUrl();
  const preview = document.getElementById('reg-avatar-preview');
  const input = document.getElementById('reg-avatar-input');
  if (preview) preview.src = currentRegAvatar;
  if (input) input.value = currentRegAvatar;
  showToast('🎲 极客头像已随机换新！', 'info');
}

function setRegAvatarStyle(style) {
  currentRegAvatar = generateRandomAvatarUrl(style);
  const preview = document.getElementById('reg-avatar-preview');
  const input = document.getElementById('reg-avatar-input');
  if (preview) preview.src = currentRegAvatar;
  if (input) input.value = currentRegAvatar;
  showToast(`🎨 已切换为 ${style} 风格头像！`, 'info');
}

function onRegAvatarInputChanged(val) {
  currentRegAvatar = val.trim();
  const preview = document.getElementById('reg-avatar-preview');
  if (preview && currentRegAvatar) {
    preview.src = currentRegAvatar;
  }
}

function rerollRegisterNickname() {
  currentRegNickname = generateRandomNickname();
  const input = document.getElementById('reg-nickname-input');
  if (input) input.value = currentRegNickname;
  showToast(`🎲 随机昵称已刷新：${currentRegNickname}`, 'info');
}

function handleAccountRegister() {
  const usernameInput = document.getElementById('reg-username-input');
  const passwordInput = document.getElementById('reg-password-input');
  const confirmInput = document.getElementById('reg-password-confirm');
  const nicknameInput = document.getElementById('reg-nickname-input');
  const avatarInput = document.getElementById('reg-avatar-input');

  const username = usernameInput ? usernameInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value.trim() : '';
  const confirmPass = confirmInput ? confirmInput.value.trim() : '';
  let nickname = nicknameInput ? nicknameInput.value.trim() : '';
  let avatar = avatarInput ? avatarInput.value.trim() : '';

  if (!username) {
    showToast('请输入有效的注册账号或电子邮箱！', 'error');
    return;
  }

  if (username.toLowerCase() === 'admin' || username.toLowerCase() === 'contact@example.com') {
    showToast('该账号为站长专属资产，请切换至登录界面使用站长管理密码登录！', 'error');
    return;
  }

  if (!password || password.length < 6) {
    showToast('密码长度不能少于 6 位字符！', 'error');
    return;
  }

  if (password !== confirmPass) {
    showToast('两次输入的密码不一致，请核对！', 'error');
    return;
  }

  if (!nickname) {
    nickname = generateRandomNickname();
  }
  if (!avatar) {
    avatar = generateRandomAvatarUrl('bottts');
  }

  if (!window.APP_STATE.users) window.APP_STATE.users = [];
  const users = window.APP_STATE.users;
  const exists = users.some(u => u.username && u.username.toLowerCase() === username.toLowerCase());

  if (exists) {
    showToast('该账号已被注册，请直接前往登录或更换账号名！', 'error');
    return;
  }

  const now = new Date().toISOString().split('T')[0];
  const newUser = {
    id: 'u_' + Date.now().toString(36),
    username: username,
    email: username.includes('@') ? username : '',
    password: password,
    nickname: nickname,
    avatar: avatar,
    role: 'member',
    levelName: '志同道合',
    createdAt: now,
    lastLoginAt: now
  };

  users.unshift(newUser);
  try {
    localStorage.setItem('xzt_registered_users', JSON.stringify(users));
  } catch(e) {}

  // 动态 VPS 服务端同步注册
  fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, nickname, avatar })
  }).catch(() => {});

  localStorage.setItem('xzt_member_account', newUser.username);
  localStorage.setItem('xzt_member_username', newUser.nickname);
  localStorage.setItem('xzt_member_avatar', newUser.avatar);
  sessionStorage.removeItem('xzt_admin_logged');

  closeAuthModal();
  updateTopUserBadge();
  showToast(`🎉 注册成功！欢迎加入「志同道合」极客群体，已自动为您登录！`, 'success');
}

function handleUserLogout() {
  sessionStorage.removeItem('xzt_admin_logged');
  localStorage.removeItem('xzt_member_account');
  localStorage.removeItem('xzt_member_username');
  localStorage.removeItem('xzt_member_avatar');
  updateTopUserBadge();
  showToast('✓ 已安全退出登录，当前身份已恢复为游客', 'info');
  if (window.location.hash.startsWith('#admin')) {
    navigateTo('home');
  }
}

// 兼容别名
function openMemberLoginModal() {
  openAuthModal('login');
}
function openUniversalLoginModal(tab) {
  openAuthModal(tab === 'register' ? 'register' : 'login');
}
function handleMemberLogout() {
  handleUserLogout();
}


/* ================= 首页固定展示：频道介绍与专栏 ================= */
function renderHomeIntro() {
  const container = document.getElementById('home-intro-view');
  if (!container) return;

  const intro = window.APP_STATE.homeIntro || {};
  const settings = window.APP_STATE.settings || {};
  const posts = window.APP_STATE.posts || [];

  const featuredIds = intro.featuredPostIds || [
    'vid-cf-edge-8k', 'vid-android-tv-adb', 'vid-android-root-ult',
    'vid-nvidia-hackintosh', 'vid-dockge-compose', 'vid-openwrt-cups'
  ];
  const featuredPosts = posts.filter(p => featuredIds.includes(p.id));

  container.innerHTML = `
    <div class="home-showcase-wrapper">
      <section class="channel-hero-card">
        <div class="channel-profile-row">
          <img src="${escapeHtml(settings.avatarUrl || 'assets/gradient-light.svg')}" 
               alt="Xblog" class="channel-big-avatar" 
               onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <h1 class="channel-meta-title">${escapeHtml(intro.channelName || 'Xblog')}</h1>
              <span class="channel-handle-badge">${escapeHtml(intro.handle || '@admin')}</span>
              <span class="badge" style="background: rgba(183, 245, 104, 0.15); color: var(--accent); border: 1px solid var(--accent); padding: 3px 8px; border-radius: 4px; font-size: 0.75rem;">
                ${escapeHtml(intro.badge || 'PRO CREATOR')}
              </span>
            </div>
            <div class="channel-slogan">${escapeHtml(intro.slogan || '分享折腾过程中的乐趣 · 硬核极客技术探索')}</div>
          </div>
        </div>

        <p class="channel-bio-p">
          ${escapeHtml(intro.bio || '专注于硬核玩机折腾、HyperOS 深度调优、系统管理与 Linux 运维配置、全品牌电视去广告精简、家庭软路由与黑苹果双系统。坚持「折腾创造价值，开源分享乐趣」的极客信条，所有教程均经过真机严谨复现，附带完整命令、避坑指南与官方开源外链。')}
        </p>

        <div style="display: flex; gap: 14px; flex-wrap: wrap;">
          <a href="#blog" class="btn-primary" onclick="navigateTo('blog');" style="font-size: 0.95rem; padding: 10px 22px;">
            ${escapeHtml(intro.blogButtonText || `📚 进入全部 ${posts.length} 篇博客教程库 ↗`)}
          </a>
          <a href="${escapeHtml(settings.youtubeUrl || '#')}" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="font-size: 0.95rem; padding: 10px 18px; text-decoration: none;">
            ${escapeHtml(intro.youtubeButtonText || '▶ 订阅 YouTube @admin')}
          </a>
          <a href="${escapeHtml(settings.tgUrl || '#')}" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="font-size: 0.95rem; padding: 10px 18px; text-decoration: none;">
            ${escapeHtml(intro.telegramButtonText || '✈️ 加入 Telegram 交流群')}
          </a>
        </div>

        <div class="channel-stats-grid">
          ${(intro.stats || []).map(s => `
            <div class="stat-box">
              <div class="stat-number">${escapeHtml(s.num)}</div>
              <div class="stat-label">${escapeHtml(s.label)}</div>
              <div class="stat-sub">${escapeHtml(s.sub)}</div>
            </div>
          `).join('')}
        </div>
      </section>

      <div id="ad-home-slot" class="ad-slot-container"></div>

      <div style="margin: 36px 0 20px;">
        <h2 style="font-size: 1.6rem; font-weight: 800;">${escapeHtml(intro.domainsTitle || '🧭 核心技术探索领域')}</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">${escapeHtml(intro.domainsDescription || '覆盖系统管理、安卓玩机、电视大屏与网络架构的原创知识体系')}</p>
      </div>

      <div class="domains-grid">
        ${(intro.domains || []).map(d => `
          <div class="domain-card">
            <div class="domain-icon">${d.icon}</div>
            <h3 class="domain-title">${escapeHtml(d.title)}</h3>
            <p class="domain-desc">${escapeHtml(d.desc)}</p>
            <div class="domain-tags-wrap">
              ${(d.tags || []).map(t => `<span class="domain-tag">#${escapeHtml(t)}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <div style="margin: 36px 0 20px;">
        <h2 style="font-size: 1.6rem; font-weight: 800;">${escapeHtml(intro.projectsTitle || '⭐ 代表性原创开源项目')}</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">${escapeHtml(intro.projectsDescription || '由 @admin 倾力打造并长期维护的纯原创开源神器与折腾工具')}</p>
      </div>

      <div class="projects-grid">
        ${(intro.projects || []).map(pr => `
          <div class="project-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-main);">${escapeHtml(pr.name)}</h3>
                <span class="badge" style="background: rgba(183, 245, 104, 0.15); color: var(--accent); border: 1px solid var(--accent); font-size: 0.72rem; padding: 2px 6px; border-radius: 4px;">
                  ${escapeHtml(pr.badge)}
                </span>
              </div>
              <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 16px;">
                ${escapeHtml(pr.desc)}
              </p>
            </div>
            <a href="${escapeHtml(pr.linkUrl)}" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="text-align: center; font-size: 0.85rem; padding: 8px 14px; text-decoration: none;">
              ${escapeHtml(pr.linkText || '访问项目 ↗')}
            </a>
          </div>
        `).join('')}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin: 40px 0 20px;">
        <div>
          <h2 style="font-size: 1.6rem; font-weight: 800;">${escapeHtml(intro.featuredTitle || '🔥 热门精选实操教程')}</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">${escapeHtml(intro.featuredDescription || '点击教程卡片将在新标签页中打开图文与视频播放器')}</p>
        </div>
        <a href="#blog" class="btn-secondary" onclick="navigateTo('blog');" style="font-size: 0.88rem;">查看全部 ${posts.length} 篇博文 →</a>
      </div>

      <div class="posts-grid">
        ${featuredPosts.map(p => renderPostCardHtml(p)).join('')}
      </div>
    </div>
  `;
}

function getPostCover(p) {
  if (p && p.displayConfig && p.displayConfig.coverType === 'custom' && p.displayConfig.customCoverUrl) {
    return p.displayConfig.customCoverUrl;
  }
  if (p && p.youtubeId) {
    return `https://i.ytimg.com/vi/${p.youtubeId}/hqdefault.jpg`;
  }
  return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80';
}

function renderPostCardHtml(p) {
  const thumbUrl = getPostCover(p);
  const tagsHtml = (p.tags || []).slice(0, 3).map(t => `<span class="badge" style="background:var(--bg-secondary);color:var(--text-dim);border:1px solid var(--border);font-size:0.72rem;padding:1px 6px;border-radius:4px;">#${escapeHtml(t)}</span>`).join(' ');

  return `
    <a href="#post?id=${p.id}" target="_blank" class="post-card-link" title="在新窗口打开：${escapeHtml(p.title)}">
      <div class="post-card">
        <div class="post-cover-wrap">
          <img src="${thumbUrl}" alt="${escapeHtml(p.title)}" class="post-cover-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80'">
          <div class="post-yt-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="red"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            ${escapeHtml(p.duration || '高清视频')}
          </div>
        </div>
        <div class="post-card-body">
          <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span class="badge" style="background: var(--badge-bg); color: var(--accent); padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">
              ${escapeHtml(p.category || '综合折腾')}
            </span>
            <span style="font-size: 0.75rem; color: var(--text-dim); font-family: var(--font-mono);">
              在新页面打开 ↗
            </span>
          </div>
          <h3 class="post-card-title">${escapeHtml(p.title)}</h3>
          <p class="post-card-desc">${escapeHtml(p.summary || '')}</p>
          <div style="margin-bottom: 12px;">${tagsHtml}</div>
          <div class="post-card-meta">
            <span>📅 ${escapeHtml(p.date || '近期')}</span>
            <span>👁️ ${escapeHtml(String(p.views) || '1.5k')} 次播放</span>
          </div>
        </div>
      </div>
    </a>
  `;
}

/* ================= 博客教程库 ================= */
function renderBlogLibrary() {
  const container = document.getElementById('blog-library-view');
  if (!container) return;

  const posts = window.APP_STATE.posts || [];
  const catCounts = { 'all': posts.length };
  posts.forEach(p => {
    const c = p.category || '综合折腾';
    catCounts[c] = (catCounts[c] || 0) + 1;
  });

  const tagCounts = {};
  posts.forEach(p => {
    (p.tags || []).forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 32);

  const filtered = posts.filter(p => {
    const matchCat = (currentFilterCategory === 'all' || p.category === currentFilterCategory);
    const matchTag = (currentFilterTag === 'all' || (p.tags && p.tags.includes(currentFilterTag)));
    const q = currentSearchQuery.toLowerCase();
    const matchQuery = !q || (p.title && p.title.toLowerCase().includes(q)) || 
                             (p.summary && p.summary.toLowerCase().includes(q)) ||
                             (p.content && p.content.toLowerCase().includes(q)) ||
                             (p.tags && p.tags.some(t => t.toLowerCase().includes(q)));
    return matchCat && matchTag && matchQuery;
  });

  container.innerHTML = `
    <div class="blog-view-wrapper">
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 2rem; font-weight: 900; margin-bottom: 6px;">📚 博客知识库与教程归档</h1>
        <p style="color: var(--text-muted); font-size: 0.95rem;">
          共收录 28 篇真实视频复现图文教程，每篇均符合 GitHub README 规范，内置 YouTube 播放器与资源外链。
        </p>
      </div>

      <div class="category-nav-bar">
        <button class="cat-pill ${currentFilterCategory === 'all' ? 'active' : ''}" onclick="selectCategory('all')">
          全部教程 <span class="cat-count">(${catCounts['all']})</span>
        </button>
        ${Object.keys(catCounts).filter(c => c !== 'all').map(c => `
          <button class="cat-pill ${currentFilterCategory === c ? 'active' : ''}" onclick="selectCategory('${c}')">
            ${escapeHtml(c)} <span class="cat-count">(${catCounts[c]})</span>
          </button>
        `).join('')}
      </div>

      <div class="filter-bar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" id="blog-search-input" class="search-input" 
                 value="${escapeHtml(currentSearchQuery)}" 
                 placeholder="按标题、内容、命令或标签实时搜索..." 
                 oninput="onBlogSearch(this.value)">
        </div>
        <div style="font-size: 0.85rem; color: var(--text-dim);">
          找到 <strong>${filtered.length}</strong> 篇相关教程
        </div>
      </div>

      <div class="tag-cloud-box">
        <div class="tag-cloud-title">🏷️ 热门技术标签 (点击快速过滤)：</div>
        <div class="tags-wrap">
          <button class="tag-btn ${currentFilterTag === 'all' ? 'active' : ''}" onclick="selectTag('all')">
            全部标签
          </button>
          ${topTags.map(([tagName, count]) => `
            <button class="tag-btn ${currentFilterTag === tagName ? 'active' : ''}" onclick="selectTag('${tagName}')">
              #${escapeHtml(tagName)} <small style="opacity: 0.8;">(${count})</small>
            </button>
          `).join('')}
        </div>
      </div>

      ${filtered.length === 0 ? `
        <div style="text-align: center; padding: 60px 20px; color: var(--text-dim);">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">🔍</div>
          <p style="font-size: 1.1rem; color: var(--text-muted);">未找到与当前分类或标签匹配的教程</p>
          <button class="btn-secondary" style="margin-top: 14px;" onclick="resetBlogFilters()">重置所有过滤条件</button>
        </div>
      ` : `
        <div class="posts-grid">
          ${filtered.map(p => renderPostCardHtml(p)).join('')}
        </div>
      `}
    </div>
  `;
}

function selectCategory(cat) {
  currentFilterCategory = cat;
  renderBlogLibrary();
}

function selectTag(tag) {
  currentFilterTag = tag;
  renderBlogLibrary();
}

function onBlogSearch(q) {
  currentSearchQuery = q;
  renderBlogLibrary();
}

function resetBlogFilters() {
  currentFilterCategory = 'all';
  currentFilterTag = 'all';
  currentSearchQuery = '';
  renderBlogLibrary();
}

/* ================= 博文详情页 ================= */
function renderPostDetail(id) {
  const container = document.getElementById('post-detail-view');
  if (!container) return;

  const post = (window.APP_STATE.posts || []).find(p => p.id === id);
  if (!post) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <h2>未找到该博文</h2>
        <a href="#blog" class="btn-primary" style="margin-top: 16px;">返回博客教程列表</a>
      </div>
    `;
    return;
  }

  const dc = post.displayConfig || {
    coverType: 'youtube',
    topDisplayMode: 'player',
    showLinks: true,
    showToc: true,
    showComments: true,
    showAd: true
  };
  const coverImg = getPostCover(post);

  let mediaHtml = '';
  if (dc.topDisplayMode === 'cover_and_player') {
    mediaHtml = `
      <div class="detail-cover-banner">
        <img src="${coverImg}" alt="${escapeHtml(post.title)}" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80'">
      </div>
      ${post.youtubeId ? `
        <div class="video-player-container">
          <iframe src="https://www.youtube.com/embed/${post.youtubeId}?autoplay=0&rel=0" 
                  title="${escapeHtml(post.title)}" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen></iframe>
        </div>
      ` : ''}
    `;
  } else if (dc.topDisplayMode === 'cover_only') {
    mediaHtml = `
      <div class="detail-cover-banner">
        <img src="${coverImg}" alt="${escapeHtml(post.title)}" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80'">
      </div>
    `;
  } else {
    mediaHtml = post.youtubeId ? `
      <div class="video-player-container">
        <iframe src="https://www.youtube.com/embed/${post.youtubeId}?autoplay=0&rel=0" 
                title="${escapeHtml(post.title)}" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen></iframe>
      </div>
    ` : `
      <div class="detail-cover-banner">
        <img src="${coverImg}" alt="${escapeHtml(post.title)}">
      </div>
    `;
  }

  let tocHtml = '';
  if (dc.showToc !== false && post.content) {
    const headings = [];
    if (post.contentFormat === 'html' || dc.contentFormat === 'html') {
      const source = document.createElement('template');
      source.innerHTML = window.CMSEditor ? window.CMSEditor.sanitize(post.content) : escapeHtml(post.content);
      source.content.querySelectorAll('h2, h3').forEach(heading => headings.push({level: Number(heading.tagName.slice(1)), title: heading.textContent.trim()}));
    } else {
      post.content.split('\n').forEach(line => {
        const match = line.match(/^(#{2,3})\s+(.+)$/);
        if (match) headings.push({level: match[1].length, title: match[2].trim()});
      });
    }
    if (headings.length > 0) {
      tocHtml = `
        <div class="post-toc-panel">
          <div class="toc-title">📑 本文目录导读 (${headings.length} 个核心小节)</div>
          <ul class="toc-list">
            ${headings.map(h => `
              <li class="toc-item ${h.level === 3 ? 'level-3' : ''}">
                <a href="#section-${encodeURIComponent(h.title)}" class="toc-link" onclick="scrollToHeading('${escapeHtml(h.title)}'); return false;">
                  ${h.level === 3 ? '↳ ' : '▪ '}${escapeHtml(h.title)}
                </a>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }
  }

  let linksHtml = '';
  const links = post.links || post.externalLinks || [];
  if (dc.showLinks !== false && Array.isArray(links) && links.length > 0) {
    linksHtml = `
      <div class="description-links-panel">
        <div class="desc-links-title">
          <span>🔗 视频说明中的官方资源与相关链接：</span>
        </div>
        <div>
          ${links.map(l => `
            <a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer" class="desc-link-item">
              📌 <strong>${escapeHtml(l.title)}</strong> ${l.note ? `<span style="color:var(--text-dim);font-size:0.8rem;">(${escapeHtml(l.note)})</span>` : ''}: 
              <span style="color: var(--accent); font-family: var(--font-mono); font-size: 0.82rem;">${escapeHtml(l.url)}</span> ↗
            </a>
          `).join('')}
        </div>
      </div>
    `;
  }

  const tagsHtml = (post.tags || []).map(t => `<span class="badge" style="background:var(--bg-secondary);color:var(--accent);border:1px solid var(--accent);font-size:0.75rem;padding:3px 8px;border-radius:4px;margin-right:6px;">#${escapeHtml(t)}</span>`).join('');
  const parsedMarkdown = post.contentFormat === 'html' || dc.contentFormat === 'html'
    ? (window.CMSEditor ? window.CMSEditor.sanitize(post.content || '') : escapeHtml(post.content || ''))
    : renderMarkdownToHtml(post.content || '');

  let commentsHtml = '';
  if (dc.showComments !== false) {
    commentsHtml = `
      <div style="margin-top: 48px; padding-top: 28px; border-top: 1px solid var(--border);">
        <h3 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 20px;">💬 交流与讨论</h3>
        <div id="comments-list" style="margin-bottom: 24px;"></div>

        <div style="background: var(--bg-secondary); padding: 20px; border-radius: var(--radius-md); border: 1px solid var(--border);">
          <div id="comment-identity-bar" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px dashed var(--border); font-size: 0.85rem;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img id="comment-guest-avatar" src="${getCurrentUserSession().avatar}" style="width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--accent); background: var(--bg-card);">
              <span>当前身份：<strong id="comment-guest-level" style="color: ${getCurrentUserSession().badgeColor};">${getCurrentUserSession().levelName}</strong></span>
              <span style="color: var(--text-main);">昵称：<code id="comment-guest-name" style="color: var(--accent); font-weight: 700;">${escapeHtml(getCurrentUserSession().name)}</code></span>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              ${getCurrentUserSession().role === 'guest' ? `
                <button type="button" class="btn-secondary" style="font-size: 0.78rem; padding: 3px 8px;" onclick="randomizeGuestIdentity()">🎲 换个随机昵称</button>
                <button type="button" class="btn-primary" style="font-size: 0.78rem; padding: 3px 10px; background: #4ade80; color: #000;" onclick="openMemberLoginModal()">登录为「志同道合」会员 ↗</button>
              ` : `
                <span style="font-size: 0.8rem; color: #4ade80;">✓ 已认证「${getCurrentUserSession().levelName}」</span>
              `}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">交流讨论留言：</label>
            <textarea id="comment-input" class="form-textarea" rows="3" placeholder="欢迎在此交流折腾心得，无论游客还是会员均可自由畅所欲言..."></textarea>
          </div>
          <button class="btn-primary" onclick="submitComment('${post.id}')">提交评论</button>
        </div>
      </div>
    `;
  }

  const adSlotHtml = (dc.showAd !== false) ? `<div id="ad-post-slot" class="ad-slot-container"></div>` : '';

  container.innerHTML = `
    <div class="post-detail-view">
      <div class="back-home-btn" onclick="window.close(); if(history.length > 1){history.back();}else{navigateTo('blog');}">
        ← 返回博客教程列表
      </div>

      <h1 class="detail-title">${escapeHtml(post.title)}</h1>

      <div class="detail-meta-bar">
        <span>📅 发布日期：${escapeHtml(post.date || '2026-10')}</span>
        <span>🏷️ 分类：${escapeHtml(post.category || '折腾教程')}</span>
        <span>👁️ 浏览热度：${escapeHtml(String(post.views) || '2.1k')} 次播放</span>
        <span>⏱️ 视频时长：${escapeHtml(post.duration || '精讲')}</span>
      </div>

      <div style="margin-bottom: 20px;">
        ${tagsHtml}
      </div>

      ${mediaHtml}
      ${tocHtml}
      ${linksHtml}
      ${adSlotHtml}

      <div class="markdown-body">
        ${parsedMarkdown}
      </div>

      ${commentsHtml}
    </div>
  `;

  if (dc.showAd !== false) {
    renderPostAd(window.APP_STATE.ads.postAd, post.id);
  }
  if (dc.showComments !== false) {
    renderCommentsForPost(post.id);
  }
}

function scrollToHeading(title) {
  const headings = Array.from(document.querySelectorAll('.markdown-body h2, .markdown-body h3'));
  const target = headings.find(h => h.textContent.includes(title));
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderCommentsForPost(postId) {
  const wrap = document.getElementById('comments-list');
  if (!wrap) return;

  const comments = (window.APP_STATE.comments || []).filter(c => c.postId === postId);
  if (comments.length === 0) {
    wrap.innerHTML = `<p style="color: var(--text-dim); font-size: 0.9rem;">暂无评论，快来抢首评吧！</p>`;
    return;
  }

  wrap.innerHTML = comments.map(c => {
    const role = c.role || 'guest';
    const levelName = c.levelName || (role === 'admin' ? '站长' : (role === 'member' ? '志同道合' : '游客'));
    const badgeColor = role === 'admin' ? '#ffd700' : (role === 'member' ? '#4ade80' : '#94a3b8');
    const avatar = c.avatar || (role === 'admin' ? 'assets/gradient-light.svg' : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(c.author)}`);

    return `
      <div style="padding: 14px 16px; background: var(--bg-secondary); border-radius: var(--radius-sm); margin-bottom: 12px; border: 1px solid var(--border); display: flex; gap: 12px; align-items: flex-start;">
        <img src="${avatar}" style="width: 36px; height: 36px; border-radius: 50%; border: 1px solid ${badgeColor}; flex-shrink: 0; background: var(--bg-card);">
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="color: var(--text-main); font-size: 0.92rem;">${escapeHtml(c.author)}</strong>
              <span class="badge" style="background: ${badgeColor}22; color: ${badgeColor}; border: 1px solid ${badgeColor}; font-size: 0.72rem; padding: 1px 6px; border-radius: 4px;">
                ${escapeHtml(levelName)}
              </span>
            </div>
            <span style="color: var(--text-dim); font-size: 0.78rem;">${escapeHtml(c.date)}</span>
          </div>
          <p style="font-size: 0.92rem; color: var(--text-main); line-height: 1.5;">${escapeHtml(c.text)}</p>
        </div>
      </div>
    `;
  }).join('');
}

function submitComment(postId) {
  const input = document.getElementById('comment-input');
  const text = input ? input.value.trim() : '';
  if (!text) {
    showToast('请输入评论内容！', 'error');
    return;
  }

  const user = getCurrentUserSession();

  const newComment = {
    id: 'cm_' + Date.now(),
    postId,
    author: user.name,
    role: user.role,
    levelName: user.levelName,
    avatar: user.avatar,
    text,
    date: new Date().toISOString().split('T')[0]
  };

  if (!window.APP_STATE.comments) window.APP_STATE.comments = [];
  window.APP_STATE.comments.push(newComment);
  try {
    localStorage.setItem('xzt_comments', JSON.stringify(window.APP_STATE.comments));
  } catch(e) {}

  input.value = '';
  showToast(`✓ 评论已发表 (${user.levelName} 身份)`, 'success');
  renderCommentsForPost(postId);
}

/* ================= 简易 Markdown 解析器 ================= */
function renderMarkdownToHtml(md) {
  if (!md) return '';
  let html = md;

  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, function(match, lang, code) {
    return `<pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`;
  });

  html = html.replace(/\|(.+)\|\n\|[-:| ]+\|\n((?:\|.+\|\n?)+)/g, function(match, header, rows) {
    const ths = header.split('|').filter(s => s.trim().length > 0).map(s => `<th>${s.trim()}</th>`).join('');
    const trs = rows.trim().split('\n').map(r => {
      const tds = r.split('|').filter(s => s.trim().length > 0).map(s => `<td>${s.trim()}</td>`).join('');
      return `<tr>${tds}</tr>`;
    }).join('');
    return `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:0.9rem;"><thead><tr style="border-bottom:2px solid var(--border);">${ths}</tr></thead><tbody>${trs}</tbody></table>`;
  });

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/^\> (.*$)/gim, '<blockquote style="border-left:3px solid var(--accent);padding:8px 14px;background:var(--bg-secondary);margin:14px 0;"><p>$1</p></blockquote>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; border-radius: 8px; margin: 12px 0;">');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--accent); text-decoration: underline;">$1</a>');
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  return html;
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

/* ================= 关于我们页面 (About Us) ================= */
function renderAboutView() {
  const container = document.getElementById('about-view');
  if (!container) return;

  const about = window.APP_STATE.aboutPage || {};
  const settings = window.APP_STATE.settings || {};

  container.innerHTML = `
    <div style="max-width: 920px; margin: 0 auto; animation: fadeIn 0.3s ease-out;">
      <div class="back-home-btn" onclick="navigateTo('home');" style="margin-bottom: 20px;">
        ← 返回博客首页
      </div>

      <div class="legal-portal-card" style="margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 18px; flex-wrap: wrap;">
          <img src="${escapeHtml(settings.avatarUrl || 'assets/gradient-light.svg')}" 
               style="width: 68px; height: 68px; border-radius: 50%; border: 3px solid var(--accent); object-fit: cover; box-shadow: 0 0 20px var(--accent-glow);">
          <div>
            <h1 style="font-size: 2rem; font-weight: 800; margin: 0;">${escapeHtml(about.title || '关于「Xblog」与站长故事')}</h1>
            <div style="font-size: 0.9rem; color: var(--accent); font-family: var(--font-mono); margin-top: 4px;">
              ${escapeHtml(about.subtitle || 'YouTube: @admin · 硬核极客技术分享知识库')}
            </div>
          </div>
        </div>

        <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-main); margin-bottom: 10px;">
          ${escapeHtml(about.storyTitle || '为什么叫「Xblog」？我们的技术初心')}
        </h3>
        <p style="font-size: 0.98rem; color: var(--text-muted); line-height: 1.8; margin-bottom: 20px;">
          ${about.contentFormat === 'html' && window.CMSEditor ? window.CMSEditor.sanitize(about.storyContent || '') : escapeHtml(about.storyContent || '在很多外人看来，把好端端的电视机拆开线刷、把路由器刷入第三方系统、把显卡折腾成黑苹果双系统是“没事瞎折腾”。但在我们看来，折腾从来不是浪费时间，折腾是对软硬件底层技术逻辑的深度探索，是打破厂商商业封闭与广告垄断的极客乐趣。折腾创造价值，开源分享乐趣。')}
        </p>

        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <a href="${escapeHtml(settings.youtubeUrl || '#')}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="font-size: 0.88rem; text-decoration: none;">
            ▶ 订阅 YouTube 频道 (10k+)
          </a>
          <a href="${escapeHtml(settings.tgUrl || '#')}" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="font-size: 0.88rem; text-decoration: none;">
            ✈️ 加入 Telegram 万人交流群
          </a>
          <a href="#legal" onclick="navigateTo('legal');" class="btn-secondary" style="font-size: 0.88rem;">
            ⚖️ 查阅法律条款与免责声明 →
          </a>
        </div>
      </div>

      <div class="legal-portal-card" style="margin-bottom: 24px;">
        <h2 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 18px; display: flex; align-items: center; gap: 8px;">
          <span>💡</span>
          <span>技术信条与创作原则</span>
        </h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
          ${(about.principles || []).map(pr => `
            <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 18px;">
              <h4 style="font-size: 1.05rem; font-weight: 750; color: var(--accent); margin-bottom: 8px;">${escapeHtml(pr.title)}</h4>
              <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.6;">${escapeHtml(pr.desc)}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="legal-portal-card">
        <h2 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 18px; display: flex; align-items: center; gap: 8px;">
          <span>🚩</span>
          <span>折腾历程大事记</span>
        </h2>
        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${(about.milestones || []).map(m => `
            <div style="display: flex; gap: 16px; align-items: flex-start; padding-bottom: 12px; border-bottom: 1px dashed var(--border);">
              <span class="badge" style="background: rgba(183, 245, 104, 0.15); color: var(--accent); border: 1px solid var(--accent); font-family: var(--font-mono); font-weight: 800; font-size: 0.82rem; padding: 3px 8px; border-radius: 4px;">
                ${escapeHtml(m.year)}
              </span>
              <div style="font-size: 0.92rem; color: var(--text-main); line-height: 1.6;">
                ${escapeHtml(m.event)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/* ================= 法律中心：服务条款、隐私政策、免责声明、开源许可 ================= */
function renderLegalView() {
  const container = document.getElementById('legal-view');
  if (!container) return;

  const legal = window.APP_STATE.legalDocs || {};
  const doc = legal[currentLegalTab] || legal.terms || {};

  container.innerHTML = `
    <div style="max-width: 920px; margin: 0 auto; animation: fadeIn 0.3s ease-out;">
      <div class="back-home-btn" onclick="navigateTo('home');" style="margin-bottom: 20px;">
        ← 返回博客首页
      </div>

      <div class="legal-portal-card">
        <div style="margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"></path>
              <path d="M12 8v4"></path>
              <path d="M12 16h.01"></path>
            </svg>
            <h1 style="font-size: 1.85rem; font-weight: 800; margin: 0;">法律条款与合规中心</h1>
          </div>
          <p style="color: var(--text-muted); font-size: 0.92rem;">
            包含「Xblog」博客平台的用户服务协议、个人信息保护政策、极客操作风险免责声明及开源许可协议。
          </p>
        </div>

        <div class="legal-tabs-row">
          <button class="legal-tab-btn ${currentLegalTab === 'terms' ? 'active' : ''}" onclick="switchLegalTab('terms')">
            📜 服务条款 (Terms)
          </button>
          <button class="legal-tab-btn ${currentLegalTab === 'privacy' ? 'active' : ''}" onclick="switchLegalTab('privacy')">
            🛡️ 隐私保护政策 (Privacy)
          </button>
          <button class="legal-tab-btn ${currentLegalTab === 'disclaimer' ? 'active' : ''}" onclick="switchLegalTab('disclaimer')">
            ⚖️ 技术免责声明 (Disclaimer)
          </button>
          <button class="legal-tab-btn ${currentLegalTab === 'license' ? 'active' : ''}" onclick="switchLegalTab('license')">
            📦 开源许可 (License)
          </button>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid var(--border);">
          <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--accent); margin: 0;">${escapeHtml(doc.title)}</h2>
          <span style="font-size: 0.8rem; color: var(--text-dim); font-family: var(--font-mono);">
            最后更新于：${escapeHtml(doc.updated || '2026-10-31')}
          </span>
        </div>

        <div>
          ${(doc.sections || []).map(sec => `
            <div class="legal-section-block">
              <h3 class="legal-sec-title">${escapeHtml(sec.title)}</h3>
              <div class="legal-sec-p">${legal.contentFormat === 'html' && window.CMSEditor ? window.CMSEditor.sanitize(sec.content || '') : escapeHtml(sec.content)}</div>
            </div>
          `).join('')}
        </div>

        <div style="background: var(--bg-secondary); border-radius: 8px; padding: 16px 20px; margin-top: 28px; border-left: 3px solid var(--accent); font-size: 0.88rem; color: var(--text-muted);">
          如有任何条款合规咨询、版权反馈或隐私疑问，请电报联系：<a href="#" target="_blank" rel="noopener noreferrer" style="color: #ffd700; font-weight: 700;">@yourname</a>，或发送邮件至官方邮箱：<a href="mailto:contact@example.com" style="color: var(--accent); font-weight: 700;">contact@example.com</a>。
        </div>
      </div>
    </div>
  `;
}

function switchLegalTab(tab) {
  currentLegalTab = tab;
  renderLegalView();
}
