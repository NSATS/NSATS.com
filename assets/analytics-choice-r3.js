/* Necessary privacy preference only. No analytics, remote requests or third-party dependencies.
 * Future analytics MUST check window.NSATSAnalyticsConsent?.isAllowed() === true
 * before every collection, storage, load and send; cancel work on nsats:analytics-choice.
 */
(() => {
  'use strict';
  const NAME = 'nsats_analytics_choice';
  const VERSION = 'legal-r3-2026-11-11';
  const region = document.getElementById('nsats-analytics-choice');
  const now = () => Date.now();
  function sixMonths(time) {
    const date = new Date(time);
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + 6);
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(day, lastDay));
    return date.getTime();
  }
  function read() {
    try {
      const values = document.cookie.split(';').map(x => x.trim()).filter(x => x.startsWith(NAME + '='));
      if (values.length !== 1) return null;
      const value = JSON.parse(decodeURIComponent(values[0].slice(NAME.length + 1)));
      if (!value || value.version !== VERSION || !['accept', 'reject'].includes(value.choice)) return null;
      if (!Number.isSafeInteger(value.decidedAt) || !Number.isSafeInteger(value.expiresAt)) return null;
      if (value.decidedAt <= 0 || value.decidedAt > now() || value.expiresAt <= now()) return null;
      if (value.expiresAt !== sixMonths(value.decidedAt)) return null;
      return { version: VERSION, choice: value.choice, decidedAt: value.decidedAt, expiresAt: value.expiresAt };
    } catch (_) { return null; }
  }
  let forcedOff = false;
  const isAllowed = () => !forcedOff && read()?.choice === 'accept';
  window.NSATSAnalyticsConsent = Object.freeze({ isAllowed });
  if (!region) return;
  const heading = region.querySelector('[data-choice-heading]');
  const settings = region.querySelector('[data-choice-settings]');
  const settingsButton = region.querySelector('[data-choice-open-settings]');
  const message = region.querySelector('[data-choice-message]');
  const status = document.getElementById('nsats-analytics-status');
  const links = Array.from(document.querySelectorAll('[data-analytics-settings]'));
  let returnFocus = null;
  let dismissed = false;
  let last = JSON.stringify(read());
  function announce(reason, record = read()) {
    window.dispatchEvent(new CustomEvent('nsats:analytics-choice', {
      detail: { allowed: isAllowed(), reason, record }
    }));
  }
  function show(asSettings, focus) {
    region.hidden = false;
    settings.hidden = !asSettings;
    settingsButton.hidden = asSettings;
    heading.textContent = asSettings ? 'Analytics settings' : 'Your analytics choice';
    message.textContent = '';
    if (focus) { heading.focus(); region.scrollIntoView({ block: 'start' }); }
  }
  function hide() {
    const inside = region.contains(document.activeElement);
    region.hidden = true;
    if (inside) (returnFocus || links[0])?.focus();
  }
  function choose(choice) {
    // Stop consumers immediately on withdrawal, including when persistence is blocked.
    if (choice === 'reject') { forcedOff = true; announce('withdrawal'); }
    const decidedAt = now();
    const record = { version: VERSION, choice, decidedAt, expiresAt: sixMonths(decidedAt) };
    const host = location.hostname.toLowerCase();
    const production = host === 'nsats.com' || host.endsWith('.nsats.com');
    const scope = production ? '; Domain=nsats.com; Secure' : (location.protocol === 'https:' ? '; Secure' : '');
    try {
      document.cookie = NAME + '=' + encodeURIComponent(JSON.stringify(record)) +
        '; Path=/; SameSite=Lax; Expires=' + new Date(record.expiresAt).toUTCString() +
        '; Max-Age=' + Math.floor((record.expiresAt - decidedAt) / 1000) + scope;
    } catch (_) { /* Deny if browser storage is unavailable. */ }
    const saved = read();
    if (!saved || saved.choice !== choice || saved.decidedAt !== decidedAt) {
      forcedOff = true;
      message.textContent = 'Your browser could not save this choice. Optional analytics remains off.';
      announce('storage-unavailable');
      return;
    }
    forcedOff = false;
    dismissed = false;
    last = JSON.stringify(saved);
    announce('choice', saved);
    status.textContent = choice === 'accept' ? 'Your analytics choice has been saved.' : 'Your choice has been saved. Optional analytics is now off in this browser. Contact our privacy team about information already collected.';
    hide();
  }
  region.querySelectorAll('[data-choice]').forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => choose(button.dataset.choice));
  });
  settingsButton.disabled = false;
  settingsButton.addEventListener('click', () => show(true, true));
  const close = region.querySelector('[data-choice-close]');
  close.disabled = false;
  close.addEventListener('click', () => { dismissed = true; hide(); });
  region.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); dismissed = true; hide(); }
  });
  links.forEach(link => link.addEventListener('click', event => {
    event.preventDefault(); returnFocus = link; show(true, true);
  }));
  function sync() {
    const record = read();
    const next = JSON.stringify(record);
    if (next !== last) {
      last = next;
      announce(record ? 'other-page-choice' : 'expired-or-removed', record);
      if (!record) { dismissed = false; show(false, false); }
      else if (!settings.hidden) { /* Preserve an open settings interaction. */ }
      else hide();
    } else if (!record && !dismissed && region.hidden) show(false, false);
  }
  window.addEventListener('focus', sync);
  window.addEventListener('pageshow', sync);
  document.addEventListener('visibilitychange', sync);
  window.setInterval(sync, 1000);
  if (read()) region.hidden = true;
  else show(false, false);
  announce('initial');
})();
