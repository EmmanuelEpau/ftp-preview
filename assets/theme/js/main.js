/*
  main.js: the small amount of behaviour the theme needs.
  1. Header: turns solid once the visitor scrolls past a film hero, and runs
     the phone menu and the search panel.
  2. Trailers: a still with a play button becomes a player only when pressed,
     so no page loads a video it was not asked for.
  3. Reduced motion: hero loops stay paused for people who asked for less motion.
  Everything is plain browser JavaScript, no library, so it loads in a blink.
*/
(function () {
  "use strict";

  var header = document.getElementById("site-header");

  /* 1. Header */
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    header.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-toggle]");
      if (!btn) return;
      var kind = btn.getAttribute("data-toggle");
      if (kind === "menu") {
        var open = header.classList.toggle("menu-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        document.body.style.overflow = open ? "hidden" : "";
      }
      if (kind === "search") {
        var panel = document.getElementById("search-panel");
        if (!panel) return;
        var show = panel.hasAttribute("hidden");
        if (show) { panel.removeAttribute("hidden"); } else { panel.setAttribute("hidden", ""); }
        btn.setAttribute("aria-expanded", show ? "true" : "false");
        if (show) { var input = panel.querySelector("input"); if (input) input.focus(); }
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (header.classList.contains("menu-open")) {
        header.classList.remove("menu-open");
        document.body.style.overflow = "";
        var t = header.querySelector('[data-toggle="menu"]'); if (t) { t.setAttribute("aria-expanded", "false"); t.focus(); }
      }
      var panel = document.getElementById("search-panel");
      if (panel && !panel.hasAttribute("hidden")) { panel.setAttribute("hidden", ""); var s = header.querySelector('[data-toggle="search"]'); if (s) { s.setAttribute("aria-expanded", "false"); s.focus(); } }
    });
  }

  /* 2. Trailers: press play, then the embed loads. The still carries the poster until then. */
  document.addEventListener("click", function (e) {
    var play = e.target.closest("[data-play]");
    if (!play) return;
    var box = play.closest("[data-player]");
    if (!box) return;
    var src = box.getAttribute("data-embed");
    var mp4 = box.getAttribute("data-mp4");
    var title = box.getAttribute("data-title") || "Trailer";
    e.preventDefault();
    if (!box.hasAttribute("data-restore")) box.setAttribute("data-restore", box.innerHTML);
    if (src) {
      var iframe = document.createElement("iframe");
      iframe.src = src + (src.indexOf("?") > -1 ? "&" : "?") + "autoplay=1";
      iframe.title = title;
      iframe.allow = "autoplay; fullscreen; picture-in-picture";
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("loading", "eager");
      box.innerHTML = "";
      box.appendChild(iframe);
      box.classList.add("is-playing");
    } else if (mp4) {
      var video = document.createElement("video");
      video.src = mp4;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute("aria-label", title);
      box.innerHTML = "";
      box.appendChild(video);
      box.classList.add("is-playing");
    }
  });

  /* Trailer dialogs: a "Play trailer" button on a hero opens the player over the page. */
  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-open-dialog]");
    if (opener) {
      var dlg = document.getElementById(opener.getAttribute("data-open-dialog"));
      if (dlg && typeof dlg.showModal === "function") {
        e.preventDefault();
        dlg.showModal();
        var p = dlg.querySelector("[data-play]"); if (p) p.click();
      }
    }
    var closer = e.target.closest("[data-close-dialog]");
    if (closer) {
      var d = closer.closest("dialog");
      if (d) { d.close(); }
    }
  });
  document.addEventListener("close", function (e) {
    if (e.target.tagName === "DIALOG") {
      var box = e.target.querySelector("[data-player].is-playing");
      if (box) { box.innerHTML = box.getAttribute("data-restore") || ""; box.classList.remove("is-playing"); }
    }
  }, true);

  /* 3. Hero loops start only after the page has loaded, never when the visitor asked for reduced motion
        or a data saver, and offer a pause button. The video element names no file until then. */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var saveData = navigator.connection && navigator.connection.saveData;
  document.querySelectorAll("video[data-loop]").forEach(function (v) {
    var btn = document.querySelector('[data-loop-toggle="' + v.id + '"]');
    var armed = false;
    function arm() {
      if (armed) return; armed = true;
      ["webm", "mp4"].forEach(function (k) {
        var src = v.getAttribute("data-" + k);
        if (src) { var s = document.createElement("source"); s.src = src; s.type = "video/" + k; v.appendChild(s); }
      });
      v.load();
    }
    function start() { arm(); var p = v.play(); if (p && p.catch) p.catch(function () {}); if (btn) btn.textContent = "Pause"; }
    if (reduce || saveData) { if (btn) { btn.textContent = "Play"; } }
    else if (document.readyState === "complete") { setTimeout(start, 50); }
    else { window.addEventListener("load", function () { setTimeout(start, 50); }); }
    if (btn) {
      btn.addEventListener("click", function () {
        if (v.paused) { v.play(); btn.textContent = "Pause"; }
        else { v.pause(); btn.textContent = "Play"; }
      });
    }
  });
})();

/* Film pages: show the sticky Watch bar once the hero has scrolled away. */
(function () {
  var bar = document.getElementById("film-sticky");
  var hero = document.querySelector(".film-hero");
  if (!bar || !hero || !("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { bar.setAttribute("hidden", ""); } else { bar.removeAttribute("hidden"); }
    });
  }, { rootMargin: "-80px 0px 0px 0px", threshold: 0 });
  io.observe(hero);
})();

/* Listing pages are plain links; each listing is its own page, so no script is needed to filter. */


/* Giving form: picking "Other" reveals an amount box and moves focus into it. */
(function () {
  var form = document.querySelector("[data-standin-form='give']");
  if (!form) return;
  if (location.hash === "#monthly") { var m = form.querySelector("input[name=freq][value=monthly]"); if (m) m.checked = true; }
  form.addEventListener("change", function (e) {
    if (e.target.name !== "amt") return;
    var box = document.getElementById("give-other");
    if (!box) return;
    var other = e.target.value === "other";
    box.hidden = !other;
    var input = box.querySelector("input");
    if (other) { input.required = true; input.focus(); } else { input.required = false; input.value = ""; }
  });
})();

/* Screening requests: a tier button fills the option in the form below; a HubSpot form gets the film slug in its hidden "film" field. */
(function () {
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-track='screening-tier']");
    if (!a) return;
    var sel = document.getElementById("sr-tier") || document.querySelector("#screening-request select[name*='tier']");
    if (sel) { sel.value = a.getAttribute("data-tier"); }
  });
  var wrap = document.querySelector("[data-screening-form]");
  if (wrap) {
    var fill = function () { var h = wrap.querySelector("input[name='film']"); if (h) h.value = wrap.getAttribute("data-film"); };
    fill(); window.addEventListener("message", function (ev) { if (ev.data && ev.data.type === "hsFormCallback") fill(); });
  }
})();

