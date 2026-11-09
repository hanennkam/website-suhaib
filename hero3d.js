/* ==========================================================================
   HERO 3D — camera.glb on the shared Stage3D.
   Poster-first, idle-loaded, one transparent WebGL canvas.
   ========================================================================== */
(function () {
  "use strict";

  var hero = document.getElementById("intro");
  var stageEl = document.getElementById("heroStage");
  var canvas = document.getElementById("heroCanvas");
  var poster = document.getElementById("heroPoster");
  var title = document.querySelector(".intro-title");
  if (!hero || !stageEl || !canvas || !poster) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;
  var small = coarse || window.innerWidth < 768 || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  var lowMemory = navigator.deviceMemory && navigator.deviceMemory < 2;
  var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var slowNetwork = connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || ""));
  var state = {
    stage: null,
    ready: false,
    failed: false,
    inView: true,
    entranceStart: 0,
    scroll: 0,
    hoverX: 0,
    hoverY: 0,
    rx: 8 * Math.PI / 180,
    ry: -25 * Math.PI / 180,
    scale: 0.92,
    px: 0,
    py: 0
  };
  var BASE_X = 8 * Math.PI / 180;
  var BASE_Y = -25 * Math.PI / 180;

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function easeOutQuint(t) { return 1 - Math.pow(1 - t, 5); }

  // Text is visible immediately; the reveal is a line-by-line enhancement.
  requestAnimationFrame(function () {
    window.setTimeout(function () {
      if (title) title.classList.add("is-revealed");
    }, 80);
  });

  if (reduced || lowMemory || slowNetwork) {
    stageEl.classList.add("is-poster");
    return;
  }

  function showPoster() {
    state.failed = true;
    stageEl.classList.add("is-poster");
    stageEl.classList.remove("is-ready");
    canvas.style.visibility = "hidden";
    if (state.stage) state.stage.pause();
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function ensureVendor() {
    if (window.THREE && window.THREE.GLTFLoader) return Promise.resolve();
    return loadScript("vendor/three.min.js").then(function () {
      if (!window.THREE) throw new Error("Three.js unavailable");
      return loadScript("vendor/GLTFLoader.min.js");
    }).then(function () {
      if (!window.THREE.GLTFLoader) throw new Error("GLTFLoader unavailable");
    });
  }

  function scheduleIdle(fn) {
    function run() {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(fn, { timeout: 1600 });
      } else {
        window.setTimeout(fn, 1200);
      }
    }
    if (document.readyState === "complete") run();
    else window.addEventListener("load", run, { once: true });
  }

  // On mobile the poster is the hero. Load the heavy 3D bundle on first
  // intent, with a quiet fallback for visitors who never interact.
  function scheduleHero(fn) {
    if (!small) {
      scheduleIdle(fn);
      return;
    }
    var fired = false;
    function cleanup() {
      ["pointerdown", "touchstart", "keydown", "scroll"].forEach(function (name) {
        window.removeEventListener(name, run);
      });
    }
    function run() {
      if (fired) return;
      fired = true;
      cleanup();
      scheduleIdle(fn);
    }
    ["pointerdown", "touchstart", "keydown", "scroll"].forEach(function (name) {
      window.addEventListener(name, run, { once: true, passive: true });
    });
    window.setTimeout(run, 8000);
  }

  function onFrame(frame) {
    var t = frame.time;
    var p = clamp(state.scroll, 0, 1);
    var entrance = 1;
    if (state.entranceStart) {
      var ep = clamp((window.performance.now() - state.entranceStart) / 1200, 0, 1);
      entrance = 0.92 + 0.08 * easeOutQuint(ep);
    }

    var targetRX = BASE_X;
    var targetRY = BASE_Y;
    var targetPX = 0;
    var targetPY = 0;

    if (!small) {
      targetRX += state.hoverY * 8 * Math.PI / 180;
      targetRY += state.hoverX * 8 * Math.PI / 180;
      targetPX = state.hoverX * 0.0665;
      targetPY = -state.hoverY * 0.0665;
    } else {
      // Very quiet floating on touch devices. No parallax.
      targetPY = Math.sin(t * Math.PI * 2 / 6) * 0.028;
    }

    // Scrub out of the hero.
    targetRY += p * 20 * Math.PI / 180;
    targetPY += p * 0.24;

    var follow = 1 - Math.pow(1 - 0.06, Math.max(1, frame.delta * 60));
    state.rx += (targetRX - state.rx) * follow;
    state.ry += (targetRY - state.ry) * follow;
    state.px += (targetPX - state.px) * follow;
    state.py += (targetPY - state.py) * follow;
    state.scale += ((entrance * (1 - 0.15 * p)) - state.scale) * follow;

    stageEl.style.setProperty("--shadow-x", (state.px / 0.0665 * 12).toFixed(2) + "px");
    stageEl.style.setProperty("--shadow-opacity", (1 - p).toFixed(3));

    if (!state.stage) return;
    state.stage.setState("camera", {
      rotation: { x: state.rx, y: state.ry, z: 0 },
      scale: state.scale,
      position: { x: state.px, y: state.py, z: 0 },
      opacity: 1 - p
    });
  }

  function setScroll(value) {
    state.scroll = clamp(value, 0, 1);
    if (!state.stage || state.failed) return;
    if (state.scroll >= 0.995) {
      state.stage.pause();
      canvas.style.visibility = "hidden";
    } else if (state.inView && !document.hidden) {
      canvas.style.visibility = "visible";
      state.stage.setVisibilityPaused(false);
    }
  }

  function bindScroll() {
    if (window.gsap && window.ScrollTrigger) {
      window.gsap.to({ value: 0 }, {
        value: 1,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
          onUpdate: function (self) { setScroll(self.progress); }
        }
      });
      return;
    }
    window.addEventListener("scroll", function () {
      var rect = hero.getBoundingClientRect();
      setScroll((-rect.top) / Math.max(1, rect.height));
    }, { passive: true });
  }

  function bindPointer() {
    if (small) return;
    window.addEventListener("mousemove", function (event) {
      var rect = stageEl.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      state.hoverX = clamp((event.clientX - cx) / (window.innerWidth * 0.5), -1, 1);
      state.hoverY = clamp((event.clientY - cy) / (window.innerHeight * 0.5), -1, 1);
    }, { passive: true });
    window.addEventListener("mouseleave", function () {
      state.hoverX = 0;
      state.hoverY = 0;
    });
  }

  function bindVisibility() {
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        state.inView = entries[0].isIntersecting;
        if (!state.stage || state.failed) return;
        if (state.inView && !document.hidden) {
          canvas.style.visibility = "visible";
          state.stage.setVisibilityPaused(false);
        } else {
          state.stage.pause();
          canvas.style.visibility = "hidden";
        }
      }, { threshold: 0.01 });
      observer.observe(hero);
    }

    document.addEventListener("visibilitychange", function () {
      if (!state.stage || state.failed) return;
      state.stage.setVisibilityPaused(document.hidden || !state.inView);
    });
  }

  function start() {
    if (!window.Stage3D || !window.Stage3D.isSupported()) {
      showPoster();
      return;
    }

    try {
      state.stage = window.Stage3D.init({
        canvas: canvas,
        container: stageEl,
        quality: small ? "mobile" : "desktop",
        onFrame: onFrame,
        onContextLost: showPoster
      });
      state.stage.pause();
      bindScroll();
      bindPointer();
      bindVisibility();

      state.stage.loadModel("camera", "assets/models/camera.glb", { targetSize: 3.65 }).then(function () {
        state.stage.setState("camera", {
          rotation: { x: BASE_X, y: BASE_Y, z: 0 },
          scale: 0.92,
          position: { x: 0, y: 0, z: 0 },
          opacity: 1
        });
        state.stage.renderOnce();
        state.entranceStart = window.performance.now();
        state.ready = true;
        state.failed = false;
        if (state.inView && !document.hidden) {
          stageEl.classList.add("is-ready");
          stageEl.classList.remove("is-poster");
          canvas.style.visibility = "visible";
          state.stage.setVisibilityPaused(false);
        }
      }).catch(function () {
        showPoster();
      });
    } catch (err) {
      showPoster();
    }
  }

  scheduleHero(function () {
    ensureVendor().then(start).catch(showPoster);
  });
})();
