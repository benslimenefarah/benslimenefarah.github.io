/* Portfolio v2 interactions (the robot background lives in robot-bg.js) */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- hero headline: words fade in one by one ---------- */
  const head = $('.headline');
  const wrapWords = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        // punctuation right after a bold part (", from …") stays glued to the previous word
        const prev = n.previousSibling, m = n.textContent.match(/^[^\s]+/);
        let text = n.textContent;
        if (m && prev && prev.nodeType === 1) {
          const lastW = [...prev.querySelectorAll('.w')].pop();
          if (lastW) { lastW.textContent += m[0]; text = text.slice(m[0].length); }
        }
        text.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
          else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s); }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) wrapWords(n);
    });
  };
  wrapWords(head);
  $$('.w', head).forEach((w, i) => (w.style.transitionDelay = (0.45 + i * 0.04).toFixed(2) + 's'));
  requestAnimationFrame(() => requestAnimationFrame(() => head.classList.add('go')));

  /* ---------- About lede: words light up while scrolling ---------- */
  const lede = $('#lede');
  let ledeWords = [];
  const wrapLede = () => {
    const words = lede.textContent.trim().split(/\s+/);
    lede.textContent = '';
    words.forEach((w, i) => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; lede.append(s, i < words.length - 1 ? ' ' : ''); });
    ledeWords = $$('.w', lede);
  };
  wrapLede();

  // the EN/FR switch (lang-v2.js) replaces these texts: wrap their words again
  document.addEventListener('langchange', () => { wrapWords(head); wrapLede(); });

  /* ---------- reveal on enter ---------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el) => (reduce ? el.classList.add('in') : io.observe(el)));

  /* ---------- portrait flip ---------- */
  const portrait = $('.portrait');
  portrait.addEventListener('click', () => portrait.classList.toggle('flipped'));

  /* ---------- tool logos (devicon), removed if they fail to load ---------- */
  $$('.tools span[data-i]').forEach((s) => {
    const img = new Image(); img.alt = ''; img.width = 22; img.height = 22; img.loading = 'lazy';
    if (s.hasAttribute('data-inv')) img.className = 'inv';
    img.onerror = () => img.remove();
    const i = s.dataset.i; /* local logos have a file extension, the rest come from devicon */
    img.src = /\.(png|svg)$/.test(i) ? `assets/img/logos/${i}` : `https://cdn.jsdelivr.net/npm/devicon@2.16.0/icons/${i}.svg`;
    s.prepend(img);
  });

  /* ---------- work: filter tabs ---------- */
  const items = $$('.item');
  $$('.tabs button').forEach((b) => b.addEventListener('click', () => {
    $$('.tabs button').forEach((x) => x.classList.toggle('on', x === b));
    const f = b.dataset.f;
    items.forEach((it) => {
      const show = f === 'all' || it.dataset.tags.split(' ').includes(f);
      it.classList.toggle('hide', !show);

      if (show && !reduce) { it.animate([{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
    });
    const wh = $('.wip-head'); if (wh) wh.classList.toggle('hide', !$$('.wip').some((w) => !w.classList.contains('hide')));
  }));

  /* ---------- work: screens follow the cursor, videos play on hover, "View project" pill ---------- */
  const pill = $('.view-pill');
  let px = 0, py = 0, tx = 0, ty = 0;
  items.forEach((it) => {
    const v = $('video', it), stage = $('.stage', it);
    stage.addEventListener('pointerenter', () => { if (fine && !it.classList.contains('wip')) pill.classList.add('on'); if (v) { v.preload = 'auto'; v.play().catch(() => {}); } });
    stage.addEventListener('pointerleave', () => { pill.classList.remove('on'); if (v) v.pause(); });
  });
  addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  if (!fine) {
    const vio = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? (e.target.preload = 'auto', e.target.play().catch(() => {})) : e.target.pause())), { threshold: 0.6 });
    $$('.item video').forEach((v) => vio.observe(v));
  }

  /* ---------- experience: index follows the entry on screen ---------- */
  const xpLinks = $$('.xp-list a'), jobs = xpLinks.map((a) => $(a.getAttribute('href')));

  /* ---------- scroll-linked loop ---------- */
  const bar = $('.bar'), heroInner = $('.hero-inner'), hint = $('.scroll-hint'), hero = $('#hero');
  const navLinks = $$('.bar nav a'), secs = navLinks.map((a) => $(a.getAttribute('href')));
  function frame() {
    const vh = innerHeight;
    bar.classList.toggle('scrolled', scrollY > 30);

    // hero: pinned, content drifts up, shrinks and fades as the page moves on
    if (!reduce) {
      const p = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight - vh)));
      heroInner.style.transform = `translateY(${-p * 80}px) scale(${1 - p * 0.08})`;
      heroInner.style.opacity = (1 - p * 1.1).toFixed(3);
      hint.style.opacity = p > 0.02 ? 0 : '';
    }

    // about lede words
    const r = lede.getBoundingClientRect();
    const k = reduce ? 1 : Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.55)));
    const on = Math.round(k * ledeWords.length);
    ledeWords.forEach((w, i) => w.classList.toggle('on', i < on));

    // nav + experience index highlight
    let cur = -1;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < vh * 0.45) cur = i; });
    navLinks.forEach((a, i) => a.classList.toggle('on', i === cur));
    let j = 0;
    jobs.forEach((el, i) => { if (el && el.getBoundingClientRect().top < vh * 0.5) j = i; });
    xpLinks.forEach((a, i) => a.setAttribute('data-on', i === j ? '1' : '0'));

    // view pill follows the cursor smoothly
    px += (tx - px) * 0.2; py += (ty - py) * 0.2;
    pill.style.left = (px + 34) + 'px'; pill.style.top = (py + 30) + 'px';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
