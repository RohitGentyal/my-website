// A slower, gliding scroll for the mouse wheel and touchpad (2026-11-19, my ask: "keep the scroll a bit slower").
// Each wheel step moves the page a little less than the browser would (SPEED) and the page eases into
// place instead of jumping, time-based so it feels the same on a slow machine. Mouse wheels and
// touchpads; touch screens, the keyboard and links keep the device's own scrolling.
// Off with reduced motion, and while ctrl is held (that is zoom).
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const SPEED = 0.5;    // share of the browser's own step: half, both directions (my ask: slower, up and down)
  const EASE = 0.92;     // per 16.7 ms, how much of the distance is left (higher = longer glide)
  let target = scrollY, cur = scrollY, raf = 0, last = 0, mine = false;
  const max = () => document.documentElement.scrollHeight - innerHeight;

  const frame = (now) => {
    raf = 0;
    const dt = last ? Math.min(64, now - last) : 16.7;
    last = now;
    cur += (target - cur) * (1 - Math.pow(EASE, dt / 16.7));
    if (Math.abs(target - cur) < 0.5) cur = target;
    mine = true;
    scrollTo({ top: cur, behavior: "instant" });
    if (cur !== target) raf = requestAnimationFrame(frame);
    else last = 0;
  };

  addEventListener("wheel", (e) => {
    if (e.ctrlKey || e.defaultPrevented) return;
    // mouse wheels and laptop touchpads alike, up and down alike
    const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    // the words loader holds the page still while it shows
    if (document.documentElement.classList.contains("loading")) return;
    e.preventDefault();
    if (!raf) { cur = scrollY; target = scrollY; }
    target = Math.max(0, Math.min(max(), target + px * SPEED));
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: false });

  // any other scrolling (keyboard, links, the scrollbar, touch) takes over where it lands
  addEventListener("scroll", () => {
    if (mine) { mine = false; return; }
    if (!raf) { cur = target = scrollY; }
  }, { passive: true });
})();
