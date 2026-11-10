/* ==========================================================================
   AHMAD SUHAIB — THE SIGNAL ARCHIVE
   Experience engine: navigation, smooth scroll, page background and
   progressive enhancements. Hero, work and objects live in their own modules.
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;
  var body = document.body;
  var hasGSAP = typeof window.gsap !== "undefined";
  var hasST = typeof window.ScrollTrigger !== "undefined";
  var lenis = null;

  if (reduced) root.classList.add("reduced-motion");
  if (hasGSAP && hasST) window.gsap.registerPlugin(window.ScrollTrigger);

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
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
     NAVIGATION / CHAPTER / TONE
     ======================================================================= */
  var mobileMenu = $("#mobileMenu");
  var menuToggle = $("#menuToggle");
  var menuClose = $("#menuClose");
  var menuOpen = false;

  var lastMenuFocus = null;

  function menuFocusables() {
    if (!mobileMenu) return [];
    return $$('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])', mobileMenu)
      .filter(function (el) { return el.offsetParent !== null; });
  }

  function setMenu(open) {
    if (!mobileMenu || !menuToggle) return;
    if (open && !menuOpen) {
      var active = document.activeElement;
      lastMenuFocus = active && active !== document.body && active !== document.documentElement
        ? active
        : menuToggle;
    }
    menuOpen = open;

    if (open) {
      mobileMenu.classList.add("is-open");
      mobileMenu.setAttribute("aria-hidden", "false");
      if ("inert" in mobileMenu) mobileMenu.inert = false;
      else mobileMenu.removeAttribute("inert");
      menuToggle.setAttribute("aria-expanded", "true");
      menuToggle.setAttribute("aria-label", "Close menu");
      body.classList.add("menu-open");
      if (lenis) lenis.stop();
      window.requestAnimationFrame(function () {
        var first = menuFocusables()[0];
        if (first) first.focus({ preventScroll: true });
      });
      return;
    }

    // Make the header visible again before returning focus to its toggle.
    body.classList.remove("menu-open");
    if (mobileMenu.contains(document.activeElement)) {
      var restore = lastMenuFocus &&
        lastMenuFocus !== document.body &&
        lastMenuFocus !== document.documentElement &&
        document.body.contains(lastMenuFocus) &&
        !mobileMenu.contains(lastMenuFocus)
        ? lastMenuFocus
        : menuToggle;
      restore.focus({ preventScroll: true });
    }

    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    if ("inert" in mobileMenu) mobileMenu.inert = true;
    else mobileMenu.setAttribute("inert", "");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
    if (lenis) lenis.start();
  }

  menuToggle && menuToggle.addEventListener("click", function () { setMenu(!menuOpen); });
  menuClose && menuClose.addEventListener("click", function () { setMenu(false); });
  $$("[data-menu-link]").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });

  mobileMenu && mobileMenu.addEventListener("keydown", function (e) {
    if (e.key !== "Tab" || !menuOpen) return;
    var focusables = menuFocusables();
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menuOpen) setMenu(false);
  });

  var chapterEls = $$("[data-chapter]");
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

  function syncNav(currentId) {
    var selector = ".header-nav a[href^='#'], .mobile-menu-nav a[href^='#']";
    $$(selector).forEach(function (link) {
      var active = link.getAttribute("href") === "#" + currentId;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  function updateScrollUI() {
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
        syncNav(current.id);
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
  var headerEl = $("#siteHeader");
  var headerOffset = function () {
    return (headerEl ? headerEl.offsetHeight : 52) + 12;
  };

  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var href = a.getAttribute("href");
      if (!href || href === "#") return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      var offset = target.id === "main" ? 0 : headerOffset();
      scrollToEl(target, offset);
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      if (window.history && window.history.pushState) window.history.pushState(null, "", href);
    });
  });

  /* =======================================================================
     REVEALS
     ======================================================================= */
  var revealTargets = [];
  function markReveals() {
    var selectors = [
      ".ledger-head", ".ledger-row", ".ops-metrics",
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
    }

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
     PAGE BACKGROUND — scroll-tied light/dark transition
     ======================================================================= */
  function initPageBackground() {
    var bg = $(".page-bg");
    var sections = $$("[data-bg]");
    if (!bg || !sections.length) return;

    function rgb(hex) {
      var n = parseInt(hex.replace("#", ""), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    function mix(a, b, t) {
      var ca = rgb(a), cb = rgb(b);
      return "rgb(" + Math.round(lerp(ca[0], cb[0], t)) + "," +
        Math.round(lerp(ca[1], cb[1], t)) + "," +
        Math.round(lerp(ca[2], cb[2], t)) + ")";
    }

    function update() {
      var vh = window.innerHeight;
      var y = window.pageYOffset;
      var color = sections[0].getAttribute("data-bg");

      for (var i = 1; i < sections.length; i++) {
        var boundary = sections[i].getBoundingClientRect().top + window.pageYOffset;
        if (y >= boundary) {
          color = sections[i].getAttribute("data-bg");
          continue;
        }
        if (!reduced) {
          var start = boundary - vh * 0.2;
          var end = boundary;
          if (y > start && y < end) {
            color = mix(sections[i - 1].getAttribute("data-bg"), sections[i].getAttribute("data-bg"), (y - start) / (end - start));
          }
        }
        break;
      }

      bg.style.backgroundColor = color;
    }

    var queued = false;
    function queue() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; update(); });
    }

    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", debounce(update, 150));
    update();
  }

  /* =======================================================================
     BOOTSTRAP
     ======================================================================= */
  // Tone map used by the fixed header.
  var toneMap = [
    ["#intro", "light"], ["#operator", "light"],
    ["#work", "light"], ["#pinned", "dark"], ["#record", "light"], ["#contact", "dark"]
  ];
  toneMap.forEach(function (pair) {
    var el = $(pair[0]);
    if (el) el.setAttribute("data-tone", pair[1]);
  });
  initPageBackground();

  // Failsafe: if work.js fails to load, keep the selected work readable.
  window.setTimeout(function () {
    if (root.dataset.workReady) return;
    $$(".work-intro, .project-panel, .more-work").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }, 2500);

  // Intro title failsafe (hero3d normally reveals it first).
  window.setTimeout(function () {
    var title = $(".intro-title");
    if (title && !title.classList.contains("is-revealed")) title.classList.add("is-revealed");
  }, 1200);

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
