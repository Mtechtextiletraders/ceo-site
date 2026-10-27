/* Abdul Rasheed Gill - small, dependency-free site script.
   Mobile menu, scroll reveals, home intro, hero background video, gallery lightbox. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile menu ---------- */
  var head = doc.querySelector('.site-head');
  var menuBtn = doc.querySelector('.menu-btn');
  if (head && menuBtn) {
    var setMenu = function (open) {
      head.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.textContent = open ? 'Close' : 'Menu';
    };
    menuBtn.addEventListener('click', function () { setMenu(!head.classList.contains('open')); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && head.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
    });
  }

  /* ---------- Reveal on scroll (fade + 24px rise, once, staggered) ---------- */
  var rv = doc.querySelectorAll('.rv');
  if (!reduce && 'IntersectionObserver' in window) {
    doc.querySelectorAll('[data-stagger]').forEach(function (g) {
      g.querySelectorAll('.rv').forEach(function (el, i) { el.style.setProperty('--d', (i * 70) + 'ms'); });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    root.classList.remove('motion');
  }

  /* ---------- Home intro (overlay is inserted by the inline head script) ---------- */
  var intro = doc.getElementById('intro');
  if (intro) {
    var done = false;
    var finish = function () {
      if (done) return; done = true;
      intro.parentNode && intro.parentNode.removeChild(intro);
      doc.removeEventListener('keydown', onKey);
    };
    var skip = function () { if (!done) { intro.classList.add('out'); setTimeout(finish, 420); } };
    var onKey = function (e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip(); };
    intro.addEventListener('click', skip);
    intro.addEventListener('touchstart', skip, { passive: true });
    doc.addEventListener('keydown', onKey);
    intro.addEventListener('animationend', function (e) { if (e.target === intro) finish(); });
    setTimeout(finish, 2600); /* safety net */
  }

  /* ---------- Hero background video ---------- */
  var media = doc.querySelector('[data-hero-video]');
  if (media) {
    var conn = navigator.connection || {};
    if (!reduce && !conn.saveData) {
      var start = function () {
        var mobile = matchMedia('(max-width: 760px)').matches;
        var v = doc.createElement('video');
        v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
        v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
        v.preload = 'auto';
        v.poster = media.getAttribute(mobile ? 'data-poster-m' : 'data-poster-d');
        v.src = media.getAttribute(mobile ? 'data-src-m' : 'data-src-d');
        media.appendChild(v);
        var visible = true;
        var play = function () {
          if (!visible || doc.hidden) return;
          var p = v.play(); if (p && p.catch) p.catch(function () {});
        };
        v.addEventListener('playing', function () { v.classList.add('is-on'); }, { once: true });
        if ('IntersectionObserver' in window) {
          new IntersectionObserver(function (en) {
            visible = en[0].isIntersecting;
            if (visible) play(); else v.pause();
          }).observe(media);
        }
        doc.addEventListener('visibilitychange', function () { if (doc.hidden) v.pause(); else play(); });
        play();
      };
      if (doc.readyState === 'complete') setTimeout(start, 0);
      else window.addEventListener('load', function () { setTimeout(start, 0); });
    }
  }

  /* ---------- Gallery lightbox ---------- */
  var box = doc.getElementById('lightbox');
  var tiles = doc.querySelectorAll('[data-lb]');
  if (box && tiles.length && typeof box.showModal === 'function') {
    var img = box.querySelector('.lb-stage img');
    var cap = box.querySelector('.lb-cap');
    var count = box.querySelector('.lb-count');
    var idx = 0, opener = null;
    var show = function (i) {
      idx = (i + tiles.length) % tiles.length;
      var t = tiles[idx];
      img.src = t.getAttribute('data-full'); img.hidden = false;
      img.alt = t.querySelector('img').alt;
      img.width = +t.getAttribute('data-w'); img.height = +t.getAttribute('data-h');
      cap.textContent = t.getAttribute('data-cap');
      count.textContent = (idx + 1) + ' / ' + tiles.length;
    };
    tiles.forEach(function (t, i) {
      t.addEventListener('click', function () {
        opener = t; show(i); box.showModal();
        box.querySelector('[data-close]').focus();
      });
    });
    box.querySelector('[data-prev]').addEventListener('click', function () { show(idx - 1); });
    box.querySelector('[data-next]').addEventListener('click', function () { show(idx + 1); });
    box.querySelector('[data-close]').addEventListener('click', function () { box.close(); });
    box.addEventListener('close', function () { if (opener) opener.focus(); });
    box.addEventListener('click', function (e) { if (e.target === box || e.target.classList.contains('lb-stage')) box.close(); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
      else if (e.key === 'Tab') { /* keep focus inside the dialog */
        var f = box.querySelectorAll('button');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
})();
