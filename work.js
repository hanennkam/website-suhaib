/* ==========================================================================
   WORK — selected work reveals, count-up stats and lazy demos.
   Demo logic is bound only when a project panel is within 400px of the
   viewport. No demo JS runs during the initial load.
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var supportsIO = "IntersectionObserver" in window;
  var work = document.getElementById("work");
  if (!work) return;
  document.documentElement.dataset.workReady = "1";

  var revealTargets = Array.prototype.slice.call(
    work.querySelectorAll(".work-intro, .project-panel, .more-work")
  );
  var demoPanels = Array.prototype.slice.call(
    work.querySelectorAll(".project-demo[data-demo]")
  );
  var statEls = Array.prototype.slice.call(
    work.querySelectorAll("[data-count]")
  );

  function addVisible(el) {
    el.classList.add("is-visible");
  }

  function observeReveals() {
    if (reduced || !supportsIO) {
      revealTargets.forEach(addVisible);
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        addVisible(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    revealTargets.forEach(function (el) { observer.observe(el); });
  }

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function formatStat(value, decimals, suffix) {
    return value.toFixed(decimals) + (suffix || "");
  }

  function animateStat(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = "1";
    if (reduced) return;

    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var start = 0;
    var duration = 1400;

    // Reserve the final width so count-up cannot shift the row.
    var stat = el.closest(".stat");
    if (stat) stat.style.minWidth = Math.ceil(stat.getBoundingClientRect().width) + "px";
    el.style.whiteSpace = "nowrap";

    function frame(now) {
      if (!start) start = now;
      var p = Math.min(1, (now - start) / duration);
      el.textContent = formatStat(target * easeOutExpo(p), decimals, suffix);
      if (p < 1) window.requestAnimationFrame(frame);
      else el.textContent = formatStat(target, decimals, suffix);
    }
    window.requestAnimationFrame(frame);
  }

  function observeStats() {
    if (reduced || !supportsIO) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateStat(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    statEls.forEach(function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------------- lazy demo loading */
  var demosLoading = false;
  var demosReady = false;
  var demoQueue = [];

  function loadDemos(callback) {
    if (demosReady || window.WorkDemos) {
      callback();
      return;
    }
    demoQueue.push(callback);
    if (demosLoading) return;
    demosLoading = true;
    var script = document.createElement("script");
    script.src = "work-demos.js";
    script.async = true;
    script.onload = function () {
      demosReady = true;
      var queue = demoQueue.splice(0);
      queue.forEach(function (fn) { fn(); });
    };
    script.onerror = function () {
      demoQueue = [];
      demosLoading = false;
    };
    document.head.appendChild(script);
  }

  function initDemo(panel) {
    var id = panel.getAttribute("data-demo");
    loadDemos(function () {
      if (window.WorkDemos) window.WorkDemos.init(id);
    });
  }

  function observeDemos() {
    if (!supportsIO) {
      demoPanels.forEach(initDemo);
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        initDemo(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "400px 0px", threshold: 0.01 });
    demoPanels.forEach(function (el) { observer.observe(el); });
  }

  observeReveals();
  observeStats();
  observeDemos();
})();
