/* NSATS analytics choice, revision 04 (owner approval 26 November 2026).
 * A banner fixed at the bottom of every page until the visitor chooses. No remote requests, no third parties.
 * Optional analytics MUST check window.NSATSAnalyticsConsent.isAllowed() === true before every collection,
 * storage and send, and stop on the 'nsats:analytics-choice' event.
 * - Accept analytics / Reject analytics are saved for 6 months in the cookie nsats_analytics_choice (all nsats.com sites).
 * - A Global Privacy Control signal counts as Reject until the visitor chooses Accept in Settings; the banner is not shown.
 * - Closing with x or Escape is no choice: the banner stays away for this tab only (sessionStorage), analytics stays off.
 * - Version legal-r4: choices saved under revision 03 are not carried over, because Accept now covers more.
 */
(() => {
  'use strict';
  const NAME = 'nsats_analytics_choice';
  const CLOSED = 'nsats_analytics_notice_closed';
  const VERSION = 'legal-r4-2026-12-01';
  const script = document.currentScript;
  // Site root for the legal links: data-site on the script tag (server pages carry an inline copy),
  // otherwise one folder above this file (assets/ on the website).
  const root = (() => {
    try {
      const site = script && script.getAttribute('data-site');
      if (site && /^https:\/\/[a-z0-9.-]+\/$/i.test(site)) return site;
      return new URL('../', script && script.src ? script.src : location.href).href;
    } catch (_) { return '/'; }
  })();
  const gpc = (() => { try { return navigator.globalPrivacyControl === true; } catch (_) { return false; } })();
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
  window.NSATSAnalyticsConsent = Object.freeze({ isAllowed, globalPrivacyControl: gpc });

  function el(tag, attrs, text) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, v);
    if (text) node.textContent = text;
    return node;
  }
  function link(href, text) { return el('a', { href: root + href }, text); }

  function build() {
    const region = el('section', { class: 'nsats-banner', id: 'nsats-analytics-choice', 'aria-labelledby': 'nsats-banner-title', hidden: '' });
    const inner = el('div', { class: 'nsats-banner-inner' });
    const text = el('div', { class: 'nsats-banner-text' });
    const heading = el('h2', { id: 'nsats-banner-title', tabindex: '-1' }, 'Your analytics choice');
    const p1 = el('p', {}, 'We use necessary technologies to run and protect this website, including a security record of each visit with your IP address and browser details. With your permission, optional analytics also measures how the site is used, such as time on a page, scrolling and links selected, and recognises your browser on later visits. We run it ourselves and use no third-party advertising trackers. Your choice does not affect access to any page or document.');
    const p2 = el('p', {});
    p2.append(link('nsats/trust/cookies/index.html', 'Cookies and analytics choices'), document.createTextNode(' · '), link('nsats/trust/privacy/index.html', 'Privacy notice'));
    const settings = el('div', { class: 'nsats-banner-settings', hidden: '' });
    const lineNecessary = el('p', {}, 'Necessary functions and security record: always active');
    const lineOptional = el('p', {});
    const lineGpc = el('p', { hidden: '' }, 'Your browser sent a Global Privacy Control signal, so optional analytics is off. You can still choose Accept analytics.');
    settings.append(lineNecessary, lineOptional, lineGpc);
    const message = el('p', { role: 'status', 'aria-live': 'polite' });
    text.append(heading, p1, p2, settings, message);
    const actions = el('div', { class: 'nsats-banner-actions' });
    const accept = el('button', { class: 'nsats-banner-button', type: 'button' }, 'Accept analytics');
    const reject = el('button', { class: 'nsats-banner-button', type: 'button' }, 'Reject analytics');
    const settingsButton = el('button', { class: 'nsats-banner-button', type: 'button', 'aria-expanded': 'false' }, 'Settings');
    actions.append(accept, reject, settingsButton);
    const close = el('button', { class: 'nsats-banner-close', type: 'button', 'aria-label': 'Close analytics notice without changing your choice' }, '×');
    inner.append(text, actions, close);
    region.append(inner);
    const status = el('div', { class: 'nsats-banner-status', id: 'nsats-analytics-status', role: 'status', 'aria-live': 'polite' });
    document.body.append(region, status);
    return { region, heading, settings, lineOptional, lineGpc, message, accept, reject, settingsButton, close, status };
  }

  function start() {
    // Revision 03 placed the notice inside each page; remove any copy left in a cached page.
    document.querySelectorAll('section.nsats-choice, .nsats-choice-status').forEach(n => n.remove());
    const ui = build();
    const links = Array.from(document.querySelectorAll('[data-analytics-settings]'));
    let returnFocus = null;
    let dismissed = false;
    let saveFailed = false;
    let spacer = '';

    function closedThisSession() { try { return window.sessionStorage.getItem(CLOSED) === '1'; } catch (_) { return false; } }
    function rememberClosed(on) {
      try { if (on) window.sessionStorage.setItem(CLOSED, '1'); else window.sessionStorage.removeItem(CLOSED); } catch (_) { /* shown again on the next page */ }
    }
    function day(time) { return new Date(time).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }
    function describe() {
      const record = read();
      if (saveFailed) ui.lineOptional.textContent = 'Optional NSATS analytics: off. Your browser could not save a choice.';
      else if (record && record.choice === 'accept') ui.lineOptional.textContent = 'Optional NSATS analytics: on. You accepted on ' + day(record.decidedAt) + '; this choice lasts until ' + day(record.expiresAt) + '.';
      else if (record) ui.lineOptional.textContent = 'Optional NSATS analytics: off. You rejected on ' + day(record.decidedAt) + '; this choice lasts until ' + day(record.expiresAt) + '.';
      else ui.lineOptional.textContent = 'Optional NSATS analytics: off until chosen';
      ui.lineGpc.hidden = !(gpc && !record);
    }
    function pad() {
      // Keep the end of the page reachable above the banner.
      if (ui.region.hidden) { document.body.style.paddingBottom = spacer; return; }
      document.body.style.paddingBottom = (ui.region.offsetHeight + 8) + 'px';
    }
    function announce(reason, record = read()) {
      window.dispatchEvent(new CustomEvent('nsats:analytics-choice', { detail: { allowed: isAllowed(), reason, record } }));
    }
    function show(asSettings, focus) {
      ui.region.hidden = false;
      ui.settings.hidden = !asSettings;
      ui.settingsButton.setAttribute('aria-expanded', asSettings ? 'true' : 'false');
      ui.heading.textContent = asSettings ? 'Analytics settings' : 'Your analytics choice';
      ui.message.textContent = '';
      describe();
      pad();
      if (focus) ui.heading.focus();
    }
    function hide() {
      const inside = ui.region.contains(document.activeElement);
      ui.region.hidden = true;
      pad();
      if (inside) (returnFocus || links[0])?.focus();
    }
    function choose(choice) {
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
      } catch (_) { /* treated as not saved below */ }
      const saved = read();
      if (!saved || saved.choice !== choice || saved.decidedAt !== decidedAt) {
        forcedOff = true; saveFailed = true; describe();
        ui.message.textContent = 'Your browser could not save this choice. Optional analytics remains off.';
        announce('storage-unavailable');
        return;
      }
      forcedOff = false; dismissed = false; saveFailed = false;
      rememberClosed(false);
      describe();
      last = JSON.stringify(saved);
      announce('choice', saved);
      ui.status.textContent = choice === 'accept' ? 'Your analytics choice has been saved.' : 'Your choice has been saved. Optional analytics is off in this browser. Contact our privacy team about information already collected.';
      hide();
    }
    function dismiss() { dismissed = true; if (!read()) rememberClosed(true); hide(); }

    ui.accept.addEventListener('click', () => choose('accept'));
    ui.reject.addEventListener('click', () => choose('reject'));
    ui.settingsButton.addEventListener('click', () => show(ui.settings.hidden, true));
    ui.close.addEventListener('click', dismiss);
    ui.region.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); dismiss(); } });
    links.forEach(a => a.addEventListener('click', e => { e.preventDefault(); returnFocus = a; show(true, true); }));
    window.addEventListener('resize', pad);

    // Whether the banner should open by itself: no saved choice, not closed in this tab, and no GPC signal.
    const wantsBanner = () => !read() && !dismissed && !gpc;
    let last = JSON.stringify(read());
    function sync() {
      const record = read();
      const next = JSON.stringify(record);
      if (next !== last) {
        last = next;
        announce(record ? 'other-page-choice' : 'expired-or-removed', record);
        describe();
        if (!record) { dismissed = closedThisSession(); if (wantsBanner()) show(false, false); }
        else if (ui.settings.hidden) hide();
      }
    }
    window.addEventListener('focus', sync);
    window.addEventListener('pageshow', sync);
    document.addEventListener('visibilitychange', sync);
    window.setInterval(sync, 1000);

    spacer = document.body.style.paddingBottom || '';
    dismissed = closedThisSession();
    if (wantsBanner()) show(false, false); else { ui.region.hidden = true; describe(); }
    announce('initial');
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
