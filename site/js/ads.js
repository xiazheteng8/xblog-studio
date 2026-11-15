// 模块: 广告系统与空闲隐藏逻辑 (ads.js)
// 全局 In-Page Toast 与确认弹窗辅助函数 (完全替代 Canvas 拦截的原生 alert/confirm/prompt)
function showToast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  const bg = type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : 'var(--bg-card)';
  const border = type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : 'var(--accent)';
  el.style.cssText = `background:${bg};color:#fff;border:1px solid ${border};padding:12px 18px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.5);font-size:0.9rem;font-weight:600;max-width:380px;animation:floatSlideUp 0.3s;pointer-events:auto;`;
  el.innerHTML = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

function showConfirmModal(title, msg, onConfirm) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.id = 'confirm-dialog-modal';
  modal.innerHTML = `
    <div class="modal-box" style="max-width: 440px;">
      <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 10px;">${title}</h3>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px; line-height: 1.5;">${msg}</p>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button class="btn-secondary" onclick="document.getElementById('confirm-dialog-modal').remove()">取消</button>
        <button class="btn-primary" id="confirm-dialog-btn">确认操作</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('confirm-dialog-btn').onclick = () => {
    modal.remove();
    onConfirm();
  };
}

function showLinkDisplayModal(title, link) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.id = 'link-display-modal';
  modal.innerHTML = `
    <div class="modal-box" style="max-width: 520px;">
      <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 12px; color: #ffd700;">${title}</h3>
      <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 14px;">专属链接已就绪，可直接点击复制或发送给对方：</p>
      <input type="text" id="copy-modal-input" class="form-input" value="${link}" style="font-family: var(--font-mono); margin-bottom: 16px;">
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button class="btn-secondary" onclick="document.getElementById('link-display-modal').remove()">关闭</button>
        <button class="btn-primary" onclick="if(navigator.clipboard){navigator.clipboard.writeText('${link}');} showToast('✓ 链接已成功复制！', 'success'); document.getElementById('link-display-modal').remove();">复制链接</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// 核心规则：广告位在空闲/未配置时，彻底隐藏；仅当存在有效广告内容且启用时才展示！
function isAdActive(ad) {
  if (!ad || typeof ad !== 'object') return false;
  if (ad.enabled === false) return false;
  const hasTitle = typeof ad.title === 'string' && ad.title.trim().length > 0;
  const hasHtml = typeof ad.customHtml === 'string' && ad.customHtml.trim().length > 0;
  const hasImage = typeof ad.imageUrl === 'string' && ad.imageUrl.trim().length > 0;
  return hasTitle || hasHtml || hasImage;
}

function renderHomeAd(ad) {
  const container = document.getElementById('ad-home-slot');
  if (!container) return;
  if (!isAdActive(ad)) {
    container.classList.add('is-idle');
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }
  container.classList.remove('is-idle');
  container.style.display = '';
  
  if (ad.customHtml && ad.customHtml.trim()) {
    container.innerHTML = `<div class="ad-card" onclick="trackAdClick('homeAd')">${ad.customHtml}</div>`;
    return;
  }
  
  container.innerHTML = `
    <div class="ad-card" onclick="trackAdClick('homeAd')">
      <div style="flex: 1;">
        <span class="ad-badge">${escapeHtml(ad.badge || 'SPONSOR · 赞助商推荐')}</span>
        <h4 class="ad-title">${escapeHtml(ad.title)}</h4>
        <p class="ad-desc">${escapeHtml(ad.desc || '')}</p>
      </div>
      <a href="${escapeHtml(ad.linkUrl || '#')}" target="_blank" rel="noopener noreferrer" class="ad-btn" onclick="event.stopPropagation(); trackAdClick('homeAd');">
        ${escapeHtml(ad.linkText || '立即了解 ↗')}
      </a>
    </div>
  `;
}

