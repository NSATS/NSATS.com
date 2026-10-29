/* NSATS Geomagnetism demonstration — Stage 1 interactive illustration (demonstrations build, 12 October 2026).
   Authored example events only: no measurement, no positioning algorithm, no browser geolocation, no network requests.
   Every visible string comes from window.NSATS_GEO (approved interface copy + authored fixtures). */
(function () {
  'use strict';
  var D = window.NSATS_GEO, app = document.getElementById('demo-app');
  if (!D || !app) return;
  var T = D.text, C = T.common, X = T.extra, K = T.controls, F = T.fields, DS = T.display_states;
  var SC = {}; D.scenarios.forEach(function (s) { SC[s.id] = s; });
  var SVGNS = 'http://www.w3.org/2000/svg';
  var st = { s: null, h: 0, i: -1, alt: false, filter: 0, group: false, posOnly: false, chooser: false,
             viewed: {}, timer: null, channels: false, record: false, choice: false, done: false };

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
  function sv(tag, attrs, text) {
    var n = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text) n.textContent = text;
    return n;
  }
  function fill(s, map) { return s.replace(/\{(\w+)\}/g, function (m, k) { return map[k] !== undefined ? map[k] : m; }); }
  function btn(label, fn, cls, pressed) {
    return el('button', { type: 'button', 'class': 'demo-btn' + (cls ? ' ' + cls : ''), 'aria-pressed': pressed === undefined ? null : String(!!pressed), on: { click: fn }, text: label });
  }
  function dl(rows) {
    var d = el('dl', { 'class': 'demo-dl' });
    rows.forEach(function (r) { if (!r) return; d.appendChild(el('dt', { text: r[0] })); d.appendChild(el('dd', { text: r[1] })); });
    return d;
  }

  // ---------------------------------------------------------------- data access
  function hist() { return st.s.histories[st.h]; }
  function events() {
    var ev = hist().events, a = st.s.alternative;
    if (!st.alt || !a) return ev;
    return ev.map(function (e) {
      if (e.id !== a.replaces) return e;
      return { id: e.id, label: a.label, note: a.application_text, help: a.help, input: a.input, output: a.output, display: a.display,
               from: a.from, app_only: a.app_only, time: e.time, alt: true };
    });
  }
  function find(id) { var ev = events(); for (var k = 0; k < ev.length; k++) if (ev[k].id === id) return ev[k]; return null; }
  function position(e) {     // resolve the displayed position through position_from_event (never from the selected event's own time)
    if (!e) return null;
    if (e.display === DS[0]) return { place: e.place, time: e.time, retained: false };
    if (e.display === DS[1]) { var src = find(e.from); return { place: src.place, time: src.time, retained: true, from: src }; }
    return null;
  }
  function displayText(e) { var p = position(e); return e.display === DS[1] ? fill(DS[1], { position_time: p.time }) : e.display; }
  function placeLabel(id) { return id && st.s.places[id] ? st.s.places[id].label : ''; }
  function lastNew(upto) {
    var ev = events(), t = null;
    for (var k = 0; k <= upto && k < ev.length; k++) if (ev[k].output === T.output_states[0]) t = ev[k].time;
    return t;
  }
  function key(e) { return st.s.histories.length > 1 ? hist().key + ':' + e.id : e.id; }
  function matchesFilter(e) {
    if (!st.s.histories || st.s.histories.length < 2 || st.filter === 0) return true;
    return st.filter === 1 ? e.entry === 'application' : e.entry === 'interval';
  }

  // ---------------------------------------------------------------- layout
  app.hidden = false;
  var setup = el('div', { 'class': 'demo-stack demo-setup' });
  var activity = el('div', { 'class': 'demo-stack demo-activity' });
  var summary = el('section', { 'class': 'demo-stack demo-summary', 'aria-label': X.summary });
  app.appendChild(setup); app.appendChild(activity); app.appendChild(summary);
  var live = el('p', { 'class': 'demo-sr', role: 'status', 'aria-live': 'polite' });
  var msg = el('p', { 'class': 'demo-msg', role: 'status', 'aria-live': 'polite' });

  // Region A — set up the run
  var setupPanel = el('div', { 'class': 'demo-panel' });
  setupPanel.appendChild(el('p', { 'class': 'demo-mode' }, [el('strong', { text: C.mode }), T.mode_help]));
  setupPanel.appendChild(el('div', { 'class': 'demo-buttons' }, [
    btn(C.guided, function () { choose(guidedId(), true); }),
    btn(C.free, function () { select.focus(); }, 'secondary')]));
  var select = el('select', { id: 'geo-scenario' });
  select.appendChild(el('option', { value: '', text: C.scenario }));
  D.scenarios.forEach(function (s) { select.appendChild(el('option', { value: s.id, text: s.title })); });
  select.addEventListener('change', function () { choose(select.value || null, false); });
  setupPanel.appendChild(el('div', { 'class': 'demo-field' }, [el('label', { 'for': 'geo-scenario', text: C.scenario }), select]));
  var taskBox = el('div', { 'class': 'demo-task' });
  setupPanel.appendChild(taskBox);
  var scenControls = el('div', { 'class': 'demo-buttons' });
  setupPanel.appendChild(scenControls);
  setupPanel.appendChild(el('div', { 'class': 'demo-buttons' }, [btn(C.reset, reset, 'secondary')]));
  setupPanel.appendChild(msg);
  setup.appendChild(setupPanel);

  // Region B — activity
  var status = el('p', { 'class': 'demo-status' });
  var plan = el('figure', { 'class': 'demo-plan' });
  var stages = el('ol', { 'class': 'demo-stages', 'aria-label': X.stage_strip });
  T.stage_labels.forEach(function (l) { stages.appendChild(el('li', { text: l })); });
  var run = el('div', { 'class': 'demo-run', role: 'group', 'aria-label': K[1] });
  var bPrev = btn(K[0], function () { stop(true); go(st.i - 1); }, 'secondary');
  var bNext = btn(K[1], function () { stop(true); go(st.i + 1); });
  var bPlay = btn(K[2], play, 'secondary'), bPause = btn(K[3], pause, 'secondary'), bStop = btn(K[4], function () { stop(false); }, 'secondary');
  var bRestart = btn(K[5], function () { stop(true); go(0); }, 'secondary');
  [bPrev, bNext, bPlay, bPause, bStop, bRestart].forEach(function (b) { run.appendChild(b); });
  var listBox = el('div', { 'class': 'demo-panel' });
  var detail = el('div', { 'class': 'demo-panel' });
  var record = el('div', { 'class': 'demo-panel' });
  var extras = el('div', { 'class': 'demo-panel' });
  [status, el('div', { 'class': 'demo-panel' }, [plan, stages]), run, listBox, detail, record, extras].forEach(function (n) { activity.appendChild(n); });
  activity.appendChild(live);

  // Region C — summary
  var sumPanel = el('div', { 'class': 'demo-panel' });
  var complete = el('div', { 'class': 'demo-complete', hidden: true, tabindex: '-1' });
  summary.appendChild(sumPanel); summary.appendChild(complete);

  // ---------------------------------------------------------------- scenario selection
  function guidedId() { for (var k = 0; k < D.scenarios.length; k++) if (D.scenarios[k].guided) return D.scenarios[k].id; return D.scenarios[0].id; }
  function setQuery(id) {
    try {
      var u = new URL(window.location.href);
      if (id) u.searchParams.set('scenario', id); else u.searchParams.delete('scenario');
      u.searchParams.delete('task');
      window.history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) { /* keep working without history support */ }
  }
  function choose(id, guided) {
    stop(true);
    st.s = id ? SC[id] : null; st.h = 0; st.alt = false; st.filter = 0; st.group = false; st.posOnly = false; st.chooser = false;
    st.viewed = {}; st.channels = false; st.record = false; st.choice = false; st.done = false;
    select.value = id || '';
    setQuery(id);
    st.i = st.s ? 0 : -1;
    if (st.s) view();
    render();
    say(st.s ? st.s.title + '. ' + st.s.first_action : T.empty, guided ? 'msg' : 'live');
  }
  function reset() { var id = st.s && st.s.id; choose(id || null, false); say(id ? st.s.first_action : T.empty, 'msg'); }
  function say(text, where) { if (where === 'msg') msg.textContent = text; live.textContent = ''; window.setTimeout(function () { live.textContent = text; }, 30); }

  // ---------------------------------------------------------------- playback
  function go(i) {
    var ev = events();
    if (!st.s || i < 0 || i >= ev.length) return;
    st.i = i; st.choice = false; view(); render();
    var e = ev[i];
    var parts = [fill(T.playback, { current: i + 1, total: ev.length }), e.label].concat(e.app_only ? [T.application_only] : [e.input, e.output]).concat([displayText(e)]);
    say(parts.map(function (x) { return /[.!?]$/.test(x) ? x : x + '.'; }).join(' '));
  }
  function view() { var e = events()[st.i]; if (!e) return; if (st.posOnly) return; st.viewed[key(e)] = true; checkDone(); }
  function play() {
    if (!st.s) return;
    stop(true);
    if (st.i >= events().length - 1) go(0);
    msg.textContent = T.playing;
    st.timer = window.setInterval(function () {
      if (st.i >= events().length - 1) { stop(true); msg.textContent = T.finished; say(T.finished); return; }
      go(st.i + 1);
    }, 2600);
    renderRun();
  }
  function pause() { if (st.timer) { stop(true); msg.textContent = T.paused; say(T.paused); } }
  function stop(silent) {
    var was = !!st.timer;
    if (st.timer) window.clearInterval(st.timer);
    st.timer = null;
    if (!silent && st.s) { msg.textContent = T.stopped; say(T.stopped); }
    if (was || !silent) renderRun();
  }

  // ---------------------------------------------------------------- completion
  function checkDone() {
    if (!st.s || st.done) return;
    var ok = st.s.complete.every(function (grp) { return grp.some(function (id) { return st.viewed[id]; }); });
    if (ok) { st.done = true; }
  }

  // ---------------------------------------------------------------- rendering
  function render() {
    renderTask(); renderControls(); renderStatus(); renderPlan(); renderRun(); renderList(); renderDetail(); renderRecord(); renderExtras(); renderSummary();
  }
  function renderTask() {
    taskBox.textContent = '';
    if (!st.s) { taskBox.appendChild(el('p', { text: T.empty })); return; }
    taskBox.appendChild(el('h3', { text: st.s.title }));
    taskBox.appendChild(el('p', { text: st.s.task }));
    taskBox.appendChild(el('p', { 'class': 'demo-first', text: st.s.first_action }));
  }
  function renderControls() {
    scenControls.textContent = '';
    if (!st.s) return;
    var c = st.s.controls, id = st.s.id;
    if (id === 'tunnel-fitting') {
      scenControls.appendChild(btn(c[0], function () {
        st.alt = true; var ev = events(); go(ev.map(function (e) { return e.id; }).indexOf(st.s.alternative.replaces));
        msg.textContent = st.s.alternative.help;
      }, 'secondary', st.alt));
      if (st.alt) scenControls.appendChild(btn(K[9], function () { st.alt = false; go(st.i); msg.textContent = ''; }, 'secondary'));
    } else if (id === 'asset-handover') {
      [0, 1, 2].forEach(function (k) {
        scenControls.appendChild(btn(c[k], function () { st.filter = k; render(); }, 'secondary', st.filter === k));
      });
      scenControls.appendChild(st.h === 0
        ? btn(c[3], function () { stop(true); st.h = 1; st.i = 0; view(); render(); say(st.s.histories[1].label + '. ' + events()[0].label); }, 'secondary')
        : btn(c[4], function () { stop(true); st.h = 0; st.i = 0; view(); render(); say(st.s.histories[0].label + '. ' + events()[0].label); }, 'secondary'));
    } else if (id === 'subsea-phases') {
      scenControls.appendChild(btn(c[0], function () { st.group = true; render(); }, 'secondary', st.group));
      scenControls.appendChild(btn(c[1], function () { st.group = false; render(); }, 'secondary', !st.group));
    } else if (id === 'return-leg-stop') {
      scenControls.appendChild(btn(c[0], function () { st.chooser = !st.chooser; render(); }, 'secondary', st.chooser));
      if (!st.posOnly) scenControls.appendChild(btn(c[1], function () { stop(true); st.posOnly = true; st.chooser = false; render(); msg.textContent = T.positions_only_help; say(T.positions_only_help); }, 'secondary'));
      else scenControls.appendChild(btn(c[2], function () { st.posOnly = false; view(); render(); msg.textContent = ''; say(st.s.first_action); }));
    }
  }
  function renderStatus() {
    status.textContent = '';
    if (!st.s) { status.appendChild(el('span', { text: C.mode })); status.appendChild(el('span', { text: T.empty })); return; }
    if (st.posOnly) { status.appendChild(el('span', { text: C.mode })); return; }
    var ev = events(), e = ev[st.i];
    status.appendChild(el('span', { text: fill(T.playback, { current: st.i + 1, total: ev.length }) }));
    status.appendChild(el('span', { text: e.app_only ? T.application_only : e.output }));
    status.appendChild(el('span', { text: C.mode }));
  }
  function renderPlan() {
    plan.textContent = '';
    if (!st.s) { plan.appendChild(el('p', { 'class': 'demo-help', text: T.empty })); return; }
    var P = st.s.plan, v = P.view, ev = events(), cur = ev[st.i], pos = st.posOnly ? null : position(cur);
    var svg = sv('svg', { viewBox: v.join(' '), role: 'img', focusable: 'false', 'class': 'plan-svg' });
    var desc;
    if (st.posOnly) desc = P.label + ': ' + placeLabel(st.s.same_place && hist().events.filter(function (e) { return e.id === st.s.same_place[0]; })[0].place);
    else desc = P.label + ': ' + (cur.app_only ? T.application_only + ' ' + T.location_unrecorded : (pos ? placeLabel(pos.place) + ' — ' + displayText(cur) : cur.display));
    svg.setAttribute('aria-label', desc);
    (P.shapes || []).forEach(function (s) {
      if (s.t === 'rect') svg.appendChild(sv('rect', { x: s.x, y: s.y, width: s.w, height: s.h, 'class': s.cls }));
      else if (s.t === 'label') {
        var subj = s.face && cur && !st.posOnly && cur.subject === s.face;
        svg.appendChild(sv('text', { x: s.x, y: s.y, 'class': 'plan-label' + (subj ? ' is-subject' : ''), 'aria-hidden': 'true' }, s.text));
      }
    });
    function line(pts, cls) { svg.appendChild(sv('polyline', { points: pts.map(function (p) { return p.join(','); }).join(' '), 'class': cls })); }
    if (!st.posOnly) {
      if (P.route_travelled) line(P.route_travelled, 'route-travelled');
      if (P.route_not_travelled) line(P.route_not_travelled, 'route-not');
    }
    (P.fixtures || []).forEach(function (f) {
      svg.appendChild(sv('rect', { x: f.x - 9, y: f.y - 9, width: 18, height: 18, 'class': 'plan-fixture' }));
      svg.appendChild(sv('text', { x: f.x, y: f.y - 18, 'class': 'plan-fixture-label', 'aria-hidden': 'true' }, f.id));
    });
    if (st.posOnly) {
      var bay = st.s.places[hist().events.filter(function (e) { return e.id === st.s.same_place[0]; })[0].place];
      svg.appendChild(sv('circle', { cx: bay.x, cy: bay.y, r: 12, 'class': 'pos-current' }));
      plan.appendChild(svg); plan.appendChild(legend([0])); return;
    }
    // inspection records up to the selected event (only where the record carries a position from that event)
    ev.forEach(function (e, k) {
      if (k <= st.i && e.inspection && !e.alt) {
        var f = (P.fixtures || []).filter(function (x) { return x.id === e.inspection; })[0];
        if (f) svg.appendChild(sv('rect', { x: f.x - 15, y: f.y - 15, width: 30, height: 30, 'class': 'mark-inspected' }));
      }
    });
    // numbered event markers for events with their own position (filtered by the application display filter)
    var seen = {};
    ev.forEach(function (e, k) {
      if (e.display !== DS[0] || !matchesFilter(e)) return;
      var p = st.s.places[e.place], n = (seen[e.place] = (seen[e.place] || 0) + 1);
      svg.appendChild(sv('circle', { cx: p.x, cy: p.y + 30 + (n - 1) * 0, r: 10, 'class': 'mark-event', transform: 'translate(' + ((n - 1) * 24) + ',0)' }));
      svg.appendChild(sv('text', { x: p.x + (n - 1) * 24, y: p.y + 34, 'class': 'mark-event-n', 'aria-hidden': 'true' }, String(k + 1)));
    });
    if (pos) {
      var pp = st.s.places[pos.place];
      if (pos.retained) {
        svg.appendChild(sv('circle', { cx: pp.x, cy: pp.y, r: 13, 'class': 'pos-last' }));
        var right = pp.x < v[2] * 0.6;
        svg.appendChild(sv('text', { x: right ? pp.x + 18 : pp.x - 18, y: pp.y - 20, 'text-anchor': right ? 'start' : 'end', 'class': 'pos-callout', 'aria-hidden': 'true' }, displayText(cur)));
      } else svg.appendChild(sv('circle', { cx: pp.x, cy: pp.y, r: 12, 'class': 'pos-current' }));
    }
    plan.appendChild(svg);
    var used = [0, 1, 2];
    if (P.route_travelled) used.push(3);
    if (P.route_not_travelled) used.push(4);
    if (P.fixtures) used.push(5);
    plan.appendChild(legend(used));
    plan.appendChild(el('figcaption', { text: P.label + ' · ' + T.source }));
  }
  function legend(items) {
    var ul = el('ul', { 'class': 'demo-legend', 'aria-label': X.plan_legend });
    var icons = [
      function (s) { s.appendChild(sv('circle', { cx: 15, cy: 8, r: 6, 'class': 'pos-current' })); },
      function (s) { s.appendChild(sv('circle', { cx: 15, cy: 8, r: 6, 'class': 'pos-last' })); },
      function (s) { s.appendChild(sv('rect', { x: 8, y: 2, width: 14, height: 12, fill: 'none', stroke: '#525252', 'stroke-dasharray': '3 2' })); },
      function (s) { s.appendChild(sv('line', { x1: 0, y1: 8, x2: 30, y2: 8, 'class': 'route-travelled' })); },
      function (s) { s.appendChild(sv('line', { x1: 0, y1: 8, x2: 30, y2: 8, 'class': 'route-not' })); },
      function (s) { s.appendChild(sv('rect', { x: 8, y: 1, width: 14, height: 14, 'class': 'mark-inspected' })); }];
    items.forEach(function (k) {
      var s = sv('svg', { viewBox: '0 0 30 16', 'aria-hidden': 'true', focusable: 'false' });
      icons[k](s);
      var li = el('li'); li.appendChild(s); li.appendChild(document.createTextNode(T.legend[k])); ul.appendChild(li);
    });
    var wrap = el('div', {}, [el('p', { 'class': 'demo-legend-title demo-sr', text: X.plan_legend }), ul]);
    return wrap;
  }
  function renderRun() {
    var on = !!st.s && !st.posOnly, n = st.s ? events().length : 0;
    bPrev.disabled = !on || st.i <= 0; bNext.disabled = !on || st.i >= n - 1;
    bPlay.disabled = !on || !!st.timer; bPause.disabled = !st.timer; bStop.disabled = !on; bRestart.disabled = !on;
  }
  function eventButton(e, k) {
    var li = el('li', { 'class': e.app_only ? 'is-app' : null });
    var b = el('button', { type: 'button', 'aria-current': k === st.i ? 'step' : null, on: { click: function () { stop(true); go(k); } } }, [
      el('span', { 'class': 'ev-id', text: e.id }), el('span', { 'class': 'ev-time', text: e.time }), el('span', { text: e.label })]);
    if (e.app_only) b.appendChild(el('span', { 'class': 'ev-tag', text: T.legend[2] }));
    li.appendChild(b);
    return li;
  }
  function renderList() {
    listBox.textContent = '';
    if (!st.s) return;
    var ev = events();
    var title = st.s.histories.length > 1 ? hist().label : X.event_list;
    if (st.posOnly) {
      listBox.appendChild(el('h3', { text: st.s.controls[0] }));
      listBox.appendChild(el('p', { text: T.positions_only_help }));
      var ul = el('ul', { 'class': 'demo-log' });
      st.s.same_place.forEach(function () { ul.appendChild(el('li', { text: F[9] + ': ' + placeLabel(hist().events.filter(function (e) { return e.id === st.s.same_place[0]; })[0].place) })); });
      listBox.appendChild(ul);
      return;
    }
    listBox.appendChild(el('h3', { text: title }));
    if (st.chooser && st.s.same_place) {
      var box = el('div', { 'class': 'demo-panel', role: 'group', 'aria-label': st.s.controls[0] }, [el('h4', { text: st.s.controls[0] })]);
      var ol = el('ol', { 'class': 'demo-events' });
      st.s.same_place.forEach(function (id) { var k = ev.map(function (e) { return e.id; }).indexOf(id); ol.appendChild(eventButton(ev[k], k)); });
      box.appendChild(ol); listBox.appendChild(box);
    }
    if (st.group && st.s.phases) {
      st.s.phases.forEach(function (ph) {
        listBox.appendChild(el('h4', { 'class': 'demo-group-title', text: ph }));
        var ol = el('ol', { 'class': 'demo-events' });
        ev.forEach(function (e, k) { if (e.phase === ph) ol.appendChild(eventButton(e, k)); });
        listBox.appendChild(ol);
      });
      var tb = el('table', { 'class': 'demo-table' }, [el('caption', { 'class': 'demo-sr', text: X.phase_summary }),
        el('thead', {}, [el('tr', {}, [el('th', { scope: 'col', text: X.phase }), el('th', { scope: 'col', text: X.events }), el('th', { scope: 'col', text: X.observations })])])]);
      var tbody = el('tbody');
      st.s.phases.forEach(function (ph) {
        var es = ev.filter(function (e) { return e.phase === ph; });
        tbody.appendChild(el('tr', {}, [el('th', { scope: 'row', text: ph }), el('td', { text: String(es.length) }),
          el('td', { text: String(es.filter(function (e) { return e.observation; }).length) })]));
      });
      tb.appendChild(tbody);
      listBox.appendChild(el('h4', { 'class': 'demo-group-title', text: X.phase_summary }));
      listBox.appendChild(el('div', { 'class': 'demo-table-wrap' }, [tb]));
      var gaps = ev.filter(function (e) { return e.output === T.output_states[1]; });
      if (gaps.length) listBox.appendChild(el('p', { text: fill(T.gap, { gap_start: gaps[0].time, gap_end: gaps[gaps.length - 1].time }) }));
      return;
    }
    var list = el('ol', { 'class': 'demo-events' });
    ev.forEach(function (e, k) { if (matchesFilter(e)) list.appendChild(eventButton(e, k)); });
    listBox.appendChild(list);
  }
  function renderDetail() {
    detail.textContent = '';
    if (!st.s || st.posOnly) { detail.hidden = true; return; }
    detail.hidden = false;
    var e = events()[st.i], p = position(e);
    var out = el('div', { 'class': 'demo-detail-block' }, [el('h3', { text: F[7] })]);
    if (e.app_only) {
      out.appendChild(el('p', { 'class': 'demo-app-only', text: T.application_only }));
      out.appendChild(el('p', { 'class': 'demo-help', text: T.application_only_help }));
      out.appendChild(dl([[F[12], e.time], [F[9], T.location_unrecorded], [F[4], e.display]]));
    } else {
      out.appendChild(dl([[F[10], e.time], [F[2], e.input], [F[3], e.output], [F[9], p ? placeLabel(p.place) : e.display],
        [F[4], displayText(e)], [F[11], p ? p.time : '—']]));
    }
    var appRec = el('div', { 'class': 'demo-detail-block app' }, [el('h3', { text: F[8] }), el('p', { text: e.note })]);
    if (e.help) appRec.appendChild(el('p', { 'class': 'demo-help', text: e.help }));
    if (e.leg) appRec.appendChild(dl([[X.journey_leg, e.leg]]));
    if (e.phase) appRec.appendChild(dl([[X.phase, e.phase]]));
    var chooseTxt = e.display === DS[1] ? T.retained_rule : (!e.app_only && e.output === T.output_states[1] && e.display === DS[2]) ? T.clear_rule : '';
    var cb = btn(K[8], function () { st.choice = !st.choice; renderDetail(); }, 'secondary', st.choice);
    cb.disabled = !chooseTxt;
    appRec.appendChild(el('div', { 'class': 'demo-buttons' }, [cb]));
    if (st.choice && chooseTxt) appRec.appendChild(el('p', { text: chooseTxt }));
    detail.appendChild(el('div', { 'class': 'demo-two' }, [out, appRec]));
  }
  function recordRows(e) {
    var p = e.app_only ? null : position(e);
    return [[F[0], st.s.title], [e.app_only ? F[12] : F[10], e.time],
      [F[9], e.app_only ? T.location_unrecorded : (p ? placeLabel(p.place) : e.display)],
      [F[11], p ? p.time : '—'], [F[2], e.app_only ? T.application_only : e.input], [F[3], e.app_only ? '—' : e.output],
      [F[4], displayText(e)], [F[6], T.reference], [F[1], T.source]];
  }
  function renderRecord() {
    record.textContent = '';
    if (!st.s || st.posOnly) { record.hidden = true; return; }
    record.hidden = false;
    var e = events()[st.i];
    record.appendChild(el('h3', { text: F[9] }));
    record.appendChild(dl(recordRows(e)));
  }
  function renderExtras() {
    extras.textContent = '';
    if (!st.s || st.posOnly) { extras.hidden = true; return; }
    extras.hidden = false;
    var ev = events();
    var bc = btn(K[6], function () { st.channels = !st.channels; renderExtras(); }, 'secondary', st.channels);
    var br = btn(K[7], function () { st.record = !st.record; renderExtras(); }, 'secondary', st.record);
    bc.setAttribute('aria-expanded', String(st.channels)); bc.setAttribute('aria-controls', 'geo-channels');
    br.setAttribute('aria-expanded', String(st.record)); br.setAttribute('aria-controls', 'geo-full-record');
    extras.appendChild(el('div', { 'class': 'demo-buttons' }, [bc, br]));
    var ch = el('div', { id: 'geo-channels', hidden: !st.channels });
    if (st.channels) {
      ch.appendChild(el('h3', { text: F[2] }));
      ch.appendChild(el('p', { 'class': 'demo-help', text: T.mode_help }));
      var ul = el('ul', { 'class': 'demo-log' });
      ev.forEach(function (e) { ul.appendChild(el('li', {}, [el('span', { text: e.id + ' · ' + e.time + ' · ' + e.label }), el('span', { text: e.app_only ? T.application_only : e.input })])); });
      ch.appendChild(ul);
    }
    extras.appendChild(ch);
    var fr = el('div', { id: 'geo-full-record', hidden: !st.record });
    if (st.record) {
      fr.appendChild(el('h3', { text: F[9] + ' — ' + (st.s.histories.length > 1 ? hist().label : st.s.title) }));
      var tb = el('table', { 'class': 'demo-table' });
      var cols = [X.events, F[10], F[9], F[11], F[2], F[3], F[4]];
      tb.appendChild(el('thead', {}, [el('tr', {}, cols.map(function (c) { return el('th', { scope: 'col', text: c }); }))]));
      var tbody = el('tbody');
      ev.forEach(function (e) {
        var p = e.app_only ? null : position(e);
        tbody.appendChild(el('tr', {}, [el('th', { scope: 'row', text: e.id + ' · ' + e.label }), el('td', { text: e.time }),
          el('td', { text: e.app_only ? T.location_unrecorded : (p ? placeLabel(p.place) : e.display) }), el('td', { text: p ? p.time : '—' }),
          el('td', { text: e.app_only ? T.application_only : e.input }), el('td', { text: e.app_only ? '—' : e.output }), el('td', { text: displayText(e) })]));
      });
      tb.appendChild(tbody);
      fr.appendChild(el('div', { 'class': 'demo-table-wrap' }, [tb]));
    }
    extras.appendChild(fr);
  }
  function renderSummary() {
    sumPanel.textContent = '';
    sumPanel.appendChild(el('h3', { text: X.summary }));
    if (!st.s) { sumPanel.appendChild(dl([[F[0], X.not_started], [F[1], T.source], [F[6], T.reference]])); complete.hidden = true; return; }
    if (st.posOnly) { sumPanel.appendChild(dl([[F[0], st.s.title], [F[1], T.source], [F[6], T.reference]])); return; }
    var e = events()[st.i], ln = lastNew(st.i);
    sumPanel.appendChild(dl([[F[0], st.s.title], [F[1], T.source], [F[2], e.app_only ? T.application_only : e.input],
      [F[3], e.app_only ? '—' : e.output], [F[4], displayText(e)], [F[5], ln || X.none], [F[6], T.reference]]));
    var was = !complete.hidden;
    complete.textContent = '';
    complete.hidden = !st.done;
    if (st.done) {
      complete.appendChild(el('h3', { text: C.completion }));
      complete.appendChild(el('p', { text: st.s.takeaway }));
      complete.appendChild(el('p', {}, [el('a', { href: '#evaluating', text: C.next })]));
      if (!was) say(C.completion + '. ' + st.s.takeaway);
    }
  }

  // ---------------------------------------------------------------- start: deep links (allow-listed)
  var params;
  try { params = new URL(window.location.href).searchParams; } catch (e) { params = null; }
  var q = params && params.get('scenario');
  if (q && SC[q]) choose(q, false);
  else { choose(null, false); if (q) msg.textContent = C.unknown_scenario; }
  if (window.location.hash === '#workspace' && q) {
    var ws = document.getElementById('workspace');
    if (ws) window.setTimeout(function () { ws.scrollIntoView(); }, 0);
  }
})();
