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
  function safeReplaceState() { try { history.replaceState.apply(history, arguments); } catch (e) {} }

  /* ---------------------------------------------------------------------
     1. Navigation
     --------------------------------------------------------------------- */
  function initHeader() {
    var h = document.querySelector('.site-header');
    if (!h) return;
    var update = function () { h.classList.toggle('is-solid', window.scrollY > 40 || !h.classList.contains('site-header--overlay')); };
    update(); window.addEventListener('scroll', update, { passive: true });
  }

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
    var words = name.replace(/[—–-].*$/, "").split(/\s+/).filter(Boolean);
    var last = words[words.length - 1];
    if (words.length > 1 && /^\d+$/.test(last)) return last;      // "Client 01" -> "01"
    return words.slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join("");
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
     5. Portfolio grids, filters, partner showcase and the shared lightbox
     --------------------------------------------------------------------- */
  var TYPE_LABELS = { mega: "Public Mega Event", corporate: "Corporate & Business", expo: "Expos & Fabrication" };

  function allPartners() {
    var data = window.SAILORS_PARTNERS || {};
    return [].concat(data.clients || [], data.institutional || [], data.alliances || []);
  }
  function partnerById(id) {
    return allPartners().filter(function (p) { return p.id === id; })[0] || null;
  }
  function sortedProjects() {
    return (window.SAILORS_PROJECTS || []).slice().sort(function (a, b) { return b.year - a.year; });
  }

  /* Shared lightbox (<dialog class="lightbox">) ------------------------- */
  function createLightbox(lightbox) {
    if (!lightbox) return null;
    var lbImg = lightbox.querySelector(".lightbox__media img");
    var lbTitle = lightbox.querySelector("#lightbox-title");
    var field = function (k) { return lightbox.querySelector("[data-lb='" + k + "']"); };
    var lbCity = field("city"), lbYear = field("year"), lbType = field("type"), lbGuests = field("guests");
    var lbDesc = field("description"), lbPartner = field("partner"), lbRole = field("role"), lbGallery = field("gallery");
    var prevBtn = field("prev"), nextBtn = field("next"), closeBtn = lightbox.querySelector(".lightbox__close");
    var list = [], current = -1, lastFocus = null;

    function fill(i) {
      var p = list[i];
      current = i;
      var photos = [p.image].concat(p.gallery || []);
      lbImg.src = p.image; lbImg.alt = p.alt || p.title;
      lbTitle.textContent = p.title;
      var flag = lightbox.querySelector("[data-lb='sample']"); if (flag) flag.hidden = !p.sample;
      lbCity.textContent = p.city;
      lbYear.textContent = p.year;
      lbType.textContent = TYPE_LABELS[p.type] || p.type;
      lbGuests.textContent = p.guests ? formatNumber(p.guests) + "+" : "—";
      lbDesc.textContent = p.description;
      if (lbPartner) {
        var partner = partnerById(p.partner);
        lbPartner.textContent = partner ? partner.name : "—";
      }
      if (lbRole) {
        lbRole.textContent = p.role || "";
        lbRole.parentNode.hidden = !p.role;
      }
      if (lbGallery) {
        lbGallery.innerHTML = "";
        lbGallery.hidden = photos.length < 2;
        photos.forEach(function (src, idx) {
          var b = document.createElement("button");
          b.type = "button"; b.className = "lightbox__thumb" + (idx === 0 ? " is-active" : "");
          b.setAttribute("aria-label", "Photo " + (idx + 1) + " of " + photos.length);
          b.innerHTML = '<img src="' + src + '" alt="" loading="lazy" width="160" height="120">';
          b.addEventListener("click", function () {
            lbImg.src = src;
            lbGallery.querySelectorAll(".lightbox__thumb").forEach(function (t) { t.classList.remove("is-active"); });
            b.classList.add("is-active");
          });
          lbGallery.appendChild(b);
        });
      }
      prevBtn.disabled = i <= 0;
      nextBtn.disabled = i >= list.length - 1;
      safeReplaceState(null, "", "#" + p.id);
    }
    function open(project, projectList) {
      list = projectList && projectList.length ? projectList : [project];
      var i = list.indexOf(project); if (i < 0) { list = [project]; i = 0; }
      lastFocus = document.activeElement;
      fill(i);
      if (typeof lightbox.showModal === "function") lightbox.showModal(); else lightbox.setAttribute("open", "");
      closeBtn.focus();
    }
    function close() {
      if (lightbox.open) lightbox.close();
      safeReplaceState(null, "", location.pathname + location.search);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function move(dir) { var n = current + dir; if (n >= 0 && n < list.length) fill(n); }

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", function () { move(-1); });
    nextBtn.addEventListener("click", function () { move(1); });
    lightbox.addEventListener("cancel", function (e) { e.preventDefault(); close(); });
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox) close(); });
    lightbox.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    });
    return { open: open, close: close };
  }

  /* Project card ------------------------------------------------------- */
  function projectCard(p, showPartner) {
    var partner = showPartner ? partnerById(p.partner) : null;
    var card = document.createElement("button");
    card.type = "button";
    card.className = "work-card";
    card.setAttribute("data-type", p.type);
    card.setAttribute("data-partner", p.partner || "");
    card.setAttribute("aria-haspopup", "dialog");
    card.innerHTML =
      '<img src="' + p.image + '" alt="' + escapeHtml(p.alt || p.title) + '" loading="lazy" decoding="async" width="800" height="600">' +
      '<span class="work-card__type">' + escapeHtml(TYPE_LABELS[p.type] || p.type) + '</span>' +
      (p.sample ? '<span class="work-card__sample">Sample · placeholder imagery</span>' : '') +
      '<span class="work-card__body">' +
        (partner ? '<span class="work-card__partner">' + escapeHtml(partner.name) + '</span>' : '') +
        '<h3>' + escapeHtml(p.title) + '</h3>' +
        (showPartner && p.role ? '<span class="work-card__desc">' + escapeHtml(p.role) + '</span>' : '') +
        '<span class="work-card__meta"><span>' + escapeHtml(p.city) + '</span><span>' + p.year + '</span>' + (p.guests ? '<span>' + formatNumber(p.guests) + ' guests</span>' : '') + '</span>' +
        '<span class="work-card__more">View project ' + ARROW + '</span>' +
      '</span>';
    return card;
  }
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

  /* work.html ---------------------------------------------------------- */
  function initWork() {
    var grid = document.getElementById("work-grid");
    if (!grid || !window.SAILORS_PROJECTS) return;
    var filters = document.getElementById("work-filters");
    var lb = createLightbox(document.getElementById("lightbox"));
    var projects = sortedProjects();
    var visible = projects.slice();

    projects.forEach(function (p) {
      var card = projectCard(p, false);
      card.addEventListener("click", function () { if (lb) lb.open(p, visible); });
      grid.appendChild(card);
    });
    var empty = document.createElement("p");
    empty.className = "work-empty"; empty.hidden = true;
    empty.textContent = "No projects in this category yet.";
    grid.parentNode.appendChild(empty);

    function applyFilter(type) {
      visible = [];
      grid.querySelectorAll(".work-card").forEach(function (card, i) {
        var show = type === "all" || card.getAttribute("data-type") === type;
        card.classList.toggle("is-hidden", !show);
        if (show) visible.push(projects[i]);
      });
      empty.hidden = visible.length > 0;
      if (filters) filters.querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-filter") === type ? "true" : "false");
      });
    }
    if (filters) {
      filters.querySelectorAll("button").forEach(function (b) {
        var t = b.getAttribute("data-filter");
        var n = t === "all" ? projects.length : projects.filter(function (p) { return p.type === t; }).length;
        var count = document.createElement("span"); count.className = "count"; count.textContent = n; b.appendChild(count);
        b.addEventListener("click", function () { applyFilter(t); });
      });
      var qs = new URLSearchParams(location.search);
      var param = qs.get("type");
      applyFilter(param && TYPE_LABELS[param] ? param : "all");
      var pid = qs.get("partner"), partner = pid && partnerById(pid);
      var note = document.getElementById("work-partner-note");
      if (partner && note) {
        var mine = projects.filter(function (p) { return p.partner === pid; });
        grid.querySelectorAll(".work-card").forEach(function (card, i) { if (projects[i].partner !== pid) card.classList.add("is-hidden"); });
        visible = mine; empty.hidden = mine.length > 0; if (!mine.length) empty.textContent = "No published projects with " + partner.name + " yet.";
        note.hidden = false;
        note.innerHTML = '<span>Showing projects with <strong>' + escapeHtml(partner.name) + '</strong></span><a class="btn btn--ghost btn--sm" href="work.html">Show all projects</a>';
      }
    }
    if (lb && location.hash) {
      var id = location.hash.slice(1);
      var match = projects.filter(function (p) { return p.id === id; })[0];
      if (match) { if (visible.indexOf(match) === -1) applyFilter(match.type); lb.open(match, visible); }
    }
  }

  /* index.html: featured work (verified projects first) ------------------- */
  function initFeatured() {
    var box = document.getElementById("featured-work");
    if (!box || !window.SAILORS_PROJECTS) return;
    var lb = createLightbox(document.getElementById("lightbox"));
    var projects = sortedProjects();
    var real = projects.filter(function (p) { return !p.sample; });
    var picks = real.concat(projects.filter(function (p) { return p.sample; })).slice(0, 3);
    picks.forEach(function (p) {
      var card = projectCard(p, true);
      card.addEventListener("click", function () { if (lb) lb.open(p, picks); else location.href = "work.html#" + p.id; });
      box.appendChild(card);
    });
  }

  /* partners.html: logo marquee + partner panel ------------------------- */
  function initPartnerShowcase() {
    var marquee = document.getElementById("partner-marquee");
    var panel = document.getElementById("partner-panel");
    if (!marquee || !window.SAILORS_PARTNERS) return;
    var partners = allPartners();
    var projects = sortedProjects();
    var track = marquee.querySelector(".marquee__track");
    var selected = "";
    marquee.style.setProperty("--marquee-duration", Math.max(40, partners.length * 1.6) + "s");

    function projectsFor(id) { return projects.filter(function (p) { return p.partner === id && !p.sample; }); }
    function logoButton(p, clone) {
      var b = document.createElement(panel ? "button" : "a");
      b.className = "marquee__logo";
      if (panel) { b.type = "button"; } else { b.href = "partners.html?partner=" + encodeURIComponent(p.id); }
      b.setAttribute("data-partner", p.id);
      if (clone) { b.tabIndex = -1; b.setAttribute("aria-hidden", "true"); }
      var n = projectsFor(p.id).length;
      b.setAttribute("aria-label", p.name + (n ? " — " + n + " project" + (n > 1 ? "s" : "") : ""));
      b.title = p.name;
      b.innerHTML = p.logo
        ? '<img src="' + p.logo + '" alt="" loading="lazy" decoding="async" width="120" height="48">'
        : '<span class="logo-card__mono" aria-hidden="true">' + escapeHtml(initials(p.name)) + '</span><span class="marquee__name">' + escapeHtml(p.name) + '</span>';
      if (panel) b.addEventListener("click", function () { select(p.id, true); });
      return b;
    }
    [false, true].forEach(function (clone) {
      var group = document.createElement("div"); group.className = "marquee__group";
      partners.forEach(function (p) { group.appendChild(logoButton(p, clone)); });
      track.appendChild(group);
    });
    marquee.addEventListener("focusin", function () { marquee.classList.add("is-paused"); });
    marquee.addEventListener("focusout", function () { marquee.classList.remove("is-paused"); });
    if (!panel) return;

    function select(id, scroll) {
      selected = selected === id ? "" : id;
      var p = partnerById(selected);
      marquee.querySelectorAll(".marquee__logo").forEach(function (b) {
        var on = b.getAttribute("data-partner") === selected;
        b.classList.toggle("is-selected", on);
        if (!b.hasAttribute("aria-hidden")) b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      if (!p) { panel.hidden = true; panel.innerHTML = ""; safeReplaceState(null, "", location.pathname); return; }
      var list = projectsFor(p.id);
      var html = '<div class="partner-panel__head">' +
        (p.logo ? '<img class="partner-panel__logo" src="' + p.logo + '" alt="" width="120" height="48">' : '<span class="logo-card__mono" aria-hidden="true">' + escapeHtml(initials(p.name)) + '</span>') +
        '<div><h3>' + escapeHtml(p.name) + '</h3>' + (p.note ? '<p class="partner-panel__note">' + escapeHtml(p.note) + '</p>' : '') + '</div>' +
        '<button type="button" class="partner-panel__close" aria-label="Close partner details">&times;</button></div>';
      if (list.length) {
        html += '<p class="partner-panel__intro">Work delivered together:</p><ul class="partner-panel__list">' + list.map(function (pr) {
          return '<li><a href="work.html#' + encodeURIComponent(pr.id) + '"><img src="' + pr.image + '" alt="" loading="lazy" width="160" height="120"><span><strong>' + escapeHtml(pr.title) + '</strong><small>' + escapeHtml(pr.city) + ' · ' + pr.year + '</small></span></a></li>';
        }).join("") + '</ul>';
      } else {
        html += '<p class="partner-panel__intro">We haven\'t published a case study with ' + escapeHtml(p.name) + ' yet. Verified projects will appear here as they are added.</p>';
      }
      if (p.url) html += '<p class="partner-panel__link"><a href="' + p.url + '" target="_blank" rel="noopener">Visit ' + escapeHtml(p.name) + ' ↗</a></p>';
      panel.innerHTML = html; panel.hidden = false;
      panel.querySelector(".partner-panel__close").addEventListener("click", function () { select(selected, false); });
      safeReplaceState(null, "", "?partner=" + encodeURIComponent(p.id));
      if (scroll) panel.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "nearest" });
      panel.querySelector(".partner-panel__close").focus({ preventScroll: true });
    }
    var param = new URLSearchParams(location.search).get("partner");
    if (param && partnerById(param)) select(param, true);
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
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        setStatus("Please complete the required fields marked * before sending.", "error");
        var first = form.querySelector(":invalid"); if (first && first.focus) first.focus();
        return;
      }
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
    initHeader();
    initNav();
    initCounters();
    initReveal();
    renderPartners();
    initWork();
    initFeatured();
    initPartnerShowcase();
    initForm();
    document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
