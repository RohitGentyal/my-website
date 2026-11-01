// A faint rainbow trail behind the cursor. Mouse only, off under reduced motion.
(function () {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const cv = document.createElement("canvas");
  cv.className = "trail";
  cv.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");

  const LIFE = 420; // ms a point lingers
  const pts = [];
  let dpr = 1, running = false, hue = 0;

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
    hue = (hue + 0.6) % 360;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const life = Math.min(1, 1 - (now - b.t) / LIFE); // 1 at the cursor, 0 at the tail
      ctx.strokeStyle = `hsla(${(hue + i * 9) % 360}, 85%, 62%, ${0.32 * life})`;
      ctx.lineWidth = 0.6 + 2.2 * life;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    if (pts.length) requestAnimationFrame(draw);
    else running = false;
  }
})();
