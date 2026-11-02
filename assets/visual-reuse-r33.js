/* A complete overview plus an optional native-size inspection; no modal. */
document.querySelectorAll('.r33-reuse-figure').forEach(figure => {
  const viewport = figure.querySelector('.r33-reuse-viewport');
  const image = viewport.querySelector('img');
  const controls = figure.querySelector('.r33-reuse-controls');
  const button = controls.querySelector('button');
  const hint = controls.querySelector('.r33-reuse-hint');
  const initialLabel = button.textContent;
  const update = () => {
    const expanded = viewport.classList.contains('is-expanded');
    controls.hidden = !expanded && Number(image.getAttribute('width')) <= viewport.clientWidth;
    button.setAttribute('aria-expanded', String(expanded));
    button.textContent = expanded ? 'Fit to page' : initialLabel;
    hint.textContent = expanded ? 'Scroll within the image to inspect labels.' : 'Enlarge to inspect labels.';
  };
  button.addEventListener('click', () => {
    viewport.classList.toggle('is-expanded');
    viewport.scrollLeft = 0;
    update();
  });
  new ResizeObserver(update).observe(viewport);
  update();
});
