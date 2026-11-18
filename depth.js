// Quiet depth below the hero, eased like the hero's parallax. Each piece moves a few pixels against the
// page as it crosses the screen, so the sections read as layers instead of one flat sheet:
// - the section labels float a touch slower than the text they name;
// - the Genzo screenshot drifts inside its board, like a window with depth behind it;
// - the Stack tiles sit at three slightly different depths;
// - at the very end, the open sky (the poems page's) rises faintly up the page.
// Only translate/transform, only while something is moving. Off with reduced motion.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const items = [];
  // [element, how much of its distance from the screen's middle it moves, which property]
  document.querySelectorAll("section.col h2").forEach((el) => items.push([el, 0.022, "translate"]));
  document.querySelectorAll(".board .shot").forEach((el) => items.push([el, -0.05, "translate"]));
  const sky = document.querySelector(".open-sky");

  let cur = scrollY, raf = 0, tops = [], last = 0;
  // positions are measured once (and on resize), not every frame
  const measure = () => {
    tops = items.map(([el]) => {
      const r = el.getBoundingClientRect();
      return r.top + scrollY + r.height / 2;
    });
  };
  const frame = (now) => {
    raf = 0;
    // time-based easing: it settles in the same time on a slow device as on a fast one
    const dt = last ? Math.min(250, now - last) : 16.7;
    last = now;
    cur += (scrollY - cur) * (1 - Math.pow(0.88, dt / 16.7));
    if (Math.abs(scrollY - cur) < 0.3) cur = scrollY;
    const mid = cur + innerHeight / 2;
    items.forEach(([el, k, prop], i) => {
      const d = tops[i] - mid;
      // only bother with what is near the screen
      if (Math.abs(d) > innerHeight * 1.2) return;
      const y = (d * k).toFixed(2);
      if (prop === "translate") el.style.translate = `0 ${y}px`;
      else el.style.transform = `translate3d(0, ${y}px, 0)`;
    });
    if (sky) {
      // the open sky shows only in the last screen of the page
      const left = document.documentElement.scrollHeight - (cur + innerHeight);
      const t = Math.max(0, Math.min(1, 1 - left / (innerHeight * 0.9)));
      sky.style.opacity = (t * t).toFixed(3);
      sky.style.transform = `translate3d(0, ${((1 - t) * 60).toFixed(1)}px, 0)`;
    }
    if (cur !== scrollY) raf = requestAnimationFrame(frame);
    else last = 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  // undo the shift while measuring so positions are the resting ones
  const remeasure = () => {
    items.forEach(([el, , prop]) => { if (prop === "translate") el.style.translate = ""; else el.style.transform = ""; });
    measure();
    kick();
  };
  addEventListener("scroll", kick, { passive: true });
  addEventListener("resize", remeasure);
  addEventListener("load", remeasure);
  if (document.fonts) document.fonts.ready.then(remeasure);
  remeasure();
})();
