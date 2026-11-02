/* Self-hosted NSATS films. No analytics, third-party players or autoplay on entry. */
(() => {
  'use strict';
  const KEY = 'nsats-skip-intro';
  const VISIT_KEY = 'nsats-intro-seen';
  const media = window.matchMedia('(max-width: 760px)');
  const read = (store, key) => { try { return window[store].getItem(key); } catch (_) { return null; } };
  const responsiveSource = video => {
    const mobile = media.matches;
    const source = mobile ? video.dataset.mobileSrc : video.dataset.desktopSrc;
    const poster = mobile ? video.dataset.mobilePoster : video.dataset.desktopPoster;
    video.dataset.filmLayout = mobile ? 'portrait' : 'landscape';
    if (poster) video.poster = poster;
    if (source && video.getAttribute('src') !== source) { video.src = source; video.load(); }
  };
  document.querySelectorAll('video[data-inline-film]').forEach(video => {
    responsiveSource(video);
    video.addEventListener('error', () => { const fallback = video.closest('figure').querySelector('.nsats-video-fallback'); if (fallback) fallback.hidden = false; });
    media.addEventListener('change', () => { if (video.paused && video.currentTime === 0) responsiveSource(video); });
  });
  const dialog = document.getElementById('nsats-film-selector');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const chooser = dialog.querySelector('[data-film-chooser]');
  const player = dialog.querySelector('[data-film-player]');
  const video = dialog.querySelector('video');
  const ended = dialog.querySelector('[data-film-ended]');
  const status = dialog.querySelector('[data-film-status]');
  const yes = dialog.querySelector('input[value="yes"]');
  const no = dialog.querySelector('input[value="no"]');
  let trigger = null;
  let selectedFilm = 'quantum';
  const savePreference = () => {
    try {
      localStorage.setItem(KEY, no.checked ? 'true' : 'false');
      status.textContent = '';
    } catch (_) { status.textContent = 'Your browser cannot save this preference. You can still close this screen and use the website.'; }
  };
  const showChoices = () => {
    video.pause();
    player.hidden = true; chooser.hidden = false; ended.hidden = true;
    dialog.querySelector('[data-watch-' + selectedFilm + ']').focus();
  };
  const open = source => {
    if (dialog.open) return;
    trigger = source || document.querySelector('[data-open-films]');
    no.checked = read('localStorage', KEY) === 'true' || read('localStorage', KEY) === null;
    yes.checked = !no.checked;
    chooser.hidden = false; player.hidden = true; ended.hidden = true; status.textContent = '';
    document.querySelectorAll('video[data-inline-film]').forEach(film => film.pause());
    dialog.showModal(); document.documentElement.classList.add('nsats-film-open');
    try { sessionStorage.setItem(VISIT_KEY, 'true'); } catch (_) {}
    dialog.querySelector('[data-close-films]').focus();
  };
  const saveAll = savePreference;
  dialog.querySelectorAll('input[name="nsats-show-films"]').forEach(input => input.addEventListener('change', saveAll));
  document.querySelectorAll('[data-open-films]').forEach(button => { button.hidden = false; button.addEventListener('click', () => open(button)); });
  dialog.querySelectorAll('[data-close-films]').forEach(button => button.addEventListener('click', () => { saveAll(); dialog.close(); }));
  dialog.addEventListener('cancel', saveAll);
  dialog.addEventListener('close', () => { video.pause(); document.documentElement.classList.remove('nsats-film-open'); trigger?.focus(); });
  const base = document.body.dataset.base || '../';
  const films = {
    geomagnetism: {title:'Geomagnetic positioning', duration:75, desktop:'nsats-geomagnetism-final-16x9.mp4', mobile:'nsats-geomagnetism-mobile-4x5.mp4', poster:'geomagnetism-poster-16x9.jpg', mobilePoster:'geomagnetism-mobile-poster.jpg', route:'nsats/geomagnetism/index.html'},
    quantum: {title:'Quantum-inspired computing', duration:46, desktop:'nsats-quantum-16x9.mp4', mobile:'nsats-quantum-mobile-4x5.mp4', poster:'quantum-poster-16x9.jpg', mobilePoster:'quantum-mobile-poster.jpg', route:'nsats/quantum/index.html'},
    network: {title:'Quantum-classical networking', duration:36, desktop:'nsats-network-card-final.mp4', mobile:'nsats-network-card-mobile-4x5.mp4', poster:'network-card-poster.jpg', mobilePoster:'network-mobile-poster.jpg', route:'nsats/industries/index.html'}
  };
  Object.entries(films).forEach(([key, film]) => {
    dialog.querySelector('[data-watch-' + key + ']').addEventListener('click', () => {
      saveAll(); video.pause(); selectedFilm = key; status.textContent = '';
      const assets = base + 'assets/videos/';
      video.dataset.desktopSrc = assets + film.desktop;
      video.dataset.mobileSrc = assets + film.mobile;
      video.dataset.desktopPoster = assets + film.poster;
      video.dataset.mobilePoster = assets + film.mobilePoster;
      video.dataset.filmKind = key;
      video.setAttribute('aria-label', 'NSATS ' + film.title + ', silent, ' + film.duration + ' seconds');
      dialog.querySelector('#nsats-player-heading').textContent = film.title;
      const fallback = video.querySelector('a'); fallback.href = assets + film.desktop; fallback.textContent = 'Open the film directly';
      const note = dialog.querySelector('[data-player-note]');
      const link = document.createElement('a'); link.href = base + film.route; link.textContent = 'Read about the technology';
      note.replaceChildren(document.createTextNode(film.duration + ' seconds · Silent film · '), link);
      if (key === 'network') note.append(document.createTextNode(' · Illustrative 10/15 Gb/s original-data comparison; physical links remain at 10 Gb/s.'));
      responsiveSource(video); video.currentTime = 0;
      chooser.hidden = true; player.hidden = false; ended.hidden = true;
      dialog.querySelector('[data-back-films]').focus();
      video.play().catch(() => { if (!video.error) status.textContent = 'Press Play in the video controls to start the film.'; });
    });
  });
  dialog.querySelectorAll('[data-back-films]').forEach(button => button.addEventListener('click', showChoices));
  dialog.querySelector('[data-replay-film]').addEventListener('click', () => { video.currentTime = 0; ended.hidden = true; video.play().catch(() => {}); });
  video.addEventListener('ended', () => { ended.hidden = false; });
  video.addEventListener('error', () => { status.replaceChildren(); const text = document.createTextNode('The film could not load. '); const link = document.createElement('a'); link.href = video.dataset.desktopSrc; link.textContent = 'Open the video directly'; status.append(text,link); });
  if (!location.hash && read('localStorage', KEY) !== 'true' && read('sessionStorage', VISIT_KEY) !== 'true') open(null);
})();
