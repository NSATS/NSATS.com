/* Website font option: IBM Plex Sans (default) or NSATS Clear RC04 test release. Stored only in this browser. */
(() => {
  const KEY = 'nsats-font-preview-v1', root = document.documentElement, dlg = document.getElementById('font-dialog');
  const set = v => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); return true; } catch (e) { return false; } };
  const status = dlg && dlg.querySelector('[role=status]');
  function apply(v, announce) {
    if (v === 'nsats-clear') root.dataset.font = 'nsats-clear'; else delete root.dataset.font;
    document.querySelectorAll('[data-font-set]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.fontSet === 'nsats-clear') === (v === 'nsats-clear'))));
    if (announce && status) {
      const saved = set(v === 'nsats-clear' ? v : null);
      status.textContent = (v === 'nsats-clear' ? 'NSATS Clear RC04 (test release) is now shown on this site in this browser.' : 'IBM Plex Sans (current template font) is now shown.') + (saved ? '' : ' Browser storage is unavailable, so the choice lasts for this page only.');
    }
  }
  apply(root.dataset.font === 'nsats-clear' ? 'nsats-clear' : 'plex');
  document.querySelectorAll('[data-open-font]').forEach(b => b.addEventListener('click', () => { if (dlg && dlg.showModal) dlg.showModal(); }));
  document.querySelectorAll('[data-close-font]').forEach(b => b.addEventListener('click', () => dlg && dlg.close()));
  document.querySelectorAll('[data-font-set]').forEach(b => b.addEventListener('click', () => apply(b.dataset.fontSet, true)));
})();
