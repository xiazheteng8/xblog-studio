// 模块: 金主爸爸广告专属对接与自主配置平台 (sponsor.js)
const SLOT_LABELS = {
  homeAd: '首页顶部广告位',
  postAd: '指定博文广告位',
  bottomAd: '页面底部广告位',
  floatAd: '右下浮动广告位'
};

let currentSponsorToken = null;
let currentSponsorObj = null;
let activeSponsorSlot = null;

function initSponsorPortal() {
  const portal = document.getElementById('sponsor-portal-view');
  if (!portal) return;

  // 1. 尝试从 URL 或 Session 中读取 key
  let keyFromUrl = null;
  const hash = window.location.hash || '';
  if (hash.includes('key=')) {
    keyFromUrl = hash.split('key=')[1].split('&')[0];
  } else {
    const params = new URLSearchParams(window.location.search);
    keyFromUrl = params.get('key');
  }

  if (keyFromUrl) {
    verifyAndLoadSponsor(keyFromUrl);
  } else {
    renderSponsorLogin();
  }
}

function renderSponsorLogin() {
  const container = document.getElementById('sponsor-portal-view');
  if (!container) return;
  
  container.innerHTML = `
    <div class="sponsor-portal-container">
      <div style="text-align: center; margin-bottom: 24px;">
        <span class="sponsor-badge-top">👑 金主爸爸专属合作对接平台</span>
        <h2 style="font-size: 1.8rem; font-weight: 800; margin: 8px 0;">金主广告自主配置系统</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem;">
          凭站长派发的专属 API Key 登录，自主配置属于您的广告内容与跳转链接，实时保存生效。
        </p>
      </div>

      <div class="sponsor-auth-card">
        <label class="form-label" style="font-size: 1rem; margin-bottom: 10px;">请输入您的金主专属 API Key 密钥：</label>
        <div style="display: flex; gap: 10px; max-width: 520px; margin: 0 auto;">
          <input type="text" id="sponsor-input-key" class="form-input" placeholder="例如：SPON_EXAMPLE" value="" style="font-family: var(--font-mono); font-weight: 700; text-align: center;">
          <button class="btn-primary" onclick="handleSponsorLoginSubmit()" style="white-space: nowrap;">验证并进入 ↗</button>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-dim); margin-top: 12px;">
          请联系站长获取专属广告授权密钥。
        </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="#home" class="back-home-btn" onclick="navigateTo('home');">← 返回博客首页</a>
      </div>
    </div>
  `;
}

function quickFillSponsorKey(k) {
  const input = document.getElementById('sponsor-input-key');
  if (input) {
    input.value = k;
    handleSponsorLoginSubmit();
  }
}

function handleSponsorLoginSubmit() {
  const input = document.getElementById('sponsor-input-key');
  const key = input ? input.value.trim() : '';
  if (!key) {
    showToast('请输入有效的金主专属 API Key！', 'error');
    return;
  }
  verifyAndLoadSponsor(key);
}

function verifyAndLoadSponsor(key) {
  const tokens = (window.APP_STATE && window.APP_STATE.adTokens) || [];
  const found = tokens.find(t => t.token === key && t.active);

  if (!found) {
    showToast('❌ API Key 无效或已被站长撤销，请核对密钥或联系 @admin！', 'error');
    renderSponsorLogin();
    return;
  }

  currentSponsorToken = key;
  currentSponsorObj = found;
  // 默认激活第一个授权的广告位
  activeSponsorSlot = found.allowedSlots[0] || 'homeAd';

  renderSponsorDashboard();
}

