/* NSATS MyNSATS sign-in preview (MY-LOGIN), build-phase-notes §4 / owner decision D-AB-4, 5 October 2026.
   The fields can be typed in, but nothing is sent, stored or logged: there is no form action, the inputs have no
   names, the button is type="button", and this script makes no network request and writes no storage.
   Pressing "Sign in" shows the page's own message specimens (held in data attributes on the form):
   a missing-field message beside each empty field; otherwise "Access by approval" with the request-access link. */
(() => {
  document.querySelectorAll('form[data-signin-preview]').forEach(form => {
    const d = form.dataset;
    const result = form.querySelector('.signin-result');
    const field = key => form.querySelector(`[data-field="${key}"]`);
    const show = (key, msg) => {
      const f = field(key); if (!f) return;
      const input = f.querySelector('input'), out = f.querySelector('.field-msg');
      out.textContent = msg || '';
      f.classList.toggle('has-error', !!msg);
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    };
    const attempt = () => {
      result.replaceChildren();
      result.classList.remove('shown');
      const email = field('email').querySelector('input');
      const password = field('password').querySelector('input');
      const missingEmail = !email.value.trim(), missingPassword = !password.value;
      show('email', missingEmail ? d.msgEmail : '');
      show('password', missingPassword ? d.msgPassword : '');
      if (missingEmail) { email.focus(); return; }
      if (missingPassword) { password.focus(); return; }
      password.value = '';                       // nothing typed is kept
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = d.msgAccessState;
      p.append(strong, ' — ' + d.msgAccess);
      const a = document.createElement('a');
      a.className = 'arrow-link';
      a.href = d.msgReqHref;
      a.textContent = d.msgReqLabel + ' ';
      const arrow = document.createElement('span'); arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '→';
      a.append(arrow);
      const row = document.createElement('div'); row.className = 'link-row'; row.append(a);
      result.append(p, row);
      result.classList.add('shown');
    };
    form.addEventListener('submit', e => { e.preventDefault(); attempt(); });
    form.querySelector('[data-signin-try]').addEventListener('click', attempt);
    form.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); attempt(); }
    }));
  });
})();
