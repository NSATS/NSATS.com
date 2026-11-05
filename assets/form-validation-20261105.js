/* Shared visitor-form preflight. No requests, storage, or logging. */
(function () {
  'use strict';
  if (window.NSATSValidation) return;
  var serial = 0;
  function bytes(s) { return unescape(encodeURIComponent(s)).length; }
  function emailOK(value) {
    var parts = value.split('@');
    if (value.length > 254 || parts.length !== 2 || parts[0].length > 64) return false;
    // Unquoted dot-atom local parts: punctuation such as +, /, ? and = is valid.
    if (!/^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*$/i.test(parts[0])) return false;
    var labels = parts[1].split('.');
    return labels.length > 1 && !/^\d+$/.test(labels[labels.length - 1]) && labels.every(function (s) {
      return s.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(s);
    });
  }
  function eligible(form) { return form && form.tagName === 'FORM' && form.method.toLowerCase() === 'post' && !form.hasAttribute('data-nsats-local'); }
  function message(field, form) {
    if (!field.willValidate || /^(hidden|submit|button|reset)$/.test(field.type)) return '';
    var value = field.value, clean = value.trim(), path;
    try { path = new URL(form.action, location.href).pathname; } catch (_) { path = ''; }
    if (field.type === 'email' && clean) {
      field.value = clean;
      if (!emailOK(clean)) return 'Enter a complete email address, for example name@example.com.';
      // The enquiry service does not support apostrophes, unlike the account service.
      if (form.hasAttribute('data-nsats-form') && clean.indexOf("'") !== -1) return 'This form cannot accept an apostrophe in an email address. Please use another address.';
    }
    if (field.required && !/^(checkbox|radio|file)$/.test(field.type) && !clean) return 'Please complete this field.';
    if (field.type === 'password') {
      if (/\/mynsats\/(register|reset)$/.test(path) && bytes(value) < 12) return 'Use a password of at least 12 characters.';
      if (bytes(value) > 128) return 'This password exceeds the supported length (128 bytes). Please use a shorter password.';
    }
    if (/\/mynsats\/|\/careers\/apply$/.test(path) && /^(name|organisation)$/.test(field.name) && bytes(clean) > 200) return 'Please shorten this entry (maximum 200 bytes).';
    if (/\/careers\/apply$/.test(path) && field.name === 'experience' && bytes(clean) > 12000) return 'Please shorten this entry (maximum 12,000 bytes).';
    if (field.maxLength > 0 && value.length > field.maxLength) return 'Please use no more than ' + field.maxLength + ' characters.';
    if (field.type === 'file' && field.files && field.files.length) {
      var file = field.files[0];
      if (field.name === 'resume') {
        if (!/\.(pdf|docx)$/i.test(file.name)) return 'Choose a PDF or DOCX résumé.';
        if (!file.size || file.size > 10 * 1024 * 1024) return 'Choose a non-empty résumé no larger than 10 MB.';
      }
    }
    return field.validity.valid ? '' : field.validationMessage;
  }
  function clear(field) {
    if (!field._nsatsError) return;
    field.setCustomValidity('');
    field.removeAttribute('aria-invalid');
    var ids = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (id) { return id && id !== field._nsatsError.id; });
    if (ids.length) field.setAttribute('aria-describedby', ids.join(' ')); else field.removeAttribute('aria-describedby');
    field._nsatsError.remove(); field._nsatsError = null;
  }
  function validate(form) {
    if (!eligible(form)) return true;
    var first = null, count = 0;
    Array.prototype.forEach.call(form.elements, function (field) {
      clear(field);
      var msg = message(field, form);
      if (!msg) return;
      var error = document.createElement('p'); error.id = 'nsats-input-error-' + (++serial);
      error.className = 'nsats-input-error'; error.textContent = msg;
      // A wrapping label may contain the input; keep the message after that label.
      var anchor = field.closest('label') || field;
      anchor.parentNode.insertBefore(error, anchor.nextSibling);
      field._nsatsError = error;
      field.setCustomValidity(msg); field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', ((field.getAttribute('aria-describedby') || '') + ' ' + error.id).trim());
      first = first || field; count++;
    });
    var summary = form.querySelector('[data-nsats-validation-status]');
    if (!summary) {
      summary = document.createElement('p'); summary.setAttribute('data-nsats-validation-status', ''); summary.setAttribute('role', 'alert'); form.appendChild(summary);
    }
    summary.textContent = count ? 'Please correct ' + count + (count === 1 ? ' field' : ' fields') + ' above. Your form has not been sent.' : '';
    summary.hidden = !count;
    if (first) first.focus();
    return !first;
  }
  function init() { Array.prototype.forEach.call(document.forms, function (f) { if (eligible(f)) f.noValidate = true; }); }
  document.addEventListener('submit', function (event) {
    if (eligible(event.target) && !validate(event.target)) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  ['input', 'change'].forEach(function (type) { document.addEventListener(type, function (event) { clear(event.target); }, true); });
  document.addEventListener('reset', function (event) {
    if (!eligible(event.target)) return;
    Array.prototype.forEach.call(event.target.elements, clear);
    var summary = event.target.querySelector('[data-nsats-validation-status]'); if (summary) summary.hidden = true;
  });
  window.NSATSValidation = { validate: validate, emailOK: emailOK };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.addEventListener('pageshow', init);
})();
