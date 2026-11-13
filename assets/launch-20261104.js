(function () {
  'use strict';
  // Security check (owner decision, 13 November 2026): before a MyNSATS, newsletter or careers form is sent, the
  // browser solves a small ALTCHA proof-of-work puzzle from files.nsats.com. No third party is involved and nothing
  // is stored in the browser. The server is the authority: if the puzzle cannot be fetched (for example while
  // files.nsats.com does not offer it yet, when the browser refuses the answer, or on a network fault), the form is
  // sent without it and the server decides.
  var loadedAt = Date.now();
  function toHex(buf) {
    var b = new Uint8Array(buf), s = '';
    for (var i = 0; i < b.length; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16);
    return s;
  }
  async function solve(c) {
    var enc = new TextEncoder(), step = 500;
    for (var start = 0; start <= c.maxnumber; start += step) {
      var end = Math.min(start + step, c.maxnumber + 1), jobs = [];
      for (var n = start; n < end; n++) jobs.push(crypto.subtle.digest('SHA-256', enc.encode(c.salt + n)));
      var res = await Promise.all(jobs);
      for (var i = 0; i < res.length; i++) if (toHex(res[i]) === c.challenge) return start + i;
    }
    return -1;
  }
  // Puzzle timing (owner decision, 13 November 2026). The puzzle is requested when the visitor starts on the form
  // and solved in the background. A server that records the issue time in the puzzle measures the minimum time on
  // the page itself, from handing out the puzzle to receiving the form, so the form then goes no sooner than 3.2
  // seconds after the puzzle arrived (or the server's own minimum, when it states one, plus 0.2 seconds); usually
  // that time has long passed. Each puzzle is used once.
  var puzzles = new WeakMap();
  function sleep(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
  function puzzleInfo(c, n, at) {
    var i = /[?&]issued=(\d+)/.exec(c.salt || ''), e = /[?&]expires=(\d+)/.exec(c.salt || '');
    var ttl = i && e ? e[1] * 1000 - i[1] : 20000;
    var wait = (typeof c.min_ms === 'number' && c.min_ms >= 0 && c.min_ms <= 60000 ? c.min_ms : 3000) + 200;
    return { c: c, n: n, timed: !!i, at: at, wait: wait, fresh: Math.max(0, ttl - Math.min(60000, ttl / 4)) };
  }
  function warm(key, load) {
    if (!puzzles.has(key)) { var p = load(); p.catch(function () {}); puzzles.set(key, p); }
  }
  async function takePuzzle(key, load) {
    var p = puzzles.get(key), res;
    puzzles.delete(key);
    if (p) { try { res = await p; } catch (e) { res = undefined; } }
    if (!res || Date.now() - res.at > res.fresh) res = await load(); // none ready, failed, skipped or too old: ask again
    if (res && res.timed) { var wait = res.at + res.wait - Date.now(); if (wait > 0) await sleep(wait); }
    return res;
  }
  function powValue(res) {
    return btoa(JSON.stringify({ algorithm: res.c.algorithm, challenge: res.c.challenge, number: res.n, salt: res.c.salt, signature: res.c.signature }));
  }
  function hiddenField(form, name) {
    var el = form.querySelector('input[name="' + name + '"]');
    if (!el) { el = document.createElement('input'); el.type = 'hidden'; el.name = name; form.appendChild(el); }
    return el;
  }
  var TOR = 'This service cannot be used through the Tor network. Please connect without Tor and try again.';
  // A refusal for a Tor address carries the server's own explanation; show it instead of a general error.
  async function torRefusal(r) {
    if (r.status !== 403) return false;
    try { return (await r.text()).indexOf('through the Tor network') !== -1; } catch (e) { return false; }
  }
  function puzzleLoader(form) {
    return async function () {
      var name = new URL(form.action).pathname.replace(/^\/+|\/+$/g, '').replace(/\//g, '-'), r;
      try {
        r = await fetch('https://files.nsats.com/mynsats/challenge?form=' + encodeURIComponent(name), { credentials: 'omit', cache: 'no-store' });
      } catch (e) { return null; } // no readable answer (see above): send without the puzzle and let the server decide
      if (r.status === 404) return null; // the server does not ask for the check yet
      if (await torRefusal(r)) throw Error(TOR);
      if (r.status === 429) throw Error('Too many attempts from your network. Please try again later.');
      if (!r.ok) throw Error('The security check could not be completed.');
      var at = Date.now(), c = await r.json(), n = await solve(c);
      if (n < 0) throw Error('The security check could not be completed.');
      return puzzleInfo(c, n, at);
    };
  }
  async function securityCheck(form, load) {
    var res = await takePuzzle(form, load);
    if (!res) return;
    hiddenField(form, '_pow').value = powValue(res);
    hiddenField(form, '_elapsed').value = String(Date.now() - loadedAt); // for the record; the server measures the time itself
  }
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
    var load = puzzleLoader(form);
    ['focusin', 'pointerdown', 'input'].forEach(function (type) { form.addEventListener(type, function () { warm(form, load); }); });
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
        if (await torRefusal(response)) throw Error(TOR);
        if (!response.ok) throw Error('Please try again.');
        var data = await response.json();
        if (!data.csrf) throw Error('The security check could not be completed.');
        form.elements.csrf.value = data.csrf;
        await securityCheck(form, load);
        // Recheck in case an entry changed while the security request was pending.
        // Keep the button disabled while the browser sends the form; pageshow re-enables it on return.
        if (window.NSATSValidation.validate(form)) { sent = true; HTMLFormElement.prototype.submit.call(form); }
      } catch (error) {
        // Never show a browser's own technical wording.
        var ours = ['Please try again.', 'The security check could not be completed.', 'Too many attempts from your network. Please try again later.'];
        if (error.message === TOR) { report(TOR, true); return; }
        report('We could not submit this form. ' + (ours.indexOf(error.message) !== -1 ? error.message : 'Please check your connection and try again.'), true);
      } finally { if (!sent) { busy = false; button.disabled = false; } }
    });
    window.addEventListener('pageshow', function () { busy = false; var b = form.querySelector('[type=submit]'); if (b) b.disabled = false; });
  });
})();
