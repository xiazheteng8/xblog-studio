/* Server-backed application startup, sessions and public channel data. */
const PAGES_KEY = 'xblog_pages_v1:' + location.pathname.replace(/index\.html$/, '');
const publicSeed = JSON.parse(JSON.stringify(window.APP_STATE));
function pagesAPIBase() { return (localStorage.getItem(PAGES_KEY+':api') || '').replace(/\/$/, ''); }
async function cmsRequest(path, options = {}) {
  const base = pagesAPIBase();
  if (!base) throw new Error('纯静态模式不可用：此功能需要可选 VPS API 地址，请在后台静态发布设置中配置');
  const token = sessionStorage.getItem('xzt_admin_token') || sessionStorage.getItem('xzt_auth_token');
  const headers = {'Content-Type':'application/json', ...(token && token !== 'pages-local' ? {Authorization:'Bearer '+token} : {}), ...options.headers};
  const response = await fetch(base + path, {...options, headers, body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body});
  const text = await response.text(); let data;
  try { data = text ? JSON.parse(text) : {}; } catch (_) { throw new Error('API 返回非 JSON，请检查 VPS API 地址'); }
  if (!response.ok) throw new Error(data.error || 'HTTP '+response.status);
  return data;
}
window.cmsRequest = cmsRequest;
async function persistCMSState() {
  if (sessionStorage.getItem('xzt_admin_logged') !== 'true') throw new Error('请先登录本地后台');
  try {localStorage.setItem(PAGES_KEY, JSON.stringify(window.APP_STATE));return true;}
  catch(error) {showToast('本浏览器保存失败：'+error.message,'error');throw error;}
}
window.persistCMSState = persistCMSState;
function formatChannelCount(value) {
  if (value === null || value === undefined || !/^\d+$/.test(String(value))) return '暂不可用';
  return new Intl.NumberFormat('en-US').format(Number(value)) + '+';
}
function applyColorMode(mode) {
  const body = document.body;
  if (mode === 'light') {
    const old = body.getAttribute('data-theme');
    if (old && old !== 'notion') localStorage.setItem('xzt_dark_theme', old);
    body.setAttribute('data-theme', 'notion');
  } else body.setAttribute('data-theme', localStorage.getItem('xzt_dark_theme') || (window.APP_STATE.settings?.currentTheme !== 'notion' && window.APP_STATE.settings?.currentTheme) || 'tech');
  localStorage.setItem('xzt_color_mode', mode);
  localStorage.setItem('xzt_theme', body.getAttribute('data-theme'));
  const button = document.getElementById('color-mode-toggle');
  if (button) {
    button.innerHTML = mode === 'light' ? '☾' : '☀';
    button.setAttribute('aria-label', mode === 'light' ? '切换深色主题' : '切换浅色主题');
    button.setAttribute('title', mode === 'light' ? '切换深色主题' : '切换浅色主题');
    button.setAttribute('aria-pressed', String(mode === 'dark'));
  }
}
function toggleColorMode() { applyColorMode(document.body.getAttribute('data-theme') === 'notion' ? 'dark' : 'light'); }
async function refreshYouTubeStats() {
  const slots = document.querySelectorAll('.channel-stats-grid .stat-number');
  if (!slots.length) return;
  slots[0].textContent = '加载中…'; if(slots[1]) slots[1].textContent = '加载中…';
  try {
    const stats = await cmsRequest('/api/youtube/stats');
    slots[0].textContent = formatChannelCount(stats.subscriberCount);
    if(slots[1]) slots[1].textContent = formatChannelCount(stats.viewCount);
    slots[0].title = stats.hiddenSubscriberCount ? '频道已隐藏订阅人数' : 'YouTube API 公开统计';
  } catch(error) {
    slots[0].textContent = '暂不可用'; slots[0].title = error.message;
    if(slots[1]) {slots[1].textContent = '暂不可用'; slots[1].title = error.message;}
  }
}
async function authenticateAccount(username, password) {
  let result;
  const settings = window.APP_STATE.settings || {};
  if (username === (settings.adminUser || 'admin') && password === (settings.adminPass || 'password')) {
    result = {token:'pages-local',role:'admin'};
  } else if (pagesAPIBase()) result = await cmsRequest('/api/auth/login', {method:'POST',body:{username,password}});
  else throw new Error('本地后台账号或密码错误（默认 admin / password）；会员登录需要 VPS API');
  sessionStorage.setItem('xzt_auth_token', result.token);
  if (result.role === 'admin' || result.user?.role === 'admin') {
    sessionStorage.setItem('xzt_admin_token',result.token);
    sessionStorage.setItem('xzt_admin_logged','true');
    // Local editor always owns the local Pages state, including when optional API is configured.
  } else sessionStorage.removeItem('xzt_admin_logged');
  if(result.user) {
    localStorage.setItem('xzt_member_username',result.user.nickname || result.user.username);
    localStorage.setItem('xzt_member_avatar',result.user.avatar || '');
  }
  updateTopUserBadge(); return result;
}
async function handleAdminLoginSubmit() {
  try {await authenticateAccount(document.getElementById('admin-user').value.trim(),document.getElementById('admin-pass').value);renderAdminView();showToast('登录成功','success');}
  catch(error) {showToast(error.message,'error');}
}
async function handleAccountLogin() {
  const user = document.getElementById('login-account-input');
  const pass = document.getElementById('login-password-input');
  try {await authenticateAccount(user?.value.trim() || '',pass?.value || '');closeAuthModal();handleRoute();showToast('登录成功','success');}
  catch(error) {showToast(error.message,'error');}
}
async function handleAccountRegister() {
  const read = id => document.getElementById(id)?.value || '';
  try {
    const password = read('reg-password-input');
    if(password !== read('reg-password-confirm')) throw new Error('两次输入的密码不一致');
    await cmsRequest('/api/auth/register',{method:'POST',body:{username:read('reg-username-input').trim(),password,nickname:read('reg-nickname-input').trim(),avatar:read('reg-avatar-input').trim()}});
    await authenticateAccount(read('reg-username-input').trim(),password);
    closeAuthModal();showToast('注册成功，已登录','success');
  } catch(error) {showToast(error.message,'error');}
}
function handleUserLogout() {
  ['xzt_admin_logged','xzt_admin_token','xzt_auth_token'].forEach(key=>sessionStorage.removeItem(key));
  ['xzt_member_account','xzt_member_username','xzt_member_avatar'].forEach(key=>localStorage.removeItem(key));
  window.location.reload();
}
function handleAdminLogout() {handleUserLogout();}
function beginOAuthLogin(platform) { if(!pagesAPIBase())return showToast('OAuth 需要可选 VPS API；静态站不能执行官方授权','error');window.location.assign(pagesAPIBase()+'/api/auth/'+encodeURIComponent(platform)+'/start'); }
async function startCMS() {
  try {
    try { const saved = localStorage.getItem(PAGES_KEY); window.APP_STATE = saved ? JSON.parse(saved) : publicSeed; }
    catch(error) {window.APP_STATE=publicSeed;showToast('本地数据无法读取，已载入示范种子','error');}
    if (sessionStorage.getItem('xzt_admin_token')) sessionStorage.setItem('xzt_admin_logged','true');
    else sessionStorage.removeItem('xzt_admin_logged');
    initBlog();
    applyColorMode(localStorage.getItem('xzt_color_mode') || (document.body.getAttribute('data-theme') === 'notion' ? 'light':'dark'));
    document.getElementById('color-mode-toggle')?.addEventListener('click',toggleColorMode);
    refreshYouTubeStats();
    window.addEventListener('hashchange',()=>{if(!location.hash || location.hash === '#home')refreshYouTubeStats();});
  } catch(error) {
    document.getElementById('home-intro-view').textContent = `静态数据载入失败：${error.message}`;
  }
}

