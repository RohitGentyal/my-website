// A rainbow ribbon trailing the cursor arrow. Mouse only, off under reduced motion.
(function () {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const cv = document.createElement("canvas");
  cv.className = "trail";
  cv.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");

  const LIFE = 650; // ms a point lingers
  const ALPHA = 0.55; // opacity right at the arrow
  const WIDTH = 4.5; // px right at the arrow
  const pts = [];
  let dpr = 1, running = false;

  function size() {
    dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = innerWidth * dpr;
    cv.height = innerHeight * dpr;
  }
  size();
  addEventListener("resize", size);

  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (!running) { running = true; requestAnimationFrame(draw); }
  }, { passive: true });
  document.addEventListener("pointerleave", () => (pts.length = 0));

  function draw(now) {
    while (pts.length && now - pts[0].t > LIFE) pts.shift();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // smooth through midpoints; red at the arrow, running through the spectrum to violet at the tail
    const n = pts.length;
    for (let i = 1; i < n - 1; i++) {
      const a = pts[i - 1], b = pts[i], c = pts[i + 1];
      const life = Math.max(0, Math.min(1, 1 - (now - b.t) / LIFE));
      const along = (n - 1 - i) / Math.max(1, n - 2); // 0 at the arrow, 1 at the tail
      ctx.strokeStyle = `hsla(${along * 280}, 90%, 60%, ${ALPHA * life})`;
      ctx.lineWidth = 0.8 + (WIDTH - 0.8) * life;
      ctx.beginPath();
      ctx.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2);
      ctx.quadraticCurveTo(b.x, b.y, (b.x + c.x) / 2, (b.y + c.y) / 2);
      ctx.stroke();
    }
    if (pts.length) requestAnimationFrame(draw);
    else running = false;
  }
})();
