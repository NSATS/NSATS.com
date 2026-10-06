/* NSATS themes and typography showcase. Local preferences only (never the review-site key nsats-colour-mode-v3).
   Works without storage; all information is readable without JavaScript. */
(() => {
  const root = document.querySelector('.tsx');
  if (!root) return;
  const KEY_T = root.dataset.themeKey || 'nsats-themes-showcase-theme-v1';
  const KEY_F = root.dataset.fontKey || 'nsats-themes-showcase-font-v1';
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  const NAMES = {cyan: 'NSATS cyan', carbon: 'Carbon blue', royal: 'Royal blue & teal'};
  const status = root.querySelector('.tsx-status');
  const say = msg => { if (status) { status.textContent = ''; setTimeout(() => { status.textContent = msg; }, 30); } };

  function theme(id, persist) {
    if (!NAMES[id]) id = 'cyan';
    const pv = root.querySelector('.tsx-preview');
    pv.dataset.theme = id;
    pv.querySelector('[data-preview-name]').textContent = NAMES[id];
    root.querySelectorAll('[data-preview-theme]').forEach(b => {
      const on = b.dataset.previewTheme === id;
      b.setAttribute('aria-pressed', String(on));
      b.nextElementSibling.hidden = !on;
    });
    if (persist) say(`${NAMES[id]} applied to the component preview.${set(KEY_T, id) ? '' : ' (Not saved: browser storage unavailable.)'}`);
  }
  function font(id, persist) {
    const clear = id === 'nsats-clear';
    const sp = root.querySelector('.tsx-specimen');
    if (clear) sp.dataset.font = 'nsats-clear'; else delete sp.dataset.font;
    root.querySelectorAll('[data-font-name]').forEach(e => { e.textContent = clear ? 'NSATS Clear RC04 (test release)' : 'IBM Plex Sans'; });
    root.querySelectorAll('[data-display-weight]').forEach(e => { e.textContent = clear ? 'Regular 400' : 'Light 300'; });
    root.querySelectorAll('[data-font-choice]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.fontChoice === 'nsats-clear') === clear)));
    const fs = root.querySelector('.tsx-font-status');
    if (fs) fs.textContent = clear ? 'Showing: Custom font preview: NSATS Clear RC04 — test release, not production approved.' : 'Showing: Current template font: IBM Plex Sans.';
    if (persist) set(KEY_F, clear ? 'nsats-clear' : null);
  }
  root.querySelectorAll('[data-preview-theme]').forEach(b => b.addEventListener('click', () => theme(b.dataset.previewTheme, true)));
  root.querySelectorAll('[data-font-choice]').forEach(b => b.addEventListener('click', () => font(b.dataset.fontChoice, true)));
  root.querySelector('[data-tsx-reset]')?.addEventListener('click', () => { set(KEY_T, null); set(KEY_F, null); theme('cyan'); font('plex'); say('Preview reset: NSATS cyan and IBM Plex Sans.'); });

  async function copy(text) {
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch (e) {}
    try {
      const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.append(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok;
    } catch (e) { return false; }
  }
  root.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const v = b.dataset.copy, ok = await copy(v);
    b.textContent = ok ? 'Copied ✓' : 'Copy failed';
    say(ok ? `Copied ${v}.` : `Copy not available here. Select ${v} and copy it manually.`);
    setTimeout(() => { b.textContent = 'Copy HEX'; }, 1800);
  }));
  theme(get(KEY_T) || 'cyan');
  font(get(KEY_F) === 'nsats-clear' ? 'nsats-clear' : 'plex');
})();
