// A soft rainbow mist with drifting sparkles, streaming from the lower end of the cursor arrow.
// Mouse only, off under reduced motion.
(function () {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const cv = document.createElement("canvas");
  cv.className = "trail";
  cv.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");

  const LIFE = 900; // ms the mist lingers
  const MIST = 0.16; // mist opacity at the arrow
  const GLOW = 11; // mist radius in px at the arrow
  const SPARKS = 0.35; // sparkles per px of travel
  const FOLLOW = 0.14; // share of the gap the trail closes each frame: lower lags more
  const TAIL = { x: 9, y: 17 }; // the arrow's lower end, from its tip (the pointer position)
  const HUES = 24;

  // one soft round glow per hue, drawn once and stamped along the path
  const glows = [];
  for (let i = 0; i < HUES; i++) {
    const g = document.createElement("canvas");
    g.width = g.height = 64;
    const c = g.getContext("2d");
    const grad = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    const h = (i / HUES) * 360;
    grad.addColorStop(0, `hsla(${h}, 90%, 66%, 1)`);
    grad.addColorStop(0.4, `hsla(${h}, 90%, 62%, .45)`);
    grad.addColorStop(1, `hsla(${h}, 90%, 60%, 0)`);
    c.fillStyle = grad;
    c.fillRect(0, 0, 64, 64);
    glows.push(g);
  }
  const glowFor = (hue) => glows[Math.floor((((hue % 360) + 360) % 360) / 360 * HUES) % HUES];

  const pts = [];
  const sparks = [];
  const mouse = { x: 0, y: 0 };
  let head = null, dpr = 1, running = false, last = 0, owed = 0, travel = 0;

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
  document.addEventListener("pointerleave", () => { pts.length = 0; sparks.length = 0; head = null; });

  function draw(now) {
    const dt = Math.min(50, now - last);
    last = now;
    const hue = travel * 1.3; // the colour moves with distance, so a sweep reads as a rainbow along its length

    // the trail's start eases after the arrow (frame-rate independent)
    if (head) {
      const k = 1 - Math.pow(1 - FOLLOW, dt / 16.7);
      const px = head.x, py = head.y;
      head.x += (mouse.x - head.x) * k;
      head.y += (mouse.y - head.y) * k;
      const moved = Math.hypot(head.x - px, head.y - py);
      travel += moved;
      if (moved > 0.3) {
        pts.push({ x: head.x, y: head.y, t: now, hue });
        // sparkles shed in proportion to travel, drifting out sideways and sinking a little
        owed += moved * SPARKS;
        while (owed >= 1) {
          owed--;
          const f = Math.random();
          sparks.push({
            x: px + (head.x - px) * f + (Math.random() - 0.5) * 8,
            y: py + (head.y - py) * f + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 0.03,
            vy: 0.01 + Math.random() * 0.025,
            r: 0.5 + Math.random() * 1.1,
            star: Math.random() < 0.18,
            hue: hue + (Math.random() - 0.5) * 40,
            t: now,
            life: 600 + Math.random() * 700,
            tw: Math.random() * 6.28,
          });
        }
      }
    }
    while (pts.length && now - pts[0].t > LIFE) pts.shift();
    for (let i = sparks.length - 1; i >= 0; i--) if (now - sparks[i].t > sparks[i].life) sparks.splice(i, 1);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    // mist: soft glows stamped along the path, swelling a little as they age, then fading
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const age = (now - p.t) / LIFE;
      const r = GLOW * (0.7 + age * 0.8);
      ctx.globalAlpha = MIST * (1 - age) * (1 - age);
      ctx.drawImage(glowFor(p.hue), p.x - r, p.y - r, r * 2, r * 2);
    }

    // sparkles: tiny bright dots that twinkle, a few with a four-point glint
    for (const s of sparks) {
      const age = (now - s.t) / s.life;
      const a = (1 - age) * (0.55 + 0.45 * Math.sin(s.tw + (now - s.t) * 0.02));
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      ctx.globalAlpha = 0.5 * a;
      ctx.drawImage(glowFor(s.hue), s.x - s.r * 3, s.y - s.r * 3, s.r * 6, s.r * 6);
      ctx.globalAlpha = 0.85 * a;
      ctx.fillStyle = `hsl(${s.hue}, 100%, 88%)`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 0.6, 0, 6.283);
      ctx.fill();
      if (s.star) {
        const l = s.r * 3.2;
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(s.x - l, s.y); ctx.lineTo(s.x + l, s.y);
        ctx.moveTo(s.x, s.y - l); ctx.lineTo(s.x, s.y + l);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    const settled = !head || Math.hypot(mouse.x - head.x, mouse.y - head.y) < 0.5;
    if (pts.length || sparks.length || !settled) requestAnimationFrame(draw);
    else running = false;
  }
})();
