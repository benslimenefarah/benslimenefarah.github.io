/* Project pages (v2): reading progress, reveals, contents highlight, media zoom */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const bar = $('.bar');
  const prog = document.createElement('div');
  prog.className = 'progress';
  document.body.appendChild(prog);

  /* reveal on enter */
  const els = $$('.kicker, .case-title, .case-lead, .facts, .case-sec > *, .pager');
  els.forEach((el) => el.classList.add('rv'));
  if (reduce || !('IntersectionObserver' in window)) els.forEach((el) => el.classList.add('in'));
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    els.forEach((el) => io.observe(el));
  }

  /* lightbox for figures and the main image */
  const lb = document.createElement('div');
  lb.className = 'lb';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.innerHTML = '<div><img alt=""><p></p></div>';
  document.body.appendChild(lb);
  const lbImg = $('img', lb), lbCap = $('p', lb);
  const close = () => lb.classList.remove('on');
  $$('.case-sec figure img, .case-hero img').forEach((img) => {
    img.tabIndex = 0;
    const open = () => {
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      const cap = img.closest('figure') && $('figcaption', img.closest('figure'));
      lbCap.textContent = cap ? cap.textContent : '';
      lb.classList.add('on');
    };
    img.addEventListener('click', open);
    img.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  lb.addEventListener('click', close);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  /* contents: highlight the section on screen */
  const tocLinks = $$('.toc a');
  const secs = tocLinks.map((a) => $(a.getAttribute('href')));
  const hero = $('.case-hero');

  function frame() {
    const vh = innerHeight, max = document.documentElement.scrollHeight - vh;
    bar.classList.toggle('scrolled', scrollY > 30);
    prog.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;

    if (hero && !reduce) {
      const r = hero.getBoundingClientRect();
      const k = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.7)));
      hero.style.transform = `scale(${(0.92 + 0.08 * k).toFixed(4)})`;
    }

    let cur = -1;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < vh * 0.4) cur = i; });
    tocLinks.forEach((a, i) => a.classList.toggle('on', i === cur));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
