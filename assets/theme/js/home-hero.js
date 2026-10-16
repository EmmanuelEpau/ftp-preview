/*
  Home hero: keeps the pause button honest.
  Plain words: theme/js/main.js starts the reel after the page has loaded and flips the button's
  hidden text between "Pause" and "Play". This file does the rest: it switches the round icon
  (pause bars or play triangle) and the spoken label to match what the video is really doing,
  and it makes the Play button work for visitors who asked for less motion (where the video was
  never started, so it has no file yet).
*/
(function () {
  "use strict";
  var video = document.getElementById("home-loop");
  var btn = document.querySelector('[data-loop-toggle="home-loop"]');
  if (!video || !btn) return;

  /* Show the right icon and say the right thing to a screen reader. */
  function show(playing) {
    btn.setAttribute("data-state", playing ? "playing" : "paused");
    btn.setAttribute("aria-label", playing ? "Pause the background video" : "Play the background video");
  }

  /* Give the video its files if main.js has not yet (it skips this for reduced motion or a data saver). */
  function arm() {
    if (video.querySelector("source")) return;
    ["webm", "mp4"].forEach(function (k) {
      var src = video.getAttribute("data-" + k);
      if (src) { var s = document.createElement("source"); s.src = src; s.type = "video/" + k; video.appendChild(s); }
    });
    video.load();
  }

  /* Runs before main.js's own click handler, so the files are in place when it calls play(). */
  btn.addEventListener("click", arm, true);

  /* The still already showed the reel's opening title card, and the heading now sits where
     the card was, so the moving picture starts just past the card (about 2.6 seconds in)
     instead of printing the same words twice. */
  var CARD_END = 2.6;
  function skipCard() { try { if (video.currentTime < CARD_END) video.currentTime = CARD_END; } catch (e) {} }
  video.addEventListener("loadedmetadata", skipCard);
  video.addEventListener("playing", function () { show(true); skipCard(); });
  video.addEventListener("timeupdate", function () {
    /* When the reel loops back to the start, hop over the card again. */
    if (video.currentTime < 0.5 && video.played.length) skipCard();
  });
  video.addEventListener("pause", function () { show(false); });
  show(!video.paused && !video.ended && video.readyState > 2);
  /* Until the reel has started (before load, or for reduced motion) the honest state is "paused". */
  if (video.paused) show(false);
  /* ...but on a normal visit it is about to play, so show the pause icon straight away. */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var saveData = navigator.connection && navigator.connection.saveData;
  if (!reduce && !saveData) show(true);
})();
