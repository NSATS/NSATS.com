/* r32-F1 privacy dialogs. No submission, storage, authentication or network work. */
(() => {
  const dialog = document.getElementById('form-privacy');
  if (!dialog) return;
  let trigger;
  document.querySelectorAll('[data-r32-privacy-open]').forEach(button => {
    button.addEventListener('click', () => {
      trigger = button;
      if (typeof dialog.showModal !== 'function') {
        const fallback = dialog.querySelector('a[href*="trust/privacy"]');
        if (fallback) window.location.href = fallback.href;
        return;
      }
      if (!dialog.open) dialog.showModal();
      document.documentElement.classList.add('r32-privacy-open');
      dialog.querySelector('#form-privacy-title').focus();
    });
  });
  dialog.querySelector('[data-r32-privacy-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('r32-privacy-open');
    trigger?.focus();
  });
})();
