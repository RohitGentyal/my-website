// A rainbow ribbon trailing the cursor arrow. Mouse only, off under reduced motion.
(function () {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const cv = document.createElement("canvas");
  cv.className = "trail";
  cv.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");

  const LIFE = 900; // ms a point lingers
  const ALPHA = 0.55; // opacity right at the head
  const WIDTH = 4.5; // px right at the head
  const FOLLOW = 0.14; // share of the gap the head closes each frame: lower lags more
  const pts = [];
  const mouse = { x: 0, y: 0 };
  let head = null, dpr = 1, running = false, last = 0;

  function size() {
    dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = innerWidth * dpr;
    cv.height = innerHeight * dpr;
  }
  size();
  addEventListener("resize", size);

  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (!head) head = { x: mouse.x, y: mouse.y };
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(draw); }
  }, { passive: true });
  document.addEventListener("pointerleave", () => { pts.length = 0; head = null; });

  function draw(now) {
    // the head eases after the arrow (frame-rate independent), leaving a point each frame
    if (head) {
      const k = 1 - Math.pow(1 - FOLLOW, (now - last) / 16.7);
      head.x += (mouse.x - head.x) * k;
      head.y += (mouse.y - head.y) * k;
      const p = pts[pts.length - 1];
      if (!p || Math.hypot(head.x - p.x, head.y - p.y) > 0.5) pts.push({ x: head.x, y: head.y, t: now });
    }
    last = now;
    while (pts.length && now - pts[0].t > LIFE) pts.shift();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // smooth through midpoints; red at the head, running through the spectrum to violet at the tail
    const n = pts.length;
    for (let i = 1; i < n - 1; i++) {
      const a = pts[i - 1], b = pts[i], c = pts[i + 1];
      const life = Math.max(0, Math.min(1, 1 - (now - b.t) / LIFE));
      const along = (n - 1 - i) / Math.max(1, n - 2); // 0 at the head, 1 at the tail
      ctx.strokeStyle = `hsla(${along * 280}, 90%, 60%, ${ALPHA * life})`;
      ctx.lineWidth = 0.8 + (WIDTH - 0.8) * life;
      ctx.beginPath();
      ctx.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2);
      ctx.quadraticCurveTo(b.x, b.y, (b.x + c.x) / 2, (b.y + c.y) / 2);
      ctx.stroke();
    }

    const settled = !head || Math.hypot(mouse.x - head.x, mouse.y - head.y) < 0.5;
    if (pts.length || !settled) requestAnimationFrame(draw);
    else running = false;
  }
})();
