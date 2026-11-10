/* ==========================================================================
   PINNED 3D — Phase D
   One sticky stage, three product reveals, one shared WebGL canvas.

   The hero owns the Stage3D renderer. This module borrows the same canvas
   while the Objects section is near the viewport, then hands it back.
   ========================================================================== */
(function () {
  "use strict";

  var section = document.getElementById("pinned");
  if (!section) return;

  var stageEl = document.getElementById("pinnedStage");
  var mount = document.getElementById("pinnedCanvasMount");
  var visual = document.getElementById("pinnedVisual");
  var fallback = document.getElementById("pinnedFallback");
  var copies = Array.prototype.slice.call(section.querySelectorAll(".pinned-copy-item"));
  var dots = Array.prototype.slice.call(section.querySelectorAll(".pinned-progress i"));
  var cards = Array.prototype.slice.call(section.querySelectorAll(".pinned-card"));
  if (!stageEl || !mount || !visual || !fallback || !copies.length) return;

  var RAD = Math.PI / 180;
  var BASE_Z = 5.8;
  var FALLBACKS = [
    {
      src: "assets/models/photobooth.jpg",
      alt: "Studio render of the Sejenak Photobooth kiosk."
    },
    {
      src: "assets/models/jersey.jpg",
      alt: "Studio render of the BVRCODE sublimated jersey."
    },
    {
      src: "assets/models/camera.jpg",
      alt: "Studio render of a mirrorless camera with a 35 mm prime lens."
    }
  ];

  var reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var desktopQuery = window.matchMedia("(min-width: 1024px) and (pointer: fine)");

  var mode = "pending";
  var stage = null;
  var heroReady = false;
  var pinnedOwns = false;
  var handoff = false;
  var pinST = null;
  var target = 0;
  var progress = 0;
  var currentStage = -1;
  var fallbackIndex = -1;
  var visual3D = false;
  var loaded = [false, false, false];
  var loading = [false, false, false];
  var failed = [false, false, false];
  var cameraZ = BASE_Z;
  var webglChecked = false;
  var webglOk = true;
  var fallbacksPreloaded = false;
  var revealBound = false;
  var resizeTimer = 0;
  var drag = {
    active: false,
    id: null,
    startX: 0,
    startOffset: 0,
    offset: 0
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function range(value, start, end) {
    return clamp((value - start) / (end - start), 0, 1);
  }

  function webglAvailable() {
    if (webglChecked) return webglOk;
    webglChecked = true;
    try {
      var test = document.createElement("canvas");
      var gl = test.getContext("webgl") || test.getContext("experimental-webgl");
      webglOk = !!gl;
      if (gl) {
        var lose = gl.getExtension("WEBGL_lose_context");
        if (lose) lose.loseContext();
      }
    } catch (err) {
      webglOk = false;
    }
    return webglOk;
  }

  function isStaticMode() {
    if (reducedQuery.matches) return true;
    if (!desktopQuery.matches) return true;
    if (navigator.deviceMemory && navigator.deviceMemory < 4) return true;
    if (!("IntersectionObserver" in window)) return true;
    if (!window.gsap || !window.ScrollTrigger) return true;
    return !webglAvailable();
  }

  function stageIndexFor(value) {
    if (value < 0.36) return 0;
    if (value < 0.675) return 1;
    return 2;
  }

  function preloadFallbacks() {
    if (fallbacksPreloaded) return;
    fallbacksPreloaded = true;
    FALLBACKS.forEach(function (item) {
      var image = new Image();
      image.decoding = "async";
      image.src = item.src;
    });
  }

  function setFallback(index, force) {
    if (index < 0 || index > 2) return;
    if (!force && index === fallbackIndex) return;
    fallbackIndex = index;
    var item = FALLBACKS[index];
    fallback.src = item.src;
    fallback.alt = item.alt;
  }

  function canShow3D() {
    if (!pinnedOwns || !stage || currentStage < 0) return false;
    if (failed[currentStage] || !loaded[currentStage]) return false;
    if (currentStage === 0 && progress < 0.045) return false;
    return true;
  }

  function syncVisual() {
    var on = canShow3D();
    if (on === visual3D) return;
    visual3D = on;
    visual.classList.toggle("is-3d", on);
    mount.classList.toggle("is-ready", on);
    fallback.classList.toggle("is-visible", !on);
  }

  function setCopy(index) {
    if (index === currentStage) return;
    currentStage = index;

    copies.forEach(function (item, idx) {
      var active = idx === index;
      item.classList.toggle("is-active", active);
      if (active) {
        item.removeAttribute("aria-hidden");
        if ("inert" in item) item.inert = false;
        else item.removeAttribute("inert");
      } else {
        item.setAttribute("aria-hidden", "true");
        if ("inert" in item) item.inert = true;
        else item.setAttribute("inert", "");
      }
      Array.prototype.forEach.call(item.querySelectorAll("a"), function (link) {
        link.tabIndex = active ? 0 : -1;
      });
    });

    dots.forEach(function (dot, idx) {
      dot.classList.toggle("is-active", idx === index);
    });
    setFallback(index);
    syncVisual();
  }

  function setCameraZoom(zoom) {
    if (!stage || typeof stage.setCameraZ !== "function") return;
    var next = BASE_Z / zoom;
    if (Math.abs(next - cameraZ) < 0.001) return;
    cameraZ = next;
    stage.setCameraZ(next);
  }

  function applyStage(value) {
    var p = clamp(value, 0, 1);
    var index = stageIndexFor(p);
    if (index !== currentStage) setCopy(index);

    if (!stage) {
      syncVisual();
      return;
    }

    var wideFit = window.innerWidth >= 1280
      ? 1
      : 0.82 + 0.18 * clamp((window.innerWidth - 1024) / 256, 0, 1);

    var kioskIn = range(p, 0.0, 0.055);
    var kioskOut = range(p, 0.315, 0.35);
    var kioskTurn = range(p, 0.0, 0.36);
    var kioskOpacity = Math.min(kioskIn, 1 - kioskOut);
    var kioskScale = 0.9 + 0.1 * kioskIn - 0.08 * kioskOut;
    var kioskY = (-35 + 50 * kioskTurn + 5 * kioskOut) * RAD + drag.offset;

    var jerseyIn = range(p, 0.335, 0.37);
    var jerseyOut = range(p, 0.64, 0.685);
    var jerseyTurn = range(p, 0.31, 0.67);
    var jerseyOpacity = Math.min(jerseyIn, 1 - jerseyOut);
    var jerseyScale = (0.92 + 0.08 * jerseyIn - 0.05 * jerseyOut) * wideFit;
    var jerseyY = (30 - 50 * jerseyTurn - 8 * jerseyOut) * RAD + drag.offset;
    var jerseyX = 6 * jerseyTurn * RAD;

    var cameraIn = range(p, 0.665, 0.7);
    var cameraTurn = range(p, 0.7, 0.87);
    var cameraOpacity = cameraIn;
    var cameraScale = (0.84 + 0.04 * cameraIn) * wideFit;
    var cameraY = (-25 + 35 * cameraTurn) * RAD + drag.offset;

    stage.setState("photobooth", {
      rotation: { x: 0, y: kioskY, z: 0 },
      scale: kioskScale,
      position: { x: 0, y: 0, z: 0 },
      opacity: kioskOpacity
    });
    stage.setState("jersey", {
      rotation: { x: jerseyX, y: jerseyY, z: 0 },
      scale: jerseyScale,
      position: { x: 0, y: 0, z: 0 },
      opacity: jerseyOpacity
    });
    stage.setState("camera", {
      rotation: { x: 8 * RAD, y: cameraY, z: 0 },
      scale: cameraScale,
      position: { x: 0, y: 0, z: 0 },
      opacity: cameraOpacity
    });

    var total = kioskOpacity + jerseyOpacity + cameraOpacity;
    var zoom = 1;
    if (total > 0.001) {
      zoom = (
        (1 + 0.08 * kioskTurn) * kioskOpacity +
        (1 + 0.10 * jerseyTurn) * jerseyOpacity +
        (1 + 0.06 * cameraTurn) * cameraOpacity
      ) / total;
    }
    setCameraZoom(zoom);

    syncVisual();
  }

  function syncFromProgress(value) {
    progress = clamp(value, 0, 1);
    var index = stageIndexFor(progress);
    if (index !== currentStage) setCopy(index);
    syncVisual();
    if (progress > 0.16) ensureJersey();
    if (progress > 0.58) ensureCamera();
  }

  function onFrame(frame) {
    var delta = Math.max(0.001, Math.min(0.05, frame.delta || 0.016));
    var follow = 1 - Math.exp(-delta / 0.22);
    progress += (target - progress) * follow;
    if (Math.abs(target - progress) < 0.0001) progress = target;

    if (!drag.active) {
      var returnFollow = 1 - Math.exp(-delta / 0.3);
      drag.offset += (0 - drag.offset) * returnFollow;
      if (Math.abs(drag.offset) < 0.0004) drag.offset = 0;
    }

    applyStage(progress);
    if (progress > 0.16) ensureJersey();
    if (progress > 0.58) ensureCamera();
  }

  function onModelReady() {
    if (!pinnedOwns || !stage) return;
    applyStage(progress);
    stage.renderOnce();
  }

  function ensureModel(index, id, url, targetSize) {
    if (!stage || loaded[index] || loading[index] || failed[index]) return;
    loading[index] = true;
    stage.loadModel(id, url, { targetSize: targetSize }).then(function () {
      loaded[index] = true;
      loading[index] = false;
      onModelReady();
    }).catch(function () {
      loading[index] = false;
      failed[index] = true;
      syncVisual();
    });
  }

  function ensureKiosk() {
    ensureModel(0, "photobooth", "assets/models/photobooth.glb", 2.9);
  }

  function ensureJersey() {
    ensureModel(1, "jersey", "assets/models/jersey.glb", 2.8);
  }

  function ensureCamera() {
    ensureModel(2, "camera", "assets/models/camera.glb", 3.65);
  }

  function takePinned() {
    if (mode !== "dynamic" || pinnedOwns || !heroReady || !stage) return;
    if (typeof stage.isInitialized === "function" && !stage.isInitialized()) return;

    var canvas = window.Hero3D ? window.Hero3D.getCanvas() : null;
    if (!canvas) return;

    pinnedOwns = true;
    document.documentElement.dataset.stageOwner = "pinned";

    if (canvas.parentNode !== mount) mount.appendChild(canvas);
    stage.setContainer(mount);
    stage.setFrameCallback(onFrame);

    stage.setState("photobooth", { opacity: 0 });
    stage.setState("jersey", { opacity: 0 });
    stage.setState("camera", { opacity: 0 });

    canvas.style.visibility = "visible";
    var bounds = stageEl.getBoundingClientRect();
    var onScreen = bounds.top < window.innerHeight && bounds.bottom > 0;
    if (onScreen) stage.setVisibilityPaused(false);
    else stage.pause();

    target = pinST ? clamp(pinST.progress, 0, 1) : 0;
    progress = target;
    applyStage(progress);
    stage.renderOnce();
  }

  function releasePinned() {
    if (!pinnedOwns) return;
    pinnedOwns = false;
    document.documentElement.dataset.stageOwner = "hero";

    var heroCanvas = window.Hero3D ? window.Hero3D.getCanvas() : null;
    var heroStage = window.Hero3D ? window.Hero3D.getStageEl() : null;

    if (stage) {
      stage.setState("photobooth", { opacity: 0 });
      stage.setState("jersey", { opacity: 0 });
      stage.setState("camera", { opacity: 0 });
      setCameraZoom(1);
      stage.setFrameCallback(window.Hero3D ? window.Hero3D.onFrame : null);
    }

    if (heroCanvas && heroStage && heroCanvas.parentNode !== heroStage) {
      heroStage.appendChild(heroCanvas);
    }
    if (stage && heroStage) stage.setContainer(heroStage);

    mount.classList.remove("is-ready");
    visual.classList.remove("is-3d");
    fallback.classList.add("is-visible");
    visual3D = false;

    var ready = !!(window.Hero3D && window.Hero3D.isReady());
    var heroVisible = !!(window.Hero3D && window.Hero3D.isInView());
    var heroScroll = window.Hero3D ? window.Hero3D.getScroll() : 1;
    var show = ready && heroVisible && heroScroll < 0.995 && !document.hidden;

    if (heroCanvas) heroCanvas.style.visibility = show ? "visible" : "hidden";
    if (stage) {
      stage.setVisibilityPaused(!show);
      stage.renderOnce();
    }
  }

  function setupPin() {
    if (pinST || !stageEl || !window.gsap || !window.ScrollTrigger) return;
    window.gsap.registerPlugin(window.ScrollTrigger);

    pinST = window.ScrollTrigger.create({
      trigger: stageEl,
      start: "top top",
      end: function () { return "+=" + Math.round(window.innerHeight * 3); },
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        target = clamp(self.progress, 0, 1);
        if (!pinnedOwns || !stage || !stage.isRunning()) syncFromProgress(target);
        else if (target > 0.16) ensureJersey();
      },
      onRefresh: function (self) {
        target = clamp(self.progress, 0, 1);
        if (!pinnedOwns) syncFromProgress(target);
      }
    });

    target = clamp(pinST.progress || 0, 0, 1);
    syncFromProgress(target);
  }

  function teardownPin() {
    if (pinST) {
      try { pinST.kill(true); } catch (err) {
        try { pinST.kill(); } catch (err2) { /* already gone */ }
      }
      pinST = null;
    }
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }

  function setupReveals() {
    if (!cards.length) return;
    if (revealBound) {
      cards.forEach(function (card) { card.classList.add("is-visible"); });
      return;
    }
    revealBound = true;
    if (!("IntersectionObserver" in window)) {
      cards.forEach(function (card) { card.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    cards.forEach(function (card) { observer.observe(card); });

    window.setTimeout(function () {
      cards.forEach(function (card) { card.classList.add("is-visible"); });
    }, 2600);
  }

  function setStatic() {
    if (mode === "static") return;
    mode = "static";
    section.classList.add("is-static");
    section.classList.remove("is-dynamic");
    teardownPin();
    releasePinned();
    setupReveals();
    syncVisual();
  }

  function setDynamic() {
    if (mode === "dynamic") return;
    mode = "dynamic";
    section.classList.remove("is-static");
    section.classList.add("is-dynamic");
    setupPin();
    preloadFallbacks();
    if (handoff) {
      ensureKiosk();
      takePinned();
    }
  }

  function evaluateMode() {
    if (isStaticMode()) setStatic();
    else setDynamic();
  }

  function onHeroReady() {
    if (heroReady) return;
    heroReady = true;
    stage = window.Stage3D;
    loaded[2] = true;
    ensureCamera();
    if (mode === "dynamic" && handoff) {
      ensureKiosk();
      takePinned();
    }
  }

  function onHeroFailed() {
    if (mode !== "static") setStatic();
  }

  function bindDrag() {
    var canvas = window.Hero3D ? window.Hero3D.getCanvas() : null;
    if (!canvas || canvas.__pinnedDrag) return;
    canvas.__pinnedDrag = true;

    canvas.addEventListener("pointerdown", function (event) {
      if (!pinnedOwns || !canShow3D()) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      drag.active = true;
      drag.id = event.pointerId;
      drag.startX = event.clientX;
      drag.startOffset = drag.offset;
      try { canvas.setPointerCapture(event.pointerId); } catch (err) { /* noop */ }
    }, { passive: true });

    canvas.addEventListener("pointermove", function (event) {
      if (!drag.active || event.pointerId !== drag.id) return;
      var dx = event.clientX - drag.startX;
      drag.offset = clamp(drag.startOffset + dx * 0.0026, -45 * RAD, 45 * RAD);
    }, { passive: true });

    function endDrag(event) {
      if (!drag.active) return;
      if (event && event.pointerId !== undefined && event.pointerId !== drag.id) return;
      drag.active = false;
      drag.id = null;
      try { canvas.releasePointerCapture(event.pointerId); } catch (err) { /* noop */ }
    }

    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    canvas.addEventListener("pointerleave", function (event) {
      if (event.pointerType === "mouse") endDrag(event);
    });
  }

  function bindObservers() {
    if (!("IntersectionObserver" in window)) return;

    var handoffObserver = new IntersectionObserver(function (entries) {
      var next = entries[0].isIntersecting;
      if (next === handoff) return;
      handoff = next;
      if (handoff) {
        preloadFallbacks();
        if (mode === "dynamic") {
          ensureKiosk();
          takePinned();
        }
      } else {
        releasePinned();
      }
    }, { rootMargin: "100% 0px 100% 0px", threshold: 0 });
    handoffObserver.observe(section);

    var viewObserver = new IntersectionObserver(function (entries) {
      var visible = entries[0].isIntersecting;
      if (!pinnedOwns || !stage) return;
      var canvas = window.Hero3D ? window.Hero3D.getCanvas() : null;
      if (visible) {
        progress = target;
        if (canvas) canvas.style.visibility = "visible";
        stage.setVisibilityPaused(false);
        stage.renderOnce();
      } else {
        stage.pause();
      }
    }, { threshold: 0.01 });
    viewObserver.observe(stageEl);
  }

  function init() {
    section.classList.add("is-reveal-ready");
    setFallback(0, true);
    bindDrag();
    bindObservers();

    document.addEventListener("hero3d:ready", onHeroReady);
    document.addEventListener("hero3d:failed", onHeroFailed);
    if (window.Hero3D && window.Hero3D.isReady()) onHeroReady();

    evaluateMode();

    if (reducedQuery.addEventListener) reducedQuery.addEventListener("change", evaluateMode);
    if (desktopQuery.addEventListener) desktopQuery.addEventListener("change", evaluateMode);

    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(evaluateMode, 180);
    }, { passive: true });

    window.addEventListener("orientationchange", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(evaluateMode, 220);
    }, { passive: true });
  }

  init();
})();
