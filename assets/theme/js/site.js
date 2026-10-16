/* /assets/theme/js/main.js */
(function () {
  "use strict";
  var header = document.getElementById("site-header");
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

;
/* /assets/theme/js/home-hero.js */
(function () {
  "use strict";
  var video = document.getElementById("home-loop");
  var btn = document.querySelector('[data-loop-toggle="home-loop"]');
  if (!video || !btn) return;
  function show(playing) {
    btn.setAttribute("data-state", playing ? "playing" : "paused");
    btn.setAttribute("aria-label", playing ? "Pause the background video" : "Play the background video");
  }
  function arm() {
    if (video.querySelector("source")) return;
    ["webm", "mp4"].forEach(function (k) {
      var src = video.getAttribute("data-" + k);
      if (src) { var s = document.createElement("source"); s.src = src; s.type = "video/" + k; video.appendChild(s); }
    });
    video.load();
  }
  btn.addEventListener("click", arm, true);
  var CARD_END = 2.6;
  function skipCard() { try { if (video.currentTime < CARD_END) video.currentTime = CARD_END; } catch (e) {} }
  video.addEventListener("loadedmetadata", skipCard);
  video.addEventListener("playing", function () { show(true); skipCard(); });
  video.addEventListener("timeupdate", function () {
    if (video.currentTime < 0.5 && video.played.length) skipCard();
  });
  video.addEventListener("pause", function () { show(false); });
  show(!video.paused && !video.ended && video.readyState > 2);
  if (video.paused) show(false);
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var saveData = navigator.connection && navigator.connection.saveData;
  if (!reduce && !saveData) show(true);
})();

;
/* /assets/theme/js/catalogue.js */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function edges(box) {
    var max = box.scrollWidth - box.clientWidth;
    return {
      overflow: max > 2,
      atStart: box.scrollLeft <= 2,
      atEnd: box.scrollLeft >= max - 2,
      max: max
    };
  }
  function throttle(fn) {
    var waiting = false;
    return function () {
      if (waiting) return;
      waiting = true;
      requestAnimationFrame(function () { waiting = false; fn(); });
    };
  }
  function setupRail(wrap) {
    var rail = wrap.querySelector(".rail");
    if (!rail) return;
    var prev = wrap.querySelector("[data-rail-prev]");
    var next = wrap.querySelector("[data-rail-next]");
    var fill = wrap.querySelector(".rail-progress-fill");
    var track = wrap.querySelector(".rail-progress");
    wrap.classList.add("is-js");
    function update() {
      var e = edges(rail);
      wrap.classList.toggle("has-overflow", e.overflow);
      wrap.style.setProperty("--fade-l", e.overflow && !e.atStart ? "1" : "0");
      wrap.style.setProperty("--fade-r", e.overflow && !e.atEnd ? "1" : "0");
      if (prev) prev.hidden = !e.overflow || e.atStart;
      if (next) next.hidden = !e.overflow || e.atEnd;
      if (fill && track && e.overflow) {
        var share = rail.clientWidth / rail.scrollWidth;
        var fillW = Math.max(share * track.clientWidth, 24);
        var pos = e.max > 0 ? rail.scrollLeft / e.max : 0;
        fill.style.width = fillW + "px";
        fill.style.transform = "translateX(" + pos * (track.clientWidth - fillW) + "px)";
      }
    }
    function step(dir) {
      var amount = Math.max(rail.clientWidth * 0.9, 200) * dir;
      rail.scrollBy({ left: amount, behavior: reduce ? "auto" : "smooth" });
    }
    if (prev) prev.addEventListener("click", function () { step(-1); });
    if (next) next.addEventListener("click", function () { step(1); });
    rail.addEventListener("scroll", throttle(update), { passive: true });
    if (window.ResizeObserver) {
      new ResizeObserver(throttle(update)).observe(rail);
    } else {
      window.addEventListener("resize", throttle(update));
    }
    rail.querySelectorAll("img").forEach(function (img) {
      if (!img.complete) img.addEventListener("load", update, { once: true });
    });
    update();
  }
  function setupTabs(nav) {
    var list = nav.querySelector(".cat-tabs-list");
    if (!list) return;
    nav.classList.add("is-js");
    function update() {
      var e = edges(list);
      nav.style.setProperty("--fade-l", e.overflow && !e.atStart ? "1" : "0");
      nav.style.setProperty("--fade-r", e.overflow && !e.atEnd ? "1" : "0");
    }
    var current = list.querySelector('[aria-current="page"]');
    if (current && edges(list).overflow) {
      list.scrollLeft = current.offsetLeft - (list.clientWidth - current.offsetWidth) / 2;
    }
    list.addEventListener("scroll", throttle(update), { passive: true });
    if (window.ResizeObserver) {
      new ResizeObserver(throttle(update)).observe(list);
    } else {
      window.addEventListener("resize", throttle(update));
    }
    update();
  }
  function init() {
    document.querySelectorAll("[data-rail]").forEach(setupRail);
    document.querySelectorAll("[data-tabs]").forEach(setupTabs);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

;
/* /assets/theme/js/strips.js */
(function () {
  "use strict";
  var reduceQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function lessMotion() { return !!(reduceQuery && reduceQuery.matches); }
  function initSlider(root) {
    root.classList.add("is-js");
    var slides = root.querySelectorAll(".pq-slide");
    var n = slides.length;
    if (n < 2) return;
    var dots = root.querySelectorAll(".pq-dot");
    var prevBtn = root.querySelector(".pq-prev");
    var nextBtn = root.querySelector(".pq-next");
    var fill = root.querySelector("[data-pq-fill]");
    var now = root.querySelector("[data-pq-now]");
    var stage = root.querySelector("[data-pq-stage]");
    var panel = root.querySelector(".pq-panel") || root;
    var seconds = parseFloat(root.getAttribute("data-seconds")) || 7;
    var duration = seconds * 1000;
    var index = 0, elapsed = 0, last = 0, raf = 0;
    var hovering = false, focused = false, offscreen = false;
    function wantsAuto() { return root.getAttribute("data-autoplay") !== "false" && !lessMotion(); }
    function paused() { return !wantsAuto() || hovering || focused || offscreen || document.hidden; }
    function mark(slide, active) {
      slide.classList.toggle("is-active", active);
      if (active) { slide.removeAttribute("aria-hidden"); slide.removeAttribute("inert"); }
      else { slide.setAttribute("aria-hidden", "true"); slide.setAttribute("inert", ""); }
    }
    for (var s = 0; s < n; s++) mark(slides[s], s === 0);
    function fit() {
      if (!stage) return;
      var active = slides[index];
      stage.style.height = active.offsetHeight + "px";
    }
    function paint() {
      if (!fill) return;
      var share = wantsAuto() ? Math.min(elapsed / duration, 1) : (index + 1) / n;
      fill.style.transform = "scaleX(" + share + ")";
    }
    function go(to) {
      to = (to + n) % n;
      if (to === index) { elapsed = 0; paint(); return; }
      var old = slides[index];
      for (var k = 0; k < n; k++) slides[k].classList.remove("is-leaving");
      mark(old, false);
      old.classList.add("is-leaving");
      mark(slides[to], true);
      if (dots[index]) { dots[index].classList.remove("is-active"); dots[index].removeAttribute("aria-current"); }
      if (dots[to]) { dots[to].classList.add("is-active"); dots[to].setAttribute("aria-current", "true"); }
      index = to;
      elapsed = 0;
      if (now) now.textContent = String(index + 1);
      fit();
      paint();
    }
    function frame(ts) {
      raf = 0;
      if (paused()) { last = 0; return; }
      if (!last) last = ts;
      elapsed += ts - last;
      last = ts;
      if (elapsed >= duration) go(index + 1);
      paint();
      raf = window.requestAnimationFrame(frame);
    }
    function sync() {
      if (stage) stage.setAttribute("aria-live", paused() ? "polite" : "off");
      if (paused()) { if (raf) { window.cancelAnimationFrame(raf); raf = 0; } last = 0; }
      else if (!raf) { last = 0; raf = window.requestAnimationFrame(frame); }
      paint();
    }
    if (prevBtn) prevBtn.addEventListener("click", function () { go(index - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { go(index + 1); });
    Array.prototype.forEach.call(dots, function (d, k) { d.addEventListener("click", function () { go(k); }); });
    panel.addEventListener("pointerenter", function (e) { if (e.pointerType !== "touch") { hovering = true; sync(); } });
    panel.addEventListener("pointerleave", function () { hovering = false; sync(); });
    root.addEventListener("focusin", function () { focused = true; sync(); });
    root.addEventListener("focusout", function (e) {
      if (!e.relatedTarget || !root.contains(e.relatedTarget)) { focused = false; sync(); }
    });
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
    });
    var sx = 0, sy = 0;
    panel.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    panel.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? index + 1 : index - 1);
    }, { passive: true });
    document.addEventListener("visibilitychange", sync);
    if (reduceQuery && reduceQuery.addEventListener) reduceQuery.addEventListener("change", sync);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        offscreen = !entries[entries.length - 1].isIntersecting;
        sync();
      }, { threshold: 0.2 }).observe(root);
    }
    if ("ResizeObserver" in window) new ResizeObserver(fit).observe(panel);
    else window.addEventListener("resize", fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    fit();
    sync();
  }
  function initMarquee(el) {
    if (!("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (entries) {
      el.classList.toggle("is-paused", !entries[entries.length - 1].isIntersecting);
    }, { threshold: 0 }).observe(el);
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-quote-slider]"), initSlider);
  Array.prototype.forEach.call(document.querySelectorAll("[data-laurel-marquee]"), initMarquee);
})();
