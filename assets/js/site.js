/* Frank G. — site behaviour. No dependencies. */
(function () {
  'use strict';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(pointer:fine)').matches;

  /* ---- scroll progress ---- */
  var prog = document.getElementById('prog');
  if (prog) {
    var tick = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    tick();
  }

  /* ---- reveal on scroll ---- */
  var rv = document.querySelectorAll('.rv');
  if (rv.length) {
    if (!('IntersectionObserver' in window)) {
      rv.forEach(function (n) { n.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var sibs = Array.prototype.filter.call(e.target.parentNode.children, function (n) {
            return n.classList.contains('rv');
          });
          e.target.style.transitionDelay = Math.min(sibs.indexOf(e.target), 5) * 70 + 'ms';
          e.target.classList.add('in');
          io.unobserve(e.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      rv.forEach(function (n) { io.observe(n); });
    }
  }

  /* ---- count up ---- */
  var nums = document.querySelectorAll('[data-c]');
  if (nums.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, to = parseInt(el.dataset.c, 10), t0 = null;
        cio.unobserve(el);
        if (RM) { el.textContent = to; return; }
        requestAnimationFrame(function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / 1100, 1);
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        });
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { cio.observe(n); });
  } else {
    nums.forEach(function (n) { n.textContent = n.dataset.c; });
  }

  /* ---- ticker ---- */
  var tin = document.getElementById('tin');
  if (tin) {
    var words = ['DMX512', 'RASPBERRY PI', 'MIDI', 'PNEUMATICS', 'COMPUTER VISION',
                 'QUEST 3', 'ESP32', '4-CH AUDIO', 'MAILJET', 'ARDUINO'];
    var html = '';
    for (var r = 0; r < 2; r++) {
      words.forEach(function (w, i) {
        html += '<span class="' + (i % 3 === 0 ? 'hi' : '') + '">' + w + '</span><span class="x">&times;</span>';
      });
    }
    tin.innerHTML = html;
  }

  /* ---- home hero crossfade ---- */
  var slides = document.querySelectorAll('.hslide');
  var dots = document.querySelectorAll('.hdots b');
  if (!RM && slides.length > 1) {
    var cur = 0;
    setInterval(function () {
      slides[cur].classList.remove('on');
      if (dots[cur]) dots[cur].classList.remove('on');
      cur = (cur + 1) % slides.length;
      slides[cur].classList.add('on');
      if (dots[cur]) dots[cur].classList.add('on');
      var im = slides[cur].querySelector('img');
      im.style.animation = 'none'; void im.offsetWidth; im.style.animation = '';
    }, 5200);
  }

  /* ---- cursor spotlight ---- */
  var spot = document.getElementById('spot');
  if (spot && !RM && FINE) {
    var host = spot.parentNode;
    host.addEventListener('pointermove', function (e) {
      var r = host.getBoundingClientRect();
      spot.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      spot.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  }

  /* ---- parallax on featured / project hero images ---- */
  if (!RM) {
    var par = document.querySelectorAll('[data-par]');
    if (par.length) {
      window.addEventListener('scroll', function () {
        par.forEach(function (el) {
          var box = el.closest('section') || el.parentNode;
          var r = box.getBoundingClientRect();
          if (r.bottom < 0 || r.top > window.innerHeight) return;
          var p = (window.innerHeight / 2 - (r.top + r.height / 2)) / window.innerHeight;
          var base = el.dataset.par === 'hero' ? 1.08 : 1.12;
          el.style.transform = 'scale(' + base + ') translateY(' + (p * 34) + 'px)';
        });
      }, { passive: true });
    }
  }

  /* ---- work filters ---- */
  var grid = document.getElementById('grid');
  var tabs = document.getElementById('tabs');
  if (grid && tabs) {
    var cards = grid.querySelectorAll('.card');
    tabs.addEventListener('click', function (e) {
      var b = e.target.closest('.tb');
      if (!b) return;
      tabs.querySelectorAll('.tb').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      var f = b.dataset.f;
      grid.classList.toggle('flat', f !== 'all');
      cards.forEach(function (c) {
        c.classList.toggle('hide', f !== 'all' && c.dataset.t.split(' ').indexOf(f) < 0);
      });
    });
  }

  /* ---- subtle card tilt ---- */
  if (!RM && FINE) {
    document.querySelectorAll('.card').forEach(function (c) {
      c.addEventListener('pointermove', function (ev) {
        var r = c.getBoundingClientRect();
        var x = (ev.clientX - r.left) / r.width - 0.5;
        var y = (ev.clientY - r.top) / r.height - 0.5;
        c.style.transform = 'perspective(900px) rotateY(' + (x * 3.5) + 'deg) rotateX(' +
                            (-y * 3.5) + 'deg) translateY(-4px)';
      });
      c.addEventListener('pointerleave', function () { c.style.transform = ''; });
    });
  }

  /* ---- gallery strip: drag to scroll + arrow keys ---- */
  document.querySelectorAll('.strip').forEach(function (s) {
    var down = false, sx = 0, sl = 0;
    s.addEventListener('pointerdown', function (e) {
      down = true; sx = e.clientX; sl = s.scrollLeft; s.setPointerCapture(e.pointerId);
    });
    s.addEventListener('pointermove', function (e) {
      if (!down) return;
      s.scrollLeft = sl - (e.clientX - sx);
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      s.addEventListener(ev, function () { down = false; });
    });
    s.setAttribute('tabindex', '0');
    s.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var step = s.querySelector('figure') ? s.querySelector('figure').offsetWidth + 16 : 400;
      s.scrollBy({ left: e.key === 'ArrowRight' ? step : -step, behavior: RM ? 'auto' : 'smooth' });
    });
  });
})();
