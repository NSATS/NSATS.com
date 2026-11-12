/* NSATS Design section — prototype behaviour. Everything on the pages is readable without JavaScript. */
(() => {
  const live = document.createElement('p');
  live.className = 'visually-hidden'; live.setAttribute('role', 'status');
  live.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)';
  document.body.appendChild(live);
  const say = t => { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 30); };

  // Copy HEX
  document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const v = b.dataset.copy, label = b.textContent;
    try { await navigator.clipboard.writeText(v); b.textContent = 'Copied'; say('Copied ' + v + '.'); }
    catch (e) { b.textContent = v; say('Copy is not available here. Select ' + v + ' and copy it.'); }
    setTimeout(() => { b.textContent = label; }, 1600);
  }));

  // Typeface page: hero style buttons
  const hero = document.querySelector('[data-hero-text]');
  document.querySelectorAll('.nc-style').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.nc-style').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    hero.style.fontWeight = b.dataset.w; hero.style.fontStyle = b.dataset.s;
  }));

  // Type tester
  const t = document.querySelector('[data-tester]');
  if (t) {
    const line = t.querySelector('[data-t-line]'), plex = t.querySelector('[data-t-plex]'), note = t.querySelector('[data-t-note]');
    const style = t.querySelector('[data-t-style]'), size = t.querySelector('[data-t-size]'), out = t.querySelector('[data-t-size-out]');
    const cmp = t.querySelector('[data-t-compare]'), pnum = t.querySelector('[data-t-pnum]');
    const apply = () => {
      const [w, s] = style.value.split('|');
      line.style.fontWeight = w; line.style.fontStyle = s;
      plex.style.fontWeight = Math.min(+w, 600); plex.style.fontStyle = 'normal';
      t.style.setProperty('--tsize', size.value + 'px'); out.textContent = size.value + ' px';
      const fv = pnum.checked ? 'proportional-nums' : 'tabular-nums';
      line.style.fontVariantNumeric = fv; plex.style.fontVariantNumeric = fv;
      plex.hidden = note.hidden = !cmp.checked; plex.textContent = line.textContent;
    };
    [style, size, cmp, pnum].forEach(c => c.addEventListener('input', apply));
    line.addEventListener('input', () => { plex.textContent = line.textContent; });
    apply();
  }

  // Character set
  const big = document.querySelector('[data-cs-big]');
  if (big) {
    const nm = document.querySelector('[data-cs-name]'), cp = document.querySelector('[data-cs-cp]');
    const cells = Array.from(document.querySelectorAll('.cell'));
    // One keyboard stop for the whole grid. Arrow keys, Home and End move between cells.
    let current = cells[0];
    const stop = c => { if (current) current.tabIndex = -1; current = c; c.tabIndex = 0; };
    const nextRow = (c, dir) => {
      const r = c.getBoundingClientRect(), half = r.height / 2;
      let near = Infinity, best = null, bestDx = Infinity;
      const gap = x => (x.getBoundingClientRect().top - r.top) * dir;
      cells.forEach(x => { const g = gap(x); if (g >= half && g < near) near = g; });
      cells.forEach(x => {
        const g = gap(x); if (g < half || g > near + half) return;
        const dx = Math.abs(x.getBoundingClientRect().left - r.left);
        if (dx < bestDx) { bestDx = dx; best = x; }
      });
      return best;
    };
    cells.forEach(c => {
      c.tabIndex = -1;
      c.setAttribute('aria-pressed', 'false');
      c.addEventListener('focus', () => stop(c));
      c.addEventListener('click', () => {
        document.querySelectorAll('.cell[aria-pressed=true]').forEach(x => x.setAttribute('aria-pressed', 'false'));
        c.setAttribute('aria-pressed', 'true'); stop(c);
        big.textContent = c.dataset.ch || ' '; nm.textContent = c.dataset.name; cp.textContent = c.dataset.cp;
      });
      c.addEventListener('keydown', e => {
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        const i = cells.indexOf(c); let to;
        if (e.key === 'ArrowRight') to = cells[i + 1];
        else if (e.key === 'ArrowLeft') to = cells[i - 1];
        else if (e.key === 'ArrowDown') to = nextRow(c, 1);
        else if (e.key === 'ArrowUp') to = nextRow(c, -1);
        else if (e.key === 'Home') to = cells[0];
        else if (e.key === 'End') to = cells[cells.length - 1];
        else return;
        e.preventDefault();
        if (to) { stop(to); to.focus(); }
      });
    });
    if (current) current.tabIndex = 0;
  }
})();
