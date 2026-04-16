(function () {
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function initPageScrollProgress() {
    var aboutAnchor = document.querySelector('.personal-hero') || document.querySelector('.experience-timeline[data-enhanced="true"]');
    if (!aboutAnchor) return;
    if (document.querySelector('.page-scroll-progress')) return;

    var host = document.createElement('div');
    host.className = 'page-scroll-progress';
    host.innerHTML = '<span class="page-scroll-progress__bar" aria-hidden="true"></span>';
    document.body.appendChild(host);

    var bar = host.querySelector('.page-scroll-progress__bar');
    var ticking = false;

    function render() {
      var doc = document.documentElement;
      var y = window.scrollY || window.pageYOffset || 0;
      var max = Math.max(doc.scrollHeight - window.innerHeight, 1);
      var ratio = clamp(y / max, 0, 1);
      bar.style.width = (ratio * 100).toFixed(2) + '%';
      host.classList.toggle('is-visible', y > 90 && max > 1);
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(render);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    render();
  }

  function initTiltEffects() {
    if (prefersReducedMotion()) return;
    var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (!finePointer) return;

    var targets = [];
    Array.prototype.push.apply(targets, document.querySelectorAll('.personal-grid .personal-card'));
    Array.prototype.push.apply(targets, document.querySelectorAll('.experience-item'));
    if (!targets.length) return;

    targets.forEach(function (el) {
      var rafId = 0;

      function resetTilt() {
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      }

      el.addEventListener('pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
        var rect = el.getBoundingClientRect();
        var x = clamp(e.clientX - rect.left, 0, rect.width);
        var y = clamp(e.clientY - rect.top, 0, rect.height);
        var intensity = el.classList.contains('experience-item') ? 5 : 6;

        if (rafId) window.cancelAnimationFrame(rafId);
        rafId = window.requestAnimationFrame(function () {
          var rx = (0.5 - y / rect.height) * intensity;
          var ry = (x / rect.width - 0.5) * intensity;
          el.style.setProperty('--mx', x + 'px');
          el.style.setProperty('--my', y + 'px');
          el.style.setProperty('--rx', rx.toFixed(2) + 'deg');
          el.style.setProperty('--ry', ry.toFixed(2) + 'deg');
          el.classList.add('is-tilting');
        });
      });

      el.addEventListener('pointerleave', resetTilt);
      el.addEventListener('blur', resetTilt, true);
    });
  }

  function initTimelineInteractions() {
    var timeline = document.querySelector('.experience-timeline[data-enhanced="true"]');
    if (!timeline) return;

    var items = Array.prototype.slice.call(timeline.querySelectorAll('.experience-item'));
    if (!items.length) return;
    var progress = timeline.querySelector('.experience-timeline__progress');

    function setActiveItem() {
      var targetY = window.innerHeight * 0.45;
      var activeIndex = -1;
      var best = Infinity;
      items.forEach(function (item, idx) {
        var rect = item.getBoundingClientRect();
        var center = rect.top + rect.height / 2;
        var d = Math.abs(center - targetY);
        if (d < best) {
          best = d;
          activeIndex = idx;
        }
      });
      items.forEach(function (item, idx) {
        item.classList.toggle('is-active', idx === activeIndex);
        item.classList.toggle('is-past', activeIndex > idx);
      });
    }

    function updateProgress() {
      if (!progress) return;
      var rect = timeline.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var ratio = (vh * 0.65 - rect.top) / Math.max(rect.height, 1);
      ratio = Math.max(0, Math.min(1, ratio));
      progress.style.height = (ratio * 100).toFixed(2) + '%';
    }

    items.forEach(function (item, idx) {
      item.style.setProperty('--stagger', (idx * 90) + 'ms');
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
      setActiveItem();
      updateProgress();
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (item) {
      observer.observe(item);
    });

    var ticking = false;
    function onViewportChange() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        updateProgress();
        setActiveItem();
        ticking = false;
      });
    }

    items.forEach(function (item) {
      item.addEventListener('focusin', setActiveItem);
      item.addEventListener('mouseenter', setActiveItem);
    });

    window.addEventListener('scroll', onViewportChange, { passive: true });
    window.addEventListener('resize', onViewportChange);

    updateProgress();
    setActiveItem();
  }

  function initSkylineHotspots() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.experience-skyline-link'));
    if (!links.length) return;

    var finePointerQuery = window.matchMedia ? window.matchMedia('(pointer: fine)') : null;
    var anyFinePointerQuery = window.matchMedia ? window.matchMedia('(any-pointer: fine)') : null;
    var coarsePointerQuery = window.matchMedia ? window.matchMedia('(pointer: coarse)') : null;
    var hoverNoneQuery = window.matchMedia ? window.matchMedia('(hover: none)') : null;
    var reduced = prefersReducedMotion();

    var maxDpr = 2;

    function runSkylineDustTransition(link, href, fallbackDelay) {
      var rect = link.getBoundingClientRect();
      var w = Math.max(1, Math.round(rect.width));
      var h = Math.max(1, Math.round(rect.height));
      if (!w || !h) return false;

      // ── Step 1: read the background-image URL BEFORE touching any styles ──
      // (setting backgroundImage='none' later would make getComputedStyle return none)
      var computedStyle = window.getComputedStyle(link);
      var bgValue = computedStyle && computedStyle.backgroundImage ? computedStyle.backgroundImage : '';
      var bgMatch = bgValue.match(/url\((["']?)(.*?)\1\)/i);

      var dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      var canvas = document.createElement('canvas');
      canvas.className = 'skyline-dissolve-canvas';
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      // position:fixed on body so particles are NOT clipped by the link's overflow:hidden
      canvas.style.position = 'fixed';
      canvas.style.left = rect.left.toFixed(2) + 'px';
      canvas.style.top = rect.top.toFixed(2) + 'px';
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';

      var ctx = canvas.getContext('2d');
      if (!ctx) return false;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // ── Step 2: mount canvas on body, then hide the original link ──
      document.body.appendChild(canvas);
      link.classList.add('is-dissolving');
      // Hide the link immediately so the fixed canvas is the sole visual layer
      link.style.backgroundImage = 'none';
      link.style.opacity = '0';

      var settled = false;
      var started = false;
      var particles = [];
      var duration = 920;
      var startAt = 0;
      var snapshot = null;

      function finish() {
        if (settled) return;
        settled = true;
        document.body.classList.remove('is-dust-transitioning');
        link.style.opacity = '';
        link.style.backgroundImage = '';
        if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
        window.location.href = href;
      }

      function buildFallbackParticles() {
        var step = clamp(Math.round(Math.max(w, h) / 46), 4, 6);
        var list = [];
        var palette = [
          [217, 236, 232],
          [179, 214, 207],
          [141, 196, 188],
          [106, 170, 168],
          [70, 119, 146]
        ];
        for (var y = 0; y < h; y += step) {
          for (var x = 0; x < w; x += step) {
            if (Math.random() < 0.18) continue;
            var col = palette[(Math.random() * palette.length) | 0];
            list.push({
              x: x,
              y: y,
              size: step * (0.86 + Math.random() * 0.44),
              r: col[0],
              g: col[1],
              b: col[2],
              alpha: 0.74 + Math.random() * 0.26,
              vx: 0.62 + Math.random() * 1.1,
              vy: (Math.random() - 0.7) * 0.72,
              swirl: (Math.random() - 0.5) * 2.2,
              phase: Math.random() * Math.PI * 2,
              delay: Math.random() * 0.18,
              life: 0.78 + Math.random() * 0.24
            });
          }
        }
        return list;
      }

      function buildImageParticles(img) {
        var iw = img.naturalWidth || img.width || 0;
        var ih = img.naturalHeight || img.height || 0;
        if (!iw || !ih) return [];

        var scale = Math.max(w / iw, h / ih);
        var drawW = iw * scale;
        var drawH = ih * scale;
        var drawX = (w - drawW) * 0.5;
        var drawY = h - drawH;

        var source = document.createElement('canvas');
        source.width = w;
        source.height = h;
        var sctx = source.getContext('2d');
        if (!sctx) return [];
        sctx.drawImage(img, drawX, drawY, drawW, drawH);

        var data = sctx.getImageData(0, 0, w, h).data;
        var step = clamp(Math.round(Math.max(w, h) / 58), 3, 5);
        var list = [];
        var maxParticles = 3600;

        snapshot = source;

        for (var y = 0; y < h; y += step) {
          for (var x = 0; x < w; x += step) {
            var px = Math.min(w - 1, x + (step >> 1));
            var py = Math.min(h - 1, y + (step >> 1));
            var di = (py * w + px) * 4;
            var a = data[di + 3];
            if (a < 26) continue;
            if (list.length > maxParticles && Math.random() < 0.45) continue;

            list.push({
              x: x,
              y: y,
              size: step * (0.72 + Math.random() * 0.56),
              r: data[di],
              g: data[di + 1],
              b: data[di + 2],
              alpha: (a / 255) * (0.84 + Math.random() * 0.22),
              vx: 0.58 + Math.random() * 1.18,
              vy: (Math.random() - 0.7) * 0.74,
              swirl: (Math.random() - 0.5) * 2.4,
              phase: Math.random() * Math.PI * 2,
              delay: Math.random() * 0.2,
              life: 0.76 + Math.random() * 0.26
            });
          }
        }

        return list;
      }

      function startAnimation(nextParticles) {
        if (settled || started) return;
        particles = (nextParticles && nextParticles.length) ? nextParticles : buildFallbackParticles();
        if (!particles.length) {
          finish();
          return;
        }
        started = true;
        startAt = performance.now();
        document.body.classList.add('is-dust-transitioning');
        window.requestAnimationFrame(frame);
      }

      function frame(now) {
        if (settled) return;
        var p = clamp((now - startAt) / duration, 0, 1);
        ctx.clearRect(0, 0, w, h);

        if (snapshot) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - p * 1.02);
          ctx.drawImage(snapshot, 0, 0, w, h);
          ctx.restore();
        }

        for (var i = 0; i < particles.length; i++) {
          var q = particles[i];
          var t = (p - q.delay) / q.life;
          if (t <= 0 || t >= 1) continue;
          var tt = t * t;
          var wind = 1.04 + p * 0.96;
          var dx = q.x + (q.vx * w * t * wind) + (tt * w * 0.2) + Math.sin(q.phase + t * 8.4) * q.swirl;
          var dy = q.y + (q.vy * h * t) - (tt * h * 0.16);
          var a2 = q.alpha * (1 - t);
          var sz = Math.max(1, q.size * (1 - t * 0.35));
          if (a2 <= 0.01 || sz <= 0.4) continue;
          ctx.fillStyle = 'rgba(' + q.r + ',' + q.g + ',' + q.b + ',' + a2.toFixed(3) + ')';
          ctx.fillRect(dx, dy, sz, sz);
        }

        if (p >= 1) {
          finish();
          return;
        }
        window.requestAnimationFrame(frame);
      }

      // ── Step 3: kick off the particle animation ──
      // Use bgMatch captured before we cleared the background-image.
      if (!bgMatch || !bgMatch[2]) {
        snapshot = null;
        startAnimation(buildFallbackParticles());
      } else {
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.decoding = 'async';
        img.onload = function () {
          if (settled || started) return;
          startAnimation(buildImageParticles(img));
        };
        img.onerror = function () {
          if (settled || started) return;
          startAnimation(buildFallbackParticles());
        };
        img.src = bgMatch[2];
        if (img.complete && img.naturalWidth && img.naturalHeight) img.onload();

        window.setTimeout(function () {
          if (!settled && !started) startAnimation(buildFallbackParticles());
        }, 140);
      }

      window.setTimeout(function () {
        if (!settled && !started) startAnimation(buildFallbackParticles());
      }, 240);

      window.setTimeout(function () {
        if (!settled) finish();
      }, Math.max(1600, fallbackDelay + 1300));

      return true;
    }

    function hasFinePointer() {
      return !!(
        (finePointerQuery && finePointerQuery.matches) ||
        (anyFinePointerQuery && anyFinePointerQuery.matches)
      );
    }

    function deviceNeedsTapConfirm() {
      return !!(
        (coarsePointerQuery && coarsePointerQuery.matches) ||
        (hoverNoneQuery && hoverNoneQuery.matches) ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
      );
    }

    links.forEach(function (link) {
      var rafId = 0;
      var armUntil = 0;
      var armTimer = 0;
      var lastPointerType = '';
      var defaultHint = link.getAttribute('data-hint') || 'Click to open replay';
      var armedHint = link.getAttribute('data-hint-armed') || 'Tap again to open replay';
      var cityName = link.getAttribute('data-city') || 'Replay';

      if (!link.getAttribute('data-city')) link.setAttribute('data-city', cityName);
      link.setAttribute('data-hint', defaultHint);

      var overlay = link.querySelector('.experience-skyline-overlay');
      if (!overlay) {
        overlay = document.createElement('span');
        overlay.className = 'experience-skyline-overlay';

        var cityEl = document.createElement('span');
        cityEl.className = 'experience-skyline-overlay__city';

        var hintEl = document.createElement('span');
        hintEl.className = 'experience-skyline-overlay__hint';

        overlay.appendChild(cityEl);
        overlay.appendChild(hintEl);
        link.appendChild(overlay);
      }

      var overlayCity = overlay.querySelector('.experience-skyline-overlay__city');
      var overlayHint = overlay.querySelector('.experience-skyline-overlay__hint');

      function setOverlayHint(text) {
        if (overlayCity) overlayCity.textContent = cityName;
        if (overlayHint) overlayHint.textContent = text;
      }

      setOverlayHint(defaultHint);

      function resetHover() {
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
        link.classList.remove('is-hovering');
        link.style.setProperty('--skyline-rx', '0deg');
        link.style.setProperty('--skyline-ry', '0deg');
        link.style.setProperty('--skyline-scale', '1');
      }

      function clearArm() {
        if (armTimer) {
          window.clearTimeout(armTimer);
          armTimer = 0;
        }
        armUntil = 0;
        link.classList.remove('is-flipped');
        link.classList.remove('is-launching');
        link.setAttribute('data-hint', defaultHint);
        setOverlayHint(defaultHint);
      }

      function resetSkyline() {
        resetHover();
        clearArm();
      }

      function armTapConfirm() {
        clearArm();
        armUntil = Date.now() + 1800;
        link.classList.add('is-flipped');
        link.setAttribute('data-hint', armedHint);
        setOverlayHint(armedHint);
        armTimer = window.setTimeout(function () {
          clearArm();
        }, 1800);
      }

      function interactionNeedsTapConfirm() {
        if (reduced) return false;
        if (lastPointerType === 'touch' || lastPointerType === 'pen') return true;
        if (lastPointerType === 'mouse') return false;
        return deviceNeedsTapConfirm() && !hasFinePointer();
      }

      link.addEventListener('pointerdown', function (e) {
        if (e.pointerType) {
          lastPointerType = e.pointerType;
        } else if (deviceNeedsTapConfirm()) {
          lastPointerType = 'touch';
        }
      });

      if (hasFinePointer()) {
        function onFineEnter(e) {
          if (e && e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
          lastPointerType = 'mouse';
          link.classList.add('is-hovering');
          link.style.setProperty('--skyline-scale', reduced ? '1' : '1.04');
        }

        link.addEventListener('pointerenter', onFineEnter);
        link.addEventListener('mouseenter', onFineEnter);

        if (!reduced) {
          function onFineMove(e) {
            if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
            var rect = link.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            var x = clamp(e.clientX - rect.left, 0, rect.width);
            var y = clamp(e.clientY - rect.top, 0, rect.height);

            if (rafId) window.cancelAnimationFrame(rafId);
            rafId = window.requestAnimationFrame(function () {
              var ry = ((x / rect.width) - 0.5) * 14;
              var rx = (0.5 - (y / rect.height)) * 12;
              link.style.setProperty('--skyline-rx', rx.toFixed(2) + 'deg');
              link.style.setProperty('--skyline-ry', ry.toFixed(2) + 'deg');
              link.style.setProperty('--skyline-scale', '1.04');
              link.classList.add('is-hovering');
            });
          }

          link.addEventListener('pointermove', onFineMove);
          link.addEventListener('mousemove', onFineMove);
        }

        link.addEventListener('pointerleave', resetHover);
        link.addEventListener('mouseleave', resetHover);
      }

      link.addEventListener('blur', resetSkyline, true);
      link.addEventListener('pointercancel', resetSkyline);

      document.addEventListener('pointerdown', function (e) {
        if (e.target === link || link.contains(e.target)) return;
        clearArm();
      });

      link.addEventListener('click', function (e) {
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (link.target === '_blank') return;
        if (link.getAttribute('data-nav-lock') === '1') {
          e.preventDefault();
          return;
        }

        var href = link.getAttribute('href');
        if (!href) return;

        if (interactionNeedsTapConfirm() && e.detail !== 0) {
          if (Date.now() > armUntil) {
            e.preventDefault();
            armTapConfirm();
            return;
          }
          clearArm();
        }

        var supportsSharedTransition = !!(window.CSS && CSS.supports && CSS.supports('view-transition-name: none'));
        var launchDelay = supportsSharedTransition ? 24 : 260;

        e.preventDefault();
        link.setAttribute('data-nav-lock', '1');
        link.classList.add('is-launching');
        document.body.classList.add('is-page-transitioning');

        var startedDust = runSkylineDustTransition(link, href, launchDelay);
        if (!startedDust) {
          window.setTimeout(function () {
            window.location.href = href;
          }, launchDelay);
        }
      });
    });
  }

  function initInternshipReels() {
    var reels = Array.prototype.slice.call(document.querySelectorAll('.internship-reel'));
    if (!reels.length) return;

    var reduced = prefersReducedMotion();

    reels.forEach(function (reel) {
      var slides = Array.prototype.slice.call(reel.querySelectorAll('.internship-reel__slide'));
      if (!slides.length) return;

      var controls = reel.querySelector('.internship-reel__controls');
      var dotsHost = controls ? controls.querySelector('.internship-reel__dots') : null;
      var prevBtn = controls ? controls.querySelector('[data-action="prev"]') : null;
      var nextBtn = controls ? controls.querySelector('[data-action="next"]') : null;

      var index = 0;
      var timer = 0;
      var interval = parseInt(reel.getAttribute('data-interval') || '2400', 10);
      if (!interval || interval < 1200) interval = 2400;

      var dots = [];
      if (dotsHost) {
        slides.forEach(function (_, i) {
          var dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'internship-reel__dot' + (i === 0 ? ' is-active' : '');
          dot.setAttribute('aria-label', 'Go to photo ' + (i + 1));
          dot.addEventListener('click', function () {
            activate(i);
            restartAutoplay();
          });
          dotsHost.appendChild(dot);
          dots.push(dot);
        });
      }

      function activate(nextIdx) {
        index = (nextIdx + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
          slide.classList.toggle('is-active', i === index);
        });
        dots.forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === index);
        });
      }

      function step(delta) {
        activate(index + delta);
      }

      function stopAutoplay() {
        if (!timer) return;
        window.clearInterval(timer);
        timer = 0;
      }

      function startAutoplay() {
        if (reduced || slides.length < 2) return;
        stopAutoplay();
        timer = window.setInterval(function () {
          step(1);
        }, interval);
      }

      function restartAutoplay() {
        startAutoplay();
      }

      if (prevBtn) prevBtn.addEventListener('click', function () { step(-1); restartAutoplay(); });
      if (nextBtn) nextBtn.addEventListener('click', function () { step(1); restartAutoplay(); });

      reel.addEventListener('mouseenter', stopAutoplay);
      reel.addEventListener('mouseleave', startAutoplay);
      reel.addEventListener('focusin', stopAutoplay);
      reel.addEventListener('focusout', startAutoplay);

      startAutoplay();
    });
  }

  function initInternshipLayeredGallery() {
    var galleries = Array.prototype.slice.call(document.querySelectorAll('.internship-gallery'));
    if (!galleries.length) return;
    if (prefersReducedMotion()) return;

    var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if (!finePointer) return;

    galleries.forEach(function (gallery) {
      var items = Array.prototype.slice.call(gallery.querySelectorAll('.internship-gallery__item'));
      if (!items.length) return;
      if (gallery.classList.contains('internship-gallery--scalable')) return;

      var depths = items.map(function (item, idx) {
        var val = parseFloat(window.getComputedStyle(item).getPropertyValue('--depth'));
        if (Number.isFinite(val) && val > 0) return val;
        return Math.max(0.5, 1.4 - idx * 0.25);
      });

      var rafId = 0;
      var targetX = 0;
      var targetY = 0;
      var currentX = 0;
      var currentY = 0;

      function render() {
        rafId = 0;
        currentX += (targetX - currentX) * 0.16;
        currentY += (targetY - currentY) * 0.16;

        gallery.style.setProperty('--bgx', (currentX * 0.55).toFixed(2) + 'px');
        gallery.style.setProperty('--bgy', (currentY * 0.55).toFixed(2) + 'px');

        items.forEach(function (item, idx) {
          var depth = depths[idx];
          item.style.setProperty('--gx', (currentX * depth).toFixed(2) + 'px');
          item.style.setProperty('--gy', (currentY * depth).toFixed(2) + 'px');
        });

        if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
          rafId = window.requestAnimationFrame(render);
        }
      }

      function scheduleRender() {
        if (!rafId) rafId = window.requestAnimationFrame(render);
      }

      function resetParallax() {
        targetX = 0;
        targetY = 0;
        scheduleRender();
      }

      gallery.addEventListener('pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
        var rect = gallery.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        var x = clamp(e.clientX - rect.left, 0, rect.width);
        var y = clamp(e.clientY - rect.top, 0, rect.height);
        var nx = x / rect.width - 0.5;
        var ny = y / rect.height - 0.5;

        targetX = -nx * 28;
        targetY = -ny * 20;
        scheduleRender();
      });

      gallery.addEventListener('pointerleave', resetParallax);
      gallery.addEventListener('mouseleave', resetParallax);
      gallery.addEventListener('blur', resetParallax, true);
    });
  }

  function initInternshipGalleryDragFocus() {
    var galleries = Array.prototype.slice.call(document.querySelectorAll('.internship-gallery--scalable'));
    if (!galleries.length) return;
    if (prefersReducedMotion()) return;

    var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    var largeViewport = window.matchMedia && window.matchMedia('(min-width: 981px)').matches;
    if (!finePointer || !largeViewport) return;

    galleries.forEach(function (gallery) {
      var items = Array.prototype.slice.call(gallery.querySelectorAll('.internship-gallery__item'));
      if (!items.length) return;

      var pointerId = -1;
      var dragging = false;
      var moved = false;
      var startX = 0;
      var startY = 0;
      var activeItem = null;

      function resetItems() {
        items.forEach(function (item) {
          item.style.removeProperty('--item-basis');
          item.classList.remove('is-drag-target');
        });
      }

      function applyFromPoint(clientX, clientY) {
        var maxDist = Math.max(gallery.clientWidth, gallery.clientHeight) * 0.9;
        var target = null;
        var minDist = Infinity;

        items.forEach(function (item) {
          var rect = item.getBoundingClientRect();
          var cx = rect.left + rect.width / 2;
          var cy = rect.top + rect.height / 2;
          var d = Math.hypot(clientX - cx, clientY - cy);
          if (d < minDist) {
            minDist = d;
            target = item;
          }
        });

        items.forEach(function (item) {
          var rect = item.getBoundingClientRect();
          var cx = rect.left + rect.width / 2;
          var cy = rect.top + rect.height / 2;
          var d = Math.hypot(clientX - cx, clientY - cy);
          var norm = clamp(d / Math.max(maxDist, 1), 0, 1);
          var basis = 26 + norm * 7;
          if (item === target) {
            basis = 52;
          }
          item.style.setProperty('--item-basis', basis.toFixed(2) + '%');
          item.classList.toggle('is-drag-target', item === target);
        });

        activeItem = target;
      }

      function finishDrag() {
        if (!dragging) return;

        if (moved && activeItem) {
          var img = activeItem.querySelector('img');
          if (img) {
            img.dataset.suppressLightbox = '1';
            window.setTimeout(function () {
              if (img.dataset.suppressLightbox === '1') {
                delete img.dataset.suppressLightbox;
              }
            }, 240);
          }
        }

        dragging = false;
        moved = false;
        pointerId = -1;
        activeItem = null;
        gallery.classList.remove('is-drag-focusing');
        resetItems();
      }

      gallery.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        if (e.pointerType && e.pointerType !== 'mouse') return;
        var item = e.target.closest('.internship-gallery__item');
        if (!item || !gallery.contains(item)) return;

        dragging = true;
        moved = false;
        pointerId = e.pointerId;
        startX = e.clientX;
        startY = e.clientY;
        gallery.classList.add('is-drag-focusing');
        applyFromPoint(e.clientX, e.clientY);

        if (gallery.setPointerCapture) {
          try {
            gallery.setPointerCapture(pointerId);
          } catch (_) {
            /* no-op */
          }
        }

        e.preventDefault();
      });

      gallery.addEventListener('pointermove', function (e) {
        if (!dragging || e.pointerId !== pointerId) return;
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        if (!moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
          moved = true;
        }
        applyFromPoint(e.clientX, e.clientY);
        e.preventDefault();
      });

      gallery.addEventListener('pointerup', function (e) {
        if (e.pointerId !== pointerId) return;
        finishDrag();
      });

      gallery.addEventListener('pointercancel', function (e) {
        if (e.pointerId !== pointerId) return;
        finishDrag();
      });

      gallery.addEventListener('lostpointercapture', finishDrag);
      window.addEventListener('blur', finishDrag);

      resetItems();
    });
  }

  function initInternshipImageLightbox() {
    var images = Array.prototype.slice.call(document.querySelectorAll('.internship-gallery .internship-gallery__item img'));
    if (!images.length) return;

    var lightbox = document.querySelector('.internship-lightbox');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.className = 'internship-lightbox';
      lightbox.setAttribute('aria-hidden', 'true');
      lightbox.innerHTML = '<button type="button" class="internship-lightbox__close" aria-label="Close image preview">x</button><img class="internship-lightbox__image" alt="">';
      document.body.appendChild(lightbox);
    }

    var lightboxImage = lightbox.querySelector('.internship-lightbox__image');
    var closeBtn = lightbox.querySelector('.internship-lightbox__close');
    var lastTrigger = null;

    function openLightbox(img) {
      var src = img.currentSrc || img.getAttribute('src');
      if (!src) return;
      lightboxImage.setAttribute('src', src);
      lightboxImage.setAttribute('alt', img.getAttribute('alt') || 'Internship photo');
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-lightbox-open');
      lastTrigger = img;
    }

    function closeLightbox() {
      if (!lightbox.classList.contains('is-open')) return;
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-lightbox-open');
      lightboxImage.removeAttribute('src');
      if (lastTrigger && typeof lastTrigger.focus === 'function') {
        lastTrigger.focus();
      }
      lastTrigger = null;
    }

    images.forEach(function (img) {
      img.setAttribute('tabindex', '0');
      img.addEventListener('click', function (e) {
        if (img.dataset.suppressLightbox === '1') {
          e.preventDefault();
          delete img.dataset.suppressLightbox;
          return;
        }
        e.preventDefault();
        openLightbox(img);
      });
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(img);
        }
      });
    });

    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeLightbox);
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  function initInternshipRailBackLinks() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.internship-page__rail-link[data-back-link]'));
    if (!links.length) return;

    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        var ref = document.referrer;
        if (!ref || window.history.length < 2) return;

        var sameOrigin = false;
        try {
          sameOrigin = new URL(ref, window.location.href).origin === window.location.origin;
        } catch (_) {
          sameOrigin = false;
        }

        if (!sameOrigin) return;

        e.preventDefault();
        window.history.back();
      });
    });
  }

  function markInternshipPageWrap() {
    if (!document.querySelector('.internship-page')) return;
    var wrap = document.querySelector('.page__inner-wrap');
    if (wrap) wrap.classList.add('is-internship-page');
  }

  function initMastheadNavHighlight() {
    var nav = document.querySelector('#site-nav .visible-links');
    if (!nav) return;

    var links = Array.prototype.slice.call(nav.querySelectorAll('a[data-nav-link]'));
    if (!links.length) return;

    function normalizePath(pathname) {
      var p = pathname || '/';
      if (p.charAt(0) !== '/') p = '/' + p;
      p = p.replace(/\/index\.html$/i, '/');
      if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
      return p || '/';
    }

    function resolvePathFromLink(link) {
      var href = link.getAttribute('href') || '';
      if (!href) return '/';
      try {
        return normalizePath(new URL(href, window.location.origin).pathname);
      } catch (_) {
        return '/';
      }
    }

    var currentPath = normalizePath(window.location.pathname);
    var currentLink = null;

    links.forEach(function (link) {
      var targetPath = resolvePathFromLink(link);
      var isCurrent = targetPath === '/'
        ? currentPath === '/'
        : (currentPath === targetPath || currentPath.indexOf(targetPath + '/') === 0);
      link.classList.toggle('is-current', isCurrent);
      if (isCurrent && !currentLink) currentLink = link;
    });

    if (!currentLink) {
      currentLink = links[0];
      currentLink.classList.add('is-current');
    }

    var indicator = nav.querySelector('.masthead-nav-indicator');
    if (!indicator) {
      indicator = document.createElement('span');
      indicator.className = 'masthead-nav-indicator';
      indicator.setAttribute('aria-hidden', 'true');
      nav.appendChild(indicator);
    }

    function moveIndicator(target) {
      if (!target || !target.getBoundingClientRect) {
        indicator.classList.remove('is-visible');
        return;
      }
      var navRect = nav.getBoundingClientRect();
      var linkRect = target.getBoundingClientRect();
      if (!linkRect.width || !navRect.width) {
        indicator.classList.remove('is-visible');
        return;
      }

      var inset = Math.min(12, linkRect.width * 0.2);
      var left = linkRect.left - navRect.left + inset;
      var width = Math.max(20, linkRect.width - inset * 2);
      indicator.style.left = left.toFixed(2) + 'px';
      indicator.style.width = width.toFixed(2) + 'px';
      indicator.classList.add('is-visible');
    }

    links.forEach(function (link) {
      link.addEventListener('mouseenter', function () {
        moveIndicator(link);
      });
      link.addEventListener('focus', function () {
        moveIndicator(link);
      });
    });

    nav.addEventListener('mouseleave', function () {
      moveIndicator(currentLink);
    });

    window.addEventListener('resize', function () {
      moveIndicator(currentLink);
    });

    moveIndicator(currentLink);
    nav.classList.add('has-nav-indicator');
  }

  function initEnhancedInteractions() {
    initPageScrollProgress();
    initMastheadNavHighlight();
    markInternshipPageWrap();
    initTiltEffects();
    initTimelineInteractions();
    initSkylineHotspots();
    initInternshipReels();
    initInternshipLayeredGallery();
    initInternshipGalleryDragFocus();
    initInternshipImageLightbox();
    initInternshipRailBackLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancedInteractions);
  } else {
    initEnhancedInteractions();
  }
})();
