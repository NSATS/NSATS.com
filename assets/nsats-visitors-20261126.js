/* NSATS visitor monitoring, page script. Legal revision 04, 26 November 2026.
 *
 * For every visitor (security record): one message when the page opens with the page address, the referring
 * address and whether the browser reports automatic control; and, when the page is left, whether mouse,
 * keyboard or touch was used. The receiver adds the IP address and browser from the connection.
 * Only after the visitor chose "Accept analytics" (window.NSATSAnalyticsConsent.isAllowed() === true):
 * time in view, scroll depth, links selected, loading times, screen size, language and time zone,
 * a "still here" message every 30 seconds, and one random identifier cookie (nsats_visitor_id, 6 months)
 * so that a later visit is recognised. The receiver also refuses these fields when no identifier is sent.
 * Never read: anything typed into a form or field.
 * Where it sends: the address in this script tag's data-endpoint attribute, on NSATS's own server only.
 */
(() => {
  'use strict';
  const tag = document.currentScript;
  const endpoint = tag && tag.getAttribute('data-endpoint');
  if (!endpoint || !navigator.sendBeacon) return;

  const PRIVATE = ['/d/', '/v/', '/p/', '/get/', '/e/', '/mynsats/verify', '/mynsats/reset', '/newsletter/confirm',
    '/newsletter/stop', '/dataset-link', '/access'];
  const ID_NAME = 'nsats_visitor_id';
  const SIX_MONTHS = 60 * 60 * 24 * 183;

  const random = () => {
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    return Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  };
  // A private link is cut to its family before it leaves the browser; the receiver cuts it again.
  const safe = (address) => {
    try {
      const u = new URL(address, location.href);
      const p = u.pathname.toLowerCase();
      for (const pre of PRIVATE) {
        if (p.startsWith(pre) || p === pre.replace(/\/$/, '')) return u.origin + pre.replace(/\/$/, '') + '/[hidden]';
      }
      return u.origin + u.pathname + u.search;
    } catch (_) { return ''; }
  };
  const cookieDomain = () => (location.hostname.endsWith('.nsats.com') || location.hostname === 'nsats.com') ? '; Domain=nsats.com' : '';
  const readId = () => {
    const m = document.cookie.split(';').map(x => x.trim()).find(x => x.startsWith(ID_NAME + '='));
    const v = m ? m.slice(ID_NAME.length + 1) : '';
    return /^[a-f0-9]{32}$/.test(v) ? v : '';
  };
  const dropId = () => { document.cookie = ID_NAME + '=; Max-Age=0; Path=/' + cookieDomain() + '; SameSite=Lax; Secure'; };
  const allowed = () => { try { return window.NSATSAnalyticsConsent && window.NSATSAnalyticsConsent.isAllowed() === true; } catch (_) { return false; } };
  // The identifier exists only while the visitor's choice is "accept". It is removed as soon as it is not.
  const visitorId = () => {
    if (!allowed()) { if (readId()) dropId(); return ''; }
    let id = readId();
    if (!id) {
      id = random();
      document.cookie = ID_NAME + '=' + id + '; Max-Age=' + SIX_MONTHS + '; Path=/' + cookieDomain() + '; SameSite=Lax; Secure';
    }
    return id;
  };

  const pid = random();
  let input = false, maxScroll = 0, shown = 0, since = document.visibilityState === 'visible' ? performance.now() : 0, lcp = 0;
  let leftSent = false;
  const inView = () => Math.round(shown + (since ? performance.now() - since : 0));
  const scrolled = () => {
    if (!allowed()) return;
    const h = document.documentElement;
    const full = Math.max(h.scrollHeight, document.body ? document.body.scrollHeight : 0);
    const seen = (window.scrollY || h.scrollTop) + window.innerHeight;
    if (full > 0) maxScroll = Math.max(maxScroll, Math.min(100, Math.round(100 * seen / full)));
  };
  const timing = () => {
    const n = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    return n ? { ttfb: Math.round(n.responseStart), load: Math.round(n.loadEventEnd) } : { ttfb: 0, load: 0 };
  };
  const beacon = (body) => {
    // text/plain keeps this a simple request: no cookies are sent with it and no answer is read.
    try { navigator.sendBeacon(endpoint, new Blob([JSON.stringify(body)], { type: 'text/plain' })); } catch (_) {}
  };
  // Security record: the same for every visitor, whatever the choice.
  const security = (t) => ({ t, pid, url: safe(location.href), ref: document.referrer ? safe(document.referrer) : '',
    input, auto: navigator.webdriver === true });
  // Optional analytics: only with consent; otherwise nothing beyond the security record is read or sent.
  const send = (t, extra) => {
    const body = security(t);
    if (allowed()) {
      const tm = timing();
      Object.assign(body, {
        vid: visitorId(), sw: screen.width, sh: screen.height, lang: navigator.language || '',
        tz: (Intl.DateTimeFormat().resolvedOptions().timeZone) || '',
        dwell: inView(), scroll: maxScroll, ttfb: tm.ttfb, load: tm.load, lcp
      }, extra || {});
    } else {
      visitorId(); // removes an identifier left from an earlier "accept"
    }
    beacon(body);
  };
  const leave = () => {
    if (since) { shown += performance.now() - since; since = 0; }
    scrolled();
    if (allowed()) { send('ping'); return; }
    // Without consent one closing message carries only the input signal, once per page.
    if (!leftSent && input) { leftSent = true; send('ping'); }
  };

  try {
    new PerformanceObserver((list) => { for (const e of list.getEntries()) lcp = Math.max(lcp, Math.round(e.startTime)); })
      .observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (_) {}
  const once = () => { input = true; };
  for (const ev of ['pointerdown', 'keydown', 'touchstart', 'wheel', 'mousemove']) {
    addEventListener(ev, once, { once: true, passive: true, capture: true });
  }
  addEventListener('scroll', scrolled, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { since = performance.now(); }
    else leave();
  });
  addEventListener('pagehide', leave);
  // Links only, and only with consent: the address a link points to. Buttons and form fields are not looked at.
  document.addEventListener('click', (e) => {
    if (!allowed()) return;
    const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (a) send('click', { href: safe(a.href) });
  }, { capture: true, passive: true });
  // A change of the visitor's choice takes effect at once.
  addEventListener('nsats:analytics-choice', () => { visitorId(); });

  send('view');
  // While the page stays open and in view, and only with consent, say so every 30 seconds for the live list.
  setInterval(() => { if (allowed() && document.visibilityState === 'visible') { scrolled(); send('ping'); } }, 30000);
  addEventListener('load', () => setTimeout(() => { if (allowed()) send('ping'); }, 1500));
})();
