/* NSATS Phase 1 page layer: review-note toggle and draft search. No requests, no tracking. */
(() => {
  const root = document.documentElement;
  const store = (k, v) => { try { v === undefined ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
  document.querySelectorAll('[data-toggle-review]').forEach(btn => {
    const sync = () => {
      const on = root.classList.contains('show-review');
      btn.setAttribute('aria-pressed', String(on));
      btn.textContent = on ? 'Hide review notes' : 'Show review notes';
    };
    sync();
    btn.addEventListener('click', () => {
      root.classList.toggle('show-review');
      store('nsats-show-review', root.classList.contains('show-review') ? '1' : undefined);
      sync();
    });
  });

  const form = document.getElementById('nsats-search');
  if (!form) return;
  const q = document.getElementById('nsats-q');
  const pf = document.getElementById('nsats-portfolio');
  const list = document.getElementById('nsats-results');
  const count = document.getElementById('nsats-count');
  const norm = s => String(s || '').toLowerCase();
  function run() {
    const words = norm(q.value).trim().split(/\s+/).filter(Boolean);
    const rows = (window.NSATS_SEARCH || []).filter(r =>
      (!pf.value || r.p === pf.value) &&
      words.every(w => norm(r.t + ' ' + r.x + ' ' + r.id).includes(w)));
    rows.sort((a, b) => words.filter(w => norm(b.t).includes(w)).length - words.filter(w => norm(a.t).includes(w)).length);
    list.replaceChildren();
    for (const r of rows) {
      const li = document.createElement('li');
      const h = document.createElement('h2'); const a = document.createElement('a');
      a.href = r.h; a.textContent = r.t; h.append(a);
      const p = document.createElement('p'); p.textContent = r.l;
      const m = document.createElement('span'); m.className = 'eyebrow'; m.textContent = r.p + ' · ' + r.id;
      li.append(m, h, p); list.append(li);
    }
    count.textContent = words.length || pf.value ? `${rows.length} ${rows.length === 1 ? 'page' : 'pages'} found` : '';
  }
  q.value = new URLSearchParams(location.search).get('q') || '';
  form.addEventListener('submit', e => { e.preventDefault(); const u = new URL(location.href); u.searchParams.set('q', q.value); history.replaceState({}, '', u); run(); });
  pf.addEventListener('change', run);
  run();
})();
