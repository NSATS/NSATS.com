/*
 * NSATS forms helper (forms.nsats.com/nsats-forms.js)
 * For any <form data-nsats-form="NAME">: records time on page, solves the NSATS
 * proof-of-work check (no third party involved), then sends the form. The puzzle is
 * fetched when the visitor starts on the form; forms.nsats.com measures the minimum
 * time itself from handing out the puzzle (13 November 2026).
 * For <form data-nsats-local="reset">: shows a fixed message only; nothing is sent.
 */
(function () {
  "use strict";
  var ENDPOINT = "https://forms.nsats.com/submit/";
  var loadedAt = Date.now();

  function toHex(buf) {
    var b = new Uint8Array(buf), s = "";
    for (var i = 0; i < b.length; i++) s += (b[i] < 16 ? "0" : "") + b[i].toString(16);
    return s;
  }

  async function solve(c) {
    var enc = new TextEncoder(), step = 500;
    for (var start = 0; start <= c.maxnumber; start += step) {
      var end = Math.min(start + step, c.maxnumber + 1), jobs = [];
      for (var n = start; n < end; n++) jobs.push(crypto.subtle.digest("SHA-256", enc.encode(c.salt + n)));
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
    var i = /[?&]issued=(\d+)/.exec(c.salt || ""), e = /[?&]expires=(\d+)/.exec(c.salt || "");
    var ttl = i && e ? e[1] * 1000 - i[1] : 20000;
    var wait = (typeof c.min_ms === "number" && c.min_ms >= 0 && c.min_ms <= 60000 ? c.min_ms : 3000) + 200;
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
  function puzzleLoader(name) {
    return async function () {
      var r = await fetch(ENDPOINT + "challenge?form=" + encodeURIComponent(name), { credentials: "omit", cache: "no-store" });
      if (!r.ok) throw new Error(r.status === 429 ? "busy" : "challenge");
      var at = Date.now(), c = await r.json(), n = await solve(c);
      if (n < 0) throw new Error("solve");
      return puzzleInfo(c, n, at);
    };
  }
  ["focusin", "pointerdown", "input"].forEach(function (type) {
    document.addEventListener(type, function (ev) {
      var t = ev.target, form = t && (t.form || (t.closest && t.closest("form[data-nsats-form]")));
      var name = form && form.getAttribute && form.getAttribute("data-nsats-form");
      if (name) warm(form, puzzleLoader(name));
    });
  });

  function hidden(form, name) {
    var el = form.querySelector('input[name="' + name + '"]');
    if (!el) { el = document.createElement("input"); el.type = "hidden"; el.name = name; form.appendChild(el); }
    return el;
  }

  function status(form, text, failed) {
    var el = form.querySelector("[data-nsats-status]");
    if (el) { el.classList.toggle("nsats-form-failure", !!(failed && text)); el.textContent = text; el.hidden = !text; } else if (text) { window.alert(text); }
  }

  // Forms marked data-nsats-local are answered in the browser: their fields have no names,
  // the form has no action, and nothing is sent, stored or logged.
  var LOCAL = {
    reset: "If an account is associated with this email address, we will send you instructions to reset your password."
  };
  document.addEventListener("submit", function (ev) {
    var form = ev.target, kind = form.getAttribute && form.getAttribute("data-nsats-local");
    if (!kind || !LOCAL[kind]) return;
    ev.preventDefault();
    form.reset();
    status(form, LOCAL[kind]);
  });

  // Links into a demonstration can choose a scenario (?scenario=…&task=…#workspace). When such a link
  // reaches the access-request form on the public site, keep the choice in the form and in the
  // "Already verified" link, so the visitor lands on that scenario. files.nsats.com accepts only the
  // scenario names it knows and drops anything else.
  function carryDeepLink() {
    if (location.hostname === "files.nsats.com") return; // there the server puts the choice in the form itself
    var q = new URLSearchParams(location.search), keep = new URLSearchParams(), ok = /^[a-z0-9-]{1,40}$/;
    ["scenario", "task"].forEach(function (k) { var v = q.get(k); if (v && ok.test(v)) keep.set(k, v); });
    if (!keep.toString()) return;
    var extra = "?" + keep.toString() + (/^#[a-z0-9-]{1,40}$/.test(location.hash) ? location.hash : "");
    var forms = document.querySelectorAll('form[data-nsats-form="evidence-access"]');
    for (var i = 0; i < forms.length; i++) {
      var page = forms[i].querySelector('input[name="page"]');
      if (!page || !page.value || /[?#]/.test(page.value)) continue;
      page.value += extra;
      var box = forms[i].closest("article") || document, links = box.querySelectorAll('a[href^="https://files.nsats.com/r/"]');
      for (var j = 0; j < links.length; j++) if (!/[?#]/.test(links[j].getAttribute("href"))) links[j].setAttribute("href", links[j].getAttribute("href") + extra);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", carryDeepLink); else carryDeepLink();

  document.addEventListener("submit", async function (ev) {
    var form = ev.target, name = form.getAttribute && form.getAttribute("data-nsats-form");
    if (!name) return;
    ev.preventDefault();
    if (form.getAttribute('data-nsats-busy') === '1') return;
    if (!window.NSATSValidation) { status(form, "This form could not be prepared. Please reload the page and try again.", true); return; }
    if (!window.NSATSValidation.validate(form)) return;
    form.setAttribute('data-nsats-busy', '1');
    ev.preventDefault();
    var btn = form.querySelector('[type="submit"]'), label = btn ? btn.textContent : "", sent = false;
    if (btn) { btn.setAttribute("data-nsats-label", label); btn.disabled = true; btn.textContent = "Sending…"; }
    status(form, "");
    try {
      var res = await takePuzzle(form, puzzleLoader(name));
      hidden(form, "_pow").value = powValue(res);
      hidden(form, "_elapsed").value = String(Date.now() - loadedAt);
      if (window.NSATSValidation.validate(form)) {
        // Keep the button disabled while the browser sends the form; pageshow re-enables it on return.
        sent = true;
        HTMLFormElement.prototype.submit.call(form);
      }
    } catch (e) {
      if (btn) { btn.disabled = false; btn.textContent = label; }
      status(form, e.message === "busy"
        ? "Too many attempts from your network. Please try again later."
        : "The security check could not be completed. Please check your connection and try again.", true);
    } finally {
      if (!sent) {
        form.removeAttribute('data-nsats-busy');
        if (btn) { btn.disabled = false; btn.textContent = label; }
      }
    }
  });
  window.addEventListener('pageshow', function () {
    document.querySelectorAll('[data-nsats-form]').forEach(function (form) {
      form.removeAttribute('data-nsats-busy'); form.removeAttribute('data-nsats-ready');
      var btn = form.querySelector('[type="submit"]'); if (btn) { btn.disabled = false; if (btn.textContent === "Sending…" && btn.hasAttribute("data-nsats-label")) btn.textContent = btn.getAttribute("data-nsats-label"); }
    });
  });
})();
