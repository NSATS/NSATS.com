/* NSATS Temporal Compression demonstration — Stage 1 interactive illustration (demonstrations build, 12 October 2026).
   Real: fetching the approved website samples, SHA-256 of the complete fetched bytes, full-value comparisons, offering the
   checked bytes for saving, optional local check of a file the visitor selects (it never leaves the browser).
   Illustrated: sending, acceptance, receipt, storage and decompression. No upload, no storage endpoint, no visitor-file
   transfer; sample codes never go into the address bar. Every visible string comes from window.NSATS_TC. */
(function () {
  'use strict';
  var D = window.NSATS_TC, app = document.getElementById('demo-app');
  if (!D || !app) return;
  var T = D.text, C = T.common, X = T.extra, K = T.controls, S = T.states, RF = T.receipt_fields, SF = T.summary_fields,
      SRC = T.sources, CL = T.comparison_labels, AL = T.application_labels;
  var SC = {}; D.scenarios.forEach(function (s) { SC[s.id] = s; });
  var PREP = {}; D.prepared.forEach(function (r) { PREP[r.code] = r; });
  var STORE_KEY = 'nsats-tc-demo-v1';
  var CODE_RE = /^SAMPLE-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') n.textContent = v; else if (k === 'on') Object.keys(v).forEach(function (e) { n.addEventListener(e, v[e]); });
      else n.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function btn(label, fn, cls, pressed) {
    return el('button', { type: 'button', 'class': 'demo-btn' + (cls ? ' ' + cls : ''), 'aria-pressed': pressed === undefined ? null : String(!!pressed), on: { click: fn }, text: label });
  }
  function dl(rows) {
    var d = el('dl', { 'class': 'demo-dl' });
    rows.forEach(function (r) {
      if (!r) return;
      d.appendChild(el('dt', { text: r[0] }));
      d.appendChild(el('dd', { 'class': r[2] || null, text: r[1] }));
    });
    return d;
  }
  function fill(s, map) { return s.replace(/\{(\w+)\}/g, function (m, k) { return map[k] !== undefined ? map[k] : m; }); }
  function size(n) { return n.toLocaleString('en-GB') + ' ' + X.bytes; }
  function abbr(fp) { return fp ? fp.slice(0, 12) + '…' + fp.slice(-8) : '—'; }

  // ---------------------------------------------------------------- SHA-256 (Web Crypto; small standard fallback where unavailable)
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function sha256(bytes) {
    if (window.crypto && window.crypto.subtle && window.crypto.subtle.digest) return window.crypto.subtle.digest('SHA-256', bytes).then(hex);
    return Promise.resolve(sha256js(new Uint8Array(bytes)));
  }
  function sha256js(m) {
    var k = [], h = [1779033703, -1150833019, 1013904242, -1521486534, 1359893119, -1694144372, 528734635, 1541459225], i, j;
    var p = 2; for (i = 0; i < 64; p++) { var isP = true; for (j = 2; j * j <= p; j++) if (p % j === 0) { isP = false; break; } if (isP) k[i++] = (Math.pow(p, 1 / 3) % 1) * 4294967296 | 0; }
    var l = m.length, n = ((l + 9 + 63) >> 6) << 4, w = new Array(n).fill(0);
    for (i = 0; i < l; i++) w[i >> 2] |= m[i] << (24 - (i % 4) * 8);
    w[l >> 2] |= 0x80 << (24 - (l % 4) * 8); w[n - 1] = l * 8; w[n - 2] = Math.floor(l / 536870912);
    function r(x, y) { return (x >>> y) | (x << (32 - y)); }
    for (i = 0; i < n; i += 16) {
      var a = h.slice(), W = [];
      for (j = 0; j < 64; j++) {
        W[j] = j < 16 ? w[i + j] : (r(W[j - 2], 17) ^ r(W[j - 2], 19) ^ (W[j - 2] >>> 10)) + W[j - 7] + (r(W[j - 15], 7) ^ r(W[j - 15], 18) ^ (W[j - 15] >>> 3)) + W[j - 16] | 0;
        var t1 = a[7] + (r(a[4], 6) ^ r(a[4], 11) ^ r(a[4], 25)) + ((a[4] & a[5]) ^ (~a[4] & a[6])) + k[j] + W[j] | 0;
        var t2 = (r(a[0], 2) ^ r(a[0], 13) ^ r(a[0], 22)) + ((a[0] & a[1]) ^ (a[0] & a[2]) ^ (a[1] & a[2])) | 0;
        a = [t1 + t2 | 0].concat(a.slice(0, 7)); a[4] = a[4] + t1 | 0;
      }
      for (j = 0; j < 8; j++) h[j] = h[j] + a[j] | 0;
    }
    return h.map(function (x) { return ('0000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
  }

  // ---------------------------------------------------------------- per-tab memory (never relied on; failures are reported)
  var memOK = true, mem = { receipts: {} };
  try { var raw = window.sessionStorage.getItem(STORE_KEY); if (raw) mem = JSON.parse(raw) || mem; if (!mem.receipts) mem.receipts = {}; }
  catch (e) { memOK = false; }
  function save() { try { window.sessionStorage.setItem(STORE_KEY, JSON.stringify(mem)); } catch (e) { if (memOK) { memOK = false; say(S.memory_state_unavailable); } } }
  function newCode() {
    var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = new Uint8Array(8), s = '';
    (window.crypto || {}).getRandomValues ? window.crypto.getRandomValues(b) : b.forEach(function (_, i) { b[i] = Math.floor(Math.random() * 256); });
    for (var i = 0; i < 8; i++) s += A[b[i] % A.length];
    var code = 'SAMPLE-' + s.slice(0, 4) + '-' + s.slice(4);
    return PREP[code] || mem.receipts[code] ? newCode() : code;
  }

  // ---------------------------------------------------------------- state
  var st;
  function fresh(id, task) {
    st = { s: id ? SC[id] : null, task: task || null, sel: null, selFp: null, selBusy: false, showFull: false,
           receipt: null, branch: null, pendingReceipt: null, code: '', checked: null, fetching: null, progress: null,
           fetched: null, fetchedFp: null, res: null, example: null, saveOffered: false, june: false, local: null, done: false, lastMsg: '' };
  }
  function receiptOf(code) {
    if (PREP[code]) { var p = PREP[code], smp = D.samples[p.sample]; return { code: code, sample: p.sample, version: p.version, fp: smp.sha256, source: 'prepared_receipt', status: 'stored' }; }
    var r = mem.receipts[code];
    return r ? { code: code, sample: r.sample, version: r.version, fp: r.fp, source: 'selection', status: r.status } : null;
  }

  // ---------------------------------------------------------------- layout
  app.hidden = false;
  var setup = el('div', { 'class': 'demo-stack demo-setup' });
  var activity = el('div', { 'class': 'demo-stack demo-activity' });
  var summary = el('section', { 'class': 'demo-stack demo-summary', 'aria-label': X.summary });
  app.appendChild(setup); app.appendChild(activity); app.appendChild(summary);
  var live = el('p', { 'class': 'demo-sr', role: 'status', 'aria-live': 'polite' });
  var msg = el('p', { 'class': 'demo-msg', role: 'status', 'aria-live': 'polite' });
  function say(text) { st.lastMsg = text; msg.textContent = text; live.textContent = ''; window.setTimeout(function () { live.textContent = text; }, 30); renderSummary(); }

  var setupPanel = el('div', { 'class': 'demo-panel' });
  setupPanel.appendChild(el('p', { 'class': 'demo-mode' }, [el('strong', { text: C.mode }), T.mode_help]));
  setupPanel.appendChild(el('div', { 'class': 'demo-buttons' }, [
    btn(C.guided, function () { start(D.scenarios[0].id, null); say(st.s.first_action); }),
    btn(C.free, function () { select.focus(); }, 'secondary')]));
  var taskBtns = el('div', { 'class': 'demo-buttons', role: 'group', 'aria-label': T.tasks.join(' / ') });
  var bStore = btn(T.tasks[0], function () { setTask('store'); }, 'secondary', false);
  var bRetrieve = btn(T.tasks[1], function () { setTask('retrieve'); }, 'secondary', false);
  taskBtns.appendChild(bStore); taskBtns.appendChild(bRetrieve);
  setupPanel.appendChild(taskBtns);
  var select = el('select', { id: 'tc-scenario' });
  select.appendChild(el('option', { value: '', text: C.scenario }));
  D.scenarios.forEach(function (s) { select.appendChild(el('option', { value: s.id, text: s.title })); });
  select.addEventListener('change', function () { start(select.value || null, null); if (st.s) say(st.s.first_action); });
  setupPanel.appendChild(el('div', { 'class': 'demo-field' }, [el('label', { 'for': 'tc-scenario', text: C.scenario }), select]));
  var taskBox = el('div', { 'class': 'demo-task' });
  setupPanel.appendChild(taskBox);
  setupPanel.appendChild(el('div', { 'class': 'demo-buttons' }, [btn(C.reset, resetAll, 'secondary')]));
  setupPanel.appendChild(msg);
  setup.appendChild(setupPanel);

  var tracker = el('ol', { 'class': 'demo-tracker' });
  var work = el('div', { 'class': 'demo-panel' });
  var appPanel = el('div', { 'class': 'demo-panel' });
  activity.appendChild(el('div', { 'class': 'demo-panel' }, [tracker]));
  activity.appendChild(work); activity.appendChild(appPanel); activity.appendChild(live);
  var sumPanel = el('div', { 'class': 'demo-panel' });
  var complete = el('div', { 'class': 'demo-complete', hidden: true });
  summary.appendChild(sumPanel); summary.appendChild(complete);

  // ---------------------------------------------------------------- navigation
  function setQuery() {
    try {
      var u = new URL(window.location.href);
      if (st.s) u.searchParams.set('scenario', st.s.id); else u.searchParams.delete('scenario');
      if (st.task) u.searchParams.set('task', st.task); else u.searchParams.delete('task');
      window.history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) { /* history unavailable: continue */ }
  }
  function start(id, task) {
    abortFetch();
    fresh(id, null);
    if (st.s) st.task = task || st.s.default_task;
    select.value = id || '';
    setQuery(); render();
  }
  function setTask(task) {
    if (!st.s) { start(D.scenarios[0].id, task); say(st.s.first_action); return; }
    abortFetch();
    st.task = task; setQuery(); render();
  }
  function resetAll() {
    abortFetch();
    mem = { receipts: {} }; save();
    var id = st.s && st.s.id; start(id || null, null); say(S.reset_done);
  }

  // ---------------------------------------------------------------- store task
  function chooseSample(id) {
    st.sel = id; st.selFp = null; st.selBusy = true; st.receipt = null; st.branch = null; st.pendingReceipt = null; render();
    say(S.reading_sample);
    var smp = D.samples[id];
    fetch(smp.url, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('status'); return r.arrayBuffer(); })
      .then(function (b) { return sha256(b); })
      .then(function (fp) { if (st.sel !== id) return; st.selFp = fp; st.selBusy = false; render(); say(S.sample_ready); })
      .catch(function () { if (st.sel !== id) return; st.selBusy = false; st.sel = null; render(); say(S.fingerprint_failed); });
  }
  function issueReceipt(status) {
    var code = newCode();
    mem.receipts[code] = { sample: st.sel, version: D.version, fp: st.selFp, status: status };
    save();
    return code;
  }
  function send() {
    if (!st.sel || !st.selFp) { say(S.sample_missing); return; }
    st.branch = null; say(S.sending_illustrated);
    window.setTimeout(function () { st.receipt = issueReceipt('received'); render(); say(S.received_illustrated); }, 700);
  }
  function exampleSubmission() {
    if (!st.sel || !st.selFp) { say(S.sample_missing); return; }
    st.branch = 'submission'; st.pendingReceipt = issueReceipt('received'); st.receipt = null; render(); say(S.outcome_unknown_example);
  }
  function checkSubmission() { st.receipt = st.pendingReceipt; st.pendingReceipt = null; st.branch = 'recovered'; render(); say(S.receipt_recovered_example); }
  function exampleFailure() {
    if (!st.receipt) { if (!st.sel || !st.selFp) { say(S.sample_missing); return; } st.receipt = issueReceipt('received'); }
    mem.receipts[st.receipt].status = 'failed'; save(); st.branch = 'failed'; render(); say(S.storage_failed_example);
  }
  function later(code) {
    var r = mem.receipts[code];
    if (!r || r.status !== 'received') return;
    r.status = 'stored'; save(); render(); say(S.stored_illustrated);
  }
  function copyCode(code) {
    function ok() { say(S.copied); }
    function bad() { say(S.copy_failed); }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(code).then(ok, bad); return; }
    } catch (e) { /* fall through */ }
    bad();
  }
  function offer(name, blob) {
    var url = URL.createObjectURL(blob), a = el('a', { href: url, download: name, hidden: true });
    document.body.appendChild(a); a.click();
    window.setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 4000);
  }
  function saveReceipt(code) {
    try {
      var r = receiptOf(code), smp = D.samples[r.sample];
      var lines = [T.receipt_heading, '', RF[0] + ': ' + code, RF[1] + ': ' + smp.file, RF[2] + ': ' + size(smp.size), RF[3] + ': ' + r.fp,
        RF[4] + ': ' + SRC[r.source], RF[5] + ': ' + statusText(r.status), RF[6] + ': ' + r.version, '', C.mode + ' — ' + T.mode_help];
      offer(code + '.txt', new Blob([lines.join('\n') + '\n'], { type: 'text/plain' }));
      say(S.receipt_offered);
    } catch (e) { say(S.receipt_prepare_failed); }
  }
  function statusText(s) { return s === 'stored' ? S.stored_illustrated : s === 'failed' ? S.storage_failed_example : S.received_illustrated; }

  // ---------------------------------------------------------------- retrieve task
  function clearRetrieval() { abortFetch(); st.retry = false; st.checked = null; st.fetched = null; st.fetchedFp = null; st.res = null; st.example = null; st.saveOffered = false; st.local = null; st.progress = null; }
  function useCode(code) { st.code = code; clearRetrieval(); render(); checkStatus(); }
  function checkStatus() {
    var raw = (st.code || '').trim().toUpperCase();
    clearRetrieval();
    if (!raw) { render(); say(S.empty_code); return; }
    if (!CODE_RE.test(raw)) { render(); say(S.not_sample); return; }
    var r = receiptOf(raw);
    if (!r || r.version !== D.version || !D.samples[r.sample]) { render(); say(S.unrecognised_sample); return; }
    st.code = raw; st.checked = r; render(); say(S.checking_status);
    window.setTimeout(function () {
      if (!st.checked || st.checked.code !== raw) return;
      say(S.recognised + ' ' + (r.status === 'stored' ? S.stored_ready_illustrated : r.status === 'failed' ? S.storage_failed_example : S.not_ready_illustrated));
      render();
    }, 400);
  }
  function abortFetch() { if (st && st.fetching) { try { st.fetching.abort(); } catch (e) { /* ignore */ } st.fetching = null; } }
  function fetchAndCheck() {
    var r = st.checked; if (!r) return;
    r = receiptOf(r.code); st.checked = r;
    if (r.status !== 'stored') { say(r.status === 'failed' ? S.storage_failed_example : S.not_ready_illustrated); return; }
    st.example = null; st.res = null; st.fetched = null; st.fetchedFp = null; st.saveOffered = false; st.local = null;
    var smp = D.samples[r.sample], ctrl = window.AbortController ? new AbortController() : null;
    st.fetching = ctrl || {}; render(); say(S.decompressing_illustrated);
    window.setTimeout(function () {
      if (st.fetching !== (ctrl || st.fetching)) return;
      say(S.fetching);
      fetch(smp.url, { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined }).then(function (resp) {
        if (!resp.ok) throw new Error('status');
        var total = +resp.headers.get('Content-Length') || smp.size;
        if (!resp.body || !resp.body.getReader) return resp.arrayBuffer();
        var reader = resp.body.getReader(), parts = [], got = 0;
        function pump() {
          return reader.read().then(function (x) {
            if (x.done) { var out = new Uint8Array(got), o = 0; parts.forEach(function (p) { out.set(p, o); o += p.length; }); return out.buffer; }
            parts.push(x.value); got += x.value.length; st.progress = [got, total];
            msg.textContent = fill(S.fetching_progress, { bytes_received: got.toLocaleString('en-GB'), bytes_total: total.toLocaleString('en-GB') });
            return pump();
          });
        }
        return pump();
      }).then(function (buf) {
        st.fetching = null; st.fetched = buf; st.retry = false; render(); say(S.checking);
        return sha256(buf).then(function (fp) {
          st.fetchedFp = fp;
          var res = { receipt: fp === r.fp };
          if (st.s.application_expected) res.app = fp === st.s.application_expected;
          st.res = res; render();
          if (!res.receipt) say(S.mismatch_actual);
          else if (res.app === false) say(st.s.id === 'design-revision' ? S.required_revision_mismatch : S.original_mismatch);
          else say(S.match_actual + ' ' + S.save_ready);
        }, function () { st.fetched = null; render(); say(S.check_failed); });
      }).catch(function (e) {
        var stopped = e && e.name === 'AbortError';
        st.fetching = null; st.fetched = null; st.progress = null; st.retry = true; render();
        say(stopped ? S.fetch_stopped : S.fetch_interrupted_actual);
      });
    }, 450);
  }
  function showExample(kind) {
    abortFetch(); st.res = null; st.fetched = null; st.fetchedFp = null; st.saveOffered = false; st.example = kind; render();
    say(kind === 'interruption' ? S.fetch_interrupted_example : S.mismatch_example);
  }
  function requiredMet() {
    if (!st.s || !st.res || !st.checked || st.example) return false;
    if (st.s.required_sample && st.checked.sample !== st.s.required_sample) return false;
    return st.s.required.every(function (k) { return k === 'receipt' ? st.res.receipt : st.res.app === true; });
  }
  function saveFile() {
    if (!requiredMet()) return;
    try {
      var smp = D.samples[st.checked.sample];
      offer(smp.file, new Blob([st.fetched], { type: smp.type }));
      st.saveOffered = true;
      if (!st.s.also_required || st.june) st.done = true;
      render(); say(S.save_offered);
    } catch (e) { say(S.save_prepare_failed); }
  }
  function localCheck(input) {
    var f = input.files && input.files[0];
    if (!f) { st.local = null; render(); say(S.local_check_empty); return; }
    var expected = st.checked && st.checked.fp;
    if (!expected) { say(S.missing_expected); return; }
    say(S.local_checking);
    (f.arrayBuffer ? f.arrayBuffer() : new Promise(function (ok, no) { var fr = new FileReader(); fr.onload = function () { ok(fr.result); }; fr.onerror = no; fr.readAsArrayBuffer(f); }))
      .then(sha256).then(function (fp) { st.local = fp === expected; render(); say(st.local ? S.local_match : S.local_mismatch); },
        function () { st.local = null; render(); say(S.local_check_failed); });
  }

  // ---------------------------------------------------------------- rendering
  function render() {
    bStore.setAttribute('aria-pressed', String(st.task === 'store'));
    bRetrieve.setAttribute('aria-pressed', String(st.task === 'retrieve'));
    renderTask(); renderTracker(); renderWork(); renderApp(); renderSummary();
  }
  function renderTask() {
    taskBox.textContent = '';
    if (!st.s) { taskBox.appendChild(el('p', { text: S.empty })); return; }
    taskBox.appendChild(el('h3', { text: st.s.title }));
    taskBox.appendChild(el('p', { text: st.s.task }));
    taskBox.appendChild(el('p', { 'class': 'demo-first', text: st.s.first_action }));
  }
  function renderTracker() {
    tracker.textContent = '';
    if (!st.s) return;
    var steps, cur;
    if (st.task === 'store') {
      var r = st.receipt && receiptOf(st.receipt);
      steps = [K[0], K[1], S.received_illustrated, r && r.status === 'failed' ? S.storage_failed_example : S.stored_illustrated];
      cur = !st.selFp ? 0 : !r ? 1 : r.status === 'received' ? 2 : 3;
      tracker.setAttribute('aria-label', X.store_steps);
    } else {
      steps = [K[8], S.decompressing_illustrated, K[9], K[12]];
      cur = !st.checked ? 0 : st.fetching ? 1 : !st.res ? 2 : 3;
      tracker.setAttribute('aria-label', X.retrieve_steps);
    }
    steps.forEach(function (s, k) { tracker.appendChild(el('li', { 'aria-current': k === cur ? 'step' : null, 'class': k < cur ? 'is-done' : null, text: s })); });
  }
  function fpBlock(fp) {
    var box = el('div', {});
    box.appendChild(el('p', { 'class': 'demo-fp', text: st.showFull ? fp : abbr(fp) }));
    box.appendChild(el('p', { 'class': 'demo-help', text: T.fingerprint_help }));
    var b = btn(st.showFull ? K[6] : K[5], function () { st.showFull = !st.showFull; render(); }, 'secondary');
    b.setAttribute('aria-expanded', String(st.showFull));
    box.appendChild(el('div', { 'class': 'demo-buttons' }, [b]));
    return box;
  }
  function radioList(name, legend, items, current, onPick) {
    var fs = el('fieldset', { 'class': 'demo-options' }, [el('legend', { text: legend })]);
    items.forEach(function (it, k) {
      var id = name + '-' + k;
      var inp = el('input', { type: 'radio', name: name, id: id, value: it.value, checked: it.value === current ? true : null, on: { change: function () { onPick(it.value); } } });
      fs.appendChild(el('label', { 'class': 'demo-option', 'for': id }, [inp, el('span', {}, [it.label, it.help ? el('span', { 'class': 'demo-help', text: it.help }) : null])]));
    });
    return fs;
  }
  function renderWork() {
    work.textContent = '';
    if (!st.s) { work.appendChild(el('p', { text: S.empty })); return; }
    if (st.task === 'store') renderStore(); else renderRetrieve();
  }
  function renderStore() {
    work.appendChild(el('h3', { text: T.tasks[0] }));
    var steps = el('ol', { 'class': 'demo-steps' });
    // 1 choose
    var s1 = el('li', { 'class': st.selFp ? 'is-done' : null }, [el('h4', { text: '1 · ' + K[0] })]);
    s1.appendChild(radioList('tc-sample', X.sample_choice, st.s.store_samples.map(function (id) {
      var smp = D.samples[id]; return { value: id, label: smp.label, help: smp.file + ' · ' + size(smp.size) };
    }), st.sel, chooseSample));
    steps.appendChild(s1);
    // 2 check details
    if (st.sel && st.selFp) {
      var smp = D.samples[st.sel];
      var s2 = el('li', { 'class': 'is-done' }, [el('h4', { text: '2 · ' + SF[5] })]);
      s2.appendChild(dl([[SF[2], smp.file], [SF[3], size(smp.size)], [SF[4], smp.type], [SF[8], SRC.selection]]));
      s2.appendChild(fpBlock(st.selFp));
      steps.appendChild(s2);
      // 3 send
      var s3 = el('li', { 'class': st.receipt ? 'is-done' : null }, [el('h4', { text: '3 · ' + K[1] })]);
      var bs = btn(K[1], send); bs.disabled = !!st.receipt && st.branch !== 'failed';
      var row = el('div', { 'class': 'demo-buttons' }, [bs]);
      if (st.s.branches.indexOf('submission') >= 0 && !st.receipt && st.branch !== 'submission') row.appendChild(btn(K[19], exampleSubmission, 'secondary'));
      if (st.branch === 'submission') row.appendChild(btn(K[15], checkSubmission));
      s3.appendChild(row);
      if (st.branch === 'submission') s3.appendChild(el('div', { 'class': 'demo-example' }, [el('h4', { text: S.example_result_label }), el('p', { text: S.outcome_unknown_example })]));
      steps.appendChild(s3);
    }
    work.appendChild(steps);
    if (st.receipt) {
      var r = receiptOf(st.receipt);
      if (!r) { work.appendChild(el('p', { text: S.memory_state_unavailable })); return; }
      if (st.branch === 'recovered') work.appendChild(el('div', { 'class': 'demo-example' }, [el('h4', { text: S.example_result_label }), el('p', { text: S.receipt_recovered_example })]));
      work.appendChild(receiptCard(r));
      var acts = el('div', { 'class': 'demo-buttons' });
      if (r.status === 'received') acts.appendChild(btn(K[2], function () { later(r.code); }));
      if (st.s.branches.indexOf('storage_failure') >= 0 && r.status === 'received') acts.appendChild(btn(K[20], exampleFailure, 'secondary'));
      if (st.branch === 'failed') acts.appendChild(btn(K[21], function () { st.branch = null; st.receipt = null; render(); say(st.s.first_action); }, 'secondary'));
      if (r.status !== 'failed') acts.appendChild(btn(K[7], function () { st.task = 'retrieve'; setQuery(); useCode(r.code); }, r.status === 'stored' ? null : 'secondary'));
      work.appendChild(acts);
      if (r.status === 'failed') work.appendChild(el('div', { 'class': 'demo-example' }, [el('h4', { text: S.example_result_label }), el('p', { text: S.storage_failed_example })]));
    }
  }
  function receiptCard(r) {
    var smp = D.samples[r.sample];
    var card = el('section', { 'class': 'demo-receipt', 'aria-label': T.receipt_heading }, [el('h4', { text: T.receipt_heading })]);
    card.appendChild(el('div', { 'class': 'demo-buttons' }, [btn(K[3], function () { copyCode(r.code); }), btn(K[4], function () { saveReceipt(r.code); }, 'secondary')]));
    card.appendChild(dl([[RF[0], r.code, 'demo-code'], [RF[1], smp.file], [RF[2], size(smp.size)], [RF[3], r.fp, 'demo-fp'],
      [RF[4], SRC[r.source]], [RF[5], statusText(r.status)], [RF[6], r.version]]));
    return card;
  }
  function renderRetrieve() {
    work.appendChild(el('h3', { text: T.tasks[1] }));
    var steps = el('ol', { 'class': 'demo-steps' });
    // 1 code
    var s1 = el('li', { 'class': st.checked ? 'is-done' : null }, [el('h4', { text: '1 · ' + RF[0] })]);
    var options = [];
    if (st.s.id !== 'maintenance-record') st.s.prepared.forEach(function (code) { options.push({ value: code, label: D.samples[PREP[code].sample].label, help: code + ' · ' + SRC.prepared_receipt }); });
    Object.keys(mem.receipts).forEach(function (code) {
      var r = mem.receipts[code];
      if (st.s.store_samples.indexOf(r.sample) >= 0 && r.version === D.version) options.push({ value: code, label: D.samples[r.sample].label, help: code + ' · ' + SRC.selection });
    });
    if (options.length) s1.appendChild(radioList('tc-receipt', X.prepared_receipts, options, st.code, function (v) { useCode(v); }));
    var inp = el('input', { type: 'text', id: 'tc-code', autocomplete: 'off', spellcheck: 'false', 'aria-describedby': 'tc-code-help', value: st.code || '' });
    inp.addEventListener('input', function () { st.code = inp.value; });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); checkStatus(); } });
    s1.appendChild(el('div', { 'class': 'demo-field' }, [el('label', { 'for': 'tc-code', text: RF[0] }), el('span', { id: 'tc-code-help', 'class': 'demo-help', text: T.code_help }), inp]));
    s1.appendChild(el('p', { 'class': 'demo-help', text: S.sample_return_help }));
    s1.appendChild(el('div', { 'class': 'demo-buttons' }, [btn(K[8], checkStatus)]));
    steps.appendChild(s1);
    // 2 status / fetch and check
    if (st.checked) {
      var r = receiptOf(st.checked.code), smp = D.samples[r.sample];
      var s2 = el('li', { 'class': st.res ? 'is-done' : null }, [el('h4', { text: '2 · ' + K[9] })]);
      s2.appendChild(dl([[SF[2], smp.file], [SF[3], size(smp.size)], [RF[5], statusText(r.status)], [SF[8], SRC[r.source]]]));
      var row = el('div', { 'class': 'demo-buttons' });
      if (r.status === 'received') row.appendChild(btn(K[2], function () { later(r.code); checkStatus(); }, 'secondary'));
      var bf = btn(st.res || st.example || st.retry ? K[11] : K[9], fetchAndCheck); bf.disabled = r.status !== 'stored' || !!st.fetching;
      row.appendChild(bf);
      if (st.fetching) row.appendChild(btn(K[10], function () { abortFetch(); st.progress = null; st.retry = true; render(); say(S.fetch_stopped); }, 'secondary'));
      if (r.status === 'stored' && !st.fetching) {
        if (st.s.branches.indexOf('interruption') >= 0) row.appendChild(btn(K[17], function () { showExample('interruption'); }, 'secondary', st.example === 'interruption'));
        if (st.s.branches.indexOf('mismatch') >= 0) row.appendChild(btn(K[18], function () { showExample('mismatch'); }, 'secondary', st.example === 'mismatch'));
        if (st.example) row.appendChild(btn(K[21], function () { st.example = null; render(); say(st.s.first_action); }, 'secondary'));
      }
      s2.appendChild(row);
      if (st.progress && st.fetching) s2.appendChild(el('progress', { 'class': 'demo-progress', max: String(st.progress[1]), value: String(st.progress[0]), 'aria-label': S.fetching }));
      if (st.example) {
        s2.appendChild(el('div', { 'class': 'demo-example' }, [el('h4', { text: S.example_result_label }),
          el('p', { text: st.example === 'interruption' ? S.fetch_interrupted_example : S.mismatch_example })]));
        s2.appendChild(el('div', { 'class': 'demo-result' }, [el('h4', { text: S.actual_result_label }), el('p', { text: S.no_actual_check })]));
      }
      if (st.res) s2.appendChild(resultBlock(r));
      steps.appendChild(s2);
      // 3 save and local check
      if (st.res && !st.example) {
        var s3 = el('li', { 'class': st.saveOffered ? 'is-done' : null }, [el('h4', { text: '3 · ' + K[12] })]);
        var ok = requiredMet();
        var bsv = btn(st.saveOffered ? K[13] : K[12], saveFile); bsv.disabled = !ok;
        s3.appendChild(el('p', { text: ok ? (st.saveOffered ? S.save_offered : S.save_ready) : '' }));
        s3.appendChild(el('div', { 'class': 'demo-buttons' }, [bsv]));
        var fi = el('input', { type: 'file', id: 'tc-local', 'aria-describedby': 'tc-local-help' });
        fi.addEventListener('change', function () { localCheck(fi); });
        s3.appendChild(el('div', { 'class': 'demo-field' }, [el('label', { 'for': 'tc-local', text: K[14] }), el('span', { id: 'tc-local-help', 'class': 'demo-help', text: T.local_check_help }), fi]));
        if (st.local !== null) s3.appendChild(el('p', { 'class': 'demo-result ' + (st.local ? 'is-match' : 'is-mismatch'), text: st.local ? S.local_match : S.local_mismatch }));
        steps.appendChild(s3);
      }
    }
    work.appendChild(steps);
  }
  function resultBlock(r) {
    var res = st.res, box = el('div', { 'class': 'demo-result ' + (res.receipt && res.app !== false ? 'is-match' : 'is-mismatch') }, [el('h4', { text: S.actual_result_label })]);
    box.appendChild(dl([[CL[0], SRC[r.source]], [CL[1], st.fetchedFp, 'demo-fp'], [CL[2], r.fp, 'demo-fp'], [CL[3], res.receipt ? S.match_actual : S.mismatch_actual]]));
    if (st.s.application_expected) {
      var appSrc = st.s.id === 'design-revision' ? SRC.review_register : SRC.document_library;
      var appLbl = st.s.id === 'design-revision' ? CL[4] : CL[5];
      box.appendChild(dl([[CL[0], appSrc], [CL[2], st.s.application_expected, 'demo-fp'], [appLbl, res.app ? S.match_actual : S.mismatch_actual]]));
    }
    box.appendChild(el('p', { 'class': 'demo-help', text: S.match_help }));
    return box;
  }
  function renderApp() {
    appPanel.textContent = '';
    if (!st.s) { appPanel.hidden = true; return; }
    appPanel.hidden = false;
    appPanel.appendChild(el('h3', { text: st.s.application_panel }));
    var id = st.s.id, ul = el('ul', { 'class': 'demo-log' });
    function anyReceipt(sample) { return Object.keys(mem.receipts).some(function (c) { return mem.receipts[c].sample === sample; }) || (st.checked && st.checked.sample === sample); }
    if (id === 'research-dataset') {
      if (anyReceipt('river-2025')) ul.appendChild(el('li', { text: AL.research_receipt_kept }));
    } else if (id === 'maintenance-record') {
      var codes = { 0: 'SAMPLE-P104-MR3S', 1: 'SAMPLE-P104-AP4B' };
      AL.maintenance_rows.forEach(function (row, k) {
        var li = el('li', {}, [el('span', { text: row })]);
        if (codes[k]) li.appendChild(btn(K[16], function () { st.task = 'retrieve'; setQuery(); useCode(codes[k]); }, 'secondary'));
        else li.appendChild(btn(K[16], function () { st.june = true; if (st.saveOffered && requiredMet()) st.done = true; render(); say(S.missing_maintenance_receipt); }, 'secondary', st.june));
        ul.appendChild(li);
      });
      if (st.june) appPanel.appendChild(el('p', { 'class': 'demo-msg', text: S.missing_maintenance_receipt }));
    } else if (id === 'sensor-interval') {
      var rs = Object.keys(mem.receipts).map(function (c) { return mem.receipts[c]; }).filter(function (r) { return r.sample === 'station12-0303'; });
      if (rs.length) ul.appendChild(el('li', { text: rs.some(function (r) { return r.status === 'stored'; }) ? AL.collection_stored : AL.collection_received }));
    } else if (id === 'analysis-input') {
      if (st.example === 'mismatch' || (st.res && !st.res.receipt)) ul.appendChild(el('li', { text: AL.analysis_wait }));
      else if (st.res && st.res.receipt) ul.appendChild(el('li', { text: AL.analysis_ready }));
    } else if (id === 'design-revision') {
      AL.revision_choices.forEach(function (c) { ul.appendChild(el('li', { text: c })); });
    } else if (id === 'original-file') {
      AL.document_choices.forEach(function (c) { ul.appendChild(el('li', { text: c })); });
    }
    if (ul.childNodes.length) appPanel.appendChild(ul);
  }
  function renderSummary() {
    if (!st) return;
    sumPanel.textContent = '';
    sumPanel.appendChild(el('h3', { text: X.summary }));
    var smpId = st.task === 'retrieve' && st.checked ? st.checked.sample : st.sel, smp = smpId && D.samples[smpId];
    var r = st.task === 'retrieve' ? st.checked : (st.receipt && receiptOf(st.receipt));
    var fp = st.task === 'retrieve' ? (st.fetchedFp || (r && r.fp)) : st.selFp;
    sumPanel.appendChild(dl([[SF[0], st.s ? st.s.title : X.not_started], [SF[1], C.mode], [SF[2], smp ? smp.file : '—'], [SF[3], smp ? size(smp.size) : '—'],
      [SF[4], smp ? smp.type : '—'], [SF[5], fp ? abbr(fp) : '—', 'demo-fp'], [SF[6], st.lastMsg || (st.s ? '' : S.empty)], [SF[7], r ? r.code : X.none],
      [SF[8], r ? SRC[r.source] : '—'], [SF[9], st.res ? S.match_help : T.mode_help], [SF[10], st.s ? st.s.first_action : S.empty]]));
    var was = !complete.hidden;
    complete.textContent = '';
    complete.hidden = !st.done;
    if (st.done) {
      complete.appendChild(el('h3', { text: C.completion }));
      complete.appendChild(el('p', { text: st.s.takeaway }));
      complete.appendChild(el('p', {}, [el('a', { href: '#reading-the-result', text: C.next })]));
      if (!was) { live.textContent = ''; window.setTimeout(function () { live.textContent = C.completion + '. ' + st.s.takeaway; }, 60); }
    }
  }

  // ---------------------------------------------------------------- start: allow-listed deep links
  fresh(null, null);
  var params; try { params = new URL(window.location.href).searchParams; } catch (e) { params = null; }
  var qs = params && params.get('scenario'), qt = params && params.get('task'), note = '';
  if (qs && !SC[qs]) { note = C.unknown_scenario; qs = null; }
  if (qt && T.tasks && ['store', 'retrieve'].indexOf(qt) < 0) { note = note || C.unknown_task; qt = null; }
  if (qs || qt) start(qs || D.scenarios[0].id, qt); else start(null, null);
  if (!memOK) say(S.memory_state_unavailable);
  else if (note) say(note);
  if (window.location.hash === '#workspace' && (qs || qt)) {
    var ws = document.getElementById('workspace');
    if (ws) window.setTimeout(function () { ws.scrollIntoView(); }, 0);
  }
})();
