/* Website font (NSATS Sans build, 7 October 2026): NSATS Sans 1.203 is the default; IBM Plex Sans is the alternative.
   The choice is stored only in this browser ('nsats-font-v2' = 'plex'; no entry = NSATS Sans). Messages come from the dialog's data attributes. */
(() => {
  const KEY = 'nsats-font-v2', root = document.documentElement, dlg = document.getElementById('font-dialog');
  const set = v => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); return true; } catch (e) { return false; } };
  const status = dlg && dlg.querySelector('[role=status]');
  function apply(v, announce) {
    const plex = v === 'plex';
    if (plex) root.dataset.font = 'plex'; else delete root.dataset.font;
    document.querySelectorAll('[data-font-set]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.fontSet === 'plex') === plex)));
    if (announce && status) {
      const saved = set(plex ? 'plex' : null);
      status.textContent = (plex ? dlg.dataset.msgPlex : dlg.dataset.msgSans) + (saved ? '' : dlg.dataset.msgNostore);
    }
  }
  apply(root.dataset.font === 'plex' ? 'plex' : 'nsats-sans');
  document.querySelectorAll('[data-open-font]').forEach(b => b.addEventListener('click', () => { if (dlg && dlg.showModal) dlg.showModal(); }));
  document.querySelectorAll('[data-close-font]').forEach(b => b.addEventListener('click', () => dlg && dlg.close()));
  document.querySelectorAll('[data-font-set]').forEach(b => b.addEventListener('click', () => apply(b.dataset.fontSet, true)));
})();