function sanitizePagesState(value) {
  if (Array.isArray(value)) return value.map(sanitizePagesState);
  if (!value || typeof value !== 'object') return value;
  const result = {};
  for(const [key,child] of Object.entries(value)) {
    if (/password|passwd|adminPass|secret|token|apiKey|modelKey|oauth|googleAuth|users|comments|private|identifier|adminIdentifier|aiBaseUrl|apiBase/i.test(key)) continue;
    if (/customHtml/i.test(key)) {result[key]='';continue;}
    result[key] = sanitizePagesState(child);
  }
  return result;
}
window.exportDataBackup = function() {
  const state=sanitizePagesState(window.APP_STATE);
  state.posts=sanitizePagesState((window.APP_STATE.posts||[]).filter(post=>!post.private && !['draft','private','archived'].includes(post.status)));
  const blob=new Blob(['window.APP_STATE = '+JSON.stringify(state,null,2)+';\n'],{type:'text/javascript;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='data-seed.js';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  showToast('已导出公开 data-seed.js；替换 js/data-seed.js 并重新部署才能向所有访客发布','success');
};
const originalRenderAdminView = renderAdminView;
renderAdminView = function() {
  originalRenderAdminView();
  const target=document.querySelector('.admin-main') || document.getElementById('admin-view');
  if(!target || document.getElementById('pages-publish-panel'))return;
  const panel=document.createElement('section');panel.id='pages-publish-panel';panel.style='padding:16px;border:1px solid var(--accent);margin:16px 0;border-radius:12px';
  panel.innerHTML='<strong>静态 Pages 模式</strong><p>后台仅保存在本浏览器，不是服务器身份验证。默认 admin / password 是编辑入口，不能保护公开资料。导出公开 data-seed.js，替换 js/data-seed.js 后重新部署，所有访客才会看到更新。广告授权、会员、OAuth、AI 和 YouTube 统计依赖可选 VPS API；密钥仅在 VPS 配置。</p>'+(checkAdminAuth()?'<button class="btn-secondary" onclick="exportDataBackup()">导出公开 data-seed.js</button><label class="form-label">可选 VPS API 地址（HTTPS，服务端须允许本站 CORS；不自动上传本地内容）</label><input class="form-input" id="pages-api-base" placeholder="https://api.example.com"><button class="btn-secondary" id="pages-api-save">保存 API 地址</button><p id="pages-api-status" role="status"></p>':'');
  target.prepend(panel);
  const input=document.getElementById('pages-api-base');if(input)input.value=pagesAPIBase();
  document.getElementById('pages-api-save')?.addEventListener('click',()=>{try{let base=input.value.trim();if(base){const url=new URL(base);if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw new Error('请输入不含凭据、查询和片段的 HTTP(S) API 地址');base=base.replace(/\/$/,'');}localStorage.setItem(PAGES_KEY+':api',base);document.getElementById('pages-api-status').textContent=base?'API 地址已保存；请通过账户登录获取 VPS 会话。VPS 需配置密钥及 CORS。':'未配置 API：OAuth、会员注册、AI 和 YouTube 统计不可用';}catch(error){showToast(error.message,'error');}});
};
// Sponsor tokens in a browser are editable public data, never authorization.
window.initSponsorPortal = function(){const target=document.getElementById('sponsor-portal-view');if(target)target.innerHTML='<h2>静态站不提供广告授权服务</h2><p>请联系站长。公开广告可由本地后台编辑后导出部署。远程广告授权请使用 VPS 版本。</p>';};

// Static mode cannot issue real sponsor credentials or store server secrets.
renderAdminSponsorTokensTab = function(wrap){wrap.innerHTML='<h2>广告授权需要 VPS 服务</h2><p>静态文件中不能安全生成或验证广告 token。请在 VPS 版后台管理授权；本静态站可以在广告配置中编辑公开广告，再导出部署。</p>';};
renderAdminOAuthUsersTab = function(wrap){wrap.innerHTML='<h2>OAuth 与用户管理需要 VPS</h2><p>Google / GitHub / QQ / 微信 OAuth、会员注册和用户数据库由可选 VPS API 提供。请在 VPS 端配置 Client Secret、管理员标识、回调和 CORS，不能放入公开静态文件。本地不会模拟 OAuth 成功。</p>';};
renderAdminSettingsTab = function(wrap){const s=window.APP_STATE.settings||{};wrap.innerHTML='<h2>本浏览器编辑账户与公开导出</h2><p>账户仅控制本浏览器编辑入口，不提供服务器访问控制。导出不包含密码，重新部署的新浏览器仍使用 admin / password。</p><label class="form-label">本地管理员账号</label><input id="set-user" class="form-input"><label class="form-label">本地新密码（留空不修改）</label><input id="set-pass" type="password" class="form-input" autocomplete="new-password"><button class="btn-primary" id="pages-save-account">保存本地账户</button><button class="btn-secondary" onclick="exportDataBackup()">导出公开 data-seed.js</button>';document.getElementById('set-user').value=s.adminUser||'admin';document.getElementById('pages-save-account').onclick=async()=>{s.adminUser=document.getElementById('set-user').value.trim()||'admin';const password=document.getElementById('set-pass').value;if(password)s.adminPass=password;await persistCMSState();showToast('账户仅保存在本浏览器','success');};};
const pagesAITab=renderAdminAITab;
renderAdminAITab=function(wrap){pagesAITab(wrap);['aiProvider','aiModel','aiBaseUrl','aiModelKey'].forEach(id=>{const el=document.getElementById(id);if(el){el.previousElementSibling?.remove();el.remove();}});const save=wrap.querySelector('[onclick="saveAISettings()"]');save?.remove();wrap.insertAdjacentHTML('afterbegin','<p role="note">AI 需要可选 VPS API 和 VPS 管理员会话。模型、密钥与字幕获取服务必须在 VPS 配置；未配置 API 时不可用。</p>');};
saveAISettings=async function(){return true;};
const pagesRenderAdmin=renderAdminView;
renderAdminView=function(){pagesRenderAdmin();const panel=document.getElementById('pages-publish-panel');if(!panel||!checkAdminAuth())return;panel.insertAdjacentHTML('beforeend','<details><summary>登录可选 VPS API（用于 AI 等受保护接口）</summary><input class="form-input" id="pages-vps-user" placeholder="VPS 管理员账号" autocomplete="username"><input class="form-input" id="pages-vps-pass" type="password" placeholder="VPS 密码" autocomplete="current-password"><button class="btn-secondary" id="pages-vps-login">登录 VPS API</button><p id="pages-vps-status" role="status"></p></details>');document.getElementById('pages-vps-login').onclick=async()=>{try{const r=await cmsRequest('/api/auth/login',{method:'POST',body:{username:document.getElementById('pages-vps-user').value,password:document.getElementById('pages-vps-pass').value}});if(!r.token)throw new Error('API 未返回会话 token');sessionStorage.setItem('xzt_auth_token',r.token);sessionStorage.setItem('xzt_admin_token',r.token);document.getElementById('pages-vps-pass').value='';document.getElementById('pages-vps-status').textContent='VPS 会话已建立；本地内容仍只保存在此浏览器';}catch(e){document.getElementById('pages-vps-status').textContent=e.message;}};};
