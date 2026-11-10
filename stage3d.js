/* ==========================================================================
   STAGE3D — one transparent WebGLRenderer for the whole site.
   Generic API for hero (Phase B) and the pinned camera -> kiosk -> jersey
   sequence (Phase D). No hero-specific logic lives here.
   ========================================================================== */
(function (global) {
  "use strict";

  var THREE = null;
  var renderer = null;
  var scene = null;
  var camera = null;
  var modelRoot = null;
  var envTarget = null;
  var canvas = null;
  var container = null;
  var raf = 0;
  var running = false;
  var pausedByVisibility = false;
  var initialized = false;
  var quality = "desktop";
  var frameCallback = null;
  var contextLostCallback = null;
  var activeId = null;
  var models = Object.create(null);
  var lastTime = 0;
  var resizeObserver = null;

  function isMobileQuality() {
    return (
      (global.matchMedia && global.matchMedia("(pointer: coarse)").matches) ||
      global.innerWidth < 768 ||
      (global.navigator && global.navigator.hardwareConcurrency <= 4)
    );
  }

  function webglAvailable() {
    try {
      var test = document.createElement("canvas");
      return !!(
        global.WebGLRenderingContext &&
        (test.getContext("webgl") || test.getContext("experimental-webgl"))
      );
    } catch (err) {
      return false;
    }
  }

  function createEnvironment(rendererInstance) {
    var envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x101012);

    var panelGeo = new THREE.PlaneGeometry(12, 12);
    var white = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    var soft = new THREE.MeshBasicMaterial({ color: 0xd9dde3, side: THREE.DoubleSide });
    var grey = new THREE.MeshBasicMaterial({ color: 0x4a4d52, side: THREE.DoubleSide });

    function panel(material, x, y, z, rx, ry, sx, sy) {
      var mesh = new THREE.Mesh(panelGeo, material);
      mesh.position.set(x, y, z);
      mesh.rotation.set(rx, ry, 0);
      mesh.scale.set(sx, sy, 1);
      envScene.add(mesh);
    }

    // Large softboxes: left, top-left and right rear. Grey bounce below.
    panel(white, -5.2, 2.8, 3.2, 0, Math.PI / 2.35, 0.72, 0.9);
    panel(white, -1.8, 5.4, 2.0, Math.PI / 2.1, 0, 0.9, 0.7);
    panel(soft, 5.2, 2.5, -2.4, 0, -Math.PI / 2.4, 0.7, 0.8);
    panel(grey, 0, -4.2, 0, -Math.PI / 2, 0, 1.2, 1.2);
    panel(soft, 0, 1.6, -5.0, 0, 0, 1.1, 0.9);

    var pmrem = new THREE.PMREMGenerator(rendererInstance);
    var target = pmrem.fromScene(envScene, 0.04);
    pmrem.dispose();
    panelGeo.dispose();
    white.dispose();
    soft.dispose();
    grey.dispose();
    return target;
  }

  function applyMaterials(root) {
    root.traverse(function (obj) {
      if (!obj.isMesh || !obj.material) return;
      var list = Array.isArray(obj.material) ? obj.material : [obj.material];
      list.forEach(function (mat) {
        if (!mat) return;
        if ("envMapIntensity" in mat) mat.envMapIntensity = 1.12;
        if ("metalness" in mat && mat.metalness > 0.75) mat.envMapIntensity = 1.28;
        if (mat.map && "encoding" in mat.map) mat.map.encoding = THREE.sRGBEncoding;
        if (!mat.userData) mat.userData = {};
        if (mat.userData.__stageOpacity === undefined) {
          mat.userData.__stageOpacity = mat.opacity;
          mat.userData.__stageTransparent = mat.transparent;
          mat.userData.__stageDepthWrite = mat.depthWrite;
        }
        mat.needsUpdate = true;
      });
      obj.castShadow = false;
      obj.receiveShadow = false;
    });
  }

  function setGroupOpacity(group, opacity, materials) {
    var value = Math.max(0, Math.min(1, opacity));
    var list = materials;
    if (!list) {
      list = [];
      group.traverse(function (obj) {
        if (!obj.isMesh || !obj.material) return;
        (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(function (mat) {
          if (mat) list.push(mat);
        });
      });
    }
    list.forEach(function (mat) {
      if (!mat) return;
      var original = mat.userData && mat.userData.__stageOpacity;
      var targetOpacity = value >= 0.999
        ? (original === undefined ? 1 : original)
        : value * (original === undefined ? 1 : original);
      var targetTransparent = value >= 0.999
        ? (mat.userData ? mat.userData.__stageTransparent : false)
        : true;
      var targetDepthWrite = mat.userData ? mat.userData.__stageDepthWrite : true;
      var shaderChange = mat.transparent !== targetTransparent || mat.depthWrite !== targetDepthWrite;
      if (mat.opacity !== targetOpacity) mat.opacity = targetOpacity;
      if (mat.transparent !== targetTransparent) mat.transparent = targetTransparent;
      if (mat.depthWrite !== targetDepthWrite) mat.depthWrite = targetDepthWrite;
      if (shaderChange) mat.needsUpdate = true;
    });
  }

  function resize() {
    if (!renderer || !container) return;
    var rect = container.getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width || container.clientWidth || 1));
    var h = Math.max(1, Math.round(rect.height || container.clientHeight || 1));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderOnce();
  }

  function renderOnce() {
    if (!renderer || !scene || !camera) return;
    renderer.render(scene, camera);
  }

  function frame(now) {
    if (!running) return;
    raf = global.requestAnimationFrame(frame);
    var delta = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 0.016;
    lastTime = now;
    if (frameCallback) frameCallback({ time: now / 1000, delta: delta, quality: quality });
    renderOnce();
  }

  function start() {
    if (!initialized || running) return;
    running = true;
    lastTime = 0;
    raf = global.requestAnimationFrame(frame);
  }

  function pause() {
    running = false;
    if (raf) {
      global.cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function loadModel(id, url, options) {
    if (!initialized) return Promise.reject(new Error("Stage3D is not initialised"));
    THREE = global.THREE;
    if (models[id]) return Promise.resolve(models[id]);
    return new Promise(function (resolve, reject) {
      var loader = new THREE.GLTFLoader();
      loader.load(
        url,
        function (gltf) {
          var model = gltf.scene;
          applyMaterials(model);

          var box = new THREE.Box3().setFromObject(model);
          var size = box.getSize(new THREE.Vector3());
          var center = box.getCenter(new THREE.Vector3());
          var maxDim = Math.max(size.x, size.y, size.z) || 1;
          var targetSize = (options && options.targetSize) || 3.6;
          var scale = targetSize / maxDim;

          model.scale.setScalar(scale);
          model.position.set(
            -center.x * scale,
            -center.y * scale,
            -center.z * scale
          );

          var group = new THREE.Group();
          group.visible = false;
          group.add(model);
          modelRoot.add(group);

          var materials = [];
          model.traverse(function (obj) {
            if (!obj.isMesh || !obj.material) return;
            (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(function (mat) {
              if (mat && materials.indexOf(mat) === -1) materials.push(mat);
            });
          });

          var item = {
            id: id,
            group: group,
            model: model,
            materials: materials,
            baseScale: scale,
            height: size.y * scale
          };
          models[id] = item;
          resolve(item);
        },
        undefined,
        function (err) {
          reject(err || new Error("Model load failed"));
        }
      );
    });
  }

  function setState(id, next) {
    var item = models[id];
    if (!item) return false;
    var group = item.group;
    if (!next) return true;

    if (next.rotation) {
      group.rotation.set(
        next.rotation.x || 0,
        next.rotation.y || 0,
        next.rotation.z || 0
      );
    }
    if (next.scale !== undefined) group.scale.setScalar(next.scale);
    if (next.position) {
      group.position.set(
        next.position.x || 0,
        next.position.y || 0,
        next.position.z || 0
      );
    }
    if (next.opacity !== undefined) setGroupOpacity(group, next.opacity, item.materials);
    group.visible = next.opacity === undefined ? true : next.opacity > 0.001;
    if (next.opacity !== undefined && next.opacity > 0.001) activeId = id;
    return true;
  }

  function init(options) {
    if (initialized) return api;
    if (!global.THREE || !global.THREE.GLTFLoader) {
      throw new Error("Three.js and GLTFLoader must be loaded before Stage3D.init");
    }
    THREE = global.THREE;

    canvas = options.canvas;
    container = options.container || canvas.parentElement;
    quality = options.quality || (isMobileQuality() ? "mobile" : "desktop");
    frameCallback = options.onFrame || null;
    contextLostCallback = options.onContextLost || null;

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: quality !== "mobile",
      powerPreference: "high-performance",
      preserveDrawingBuffer: !!options.preserveDrawingBuffer
    });
    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, quality === "mobile" ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    if ("physicallyCorrectLights" in renderer) renderer.physicallyCorrectLights = true;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.55, 5.8);
    camera.lookAt(0, -0.05, 0);

    try {
      envTarget = createEnvironment(renderer);
      scene.environment = envTarget.texture;
    } catch (err) {
      scene.environment = null;
    }

    var hemi = new THREE.HemisphereLight(0xffffff, 0x5d6068, 0.68);
    scene.add(hemi);

    var key = new THREE.DirectionalLight(0xfff6ec, 2.7);
    key.position.set(-4.2, 5.4, 4.0);
    scene.add(key);

    var rim = new THREE.DirectionalLight(0xdce9ff, 1.35);
    rim.position.set(4.2, 2.4, -4.0);
    scene.add(rim);

    var fill = new THREE.DirectionalLight(0xffffff, 0.45);
    fill.position.set(0, -1.6, 3.0);
    scene.add(fill);

    modelRoot = new THREE.Group();
    scene.add(modelRoot);

    canvas.addEventListener("webglcontextlost", function (event) {
      event.preventDefault();
      pause();
      if (contextLostCallback) contextLostCallback();
    });

    if (global.ResizeObserver) {
      resizeObserver = new ResizeObserver(function () { resize(); });
      resizeObserver.observe(container);
    } else {
      global.addEventListener("resize", resize);
    }

    initialized = true;
    resize();
    start();
    return api;
  }

  function setContainer(next) {
    if (!next || !renderer) return;
    if (resizeObserver) resizeObserver.disconnect();
    container = next;
    if (global.ResizeObserver) {
      resizeObserver = new ResizeObserver(function () { resize(); });
      resizeObserver.observe(container);
    }
    resize();
  }

  function setFrameCallback(fn) {
    frameCallback = typeof fn === "function" ? fn : null;
  }

  function setCameraZ(value) {
    if (!camera) return;
    camera.position.z = value;
    camera.lookAt(0, -0.05, 0);
  }

  function snapshot(type, imageQuality) {
    if (!initialized) return "";
    renderOnce();
    return canvas.toDataURL(type || "image/png", imageQuality);
  }

  function dispose() {
    pause();
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    } else {
      global.removeEventListener("resize", resize);
    }
    if (scene) {
      scene.traverse(function (obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          var list = Array.isArray(obj.material) ? obj.material : [obj.material];
          list.forEach(function (mat) {
            if (!mat) return;
            if (mat.map) mat.map.dispose();
            mat.dispose();
          });
        }
      });
    }
    if (envTarget) envTarget.dispose();
    if (renderer) renderer.dispose();
    initialized = false;
    renderer = scene = camera = modelRoot = envTarget = null;
    canvas = container = null;
    models = Object.create(null);
  }

  var api = {
    init: init,
    loadModel: loadModel,
    setState: setState,
    pause: pause,
    resume: function () {
      if (!pausedByVisibility) start();
    },
    setVisibilityPaused: function (paused) {
      pausedByVisibility = !!paused;
      if (pausedByVisibility) pause();
      else start();
    },
    renderOnce: renderOnce,
    resize: resize,
    setContainer: setContainer,
    setFrameCallback: setFrameCallback,
    setCameraZ: setCameraZ,
    snapshot: snapshot,
    dispose: dispose,
    isSupported: function () {
      return !!global.THREE && !!global.THREE.GLTFLoader && webglAvailable();
    },
    isInitialized: function () { return initialized; },
    isRunning: function () { return running; },
    getQuality: function () { return quality; },
    getCanvas: function () { return canvas; }
  };

  global.Stage3D = api;
})(window);
