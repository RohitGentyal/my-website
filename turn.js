// Page turns between the portfolio and the poems. A link marked data-turn="cobalt" (or "paper", "ink") floods the
// page with that colour from the point you clicked, in a slow circle, then opens its page. The page it
// opens starts in that same colour and develops out of it, so the two feel like one place.
// Reduced motion: a quick fade instead of the spreading circle.
(() => {
  const COLORS = { ink: "#12110e", cobalt: "#2b3ec7", paper: "#f5f4f0" };
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("a[data-turn]").forEach((a) => {
    a.addEventListener("click", (e) => {
      // let new-tab clicks and modified clicks behave normally
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      const r = a.getBoundingClientRect();
      const x = e.clientX || r.left + r.width / 2;
      const y = e.clientY || r.top + r.height / 2;
      const cover = document.createElement("div");
      cover.className = "turn";
      cover.style.background = COLORS[a.dataset.turn] || COLORS.ink;
      document.body.appendChild(cover);
      const far = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      let gone = false;
      const go = () => { if (!gone) { gone = true; location.href = a.href; } };
      // if animations are paused (a background tab, a throttled frame), go anyway once the time is up
      setTimeout(go, calm ? 320 : 1000);
      if (calm) {
        cover.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, fill: "forwards" }).onfinish = go;
        return;
      }
      cover.animate(
        [{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${far}px at ${x}px ${y}px)` }],
        { duration: 900, easing: "cubic-bezier(.65, 0, .35, 1)", fill: "forwards" }
      ).onfinish = go;
    });
  });

  // coming back with the browser's back button: the page is restored with its cover still on
  addEventListener("pageshow", (e) => {
    if (e.persisted) document.querySelectorAll(".turn").forEach((c) => c.remove());
  });
})();
