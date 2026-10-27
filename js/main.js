/* Abdul Rasheed Gill - site script (no libraries).
   Menu, soft entrance animations, counters, home intro, hero film, header shrink,
   back to top, gentle photo parallax, story rail, FAQ accordion, footer wordmark, lightbox. */
(function () {
  'use strict';
  window.__arg = true;
  var doc = document, root = doc.documentElement, win = window;
  var mq = function (q) { return win.matchMedia && win.matchMedia(q).matches; };
  var reduce = mq('(prefers-reduced-motion: reduce)');
  var motion = root.classList.contains('motion') && !reduce;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var raf = win.requestAnimationFrame || function (f) { return setTimeout(f, 16); };
  var delayOf = function (el) { var d = parseFloat(el.style.getPropertyValue('--d')); return isNaN(d) ? 0 : d; };

  /* ---------- Mobile menu ---------- */
  var nav = $('#nav'), menuBtn = $('.menu-btn');
  if (nav && menuBtn) {
    var label = $('.mb-t', menuBtn);
    var setMenu = function (open) {
      root.style.setProperty('--navh', nav.getBoundingClientRect().height + 'px');
      nav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (label) label.textContent = open ? 'Close' : 'Menu';
      doc.body.style.overflow = open ? 'hidden' : '';
    };
    menuBtn.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); } });
    $$('#nav-links a').forEach(function (a) { a.addEventListener('click', function () { if (nav.classList.contains('open')) setMenu(false); }); });
    win.addEventListener('resize', function () { if (win.innerWidth > 900 && nav.classList.contains('open')) setMenu(false); });
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
  var countUp = function (el) {
    if (el.__cnt) return; el.__cnt = 1;
    var to = +el.getAttribute('data-count'), from = +(el.getAttribute('data-from') || 0), t0 = 0, dur = 1600;
    var step = function (t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (p < 1) raf(step);
    };
    raf(step);
  };

  /* ---------- Entrance animations (self-playing, once) ---------- */
  var targets = $$('[data-a],[data-split],[data-draw],.tl,.tl-item,.wordmark');
  var reveal = function (el) {
    if (el.classList.contains('in')) return;
    el.classList.add('in');
    var cs = (el.matches('[data-count]') ? [el] : []).concat($$('[data-count]', el));
    if (cs.length) setTimeout(function () { cs.forEach(countUp); }, delayOf(el));
  };
  if (motion) {
    $$('[data-split]').forEach(splitWords);
    $$('[data-count]').forEach(function (el) { el.textContent = el.getAttribute('data-from') || '0'; });
    $$('[data-stagger]').forEach(function (g) {
      Array.prototype.slice.call(g.children).forEach(function (el, i) { if (el.hasAttribute('data-a') && !el.style.getPropertyValue('--d')) el.style.setProperty('--d', (i * 80) + 'ms'); });
    });
    var start = function () {
      if ('IntersectionObserver' in win) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { if (en.isIntersecting) { (en.target.__rv || []).forEach(reveal); io.unobserve(en.target); } });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        targets.forEach(function (el) {
          /* clipped images and cards inside a horizontal rail are watched through their container */
          var watch = (el.parentNode && el.parentNode.closest && el.parentNode.closest('[data-rail]')) || (el.getAttribute('data-a') === 'img' ? el.parentNode : el);
          (watch.__rv = watch.__rv || []).push(el);
          io.observe(watch);
        });
      } else { targets.forEach(reveal); }
      /* safety net: anything on screen that is still hidden is shown */
      setTimeout(function () {
        targets.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < win.innerHeight && r.bottom > 0) reveal(el); });
      }, 2600);
      win.addEventListener('pageshow', function (e) { if (e.persisted) targets.forEach(reveal); });
    };
    if (root.classList.contains('has-intro')) setTimeout(start, 1450); else start();
  } else {
    root.classList.remove('motion');
  }

  /* ---------- Home intro (overlay inserted by an inline script in <body>) ---------- */
  var intro = $('#intro');
  if (intro) {
    var gone = false;
    var finish = function () {
      if (gone) return; gone = true;
      if (intro.parentNode) intro.parentNode.removeChild(intro);
      root.classList.remove('has-intro');
      doc.removeEventListener('keydown', onKey);
    };
    var skip = function () { if (!gone) { intro.classList.add('out'); setTimeout(finish, 340); } };
    var onKey = function (e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip(); };
    intro.addEventListener('click', skip);
    intro.addEventListener('touchstart', skip, { passive: true });
    doc.addEventListener('keydown', onKey);
    intro.addEventListener('animationend', function (e) { if (e.target === intro) finish(); });
    setTimeout(finish, 2300);
  }

  /* ---------- Hero film (poster first, video after load) ---------- */
  var film = $('[data-film]');
  if (film) {
    var conn = navigator.connection || {};
    if (!reduce && !conn.saveData) {
      var startVideo = function () {
        var mobile = mq('(max-width: 699px)');
        var v = doc.createElement('video');
        v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
        v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
        v.preload = 'auto';
        v.poster = film.getAttribute(mobile ? 'data-poster-m' : 'data-poster-d');
        v.src = film.getAttribute(mobile ? 'data-src-m' : 'data-src-d');
        film.appendChild(v);
        var visible = true;
        var play = function () { if (!visible || doc.hidden) return; var p = v.play(); if (p && p.catch) p.catch(function () {}); };
        v.addEventListener('playing', function () { v.classList.add('is-on'); }, { once: true });
        if ('IntersectionObserver' in win) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) play(); else v.pause(); }).observe(film);
        doc.addEventListener('visibilitychange', function () { if (doc.hidden) v.pause(); else play(); });
        play();
      };
      if (doc.readyState === 'complete') setTimeout(startVideo, 300);
      else win.addEventListener('load', function () { setTimeout(startVideo, 300); });
    }
  }

  /* ---------- Scroll: header shrink, back to top, gentle parallax ---------- */
  var toTop = $('.to-top'), pars = motion ? $$('[data-par]') : [], ticking = false;
  var onScroll = function () {
    ticking = false;
    var y = win.pageYOffset || root.scrollTop, vh = win.innerHeight;
    if (nav) nav.classList.toggle('scrolled', y > 24);
    if (toTop) toTop.classList.toggle('show', y > vh * 1.2);
    for (var i = 0; i < pars.length; i++) {
      var r = pars[i].getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) continue;
      var p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); /* -1..1 */
      var img = pars[i].__img || (pars[i].__img = $('img', pars[i]));
      if (img) img.style.transform = 'translate3d(0,' + (p * -18).toFixed(1) + 'px,0)';
    }
  };
  win.addEventListener('scroll', function () { if (!ticking) { ticking = true; raf(onScroll); } }, { passive: true });
  win.addEventListener('resize', onScroll);
  onScroll();
  if (toTop) toTop.addEventListener('click', function () { win.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); var s = $('.skip'); if (s) s.focus({ preventScroll: true }); });

  /* ---------- Story rail on phones: dots, swipe, gentle auto-advance ---------- */
  $$('[data-rail]').forEach(function (rail) {
    var dotsWrap = rail.parentNode.querySelector('.rail-dots'); if (!dotsWrap) return;
    var cards = Array.prototype.slice.call(rail.children), dots = $$('button', dotsWrap), cur = 0, timer = null, userTouched = false, inView = false;
    var active = function () { return getComputedStyle(rail).display === 'flex'; };
    var setDot = function (i) { cur = i; dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); }); };
    var goTo = function (i) { rail.scrollTo({ left: cards[i].offsetLeft - cards[0].offsetLeft, behavior: reduce ? 'auto' : 'smooth' }); setDot(i); };
    rail.addEventListener('scroll', function () {
      var best = 0, bd = 1e9;
      cards.forEach(function (c, i) { var d = Math.abs(c.offsetLeft - cards[0].offsetLeft - rail.scrollLeft); if (d < bd) { bd = d; best = i; } });
      setDot(best);
    }, { passive: true });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { userTouched = true; goTo(i); }); });
    ['touchstart', 'pointerdown', 'wheel'].forEach(function (ev) { rail.addEventListener(ev, function () { userTouched = true; }, { passive: true }); });
    var tick = function () { if (!userTouched && inView && active() && !doc.hidden) goTo((cur + 1) % cards.length); };
    if (!reduce && 'IntersectionObserver' in win) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold: 0.6 }).observe(rail);
      timer = setInterval(tick, 5000);
    }
  });

  /* ---------- FAQ accordion ---------- */
  $$('.faq-q').forEach(function (b) {
    b.addEventListener('click', function () {
      var item = b.closest('.faq-item'), open = !item.classList.contains('open');
      item.classList.toggle('open', open); b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---------- Footer wordmark: fit to width, letters rise ---------- */
  $$('.wordmark').forEach(function (wm) {
    var inner = doc.createElement('span'); inner.style.display = 'inline-block';
    while (wm.firstChild) inner.appendChild(wm.firstChild);
    wm.appendChild(inner);
    if (motion) {
      var i = 0;
      var walk = function (node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = doc.createDocumentFragment();
            Array.prototype.forEach.call(n.nodeValue, function (ch) {
              if (/\s/.test(ch)) { frag.appendChild(doc.createTextNode(ch)); return; }
              var w = doc.createElement('span'); w.className = 'wl';
              var s = doc.createElement('span'); s.textContent = ch; s.style.setProperty('--i', i++);
              w.appendChild(s); frag.appendChild(w);
            });
            node.replaceChild(frag, n);
          } else if (n.nodeType === 1) walk(n);
        });
      };
      walk(inner);
    }
    var fit = function () {
      wm.style.fontSize = '100px';
      var w = inner.getBoundingClientRect().width, avail = wm.clientWidth;
      if (w > 0 && avail > 0) wm.style.fontSize = Math.floor(100 * avail / w * 0.98 * 10) / 10 + 'px';
    };
    fit();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(fit);
    win.addEventListener('resize', fit);
  });

  /* ---------- Gallery lightbox (zooms from the thumbnail) ---------- */
  var box = $('#lightbox'), tiles = $$('[data-lb]');
  if (box && tiles.length && typeof box.showModal === 'function') {
    var img = $('.lb-stage img', box), cap = $('.lb-cap', box), count = $('.lb-count', box), stage = $('.lb-stage', box);
    var idx = 0, opener = null, busy = false, sx = null, swiped = false;
    var thumbRect = function () { return $('img', tiles[idx]).getBoundingClientRect(); };
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
      if (motion && img.animate) img.animate([{ opacity: 0, transform: 'translateX(' + (dir * 30) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.2,.8,.2,1)' });
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
      img.style.transition = 'transform .42s cubic-bezier(.65,0,.35,1)';
      if (tr) img.style.transform = tr;
      setTimeout(function () { box.close(); img.style.transition = ''; img.style.transform = ''; busy = false; }, 420);
    };
    tiles.forEach(function (t, i) { t.addEventListener('click', function () { open(i); }); });
    $('[data-prev]', box).addEventListener('click', function () { go(-1); });
    $('[data-next]', box).addEventListener('click', function () { go(1); });
    $('[data-close]', box).addEventListener('click', close);
    box.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    box.addEventListener('close', function () { box.classList.remove('on'); if (opener) opener.focus(); });
    box.addEventListener('click', function (e) { if (swiped) { swiped = false; return; } if (e.target === box || e.target === stage) close(); });
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
