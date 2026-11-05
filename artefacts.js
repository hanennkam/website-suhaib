/* ==========================================================================
   AHMAD SUHAIB — ARTEFACTS VIEWER
   One WebGL context, three glTF models, orbit + zoom, lazy + paused offscreen.
   Falls back to authored Blender stills when WebGL is unavailable.
   ========================================================================== */
(function () {
  "use strict";

  var stage = document.getElementById("artefacts");
  if (!stage) return;

  var stageEl = stage.querySelector(".artefacts-stage");

  var canvas = document.getElementById("artefactCanvas");
  var loaderEl = document.getElementById("artefactLoader");
  var loaderLabel = loaderEl ? loaderEl.querySelector("span") : null;
  var fallback = document.getElementById("artefactFallback");
  var fallbackImg = document.getElementById("artefactFallbackImg");
  var indexEl = document.getElementById("artefactIndex");
  var specEl = document.getElementById("artefactSpec");
  var tabs = Array.prototype.slice.call(stage.querySelectorAll(".artefacts-tab"));

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasThree = typeof window.THREE !== "undefined";
  var hasLoader = hasThree && typeof window.THREE.GLTFLoader !== "undefined";

  var MODELS = [
    {
      id: "camera",
      file: "assets/models/camera.glb",
      still: "assets/models/camera.jpg",
      label: "Mirrorless camera",
      hud: "CAMERA · 41.9K TRIS · 8 PBR MATERIALS",
      specs: {
        object: "Mirrorless camera + 35 mm prime",
        build: "Modelled in Blender 5.2",
        geometry: "41,966 triangles · 1.2 MB glTF",
        materials: "Anodised alloy, rubber, chrome, coated glass"
      }
    },
    {
      id: "photobooth",
      file: "assets/models/photobooth.glb",
      still: "assets/models/photobooth.jpg",
      label: "Photobooth kiosk",
      hud: "KIOSK · 25K TRIS · EMISSIVE UI",
      specs: {
        object: "Sejenak / Terabooth event kiosk",
        build: "Modelled in Blender 5.2",
        geometry: "25,122 triangles · 1.2 MB glTF",
        materials: "Painted shell, emissive ring flash, printed paper"
      }
    },
    {
      id: "jersey",
      file: "assets/models/jersey.glb",
      still: "assets/models/jersey.jpg",
      label: "Sports jersey",
      hud: "JERSEY · 26K TRIS · CLOTH + WEAVE",
      specs: {
        object: "BVRCODE sublimated jersey",
        build: "Modelled in Blender 5.2",
        geometry: "26,004 triangles · 2.1 MB glTF",
        materials: "Knit weave maps, printed crest, ribbed trim"
      }
    }
  ];

  var active = 0;
  var renderer = null;
  var scene = null;
  var camera = null;
  var controls = null;
  var group = null;          // holds the current model
  var current = null;
  var clock = null;
  var raf = 0;
  var booted = false;
  var inView = false;
  var heights = {};
  var cache = {};
  var shadowMesh = null;

  /* ------------------------------------------------------------------ UI */
  function paintUI(i) {
    var m = MODELS[i];
    tabs.forEach(function (t, n) {
      t.setAttribute("aria-selected", n === i ? "true" : "false");
      t.tabIndex = n === i ? 0 : -1;
    });
    if (indexEl) indexEl.textContent = pad(i + 1) + " / " + pad(MODELS.length);
    if (specEl) specEl.textContent = m.hud;
    if (canvas) canvas.setAttribute("aria-label", m.label + " — interactive 3D model, drag to rotate");
    var s = m.specs;
    Object.keys(s).forEach(function (k) {
      var el = stage.querySelector('[data-spec="' + k + '"]');
      if (el) el.textContent = s[k];
    });
    if (fallbackImg) {
      fallbackImg.src = m.still;
      fallbackImg.alt = "Blender render of the " + m.label.toLowerCase();
    }
  }

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function setLoading(on, label) {
    if (!stageEl) return;
    stageEl.classList.toggle("is-loading", !!on);
    if (loaderLabel && label) loaderLabel.textContent = label;
  }

  function showFallback(reason) {
    setLoading(false);
    if (fallback) fallback.hidden = false;
    if (canvas) canvas.style.display = "none";
    if (specEl && reason) specEl.textContent = reason;
  }

  /* -------------------------------------------------------------- three.js */
  function shadowTexture() {
    var c = document.createElement("canvas");
    c.width = c.height = 256;
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(128, 128, 4, 128, 128, 126);
    g.addColorStop(0, "rgba(0,0,0,0.72)");
    g.addColorStop(0.45, "rgba(0,0,0,0.30)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function initScene() {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    if ("outputEncoding" in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
    if ("toneMapping" in renderer) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.06;
    }

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(1.6, 1.35, 2.5);

    scene.add(new THREE.HemisphereLight(0x9ec9ff, 0x080808, 0.55));

    var key = new THREE.DirectionalLight(0xfff4e8, 2.7);
    key.position.set(2.6, 3.4, 2.6);
    scene.add(key);

    var rimWarm = new THREE.DirectionalLight(0xff5a2a, 2.1);
    rimWarm.position.set(-3.0, 1.4, -2.6);
    scene.add(rimWarm);

    var rimCool = new THREE.DirectionalLight(0x6ed8ff, 1.6);
    rimCool.position.set(2.8, 0.9, -3.0);
    scene.add(rimCool);

    var fill = new THREE.DirectionalLight(0xbdeaff, 0.55);
    fill.position.set(0, -1.2, 3.2);
    scene.add(fill);

    group = new THREE.Group();
    scene.add(group);

    shadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 4.4),
      new THREE.MeshBasicMaterial({
        map: shadowTexture(),
        transparent: true,
        depthWrite: false,
        opacity: 0.85
      })
    );
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.002;
    shadowMesh.visible = false;
    scene.add(shadowMesh);

    clock = new THREE.Clock();

    if (typeof THREE.OrbitControls === "function") {
      controls = new THREE.OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.075;
      controls.enablePan = false;
      controls.rotateSpeed = 0.85;
      controls.zoomSpeed = 0.7;
      controls.minPolarAngle = 0.18;
      controls.maxPolarAngle = Math.PI / 2 + 0.10;
      controls.autoRotate = !reduced;
      controls.autoRotateSpeed = 0.55;
      controls.addEventListener("start", function () {
        controls.autoRotate = false;
      });
      controls.addEventListener("end", function () {
        if (!reduced) {
          clearTimeout(controls._resume);
          controls._resume = setTimeout(function () {
            if (controls) controls.autoRotate = true;
          }, 5200);
        }
      });
    }

    booted = true;
  }

  function frameModel(object3d) {
    var box = new THREE.Box3().setFromObject(object3d);
    var size = box.getSize(new THREE.Vector3());
    var center = box.getCenter(new THREE.Vector3());
    var maxDim = Math.max(size.x, size.y, size.z) || 1;
    var scale = 1.55 / maxDim;

    object3d.scale.setScalar(scale);
    object3d.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

    // rest the object on the shadow plane
    var box2 = new THREE.Box3().setFromObject(object3d);
    object3d.position.y -= box2.min.y;
    var h = box2.max.y - box2.min.y;
    heights[active] = h;

    var dist = Math.max(2.2, h * 2.35);
    camera.position.set(dist * 0.62, h * 0.72, dist * 0.78);
    if (controls) {
      controls.target.set(0, h * 0.48, 0);
      controls.minDistance = h * 1.25;
      controls.maxDistance = h * 3.4;
      controls.update();
    } else {
      camera.lookAt(new THREE.Vector3(0, h * 0.48, 0));
    }

    if (shadowMesh) {
      shadowMesh.position.y = 0.004;
      shadowMesh.scale.setScalar(Math.max(0.8, h * 0.95));
      shadowMesh.visible = true;
    }
  }

  function applyMaterials(root) {
    root.traverse(function (o) {
      if (!o.isMesh || !o.material) return;
      var mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach(function (m) {
        if (!m) return;
        m.side = THREE.FrontSide;
        if (m.emissive && /screen|glow|flash/i.test(m.name || "")) {
          // KHR_materials_emissive_strength is not read by three r128
          m.emissiveIntensity = 1.6;
        }
        if (m.map && "encoding" in m.map) m.map.encoding = THREE.sRGBEncoding;
        m.needsUpdate = true;
      });
      o.castShadow = false;
      o.receiveShadow = false;
    });
  }

  function swapTo(i) {
    if (!booted) return;
    active = i;
    paintUI(i);

    if (!hasLoader) { showFallback("glTF loader unavailable — showing authored render"); return; }

    var m = MODELS[i];
    setLoading(true, "LOADING " + m.label.toUpperCase());

    function place(gltf) {
      if (group.children.length) {
        group.children.slice().forEach(function (c) {
          group.remove(c);
          c.traverse(function (o) {
            if (o.isMesh) {
              if (o.geometry) o.geometry.dispose();
              var mats = Array.isArray(o.material) ? o.material : [o.material];
              mats.forEach(function (mm) { if (mm && mm.dispose) mm.dispose(); });
            }
          });
        });
      }
      current = gltf.scene;
      applyMaterials(current);
      group.add(current);
      frameModel(current);
      setLoading(false);
      if (fallback) fallback.hidden = true;
      if (canvas) canvas.style.display = "block";
      renderOnce();
    }

    if (cache[m.id]) { place(cache[m.id]); return; }

    var loader = new THREE.GLTFLoader();
    loader.load(
      m.file,
      function (gltf) {
        cache[m.id] = gltf;
        try {
          if (active === i) place(gltf);
        } catch (err) {
          console.error("[artefacts] place failed", err && err.stack ? err.stack : err);
          showFallback("3D viewer error — showing authored render");
        }
      },
      function (ev) {
        if (ev && ev.total && loaderLabel) {
          var pct = Math.round((ev.loaded / ev.total) * 100);
          loaderLabel.textContent = "LOADING " + m.label.toUpperCase() + "  " + pct + "%";
        }
      },
      function () {
        if (active === i) showFallback("Model unavailable — showing authored render");
      }
    );
  }

  /* --------------------------------------------------------------- render */
  function renderOnce() {
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  function tick() {
    raf = requestAnimationFrame(tick);
    if (!inView || document.hidden) return;
    var t = clock.getElapsedTime();
    if (controls) controls.update();
    if (current && !reduced) {
      current.rotation.y = Math.sin(t * 0.18) * 0.045;
    }
    renderer.render(scene, camera);
  }

  function startLoop() {
    if (!booted || raf) return;
    raf = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  function resize() {
    if (!renderer) return;
    var rect = stage.querySelector(".artefacts-stage").getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width));
    var h = Math.max(1, Math.round(rect.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderOnce();
  }

  /* ------------------------------------------------------------------ wire */
  function select(i, scroll) {
    if (i < 0 || i >= MODELS.length) return;
    if (!booted) {
      // still allow tab switching of the authored stills
      active = i;
      paintUI(i);
      if (scroll && stage) {
        stage.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }
      return;
    }
    if (i !== active || !group.children.length) swapTo(i);
    else paintUI(i);
    if (scroll && stage) {
      stage.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { select(i, false); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % tabs.length;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = tabs.length - 1;
      if (next !== null) {
        e.preventDefault();
        select(next, false);
        tabs[next].focus();
      }
    });
  });

  // cross-links from the venture chapters
  Array.prototype.slice.call(document.querySelectorAll("[data-artefact-jump]")).forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var id = btn.getAttribute("data-artefact-jump");
      var idx = 0;
      MODELS.forEach(function (m, n) { if (m.id === id) idx = n; });
      select(idx, true);
    });
  });

  window.addEventListener("resize", function () {
    clearTimeout(window._artResize);
    window._artResize = setTimeout(resize, 160);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopLoop();
    else if (inView) startLoop();
  });

  paintUI(0);

  if (!hasThree || !hasLoader) {
    showFallback("3D viewer unavailable — showing authored render");
    return;
  }

  // boot only when the section approaches the viewport
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        inView = entry.isIntersecting;
        if (inView && !booted) {
          initScene();
          resize();
          swapTo(active);
          startLoop();
        } else if (inView) {
          startLoop();
        } else {
          stopLoop();
        }
      });
    }, { rootMargin: "280px 0px", threshold: 0.01 });
    io.observe(stage);
  } else {
    initScene();
    resize();
    swapTo(0);
    startLoop();
  }

  window.__artefacts = { select: function (id) {
    var idx = 0;
    MODELS.forEach(function (m, n) { if (m.id === id) idx = n; });
    select(idx, true);
  } };
})();