function renderSponsorDashboard() {
  const container = document.getElementById('sponsor-portal-view');
  if (!container || !currentSponsorObj) return;

  const ads = window.APP_STATE.ads || {};
  const currentAdData = ads[activeSponsorSlot] || {};
  const isIdle = !isAdActive(currentAdData);

  const tabsHtml = Object.keys(SLOT_LABELS).map(slotKey => {
    const isAllowed = currentSponsorObj.allowedSlots.includes(slotKey);
    const isActiveTab = (slotKey === activeSponsorSlot);
    const badgeText = isAllowed ? '✓ 已授权' : '✕ 未授权';
    const activeClass = isActiveTab ? 'active' : '';
    const disabledClass = !isAllowed ? 'disabled' : '';
    
    return `
      <button class="sponsor-slot-tab ${activeClass} ${disabledClass}" 
              onclick="${isAllowed ? `switchSponsorSlot('${slotKey}')` : `showToast('您当前的 API 密钥未获得【${SLOT_LABELS[slotKey]}】的配置权限。如需投放请联系站长开通！', 'error')`}">
        ${SLOT_LABELS[slotKey]} <span style="font-size: 0.72rem; opacity: 0.8;">(${badgeText})</span>
      </button>
    `;
  }).join('');

  container.innerHTML = `
    <div class="sponsor-portal-container">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
        <div>
          <span class="sponsor-badge-top">👑 尊享金主控制台</span>
          <h2 style="font-size: 1.8rem; font-weight: 800; margin: 4px 0;">欢迎金主爸爸：<span style="color: #ffd700;">${escapeHtml(currentSponsorObj.name)}</span></h2>
          <p style="color: var(--text-muted); font-size: 0.88rem;">
            密钥凭据：<code style="color: var(--accent);">${escapeHtml(currentSponsorToken)}</code> | 有效期至：<strong>${escapeHtml(currentSponsorObj.expireAt || '长期有效')}</strong>
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn-secondary" onclick="renderSponsorLogin()">退出登录</button>
          <a href="#home" class="btn-primary" onclick="navigateTo('home');">前往博客查看效果 ↗</a>
        </div>
      </div>

      <div style="background: var(--bg-secondary); border-radius: var(--radius-md); padding: 14px 18px; margin-bottom: 24px; border: 1px solid var(--border);">
        <div style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 8px;">请选择您要配置的已授权广告位：</div>
        <div class="sponsor-slots-selector">${tabsHtml}</div>
      </div>

      <!-- 广告配置表单与实时预览区 -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <!-- 左侧：表单配置 -->
        <div style="background: var(--bg-secondary); border-radius: var(--radius-md); padding: 20px; border: 1px solid var(--border);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 1.15rem; font-weight: 700;">⚙️ 正在配置：${SLOT_LABELS[activeSponsorSlot]}</h3>
            <span class="ad-status-pill ${isIdle ? 'idle' : 'active'}">
              ${isIdle ? '⚪ 当前空闲 (前端隐藏)' : '🟢 线上展示中'}
            </span>
          </div>

          <div class="form-group">
            <label class="form-label">广告主标题 (必填，留空则自动隐藏)：</label>
            <input type="text" id="sp-form-title" class="form-input" value="${escapeHtml(currentAdData.title || '')}" placeholder="例如：示范赞助商" oninput="updateSponsorPreview()">
          </div>

          <div class="form-group">
            <label class="form-label">宣传文案 / 优惠介绍：</label>
            <textarea id="sp-form-desc" class="form-textarea" rows="3" placeholder="简要介绍您的产品核心卖点或优惠码..." oninput="updateSponsorPreview()">${escapeHtml(currentAdData.desc || '')}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">跳转目标网址 (URL)：</label>
            <input type="url" id="sp-form-url" class="form-input" value="${escapeHtml(currentAdData.linkUrl || '')}" placeholder="https://..." oninput="updateSponsorPreview()">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label">按钮引导文案：</label>
              <input type="text" id="sp-form-btn" class="form-input" value="${escapeHtml(currentAdData.linkText || '立即了解 ↗')}" placeholder="立即了解 ↗" oninput="updateSponsorPreview()">
            </div>
            <div class="form-group">
              <label class="form-label">角标标签文字：</label>
              <input type="text" id="sp-form-badge" class="form-input" value="${escapeHtml(currentAdData.badge || 'SPONSOR · 金主推荐')}" placeholder="SPONSOR" oninput="updateSponsorPreview()">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">自定义 HTML 代码 (高级，可选)：</label>
            <textarea id="sp-form-html" class="form-textarea" rows="2" placeholder="如需直接嵌入图片横幅或专属样式代码，可填在此处..." oninput="updateSponsorPreview()">${escapeHtml(currentAdData.customHtml || '')}</textarea>
          </div>

          <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="btn-primary" style="flex: 2;" onclick="saveSponsorAdData()">💾 保存并立即同步上线</button>
            <button class="btn-danger" style="flex: 1;" onclick="clearAndHideSponsorAd()">✕ 一键清空并隐藏</button>
          </div>
        </div>

        <!-- 右侧：实时拟真预览 -->
        <div>
          <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 14px;">👀 博客端 1:1 实时渲染效果预览</h3>
          <div style="background: var(--bg-primary); border: 1px dashed var(--border); border-radius: var(--radius-md); padding: 20px; min-height: 240px; display: flex; align-items: center; justify-content: center;" id="sponsor-mockup-wrap">
            <!-- 实时预览挂载点 -->
          </div>
          <div style="margin-top: 16px; font-size: 0.85rem; color: var(--text-dim); line-height: 1.6;">
            📌 <strong>自主配置规则说明：</strong><br>
            1. 当您填写标题与链接并点击保存后，博客首页或对应博文将<strong>实时展示</strong>您的广告！<br>
            2. 若您点击「一键清空并隐藏」，该广告位将自动恢复为<strong>空闲状态</strong>，博客前端将完全隐藏该区域，不占用任何页面空间。
          </div>
        </div>
      </div>
    </div>
  `;

  updateSponsorPreview();
}

