/**
 * animations.js — Arya Portfolio
 * 1. Bee cursor with fading trail  (desktop / fine-pointer only)
 * 2. Scroll-reveal for portfolio cards (Intersection Observer)
 */

// ─────────────────────────────────────────────────────────
// 1. BEE CURSOR WITH TRAIL
// ─────────────────────────────────────────────────────────
(function () {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  var TRAIL = 5;   // number of trail dots
  var HIST  = 24;  // history ring-buffer size (frames)

  // Main cursor
  var cursor = document.createElement('div');
  cursor.id  = 'bee-cursor';
  document.body.appendChild(cursor);

  // Trail dots
  var dots = [];
  for (var i = 0; i < TRAIL; i++) {
    var d = document.createElement('div');
    d.className = 'bee-trail-dot';
    document.body.appendChild(d);
    dots.push(d);
  }

  var mx = -200, my = -200, visible = false, overBee = false;

  // Ring buffer of past mouse positions
  var hist = [];
  for (var h = 0; h < HIST; h++) hist.push({ x: -200, y: -200 });
  var hi = 0;

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
    if (!visible) { visible = true; cursor.style.opacity = '1'; }
  });

  document.addEventListener('mouseleave', function () {
    visible = false;
    cursor.style.opacity = '0';
    dots.forEach(function (d) { d.style.opacity = '0'; });
  });

  // Hide custom cursor over the bee so the system pointer hand shows cleanly
  var beeEl = document.querySelector('.bee');
  if (beeEl) {
    beeEl.addEventListener('mouseenter', function () {
      overBee = true;
      cursor.style.opacity = '0';
      dots.forEach(function (d) { d.style.opacity = '0'; });
    });
    beeEl.addEventListener('mouseleave', function () {
      overBee = false;
      if (visible) cursor.style.opacity = '1';
    });
  }

  function tick() {
    // Store current position
    hist[hi] = { x: mx, y: my };
    hi = (hi + 1) % HIST;

    // Move main cursor (center the 26px image on the hotspot)
    cursor.style.transform =
      'translate(' + (mx - 13) + 'px,' + (my - 13) + 'px)';

    if (visible && !overBee) {
      dots.forEach(function (d, i) {
        // Each dot samples a position 3 frames further back than the last
        var idx = ((hi - (i + 1) * 3) % HIST + HIST) % HIST;
        var p   = hist[idx];
        // Center the 18px trail dot
        d.style.transform =
          'translate(' + (p.x - 9) + 'px,' + (p.y - 9) + 'px)';
        // Opacity fades from ~0.41 to ~0.07
        d.style.opacity =
          ((TRAIL - i) / (TRAIL + 2) * 0.45).toFixed(2);
      });
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}());

// ─────────────────────────────────────────────────────────
// 2. SCROLL REVEAL — Portfolio cards
// ─────────────────────────────────────────────────────────
(function () {
  var cards = document.querySelectorAll('.card');
  if (!cards.length || !('IntersectionObserver' in window)) return;

  // Hide all cards initially (progressive-enhancement safe)
  cards.forEach(function (c) { c.classList.add('scroll-hidden'); });

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;

      var card  = entry.target;
      var delay = parseInt(card.dataset.revealDelay || '0', 10);

      setTimeout(function () {
        card.classList.remove('scroll-hidden');
        card.classList.add('scroll-reveal');

        // After animation ends, remove the class so hover still works
        card.addEventListener('animationend', function () {
          card.classList.remove('scroll-reveal');
        }, { once: true });
      }, delay);

      obs.unobserve(card);
    });
  }, { threshold: 0.08 });

  cards.forEach(function (c, i) {
    c.dataset.revealDelay = i * 75; // 75 ms stagger between cards
    obs.observe(c);
  });
}());

// ─────────────────────────────────────────────────────────
// 3. BEE CLICK COUNTER — secret easter egg at 5 clicks
// ─────────────────────────────────────────────────────────
(function () {
  var bee = document.querySelector('.bee');
  if (!bee) return;

  var count = 0;
  var busy  = false;

  // Emit sparkle particles radiating from the bee's centre
  function sparkle(rect) {
    var cx     = rect.left + rect.width  / 2;
    var cy     = rect.top  + rect.height / 2;
    var glyphs = ['✨', '⭐', '💛', '🌟', '✦', '✧', '·', '★'];

    for (var i = 0; i < 8; i++) {
      (function (n) {
        var el    = document.createElement('span');
        el.className = 'bee-sparkle';
        el.textContent = glyphs[n % glyphs.length];

        var angle = (n / 8) * Math.PI * 2;
        var dist  = 28 + Math.random() * 36;

        el.style.cssText =
          'left:'  + cx + 'px;' +
          'top:'   + cy + 'px;' +
          '--dx:'  + (Math.cos(angle) * dist).toFixed(1) + 'px;' +
          '--dy:'  + (Math.sin(angle) * dist - 18).toFixed(1) + 'px;' +
          'animation-delay:' + (n * 0.04).toFixed(2) + 's';

        document.body.appendChild(el);
        el.addEventListener('animationend', function () { el.remove(); });
      })(i);
    }
  }

  // Show the secret message popup, auto-dismiss after 2.6 s
  function showMessage() {
    var msg = document.createElement('div');
    msg.className = 'bee-secret-msg';
    msg.innerHTML =
      'You found the secret! 🐝✨' +
      '<span>The bee thanks you for the attention~</span>';
    document.body.appendChild(msg);

    setTimeout(function () {
      msg.style.animation = 'bee-msg-out 0.3s ease-in forwards';
      msg.addEventListener('animationend', function () {
        msg.remove();
      }, { once: true });
    }, 2600);
  }

  bee.addEventListener('click', function () {
    if (busy) return;
    busy = true;
    count++;

    var rect = bee.getBoundingClientRect();
    sparkle(rect);

    if (count >= 5) {
      // ── Celebratory mode ──────────────────────────────
      bee.classList.add('bee-celebrate');
      setTimeout(showMessage, 350);

      var celebFallback = setTimeout(function () {
        bee.classList.remove('bee-celebrate');
        busy  = false;
        count = 0;
      }, 1500);

      bee.addEventListener('animationend', function done(e) {
        if (e.animationName !== 'bee-celebrate') return;
        bee.removeEventListener('animationend', done);
        clearTimeout(celebFallback);
        bee.classList.remove('bee-celebrate');
        busy  = false;
        count = 0;
      });

    } else {
      // ── Regular click spin ────────────────────────────
      bee.classList.add('bee-clicked');

      var spinFallback = setTimeout(function () {
        bee.classList.remove('bee-clicked');
        busy = false;
      }, 600);

      bee.addEventListener('animationend', function done(e) {
        if (e.animationName !== 'bee-spin') return;
        bee.removeEventListener('animationend', done);
        clearTimeout(spinFallback);
        bee.classList.remove('bee-clicked');
        busy = false;
      });
    }
  });
}());
