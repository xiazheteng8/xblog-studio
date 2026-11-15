/* Load after runtime.js: additive page management and compact OAuth forms. */
(() => {
  const originalPages = renderAdminPagesManagerTab;
  const originalSettings = renderAdminSettingsTab;
  const originalOAuth = renderAdminOAuthUsersTab;
  const originalAdmin = renderAdminView;
  const originalHeader = updateHeaderFooterDOM;
  const originalRoute = handleRoute;
  const reserved = new Set(['home','about','legal','blog','admin','post','sponsor']);
  const pages = () => Array.isArray(window.APP_STATE.customPages) ? window.APP_STATE.customPages : [];
  let editingSlug = null;
  function refreshNav() {
    document.querySelectorAll('[data-custom-nav]').forEach(node => node.remove());
    const nav = document.querySelector('.nav-tabs-center');
    pages().filter(page => page.showInNav).forEach(page => {
      const link = document.createElement('a');
      link.className = 'nav-tab-btn'; link.dataset.customNav = page.slug;
      link.href = '#page?slug=' + encodeURIComponent(page.slug); link.textContent = page.title;
      nav?.appendChild(link);
    });
  }
  updateHeaderFooterDOM = function() { originalHeader(); refreshNav(); };
  renderAdminPagesManagerTab = function(wrap, key) {
    originalPages(wrap, key);
    const panel = document.createElement('section'); panel.className = 'custom-pages-panel';
    panel.innerHTML = '<div class="custom-page-heading"><h3>自定义页面</h3><button type="button" class="btn-primary" id="custom-add-page">添加新页面</button></div><div id="custom-page-list"></div><div id="custom-page-editor"></div>';
    wrap.prepend(panel);
    panel.querySelector('#custom-add-page').onclick = () => editPage(null);
    const list = panel.querySelector('#custom-page-list');
    pages().forEach(page => {
      const row = document.createElement('div'); row.className = 'custom-page-row';
      const title = document.createElement('a'); title.href = '#page?slug=' + encodeURIComponent(page.slug); title.textContent = page.title;
      const edit = document.createElement('button'); edit.className='btn-secondary'; edit.textContent='编辑页面'; edit.onclick=()=>editPage(page);
      const remove = document.createElement('button'); remove.className='btn-danger'; remove.textContent='删除页面';
      remove.onclick=()=>showConfirmModal('删除页面','确定删除此自定义页面？',async()=>{
        const previous=window.APP_STATE.customPages;window.APP_STATE.customPages=pages().filter(item=>item.slug!==page.slug);
        if(!await persistAdminChanges()){window.APP_STATE.customPages=previous;return;}
        refreshNav();renderAdminPagesManagerTab(wrap);showToast('页面已删除','success');
      });
      row.append(title,edit,remove);list.appendChild(row);
    });
  };
  function editPage(page) {
    editingSlug = page?.slug ?? null;
    const editor=document.getElementById('custom-page-editor');
    editor.innerHTML=`<form id="custom-page-form"><h3>${page?'编辑页面':'添加新页面'}</h3><label class="form-label" for="custom-page-title">标题</label><input id="custom-page-title" class="form-input" required maxlength="120"><label class="form-label" for="custom-page-slug">slug（小写字母、数字和连字符）</label><input id="custom-page-slug" class="form-input" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxlength="80"><label class="form-label" for="custom-page-content">可视化内容</label><textarea id="custom-page-content" class="form-textarea" rows="8"></textarea><label class="cms-choice"><input type="checkbox" id="custom-page-nav" checked>在导航中显示</label><div class="custom-page-actions"><button type="submit" class="btn-primary">保存页面</button><button type="button" class="btn-secondary" id="custom-page-cancel">取消</button></div></form>`;
    document.getElementById('custom-page-title').value=page?.title||'';
    document.getElementById('custom-page-slug').value=page?.slug||'';
    document.getElementById('custom-page-nav').checked=page?.showInNav!==false;
    const body=document.getElementById('custom-page-content');body.value=page?.content||'';
    const richEditor=window.CMSEditor?.mount(body,{content:body.value,format:'html'});
    document.getElementById('custom-page-cancel').onclick=()=>editor.replaceChildren();
    document.getElementById('custom-page-form').onsubmit=async event=>{
      event.preventDefault();const title=document.getElementById('custom-page-title').value.trim();const slug=document.getElementById('custom-page-slug').value.trim();
      if(!title||!/[a-z0-9]/.test(slug)||!/^([a-z0-9]+)(-[a-z0-9]+)*$/.test(slug)||reserved.has(slug)||pages().some(item=>item.slug===slug&&item.slug!==editingSlug)){showToast('请输入有效且不重复的 slug，不能使用系统页面名称','error');return;}
      const previous=window.APP_STATE.customPages;
      const next={...(pages().find(item=>item.slug===editingSlug)||{}),title,slug,content:richEditor?richEditor.getHTML():body.value,contentFormat:'html',showInNav:document.getElementById('custom-page-nav').checked};
      window.APP_STATE.customPages=[...pages().filter(item=>item.slug!==editingSlug),next];
      if(!await persistAdminChanges()){window.APP_STATE.customPages=previous;return;}
      refreshNav();renderAdminPagesManagerTab(document.getElementById('admin-subcontent'));showToast('页面已保存','success');
    };
    document.getElementById('custom-page-title').focus();
  }
  // Keep the listener registered by initBlog pointing at the extended router.
  window.removeEventListener('hashchange',originalRoute);
  handleRoute=function(){
    const custom=document.getElementById('custom-page-view');if(custom)custom.style.display='none';
    if(!location.hash.startsWith('#page?')){originalRoute();return;}
    document.querySelectorAll('.main-wrapper > div').forEach(node=>node.style.display='none');
    document.querySelectorAll('.nav-tab-btn').forEach(node=>node.classList.remove('active'));
    let view=custom;if(!view){view=document.createElement('div');view.id='custom-page-view';document.querySelector('.main-wrapper').appendChild(view);}
    view.style.display='block';const slug=new URLSearchParams(location.hash.split('?')[1]).get('slug');const page=pages().find(item=>item.slug===slug);
    view.innerHTML='<article class="legal-portal-card custom-page-article"><a href="#home">← 返回首页</a><h1></h1><div class="markdown-body"></div></article>';
    view.querySelector('h1').textContent=page?.title||'未找到该页面';
    view.querySelector('.markdown-body').innerHTML=window.CMSEditor?window.CMSEditor.sanitize(page?.content||''):escapeHtml(page?.content||'');
    [...document.querySelectorAll('[data-custom-nav]')].find(node=>node.dataset.customNav===slug)?.classList.add('active');window.scrollTo(0,0);
  };
  window.addEventListener('hashchange',handleRoute);
  function compactOAuth(wrap) {
    if(wrap.querySelector('#cfg-oauth-platform'))return;
    // The static runtime intentionally omits secret fields; present the same compact
    // configuration form locally without changing its sanitized public export.
    if(!wrap.querySelector('#cfg-site-url'))wrap.insertAdjacentHTML('beforeend',cmsOAuthFields()+'<button class="btn-primary" onclick="saveOAuthPlatformSettings()">保存登录配置</button>');
    const select=document.createElement('select');select.id='cfg-oauth-platform';select.className='form-select';select.setAttribute('aria-label','OAuth 授权平台');
    const label=document.createElement('label');label.className='form-label';label.htmlFor=select.id;label.textContent='OAuth 授权平台';
    const site=wrap.querySelector('#cfg-site-url');site.parentElement.after(label,select);
    const dirty=new Set();
    cmsOAuthPlatforms.forEach(platform=>{
      select.add(new Option({google:'Google',github:'GitHub',qq:'QQ',wechat:'微信'}[platform],platform));
      const field=wrap.querySelector(`#cfg-${platform}-enabled`)?.closest('fieldset');if(field){field.dataset.oauthPlatform=platform;field.addEventListener('input',()=>dirty.add(platform));field.addEventListener('change',()=>dirty.add(platform));}
    });
    const reveal=()=>wrap.querySelectorAll('[data-oauth-platform]').forEach(field=>{field.hidden=field.dataset.oauthPlatform!==select.value;});select.onchange=reveal;reveal();
    wrap.cmsOAuthDirty=dirty;bindCMSCallbackPreview(wrap);
  }
  collectCMSOAuthSettings=function(){
    const input=document.getElementById('cfg-site-url');if(!input)return;
    const parsed=new URL(input.value.trim());if(!['http:','https:'].includes(parsed.protocol))throw new Error('站点 URL 必须使用 HTTP 或 HTTPS');
    const settings=window.APP_STATE.settings ||= {};settings.siteUrl=input.value.trim().replace(/\/$/,'');
    settings.oauthConfig={...(window.APP_STATE.oauthConfig||{}),...(settings.oauthConfig||{})};
    const selected=document.getElementById('cfg-oauth-platform')?.value;
    const dirty=document.getElementById('admin-subcontent')?.cmsOAuthDirty || new Set();
    cmsOAuthPlatforms.forEach(platform=>{
      const old=settings.oauthConfig[platform]||{};
      if(platform===selected||dirty.has(platform))settings.oauthConfig[platform]={...old,enabled:!!document.getElementById(`cfg-${platform}-enabled`)?.checked,clientId:document.getElementById(`cfg-${platform}-id`)?.value.trim()||'',clientSecret:document.getElementById(`cfg-${platform}-secret`)?.value||'',adminIdentifier:document.getElementById(`cfg-${platform}-admin`)?.value.trim()||'',callbackUrl:cmsCallback(platform)};
      else if(settings.oauthConfig[platform])settings.oauthConfig[platform]={...old,callbackUrl:cmsCallback(platform)};
    });
  };
  renderAdminSettingsTab=function(wrap){originalSettings(wrap);const heading=wrap.querySelector('h2');if(heading)heading.textContent='数据备份和登录配置';compactOAuth(wrap);const localSave=wrap.querySelector('#pages-save-account');if(localSave){const save=localSave.onclick;localSave.onclick=async()=>{try{collectCMSOAuthSettings();await save();}catch(error){showToast(escapeHtml(error.message),'error');}};}};
  renderAdminOAuthUsersTab=function(wrap){originalOAuth(wrap);compactOAuth(wrap);};
  renderAdminView=function(){originalAdmin();const item=document.querySelector('[onclick="switchAdminTab(\'settings\')"]');if(item)item.textContent='⚙️ 数据备份和登录配置';};
  refreshNav();if(location.hash.startsWith('#page?'))handleRoute();
})();
