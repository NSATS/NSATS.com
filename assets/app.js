/* Static review interactions. No requests, tracking, or form delivery. */
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const base = document.body.dataset.base || './';
  const KEY = 'nsats-template-review-v1';
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
  let reviews = read(KEY, {});
  if (!reviews || typeof reviews !== 'object' || Array.isArray(reviews)) reviews = {};
  // Page colours follow the approved section register. An older review-preview
  // preference must never recolour the public site; the standalone comparison
  // retains its own isolated component-preview preferences.
  document.documentElement.dataset.theme = document.documentElement.dataset.sectionTheme;
  const menu = $('#main-navigation');
  // Batch 3 (12 November 2026). While the folded menu is open the page behind does not scroll,
  // and the panel ends at the bottom edge of the screen.
  if (menu) {
    const syncMenu = () => {
      const open = menu.classList.contains('open');
      document.documentElement.classList.toggle('nsats-menu-open', open);
      if (open) menu.style.setProperty('--nsats-menu-max', Math.max(120, innerHeight - Math.round($('.masthead').getBoundingClientRect().bottom)) + 'px');
    };
    new MutationObserver(syncMenu).observe(menu, {attributes: true, attributeFilter: ['class']});
    addEventListener('resize', () => {
      const button = $('#mobile-menu');
      if (menu.classList.contains('open') && button && button.offsetParent === null) { menu.classList.remove('open'); button.setAttribute('aria-expanded', 'false'); }
      else syncMenu();
    });
    // On phones the grey bar's entries and the licensing button join the end of the menu; on wider screens they go back.
    const bar = $('.utility-links'), cta = $('.header-cta');
    if (bar) {
      const phone = matchMedia('(max-width:760px)');
      const barItems = [...bar.children], ctaParent = cta?.parentNode, ctaNext = cta?.nextSibling;
      const place = () => {
        barItems.forEach(el => { el.classList.toggle('nsats-moved', phone.matches); (phone.matches ? menu : bar).append(el); });
        if (cta) { cta.classList.toggle('nsats-moved', phone.matches); if (phone.matches) menu.append(cta); else ctaParent.insertBefore(cta, ctaNext); }
        document.documentElement.classList.toggle('nsats-bar-in-menu', phone.matches);
      };
      place(); phone.addEventListener('change', place);
    }
  }
  $('#mobile-menu')?.addEventListener('click', e => {
    const expanded = menu.classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded', String(expanded));
    if (expanded) { $$('.mega').forEach(d=>d.open=false); $('#header-search').classList.remove('open'); $('#mobile-search').setAttribute('aria-expanded','false'); }
  });
  $('#mobile-search')?.addEventListener('click', e => {
    const expanded = $('#header-search').classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded', String(expanded));
    if (expanded) { $$('.mega').forEach(d=>d.open=false); menu.classList.remove('open'); $('#mobile-menu').setAttribute('aria-expanded','false'); $('#header-query').focus(); }
  });
  $$('.mega').forEach(d => d.addEventListener('toggle', () => {
    if (d.open) $$('.mega').filter(other => other !== d).forEach(other => other.open = false);
  }));
  // Batch 3 correction A (12 November 2026). An open desktop panel ends at the bottom edge of the screen,
  // measured from where the panel actually starts (the header is shorter once the page is scrolled).
  const fitPanel = () => {
    const d = $('.mega[open]'), panel = d && $('.mega-panel', d);
    if (!panel) return;
    if (matchMedia('(min-width:1201px)').matches) panel.style.setProperty('--nsats-panel-max', Math.max(160, Math.ceil(innerHeight - panel.getBoundingClientRect().top)) + 'px');
    else panel.style.removeProperty('--nsats-panel-max');
  };
  $$('.mega').forEach(d => d.addEventListener('toggle', fitPanel));
  addEventListener('scroll', fitPanel, {passive: true});
  addEventListener('resize', fitPanel);
  document.addEventListener('click', e => {
    if (!e.target.closest('details.mega')) $$('.mega').forEach(d => d.open = false);
    if (menu?.classList.contains('open') && !e.target.closest('.masthead')) { menu.classList.remove('open'); $('#mobile-menu').setAttribute('aria-expanded','false'); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const active = $('.mega[open]');
      if (active) { active.open = false; $('summary', active).focus(); }
      if (menu?.classList.contains('open')) { menu.classList.remove('open'); $('#mobile-menu').setAttribute('aria-expanded','false'); $('#mobile-menu').focus(); }
      if ($('#header-search')?.classList.contains('open')) { $('#header-search').classList.remove('open'); $('#mobile-search').setAttribute('aria-expanded','false'); $('#mobile-search').focus(); }
    }
  });
  const portfolio = $('.portfolio details');
  if (portfolio) {
    const mq = matchMedia('(min-width:1000px)');
    const adapt = () => portfolio.open = mq.matches;
    adapt(); mq.addEventListener('change', adapt);
  }
  $$('[data-open-locale]').forEach(b => b.addEventListener('click', () => $('#locale-dialog').showModal()));
  $$('[data-close-dialog]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
  $$('[data-print]').forEach(b => b.addEventListener('click', () => print()));
  $$('[data-copy-link]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href); b.textContent = 'Link copied'; }
    catch { b.textContent = 'Copy the address from your browser'; }
  }));
  const VALID_STATUS = ['Not reviewed','Changes requested','Approved'];
  function reviewValue(id) {
    const item = reviews[id];
    return item && typeof item === 'object' ? item : {status:'Not reviewed',notes:''};
  }
  function updateTrackerLabels() {
    $$('[data-review-status]').forEach(el => el.textContent = reviewValue(el.dataset.reviewStatus).status || 'Not reviewed');
    const count = $('#approved-count');
    if (count) count.textContent = (window.NSATS_DATA || []).filter(r => reviewValue(r.id).status === 'Approved').length;
  }
  function bindReview(form, id) {
    const value = reviewValue(id);
    $('[name=status]',form).value = VALID_STATUS.includes(value.status) ? value.status : 'Not reviewed';
    $('[name=notes]',form).value = typeof value.notes === 'string' ? value.notes : '';
    form.onsubmit = e => {
      e.preventDefault();
      reviews[id] = {status:$('[name=status]',form).value, notes:$('[name=notes]',form).value.slice(0,10000),updated:new Date().toISOString()};
      const ok = save(KEY,reviews);
      $('[role=status]',form).textContent = ok ? 'Saved in this browser. Export your review for a portable backup.' : 'Browser storage unavailable. Export your review now to keep these changes.';
      updateTrackerLabels(); filterTracker();
    };
  }
  $$('form[data-review-id]').forEach(form => bindReview(form,form.dataset.reviewId));
  const dialog = $('#review-dialog');
  $$('[data-review-page]').forEach(b => b.addEventListener('click', () => {
    const row = (window.NSATS_DATA || []).find(r => r.id === b.dataset.reviewPage);
    $('#review-title').textContent = row ? `${row.id} · ${row.title}` : b.dataset.reviewPage;
    bindReview($('form',dialog),b.dataset.reviewPage);
    $('[role=status]',dialog).textContent = '';
    dialog.showModal();
  }));
  const text = s => String(s || '').toLowerCase();
  const trackerRows = $$('tr[data-page-id]');
  function filterTracker() {
    if (!trackerRows.length) return;
    const q = text($('#tracker-query')?.value).trim();
    const portfolio = $('#tracker-portfolio')?.value || '';
    const template = $('#tracker-template')?.value || '';
    const status = $('#tracker-status')?.value || '';
    const priority = $('#tracker-priority')?.value || '';
    let shown=0;
    trackerRows.forEach(row => {
      const visible = (!q || q.split(/\s+/).every(term => text(row.dataset.search).includes(term))) && (!portfolio || row.dataset.portfolio===portfolio) && (!template || row.dataset.template===template) && (!status || reviewValue(row.dataset.pageId).status===status) && (!priority || row.dataset.priority===priority);
      row.hidden=!visible; if(visible) shown++;
    });
    $('#tracker-count').textContent = `${shown} of ${trackerRows.length} destinations`;
    $('#tracker-empty').hidden = shown !== 0;
  }
  $$('#tracker-filters input, #tracker-filters select').forEach(el => el.addEventListener('input',filterTracker));
  $('#clear-filters')?.addEventListener('click',() => { $('#tracker-filters').reset(); filterTracker(); });
  updateTrackerLabels(); filterTracker();
  function download(name, content, type) {
    const url=URL.createObjectURL(new Blob([content],{type}));
    const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
    const preview=$('#export-preview');
    if(preview){
      preview.hidden=false;
      $('#export-filename').textContent=name;
      $('#export-content').value=content;
      $('#export-status').textContent=`${name} is ready. If your browser did not download it, open the export text below and save a copy.`;
    }
  }
  $$('[data-export-review]').forEach(b=>b.addEventListener('click',()=>download('NSATS-review-backup.json',JSON.stringify({schema:1,exported:new Date().toISOString(),theme:document.documentElement.dataset.theme,colourMode:'sections',reviews},null,2),'application/json')));
  $('#import-review')?.addEventListener('change',async e=>{
    const status=$('#import-status');
    try {
      const file=e.target.files[0]; if(!file)return;
      if(file.size>2e6)throw Error('The backup is too large.');
      const data=JSON.parse(await file.text());
      if(data.schema!==1 || !data.reviews || typeof data.reviews!=='object')throw Error('Choose a valid NSATS review backup.');
      const known=new Set([...(window.NSATS_DATA||[]).map(r=>r.id),...(window.NSATS_TEMPLATES||[]).map(t=>t.id),'THEME','NAVIGATION','VARIANT-homepage-image-left','VARIANT-homepage-panorama','VARIANT-homepage-editorial','VARIANT-portfolio-image-right']);
      let n=0;
      for(const [id,value] of Object.entries(data.reviews)){
        if(known.has(id)&&value&&VALID_STATUS.includes(value.status)&&typeof value.notes==='string'){
          reviews[id]={status:value.status,notes:value.notes.slice(0,10000),updated:typeof value.updated==='string'?value.updated:''};n++;
        }
      }
      const saved=save(KEY,reviews); if([...THEMES,'sections'].includes(data.colourMode))applyTheme(data.colourMode); else if(THEMES.includes(data.theme))applyTheme(data.theme);
      updateTrackerLabels();filterTracker();
      status.textContent=`Imported ${n} review records. ${saved?'Saved in this browser.':'Browser storage unavailable; export before leaving.'}`;
    }catch(err){status.textContent=err.message;} e.target.value='';
  });
  $('#export-csv')?.addEventListener('click',()=>{
    const quote=value=>'"'+String(value??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
    const fields=['id','title','url','portfolio','section','template','variant','palette','preview','image_layout','priority','status','prerequisite','review','notes'];
    const rows=(window.NSATS_DATA||[]).map(r=>({...r,review:reviewValue(r.id).status,notes:reviewValue(r.id).notes}));
    download('NSATS-page-template-register.csv',[fields.map(quote).join(','),...rows.map(r=>fields.map(f=>quote(r[f])).join(','))].join('\r\n'),'text/csv;charset=utf-8');
  });
  const searchForm=$('#site-search-form');
  function renderSearch(){
    if(!searchForm)return;
    const query=$('#search-query').value.trim().toLowerCase();
    const portfolio=$('#search-portfolio').value;
    const template=$('#search-type').value;
    const rows=(window.NSATS_DATA||[]).filter(r=>(!query||query.split(/\s+/).every(word=>text(`${r.title} ${r.id} ${r.purpose} ${r.section} ${r.portfolio}`).includes(word)))&&(!portfolio||r.portfolio===portfolio)&&(!template||r.template===template));
    const target=$('#search-results');target.replaceChildren();
    for(const r of rows){
      const li=document.createElement('li'), heading=document.createElement('h2'), link=document.createElement('a'), p=document.createElement('p'), meta=document.createElement('div'), sample=document.createElement('a');
      link.href=`${base}briefs/${r.id}.html`;link.textContent=r.title;heading.append(link);p.textContent=r.purpose;
      meta.className='meta';meta.textContent=`${r.portfolio} · ${r.template} · Planning brief`;
      sample.href=`${base}templates/${r.sample}.html`;sample.textContent='View assigned sample →';
      li.append(heading,p,meta,sample);target.append(li);
    }
    $('#search-count').textContent=`${rows.length} ${rows.length===1?'destination':'destinations'} found`;
    $('#search-empty').hidden=rows.length!==0;
  }
  if(searchForm){
    $('#search-query').value=new URLSearchParams(location.search).get('q')||'';
    searchForm.addEventListener('submit',e=>{e.preventDefault();const url=new URL(location.href);url.searchParams.set('q',$('#search-query').value);history.replaceState({},'',url);renderSearch();});
    $$('select',searchForm).forEach(s=>s.addEventListener('change',renderSearch));renderSearch();
  }
  $$('[data-resource-filter]').forEach(input=>input.addEventListener('input',()=>{
    const q=text(input.value);let n=0;
    $$('[data-resource]').forEach(el=>{el.hidden=!text(el.textContent).includes(q);if(!el.hidden)n++;});
    $('#resource-count').textContent=`${n} sample ${n===1?'resource':'resources'}`;$('#resource-empty').hidden=n>0;
  }));
  // Form demonstrations validate locally and never send or retain personal data.
  $$('form[data-demo-form]').forEach(form=>{
    form.hidden=false;
    const panels=$$('[data-step]',form);let step=0;
    const status=$('[data-form-errors]',form);
    function showStep(moveFocus=true){panels.forEach((p,i)=>{p.hidden=i!==step;p.disabled=i!==step;});$$('.steps li',form).forEach((li,i)=>{if(i===step)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');});$('[data-back]',form).hidden=step===0;$('[data-next]',form).hidden=step>=panels.length-1;$('[type=submit]',form).hidden=step!==panels.length-1;if(moveFocus)$('legend',panels[step])?.focus();}
    function validate(panel){
      const fields=$$('input,select,textarea',panel).filter(f=>!f.disabled);const invalid=[];
      fields.forEach(field=>{
        const error=$(`#${field.id}-error`,form);const bad=!field.checkValidity();
        field.setAttribute('aria-invalid',String(bad));if(error)error.textContent=bad?(field.type==='email'?'Enter an email address in the format name@example.com.':`Complete ${$('label[for="'+field.id+'"]',form)?.textContent.replace(' (optional)','').toLowerCase()||'this field'}.`):'';
        if(bad)invalid.push(field);
      });
      status.hidden=invalid.length===0;
      if(invalid.length){$('[data-error-message]',status).textContent=`Check ${invalid.length} ${invalid.length===1?'field':'fields'} below. Your entries have been kept.`;status.focus();}
      return invalid.length===0;
    }
    $('[data-next]',form)?.addEventListener('click',()=>{if(validate(panels[step])){step++;showStep();}});
    $('[data-back]',form)?.addEventListener('click',()=>{step--;status.hidden=true;showStep();});
    form.addEventListener('submit',e=>{
      e.preventDefault();if(!validate(panels.length?panels[step]:form))return;
      if(panels.length&&step<panels.length-1){step++;showStep();return;}
      form.hidden=true;const done=form.nextElementSibling;done.hidden=false;done.focus();
    });
    if(panels.length)showStep(false);
  });
  $$('[data-restart-form]').forEach(b=>b.addEventListener('click',()=>location.reload()));
  $('#demo-environment')?.addEventListener('change', e=>{
    const content={underground:['Underground operations','Map coverage, local magnetic disturbance, route constraints and repeatability.'],surface:['Surface mobility','Changing infrastructure, environmental variation, sensor placement and comparison with a reference route.'],airborne:['Airborne inspection','Altitude variation, platform interference, reference measurements and operating conditions.']};
    const [title,copy]=content[e.target.value];$('#demo-title').textContent=title;$('#demo-copy').textContent=copy;
  });
})();