function renderPostAd(ad, currentPostId) {
  const container = document.getElementById('ad-post-slot');
  if (!container) return;
  if (!isAdActive(ad)) {
    container.classList.add('is-idle');
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }
  
  // 检查是否限制在指定博文展示
  if (!ad.applyAll && Array.isArray(ad.targetPostIds) && ad.targetPostIds.length > 0) {
    if (currentPostId && !ad.targetPostIds.includes(currentPostId)) {
      container.classList.add('is-idle');
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }
  }
  
  container.classList.remove('is-idle');
  container.style.display = '';
  
  if (ad.customHtml && ad.customHtml.trim()) {
    container.innerHTML = `<div class="ad-card" onclick="trackAdClick('postAd')">${ad.customHtml}</div>`;
    return;
  }
  
  container.innerHTML = `
    <div class="ad-card" onclick="trackAdClick('postAd')">
      <div style="flex: 1;">
        <span class="ad-badge">${escapeHtml(ad.badge || '推荐资源 · 博文专属')}</span>
        <h4 class="ad-title">${escapeHtml(ad.title)}</h4>
        <p class="ad-desc">${escapeHtml(ad.desc || '')}</p>
      </div>
      <a href="${escapeHtml(ad.linkUrl || '#')}" target="_blank" rel="noopener noreferrer" class="ad-btn" onclick="event.stopPropagation(); trackAdClick('postAd');">
        ${escapeHtml(ad.linkText || '直达链接 ↗')}
      </a>
    </div>
  `;
}

function renderBottomAd(ad) {
  const container = document.getElementById('ad-bottom-slot');
  if (!container) return;
  if (!isAdActive(ad)) {
    container.classList.add('is-idle');
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }
  container.classList.remove('is-idle');
  container.style.display = '';
  
  if (ad.customHtml && ad.customHtml.trim()) {
    container.innerHTML = `<div class="ad-card" onclick="trackAdClick('bottomAd')">${ad.customHtml}</div>`;
    return;
  }
  
  container.innerHTML = `
    <div class="ad-card" onclick="trackAdClick('bottomAd')">
      <div style="flex: 1;">
        <span class="ad-badge">${escapeHtml(ad.badge || '合作推荐 · 底部广告位')}</span>
        <h4 class="ad-title">${escapeHtml(ad.title)}</h4>
        <p class="ad-desc">${escapeHtml(ad.desc || '')}</p>
      </div>
      <a href="${escapeHtml(ad.linkUrl || '#')}" target="_blank" rel="noopener noreferrer" class="ad-btn" onclick="event.stopPropagation(); trackAdClick('bottomAd');">
        ${escapeHtml(ad.linkText || '访问项目 ↗')}
      </a>
    </div>
  `;
}

function renderFloatingAd(ad) {
  const container = document.getElementById('ad-floating');
  if (!container) return;
  if (!isAdActive(ad) || sessionStorage.getItem('float_ad_closed') === 'true') {
    container.classList.add('is-idle');
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }
  container.classList.remove('is-idle');
  container.style.display = 'block';
  
  container.innerHTML = `
    <button class="float-close-btn" onclick="closeFloatingAd(event)" title="关闭浮窗">✕</button>
    <span class="ad-badge">${escapeHtml(ad.badge || '限时福利')}</span>
    <h4 style="font-size: 0.98rem; font-weight: 700; margin: 4px 0 6px;">${escapeHtml(ad.title)}</h4>
    <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.45; margin-bottom: 10px;">${escapeHtml(ad.desc || '')}</p>
    <a href="${escapeHtml(ad.linkUrl || '#')}" target="_blank" rel="noopener noreferrer" class="ad-btn" style="width: 100%; justify-content: center;" onclick="trackAdClick('floatAd');">
      ${escapeHtml(ad.linkText || '立即参与 ↗')}
    </a>
  `;
}

function closeFloatingAd(e) {
  if (e) e.stopPropagation();
  sessionStorage.setItem('float_ad_closed', 'true');
  const container = document.getElementById('ad-floating');
  if (container) container.style.display = 'none';
}

function trackAdClick(slotKey) {
  try {
    if (window.APP_STATE && window.APP_STATE.ads && window.APP_STATE.ads[slotKey]) {
      window.APP_STATE.ads[slotKey].clicks = (window.APP_STATE.ads[slotKey].clicks || 0) + 1;
    }
  } catch(e) {}
}

function renderAllAds(ads, currentPostId) {
  if (!ads) return;
  renderHomeAd(ads.homeAd);
  renderPostAd(ads.postAd, currentPostId);
  renderBottomAd(ads.bottomAd);
  renderFloatingAd(ads.floatAd);
}
