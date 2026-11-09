/* ==========================================================================
   AHMAD SUHAIB — THE SIGNAL ARCHIVE
   Experience engine: navigation, smooth scroll, page background, worlds and
   progressive enhancements. Hero and work live in their own modules.
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
      // world jumps are handled separately
      if (a.hasAttribute("data-jump-world")) return;
      e.preventDefault();
      scrollToEl(target, 0);
    });
  });

  /* =======================================================================
     WORLD JUMPS
     ======================================================================= */
  function bindWorldJumps() {
    $$("[data-jump-world]").forEach(function (el) {
      if (el.dataset.bound) return;
      el.dataset.bound = "1";
      el.addEventListener("click", function (e) {
        e.preventDefault();
        var world = document.querySelector('.world[data-world="' + el.getAttribute("data-jump-world") + '"]');
        if (world) scrollToEl(world, 82);
      });
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
      ".world-copy", ".ecosystem", ".devx-terminal", ".sejenak-booth", ".tinta-stage", ".bvr-studio", ".duits-world-visual",
      ".brand-gallery", ".duits-capture-strip",
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

    // Editorial photography: subtle scroll depth + reveal
    $$("[data-parallax]").forEach(function (el) {
      var speed = parseFloat(el.getAttribute("data-parallax")) || 0.06;
      window.gsap.fromTo(el, { y: -speed * 120 }, {
        y: speed * 120,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.9 }
      });
      window.gsap.from(el, {
        opacity: 0,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 92%", toggleActions: "play none none none" }
      });
    });

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
  // Tone map used by the fixed header and chapter rail.
  var toneMap = [
    ["#intro", "light"], ["#operator", "light"], ["#universe", "light"],
    ["#work", "light"], ["#worlds", "dark"], ["#record", "light"], ["#contact", "dark"]
  ];
  toneMap.forEach(function (pair) {
    var el = $(pair[0]);
    if (el) el.setAttribute("data-tone", pair[1]);
  });
  $$(".world").forEach(function (el) {
    el.setAttribute("data-tone", "dark");
  });
  initPageBackground();
  bindWorldJumps();

  // Failsafe: if work.js fails to load, keep the selected work readable.
  window.setTimeout(function () {
    if (root.dataset.workReady) return;
    $$(".work-intro, .project-panel, .more-work").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }, 2500);

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
