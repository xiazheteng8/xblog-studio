/* Load after admin.js (and runtime.js on Pages). Shared public-video form. */
'use strict';
renderAdminAITab = function (wrap) {
  const settings = window.APP_STATE.settings || {};
  const pages = typeof pagesAPIBase === 'function';
  const fields = pages ? '<p role="note">AI 需要可选 VPS API 和 VPS 管理员会话。模型与密钥在 VPS 配置。</p>' : [['aiProvider','服务商（openai / gemini）'],['aiModel','模型'],['aiBaseUrl','服务地址'],['aiModelKey','模型密钥']].map(([key,label]) => `<label class="form-label">${label}</label><input class="form-input" id="${key}" type="${key === 'aiModelKey' ? 'password' : 'text'}" value="${escapeHtml(settings[key] || '')}">`).join('') + '<button class="btn-secondary" onclick="saveAISettings()">保存模型配置</button>';
  wrap.innerHTML = `<h2>AI 视频创作</h2><p>支持任意 HTTP/HTTPS 公网视频链接、公开视频直链和普通网页。网站限制可能导致只能读取标题与说明；生成后会显示实际材料来源。</p>${fields}<label class="form-label" for="ai-video-url">视频或网页链接</label><input class="form-input" type="url" id="ai-video-url" placeholder="https://example.com/video"><label class="form-label" for="ai-subtitles">字幕（可选）</label><textarea class="form-textarea" rows="8" id="ai-subtitles" placeholder="可粘贴字幕；未提供时尝试自动读取，Gemini 可尝试理解视频"></textarea><button class="btn-primary" id="ai-generate-button" onclick="generateAIDraft()">生成草稿</button><p id="ai-generation-status" role="status"></p>`;
};
generateAIDraft = async function () {
  const button = document.getElementById('ai-generate-button');
  const status = document.getElementById('ai-generation-status');
  if (button?.disabled) return;
  try {
    const videoUrl = document.getElementById('ai-video-url')?.value.trim();
    let url;
    try { url = new URL(videoUrl); } catch (_) { throw new Error('请输入完整的 HTTP/HTTPS 公网链接'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('请输入不含凭据的 HTTP/HTTPS 公网链接');
    if (button) button.disabled = true;
    if (status) status.textContent = '正在获取视频材料并生成草稿，请稍候…';
    if (!await saveAISettings()) return;
    const result = await window.cmsRequest('/api/admin/ai/generate', {method:'POST', body:{videoUrl, subtitles:document.getElementById('ai-subtitles')?.value || ''}});
    const draft = result.draft || result.post || result;
    if (!draft.content) throw new Error('生成结果缺少正文');
    cmsGeneratedDraft = draft;
    editingPostId = null;
    currentAdminTab = 'editor';
    renderAdminView();
    ['title','summary'].forEach(key => { const field = document.getElementById('post-' + key); if (field) field.value = draft[key] || ''; });
    const yt = document.getElementById('post-yt'); if (yt) yt.value = draft.youtubeId || '';
    const tags = document.getElementById('post-tags-input'); if (tags) tags.value = (draft.tags || []).join(', ');
    const category = document.getElementById('post-cat'); if (category && draft.category) category.value = draft.category;
    const content = document.getElementById('post-content');
    const html = draft.contentFormat === 'html' || draft.displayConfig?.contentFormat === 'html' ? draft.content : window.CMSEditor.markdownToHtml(draft.content);
    if (content?.cmsEditor) content.cmsEditor.setHTML(html); else if (content) content.value = html;
    updateEditorCoverPreview();
    const notice = document.createElement('p');
    notice.setAttribute('role', 'status');
    notice.className = 'ai-source-notice';
    notice.textContent = '材料来源：' + ((result.sources || []).join('、') || '未报告') + '。' + (result.warnings || []).join('；');
    content?.parentElement?.insertBefore(notice, content);
    if ((result.warnings || []).length) showToast(escapeHtml(result.warnings.join('；')), 'info');
    showToast('草稿已填入编辑器，请审核材料来源与正文后保存发布', 'info');
  } catch (error) {
    if (status) status.textContent = '生成失败：' + error.message;
    showToast(escapeHtml(error.message), 'error');
  } finally { if (button) button.disabled = false; }
};
