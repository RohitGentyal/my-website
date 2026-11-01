// A rainbow band streaming from the lower end of the cursor arrow. Mouse only, off under reduced motion.
(function () {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const cv = document.createElement("canvas");
  cv.className = "trail";
  cv.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");

  const LIFE = 900; // ms a point lingers
  const ALPHA = 0.5; // opacity at the arrow
  const STRIPE = 2.6; // px per colour band at the arrow
  const FOLLOW = 0.14; // share of the gap the band closes each frame: lower lags more
  const TAIL = { x: 9, y: 17 }; // the arrow's lower end, from its tip (the pointer position)
  const COLOURS = [0, 30, 55, 130, 210, 275]; // red, orange, yellow, green, blue, violet
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
    mouse.x = e.clientX + TAIL.x;
    mouse.y = e.clientY + TAIL.y;
    if (!head) head = { x: mouse.x, y: mouse.y };
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(draw); }
  }, { passive: true });
  document.addEventListener("pointerleave", () => { pts.length = 0; head = null; });

  function draw(now) {
    // the band's start eases after the arrow (frame-rate independent), leaving a point each frame
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
    ctx.lineCap = "butt";
    ctx.lineJoin = "round";

    const n = pts.length;
    if (n > 2) {
      // a unit normal at every point, so the colour bands run side by side
      const nx = [], ny = [], life = [];
      for (let i = 0; i < n; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
        nx[i] = -dy / d;
        ny[i] = dx / d;
        life[i] = Math.max(0, Math.min(1, 1 - (now - pts[i].t) / LIFE));
      }
      COLOURS.forEach((hue, s) => {
        const off = (s - (COLOURS.length - 1) / 2); // bands from one side to the other
        for (let i = 1; i < n - 1; i++) {
          const w = STRIPE * (0.25 + 0.75 * life[i]); // the band narrows as it fades
          const P = (j) => ({ x: pts[j].x + nx[j] * off * STRIPE * (0.25 + 0.75 * life[j]), y: pts[j].y + ny[j] * off * STRIPE * (0.25 + 0.75 * life[j]) });
          const a = P(i - 1), b = P(i), c = P(i + 1);
          ctx.strokeStyle = `hsla(${hue}, 85%, 60%, ${ALPHA * life[i]})`;
          ctx.lineWidth = w + 0.4; // slight overlap so no gaps show between bands
          ctx.beginPath();
          ctx.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2);
          ctx.quadraticCurveTo(b.x, b.y, (b.x + c.x) / 2, (b.y + c.y) / 2);
          ctx.stroke();
        }
      });
    }

    const settled = !head || Math.hypot(mouse.x - head.x, mouse.y - head.y) < 0.5;
    if (pts.length || !settled) requestAnimationFrame(draw);
    else running = false;
  }
})();
