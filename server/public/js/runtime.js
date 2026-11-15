/* Server-backed application startup, sessions and public channel data. */
async function cmsRequest(path, options = {}) {
  const token = sessionStorage.getItem('xzt_admin_token') || sessionStorage.getItem('xzt_auth_token');
  const headers = {'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {}), ...options.headers};
  const response = await fetch(path, {...options, headers, body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body});
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch (_) { throw new Error(`服务响应异常 (HTTP ${response.status})，请检查服务地址`); }
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}
window.cmsRequest = cmsRequest;
async function persistCMSState() {
  try {
    await cmsRequest('/api/admin/state', {method:'PUT', body:window.APP_STATE});
    const stored = await cmsRequest('/api/admin/state');
    window.APP_STATE = stored.state || stored;
    return true;
  } catch(error) { showToast(`保存失败：${error.message}`, 'error'); throw error; }
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
  } else body.setAttribute('data-theme', localStorage.getItem('xzt_dark_theme') || 'tech');
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
  const result = await cmsRequest('/api/auth/login', {method:'POST', body:{username,password}});
  sessionStorage.setItem('xzt_auth_token', result.token);
  if (result.role === 'admin' || result.user?.role === 'admin') {
    sessionStorage.setItem('xzt_admin_token',result.token);
    sessionStorage.setItem('xzt_admin_logged','true');
    const state = await cmsRequest('/api/admin/state'); window.APP_STATE = state.state || state;
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
function beginOAuthLogin(platform) { window.location.assign(`/api/auth/${encodeURIComponent(platform)}/start`); }
async function startCMS() {
  try {
    const publicState = await cmsRequest('/api/bootstrap');
    window.APP_STATE = publicState.state || publicState;
    const hash = window.location.hash;
    if(hash.startsWith('#auth?')) {
      const query = new URLSearchParams(hash.slice(6));
      if(query.get('error')) showToast(query.get('error'),'error');
      if(query.get('token')) {
        sessionStorage.setItem('xzt_auth_token',query.get('token'));
        if(query.get('role') === 'admin') sessionStorage.setItem('xzt_admin_token',query.get('token'));
        else localStorage.setItem('xzt_member_username',query.get('nickname') || '已认证读者');
      }
      history.replaceState(null,'',query.get('role') === 'admin' ? '#admin' : '#home');
    }
    if(sessionStorage.getItem('xzt_admin_token')) {
      try {const state = await cmsRequest('/api/admin/state');window.APP_STATE=state.state||state;sessionStorage.setItem('xzt_admin_logged','true');}
      catch (_) {sessionStorage.removeItem('xzt_admin_logged');sessionStorage.removeItem('xzt_admin_token');}
    } else sessionStorage.removeItem('xzt_admin_logged');
    initBlog();
    applyColorMode(localStorage.getItem('xzt_color_mode') || (document.body.getAttribute('data-theme') === 'notion' ? 'light':'dark'));
    document.getElementById('color-mode-toggle')?.addEventListener('click',toggleColorMode);
    refreshYouTubeStats();
    window.addEventListener('hashchange',()=>{if(!location.hash || location.hash === '#home')refreshYouTubeStats();});
  } catch(error) {
    document.getElementById('home-intro-view').textContent = `无法连接博客服务：${error.message}。请通过 Python 服务访问网站。`;
  }
}