function switchSponsorSlot(slotKey) {
  activeSponsorSlot = slotKey;
  renderSponsorDashboard();
}

function updateSponsorPreview() {
  const wrap = document.getElementById('sponsor-mockup-wrap');
  if (!wrap) return;

  const title = (document.getElementById('sp-form-title')?.value || '').trim();
  const desc = (document.getElementById('sp-form-desc')?.value || '').trim();
  const linkUrl = (document.getElementById('sp-form-url')?.value || '#').trim();
  const linkText = (document.getElementById('sp-form-btn')?.value || '立即了解 ↗').trim();
  const badge = (document.getElementById('sp-form-badge')?.value || 'SPONSOR').trim();
  const customHtml = (document.getElementById('sp-form-html')?.value || '').trim();

  if (!title && !customHtml) {
    wrap.innerHTML = `
      <div style="text-align: center; color: var(--text-dim); padding: 30px;">
        <div style="font-size: 2rem; margin-bottom: 8px;">⚪</div>
        <strong>当前为【空闲未配置】状态</strong><br>
        <span style="font-size: 0.8rem;">(在博客前端将完全隐藏，不显示空白框)</span>
      </div>
    `;
    return;
  }

  if (customHtml) {
    wrap.innerHTML = `<div class="ad-card" style="width: 100%;">${customHtml}</div>`;
    return;
  }

  wrap.innerHTML = `
    <div class="ad-card" style="width: 100%;">
      <div style="flex: 1;">
        <span class="ad-badge">${escapeHtml(badge)}</span>
        <h4 class="ad-title">${escapeHtml(title)}</h4>
        <p class="ad-desc">${escapeHtml(desc)}</p>
      </div>
      <a href="${escapeHtml(linkUrl)}" target="_blank" rel="noopener noreferrer" class="ad-btn">
        ${escapeHtml(linkText)}
      </a>
    </div>
  `;
}

function saveSponsorAdData() {
  if (!activeSponsorSlot || !currentSponsorObj) return;

  const title = (document.getElementById('sp-form-title')?.value || '').trim();
  const desc = (document.getElementById('sp-form-desc')?.value || '').trim();
  const linkUrl = (document.getElementById('sp-form-url')?.value || '').trim();
  const linkText = (document.getElementById('sp-form-btn')?.value || '立即了解 ↗').trim();
  const badge = (document.getElementById('sp-form-badge')?.value || 'SPONSOR').trim();
  const customHtml = (document.getElementById('sp-form-html')?.value || '').trim();

  const adPayload = {
    enabled: true,
    title,
    desc,
    linkUrl,
    linkText,
    badge,
    customHtml,
    imageUrl: '',
    updatedAt: new Date().toISOString()
  };

  // 1. 同步更新本地状态
  if (!window.APP_STATE.ads) window.APP_STATE.ads = {};
  window.APP_STATE.ads[activeSponsorSlot] = {
    ...window.APP_STATE.ads[activeSponsorSlot],
    ...adPayload
  };

  // 2. 持久化存储
  try {
    localStorage.setItem('xzt_ads', JSON.stringify(window.APP_STATE.ads));
  } catch(e) {}

  // 3. 异步尝试请求后端 API
  fetch('/api/sponsor/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: currentSponsorToken,
      slot: activeSponsorSlot,
      adData: adPayload
    })
  }).catch(() => {});

  // 4. 重新刷新前台广告
  renderAllAds(window.APP_STATE.ads);

  showToast(`🎉 恭喜！【${SLOT_LABELS[activeSponsorSlot]}】广告已成功保存并立即在博客前端发布生效！`, 'success');
  renderSponsorDashboard();
}

function clearAndHideSponsorAd() {
  showConfirmModal(
    '确认清空广告位',
    `确定要清空【${SLOT_LABELS[activeSponsorSlot]}】的广告内容吗？\n清空后该位置将成为空闲状态，博客前端将完全隐藏该广告！`,
    () => {
      const emptyAd = {
        enabled: false,
        title: '',
        desc: '',
        linkUrl: '',
        linkText: '',
        badge: '',
        customHtml: '',
        imageUrl: '',
        updatedAt: new Date().toISOString()
      };

      window.APP_STATE.ads[activeSponsorSlot] = emptyAd;
      try {
        localStorage.setItem('xzt_ads', JSON.stringify(window.APP_STATE.ads));
      } catch(e) {}

      fetch('/api/sponsor/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: currentSponsorToken,
          slot: activeSponsorSlot,
          adData: emptyAd
        })
      }).catch(() => {});

      renderAllAds(window.APP_STATE.ads);
      showToast(`✓ 该广告位已清空置为空闲，博客前端已立即隐藏！`, 'info');
      renderSponsorDashboard();
    }
  );
}
