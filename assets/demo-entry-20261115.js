/* Public setup only. Execution scripts and sample files remain behind OVH verification. */
(function () {
  'use strict';
  var root = document.querySelector('[data-public-demo]');
  if (!root) return;
  var scenario = document.getElementById('public-demo-scenario');
  var task = document.getElementById('public-demo-task');
  var metadata = JSON.parse(document.getElementById('public-demo-metadata').textContent);
  var query = new URLSearchParams(location.search);
  if (Object.prototype.hasOwnProperty.call(metadata, query.get('scenario'))) scenario.value = query.get('scenario');
  if (task) task.value = ['store', 'retrieve'].indexOf(query.get('task')) >= 0 ? query.get('task') : (metadata[scenario.value].default_task || 'store');
  function update() {
    var params = new URLSearchParams({scenario: scenario.value});
    if (task) params.set('task', task.value);
    var page = root.getAttribute('data-public-demo') + '?' + params.toString() + '#workspace';
    root.querySelectorAll('[data-demo-start]').forEach(function (link) {
      link.href = 'https://files.nsats.com/access?begin=1&page=' + encodeURIComponent(page);
    });
    document.getElementById('public-demo-description').textContent = metadata[scenario.value].task || '';
    history.replaceState(null, '', location.pathname + '?' + params.toString() + location.hash);
  }
  scenario.addEventListener('change', function () {
    if (task) task.value = metadata[scenario.value].default_task || 'store';
    update();
  });
  if (task) task.addEventListener('change', update);
  update();
})();
