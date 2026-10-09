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
    document.querySelectorAll('.cell').forEach(c => {
      c.setAttribute('aria-pressed', 'false');
      c.addEventListener('click', () => {
        document.querySelectorAll('.cell[aria-pressed=true]').forEach(x => x.setAttribute('aria-pressed', 'false'));
        c.setAttribute('aria-pressed', 'true');
        big.textContent = c.dataset.ch || ' '; nm.textContent = c.dataset.name; cp.textContent = c.dataset.cp;
      });
    });
  }
})();
