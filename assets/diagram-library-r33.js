/* Scoped to the five approved Diagram library figures; no forms or access changes. */
document.querySelectorAll('.dl-figure').forEach(figure=>{
 const viewport=figure.querySelector('.dl-viewport'),controls=figure.querySelector('.dl-controls'),button=controls.querySelector('button'),hint=controls.querySelector('.dl-hint');
 controls.hidden=false;
 button.addEventListener('click',()=>{const expanded=viewport.classList.toggle('is-expanded');viewport.scrollLeft=0;button.setAttribute('aria-expanded',String(expanded));button.textContent=expanded?'Fit to page':'Enlarge diagram';hint.textContent=expanded?'Scroll within the diagram to inspect labels.':'Enlarge to inspect labels.';});
});
