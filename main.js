/* ==========================================================================
   AHMAD SUHAIB — THE SIGNAL ARCHIVE
   Experience engine: intro monolith, universe map, horizontal work film,
   venture worlds and progressive enhancements.
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = window.matchMedia("(hover: none)").matches;
  var root = document.documentElement;
  var body = document.body;
  var hasGSAP = typeof window.gsap !== "undefined";
  var hasST = typeof window.ScrollTrigger !== "undefined";
  var hasThree = typeof window.THREE !== "undefined";
  var lenis = null;
  var activeProject = 0;
  var workScrollTrigger = null;
  var workPanels = [];
  var projectCount = 0;
  var setProjectUIFn = null;
  var mobileWorkHandler = null;

  if (reduced) root.classList.add("reduced-motion");
  if (hasGSAP && hasST) window.gsap.registerPlugin(window.ScrollTrigger);

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function isDesktopWork() { return window.innerWidth > 1100 && !reduced; }
  function scrollToY(y, duration) {
    if (lenis && !reduced) {
      lenis.scrollTo(y, { duration: duration || 1.35 });
    } else {
      window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    }
  }
  function scrollToEl(el, offset) {
    if (!el) return;
    var y = el.getBoundingClientRect().top + window.pageYOffset - (offset || 0);
    scrollToY(y);
  }
  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(null, args); }, ms);
    };
  }

  /* =======================================================================
     SMOOTH SCROLL
     ======================================================================= */
  if (!reduced && typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 0.95
    });
    if (hasGSAP && hasST) {
      lenis.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* =======================================================================
     CURSOR
     ======================================================================= */
  var cursor = $("#cursor");
  var cursorLabel = $("#cursorLabel");
  if (cursor && !touch) {
    var dotEl = $(".cursor-dot", cursor);
    var ringEl = $(".cursor-ring", cursor);
    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;
    var cursorVisible = false;

    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      if (!cursorVisible) {
        cursorVisible = true;
        cursor.style.opacity = "1";
      }
      if (dotEl) dotEl.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
    }, { passive: true });

    window.addEventListener("mouseleave", function () {
      cursorVisible = false;
      cursor.style.opacity = "0";
    });

    (function cursorLoop() {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      if (ringEl) ringEl.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(cursorLoop);
    })();

    document.addEventListener("pointerover", function (e) {
      var target = e.target.closest ? e.target.closest("[data-cursor]") : null;
      if (target) {
        body.classList.add("cursor-hover");
        if (cursorLabel) cursorLabel.textContent = target.getAttribute("data-cursor") || "";
      }
    });
    document.addEventListener("pointerout", function (e) {
      var target = e.target.closest ? e.target.closest("[data-cursor]") : null;
      if (target && (!e.relatedTarget || !target.contains(e.relatedTarget))) {
        body.classList.remove("cursor-hover");
      }
    });
  }

  /* =======================================================================
     BOOT SEQUENCE
     ======================================================================= */
  var boot = $("#boot");
  var bootCount = $("#bootCount");
  var bootBar = $("#bootBar");
  var bootStatus = $("#bootStatus");
  var bootSkip = $("#bootSkip");
  var bootFinished = false;
  var bootStart = 0;
  var bootDuration = reduced ? 120 : 1650;
  var bootMessages = ["CALIBRATING SIGNAL", "MAPPING DOMAINS", "ASSEMBLING ARCHIVE", "SIGNAL ACQUIRED"];

  function finishBoot(skip) {
    if (bootFinished) return;
    bootFinished = true;
    if (boot) boot.classList.add("is-done");
    body.classList.remove("is-booting");
    if (bootCount) bootCount.textContent = "100";
    if (bootBar) bootBar.style.width = "100%";
    runIntroReveal(!skip);
    setTimeout(syncTone, 120);
    setTimeout(syncTone, 1250);
    if (hasST) setTimeout(function () { window.ScrollTrigger.refresh(); }, 300);
  }

  function tickBoot(now) {
    if (!bootStart) bootStart = now;
    var t = clamp((now - bootStart) / bootDuration, 0, 1);
    var eased = 1 - Math.pow(1 - t, 3);
    var count = Math.round(eased * 100);
    if (bootCount) bootCount.textContent = String(count).padStart(3, "0");
    if (bootBar) bootBar.style.width = (eased * 100) + "%";
    if (bootStatus) {
      var idx = Math.min(bootMessages.length - 1, Math.floor(t * bootMessages.length));
      bootStatus.textContent = bootMessages[idx];
    }
    if (t < 1) {
      requestAnimationFrame(tickBoot);
    } else {
      setTimeout(function () { finishBoot(false); }, 180);
    }
  }

  if (boot) {
    body.classList.add("is-booting");
    bootSkip && bootSkip.addEventListener("click", function () { finishBoot(true); });
    if (reduced) {
      setTimeout(function () { finishBoot(true); }, 80);
    } else {
      requestAnimationFrame(tickBoot);
    }
  }

  /* =======================================================================
     INTRO REVEAL
     ======================================================================= */
  var introRevealDone = false;
  function runIntroReveal(animated) {
    if (introRevealDone) return;
    introRevealDone = true;
    var words = $$(".intro-word");
    var targets = $$(".intro-kicker, .intro-lower, .intro-foot");
    if (!hasGSAP || !animated || reduced) return;
    var tl = window.gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.fromTo(".intro-kicker", { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 0.1)
      .fromTo(words, { yPercent: 118, rotate: 2 }, { yPercent: 0, rotate: 0, duration: 1.45, stagger: 0.1 }, 0.15)
      .fromTo(".intro-lower", { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 }, 0.6)
      .fromTo(".intro-foot", { opacity: 0 }, { opacity: 1, duration: 0.9 }, 0.9);
    window.setTimeout(function () { if (hasST) window.ScrollTrigger.refresh(); }, 1800);
  }

  /* =======================================================================
     CLOCK
     ======================================================================= */
  function updateClocks() {
    var now = new Date();
    var time = "--:--:--";
    try {
      time = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kuala_Lumpur", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
      }).format(now);
    } catch (err) {
      time = now.toLocaleTimeString();
    }
    ["#navClock", "#mobileClock", "#contactClock"].forEach(function (sel) {
      var el = $(sel);
      if (el) el.textContent = time;
    });
  }
  updateClocks();
  setInterval(updateClocks, 1000);

  /* =======================================================================
     NAVIGATION / CHAPTER / TONE
     ======================================================================= */
  var headerChapter = $("#headerChapter");
  var headerChapterName = $("#headerChapterName");
  var mobileMenu = $("#mobileMenu");
  var menuToggle = $("#menuToggle");
  var menuClose = $("#menuClose");
  var menuOpen = false;

  function setMenu(open) {
    if (!mobileMenu || !menuToggle) return;
    menuOpen = open;
    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.setAttribute("aria-hidden", open ? "false" : "true");
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    body.classList.toggle("menu-open", open);
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
    if (open) { var first = $("a", mobileMenu); first && first.focus({ preventScroll: true }); }
  }
  menuToggle && menuToggle.addEventListener("click", function () { setMenu(!menuOpen); });
  menuClose && menuClose.addEventListener("click", function () { setMenu(false); });
  $$("[data-menu-link]").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menuOpen) setMenu(false); });

  var chapterEls = $$("[data-chapter]");
  var railLinks = $$("[data-rail]");
  var lastChapter = "";
  var toneRaf = 0;

  function setTone(tone) {
    if (body.dataset.tone !== tone) body.dataset.tone = tone;
  }

  function syncTone() {
    var el = document.elementFromPoint(Math.floor(window.innerWidth / 2), Math.floor(window.innerHeight / 2));
    var toneEl = el && el.closest ? el.closest("[data-tone]") : null;
    if (toneEl) setTone(toneEl.getAttribute("data-tone"));
  }

  function updateScrollUI() {
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    var progress = docH > 0 ? clamp(window.pageYOffset / docH, 0, 1) : 0;
    var line = $("#scrollLine");
    if (line) line.style.width = (progress * 100).toFixed(2) + "%";

    var center = window.innerHeight * 0.5;
    var current = null;
    for (var i = 0; i < chapterEls.length; i++) {
      var r = chapterEls[i].getBoundingClientRect();
      if (r.top <= center && r.bottom > center) { current = chapterEls[i]; break; }
    }
    if (current) {
      var ch = current.getAttribute("data-chapter");
      var name = current.getAttribute("data-chapter-name") || "";
      if (ch !== lastChapter) {
        lastChapter = ch;
        if (headerChapter) headerChapter.textContent = ch;
        if (headerChapterName) headerChapterName.textContent = name;
        railLinks.forEach(function (link) {
          link.classList.toggle("is-active", link.getAttribute("data-rail") === current.id);
        });
      }
    }
    if (!toneRaf) {
      toneRaf = requestAnimationFrame(function () {
        toneRaf = 0;
        syncTone();
      });
    }
  }

  window.addEventListener("scroll", updateScrollUI, { passive: true });
  if (lenis) lenis.on("scroll", updateScrollUI);
  updateScrollUI();

  // Anchor navigation
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var href = a.getAttribute("href");
      if (!href || href === "#") return;
      var target = document.querySelector(href);
      if (!target) return;
      // project/world jumps are handled separately
      if (a.hasAttribute("data-jump-project") || a.hasAttribute("data-jump-world")) return;
      e.preventDefault();
      scrollToEl(target, 0);
    });
  });

  /* =======================================================================
     INTRO THREE.JS — THE MONOLITH
     ======================================================================= */
  var introSceneApi = null;
  function initIntroScene() {
    if (reduced || !hasThree) { root.classList.add(reduced ? "reduced-motion" : "no-webgl"); return; }
    var canvas = $("#introCanvas");
    var intro = $("#intro");
    if (!canvas || !intro) return;

    try {
      var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: window.devicePixelRatio < 2, powerPreference: "high-performance" });
      renderer.setClearColor(0x000000, 0);
      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0, 7.4);

      var sceneGroup = new THREE.Group();
      scene.add(sceneGroup);

      var crystalGeo = new THREE.OctahedronGeometry(1.6, 1);
      crystalGeo.scale(0.66, 1.62, 0.54);

      var crystalMat = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uColorA: { value: new THREE.Color(0xff5a2a) },
          uColorB: { value: new THREE.Color(0xbdeaff) }
        },
        vertexShader: [
          "uniform float uTime;",
          "uniform vec2 uMouse;",
          "varying vec3 vNormal;",
          "varying vec3 vView;",
          "varying vec3 vPos;",
          "void main(){",
          "  vec3 p = position;",
          "  float n = sin(p.y * 3.1 + uTime * 0.45) * 0.018 + sin(p.x * 4.7 - uTime * 0.31) * 0.012;",
          "  p += normal * n;",
          "  p.x += uMouse.x * 0.015;",
          "  vNormal = normalize(normalMatrix * normal);",
          "  vPos = p;",
          "  vec4 mv = modelViewMatrix * vec4(p, 1.0);",
          "  vView = -mv.xyz;",
          "  gl_Position = projectionMatrix * mv;",
          "}"
        ].join("\n"),
        fragmentShader: [
          "uniform float uTime;",
          "uniform vec3 uColorA;",
          "uniform vec3 uColorB;",
          "varying vec3 vNormal;",
          "varying vec3 vView;",
          "varying vec3 vPos;",
          "void main(){",
          "  vec3 V = normalize(vView);",
          "  vec3 N = normalize(vNormal);",
          "  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.4);",
          "  float grain = sin(vPos.y * 22.0 + uTime * 0.5) * 0.5 + 0.5;",
          "  vec3 base = mix(vec3(0.012, 0.013, 0.016), vec3(0.085, 0.09, 0.11), vPos.y * 0.32 + 0.5);",
          "  vec3 col = base + fres * mix(uColorA, uColorB, vPos.y * 0.5 + 0.5) * 1.65;",
          "  col += grain * uColorB * 0.035;",
          "  float edge = smoothstep(0.0, 0.18, fres);",
          "  gl_FragColor = vec4(col, 0.93 + edge * 0.07);",
          "}"
        ].join("\n")
      });

      var crystal = new THREE.Mesh(crystalGeo, crystalMat);
      sceneGroup.add(crystal);

      var wireMat = new THREE.MeshBasicMaterial({ color: 0xbdeaff, wireframe: true, transparent: true, opacity: 0.09, depthWrite: false });
      var wire = new THREE.Mesh(crystalGeo, wireMat);
      wire.scale.setScalar(1.018);
      sceneGroup.add(wire);

      var wireMat2 = new THREE.MeshBasicMaterial({ color: 0xff5a2a, wireframe: true, transparent: true, opacity: 0.055, depthWrite: false });
      var wire2 = new THREE.Mesh(crystalGeo, wireMat2);
      wire2.scale.setScalar(1.06);
      sceneGroup.add(wire2);

      var coreMat = new THREE.MeshBasicMaterial({ color: 0xff5a2a, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
      var core = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 16), coreMat);
      core.position.y = -0.1;
      sceneGroup.add(core);

      var glowTex = (function () {
        var c = document.createElement("canvas");
        c.width = c.height = 64;
        var ctx = c.getContext("2d");
        var g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.25, "rgba(255,255,255,.85)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(c);
      })();

      var rings = [];
      var ringData = [
        { r: 2.35, tube: 0.007, color: 0xff5a2a, opacity: 0.55, rot: [1.25, 0.2, 0.1], speed: 0.06 },
        { r: 2.6, tube: 0.005, color: 0xbdeaff, opacity: 0.28, rot: [1.7, -0.4, 0.25], speed: -0.045 },
        { r: 2.0, tube: 0.004, color: 0xffffff, opacity: 0.16, rot: [1.1, 0.7, -0.2], speed: 0.09 }
      ];
      ringData.forEach(function (d) {
        var ring = new THREE.Mesh(
          new THREE.TorusGeometry(d.r, d.tube, 6, 220),
          new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: d.opacity, depthWrite: false, blending: THREE.AdditiveBlending })
        );
        ring.rotation.set(d.rot[0], d.rot[1], d.rot[2]);
        ring.userData.speed = d.speed;
        rings.push(ring);
        sceneGroup.add(ring);
      });

      // Instanced shards in orbit
      var shardCount = window.innerWidth < 760 ? 52 : 110;
      var shardGeo = new THREE.TetrahedronGeometry(0.075, 0);
      var shardMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.65, depthWrite: false, blending: THREE.AdditiveBlending });
      var shards = new THREE.InstancedMesh(shardGeo, shardMat, shardCount);
      var shardState = [];
      var dummy = new THREE.Object3D();
      var shardColorA = new THREE.Color(0xff5a2a);
      var shardColorB = new THREE.Color(0xbdeaff);
      for (var s = 0; s < shardCount; s++) {
        var st = {
          angle: Math.random() * Math.PI * 2,
          radius: 1.9 + Math.random() * 2.35,
          y: (Math.random() - 0.5) * 4.2,
          speed: 0.04 + Math.random() * 0.12,
          scale: 0.22 + Math.random() * 0.78,
          wobble: Math.random() * Math.PI * 2
        };
        shardState.push(st);
        if (shards.setColorAt) shards.setColorAt(s, Math.random() > 0.55 ? shardColorA : shardColorB);
      }
      shards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      sceneGroup.add(shards);

      // Particle field
      var pCount = window.innerWidth < 760 ? 420 : 1100;
      var pGeo = new THREE.BufferGeometry();
      var pPos = new Float32Array(pCount * 3);
      var pCol = new Float32Array(pCount * 3);
      var cA = new THREE.Color(0xff5a2a);
      var cB = new THREE.Color(0xbdeaff);
      var cC = new THREE.Color(0xffffff);
      for (var p = 0; p < pCount; p++) {
        var radius = 2.2 + Math.random() * 7.5;
        var theta = Math.random() * Math.PI * 2;
        var phi = Math.acos((Math.random() * 2) - 1);
        pPos[p * 3] = Math.sin(phi) * Math.cos(theta) * radius;
        pPos[p * 3 + 1] = Math.cos(phi) * radius * 0.75;
        pPos[p * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius * 0.7;
        var mixColor = Math.random() > 0.75 ? cA : (Math.random() > 0.5 ? cB : cC);
        pCol[p * 3] = mixColor.r; pCol[p * 3 + 1] = mixColor.g; pCol[p * 3 + 2] = mixColor.b;
      }
      pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
      pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
      var particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
        size: 0.035, map: glowTex, vertexColors: true, transparent: true,
        opacity: 0.82, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
      }));
      sceneGroup.add(particles);

      var introState = { scale: reduced ? 1 : 0.38, rotX: 0.06, rotY: -0.5, mouseX: 0, mouseY: 0, dragging: false, lastX: 0, lastY: 0, dragX: 0, dragY: 0 };
      var introRunning = true;
      var introVisible = true;
      var introClock = new THREE.Clock();

      function sizeIntro() {
        var w = intro.clientWidth || window.innerWidth;
        var h = intro.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h, false);
        sceneGroup.position.x = w > 1100 ? 1.35 : (w > 760 ? 0.72 : 0);
        sceneGroup.position.y = w > 760 ? -0.05 : 0.55;
        var scale = w > 1100 ? 1 : (w > 760 ? 0.82 : 0.58);
        introState.baseScale = scale;
        camera.position.z = w > 760 ? 7.4 : 8.4;
      }
      sizeIntro();
      window.addEventListener("resize", debounce(sizeIntro, 120));

      window.addEventListener("mousemove", function (e) {
        introState.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        introState.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      }, { passive: true });

      if (!touch) {
        intro.addEventListener("pointerdown", function (e) {
          if (e.target.closest("a,button")) return;
          introState.dragging = true;
          introState.lastX = e.clientX;
          introState.lastY = e.clientY;
        });
        window.addEventListener("pointermove", function (e) {
          if (!introState.dragging) return;
          introState.dragY += (e.clientX - introState.lastX) * 0.0035;
          introState.dragX += (e.clientY - introState.lastY) * 0.0035;
          introState.lastX = e.clientX;
          introState.lastY = e.clientY;
        }, { passive: true });
        window.addEventListener("pointerup", function () { introState.dragging = false; });
      }

      if (hasGSAP && !reduced) {
        window.gsap.to(introState, { scale: 1, duration: 2.4, ease: "expo.out", delay: 0.2 });
        window.gsap.from(sceneGroup.rotation, { y: 1.2, duration: 2.6, ease: "expo.out" });
      } else {
        introState.scale = 1;
      }

      function renderIntro() {
        if (!introRunning || !introVisible) return;
        requestAnimationFrame(renderIntro);
        var t = introClock.getElapsedTime();
        crystalMat.uniforms.uTime.value = t;
        crystalMat.uniforms.uMouse.value.set(introState.mouseX * 0.3, introState.mouseY * 0.3);

        var targetRotY = t * 0.1 + introState.mouseX * 0.22 + introState.dragY;
        var targetRotX = Math.sin(t * 0.28) * 0.08 + introState.mouseY * 0.12 + introState.dragX;
        crystal.rotation.y = lerp(crystal.rotation.y, targetRotY, 0.045);
        crystal.rotation.x = lerp(crystal.rotation.x, targetRotX, 0.045);
        wire.rotation.copy(crystal.rotation);
        wire2.rotation.copy(crystal.rotation);
        crystal.position.y = Math.sin(t * 0.65) * 0.06;
        wire.position.y = crystal.position.y;
        wire2.position.y = crystal.position.y;
        core.position.y = crystal.position.y - 0.1;
        core.scale.setScalar(0.9 + Math.sin(t * 1.7) * 0.08);

        var sc = introState.scale * (introState.baseScale || 1);
        sceneGroup.scale.setScalar(sc);
        sceneGroup.rotation.x = introState.mouseY * 0.035;
        sceneGroup.rotation.y = introState.mouseX * 0.055;

        rings.forEach(function (ring, ri) {
          ring.rotation.z += ring.userData.speed * 0.01;
          ring.rotation.y += 0.0004 * (ri + 1);
        });

        for (var i = 0; i < shardCount; i++) {
          var d = shardState[i];
          var a = d.angle + t * d.speed;
          dummy.position.set(
            Math.cos(a) * d.radius,
            d.y + Math.sin(t * 0.4 + d.wobble) * 0.22,
            Math.sin(a) * d.radius * 0.62
          );
          dummy.rotation.set(t * 0.2 + d.wobble, a, t * 0.15);
          dummy.scale.setScalar(d.scale);
          dummy.updateMatrix();
          shards.setMatrixAt(i, dummy.matrix);
        }
        shards.instanceMatrix.needsUpdate = true;

        particles.rotation.y = t * 0.018;
        particles.rotation.x = Math.sin(t * 0.05) * 0.08;

        camera.position.x = lerp(camera.position.x, introState.mouseX * 0.18, 0.04);
        camera.position.y = lerp(camera.position.y, introState.mouseY * 0.12, 0.04);
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      }

      canvas.addEventListener("webglcontextlost", function (e) {
        e.preventDefault();
        introRunning = false;
        root.classList.add("no-webgl");
      });

      var introObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var wasVisible = introVisible;
          introVisible = entry.isIntersecting;
          if (introVisible && !wasVisible) { introRunning = true; renderIntro(); }
        });
      }, { threshold: 0.02 });
      introObserver.observe(intro);
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) { introRunning = false; }
        else if (introVisible) { introRunning = true; renderIntro(); }
      });

      renderIntro();
      setTimeout(function () { canvas.classList.add("is-ready"); }, 120);
      introSceneApi = { setVisible: function (v) { introVisible = v; } };
    } catch (err) {
      root.classList.add("no-webgl");
      console.warn("Intro WebGL unavailable:", err);
    }
  }

  /* =======================================================================
     UNIVERSE THREE.JS — FOUR DOMAINS
     ======================================================================= */
  var domainData = {
    code: {
      index: "01 / CODE",
      title: "Systems that hold up.",
      body: "Production backends, edge architecture and product engineering — designed to ship, not to demo.",
      links: [
        { label: "Duits", project: 1 },
        { label: "DevXMedia Invoicing", project: 4 },
        { label: "XAUUSD Engine", project: 5 }
      ]
    },
    ai: {
      index: "02 / AI",
      title: "Models with a purpose.",
      body: "Computer vision, multimodal parsing and multi-agent systems — applied to problems where accuracy matters.",
      links: [
        { label: "HistoScan-AI", project: 0 },
        { label: "Duits Vision", project: 1 },
        { label: "Agent Systems", project: 3 }
      ]
    },
    creative: {
      index: "03 / CREATIVE",
      title: "Image, motion, atmosphere.",
      body: "Graphic systems, cinematography and interactive experiences — the visual layer that makes technical work feel human.",
      links: [
        { label: "Tinta Visuals", world: "tinta" },
        { label: "Sejenak", world: "sejenak" },
        { label: "Adobe ACP", record: true }
      ]
    },
    enterprise: {
      index: "04 / ENTERPRISE",
      title: "Brands, not side projects.",
      body: "Five ventures under one registered ecosystem — software, events, media and apparel, each with its own operating logic.",
      links: [
        { label: "Hannenkam", world: "hannenkam" },
        { label: "DevXMedia", world: "devxmedia" },
        { label: "BVRCODE", world: "bvrcode" }
      ]
    }
  };

  var universeApi = null;
  function initUniverse() {
    if (reduced || !hasThree) {
      var uni = $("#universe");
      if (uni) uni.classList.add("is-static");
      return;
    }
    var canvas = $("#universeCanvas");
    var section = $("#universe");
    if (!canvas || !section) return;

    try {
      var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
      renderer.setClearColor(0x000000, 0);
      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(0, 0, 9.2);
      var rootGroup = new THREE.Group();
      scene.add(rootGroup);

      var starGeo = new THREE.BufferGeometry();
      var starCount = 900;
      var starPos = new Float32Array(starCount * 3);
      for (var i = 0; i < starCount; i++) {
        var r = 4 + Math.random() * 9;
        var th = Math.random() * Math.PI * 2;
        var ph = Math.acos((Math.random() * 2) - 1);
        starPos[i * 3] = Math.sin(ph) * Math.cos(th) * r;
        starPos[i * 3 + 1] = Math.cos(ph) * r * 0.7;
        starPos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r * 0.45;
      }
      starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
      var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.025, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
      rootGroup.add(stars);

      // central core
      var coreGroup = new THREE.Group();
      var coreGeo = new THREE.IcosahedronGeometry(0.58, 1);
      var coreWire = new THREE.LineSegments(new THREE.EdgesGeometry(coreGeo), new THREE.LineBasicMaterial({ color: 0xff5a2a, transparent: true, opacity: 0.55 }));
      coreGroup.add(coreWire);
      var coreMesh = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ color: 0x0a0a0a, transparent: true, opacity: 0.7 }));
      coreGroup.add(coreMesh);
      var coreGlow = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 16), new THREE.MeshBasicMaterial({ color: 0xff5a2a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
      coreGroup.add(coreGlow);
      rootGroup.add(coreGroup);

      var orbitMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, depthWrite: false });
      var orbitGroup = new THREE.Group();
      [1.7, 2.35, 3.05].forEach(function (rad, i) {
        var orbit = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.004, 4, 160), orbitMat.clone());
        orbit.rotation.set(1.3 + i * 0.32, 0.2 * i, 0.4 * i);
        orbitGroup.add(orbit);
      });
      rootGroup.add(orbitGroup);

      var clusters = {};
      var hitMeshes = [];
      var palette = {
        code: 0x8de7ff,
        ai: 0xff8f5e,
        creative: 0xff5a2a,
        enterprise: 0xe8d8ad
      };

      function makeCluster(domain, x, y) {
        var g = new THREE.Group();
        g.position.set(x, y, 0);
        var color = palette[domain];
        var lineMat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.6 });

        if (domain === "code") {
          [0.36, 0.55, 0.76].forEach(function (s, i) {
            var box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(s, s, s)), lineMat.clone());
            box.rotation.set(i * 0.2, i * 0.35, i * 0.1);
            g.add(box);
          });
          var pts = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: color, size: 0.05, transparent: true, opacity: 0.9, depthWrite: false }));
          var pos = [];
          for (var n = 0; n < 26; n++) {
            var a = Math.random() * Math.PI * 2, rad = 0.4 + Math.random() * 0.5;
            pos.push(Math.cos(a) * rad, (Math.random() - 0.5) * 1.2, Math.sin(a) * rad);
          }
          pts.geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
          g.add(pts);
        }

        if (domain === "ai") {
          var nodes = [];
          var nodePos = [];
          for (var j = 0; j < 22; j++) {
            var ang = Math.random() * Math.PI * 2, rr = 0.28 + Math.random() * 0.55;
            var np = new THREE.Vector3(Math.cos(ang) * rr, (Math.random() - 0.5) * 1.25, Math.sin(ang) * rr * 0.7);
            nodes.push(np);
            nodePos.push(np.x, np.y, np.z);
          }
          var netGeo = new THREE.BufferGeometry();
          netGeo.setAttribute("position", new THREE.Float32BufferAttribute(nodePos, 3));
          g.add(new THREE.Points(netGeo, new THREE.PointsMaterial({ color: color, size: 0.09, transparent: true, opacity: 0.95, depthWrite: false })));
          var edgePos = [];
          nodes.forEach(function (np, idx) {
            if (idx % 2 === 0) edgePos.push(np.x, np.y, np.z, 0, 0, 0);
            if (idx < nodes.length - 2) edgePos.push(np.x, np.y, np.z, nodes[idx + 2].x, nodes[idx + 2].y, nodes[idx + 2].z);
          });
          var edgeGeo = new THREE.BufferGeometry();
          edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(edgePos, 3));
          g.add(new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.2 })));
        }

        if (domain === "creative") {
          var petalGeo = new THREE.TetrahedronGeometry(0.3, 0);
          for (var k = 0; k < 8; k++) {
            var petal = new THREE.Mesh(petalGeo, new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.3, wireframe: true }));
            var pa = (k / 8) * Math.PI * 2;
            petal.position.set(Math.cos(pa) * 0.5, Math.sin(pa) * 0.5, 0);
            petal.rotation.set(pa, pa * 1.4, pa * 0.5);
            g.add(petal);
          }
          var ring = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.012, 4, 80), new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.45 }));
          ring.rotation.x = 1.2;
          g.add(ring);
          var ring2 = ring.clone();
          ring2.rotation.set(0.4, 1.1, 0.3);
          g.add(ring2);
        }

        if (domain === "enterprise") {
          var octa = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.62, 0)), lineMat.clone());
          g.add(octa);
          var octa2 = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.45, 0)), lineMat.clone());
          octa2.rotation.set(0.5, 0.4, 0.1);
          g.add(octa2);
          [0.95, 1.2].forEach(function (rad, idx) {
            var rr = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.006, 4, 100), new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.3 - idx * 0.08, depthWrite: false }));
            rr.rotation.set(1.2 + idx * 0.6, 0.4 * idx, 0.2);
            g.add(rr);
          });
        }

        var hit = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 12), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
        hit.userData.domain = domain;
        g.add(hit);
        hitMeshes.push(hit);

        g.userData = { domain: domain, base: new THREE.Vector3(x, y, 0), phase: Math.random() * Math.PI * 2 };
        rootGroup.add(g);
        clusters[domain] = g;
      }

      var positions = function () {
        var mobile = window.innerWidth < 1100;
        var x = mobile ? 1.9 : 3.15;
        var y = mobile ? 1.32 : 1.62;
        return { code: [-x * 1.04, mobile ? 0.4 : -0.5], ai: [x, y], creative: [-x * 0.9, -y], enterprise: [x * 0.9, -y * 0.98] };
      };

      function layoutUniverse() {
        var p = positions();
        Object.keys(p).forEach(function (key) {
          if (clusters[key]) clusters[key].position.set(p[key][0], p[key][1], 0);
          if (clusters[key]) clusters[key].userData.base.set(p[key][0], p[key][1], 0);
        });
        var w = canvas.clientWidth || section.clientWidth || window.innerWidth;
        var h = canvas.clientHeight || section.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h, false);
        camera.position.z = window.innerWidth < 760 ? 9.4 : 9.2;
      }

      makeCluster("code", -3.15, 1.65);
      makeCluster("ai", 3.15, 1.65);
      makeCluster("creative", -2.8, -1.65);
      makeCluster("enterprise", 2.85, -1.65);
      layoutUniverse();
      window.addEventListener("resize", debounce(layoutUniverse, 150));

      var uniState = { active: "code", targetZ: 9.2, rootY: 0, dragY: 0, dragX: 0, dragging: false, lastX: 0, lastY: 0, moved: 0, mouseX: 0, mouseY: 0 };
      var uniRunning = true;
      var uniVisible = false;
      var uniClock = new THREE.Clock();

      function setActiveCluster(domain) {
        Object.keys(clusters).forEach(function (key) {
          var g = clusters[key];
          var isActive = key === domain;
          g.userData.targetScale = isActive ? 1.16 : 0.82;
          g.userData.targetOpacity = isActive ? 1 : 0.42;
          g.traverse(function (obj) {
            if (obj.material && obj.material.opacity !== undefined && obj !== hitMeshes[0]) {
              obj.userData.baseOpacity = obj.userData.baseOpacity === undefined ? obj.material.opacity : obj.userData.baseOpacity;
            }
          });
        });
      }

      function setDomain(domain, silent) {
        if (!domainData[domain]) return;
        uniState.active = domain;
        setActiveCluster(domain);
        $$(".u-node").forEach(function (btn) {
          var on = btn.getAttribute("data-domain") === domain;
          btn.classList.toggle("is-active", on);
          btn.setAttribute("aria-pressed", on ? "true" : "false");
        });
        var panel = $("#universePanel");
        if (panel) {
          panel.classList.add("is-switching");
          setTimeout(function () {
            var data = domainData[domain];
            var idx = $("#uPanelIndex"), title = $("#uPanelTitle"), bodyEl = $("#uPanelBody"), linksEl = $("#uPanelLinks");
            if (idx) idx.textContent = data.index;
            if (title) title.textContent = data.title;
            if (bodyEl) bodyEl.textContent = data.body;
            if (linksEl) {
              linksEl.innerHTML = data.links.map(function (l) {
                if (l.project !== undefined) return '<a href="#work" data-jump-project="' + l.project + '">' + l.label + ' <span>↗</span></a>';
                if (l.world) return '<a href="#worlds" data-jump-world="' + l.world + '">' + l.label + ' <span>↗</span></a>';
                return '<a href="#record">' + l.label + ' <span>↗</span></a>';
              }).join("");
              bindJumpLinks(linksEl);
            }
            panel.classList.remove("is-switching");
          }, 180);
        }
        if (!silent) {
          if (universeApi) universeApi.pulse = 1;
        }
      }
      universeApi = { setDomain: setDomain, pulse: 0 };

      $$(".u-node").forEach(function (btn) {
        btn.addEventListener("click", function () { setDomain(btn.getAttribute("data-domain")); });
      });

      var raycaster = new THREE.Raycaster();
      var pointer = new THREE.Vector2();

      canvas.addEventListener("pointerdown", function (e) {
        uniState.dragging = true;
        uniState.lastX = e.clientX;
        uniState.lastY = e.clientY;
        uniState.moved = 0;
      });
      window.addEventListener("pointermove", function (e) {
        if (!uniState.dragging) return;
        var dx = e.clientX - uniState.lastX;
        var dy = e.clientY - uniState.lastY;
        uniState.dragY += dx * 0.003;
        uniState.dragX += dy * 0.002;
        uniState.moved += Math.abs(dx) + Math.abs(dy);
        uniState.lastX = e.clientX;
        uniState.lastY = e.clientY;
        uniState.dragX = clamp(uniState.dragX, -0.25, 0.25);
      }, { passive: true });
      window.addEventListener("pointerup", function (e) {
        if (!uniState.dragging) { return; }
        uniState.dragging = false;
        if (uniState.moved < 8) {
          var rect = canvas.getBoundingClientRect();
          pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(pointer, camera);
          var hits = raycaster.intersectObjects(hitMeshes, false);
          if (hits.length) setDomain(hits[0].object.userData.domain);
        }
      });
      window.addEventListener("mousemove", function (e) {
        uniState.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        uniState.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      }, { passive: true });

      function renderUniverse() {
        if (!uniRunning || !uniVisible) return;
        requestAnimationFrame(renderUniverse);
        var t = uniClock.getElapsedTime();
        rootGroup.rotation.y = lerp(rootGroup.rotation.y, uniState.dragY + uniState.mouseX * 0.05 + Math.sin(t * 0.08) * 0.06, 0.035);
        rootGroup.rotation.x = lerp(rootGroup.rotation.x, uniState.dragX + uniState.mouseY * 0.03, 0.035);

        coreGroup.rotation.y = t * 0.16;
        coreGroup.rotation.x = Math.sin(t * 0.2) * 0.18;
        coreGlow.scale.setScalar(0.85 + Math.sin(t * 1.5) * 0.1);
        orbitGroup.rotation.z = t * 0.015;
        orbitGroup.rotation.y = t * 0.01;
        stars.rotation.y = t * 0.006;

        Object.keys(clusters).forEach(function (key, index) {
          var g = clusters[key];
          var active = key === uniState.active;
          var ts = g.userData.targetScale || 0.9;
          g.scale.x = lerp(g.scale.x, ts, 0.06);
          g.scale.y = lerp(g.scale.y, ts, 0.06);
          g.scale.z = lerp(g.scale.z, ts, 0.06);
          g.position.y = g.userData.base.y + Math.sin(t * 0.6 + g.userData.phase) * 0.055;
          g.rotation.y = Math.sin(t * 0.22 + index) * 0.25;
          g.rotation.z = Math.cos(t * 0.15 + index) * 0.06;
          g.traverse(function (obj) {
            if (obj.material && obj.material.opacity !== undefined && !obj.userData.isHit && obj !== hitMeshes[0]) {
              if (obj.userData.baseOpacity === undefined) obj.userData.baseOpacity = obj.material.opacity;
              var target = active ? obj.userData.baseOpacity : obj.userData.baseOpacity * 0.5;
              obj.material.opacity = lerp(obj.material.opacity, target, 0.05);
            }
          });
        });

        if (universeApi.pulse > 0) {
          universeApi.pulse *= 0.94;
          camera.position.z = lerp(camera.position.z, (window.innerWidth < 760 ? 9.4 : 9.2) - universeApi.pulse * 0.5, 0.08);
        } else {
          camera.position.z = lerp(camera.position.z, window.innerWidth < 760 ? 9.4 : 9.2, 0.04);
        }
        camera.position.x = lerp(camera.position.x, uniState.mouseX * 0.22, 0.04);
        camera.position.y = lerp(camera.position.y, uniState.mouseY * 0.14, 0.04);
        camera.lookAt(0, 0, 0);

        var coord = $("#uCoord");
        if (coord) {
          coord.textContent = "X " + (rootGroup.rotation.y * 10).toFixed(1) + " · Y " + (rootGroup.rotation.x * 10).toFixed(1) + " · Z " + camera.position.z.toFixed(1);
        }
        renderer.render(scene, camera);
      }

      var uniObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var was = uniVisible;
          uniVisible = entry.isIntersecting;
          if (uniVisible && !was) { uniRunning = true; renderUniverse(); }
        });
      }, { threshold: 0.05 });
      uniObserver.observe(section);
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) uniRunning = false;
        else if (uniVisible) { uniRunning = true; renderUniverse(); }
      });

      canvas.addEventListener("webglcontextlost", function (e) {
        e.preventDefault();
        uniRunning = false;
        section.classList.add("is-static");
      });

      setActiveCluster("code");
      setDomain("code", true);
      renderUniverse();
    } catch (err) {
      var u = $("#universe");
      if (u) u.classList.add("is-static");
      console.warn("Universe WebGL unavailable:", err);
    }
  }

  /* =======================================================================
     WORK — HORIZONTAL FILM + INTERACTIONS
     ======================================================================= */
  function setupWork() {
    var track = $("#workTrack");
    var pin = $("#workPin");
    if (!track || !pin) return;
    workPanels = $$(".project", track);
    projectCount = workPanels.length;

    function setProjectUI(index, progress) {
      activeProject = clamp(index, 0, projectCount - 1);
      workPanels.forEach(function (panel, i) {
        panel.classList.toggle("is-active", i === activeProject);
        // Only the visible panel should be reachable while the reel is horizontal.
        try { panel.inert = isDesktopWork() && i !== activeProject; } catch (err) { /* older browsers */ }
      });
      var idxEl = $("#workIndex");
      var catEl = $("#workCategory");
      if (idxEl) idxEl.textContent = String(activeProject + 1).padStart(2, "0");
      if (catEl) catEl.textContent = workPanels[activeProject].getAttribute("data-category") || "";
      var prog = $("#workProgress");
      if (prog) prog.style.width = ((progress !== undefined ? progress : activeProject / (projectCount - 1)) * 100) + "%";
      $$("#workDots button").forEach(function (b, i) { b.classList.toggle("is-active", i === activeProject); });
      var workSection = $("#work");
      if (workSection) {
        var wr = workSection.getBoundingClientRect();
        var inView = wr.top <= window.innerHeight * 0.55 && wr.bottom > window.innerHeight * 0.3;
        if (inView) {
          var tone = workPanels[activeProject].classList.contains("project-histo") || workPanels[activeProject].classList.contains("project-duits") ? "light" : "dark";
          setTone(tone);
        }
      }
      var hint = $("#workHint");
      if (hint) hint.textContent = activeProject === projectCount - 1 ? "End of reel" : "Scroll to traverse";
    }
    setProjectUIFn = setProjectUI;

    function desktopSetup() {
      if (!hasGSAP || !hasST || !isDesktopWork()) return false;
      if (mobileWorkHandler) {
        window.removeEventListener("scroll", mobileWorkHandler);
        mobileWorkHandler = null;
      }
      var distance = Math.max(0, track.scrollWidth - window.innerWidth);
      if (distance <= 10) return false;
      workScrollTrigger = window.ScrollTrigger.create({
        trigger: "#work",
        start: "top top",
        end: function () { return "+=" + Math.max(1, track.scrollWidth - window.innerWidth); },
        pin: pin,
        pinSpacing: true,
        scrub: 0.65,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        snap: {
          snapTo: 1 / Math.max(1, projectCount - 1),
          duration: { min: 0.22, max: 0.55 },
          delay: 0.06,
          ease: "power1.inOut"
        },
        onUpdate: function (self) {
          var dist = Math.max(1, track.scrollWidth - window.innerWidth);
          var x = -dist * self.progress;
          window.gsap.set(track, { x: x });
          var p = clamp(self.progress, 0, 1);
          var idx = Math.round(p * (projectCount - 1));
          if (idx !== activeProject) setProjectUI(idx, p);
          else {
            var prog = $("#workProgress");
            if (prog) prog.style.width = (p * 100) + "%";
          }
        }
      });
      setProjectUI(0, 0);
      return true;
    }

    function mobileSetup() {
      if (workScrollTrigger) { workScrollTrigger.kill(true); workScrollTrigger = null; }
      if (hasGSAP) window.gsap.set(track, { clearProps: "x" });
      track.style.transform = "";
      if (mobileWorkHandler) window.removeEventListener("scroll", mobileWorkHandler);
      mobileWorkHandler = function () {
        var workEl = $("#work");
        if (!workEl) return;
        var wr = workEl.getBoundingClientRect();
        if (wr.top > window.innerHeight || wr.bottom < 0) return;
        var center = window.innerHeight * 0.5;
        var best = activeProject;
        var bestDist = Infinity;
        workPanels.forEach(function (panel, i) {
          var r = panel.getBoundingClientRect();
          var d = Math.abs((r.top + r.bottom) / 2 - center);
          if (d < bestDist) { bestDist = d; best = i; }
        });
        if (best !== activeProject) setProjectUI(best, projectCount > 1 ? best / (projectCount - 1) : 0);
        else workPanels.forEach(function (panel, i) { panel.classList.toggle("is-active", i === best); });
      };
      window.addEventListener("scroll", mobileWorkHandler, { passive: true });
      setProjectUI(0, 0);
      mobileWorkHandler();
    }

    var modeDesktop = false;
    function layout() {
      var wantDesktop = isDesktopWork();
      if (wantDesktop && !modeDesktop) {
        modeDesktop = desktopSetup();
        if (!modeDesktop) mobileSetup();
      } else if (!wantDesktop && modeDesktop) {
        modeDesktop = false;
        mobileSetup();
      }
      if (hasST) window.ScrollTrigger.refresh();
    }

    if (isDesktopWork()) {
      modeDesktop = desktopSetup();
      if (!modeDesktop) mobileSetup();
    } else {
      mobileSetup();
    }
    window.addEventListener("load", function () {
      if (hasST) window.ScrollTrigger.refresh();
    });
    window.addEventListener("resize", debounce(function () {
      var want = isDesktopWork();
      if (want !== modeDesktop) {
        modeDesktop = false;
        if (want) { modeDesktop = desktopSetup(); if (!modeDesktop) mobileSetup(); }
        else { mobileSetup(); }
        if (hasST) window.ScrollTrigger.refresh();
      }
    }, 250));

    // Nav controls
    $("#workPrev") && $("#workPrev").addEventListener("click", function () { goToProject(activeProject - 1); });
    $("#workNext") && $("#workNext").addEventListener("click", function () { goToProject(activeProject + 1); });
    $$("#workDots button").forEach(function (btn) {
      btn.addEventListener("click", function () { goToProject(parseInt(btn.getAttribute("data-project"), 10)); });
    });
  }

  function goToProject(index) {
    index = clamp(index, 0, Math.max(0, projectCount - 1));
    if (workScrollTrigger && isDesktopWork()) {
      var p = projectCount > 1 ? index / (projectCount - 1) : 0;
      var y = workScrollTrigger.start + (workScrollTrigger.end - workScrollTrigger.start) * p + 2;
      scrollToY(y, 1.1);
      if (setProjectUIFn) setProjectUIFn(index, p);
    } else {
      var panel = workPanels[index];
      if (panel) scrollToEl(panel, window.innerWidth <= 760 ? 80 : 0);
      if (setProjectUIFn) setProjectUIFn(index, projectCount > 1 ? index / (projectCount - 1) : 0);
    }
  }

  function jumpToProject(index) {
    if (workScrollTrigger && isDesktopWork()) {
      goToProject(index);
    } else {
      goToProject(index);
    }
  }

  function bindJumpLinks(scope) {
    $$('[data-jump-project]', scope).forEach(function (a) {
      if (a.dataset.bound) return;
      a.dataset.bound = "1";
      a.addEventListener("click", function (e) {
        e.preventDefault();
        jumpToProject(parseInt(a.getAttribute("data-jump-project"), 10));
      });
    });
    $$('[data-jump-world]', scope).forEach(function (a) {
      if (a.dataset.bound) return;
      a.dataset.bound = "1";
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var world = document.querySelector('.world[data-world="' + a.getAttribute("data-jump-world") + '"]');
        if (world) scrollToEl(world, 82);
      });
    });
  }
  bindJumpLinks(document);

  /* =======================================================================
     WORK ILLUSTRATIONS
     ======================================================================= */
  function initHisto() {
    var canvas = $("#histoCanvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx || canvas.dataset.drawn) return;
    canvas.dataset.drawn = "1";
    var W = canvas.width, H = canvas.height;
    ctx.fillStyle = "#f4e7df";
    ctx.fillRect(0, 0, W, H);
    var seed = 42;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    // soft tissue wash
    for (var w = 0; w < 85; w++) {
      var x = rnd() * W, y = rnd() * H, r = 18 + rnd() * 90;
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(190, 120, 145, 0.12)");
      g.addColorStop(1, "rgba(250, 240, 235, 0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    // cells
    for (var c = 0; c < 380; c++) {
      var cx = rnd() * W, cy = rnd() * H;
      var rad = 4 + rnd() * 11;
      var nuc = rad * (0.24 + rnd() * 0.18);
      var hue = 325 + rnd() * 25;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rad, rad * (0.7 + rnd() * 0.5), rnd() * Math.PI, 0, Math.PI * 2);
      ctx.fillStyle = "hsla(" + hue + ", 38%, " + (68 + rnd() * 15) + "%, " + (0.2 + rnd() * 0.28) + ")";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + (rnd() - 0.5) * 3, cy + (rnd() - 0.5) * 3, nuc, 0, Math.PI * 2);
      ctx.fillStyle = "hsla(" + (hue - 10) + ", 50%, " + (35 + rnd() * 18) + "%, " + (0.5 + rnd() * 0.35) + ")";
      ctx.fill();
    }
    // focal region heat
    var hg = ctx.createRadialGradient(W * 0.52, H * 0.44, 8, W * 0.52, H * 0.44, W * 0.23);
    hg.addColorStop(0, "rgba(255, 45, 30, 0.34)");
    hg.addColorStop(0.55, "rgba(255, 120, 40, 0.14)");
    hg.addColorStop(1, "rgba(255, 90, 42, 0)");
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, W, H);

    // ROI boundary markers and scale bar
    ctx.fillStyle = "rgba(7,7,7,.4)";
    ctx.font = "9px monospace";
    ctx.fillText("40x magnification", 18, H - 34);
    ctx.fillRect(18, H - 25, 52, 2);
    ctx.fillText("100 µm", 78, H - 22);
  }

  function initGoldChart() {
    var svg = $("#goldChart");
    if (!svg || svg.dataset.drawn) return;
    svg.dataset.drawn = "1";
    var NS = "http://www.w3.org/2000/svg";
    var W = 700, H = 760;
    var left = 38, right = 664, top = 66, bottom = 610;
    function el(name, attrs, parent) {
      var node = document.createElementNS(NS, name);
      Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
      (parent || svg).appendChild(node);
      return node;
    }
    // grid
    for (var i = 0; i <= 6; i++) {
      var y = top + (bottom - top) * (i / 6);
      el("line", { x1: left, y1: y, x2: right, y2: y, class: "grid-line" });
      el("text", { x: left - 8, y: y + 3, fill: "rgba(242,223,184,.35)", "font-family": "monospace", "font-size": "8", "text-anchor": "end" }).textContent = (2740 - i * 18).toString();
    }
    // deterministic candles
    var seed = 19;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    var vals = [];
    var v = 2650;
    for (var c = 0; c < 38; c++) {
      var open = v;
      var change = (rnd() - 0.48) * 16;
      var close = open + change;
      var high = Math.max(open, close) + rnd() * 8;
      var low = Math.min(open, close) - rnd() * 8;
      v = close;
      vals.push({ o: open, c: close, h: high, l: low });
    }
    var min = Infinity, max = -Infinity;
    vals.forEach(function (d) { min = Math.min(min, d.l); max = Math.max(max, d.h); });
    min -= 6; max += 6;
    var cw = (right - left) / vals.length;
    function py(val) { return bottom - ((val - min) / (max - min)) * (bottom - top); }
    vals.forEach(function (d, idx) {
      var x = left + cw * idx + cw * 0.5;
      var up = d.c >= d.o;
      el("line", { x1: x, y1: py(d.h), x2: x, y2: py(d.l), class: "wick" });
      var bodyTop = py(Math.max(d.o, d.c));
      var bodyH = Math.max(1.5, Math.abs(py(d.o) - py(d.c)));
      el("rect", { x: x - cw * 0.28, y: bodyTop, width: cw * 0.56, height: bodyH, class: up ? "candle-up" : "candle-down" });
    });
    // EMA paths
    function emaPath(period) {
      var k = 2 / (period + 1);
      var ema = vals[0].c;
      var pts = [];
      vals.forEach(function (d, idx) {
        ema = d.c * k + ema * (1 - k);
        pts.push((left + cw * idx + cw * 0.5) + "," + py(ema).toFixed(1));
      });
      return "M" + pts.join(" L");
    }
    el("path", { d: emaPath(9), class: "ema9" });
    el("path", { d: emaPath(21), class: "ema21" });
    // news event line
    el("line", { x1: 485, y1: top, x2: 485, y2: bottom, class: "news-line" });
    el("text", { x: 492, y: top + 14, class: "news-label" }).textContent = "HIGH-IMPACT EVENT";
    // RSI strip
    var rsiTop = 654, rsiH = 66;
    el("line", { x1: left, y1: rsiTop, x2: right, y2: rsiTop, class: "grid-line" });
    el("text", { x: left - 8, y: rsiTop + 5, fill: "rgba(242,223,184,.35)", "font-family": "monospace", "font-size": "8", "text-anchor": "end" }).textContent = "RSI";
    var rsiPts = [];
    for (var r = 0; r < vals.length; r++) {
      var xr = left + cw * r + cw * 0.5;
      var yr = rsiTop + rsiH - ((45 + Math.sin(r * 0.55) * 14 + (rnd() - 0.5) * 12) / 100) * rsiH;
      rsiPts.push(xr + "," + yr.toFixed(1));
    }
    el("path", { d: "M" + rsiPts.join(" L"), fill: "none", stroke: "#ff5a2a", "stroke-width": "1", opacity: "0.8" });
    el("line", { x1: left, y1: rsiTop + rsiH * 0.3, x2: right, y2: rsiTop + rsiH * 0.3, stroke: "rgba(255,90,42,.2)", "stroke-width": "1", "stroke-dasharray": "2 4" });
  }

  // Duits scan
  var duitsBtn = $("#duitsScan");
  if (duitsBtn) {
    var receipt = $("#duitsReceipt");
    var scanning = false;
    duitsBtn.addEventListener("click", function () {
      if (scanning) return;
      scanning = true;
      var values = { merchant: "LOTUS'S", total: "RM 142.50", tax: "RM 6.20", category: "GROCERIES" };
      $$("[data-receipt]").forEach(function (b) {
        b.textContent = "···";
        b.classList.remove("is-filled");
      });
      if (receipt) { receipt.classList.remove("is-filled"); receipt.classList.add("is-scanning"); }
      setTimeout(function () {
        Object.keys(values).forEach(function (key) {
          var b = $('[data-receipt="' + key + '"]');
          if (b) { b.textContent = values[key]; b.classList.add("is-filled"); }
        });
        if (receipt) receipt.classList.add("is-filled");
        scanning = false;
      }, 950);
    });
  }

  // Banjir alert
  var banjirBtn = $("#banjirToggle");
  if (banjirBtn) {
    var banjirPanel = $(".project-banjir");
    var banjirStatus = $("#banjirStatus");
    banjirBtn.addEventListener("click", function () {
      var alert = banjirPanel.classList.toggle("is-alert");
      banjirBtn.textContent = "";
      var i = document.createElement("i");
      banjirBtn.appendChild(i);
      banjirBtn.appendChild(document.createTextNode(alert ? "Return to standby" : "Raise alert state"));
      if (banjirStatus) banjirStatus.textContent = alert ? "ALERT" : "STANDBY";
      banjirBtn.classList.toggle("is-on", alert);
      banjirBtn.setAttribute("aria-pressed", alert ? "true" : "false");
    });
  }

  // Agent dispatch
  var agentBtn = $("#agentDispatch");
  if (agentBtn) {
    var agentLines = $("#agentLines");
    var dispatchStep = 0;
    var dispatchTasks = [
      ["Planner", "parsing incoming request"],
      ["InvoiceAgent", "extracting line items"],
      ["ReportLabEngine", "generated signed PDF (0.42s)"],
      ["TelegramGateway", "dispatched via encrypted channel"]
    ];
    agentBtn.addEventListener("click", function () {
      if (!agentLines) return;
      var newLines = agentLines.querySelectorAll(".console-line-new");
      Array.prototype.forEach.call(newLines, function (l) { l.remove(); });
      var messages = dispatchTasks.concat([dispatchTasks[dispatchStep % dispatchTasks.length]]);
      dispatchStep++;
      messages.forEach(function (pair, i) {
        setTimeout(function () {
          var p = document.createElement("p");
          p.className = "console-line-new";
          p.textContent = "› " + pair[0] + ": " + pair[1];
          agentLines.appendChild(p);
          while (agentLines.children.length > 7) agentLines.removeChild(agentLines.firstElementChild);
        }, i * 360);
      });
    });
  }

  // Invoice architecture nodes
  var archText = $("#archText");
  var archCopy = {
    app: "The web app captures invoice details and authenticates operators before sending a request.",
    worker: "Cloudflare Workers run the billing logic at the edge, close to the operator.",
    db: "Cloudflare D1 stores invoice records in distributed SQLite with low-latency sync.",
    pdf: "A vector PDF is generated dynamically for a clean, printable invoice.",
    wa: "The WhatsApp Business bot dispatches quotations and invoices automatically."
  };
  $$(".arch-node").forEach(function (node) {
    node.addEventListener("click", function () {
      $$(".arch-node").forEach(function (n) { n.classList.remove("is-active"); });
      node.classList.add("is-active");
      if (archText) archText.textContent = archCopy[node.getAttribute("data-arch")] || "";
    });
  });

  // News guard
  var newsBtn = $("#newsGuard");
  if (newsBtn) {
    var goldStage = $(".gold-stage");
    var goldMode = $("#goldMode");
    newsBtn.addEventListener("click", function () {
      var off = goldStage.classList.toggle("is-guard-off");
      newsBtn.classList.toggle("is-on", !off);
      newsBtn.setAttribute("aria-pressed", off ? "false" : "true");
      newsBtn.innerHTML = "<i></i>" + (off ? "News guard: off" : "News guard: on");
      if (goldMode) goldMode.textContent = off ? "EVENT RISK / TRADES SUPPRESSED" : "NEWS GUARD / CLEAR";
    });
  }

  /* =======================================================================
     WORLDS INTERACTIONS
     ======================================================================= */
  // DevX terminal
  var terminal = $("#devxTerminal");
  var cmdOutputs = {
    deploy: ["> git push origin main", "Edge deploy queued · 14 files uploaded", "Live in 8.2s · status 200"],
    automate: ["> run automation --pipeline invoices", "OCR → validate → PDF → WhatsApp", "Pipeline complete · 0 manual steps"],
    prototype: ["> scaffold saas --stack edge", "Auth + D1 + dashboard generated", "Prototype ready for user testing"]
  };
  $$(".terminal-actions button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!terminal) return;
      var cmd = btn.getAttribute("data-cmd");
      var lines = cmdOutputs[cmd] || [];
      var p = document.createElement("p");
      p.innerHTML = '<span class="t-prompt">devx@studio ~ %</span> ' + cmd;
      terminal.appendChild(p);
      lines.forEach(function (line, i) {
        setTimeout(function () {
          var out = document.createElement("p");
          out.className = "t-out";
          out.textContent = line;
          terminal.appendChild(out);
          while (terminal.children.length > 9) terminal.removeChild(terminal.firstElementChild);
        }, 160 + i * 260);
      });
      var cursorP = document.createElement("p");
      cursorP.innerHTML = '<span class="t-prompt">devx@studio ~ %</span> <span class="t-cursor"></span>';
      setTimeout(function () {
        terminal.appendChild(cursorP);
        while (terminal.children.length > 9) terminal.removeChild(terminal.firstElementChild);
      }, 980);
    });
  });

  // Sejenak photobooth
  var shutter = $("#boothShutter");
  if (shutter) {
    var boothCount = 0;
    var boothCountEl = $("#boothCount");
    var flash = $(".sejenak-flash");
    var frames = $$(".booth-frame");
    var captions = [
      ["STAY", "A WHILE"],
      ["KEEP", "THE MOMENT"],
      ["MAKE", "IT STRANGE"],
      ["SNAP", "AGAIN"],
      ["ONE", "MORE TIME"]
    ];
    shutter.addEventListener("click", function () {
      boothCount++;
      if (boothCountEl) boothCountEl.textContent = boothCount + (boothCount === 1 ? " FRAME" : " FRAMES");
      if (flash) {
        flash.classList.remove("is-flashing");
        void flash.offsetWidth;
        flash.classList.add("is-flashing");
      }
      var frame = frames[(boothCount - 1) % frames.length];
      var cap = captions[(boothCount + 1) % captions.length];
      var b = frame.querySelector("b");
      if (b) b.innerHTML = cap[0] + "<br>" + cap[1];
      var face = frame.querySelector("i");
      if (face) {
        face.style.transform = "rotate(" + ((boothCount * 13) % 30 - 15) + "deg) scale(" + (0.86 + (boothCount % 4) * 0.07) + ")";
        face.style.borderRadius = (boothCount % 2 ? "38% 46% 42% 36%" : "45% 45% 40% 40%");
      }
      frame.classList.remove("is-new");
      void frame.offsetWidth;
      frame.classList.add("is-new");
      frame.style.transform = "rotate(" + ((boothCount % 5) - 2) * 1.4 + "deg)";
      setTimeout(function () { frame.style.transform = ""; }, 650);
    });
  }

  // Tinta filmstrip
  var filmCells = $$(".film-cell");
  var stills = $$(".tinta-still");
  filmCells.forEach(function (cell) {
    cell.addEventListener("click", function () {
      var idx = parseInt(cell.getAttribute("data-frame"), 10);
      if (isNaN(idx)) return;
      filmCells.forEach(function (c) { c.classList.toggle("is-active", c === cell); });
      stills.forEach(function (s) { s.classList.toggle("is-active", parseInt(s.getAttribute("data-still"), 10) === idx); });
    });
  });

  // BVR pattern
  $$(".bvr-swatch").forEach(function (sw) {
    sw.addEventListener("click", function () {
      var jersey = $("#bvrJersey");
      if (!jersey) return;
      $$(".bvr-swatch").forEach(function (s) { s.classList.remove("is-active"); });
      sw.classList.add("is-active");
      jersey.setAttribute("data-pattern", sw.getAttribute("data-pattern"));
    });
  });

  /* =======================================================================
     REVEALS
     ======================================================================= */
  var revealTargets = [];
  function markReveals() {
    var selectors = [
      ".ledger-head", ".ledger-row", ".ops-metrics",
      ".worlds-cover h2", ".worlds-cover > p", ".worlds-cover-index",
      ".world-copy", ".ecosystem", ".devx-terminal", ".sejenak-booth", ".tinta-stage", ".bvr-studio",
      ".record-head", ".record-column", ".availability-card",
      ".contact-kicker", ".contact-title", ".contact-actions", ".contact-bottom"
    ];
    selectors.forEach(function (sel) {
      $$(sel).forEach(function (el) {
        if (!el.classList.contains("reveal")) {
          el.classList.add("reveal");
          revealTargets.push(el);
        }
      });
    });
  }
  if (!reduced && "IntersectionObserver" in window) {
    markReveals();
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  }

  /* =======================================================================
     SCROLLTRIGGER EXTRAS
     ======================================================================= */
  if (hasGSAP && hasST && !reduced) {
    // Cinematic exit from the arrival scene
    var introSection = $("#intro");
    if (introSection) {
      window.gsap.to(".intro-content", {
        yPercent: -14,
        opacity: 0.25,
        ease: "none",
        scrollTrigger: { trigger: introSection, start: "top top", end: "bottom top", scrub: true }
      });
      window.gsap.to(".intro-bg", {
        scale: 1.08,
        opacity: 0.55,
        ease: "none",
        scrollTrigger: { trigger: introSection, start: "top top", end: "bottom top", scrub: true }
      });
    }

    // Manifesto word reveal
    var manifesto = $("#manifesto");
    if (manifesto) {
      var words = $$(".m-word", manifesto);
      window.gsap.set(words, { opacity: 0 });
      window.gsap.to(words, {
        opacity: 1,
        stagger: 0.08,
        ease: "none",
        scrollTrigger: {
          trigger: manifesto,
          start: "top 78%",
          end: "center 40%",
          scrub: 0.6
        }
      });
      window.gsap.to(".operator-watermark", {
        yPercent: 8,
        ease: "none",
        scrollTrigger: { trigger: ".operator-stage", start: "top bottom", end: "bottom top", scrub: 1 }
      });
    }

    // Light parallax on project art
    $$(".project-art").forEach(function (art) {
      window.gsap.fromTo(art, { yPercent: -2 }, {
        yPercent: 2,
        ease: "none",
        scrollTrigger: { trigger: art, start: "top bottom", end: "bottom top", scrub: 1 }
      });
    });

    // universe depth on entry
    window.gsap.from(".universe-head > *", {
      y: 24, opacity: 0, stagger: 0.1, duration: 1,
      scrollTrigger: { trigger: ".universe", start: "top 68%", toggleActions: "play none none none" }
    });

    // worlds cover
    window.gsap.from(".worlds-cover h2", {
      y: 50, opacity: 0, duration: 1.2, ease: "power4.out",
      scrollTrigger: { trigger: ".worlds-cover", start: "top 72%", toggleActions: "play none none none" }
    });

    // record rows
    $$(".record-row").forEach(function (row, i) {
      window.gsap.from(row, {
        y: 18, opacity: 0, duration: 0.7, ease: "power3.out", delay: (i % 6) * 0.04,
        scrollTrigger: { trigger: row, start: "top 88%", toggleActions: "play none none none" }
      });
    });

    // contact title
    window.gsap.from(".contact-title span", {
      yPercent: 20, opacity: 0, duration: 1.4, stagger: 0.12, ease: "power4.out",
      scrollTrigger: { trigger: ".contact", start: "top 60%", toggleActions: "play none none none" }
    });

    // refresh after fonts
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { window.ScrollTrigger.refresh(); });
    }
    window.addEventListener("load", function () {
      window.ScrollTrigger.refresh();
      updateScrollUI();
    });
  }

  /* =======================================================================
     EMAIL / TOAST
     ======================================================================= */
  var copyBtn = $("#copyEmail");
  var toast = $("#toast");
  var toastText = $("#toastText");
  function showToast(msg) {
    if (!toast) return;
    if (toastText) toastText.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { toast.classList.remove("is-visible"); }, 2600);
  }
  if (copyBtn) {
    copyBtn.addEventListener("click", async function (e) {
      e.preventDefault();
      var email = "suhaibhamidun@gmail.com";
      try {
        await navigator.clipboard.writeText(email);
        showToast("Copied  /  " + email);
      } catch (err) {
        try {
          var temp = document.createElement("textarea");
          temp.value = email;
          temp.setAttribute("readonly", "");
          temp.style.position = "fixed";
          temp.style.opacity = "0";
          document.body.appendChild(temp);
          temp.select();
          document.execCommand("copy");
          document.body.removeChild(temp);
          showToast("Copied  /  " + email);
        } catch (fallbackErr) {
          showToast("Email  /  " + email);
        }
      }
    });
  }

  /* =======================================================================
     BOOTSTRAP
     ======================================================================= */
  // Tone map used by the fixed header and chapter rail.
  var toneMap = [
    ["#intro", "dark"], ["#operator", "light"], ["#universe", "dark"],
    ["#work", "dark"], ["#worlds", "dark"], ["#record", "light"], ["#contact", "dark"]
  ];
  toneMap.forEach(function (pair) {
    var el = $(pair[0]);
    if (el) el.setAttribute("data-tone", pair[1]);
  });
  $$(".world").forEach(function (el) {
    el.setAttribute("data-tone", el.classList.contains("world-sejenak") || el.classList.contains("world-bvrcode") ? "light" : "dark");
  });
  workPanels = $$(".project");
  projectCount = workPanels.length;
  workPanels.forEach(function (el) {
    el.setAttribute("data-tone", el.classList.contains("project-histo") || el.classList.contains("project-duits") ? "light" : "dark");
  });

  initIntroScene();
  initUniverse();
  setupWork();
  initHisto();
  initGoldChart();
  bindJumpLinks(document);

  // initial tone
  setTimeout(syncTone, 60);
  window.addEventListener("load", function () {
    setTimeout(syncTone, 120);
    setTimeout(function () { if (hasST) window.ScrollTrigger.refresh(); }, 500);
  });
  // refresh tone after scroll stops
  window.addEventListener("scroll", debounce(syncTone, 140), { passive: true });

  // Clean up hidden contexts when leaving
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && lenis) lenis.stop();
    if (!document.hidden && lenis && !menuOpen) lenis.start();
  });
})();
