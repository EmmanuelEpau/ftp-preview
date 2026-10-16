/*
  catalogue.js: the small amount of script behind the catalogue.

  1. Rails (film-rail): shows the arrow buttons only when there is more to see, fades the
     edge where more tiles wait, and moves the thin blue line under the rail as it scrolls.
  2. The tab strip on listing pages (film-grid): fades the edge that has more tabs and
     scrolls the current tab into view on a phone.

  Everything works without this file: rails and the tab strip scroll by hand, and the
  arrows and the progress line simply stay hidden.
*/
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* How far a box has scrolled sideways, as "can go back" and "can go forward".
     A 2 px allowance stops a rounding error from flickering the fades. */
  function edges(box) {
    var max = box.scrollWidth - box.clientWidth;
    return {
      overflow: max > 2,
      atStart: box.scrollLeft <= 2,
      atEnd: box.scrollLeft >= max - 2,
      max: max
    };
  }

  /* Run fn once per animation frame at most, however often the scroll event fires. */
  function throttle(fn) {
    var waiting = false;
    return function () {
      if (waiting) return;
      waiting = true;
      requestAnimationFrame(function () { waiting = false; fn(); });
    };
  }

  /* ---------- 1. Rails ---------- */
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
      /* The fades: 1 where more tiles wait, 0 at a hard edge. */
      wrap.style.setProperty("--fade-l", e.overflow && !e.atStart ? "1" : "0");
      wrap.style.setProperty("--fade-r", e.overflow && !e.atEnd ? "1" : "0");
      /* The arrows: hidden entirely when the rail fits, and the one at a hard edge is hidden too. */
      if (prev) prev.hidden = !e.overflow || e.atStart;
      if (next) next.hidden = !e.overflow || e.atEnd;
      /* The progress line: the fill is as wide as the share of the rail in view and slides along the track. */
      if (fill && track && e.overflow) {
        var share = rail.clientWidth / rail.scrollWidth;
        var fillW = Math.max(share * track.clientWidth, 24);
        var pos = e.max > 0 ? rail.scrollLeft / e.max : 0;
        fill.style.width = fillW + "px";
        fill.style.transform = "translateX(" + pos * (track.clientWidth - fillW) + "px)";
      }
    }

    /* One click moves by almost a full view, so the last tile seen becomes the first tile shown. */
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
    /* Posters load after the first paint and can change the scroll width, so measure again when they arrive. */
    rail.querySelectorAll("img").forEach(function (img) {
      if (!img.complete) img.addEventListener("load", update, { once: true });
    });
    update();
  }

  /* ---------- 2. Tab strip ---------- */
  function setupTabs(nav) {
    var list = nav.querySelector(".cat-tabs-list");
    if (!list) return;
    nav.classList.add("is-js");

    function update() {
      var e = edges(list);
      nav.style.setProperty("--fade-l", e.overflow && !e.atStart ? "1" : "0");
      nav.style.setProperty("--fade-r", e.overflow && !e.atEnd ? "1" : "0");
    }
    /* On a phone the current tab may sit off to the right; bring it to the middle of the strip. */
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
