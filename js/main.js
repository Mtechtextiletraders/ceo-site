/* Abdul Rasheed Gill — interactions & scroll motion (GSAP + ScrollTrigger + Lenis). */
(() => {
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const isDesk = () => innerWidth > 860;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const sp = window.__sp = { p: 0, ch: 0 };

  /* ---------- split words (real text stays in DOM) ---------- */
  function splitWords(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((w) => {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
            const o = document.createElement('span'); o.className = 'w';
            const i = document.createElement('span'); i.textContent = w; o.appendChild(i); frag.appendChild(o);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
  }

  /* ---------- menu ---------- */
  const menuBtn = document.getElementById('menuBtn'), sheet = document.getElementById('sheet');
  const setMenu = (open) => {
    sheet.classList.toggle('open', open); sheet.setAttribute('aria-hidden', String(!open));
    menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.textContent = open ? 'Close' : 'Menu';
    if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
  };
  menuBtn.addEventListener('click', () => setMenu(!sheet.classList.contains('open')));
  sheet.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && sheet.classList.contains('open')) setMenu(false); });

  /* ---------- floating WhatsApp: hidden over hero & contact ---------- */
  const fab = document.querySelector('.wa-float');

  /* ---------- static path (no GSAP or reduced motion) ---------- */
  if (!hasGSAP || reduce) {
    html.classList.remove('motion');
    document.getElementById('loader')?.remove();
    document.querySelectorAll('.cnt').forEach((c) => { c.textContent = c.dataset.to; });
    if (fab) {
      const hero = document.getElementById('hero');
      const io = new IntersectionObserver(([e]) => fab.classList.toggle('hide', e.isIntersecting));
      io.observe(hero);
    }
    sp.p = 0.5; sp.static = true;
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  document.querySelectorAll('.split').forEach(splitWords);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href'); if (id.length < 2 && id !== '#') return;
    const t = id === '#top' || id === '#' ? 0 : document.querySelector(id); if (t === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(t, { offset: 0, duration: 1.4 }); else (t === 0 ? scrollTo(0, 0) : t.scrollIntoView());
  }));

  /* ---------- nav / progress / fab ---------- */
  const nav = document.getElementById('nav');
  ScrollTrigger.create({ start: 60, end: 'max', onToggle: (s) => nav.classList.toggle('scrolled', s.isActive) });
  const progBar = document.getElementById('progBar'), progName = document.getElementById('progName');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => { progBar.style.transform = `scaleY(${s.progress.toFixed(4)})`; } });
  /* ---------- cursor + magnetic ---------- */
  if (fine) {
    const cur = document.getElementById('cursor'), lab = document.getElementById('cursorLabel');
    const xTo = gsap.quickTo(cur, 'x', { duration: .18, ease: 'power3.out' }), yTo = gsap.quickTo(cur, 'y', { duration: .18, ease: 'power3.out' });
    addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    document.addEventListener('pointerleave', () => gsap.to(cur, { opacity: 0, duration: .2 }));
    document.addEventListener('pointerenter', () => gsap.to(cur, { opacity: 1, duration: .2 }));
    document.querySelectorAll('a, button, [data-cursor]').forEach((el) => {
      el.addEventListener('pointerenter', () => { const t = el.closest('[data-cursor]'); lab.textContent = t ? t.dataset.cursor : ''; cur.classList.toggle('hover', !!t); if (!t) cur.classList.add('link'); });
      el.addEventListener('pointerleave', () => { cur.classList.remove('hover', 'link'); });
    });
    document.querySelectorAll('.magnetic').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3.out' }), my = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .18); my((e.clientY - r.top - r.height / 2) * .25); });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
    /* 3D tilt on portrait card + service cards */
    document.querySelectorAll('.tilt').forEach((el) => {
      const rx = gsap.quickTo(el, 'rotationX', { duration: .6, ease: 'power3.out' }), ry = gsap.quickTo(el, 'rotationY', { duration: .6, ease: 'power3.out' });
      const amt = el.classList.contains('card-frame') ? 9 : 7;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        ry((x - .5) * amt * 2); rx(-(y - .5) * amt * 2);
        el.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', () => { rx(0); ry(0); });
      gsap.set(el, { transformPerspective: 1000 });
    });
  }

  /* ---------- hero: dust motes in the spotlight (2D canvas) ---------- */
  (() => {
    const c = document.getElementById('dust'); if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const N = isDesk() ? 90 : 40; let W = 0, H = 0, dpr = 1, parts = [], on = true;
    const resize = () => { dpr = Math.min(devicePixelRatio || 1, 1.5); W = c.clientWidth; H = c.clientHeight; c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const beamX = () => isDesk() ? W * .66 : W * .5;
    const spawn = (p, init) => { p.x = beamX() + (Math.random() - .5) * (isDesk() ? W * .36 : W * .8); p.y = init ? Math.random() * H : H + 10; p.r = Math.random() * 1.6 + .3; p.v = Math.random() * .25 + .06; p.a = Math.random() * .6 + .2; p.ph = Math.random() * 6.28; return p; };
    resize(); for (let i = 0; i < N; i++) parts.push(spawn({}, true));
    addEventListener('resize', resize);
    new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(c);
    gsap.ticker.add((t) => {
      if (!on) return;
      ctx.clearRect(0, 0, W, H);
      const bx = beamX();
      for (const p of parts) {
        p.y -= p.v; p.x += Math.sin(t * .6 + p.ph) * .15;
        if (p.y < -10) spawn(p, false);
        const d = Math.abs(p.x - bx) / (W * .28); const lit = Math.max(0, 1 - d) * (p.y / H * .6 + .4);
        ctx.globalAlpha = p.a * lit * (.7 + .3 * Math.sin(t * 2 + p.ph));
        ctx.fillStyle = '#F3DC9C'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
    });
  })();

  /* ---------- hero intro + loader ---------- */
  const lines = document.querySelectorAll('.h1-big .ln > span');
  const fig = document.getElementById('heroFig');
  const intro = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } });
  intro
    .fromTo('.h-beam', { opacity: 0, scaleX: .6 }, { opacity: 1, scaleX: 1, duration: 1.6, ease: 'power2.out' }, 0)
    .to('.h-beam', { opacity: .82, duration: .07, repeat: 3, yoyo: true, ease: 'none' }, .2)
    .fromTo(fig, { opacity: 0, scale: .94, filter: 'brightness(.25)' }, { opacity: 1, scale: 1, filter: 'brightness(1)', duration: 1.8, ease: 'power3.out', clearProps: 'filter' }, .15)
    .fromTo(lines, { yPercent: 110, rotate: 3 }, { yPercent: 0, rotate: 0, duration: 1.2, stagger: .1, clearProps: 'transform' }, .35)
    .fromTo('.hero .rv', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, stagger: .09, ease: 'power3.out' }, .55)
    .fromTo('.h-sig span', { clipPath: 'inset(-30% 100% -30% -10%)' }, { clipPath: 'inset(-30% -10% -30% -10%)', duration: 1.4, ease: 'power2.inOut' }, 1)
    .fromTo('.h-ghost', { opacity: 0, x: 80 }, { opacity: 1, x: 0, duration: 1.8, ease: 'power3.out' }, .3)
    .fromTo('.nav', { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: .9, ease: 'power3.out' }, .5)
    .fromTo('.h-meta', { opacity: 0 }, { opacity: 1, duration: 1 }, 1.1);
  gsap.set(lines, { yPercent: 110 }); gsap.set('.h1-big', { visibility: 'visible' }); gsap.set('.hero .rv', { opacity: 0 }); gsap.set([fig, '.h-sig', '.h-ghost', '.h-meta'], { opacity: 0 });
  intro.fromTo('.h-sig', { opacity: 0 }, { opacity: 1, duration: .4 }, 1);

  const loader = document.getElementById('loader');
  let seen = html.classList.contains('seen');
  if (loader && !seen) {
    try { sessionStorage.setItem('arg-seen', '1'); } catch (e) {}
    const num = document.getElementById('ldNum'), bar = document.getElementById('ldBar'), o = { v: 1988 };
    if (lenis) lenis.stop();
    gsap.timeline({ onComplete: () => { loader.remove(); if (lenis) lenis.start(); } })
      .to(o, { v: 2026, duration: 1.05, ease: 'power2.inOut', onUpdate: () => { num.textContent = Math.round(o.v); } }, 0)
      .to(bar, { scaleX: 1, duration: 1.05, ease: 'power2.inOut' }, 0)
      .to('.ld-in', { opacity: 0, y: -16, duration: .3, ease: 'power2.in' }, 1.15)
      .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: .7, ease: 'power4.inOut' }, 1.3)
      .add(() => intro.play(), 1.3);
  } else { loader?.remove(); intro.play(); }

  /* hero parallax on scroll */
  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
    .to('.h-fig', { yPercent: -8, scale: 1.04, ease: 'none' }, 0)
    .to('.h-copy', { yPercent: -18, opacity: .2, ease: 'none' }, 0)
    .to('.h-ghost', { yPercent: -40, ease: 'none' }, 0)
    .to('.h-beam', { opacity: .4, ease: 'none' }, 0);

  /* ---------- reveals ---------- */
  ScrollTrigger.batch('main .rv:not(.hero .rv)', {
    start: 'top 90%', once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .08, overwrite: 'auto' })
  });
  document.querySelectorAll('.split').forEach((h) => {
    gsap.fromTo(h.querySelectorAll('.w > span'), { yPercent: 105 }, { yPercent: 0, duration: 1, ease: 'power4.out', stagger: .045,
      scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
  });
  /* sections unfold in 3D perspective */
  document.querySelectorAll('.unfold').forEach((el) => {
    gsap.fromTo(el, { rotationX: 16, y: 80, transformOrigin: '50% 100%', transformPerspective: 1400 }, { rotationX: 0, y: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top 98%', end: 'top 50%', scrub: true } });
  });
  gsap.utils.toArray('.card').forEach((c, i) => {
    gsap.fromTo(c, { rotationX: 28, y: 90, z: -120, transformPerspective: 1200, transformOrigin: '50% 100%' }, { rotationX: 0, y: 0, z: 0, ease: 'none', scrollTrigger: { trigger: '.cards', start: `top ${100 - i * 3}%`, end: `top ${58 - i * 3}%`, scrub: true } });
  });
  gsap.fromTo('.cf-in img', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.card-frame', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.card-frame', { clipPath: 'inset(12% 12% 12% 12%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.out', duration: 1.4, scrollTrigger: { trigger: '.card-frame', start: 'top 85%', once: true } });

  /* counters */
  document.querySelectorAll('.cnt').forEach((c) => {
    const from = +(c.dataset.from || 0), to = +c.dataset.to, o = { v: from };
    c.textContent = from;
    ScrollTrigger.create({ trigger: c, start: 'top 92%', once: true, onEnter: () => gsap.to(o, { v: to, duration: 2, ease: 'power3.out', onUpdate: () => { c.textContent = Math.round(o.v); } }) });
  });

  /* ---------- 02 pinned story, scrubbed 1:1 ---------- */
  const story = document.querySelector('.story .st-stage');
  const scs = gsap.utils.toArray('.sc'), rail = [...document.querySelectorAll('.st-rail li')];
  const year = document.getElementById('stYear'), c3 = document.querySelector('.cnt3');
  const pieces = scs.map((s) => [s.querySelector('.sc-k'), s.querySelector('h3'), s.querySelector('p')]);
  const CH = 3;
  const setCopy = (p) => {
    // each chapter visible in a window, crossfade with blur + rise at the edges
    for (let i = 0; i < CH; i++) {
      const a = i / CH, b = (i + 1) / CH, f = .05;
      // sequential crossfade: outgoing copy leaves before the next one arrives
      const vin = i === 0 ? 1 : clamp((p - a) / f, 0, 1);
      const vout = i === CH - 1 ? 1 : clamp((b - p) / f, 0, 1);
      const v = Math.min(vin, vout);
      const enter = p < (a + b) / 2;
      const off = (1 - v) * (enter ? 40 : -40);
      scs[i].style.opacity = v.toFixed(3);
      scs[i].style.visibility = v < .01 ? 'hidden' : 'visible';
      pieces[i].forEach((el, k) => { if (!el) return; el.style.transform = `translate3d(0,${(off * (1 + k * .35)).toFixed(1)}px,0)`; el.style.filter = v > .98 ? 'none' : `blur(${((1 - v) * 8).toFixed(1)}px)`; });
    }
    const ch = Math.min(CH - 1, Math.floor(p * CH));
    if (ch !== sp.ch) { sp.ch = ch; rail.forEach((li, i) => li.classList.toggle('on', i === ch)); }
    year.textContent = Math.round(1988 + clamp((p - .05) / .9, 0, 1) * 38);
    if (c3) c3.textContent = Math.round(clamp((p - .62) / .25, 0, 1) * 50);
  };
  setCopy(0);
  ScrollTrigger.create({
    trigger: story, start: 'top top', end: () => '+=' + Math.round(innerHeight * (isDesk() ? 3.2 : 2.6)),
    pin: true, scrub: true, anticipatePin: 1, invalidateOnRefresh: true,
    onUpdate: (s) => { sp.p = s.progress; setCopy(s.progress); },
    onRefresh: (s) => { sp.p = s.progress; setCopy(s.progress); }
  });
  ScrollTrigger.create({ trigger: '.story', start: 'top bottom', end: 'bottom top', onToggle: (s) => { sp.visible = s.isActive; } });

  /* ---------- 04 field rail: pinned horizontal 3D coverflow on desktop ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    const track = document.getElementById('railTrack'), shots = gsap.utils.toArray('.shot');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const bend = () => {
      const cx = innerWidth / 2;
      shots.forEach((s) => {
        const r = s.getBoundingClientRect(), d = clamp(((r.left + r.width / 2) - cx) / cx, -1.4, 1.4);
        s.style.transform = `perspective(1600px) rotateY(${(-d * 24).toFixed(2)}deg) translateZ(${(-Math.abs(d) * 160).toFixed(1)}px)`;
      });
    };
    const tw = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: {
      trigger: '.field-pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .6, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: bend, onRefresh: bend } });
    bend();
    return () => { tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill(); gsap.set(track, { x: 0 }); shots.forEach((s) => { s.style.transform = ''; }); };
  });
  mm.add('(max-width: 860px)', () => {
    const r = document.getElementById('rail'), shots = gsap.utils.toArray('.shot');
    const bend = () => { const cx = innerWidth / 2; shots.forEach((s) => { const b = s.getBoundingClientRect(); const d = clamp(((b.left + b.width / 2) - cx) / cx, -1.5, 1.5); s.style.transform = `perspective(1000px) rotateY(${(-d * 18).toFixed(2)}deg) scale(${(1 - Math.abs(d) * .08).toFixed(3)})`; }); };
    r.addEventListener('scroll', bend, { passive: true }); bend();
    return () => { r.removeEventListener('scroll', bend); shots.forEach((s) => { s.style.transform = ''; }); };
  });

  /* ---------- footer wordmark: letters rise + light sweep ---------- */
  const wm = document.querySelector('.wordmark .wm-t');
  if (wm) {
    const txt = wm.textContent; wm.textContent = '';
    [...txt].forEach((ch) => { const o = document.createElement('span'); o.className = 'wl'; const i = document.createElement('span'); i.textContent = ch === ' ' ? ' ' : ch; o.appendChild(i); wm.appendChild(o); });
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.wordmark', start: 'top 95%', once: true } });
    tl.fromTo('.wordmark .wl > span', { yPercent: 100 }, { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: .04 })
      .fromTo('.wordmark .wm-s', { webkitMaskPosition: '100% 0', maskPosition: '100% 0' }, { webkitMaskPosition: '0% 0', maskPosition: '0% 0', duration: 2.2, ease: 'power2.inOut' }, .5);
  }
  gsap.fromTo('.cta-glow', { opacity: .3, scale: .8 }, { opacity: 1, scale: 1, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'top 30%', scrub: true } });

  const navLinks = [...document.querySelectorAll('.links a[href^="#"]')];
  document.querySelectorAll('main > section[data-name]').forEach((sec) => {
    ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => {
      if (!s.isActive) return;
      progName.textContent = sec.dataset.name;
      navLinks.forEach((l) => l.classList.toggle('on', l.getAttribute('href') === '#' + sec.id));
      if (fab) fab.classList.toggle('hide', sec.id === 'hero' || sec.id === 'contact');
    } });
  });


  /* ---------- refresh after fonts / images ---------- */
  const refresh = () => ScrollTrigger.refresh();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  addEventListener('load', refresh);
  addEventListener('pageshow', (e) => { if (e.persisted) refresh(); });
})();
