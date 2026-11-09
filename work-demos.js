/* ==========================================================================
   WORK DEMOS — loaded only when a project demo approaches the viewport.
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initDuits() {
    var btn = document.getElementById("duitsParse");
    var status = document.getElementById("duitsStatus");
    var announce = document.getElementById("duitsAnnounce");
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = "1";
    var busy = false;
    var values = {
      merchant: "LOTUS'S",
      total: "RM 142.50",
      tax: "RM 6.20",
      category: "GROCERIES"
    };

    btn.addEventListener("click", function () {
      if (busy) return;
      busy = true;
      btn.setAttribute("aria-busy", "true");
      btn.textContent = "Parsing…";
      if (status) status.textContent = "Parsing…";
      if (announce) announce.textContent = "Parsing receipt.";
      Array.prototype.forEach.call(document.querySelectorAll("[data-receipt]"), function (el) {
        el.textContent = "···";
      });

      var delay = reduced ? 0 : 500;
      window.setTimeout(function () {
        Object.keys(values).forEach(function (key) {
          var el = document.querySelector('[data-receipt="' + key + '"]');
          if (el) el.textContent = values[key];
        });
        if (status) status.textContent = "Parsed";
        if (announce) announce.textContent = "Parsed: LOTUS'S, RM 142.50, tax RM 6.20, groceries.";
        btn.removeAttribute("aria-busy");
        btn.textContent = "Parse a receipt";
        busy = false;
      }, delay);
    });
  }

  function initBanjir() {
    var btn = document.getElementById("banjirToggle");
    var status = document.getElementById("banjirStatus");
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = "1";
    var card = btn.closest(".demo-card");
    var alert = false;

    btn.addEventListener("click", function () {
      alert = !alert;
      if (status) status.textContent = alert ? "Alert" : "Standby";
      btn.textContent = alert ? "Return to standby" : "Raise alert state";
      btn.setAttribute("aria-pressed", alert ? "true" : "false");
      if (card) card.classList.toggle("is-alert", alert);
    });
  }

  function initAgents() {
    var btn = document.getElementById("agentDispatch");
    var lines = document.getElementById("agentLines");
    var status = document.getElementById("agentStatus");
    if (!btn || !lines || btn.dataset.bound) return;
    btn.dataset.bound = "1";
    var busy = false;
    var tasks = [
      ["Planner", "parsing incoming request"],
      ["InvoiceAgent", "extracting line items"],
      ["ReportLabEngine", "generated signed PDF (0.42s)"],
      ["TelegramGateway", "dispatched via encrypted channel"]
    ];

    btn.addEventListener("click", function () {
      if (busy) return;
      busy = true;
      btn.setAttribute("aria-busy", "true");
      btn.textContent = "Dispatching…";
      if (status) status.textContent = "Dispatching…";
      lines.innerHTML = "";

      tasks.forEach(function (task, index) {
        window.setTimeout(function () {
          var p = document.createElement("p");
          p.className = "agent-line";
          p.textContent = task[0] + ": " + task[1];
          lines.appendChild(p);
          if (index === tasks.length - 1) {
            if (status) status.textContent = "Dispatched";
            btn.removeAttribute("aria-busy");
            btn.textContent = "Dispatch a task";
            busy = false;
          }
        }, reduced ? 0 : 120 * index);
      });
    });
  }

  var initialisers = {
    duits: initDuits,
    banjir: initBanjir,
    agents: initAgents
  };

  window.WorkDemos = {
    init: function (id) {
      if (initialisers[id]) initialisers[id]();
    }
  };
})();
