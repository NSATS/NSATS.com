/* NSATS site interactions: header, menus, dialogs and printing. No requests, tracking, or form delivery. */
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const base = document.body.dataset.base || './';
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
  // Design-review round 2 (12 November 2026), Q4 and Q5: printed pages carry the NSATS name and the
  // page address, and folded "Learn more" sections print open; they fold again after printing.
  let reopened = [];
  addEventListener('beforeprint', () => {
    $$('main details:not([open])').forEach(d => { d.open = true; reopened.push(d); });
    if (!$('.nsats-print-head')) {
      const head = document.createElement('p');
      head.className = 'nsats-print-head';
      head.textContent = 'NSATS · ' + location.href.split('#')[0];
      $('main')?.prepend(head);
    }
  });
  addEventListener('afterprint', () => { reopened.forEach(d => d.open = false); reopened = []; });
})();
