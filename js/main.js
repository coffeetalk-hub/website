/* ==========================================================================
   The Sailors ART — main.js
   Vanilla JS, no dependencies. Handles:
   1. Mobile navigation toggle + active link
   2. Animated stat counters
   3. Scroll reveal
   4. Partner logo grids (from data/partners.js)
   5. Portfolio grid, filters and lightbox (from data/projects.js)
   6. Contact form (Netlify Forms, AJAX submit with graceful fallback)
   ========================================================================== */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------------
     1. Navigation
     --------------------------------------------------------------------- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", function (e) {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      setOpen(false);
    });

    // Close the menu when resizing up to desktop so state doesn't get stuck.
    var mq = window.matchMedia("(min-width: 900px)");
    var onChange = function (ev) { if (ev.matches) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener("change", onChange); else mq.addListener(onChange);

    // Mark the current page in the nav and footer.
    var path = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".site-nav a, .site-footer a").forEach(function (a) {
      var href = (a.getAttribute("href") || "").split("#")[0];
      if (href === path || (path === "index.html" && (href === "" || href === "./" || href === "/"))) {
        if (a.closest(".site-nav") && !a.classList.contains("btn")) a.setAttribute("aria-current", "page");
      }
    });
  }

  /* ---------------------------------------------------------------------
     2. Stat counters   <span data-count="480000" data-suffix="+">0</span>
     --------------------------------------------------------------------- */
  function formatNumber(n) {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var plain = el.hasAttribute("data-plain"); // e.g. a year: no thousands separator
    var render = function (v) { el.textContent = prefix + (plain ? Math.round(v) : formatNumber(v)) + suffix; };

    if (prefersReducedMotion || target === 0) { render(target); return; }

    var duration = 1800;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      render(target * eased);
      if (p < 1) requestAnimationFrame(step); else render(target);
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    var counters = document.querySelectorAll("[data-count]");
    if (!counters.length) return;
    if (!("IntersectionObserver" in window)) { counters.forEach(animateCounter); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCounter(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { io.observe(c); });
  }

  /* ---------------------------------------------------------------------
     3. Scroll reveal   add class="reveal" to any block
     --------------------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (i) { i.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (i) { io.observe(i); });
  }

  /* ---------------------------------------------------------------------
     4. Partner logo grids   <ul class="logo-grid" data-partners="clients" data-limit="6"></ul>
     --------------------------------------------------------------------- */
  function initials(name) {
    return name.replace(/[—–-].*$/, "").split(/\s+/).filter(Boolean).slice(0, 2)
      .map(function (w) { return w[0].toUpperCase(); }).join("");
  }

  function renderPartners() {
    var data = window.SAILORS_PARTNERS;
    if (!data) return;
    document.querySelectorAll("[data-partners]").forEach(function (container) {
      var group = data[container.getAttribute("data-partners")] || [];
      var limit = parseInt(container.getAttribute("data-limit"), 10);
      if (limit) group = group.slice(0, limit);
      container.innerHTML = "";
      group.forEach(function (p) {
        var li = document.createElement("li");
        var card = document.createElement(p.url ? "a" : "div");
        card.className = "logo-card";
        if (p.url) { card.href = p.url; card.target = "_blank"; card.rel = "noopener"; }

        if (p.logo) {
          var img = document.createElement("img");
          img.src = p.logo; img.alt = p.name + " logo"; img.loading = "lazy"; img.decoding = "async";
          img.width = 160; img.height = 56;
          card.appendChild(img);
        } else {
          var mono = document.createElement("span");
          mono.className = "logo-card__mono"; mono.setAttribute("aria-hidden", "true");
          mono.textContent = initials(p.name);
          card.appendChild(mono);
        }
        var name = document.createElement("span");
        name.className = "logo-card__name"; name.textContent = p.name;
        card.appendChild(name);
        if (p.note) {
          var note = document.createElement("span");
          note.className = "logo-card__note"; note.textContent = p.note;
          card.appendChild(note);
        }
        li.appendChild(card);
        container.appendChild(li);
      });
    });
  }

  /* ---------------------------------------------------------------------
     5. Portfolio grid + filters + lightbox
     --------------------------------------------------------------------- */
  var TYPE_LABELS = { mega: "Public Mega Event", corporate: "Corporate & Business", expo: "Expos & Fabrication" };

  function initWork() {
    var grid = document.getElementById("work-grid");
    var projects = window.SAILORS_PROJECTS;
    if (!grid || !projects) return;

    var filters = document.getElementById("work-filters");
    var lightbox = document.getElementById("lightbox");
    var visible = projects.slice();
    var current = -1;
    var lastFocus = null;

    // Sort newest first
    projects = projects.slice().sort(function (a, b) { return b.year - a.year; });

    // Build cards
    projects.forEach(function (p, i) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "work-card";
      card.setAttribute("data-type", p.type);
      card.setAttribute("data-index", i);
      card.setAttribute("aria-haspopup", "dialog");
      card.innerHTML =
        '<img src="' + p.image + '" alt="' + escapeHtml(p.alt || p.title) + '" loading="lazy" decoding="async" width="800" height="600">' +
        '<span class="work-card__type">' + escapeHtml(TYPE_LABELS[p.type] || p.type) + '</span>' +
        '<span class="work-card__body">' +
          '<h3>' + escapeHtml(p.title) + '</h3>' +
          '<span class="work-card__meta"><span>' + escapeHtml(p.city) + '</span><span>' + p.year + '</span><span>' + formatNumber(p.guests) + ' guests</span></span>' +
        '</span>';
      card.addEventListener("click", function () { openLightbox(i); });
      grid.appendChild(card);
    });

    var empty = document.createElement("p");
    empty.className = "work-empty"; empty.hidden = true;
    empty.textContent = "No projects in this category yet.";
    grid.parentNode.appendChild(empty);

    // Filters
    function applyFilter(type) {
      visible = [];
      grid.querySelectorAll(".work-card").forEach(function (card) {
        var show = type === "all" || card.getAttribute("data-type") === type;
        card.classList.toggle("is-hidden", !show);
        if (show) visible.push(parseInt(card.getAttribute("data-index"), 10));
      });
      empty.hidden = visible.length > 0;
      if (filters) {
        filters.querySelectorAll("button").forEach(function (b) {
          b.setAttribute("aria-pressed", b.getAttribute("data-filter") === type ? "true" : "false");
        });
      }
    }

    if (filters) {
      // counts in the tab labels
      filters.querySelectorAll("button").forEach(function (b) {
        var t = b.getAttribute("data-filter");
        var n = t === "all" ? projects.length : projects.filter(function (p) { return p.type === t; }).length;
        var count = document.createElement("span");
        count.className = "count"; count.textContent = n;
        b.appendChild(count);
        b.addEventListener("click", function () { applyFilter(t); });
      });
      // support ?type=mega on load
      var param = new URLSearchParams(location.search).get("type");
      applyFilter(param && TYPE_LABELS[param] ? param : "all");
    }

    // Lightbox
    if (!lightbox) return;
    var lbImg = lightbox.querySelector(".lightbox__media img");
    var lbTitle = lightbox.querySelector("#lightbox-title");
    var lbCity = lightbox.querySelector("[data-lb='city']");
    var lbYear = lightbox.querySelector("[data-lb='year']");
    var lbType = lightbox.querySelector("[data-lb='type']");
    var lbGuests = lightbox.querySelector("[data-lb='guests']");
    var lbDesc = lightbox.querySelector("[data-lb='description']");
    var prevBtn = lightbox.querySelector("[data-lb='prev']");
    var nextBtn = lightbox.querySelector("[data-lb='next']");
    var closeBtn = lightbox.querySelector(".lightbox__close");

    function fill(i) {
      var p = projects[i];
      current = i;
      lbImg.src = p.image; lbImg.alt = p.alt || p.title;
      lbTitle.textContent = p.title;
      lbCity.textContent = p.city;
      lbYear.textContent = p.year;
      lbType.textContent = TYPE_LABELS[p.type] || p.type;
      lbGuests.textContent = formatNumber(p.guests) + "+";
      lbDesc.textContent = p.description;
      var pos = visible.indexOf(i);
      prevBtn.disabled = pos <= 0;
      nextBtn.disabled = pos === -1 || pos >= visible.length - 1;
      if (history.replaceState) history.replaceState(null, "", "#" + p.id);
    }

    function openLightbox(i) {
      lastFocus = document.activeElement;
      fill(i);
      if (typeof lightbox.showModal === "function") lightbox.showModal();
      else lightbox.setAttribute("open", "");
      closeBtn.focus();
    }

    function closeLightbox() {
      if (lightbox.open) lightbox.close();
      if (history.replaceState) history.replaceState(null, "", location.pathname + location.search);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function move(dir) {
      var pos = visible.indexOf(current);
      var next = visible[pos + dir];
      if (next !== undefined) fill(next);
    }

    closeBtn.addEventListener("click", closeLightbox);
    prevBtn.addEventListener("click", function () { move(-1); });
    nextBtn.addEventListener("click", function () { move(1); });
    lightbox.addEventListener("cancel", function (e) { e.preventDefault(); closeLightbox(); });
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLightbox(); });
    lightbox.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    });

    // Deep link: work.html#project-id
    if (location.hash) {
      var id = location.hash.slice(1);
      var idx = projects.findIndex(function (p) { return p.id === id; });
      if (idx > -1) {
        var type = projects[idx].type;
        if (filters && visible.indexOf(idx) === -1) applyFilter(type);
        openLightbox(idx);
      }
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------------------------------------------------------------------
     6. Contact form (Netlify Forms)
     --------------------------------------------------------------------- */
  function initForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    var status = document.getElementById("form-status");
    var dateInput = form.querySelector('input[type="date"]');
    if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);

    form.addEventListener("submit", function (e) {
      if (!form.checkValidity()) return; // let the browser show native validation
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var original = btn.textContent;
      btn.disabled = true; btn.textContent = "Sending…";
      setStatus("", "");

      var body = new URLSearchParams(new FormData(form)).toString();
      fetch(form.getAttribute("action") || "/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body
      }).then(function (res) {
        if (!res.ok) throw new Error("Bad response " + res.status);
        form.reset();
        setStatus("Thank you — your message is on its way. We'll get back to you within one business day.", "success");
      }).catch(function () {
        setStatus("Sorry, something went wrong sending the form. Please email us directly instead.", "error");
      }).finally(function () {
        btn.disabled = false; btn.textContent = original;
      });
    });

    function setStatus(msg, state) {
      if (!status) return;
      status.textContent = msg;
      status.setAttribute("data-state", state);
    }
  }

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */
  function init() {
    initNav();
    initCounters();
    initReveal();
    renderPartners();
    initWork();
    initForm();
    document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
