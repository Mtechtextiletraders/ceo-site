/* Abdul Rasheed Gill - site script (no libraries).
   Menu, entrance animations (IntersectionObserver, self-playing), text split/scramble/count,
   home intro, hero video, particles, cursor, magnetic/tilt/ripple, page transitions,
   progress + back to top, footer wordmark, gallery lightbox. */
(function () {
  'use strict';
  window.__arg = true;
  var doc = document, root = doc.documentElement, win = window;
  var mq = function (q) { return win.matchMedia && win.matchMedia(q).matches; };
  var reduce = mq('(prefers-reduced-motion: reduce)');
  var motion = root.classList.contains('motion') && !reduce;
  var fine = mq('(hover: hover) and (pointer: fine)');
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var raf = win.requestAnimationFrame || function (f) { return setTimeout(f, 16); };
  var delayOf = function (el) { var d = parseFloat(getComputedStyle(el).getPropertyValue('--d')); return isNaN(d) ? 0 : d; };

  /* ---------- Mobile menu ---------- */
  var nav = $('#nav'), menuBtn = $('.menu-btn');
  if (nav && menuBtn) {
    var label = $('.mb-t', menuBtn);
    var setMenu = function (open) {
      nav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (label) label.textContent = open ? 'Close' : 'Menu';
      doc.body.style.overflow = open ? 'hidden' : '';
    };
    menuBtn.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
    });
    $$('#nav-links a').forEach(function (a) { a.addEventListener('click', function () { if (nav.classList.contains('open')) setMenu(false); }); });
    win.addEventListener('resize', function () { if (win.innerWidth > 860 && nav.classList.contains('open')) setMenu(false); });
  }

  /* ---------- Text helpers ---------- */
  var splitWords = function (el) {
    var i = 0;
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          n.nodeValue.split(/([ \t\n]+)/).forEach(function (part) {
            if (!part) return;
            if (/^[ \t\n]+$/.test(part)) { frag.appendChild(doc.createTextNode(' ')); return; }
            var w = doc.createElement('span'); w.className = 'w';
            var s = doc.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') { walk(n); }
      });
    };
    walk(el);
  };
  var splitChars = function (el, cls, wrapCls) {
    var i = 0;
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          Array.prototype.forEach.call(n.nodeValue, function (ch) {
            if (/\s/.test(ch)) { frag.appendChild(doc.createTextNode(ch)); return; }
            var s = doc.createElement('span'); s.className = cls; s.textContent = ch; s.style.setProperty('--i', i++);
            if (wrapCls) { var w = doc.createElement('span'); w.className = wrapCls; w.appendChild(s); s.className = ''; frag.appendChild(w); }
            else frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) { walk(n); }
      });
    };
    walk(el);
  };
  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var scramble = function (el) {
    if (el.__scr) return; el.__scr = 1;
    var txt = el.textContent, len = txt.length, t0 = 0, dur = 520;
    var step = function (t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), done = Math.floor(p * len), out = '';
      for (var k = 0; k < len; k++) {
        var c = txt.charAt(k);
        out += (k < done || c === ' ' || c === '.' || c === ',') ? c : GLYPHS.charAt((Math.random() * GLYPHS.length) | 0);
      }
      el.textContent = out;
      if (p < 1) raf(step); else el.textContent = txt;
    };
    raf(step);
  };
  var countUp = function (el) {
    if (el.__cnt) return; el.__cnt = 1;
    var to = +el.getAttribute('data-count'), from = +(el.getAttribute('data-from') || 0), t0 = 0, dur = 1700;
    var step = function (t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = Math.round(from + (to - from) * e);
      if (p < 1) raf(step);
    };
    raf(step);
  };

  /* ---------- Entrance animations ---------- */
  var targets = $$('[data-a],[data-split],[data-draw]');
  var revealed = 0;
  var hooks = function (el) {
    var d = delayOf(el);
    var run = function () {
      (el.matches('[data-scramble]') ? [el] : []).concat($$('[data-scramble]', el)).forEach(scramble);
      (el.matches('[data-count]') ? [el] : []).concat($$('[data-count]', el)).forEach(countUp);
    };
    if (d) setTimeout(run, d); else run();
  };
  var reveal = function (el) { if (el.classList.contains('in')) return; el.classList.add('in'); revealed++; hooks(el); };

  if (motion) {
    $$('[data-split]').forEach(splitWords);
    $$('.hero-name').forEach(function (h) { $$('.l>span', h).forEach(function (s) { splitChars(s, 'c'); }); var i = 0; $$('.c', h).forEach(function (c) { c.style.setProperty('--i', i++); }); });
    $$('[data-count]').forEach(function (el) { el.textContent = el.getAttribute('data-from') || '0'; });
    $$('[data-stagger]').forEach(function (g) {
      $$('[data-a]', g).filter(function (el) { return el.parentNode === g; }).forEach(function (el, i) { el.style.setProperty('--d', (i * 90) + 'ms'); });
    });
    var start = function () {
      if ('IntersectionObserver' in win) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { if (en.isIntersecting) { (en.target.__rv || [en.target]).forEach(reveal); io.unobserve(en.target); } });
        }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
        /* clipped elements (image wipes) never intersect while clipped: watch their parent instead */
        targets.forEach(function (el) {
          var watch = /^wipe/.test(el.getAttribute('data-a') || '') ? el.parentNode : el;
          if (watch !== el) { (watch.__rv = watch.__rv || []).push(el); } else { (el.__rv = el.__rv || []).push(el); }
          io.observe(watch);
        });
      } else { targets.forEach(reveal); }
      /* safety: anything on screen that is still hidden after 2.5s is shown */
      setTimeout(function () {
        targets.forEach(function (el) {
          if (el.classList.contains('in')) return;
          var r = el.getBoundingClientRect();
          if (!revealed || (r.top < win.innerHeight && r.bottom > 0)) reveal(el);
        });
      }, 2500);
    };
    if (root.classList.contains('has-intro')) setTimeout(start, 1250); else start();
  } else {
    root.classList.remove('motion');
  }

  /* ---------- Home intro (overlay inserted by inline body script) ---------- */
  var intro = $('#intro');
  if (intro) {
    var gone = false;
    var finish = function () {
      if (gone) return; gone = true;
      if (intro.parentNode) intro.parentNode.removeChild(intro);
      doc.removeEventListener('keydown', onKey);
    };
    var skip = function () { if (!gone) { intro.classList.add('out'); setTimeout(finish, 360); } };
    var onKey = function (e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip(); };
    intro.addEventListener('click', skip);
    intro.addEventListener('touchstart', skip, { passive: true });
    doc.addEventListener('keydown', onKey);
    $$('.half', intro).forEach(function (h) { h.addEventListener('animationend', function () { setTimeout(finish, 30); }); });
    setTimeout(finish, 2500);
  }

  /* ---------- Hero background video ---------- */
  var media = $('[data-hero-video]');
  if (media) {
    var conn = navigator.connection || {};
    if (!reduce && !conn.saveData) {
      var startVideo = function () {
        var mobile = mq('(max-width: 760px)');
        var v = doc.createElement('video');
        v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
        v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
        v.preload = 'auto';
        v.poster = media.getAttribute(mobile ? 'data-poster-m' : 'data-poster-d');
        v.src = media.getAttribute(mobile ? 'data-src-m' : 'data-src-d');
        media.appendChild(v);
        var visible = true;
        var play = function () { if (!visible || doc.hidden) return; var p = v.play(); if (p && p.catch) p.catch(function () {}); };
        v.addEventListener('playing', function () { v.classList.add('is-on'); }, { once: true });
        if ('IntersectionObserver' in win) {
          new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) play(); else v.pause(); }).observe(media);
        }
        doc.addEventListener('visibilitychange', function () { if (doc.hidden) v.pause(); else play(); });
        play();
      };
      if (doc.readyState === 'complete') setTimeout(startVideo, 0);
      else win.addEventListener('load', function () { setTimeout(startVideo, 0); });
    }
  }

  /* ---------- Scroll: header, progress bar, back to top ---------- */
  var bar = $('.progress b'), toTop = $('.to-top'), ring = $('.to-top .fg'), ticking = false, lastY = 0;
  var onScroll = function () {
    ticking = false;
    var y = win.pageYOffset || root.scrollTop, max = root.scrollHeight - win.innerHeight, p = max > 0 ? Math.min(1, y / max) : 0;
    if (nav) nav.classList.toggle('scrolled', y > 30);
    if (bar) bar.style.transform = 'scaleX(' + p + ')';
    if (ring) ring.style.strokeDashoffset = String(1 - p);
    /* back to top shows only while scrolling up (so it never sits on text you are reading), and at the very end */
    if (toTop) toTop.classList.toggle('show', y > win.innerHeight * 0.9 && (y < lastY - 2 || (toTop.classList.contains('show') && y <= lastY + 2) || y >= max - 40));
    lastY = y;
  };
  win.addEventListener('scroll', function () { if (!ticking) { ticking = true; raf(onScroll); } }, { passive: true });
  win.addEventListener('resize', onScroll);
  onScroll();
  if (toTop) toTop.addEventListener('click', function () { win.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---------- Tap ripple ---------- */
  doc.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('.pill,.lb-btn');
    if (!b || reduce) return;
    var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2, sp = doc.createElement('span');
    sp.className = 'rp'; sp.style.width = sp.style.height = s + 'px';
    sp.style.left = (e.clientX - r.left - s / 2) + 'px'; sp.style.top = (e.clientY - r.top - s / 2) + 'px';
    b.appendChild(sp); setTimeout(function () { if (sp.parentNode) sp.parentNode.removeChild(sp); }, 650);
  }, { passive: true });

  /* ---------- Desktop pointer niceties: cursor, magnetic, tilt ---------- */
  if (fine && motion) {
    var cur = $('.cursor');
    if (cur) {
      var cR = $('.cr', cur), cD = $('.cd', cur), cLab = $('.lab', cur);
      var mx = -100, my = -100, rx = -100, ry = -100, running = false;
      var loop = function () {
        rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
        cR.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
        cD.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
        if (Math.abs(mx - rx) + Math.abs(my - ry) > 0.3) raf(loop); else running = false;
      };
      doc.addEventListener('mousemove', function (e) {
        mx = e.clientX; my = e.clientY; cur.classList.remove('off');
        if (!running) { running = true; raf(loop); }
      }, { passive: true });
      doc.addEventListener('mouseover', function (e) {
        var t = e.target.closest ? e.target.closest('[data-cursor],a,button') : null;
        if (t) { cur.classList.add('hover'); cLab.textContent = t.getAttribute('data-cursor') || ''; cur.classList.toggle('nolab', !t.getAttribute('data-cursor')); }
        else { cur.classList.remove('hover'); cLab.textContent = ''; }
      });
      doc.addEventListener('mouseleave', function () { cur.classList.add('off'); });
    }
    $$('.mag').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (dx * 0.22).toFixed(1) + 'px,' + (dy * 0.32).toFixed(1) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
    $$('.tilt').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.transition = 'transform .12s linear';
        el.style.transform = 'perspective(900px) rotateX(' + ((0.5 - py) * 7).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 7).toFixed(2) + 'deg) translateY(-4px)';
        el.style.setProperty('--mx', (px * 100) + '%'); el.style.setProperty('--my', (py * 100) + '%');
      });
      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform .6s cubic-bezier(.2,.8,.2,1)'; el.style.transform = '';
        setTimeout(function () { el.style.transition = ''; }, 650);
      });
    });
  }

  /* ---------- Page transitions (internal links) ---------- */
  if (motion) {
    doc.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target || a.hasAttribute('download')) return;
      var u; try { u = new URL(a.href, location.href); } catch (er) { return; }
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.hash)) return;
      if (u.pathname === location.pathname && !u.hash) { e.preventDefault(); win.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      e.preventDefault();
      try { sessionStorage.setItem('arg_pt', '1'); } catch (er) {}
      var o = doc.createElement('div'); o.className = 'pt-out'; doc.body.appendChild(o);
      setTimeout(function () { location.href = u.href; }, 300);
    });
    win.addEventListener('pageshow', function (e) {
      if (e.persisted) { $$('.pt-out').forEach(function (o) { o.parentNode.removeChild(o); }); root.classList.remove('pt-in'); }
    });
  }

  /* ---------- Ambient particles (cotton fibres) ---------- */
  if (motion) {
    $$('canvas[data-particles]').forEach(function (cv) {
      var ctx = cv.getContext('2d'); if (!ctx) return;
      var dpr = Math.min(win.devicePixelRatio || 1, 1.5), W = 0, H = 0, ps = [], on = false, last = 0;
      var N = win.innerWidth < 760 ? 22 : 40;
      var size = function () {
        W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      var seed = function () {
        ps = [];
        for (var i = 0; i < N; i++) ps.push({ x: Math.random() * W, y: Math.random() * H, l: 6 + Math.random() * 18, a: Math.random() * Math.PI, va: (Math.random() - .5) * .01, vx: (Math.random() - .5) * .18, vy: -.08 - Math.random() * .22, o: .12 + Math.random() * .35, c: Math.random() < .22 });
      };
      var draw = function (t) {
        if (!on) return;
        if (t - last < 30) { raf(draw); return; } last = t;
        ctx.clearRect(0, 0, W, H); ctx.lineCap = 'round';
        for (var i = 0; i < ps.length; i++) {
          var p = ps[i]; p.x += p.vx; p.y += p.vy; p.a += p.va;
          if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; }
          if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
          var dx = Math.cos(p.a) * p.l / 2, dy = Math.sin(p.a) * p.l / 2;
          ctx.strokeStyle = p.c ? 'rgba(224,112,47,' + p.o + ')' : 'rgba(238,230,211,' + p.o + ')';
          ctx.lineWidth = p.c ? 1.1 : .8;
          ctx.beginPath(); ctx.moveTo(p.x - dx, p.y - dy); ctx.quadraticCurveTo(p.x + dy * .4, p.y - dx * .4, p.x + dx, p.y + dy); ctx.stroke();
        }
        raf(draw);
      };
      size(); seed();
      win.addEventListener('resize', function () { size(); });
      if ('IntersectionObserver' in win) {
        new IntersectionObserver(function (en) {
          var vis = en[0].isIntersecting && !doc.hidden;
          if (vis && !on) { on = true; raf(draw); } else if (!vis) on = false;
        }).observe(cv);
      }
      doc.addEventListener('visibilitychange', function () { if (doc.hidden) on = false; });
    });
  }

  /* ---------- Swipe rail dots (home cards on phones) ---------- */
  $$('[data-rail]').forEach(function (rail) {
    var dots = $$('.rail-dots i', rail.parentNode);
    if (!dots.length) return;
    rail.addEventListener('scroll', function () {
      var cards = $$('.card', rail), best = 0, bd = 1e9, rl = rail.getBoundingClientRect().left;
      cards.forEach(function (c, i) { var d = Math.abs(c.getBoundingClientRect().left - rl - 20); if (d < bd) { bd = d; best = i; } });
      dots.forEach(function (d, i) { d.classList.toggle('on', i === best); });
    }, { passive: true });
  });

  /* ---------- Footer wordmark: fit to width, letters rise ---------- */
  $$('.wordmark').forEach(function (wm) {
    var inner = doc.createElement('span'); inner.style.display = 'inline-block';
    while (wm.firstChild) inner.appendChild(wm.firstChild);
    wm.appendChild(inner);
    if (motion) splitChars(inner, '', 'wl');
    if (motion) { var i = 0; $$('.wl>span', inner).forEach(function (s) { s.style.setProperty('--i', i++); }); }
    var fit = function () {
      wm.style.fontSize = '100px';
      var w = inner.getBoundingClientRect().width, avail = wm.clientWidth;
      if (w > 0 && avail > 0) wm.style.fontSize = Math.floor(100 * avail / w * 0.99 * 10) / 10 + 'px';
    };
    fit();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(fit);
    win.addEventListener('resize', fit);
  });

  /* ---------- Gallery lightbox (zooms from the thumbnail) ---------- */
  var box = $('#lightbox'), tiles = $$('[data-lb]');
  if (box && tiles.length && typeof box.showModal === 'function') {
    var img = $('.lb-stage img', box), cap = $('.lb-cap', box), count = $('.lb-count', box), stage = $('.lb-stage', box);
    var idx = 0, opener = null, busy = false;
    var thumbRect = function () { var t = $('img', tiles[idx]); return t.getBoundingClientRect(); };
    var flipFrom = function (r) {
      var f = img.getBoundingClientRect();
      if (!f.width) return;
      var s = Math.max(r.width / f.width, r.height / f.height);
      var tx = r.left + (r.width - f.width * s) / 2 - f.left, ty = r.top + (r.height - f.height * s) / 2 - f.top;
      return 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')';
    };
    var fill = function (i) {
      idx = (i + tiles.length) % tiles.length;
      var t = tiles[idx];
      img.src = t.getAttribute('data-full'); img.hidden = false;
      img.alt = $('img', t).alt;
      img.width = +t.getAttribute('data-w'); img.height = +t.getAttribute('data-h');
      cap.textContent = t.getAttribute('data-cap');
      count.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(tiles.length).padStart(2, '0');
    };
    var go = function (dir) {
      fill(idx + dir);
      if (motion && img.animate) img.animate([{ opacity: 0, transform: 'translateX(' + (dir * 40) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
    };
    var open = function (i) {
      opener = tiles[i]; fill(i); box.showModal();
      $('[data-close]', box).focus();
      var startAnim = function () {
        box.classList.add('on');
        if (!motion) return;
        var tr = flipFrom(thumbRect()); if (!tr) return;
        img.style.transition = 'none'; img.style.transform = tr;
        img.getBoundingClientRect();
        img.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)'; img.style.transform = '';
      };
      if (img.decode) img.decode().then(startAnim, startAnim); else startAnim();
    };
    var close = function () {
      if (busy) return;
      if (!motion) { box.classList.remove('on'); box.close(); return; }
      busy = true;
      var tr = flipFrom(thumbRect());
      box.classList.remove('on');
      img.style.transition = 'transform .45s cubic-bezier(.65,0,.35,1)';
      if (tr) img.style.transform = tr;
      setTimeout(function () { box.close(); img.style.transition = ''; img.style.transform = ''; busy = false; }, 440);
    };
    tiles.forEach(function (t, i) { t.addEventListener('click', function () { open(i); }); });
    $('[data-prev]', box).addEventListener('click', function () { go(-1); });
    $('[data-next]', box).addEventListener('click', function () { go(1); });
    $('[data-close]', box).addEventListener('click', close);
    box.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    box.addEventListener('close', function () { box.classList.remove('on'); if (opener) opener.focus(); });
    box.addEventListener('click', function (e) { if (swiped) { swiped = false; return; } if (e.target === box || e.target === stage) close(); });
    var sx = null, swiped = false;
    stage.addEventListener('pointerdown', function (e) { sx = e.clientX; swiped = false; });
    stage.addEventListener('pointerup', function (e) { if (sx === null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) { swiped = true; go(dx < 0 ? 1 : -1); } });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'Tab') {
        var f = $$('button', box), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
})();
