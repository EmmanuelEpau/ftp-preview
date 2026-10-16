/*
  strips.js: behaviour for the two strips.

  1. Press quote slider (press-strip module). Every quote is already in the
     page; this only decides which one shows. It moves to the next quote on a
     timer (7 seconds unless the module says otherwise), paints the thin gold
     progress line, and pauses while the pointer rests on the panel, while
     keyboard focus is inside it, while it is scrolled out of view and while
     the tab is hidden. Visitors who ask for less motion get no auto-advance
     and no animation; the arrows, dots and keyboard still work.

  2. Laurel marquee (awards-strip module). The drift itself is CSS. This only
     pauses it while the strip is off screen, so the browser does no work for
     something nobody can see.
*/
(function () {
  "use strict";

  var reduceQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function lessMotion() { return !!(reduceQuery && reduceQuery.matches); }

  /* ---------------------------------------------------------------------
     Press quotes
     --------------------------------------------------------------------- */
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

    /* Auto-advance only when the module asks for it and the visitor has not asked for less motion. */
    function wantsAuto() { return root.getAttribute("data-autoplay") !== "false" && !lessMotion(); }
    function paused() { return !wantsAuto() || hovering || focused || offscreen || document.hidden; }

    /* Hidden quotes cannot take focus or be read, so a keyboard user never lands on an invisible link. */
    function mark(slide, active) {
      slide.classList.toggle("is-active", active);
      if (active) { slide.removeAttribute("aria-hidden"); slide.removeAttribute("inert"); }
      else { slide.setAttribute("aria-hidden", "true"); slide.setAttribute("inert", ""); }
    }
    for (var s = 0; s < n; s++) mark(slides[s], s === 0);

    /* The stage is as tall as the quote on show; CSS eases the change in height. */
    function fit() {
      if (!stage) return;
      var active = slides[index];
      stage.style.height = active.offsetHeight + "px";
    }

    function paint() {
      if (!fill) return;
      /* While auto-advancing the line fills over the quote's time on screen; otherwise it shows the position in the set. */
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

    /* Start or stop the timer to match the state, and tell screen readers whether to announce changes:
       polite while the visitor is in control (paused), off while the slider moves by itself. */
    function sync() {
      if (stage) stage.setAttribute("aria-live", paused() ? "polite" : "off");
      if (paused()) { if (raf) { window.cancelAnimationFrame(raf); raf = 0; } last = 0; }
      else if (!raf) { last = 0; raf = window.requestAnimationFrame(frame); }
      paint();
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { go(index - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { go(index + 1); });
    Array.prototype.forEach.call(dots, function (d, k) { d.addEventListener("click", function () { go(k); }); });

    /* Pause while the mouse is over the panel, or while keyboard focus is inside it. */
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

    /* Swipe on touch screens. */
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

    /* Re-measure when the panel changes width and once the web fonts have arrived (they change line breaks). */
    if ("ResizeObserver" in window) new ResizeObserver(fit).observe(panel);
    else window.addEventListener("resize", fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

    fit();
    sync();
  }

  /* ---------------------------------------------------------------------
     Laurel marquee
     --------------------------------------------------------------------- */
  function initMarquee(el) {
    if (!("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (entries) {
      el.classList.toggle("is-paused", !entries[entries.length - 1].isIntersecting);
    }, { threshold: 0 }).observe(el);
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-quote-slider]"), initSlider);
  Array.prototype.forEach.call(document.querySelectorAll("[data-laurel-marquee]"), initMarquee);
})();
