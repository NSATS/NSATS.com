(function () {
  'use strict';
  document.querySelectorAll('[data-launch-form]').forEach(function (form) {
    var busy = false;
    var status = form.querySelector('[data-launch-status]');
    // A failure is shown as an error and announced at once; an empty line goes back to a quiet status.
    function report(text, failed) {
      if (!status) return;
      status.classList.toggle('nsats-form-failure', !!(failed && text));
      status.setAttribute('role', failed && text ? 'alert' : 'status');
      status.textContent = text;
    }
    var vacancy = new URLSearchParams(location.search).get('vacancy');
    if (form.elements.vacancy && Array.from(form.elements.vacancy.options).some(function (o) { return o.value === vacancy; })) form.elements.vacancy.value = vacancy;
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (busy) return;
      if (!window.NSATSValidation) { report('This form could not be prepared. Please reload the page and try again.', true); return; }
      if (!window.NSATSValidation.validate(form)) return;
      busy = true;
      var sent = false;
      var button = form.querySelector('[type=submit]');
      button.disabled = true;
      report('', false);
      try {
        var response = await fetch('https://files.nsats.com/mynsats/csrf', { credentials: 'include', cache: 'no-store' });
        if (!response.ok) throw Error('Please try again.');
        var data = await response.json();
        if (!data.csrf) throw Error('The security check could not be completed.');
        form.elements.csrf.value = data.csrf;
        // Recheck in case an entry changed while the security request was pending.
        // Keep the button disabled while the browser sends the form; pageshow re-enables it on return.
        if (window.NSATSValidation.validate(form)) { sent = true; HTMLFormElement.prototype.submit.call(form); }
      } catch (error) {
        // Never show a browser's own technical wording.
        var ours = ['Please try again.', 'The security check could not be completed.'];
        report('We could not submit this form. ' + (ours.indexOf(error.message) !== -1 ? error.message : 'Please check your connection and try again.'), true);
      } finally { if (!sent) { busy = false; button.disabled = false; } }
    });
    window.addEventListener('pageshow', function () { busy = false; var b = form.querySelector('[type=submit]'); if (b) b.disabled = false; });
  });
})();
