/* Abdul Rasheed Gill — interactions */
(() => {
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = () => innerWidth > 980;
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- text splitting ---------- */
  function splitChars(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((w) => {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
            const word = document.createElement('span'); word.className = 'wd';
            [...w].forEach((c) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; word.appendChild(s); });
            frag.appendChild(word);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  }
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
  document.querySelectorAll('.hero h1 .chars').forEach(splitChars);
  document.querySelectorAll('.split, #quote').forEach(splitWords);

  /* ---------- menu ---------- */
  const menuBtn = document.getElementById('menuBtn'), sheet = document.getElementById('sheet');
  const setMenu = (open) => {
    sheet.classList.toggle('open', open); sheet.setAttribute('aria-hidden', !open);
    menuBtn.setAttribute('aria-expanded', open); menuBtn.textContent = open ? 'Close' : 'Menu';
    if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
  };
  menuBtn.addEventListener('click', () => setMenu(!sheet.classList.contains('open')));
  sheet.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* ---------- no-GSAP / reduced-motion fallback ---------- */
  if (!hasGSAP || reduce) {
    html.classList.add('loaded');
    document.getElementById('loader')?.remove();
    initFibres(); initMap(true); initYarnStatic();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const t = document.querySelector(id); if (!t) return;
      e.preventDefault(); lenis.scrollTo(t, { offset: id === '#top' ? 0 : -10, duration: 1.6 });
    }));
  }

  /* ---------- nav ---------- */
  const nav = document.getElementById('nav');
  ScrollTrigger.create({ start: 80, end: 'max', onToggle: (s) => nav.classList.toggle('scrolled', s.isActive) });

  /* ---------- cursor + magnetic ---------- */
  if (finePointer) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3.out' }), yTo = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3.out' });
      el.addEventListener('mousemove', (e) => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * .12); yTo((e.clientY - r.top - r.height / 2) * .15); });
      el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- preloader ---------- */
  const loader = document.getElementById('loader');
  const wind = document.getElementById('windPath');
  // build a winding path on the cone: zig-zag wraps that climb upward
  (() => {
    let d = 'M60 0 L60 12', y = 132, i = 0;
    while (y > 18) {
      const k = (y - 12) / 126, half = 22 + k * 18; // cone widens toward base
      d += ` L${i % 2 ? 60 - half : 60 + half} ${y}`;
      y -= 4.2; i++;
    }
    wind.setAttribute('d', d);
    const L = wind.getTotalLength(); wind.style.strokeDasharray = L; wind.style.strokeDashoffset = L;
  })();
  const count = document.getElementById('count');
  const yr = { v: 1988 };
  const intro = gsap.timeline({ paused: true });
  const heroImg = document.getElementById('heroImg');
  intro
    .from(heroImg, { scale: 1.18, duration: 2.4, ease: 'power3.out' }, 0)
    .from('.hero h1 .ch', { yPercent: 115, rotate: 6, duration: 1.2, ease: 'power4.out', stagger: .035 }, .15)
    .from('.hero .rv', { y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: .12 }, .6)
    .from('.hero .year', { opacity: 0, x: 80, duration: 1.8, ease: 'power3.out' }, .3)
    .from('.nav', { y: -30, opacity: 0, duration: .9, ease: 'power3.out' }, .5)
    .from('.marquee', { yPercent: 100, duration: 1, ease: 'power3.out' }, .8);

  const pre = gsap.timeline({ onComplete: () => { html.classList.add('loaded'); loader.remove(); } });
  pre.to(wind, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' }, 0)
     .to(yr, { v: 2026, duration: 1, ease: 'power2.inOut', onUpdate: () => { count.textContent = Math.round(yr.v); } }, 0)
     .to('#loader .inner', { opacity: 0, y: -20, duration: .35, ease: 'power2.in' }, 1.1)
     .to('#loader .half.t', { yPercent: -100, duration: .8, ease: 'power4.inOut' }, 1.3)
     .to('#loader .half.b', { yPercent: 100, duration: .8, ease: 'power4.inOut' }, 1.3)
     .add(() => intro.play(), 1.35);
  if (lenis) { lenis.stop(); pre.add(() => lenis.start(), 1.6); }

  /* ---------- hero parallax ---------- */
  gsap.to(heroImg, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero .year', { yPercent: -40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- section headings ---------- */
  document.querySelectorAll('.split').forEach((h) => {
    gsap.from(h.querySelectorAll('.w > span'), { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: .06, scrollTrigger: { trigger: h, start: 'top 85%' } });
  });
  document.querySelectorAll('.sec-head p, .sec-head .k').forEach((p) => {
    gsap.from(p, { y: 24, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 88%' } });
  });
  document.querySelectorAll('main .rv:not(.hero .rv)').forEach((el) => {
    gsap.from(el, { y: 36, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  /* ---------- story: horizontal on desktop ---------- */
  const mm = gsap.matchMedia();
  const track = document.getElementById('storyTrack');
  mm.add('(min-width: 981px)', () => {
    const dist = () => track.scrollWidth - innerWidth;
    const tw = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.story-pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
    track.querySelectorAll('.chap').forEach((c) => {
      gsap.to(c.querySelector('.no'), { width: '100%', ease: 'none', scrollTrigger: { trigger: c, containerAnimation: tw, start: 'left 85%', end: 'right 40%', scrub: true } });
      const img = c.querySelector('figure img');
      if (img) gsap.fromTo(img, { xPercent: -6, yPercent: -8 }, { xPercent: 6, yPercent: -8, ease: 'none', scrollTrigger: { trigger: c, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
      gsap.from(c.querySelectorAll('.big, h3, p, .ur'), { y: 40, opacity: 0, stagger: .08, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: c, containerAnimation: tw, start: 'left 78%' } });
    });
  });
  mm.add('(max-width: 980px)', () => {
    track.querySelectorAll('.chap').forEach((c) => {
      gsap.to(c.querySelector('.no'), { width: '100%', ease: 'none', scrollTrigger: { trigger: c, start: 'top 85%', end: 'top 30%', scrub: true } });
      gsap.from(c.querySelectorAll('.big, h3, p, figure'), { y: 40, opacity: 0, stagger: .08, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 82%' } });
    });
  });

  /* ---------- field: horizontal drift on desktop ---------- */
  const ftrack = document.getElementById('fieldTrack');
  mm.add('(min-width: 981px)', () => {
    gsap.fromTo(ftrack, { x: () => innerWidth * .15 }, { x: () => -(ftrack.scrollWidth - innerWidth * .85), ease: 'none', scrollTrigger: { trigger: '.field-pin', start: 'top 85%', end: 'bottom 10%', scrub: 1, invalidateOnRefresh: true } });
  });

  /* ---------- quote: words light up ---------- */
  gsap.to('#quote .w', { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: '#quote', start: 'top 80%', end: 'bottom 45%', scrub: true } });

  /* ---------- advisory photo ---------- */
  gsap.from('.adv-photo img', { scale: 1.25, ease: 'none', scrollTrigger: { trigger: '.adv-photo', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.adv-photo', { clipPath: 'inset(18% 12% 18% 12%)', duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: '.adv-photo', start: 'top 80%' } });

  /* ---------- contact knot ---------- */
  const knot = document.getElementById('knotPath');
  if (knot) {
    const L = knot.getTotalLength(); knot.style.strokeDasharray = L; knot.style.strokeDashoffset = L;
    gsap.to(knot, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', scrollTrigger: { trigger: '.knot', start: 'top 90%' } });
  }

  /* ---------- canvases ---------- */
  initFibres();
  initYarn();
  initMap(false);

  /* ---------- the copper thread through the page ---------- */
  initThread();

  /* nav highlight: created after all pins so positions include pin spacing */
  document.querySelectorAll('.links a[href^="#"]').forEach((a) => {
    const sec = document.querySelector(a.getAttribute('href'));
    if (sec) ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => a.classList.toggle('on', s.isActive) });
  });

  addEventListener('load', () => ScrollTrigger.refresh());

  /* =============== implementations =============== */
  function fitCanvas(c, ctx) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const r = c.getBoundingClientRect();
    c.width = Math.max(1, Math.round(r.width * dpr)); c.height = Math.max(1, Math.round(r.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: r.width, h: r.height };
  }

  function initThread() {
    const svg = document.getElementById('thread'), path = document.getElementById('threadPath');
    const secs = [...document.querySelectorAll('main > section[data-thread]')];
    let L = 0;
    const build = () => {
      const H = document.documentElement.scrollHeight, W = document.documentElement.clientWidth;
      svg.setAttribute('width', W); svg.setAttribute('height', H); svg.style.height = H + 'px';
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const pts = [];
      secs.forEach((s, i) => {
        const r = s.getBoundingClientRect(), top = r.top + scrollY;
        const xr = parseFloat(s.dataset.thread);
        const edge = W < 760 ? 5 : 14;
        const x = xr <= .5 ? Math.max(edge, W * Math.min(xr, .04)) : Math.min(W - edge, W * Math.max(xr, .96));
        pts.push([i === 0 ? W * .62 : x, i === 0 ? r.height * .92 : top + 40]);
        pts.push([x, top + r.height * .55]);
      });
      const k = document.querySelector('.knot svg');
      if (k) { const kr = k.getBoundingClientRect(); pts.push([kr.left - 6, kr.top + scrollY + kr.height / 2]); }
      let d = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], my = (y0 + y1) / 2;
        d += ` C${x0} ${my}, ${x1} ${my}, ${x1} ${y1}`;
      }
      path.setAttribute('d', d);
      L = path.getTotalLength();
      path.style.strokeDasharray = L;
      update();
    };
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, (scrollY + innerHeight * .75) / (max + innerHeight * .75)) : 1;
      path.style.strokeDashoffset = L * (1 - p);
    };
    ScrollTrigger.addEventListener('refresh', build);
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: update });
    build();
  }

  function initFibres() {
    const c = document.getElementById('fibres'); if (!c) return;
    const ctx = c.getContext('2d');
    let W = 0, H = 0, fibres = [], mouse = { x: -999, y: -999 }, visible = true, t = 0;
    const N = innerWidth < 760 ? 70 : 150;
    const make = () => fibres = Array.from({ length: N }, () => ({
      x: Math.random() * W, y: Math.random() * H, len: 18 + Math.random() * 60, a: Math.random() * Math.PI,
      v: .15 + Math.random() * .45, curl: (Math.random() - .5) * .9, al: .06 + Math.random() * .22, cu: Math.random() < .1, ph: Math.random() * 6.28
    }));
    const resize = () => { ({ w: W, h: H } = fitCanvas(c, ctx)); make(); };
    resize(); addEventListener('resize', resize);
    c.parentElement.addEventListener('mousemove', (e) => { const r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    c.parentElement.addEventListener('mouseleave', () => { mouse.x = mouse.y = -999; });
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(c);
    const draw = () => {
      requestAnimationFrame(draw); if (!visible) return; t += .006;
      ctx.clearRect(0, 0, W, H);
      for (const f of fibres) {
        f.x += f.v; f.y += Math.sin(t * 2 + f.ph) * .18; f.a += Math.sin(t + f.ph) * .003;
        const dx = f.x - mouse.x, dy = f.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 16000) { const k = (16000 - d2) / 16000; f.x += dx * .04 * k; f.y += dy * .04 * k; f.a += .02 * k; }
        if (f.x - f.len > W) { f.x = -f.len; f.y = Math.random() * H; }
        const ca = Math.cos(f.a), sa = Math.sin(f.a), hx = ca * f.len / 2, hy = sa * f.len / 2;
        ctx.beginPath(); ctx.moveTo(f.x - hx, f.y - hy);
        ctx.quadraticCurveTo(f.x + sa * f.curl * f.len * .4, f.y - ca * f.curl * f.len * .4, f.x + hx, f.y + hy);
        ctx.strokeStyle = f.cu ? `rgba(224,112,47,${f.al + .1})` : `rgba(238,230,211,${f.al})`;
        ctx.lineWidth = f.cu ? 1 : .7; ctx.stroke();
      }
    };
    requestAnimationFrame(draw);
  }

  function yarnEngine(c) {
    const ctx = c.getContext('2d');
    let W = 0, H = 0, fib = [];
    const N = innerWidth < 760 ? 240 : 460;
    const resize = () => {
      ({ w: W, h: H } = fitCanvas(c, ctx));
      fib = Array.from({ length: N }, (_, i) => ({
        u: Math.random(), rx: Math.random(), ry: Math.random(), a: Math.random() * Math.PI * 2,
        len: 14 + Math.random() * 34, off: (Math.random() * 2 - 1) * Math.sqrt(Math.random()), ph: Math.random() * 6.28,
        short: Math.random() < .28, cu: Math.random() < .07, sp: .6 + Math.random() * .8
      }));
    };
    resize(); addEventListener('resize', resize);
    const keys = [[0, .36], [.17, .3], [.32, .12], [.47, .085], [.61, .028], [.76, .004], [1, .004]];
    const band = (p) => { for (let i = 1; i < keys.length; i++) if (p <= keys[i][0]) { const t = (p - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]); return lerp(keys[i - 1][1], keys[i][1], smooth(0, 1, t)); } return keys[keys.length - 1][1]; };
    return (p, t) => {
      ctx.clearRect(0, 0, W, H);
      const mob = W < 760;
      const cy = mob ? H * .52 : H * .5;
      const x0 = mob ? 0 : W * .1, x1 = W;
      const chaos = 1 - smooth(.03, .2, p);
      const bw = Math.max(1.6, band(p) * H);
      const twist = smooth(.55, .8, p);
      const wind = smooth(.84, .97, p);
      const coneX = lerp(x1 + 80, mob ? W * .8 : W * .84, wind);
      const endX = lerp(x1, coneX, wind);
      for (const f of fib) {
        const fx = x0 + ((f.u + t * .025 * f.sp) % 1) * (endX - x0);
        const ax = lerp(f.rx * W, fx, 1 - chaos);
        let ay = cy + f.off * bw + Math.sin(fx * .01 + f.ph + t) * bw * .08;
        ay = lerp(f.ry * H, ay, 1 - chaos);
        let alpha = (f.cu ? .55 : .22) + (1 - chaos) * .1;
        if (f.short) alpha *= 1 - smooth(.42, .52, p);
        if (alpha < .01) continue;
        const ang = lerp(f.a, twist * .55 * (f.off > 0 ? 1 : -1) + Math.sin(f.ph) * .05 * (1 - twist), 1 - chaos);
        const L = lerp(f.len, f.len * (1 - .45 * twist), 1 - chaos);
        const hx = Math.cos(ang) * L / 2, hy = Math.sin(ang) * L / 2;
        ctx.beginPath(); ctx.moveTo(ax - hx, ay - hy); ctx.lineTo(ax + hx, ay + hy);
        ctx.strokeStyle = f.cu ? `rgba(224,112,47,${alpha})` : `rgba(238,230,211,${alpha})`;
        ctx.lineWidth = f.cu ? 1.1 : .8; ctx.stroke();
      }
      // the yarn itself
      const ya = smooth(.5, .72, p);
      if (ya > 0) {
        ctx.save(); ctx.globalAlpha = ya;
        ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(endX, cy);
        ctx.strokeStyle = 'rgba(238,230,211,.85)'; ctx.lineWidth = 2.2; ctx.stroke();
        // twist highlights
        ctx.strokeStyle = 'rgba(224,112,47,.9)'; ctx.lineWidth = 1;
        for (let x = x0 + ((t * 40) % 14); x < endX; x += 14) { ctx.beginPath(); ctx.moveTo(x - 3, cy - 2); ctx.lineTo(x + 3, cy + 2); ctx.stroke(); }
        ctx.restore();
      }
      // the cone
      if (wind > 0) {
        const ch = (mob ? H * .3 : H * .42) * (.6 + .4 * wind), topW = ch * .22, botW = ch * .5;
        const cx = coneX + botW * .25;
        ctx.save(); ctx.globalAlpha = wind;
        ctx.beginPath();
        ctx.moveTo(cx - topW / 2, cy - ch / 2); ctx.lineTo(cx + topW / 2, cy - ch / 2);
        ctx.lineTo(cx + botW / 2, cy + ch / 2); ctx.lineTo(cx - botW / 2, cy + ch / 2); ctx.closePath();
        ctx.fillStyle = 'rgba(238,230,211,.06)'; ctx.fill();
        const rows = Math.floor(18 + 50 * wind);
        ctx.strokeStyle = 'rgba(238,230,211,.55)'; ctx.lineWidth = .7;
        for (let i = 0; i < rows; i++) {
          const k = i / rows, y = cy + ch / 2 - k * ch, w = lerp(botW, topW, k);
          ctx.beginPath(); ctx.moveTo(cx - w / 2, y); ctx.lineTo(cx + w / 2, y - ch / rows * .8); ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(224,112,47,.9)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(endX, cy); ctx.lineTo(cx - lerp(botW, topW, .5) / 2, cy); ctx.stroke();
        ctx.restore();
      }
      // fade under the stage list on desktop
      if (!mob) { const g = ctx.createLinearGradient(0, 0, W * .42, 0); g.addColorStop(0, 'rgba(11,18,38,.92)'); g.addColorStop(1, 'rgba(11,18,38,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W * .42, H); }
    };
  }

  function initYarnStatic() {
    const c = document.getElementById('yarn'); if (!c) return;
    const draw = yarnEngine(c); draw(.7, 0);
  }

  function initYarn() {
    const c = document.getElementById('yarn'); if (!c) return;
    const draw = yarnEngine(c);
    const items = [...document.querySelectorAll('#stages li')], bar = document.getElementById('craftBar');
    let p = 0, target = 0, t = 0, active = 0, visible = false;
    ScrollTrigger.create({
      trigger: '#craftPin', start: 'top top', end: () => '+=' + innerHeight * (desktop() ? 4 : 3.2), pin: true, scrub: true, anticipatePin: 1,
      onUpdate: (s) => { target = s.progress; },
      onToggle: (s) => { visible = s.isActive || visible; }
    });
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(c);
    const loop = () => {
      requestAnimationFrame(loop); if (!visible) return;
      t += .016; p += (target - p) * .08;
      draw(p, t);
      const i = Math.min(items.length - 1, Math.floor(p * items.length * .999));
      if (i !== active) { items[active].classList.remove('on'); items[i].classList.add('on'); active = i; }
      bar.style.width = (p * 100).toFixed(2) + '%';
    };
    requestAnimationFrame(loop);
  }

  function initMap(staticOnly) {
    const c = document.getElementById('map'); if (!c) return;
    const ctx = c.getContext('2d');
    const outline = [[61.6,25.2],[66.6,25.4],[67.4,24.4],[68.2,23.7],[68.8,24.3],[70.0,24.2],[71.1,24.4],[70.6,25.7],[70.1,26.6],[69.5,27.0],[70.6,28.0],[71.9,27.9],[73.4,29.9],[74.6,31.0],[74.5,32.8],[75.4,32.3],[74.8,34.0],[77.8,35.5],[76.8,36.7],[74.6,37.0],[72.5,36.8],[71.2,36.1],[71.6,35.1],[70.9,34.0],[69.9,34.0],[70.3,33.2],[69.5,33.0],[69.2,31.9],[68.0,31.6],[66.9,31.3],[66.3,29.9],[64.0,29.4],[62.5,29.4],[60.9,29.8],[61.8,28.6],[62.8,28.3],[63.3,26.7],[61.8,26.4]];
    const cities = [
      { n: 'Lahore', p: [74.34, 31.55], hq: 1 }, { n: 'Faisalabad', p: [73.08, 31.42], hq: 1 }, { n: 'Sheikhupura', p: [73.98, 31.71] },
      { n: 'Multan', p: [71.47, 30.20] }, { n: 'Karachi', p: [67.0, 24.86] }, { n: 'Hyderabad', p: [68.37, 25.39] },
      { n: 'Nooriabad', p: [67.79, 25.18] }, { n: 'Mirpur', p: [69.0, 25.53] }
    ];
    const lon0 = 60.5, lon1 = 78.2, lat0 = 23.4, lat1 = 37.3;
    let W = 0, H = 0, dots = [];
    const proj = ([lo, la]) => { const s = Math.min(W / (lon1 - lon0), H / (lat1 - lat0)); const ox = (W - s * (lon1 - lon0)) / 2, oy = (H - s * (lat1 - lat0)) / 2; return [ox + (lo - lon0) * s, oy + (lat1 - la) * s]; };
    const inside = (x, y, poly) => { let r = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) r = !r; } return r; };
    const resize = () => {
      ({ w: W, h: H } = fitCanvas(c, ctx));
      const poly = outline.map(proj); dots = [];
      const step = Math.max(7, W / 62);
      for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) if (inside(x, y, poly)) dots.push([x, y]);
    };
    resize(); addEventListener('resize', () => { resize(); render(prog, tt); });
    let prog = staticOnly ? 1 : 0, tt = 0;
    const render = (p, t) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(238,230,211,.16)';
      for (const [x, y] of dots) { ctx.beginPath(); ctx.arc(x, y, 1.1, 0, 6.283); ctx.fill(); }
      const lhr = proj(cities[0].p);
      // international routes leaving to the west / north-west
      const routes = [{ n: 'TURKEY', to: [-W * .05, H * .12] }, { n: 'RUSSIA', to: [W * .25, -H * .05] }, { n: 'EGYPT', to: [-W * .05, H * .55] }];
      routes.forEach((r, i) => {
        const k = smooth(.55 + i * .08, .85 + i * .05, p); if (k <= 0) return;
        const cx = (lhr[0] + r.to[0]) / 2, cy = Math.min(lhr[1], r.to[1]) - H * .18;
        ctx.save(); ctx.setLineDash([3, 5]); ctx.strokeStyle = 'rgba(91,120,255,.7)'; ctx.lineWidth = 1;
        ctx.beginPath();
        const n = 40; for (let s = 0; s <= n * k; s++) { const u = s / n, x = (1 - u) * (1 - u) * lhr[0] + 2 * (1 - u) * u * cx + u * u * r.to[0], y = (1 - u) * (1 - u) * lhr[1] + 2 * (1 - u) * u * cy + u * u * r.to[1]; s ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke(); ctx.restore();
      });
      // domestic threads from Lahore
      cities.forEach((ci, i) => {
        if (i === 0) return;
        const k = smooth(.05 + i * .05, .3 + i * .06, p); if (k <= 0) return;
        const q = proj(ci.p), cx = (lhr[0] + q[0]) / 2 + (q[1] - lhr[1]) * .15, cy = (lhr[1] + q[1]) / 2 - (q[0] - lhr[0]) * .15;
        ctx.strokeStyle = 'rgba(224,112,47,.85)'; ctx.lineWidth = 1.2; ctx.beginPath();
        const n = 50; for (let s = 0; s <= n * k; s++) { const u = s / n, x = (1 - u) * (1 - u) * lhr[0] + 2 * (1 - u) * u * cx + u * u * q[0], y = (1 - u) * (1 - u) * lhr[1] + 2 * (1 - u) * u * cy + u * u * q[1]; s ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
      });
      // city nodes
      const fs = Math.max(10, Math.min(13, W / 42));
      cities.forEach((ci, i) => {
        const k = i === 0 ? smooth(0, .1, p) : smooth(.25 + i * .06, .32 + i * .06, p); if (k <= 0) return;
        const [x, y] = proj(ci.p), pulse = (Math.sin(t * 2 + i) + 1) / 2;
        ctx.fillStyle = `rgba(224,112,47,${.18 * k * (1 - pulse)})`; ctx.beginPath(); ctx.arc(x, y, 6 + pulse * 10, 0, 6.283); ctx.fill();
        ctx.fillStyle = ci.hq ? '#E0702F' : '#EEE6D3'; ctx.globalAlpha = k; ctx.beginPath(); ctx.arc(x, y, ci.hq ? 4 : 3, 0, 6.283); ctx.fill();
        ctx.font = `400 ${fs}px "IBM Plex Mono", monospace`; ctx.fillStyle = 'rgba(238,230,211,.85)';
        const left = ['Karachi', 'Nooriabad', 'Faisalabad', 'Multan'].includes(ci.n);
        ctx.textAlign = left ? 'right' : 'left';
        const dy = ci.n === 'Nooriabad' ? 12 : ci.n === 'Hyderabad' ? -8 : ci.n === 'Sheikhupura' ? -8 : ci.n === 'Faisalabad' ? 4 : 4;
        ctx.fillText(ci.n.toUpperCase(), x + (left ? -10 : 10), y + dy); ctx.globalAlpha = 1;
      });
      ctx.textAlign = 'left';
      routes.forEach((r, i) => {
        const k = smooth(.8 + i * .04, .95, p); if (k <= 0) return;
        ctx.globalAlpha = k; ctx.font = `500 ${fs}px "IBM Plex Mono", monospace`; ctx.fillStyle = '#5B78FF';
        const lx = Math.max(6, Math.min(W - 70, r.to[0] + (r.to[0] < 0 ? W * .07 : 10))), ly = Math.max(16, r.to[1] + (r.to[1] < 0 ? H * .08 : 0));
        ctx.fillText(r.n, lx, ly); ctx.globalAlpha = 1;
      });
    };
    if (staticOnly) { render(1, 0); return; }
    let target = 0, visible = false;
    ScrollTrigger.create({ trigger: c, start: 'top 85%', end: 'bottom 35%', scrub: true, onUpdate: (s) => { target = s.progress; } });
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(c);
    const loop = () => { requestAnimationFrame(loop); if (!visible) return; tt += .016; prog += (target - prog) * .06; render(prog, tt); };
    requestAnimationFrame(loop);
  }
})();
