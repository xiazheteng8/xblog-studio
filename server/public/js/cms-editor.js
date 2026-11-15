/* Shared, local WYSIWYG editor. No CDN or source-code input required. */
(function (global) {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function safeUrl(value, image = false) {
    if (!String(value || '').trim()) return '';
    if(image && /^data:(?:image\/(?:png|jpeg|gif|webp)|audio\/(?:mpeg|mp4|ogg|wav)|video\/(?:mp4|webm));base64,[A-Za-z0-9+/]+={0,2}$/.test(value))return value;
    try { const url = new URL(value, global.location?.origin || 'https://localhost'); return ['http:','https:'].includes(url.protocol) || (!image && url.protocol === 'mailto:') ? url.href : ''; } catch { return ''; }
  }
  function sanitize(html) {
    const template = document.createElement('template'); template.innerHTML = html || '';
    const allowed = new Set('P DIV BR H1 H2 H3 H4 H5 H6 STRONG B EM I U S UL OL LI BLOCKQUOTE PRE CODE A IMG TABLE THEAD TBODY TR TH TD HR AUDIO VIDEO SOURCE IFRAME SPAN'.split(' '));
    for (const element of [...template.content.querySelectorAll('*')]) {
      if (!allowed.has(element.tagName)) { if (['SCRIPT','STYLE','OBJECT','SVG','MATH'].includes(element.tagName)) element.remove(); else element.replaceWith(...element.childNodes); continue; }
      for (const attr of [...element.attributes]) {
        const name=attr.name;
        if (!['href','src','alt','title','controls','colspan','rowspan','allowfullscreen'].includes(name)) element.removeAttribute(name);
        else if (['href','src'].includes(name)) { const url=safeUrl(attr.value, name==='src' && ['IMG','AUDIO','VIDEO','SOURCE'].includes(element.tagName)); if(url)element.setAttribute(name,url);else element.removeAttribute(name); }
      }
      if(element.tagName==='IFRAME') { try { const url=new URL(element.src); if(!['www.youtube.com','www.youtube-nocookie.com','player.vimeo.com'].includes(url.hostname))element.remove(); else {element.setAttribute('title','视频');element.setAttribute('allowfullscreen','');} }catch{element.remove();} }
      if(element.tagName==='A')element.setAttribute('rel','noopener noreferrer');
    }
    return template.innerHTML;
  }
  function markdownToHtml(text) {
    if (global.marked?.parse) return sanitize(global.marked.parse(String(text || '')));
    // Offline fallback covers the legacy article blocks without interpreting raw HTML.
    const blocks=[]; let value=escape(text || '').replace(/```([^\n]*)\n([\s\S]*?)```/g,(_,lang,code)=>{blocks.push(`<pre><code>${code}</code></pre>`);return `\nCMSCODE${blocks.length-1}END\n`;});
    value=value.replace(/\|(.+)\|\n\|[-:| ]+\|\n((?:\|.+\|\n?)+)/g, (_,header,rows) => '<table><thead><tr>'+header.split('|').map(cell=>'<th>'+cell.trim()+'</th>').join('')+'</tr></thead><tbody>'+rows.trim().split('\n').map(row=>'<tr>'+row.replace(/^\||\|$/g,'').split('|').map(cell=>'<td>'+cell.trim()+'</td>').join('')+'</tr>').join('')+'</tbody></table>');
    value=value.replace(/^###### (.+)$/gm,'<h6>$1</h6>').replace(/^##### (.+)$/gm,'<h5>$1</h5>').replace(/^#### (.+)$/gm,'<h4>$1</h4>').replace(/^### (.+)$/gm,'<h3>$1</h3>').replace(/^## (.+)$/gm,'<h2>$1</h2>').replace(/^# (.+)$/gm,'<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*([^*\n]+)\*/g,'<em>$1</em>').replace(/`([^`]+)`/g,'<code>$1</code>').replace(/^&gt; (.+)$/gm,'<blockquote>$1</blockquote>').replace(/^[-*] (.+)$/gm,'<ul><li>$1</li></ul>').replace(/^\d+\. (.+)$/gm,'<ol><li>$1</li></ol>').replace(/^---+$/gm,'<hr>');
    value=value.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,(_,alt,url)=>`<img alt="${alt}" src="${escape(safeUrl(url,true))}">`).replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,label,url)=>`<a href="${escape(safeUrl(url))}">${label}</a>`);
    return sanitize(value.split(/\n\s*\n/).map(block=>/^\s*</.test(block)?block:`<p>${block.replace(/\n/g,'<br>')}</p>`).join('').replace(/CMSCODE(\d+)END/g,(_,i)=>blocks[Number(i)]));
  }
  function mount(target, options = {}) {
    if(typeof target==='string')target=document.getElementById(target);
    if(!target)return null;
    const shell=document.createElement('div');shell.className='cms-editor';
    shell.innerHTML='<div class="cms-editor-toolbar" role="toolbar" aria-label="文章排版工具"></div><div class="cms-editor-canvas" contenteditable="true" role="textbox" aria-multiline="true" aria-label="'+escape(options.label || '可视化正文')+'"></div><div class="cms-editor-status">所见即所得 · 可直接粘贴文字和图片</div>';
    target.replaceWith(shell);const canvas=shell.querySelector('.cms-editor-canvas'); const toolbar=shell.querySelector('.cms-editor-toolbar');
    canvas.id=target.id;canvas.innerHTML=options.format==='html'?sanitize(options.content):markdownToHtml(options.content);
    let range=null; const remember=()=>{const selection=global.getSelection();if(selection?.rangeCount && canvas.contains(selection.anchorNode))range=selection.getRangeAt(0).cloneRange();};
    canvas.addEventListener('keyup',remember);canvas.addEventListener('mouseup',remember);canvas.addEventListener('input',()=>{remember();status.textContent=`${canvas.textContent.length} 字 · 尚未保存`;});
    const status=shell.querySelector('.cms-editor-status');
    const command=(name,value)=>{canvas.focus();if(range){const selection=global.getSelection();selection.removeAllRanges();selection.addRange(range);}document.execCommand(name,false,value);remember();canvas.dispatchEvent(new Event('input',{bubbles:true}));};
    const buttons=[['正文','formatBlock','p'],['标题 1','formatBlock','h1'],['标题 2','formatBlock','h2'],['标题 3','formatBlock','h3'],['粗体','bold'],['斜体','italic'],['无序列表','insertUnorderedList'],['有序列表','insertOrderedList'],['引用','formatBlock','blockquote'],['代码块','formatBlock','pre'],['链接','link'],['图片','image'],['表格','table'],['删除表格','deleteTable'],['上传图片','uploadImage'],['上传视频','uploadVideo'],['上传附件','uploadFile'],['视频','video'],['分隔线','insertHorizontalRule'],['撤销','undo'],['重做','redo']];
    buttons.forEach(([label,name,value])=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.title=label;button.setAttribute('aria-label',label);button.addEventListener('mousedown',event=>event.preventDefault());button.addEventListener('click',()=>{
      if(['link','image','video'].includes(name)) {const url=safeUrl(global.prompt(name==='link'?'链接地址':name==='image'?'图片地址':'视频地址（YouTube 或 MP4）')||'',name!=='link');if(!url)return;
        if(name==='link')command('createLink',url); else if(name==='image')command('insertImage',url);else {const parsed=new URL(url);const id=parsed.hostname==='youtu.be'?parsed.pathname.slice(1):(/(^|\.)youtube\.com$/.test(parsed.hostname)?parsed.searchParams.get('v') || parsed.pathname.split('/').pop():null);command('insertHTML',id&&/^[\w-]{11}$/.test(id)?`<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="视频" allowfullscreen></iframe><p><br></p>`:`<video controls src="${escape(url)}"></video><p><br></p>`);} }
      else if(name==='table') {
        const rows=global.prompt('表格行数（1–30，包含标题行）','3');if(rows===null)return;
        const cols=global.prompt('表格列数（1–12）','2');if(cols===null)return;
        if(!/^\d+$/.test(rows)||!/^\d+$/.test(cols)||Number(rows)<1||Number(rows)>30||Number(cols)<1||Number(cols)>12){status.textContent='请输入 1–30 行、1–12 列';return;}
        command('insertHTML','<table><tbody>'+Array.from({length:Number(rows)},(_,r)=>'<tr>'+Array.from({length:Number(cols)},()=>r===0?'<th>标题</th>':'<td>内容</td>').join('')+'</tr>').join('')+'</tbody></table><p><br></p>');
      } else if(name==='deleteTable')removeTable();
      else if(name.startsWith('upload'))chooseFile(name);
      else command(name,value);
    });toolbar.appendChild(button);});
    canvas.addEventListener('paste',event=>{const data=event.clipboardData;if(!data)return;event.preventDefault();const image=[...data.items].find(item=>item.type.startsWith('image/'));if(image){const file=image.getAsFile();if(file)uploadFile(file);return;}command('insertHTML',data.getData('text/html')?sanitize(data.getData('text/html')):escape(data.getData('text/plain')).replace(/\n/g,'<br>'));});
    const deleteButton=[...toolbar.querySelectorAll('button')].find(button=>button.textContent==='删除表格');
    let selectedTable=null;deleteButton.hidden=true;
    function updateTable(){const node=global.getSelection()?.anchorNode;const element=node?.nodeType===1?node:node?.parentElement;selectedTable=canvas.contains(element)?element?.closest('table'):null;deleteButton.hidden=!selectedTable;}
    function removeTable(){if(!selectedTable||!canvas.contains(selectedTable))return;const table=selectedTable;selectedTable=null;table.remove();range=null;deleteButton.hidden=true;canvas.focus();canvas.dispatchEvent(new Event('input',{bubbles:true}));}
    canvas.addEventListener('click',updateTable);canvas.addEventListener('keyup',updateTable);
    document.addEventListener('selectionchange',()=>{if(global.getSelection()?.anchorNode && canvas.contains(global.getSelection().anchorNode))updateTable();});
    function chooseFile(kind){remember();const input=document.createElement('input');input.type='file';input.accept=kind==='uploadImage'?'image/png,image/jpeg,image/gif,image/webp':kind==='uploadVideo'?'video/mp4,video/webm':'.pdf,.txt,.csv,.zip,.mp3,.m4a,.ogg,.wav';input.addEventListener('change',()=>{if(input.files[0])uploadFile(input.files[0]);});input.click();}
    async function uploadFile(file){
      const extension=file.name.split('.').pop().toLowerCase();
      const types={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',mp4:'video/mp4',webm:'video/webm',mp3:'audio/mpeg',m4a:'audio/mp4',ogg:'audio/ogg',wav:'audio/wav',pdf:'application/pdf',txt:'text/plain',csv:'text/csv',zip:'application/zip'};
      const mime=types[extension];const image=mime?.startsWith('image/');const media=/^(audio|video)\//.test(mime||'');
      if(!mime){status.textContent='不支持此文件类型';return;}
      const limit=(image?10:media?50:20)*1024*1024;
      if(!file.size||file.size>limit){status.textContent=`文件为空或超过 ${limit/1024/1024} MB`;return;}
      remember();status.textContent='正在上传…';
      try {
        const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('读取文件失败'));reader.readAsDataURL(file);});
        let url;
        if(typeof global.cmsRequest==='function' && !(typeof global.pagesAPIBase==='function' && !global.pagesAPIBase())) {const result=await global.cmsRequest('/api/admin/upload',{method:'POST',body:{filename:file.name,mime,data:dataUrl.split(',')[1]}});url=typeof global.pagesAPIBase==='function'?new URL(result.url,global.pagesAPIBase()+'/').href:result.url;}
        else {if(!image&&!media)throw new Error('静态版支持嵌入图片、音频和视频；附件请使用公开链接');url='data:'+mime+';base64,'+dataUrl.split(',')[1];}
        if(image)command('insertHTML',`<img src="${escape(url)}" alt="${escape(file.name)}"><p><br></p>`);
        else if(media){const tag=mime.startsWith('audio/')?'audio':'video';command('insertHTML',`<${tag} controls src="${escape(url)}"></${tag}><p><br></p>`);}
        else command('insertHTML',`<a href="${escape(url)}">${escape(file.name)}</a>`);
        status.textContent='文件已插入 · 请保存文章';
      } catch(error){status.textContent=error.message||'上传失败';}
    }
    const api={getHTML:()=>sanitize(canvas.innerHTML),setHTML:html=>{canvas.innerHTML=sanitize(html);range=null;selectedTable=null;deleteButton.hidden=true;},element:canvas};canvas.cmsEditor=api;return api;
  }
  global.CMSEditor={mount,sanitize,markdownToHtml,safeUrl};
})(window);
