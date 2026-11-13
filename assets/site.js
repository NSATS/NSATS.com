/* NSATS site search. Runs in the browser only: no requests, no tracking. */
(() => {
  const form = document.getElementById('nsats-search');
  if (!form) return;
  const q = document.getElementById('nsats-q');
  const pf = document.getElementById('nsats-portfolio');
  const list = document.getElementById('nsats-results');
  const count = document.getElementById('nsats-count');
  const sectionLabels = {corporate: 'Company and general information', quantum: 'NSATS Quantum', geomagnetism: 'NSATS Geomagnetism'};
  // Design-review round 2 (12 November 2026), O5: whole words and their common endings, quoted phrases,
  // British and American spellings, short highlighted summaries, and no full listing for an empty search.
  // Lower case and accents removed, keeping every character's position so highlights line up.
  const norm = s => Array.from(String(s || '').toLowerCase(), ch => {
    if (ch === '’' || ch === '‘') return "'";
    const d = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return d.length === ch.length ? d : ch;
  }).join('');
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const SPELLING = {licence: 'licen[cs]e', license: 'licen[cs]e', organisation: 'organi[sz]ation', organization: 'organi[sz]ation', colour: 'colou?r', color: 'colou?r', centre: 'cent(?:re|er)', center: 'cent(?:re|er)', analyse: 'analy[sz]e', analyze: 'analy[sz]e'};
  const STOP = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'in', 'into', 'is', 'it', 'of', 'on', 'or', 'the', 'to', 'with']);
  function wordPattern(w) {
    let base = w;
    if (base.length >= 4 && base.endsWith('s') && !base.endsWith('ss')) base = base.slice(0, -1);
    else if (base.length >= 6 && base.endsWith('ing')) base = base.slice(0, -3);
    else if (base.length >= 5 && base.endsWith('ed')) base = base.slice(0, -2);
    let re = SPELLING[base] || SPELLING[base + 'e'] || escape(base);
    if (/e$/.test(re)) re = re.slice(0, -1) + '(?:e|es|ed|ing|er|ers)';
    else re += '(?:s|es|ed|ing|er|ers)?';
    return new RegExp('\\b' + re + '\\b');
  }
  function terms(value) {
    const out = [];
    const re = /"([^"]+)"|(\S+)/g;
    let m;
    while ((m = re.exec(norm(value)))) {
      if (m[1] && m[1].trim()) { out.push(new RegExp('\\b' + m[1].trim().split(/\s+/).map(escape).join('\\s+') + '\\b')); continue; }
      const w = (m[2] || '').replace(/^[^\w]+|[^\w]+$/g, '');
      if (w && !STOP.has(w)) out.push(wordPattern(w));
    }
    return out;
  }
  function summary(text, pats) {
    const plain = String(text || '');
    if (plain.length <= 220) return plain;
    const lower = norm(plain);
    let at = 0;
    for (const p of pats) { const m = lower.match(p); if (m) { at = Math.max(0, m.index - 60); break; } }
    const cut = plain.slice(at, at + 220);
    return (at ? '… ' : '') + cut.replace(/\s+\S*$/, '') + ' …';
  }
  function highlighted(text, pats) {
    const frag = document.createDocumentFragment();
    const lower = norm(text);
    const marks = [];
    for (const p of pats) { const g = new RegExp(p.source, 'g'); let m; while ((m = g.exec(lower))) { marks.push([m.index, m.index + m[0].length]); if (!m[0].length) g.lastIndex++; } }
    marks.sort((a, b) => a[0] - b[0]);
    let pos = 0;
    for (const [a, b] of marks) {
      if (a < pos) continue;
      frag.append(text.slice(pos, a));
      const mark = document.createElement('mark'); mark.textContent = text.slice(a, b); frag.append(mark);
      pos = b;
    }
    frag.append(text.slice(pos));
    return frag;
  }
  function run() {
    const pats = terms(q.value);
    list.replaceChildren();
    if (!pats.length && !pf.value) { count.textContent = 'Enter one or more words to search the website.'; return; }
    const rows = [];
    for (const r of window.NSATS_SEARCH || []) {
      if (pf.value && r.p !== pf.value) continue;
      const title = norm(r.t), body = norm(r.t + ' ' + r.l + ' ' + r.x + ' ' + r.id);
      if (!pats.every(p => p.test(body))) continue;
      const score = pats.reduce((n, p) => n + (p.test(title) ? 100 : 0) + Math.min(20, (body.match(new RegExp(p.source, 'g')) || []).length), 0);
      rows.push([score, r]);
    }
    rows.sort((a, b) => b[0] - a[0]);
    for (const [, r] of rows) {
      const li = document.createElement('li');
      const h = document.createElement('h2'); const a = document.createElement('a');
      a.href = r.h; a.textContent = r.t; h.append(a);
      const p = document.createElement('p');
      const lead = r.l && (!pats.length || pats.some(x => x.test(norm(r.l)))) ? r.l : summary(r.x, pats) || r.l;
      p.append(highlighted(summary(lead, pats), pats));
      const m = document.createElement('span'); m.className = 'eyebrow'; m.textContent = sectionLabels[r.p] || r.p;
      li.append(m, h, p); list.append(li);
    }
    count.textContent = !rows.length
      ? 'No matching pages. Try fewer words or select All sections.'
      : `${rows.length} ${rows.length === 1 ? 'page' : 'pages'} found`;
  }
  q.value = new URLSearchParams(location.search).get('q') || '';
  form.addEventListener('submit', e => { e.preventDefault(); const u = new URL(location.href); u.searchParams.set('q', q.value); history.replaceState({}, '', u); run(); });
  pf.addEventListener('change', run);
  run();
})();
