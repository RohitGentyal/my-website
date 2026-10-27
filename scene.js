// Painted hero: a teal sky, one towering cumulus, and a grassy slope with a
// winding sandy path and a few rocks.
// Everything is laid down as seeded brush marks on a canvas, so it paints the
// same way on every visit and is redrawn only when its size changes.
(function () {
  const hero = document.querySelector(".hero");
  const intro = document.querySelector(".intro");
  const canvas = document.getElementById("hill");
  const skyCanvas = document.getElementById("sky");
  const clock = document.getElementById("clock");
  if (!canvas || !skyCanvas) return;
  const hillCtx = canvas.getContext("2d");
  const skyCtx = skyCanvas.getContext("2d");
  const touch = document.getElementById("touch");
  const touchCtx = touch && touch.getContext("2d");
  // sky and cloud paint on their own layer so they can drift behind the hill
  let ctx = skyCtx;

  let seed;
  const rand = () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = (a, b) => a + rand() * (b - a);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  let W, H, S, narrow;

  // The ridge climbs gently from left to right
  const ridge = (x) => {
    const u = x / W;
    const base = narrow ? 0.79 : 0.64, rise = narrow ? 0.11 : 0.15;
    return H * (base - rise * Math.pow(Math.max(u, 0), 0.85)) + 3 * S * Math.sin(x * 0.012) + 1.5 * S * Math.sin(x * 0.041 + 2);
  };
  const depth = (y, x) => clamp((y - ridge(x)) / (H - ridge(x)), 0, 1);

  const SKY = "#287fa8", SKY_LOW = "#2f8ab3";
  const CLOUD_LIT = "#f6f4dc", CLOUD_TOP = "#fbfaea", CLOUD_SHADE = "#e3e8d6", CLOUD_DEEP = "#cbdbd4";
  const GRASS = "#a3cd4c";
  const LIGHTS = ["#b4d75a", "#bcdc63", "#aed354"];
  const MIDS = ["#97c446", "#8fbe42", "#9cc84a"];
  const DARKS = ["#7cb13c", "#72a838", "#83b740"];
  const DEEPS = ["#5f9532", "#68a036", "#578b2f"];
  const PATH = "#e6ddb5", PATH_TAN = "#cdbd8b", PATH_LIGHT = "#f3edd2";

  // Smooth, cheap "noise" for where the cloud shadows and dark patches fall
  function patch(x, y) {
    const u = x / W, v = y / H;
    let n = Math.sin(x * 0.0075 + 1.3) * Math.sin(y * 0.021 + 0.4)
      + 0.6 * Math.sin(x * 0.0165 - y * 0.012 + 2.1)
      + 0.35 * Math.sin(x * 0.041 + y * 0.03);
    // a cooler, darker hollow in the lower right where the rocks sit
    n += 1.3 * Math.exp(-(((u - 0.8) ** 2) / 0.03 + ((v - 0.88) ** 2) / 0.012));
    return n;
  }

  // ---------------------------------------------------------------- sky + cloud
  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.7);
    g.addColorStop(0, SKY);
    g.addColorStop(1, SKY_LOW);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawCloud() {
    // keep the cloud clear of the intro text
    const heroTop = hero.getBoundingClientRect().top;
    const textBottom = intro ? intro.getBoundingClientRect().bottom - heroTop : 0;
    const cx = W * (narrow ? 0.64 : 0.68);
    const top = narrow ? textBottom + 22 * S : H * 0.1;
    const base = ridge(cx) + 30 * S;
    const ch = base - top;
    const cw = Math.min(W * (narrow ? 0.56 : 0.28), ch * 1.1);
    if (ch < 40) return;

    const lobes = [];
    const levels = 7;
    for (let i = 0; i < levels; i++) {
      const t = i / (levels - 1);
      const y = base - ch * (0.1 + 0.74 * t);
      const half = cw * 0.5 * (1 - 0.5 * t);
      const count = i < 2 ? 5 : i < 4 ? 4 : i < 6 ? 3 : 2;
      for (let j = 0; j < count; j++) {
        const x = cx + lerp(-half, half, (j + 0.5) / count) + r(-0.04, 0.04) * cw + 0.05 * cw * t;
        lobes.push({ x, y: y + r(-0.03, 0.03) * ch, r: cw * (0.2 - 0.075 * t) * r(0.85, 1.15), t });
      }
    }
    lobes.push({ x: cx + 0.07 * cw, y: base - ch * 0.93, r: cw * 0.13, t: 1 });
    // a smaller puff beside the tower
    const px = cx + cw * 0.66;
    for (let j = 0; j < 4; j++) lobes.push({ x: px + (j - 1.5) * cw * 0.07, y: base - ch * r(0.08, 0.2), r: cw * r(0.06, 0.09), t: 0.1 });

    // painted on its own layer so the whole cloud can be softened at once
    const layer = document.createElement("canvas");
    layer.width = canvas.width; layer.height = canvas.height;
    const lc = layer.getContext("2d");
    lc.setTransform(ctx.getTransform());
    const disc = (g, x, y, rad, color) => { g.fillStyle = color; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill(); };

    // brushy silhouette: overlapping dabs hugging the outer edge
    lobes.forEach((l) => {
      for (let k = 0; k < l.r * 0.7; k++) {
        const a = r(Math.PI * 0.9, Math.PI * 2.1), d = l.r * r(0.95, 1.01);
        lc.fillStyle = CLOUD_LIT;
        lc.beginPath();
        lc.ellipse(l.x + Math.cos(a) * d, l.y + Math.sin(a) * d, r(2, 4) * S, r(1.5, 3) * S, a, 0, Math.PI * 2);
        lc.fill();
      }
    });
    // back to front: each puff gets a thin, soft fold of shade underneath
    lobes.sort((a, b) => a.y - b.y).forEach((l) => {
      disc(lc, l.x, l.y, l.r, l.t < 0.35 ? CLOUD_DEEP : CLOUD_SHADE);
      disc(lc, l.x - l.r * 0.06, l.y - l.r * 0.11, l.r * 0.95, l.t > 0.7 ? CLOUD_TOP : CLOUD_LIT);
    });
    // a pale blue cast gathering towards the base
    const body = new Path2D();
    lobes.forEach((l) => { body.moveTo(l.x + l.r, l.y); body.arc(l.x, l.y, l.r, 0, Math.PI * 2); });
    lc.save();
    lc.clip(body);
    const cast = lc.createLinearGradient(0, base - ch * 0.55, 0, base);
    cast.addColorStop(0, "rgba(180, 208, 206, 0)");
    cast.addColorStop(1, "rgba(180, 208, 206, .55)");
    lc.fillStyle = cast;
    lc.fillRect(cx - cw, base - ch, cw * 2.4, ch);
    // brushy highlights on the sunlit tops
    lobes.forEach((l) => {
      lc.fillStyle = CLOUD_TOP;
      for (let k = 0; k < (l.t > 0.3 ? 4 : 1); k++) {
        lc.beginPath();
        lc.ellipse(l.x - l.r * r(0.05, 0.5), l.y - l.r * r(0.3, 0.7), r(3, 8) * S, r(1.5, 3) * S, -0.4, 0, Math.PI * 2);
        lc.fill();
      }
    });
    lc.restore();

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = "blur(0.8px)";
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
  }

  // ---------------------------------------------------------------- slope
  function hillPath() {
    const p = new Path2D();
    p.moveTo(0, H);
    for (let x = 0; x <= W + 4; x += 3) p.lineTo(x, ridge(x));
    p.lineTo(W, H);
    p.closePath();
    return p;
  }

  // every grass mark is drawn this much taller and a touch thicker
  const TALL = 1.75, THICK = 1.25;

  // one blade; `bend` tips it over from the root (0 = as painted)
  function blade(g, x, y, len, ang, w, color, j, bend) {
    g.strokeStyle = color;
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(ang + bend * 0.4) * len * 0.5 + j, y + Math.sin(ang + bend * 0.4) * len * 0.5, x + Math.cos(ang + bend) * len, y + Math.sin(ang + bend) * len);
    g.stroke();
  }

  function stroke(x, y, len, ang, w, color) {
    blade(ctx, x, y, len * TALL, ang, w * THICK, color, r(-1, 1), 0);
  }

  // a share of the slope's blades live on their own layer so they can be brushed
  let live = [];

  function tone(n) {
    if (n > 1.15) return DEEPS;
    if (n > 0.55) return DARKS;
    if (n < -0.75) return LIGHTS;
    return MIDS;
  }

  function drawSlope() {
    const hill = hillPath();
    ctx.save();
    ctx.clip(hill);
    ctx.fillStyle = GRASS;
    ctx.fillRect(0, 0, W, H);
    ctx.lineCap = "round";

    // broad patches of light and cloud shadow, laid in with flat dabs
    const step = 7 * S;
    for (let y = ridge(W) - 4; y < H + step; y += step * 0.7) {
      for (let x = -step; x < W + step; x += step) {
        const jx = x + r(-step, step), jy = y + r(-step, step) * 0.6;
        if (jy < ridge(jx) - 2) continue;
        const n = patch(jx, jy);
        if (n > -0.75 && n < 0.55) continue;
        const d = depth(jy, jx);
        ctx.fillStyle = pick(tone(n));
        ctx.beginPath();
        ctx.ellipse(jx, jy, r(5, 10) * S * (0.6 + d), r(2, 4) * S * (0.6 + d), r(-0.25, 0.1), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // many small grass strokes, sized for distance
    const count = Math.round((W * H) / 70);
    for (let i = 0; i < count; i++) {
      const x = r(0, W), y = r(ridge(W) - 4, H + 6);
      if (y < ridge(x) + 1) continue;
      const d = depth(y, x), n = patch(x, y);
      const set = rand() < 0.5 ? tone(n) : tone(n + (rand() < 0.5 ? 0.7 : -0.7));
      const len = r(3, 9) * S * (0.5 + d * 1.3), ang = -Math.PI / 2 + r(-0.6, 0.35), w = r(0.7, 1.6) * S * (0.6 + d), color = pick(set);
      if (i % 3 === 0) live.push({ x, y, len: len * TALL, ang, w: w * THICK, color, j: r(-1, 1), b: 0, v: 0 });
      else stroke(x, y, len, ang, w, color);
    }
    ctx.restore();

    // a crisp grassy ridge against the sky
    for (let x = 0; x < W; x += r(1, 2.4)) {
      const y = ridge(x) + 1.5;
      ctx.fillStyle = rand() < 0.75 ? GRASS : pick(MIDS);
      const h = r(2, 6) * S * TALL, lean = r(-1.5, 2.5) * S;
      ctx.beginPath();
      ctx.moveTo(x - 1 * S, y);
      ctx.lineTo(x + lean, y - h);
      ctx.lineTo(x + 1 * S, y);
      ctx.fill();
    }
  }

  // ---------------------------------------------------------------- path
  function pathPoints() {
    const ctrl = [[-0.04, 1.06], [0.16, 0.98], [0.33, 0.93], [0.46, 0.86], [0.56, 0.8], [0.7, 0.77], [0.84, 0.72], [0.96, 0.69], [1.08, 0.67]];
    const pts = ctrl.map(([u, v]) => {
      const x = u * W;
      return [x, Math.max(v * H, ridge(clamp(x, 0, W)) + 0.07 * H)];
    });
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let t = 0; t < 1; t += 0.05) {
        const t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    return out;
  }

  function drawPath() {
    const pts = pathPoints();
    const left = [], right = [];
    pts.forEach(([x, y], i) => {
      const [nx2, ny2] = pts[Math.min(i + 1, pts.length - 1)], [px2, py2] = pts[Math.max(i - 1, 0)];
      const dx = nx2 - px2, dy = ny2 - py2, len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const w = lerp(5, 34, depth(y, x)) * S * (1 + 0.25 * Math.sin(i * 0.7));
      left.push([x + nx * w * r(0.85, 1.1), y + ny * w * r(0.85, 1.1)]);
      right.push([x - nx * w * r(0.85, 1.1), y - ny * w * r(0.85, 1.1)]);
    });
    const shape = new Path2D();
    left.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
    [...right].reverse().forEach(([x, y]) => shape.lineTo(x, y));
    shape.closePath();

    ctx.fillStyle = PATH;
    ctx.fill(shape);
    ctx.save();
    ctx.clip(shape);
    // tan shading along the sides, pale wear down the middle
    pts.forEach(([x, y]) => {
      const d = depth(y, x);
      for (let k = 0; k < 3; k++) {
        ctx.fillStyle = rand() < 0.6 ? PATH_TAN : PATH_LIGHT;
        ctx.globalAlpha = r(0.35, 0.8);
        ctx.beginPath();
        ctx.ellipse(x + r(-30, 30) * S * d, y + r(-8, 8) * S * d, r(4, 12) * S * (0.4 + d), r(1, 3) * S * (0.4 + d), r(-0.3, 0.1), 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
    ctx.restore();

    // grass spilling over both edges
    ctx.lineCap = "round";
    [left, right].forEach((edge) => {
      edge.forEach(([x, y]) => {
        const d = depth(y, x);
        for (let k = 0; k < 3; k++) {
          stroke(x + r(-3, 3) * S, y + r(0, 3) * S, r(3, 9) * S * (0.4 + d), -Math.PI / 2 + r(-0.7, 0.7), r(0.8, 1.6) * S * (0.5 + d), pick(rand() < 0.5 ? MIDS : DARKS));
        }
      });
    });
    return shape;
  }

  // ---------------------------------------------------------------- rocks
  function drawRock(x, y, size) {
    const n = 7, pts = [];
    for (let i = 0; i < n; i++) {
      const a = Math.PI + (i / (n - 1)) * Math.PI;
      pts.push([x + Math.cos(a) * size * r(0.85, 1.1), y + Math.sin(a) * size * 0.85 * r(0.8, 1.15)]);
    }
    // shadow on the grass
    ctx.fillStyle = "#4f8030";
    ctx.beginPath();
    ctx.ellipse(x + size * 0.2, y + 1, size * 1.15, size * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    // body
    ctx.fillStyle = "#454a51";
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.lineTo(x + size, y + 2);
    ctx.lineTo(x - size, y + 2);
    ctx.fill();
    // lit top plane
    ctx.fillStyle = "#757c85";
    ctx.beginPath();
    ctx.moveTo(pts[1][0], pts[1][1] + size * 0.1);
    for (let i = 2; i < n - 1; i++) ctx.lineTo(pts[i][0], pts[i][1] + 1);
    ctx.lineTo(x + size * 0.25, y - size * 0.2);
    ctx.lineTo(x - size * 0.45, y - size * 0.12);
    ctx.fill();
    ctx.strokeStyle = "#8f969e";
    ctx.lineWidth = 1 * S;
    ctx.beginPath();
    ctx.moveTo(pts[2][0], pts[2][1] + 1);
    ctx.lineTo(pts[3][0], pts[3][1] + 1);
    ctx.stroke();
    // grass in front of the base
    for (let k = 0; k < size * 0.8; k++) {
      stroke(x + r(-size, size), y + r(0, 3) * S, r(3, 8) * S, -Math.PI / 2 + r(-0.6, 0.6), r(0.8, 1.5) * S, pick(rand() < 0.6 ? DARKS : DEEPS));
    }
  }

  function drawRocks() {
    [[0.62, 0.9, 0.85], [0.69, 0.84, 0.7], [0.76, 0.875, 1.1], [0.86, 0.82, 0.75]].forEach(([u, v, s]) => {
      const x = u * W, y = Math.max(v * H, ridge(x) + 0.12 * H);
      const size = 32 * s * S * (0.6 + depth(y, x));
      drawRock(x, y, size);
      rocks.push({ x, y, size });
    });
  }
  let rocks = [];

  // ---------------------------------------------------------------- clumps
  function clump(x, y, h) {
    const n = 5 + Math.floor(rand() * 5);
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (i - n / 2) * 0.16 + r(-0.15, 0.15);
      stroke(x + (i - n / 2) * 1.1 * S, y, h * r(0.6, 1.1), ang, r(1, 1.8) * S, pick(i % 3 ? DARKS : DEEPS));
    }
    for (let i = 0; i < 2; i++) stroke(x + r(-3, 3) * S, y - 1, h * r(0.5, 0.8), -Math.PI / 2 + r(-0.5, 0.5), 1 * S, pick(LIGHTS));
  }

  function drawClumps() {
    const n = Math.round(W / 40);
    for (let i = 0; i < n; i++) {
      const x = r(0, W), y = r(ridge(x) + 10 * S, H + 4);
      clump(x, y, r(5, 11) * S * (0.4 + depth(y, x) * 1.4));
    }
  }

  // ---------------------------------------------------------------- render
  let lastW = 0, lastH = 0;
  function render() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return; // hidden or not laid out yet
    if (Math.abs(rect.width - lastW) < 1 && Math.abs(rect.height - lastH) < 1) return;
    lastW = rect.width; lastH = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    narrow = W < 760;
    S = clamp(Math.min(H / 800, W / 1200), 0.6, 1.2);
    [canvas, skyCanvas, touch].forEach((c) => {
      if (!c) return;
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    seed = 20261027;

    ctx = skyCtx;
    drawSky();
    drawCloud();
    ctx = hillCtx;
    live = []; rocks = [];
    drawSlope();
    const path = drawPath();
    drawRocks();
    drawClumps();
    // blades the path or a rock would have covered stay hidden
    live = live.filter((l) => {
      const tx = l.x + Math.cos(l.ang) * l.len, ty = l.y + Math.sin(l.ang) * l.len;
      if (ctx.isPointInPath(path, l.x * dpr, l.y * dpr) || ctx.isPointInPath(path, tx * dpr, ty * dpr)) return false;
      return !rocks.some((k) => Math.abs(l.x - k.x) < k.size * 1.1 && l.y > k.y - k.size && l.y < k.y + 4);
    });
    hillClip = hillPath();
    drawLive();
  }

  // ---------------------------------------------------------------- touch grass
  // Run the cursor over the slope and the blades under it lean away and spring
  // back; the cursor itself disappears so it feels like a hand in the grass.
  let hillClip, raf = 0, pointer = null;

  function drawLive() {
    if (!touchCtx) return;
    touchCtx.clearRect(0, 0, W, H);
    touchCtx.save();
    touchCtx.clip(hillClip);
    touchCtx.lineCap = "round";
    live.forEach((l) => blade(touchCtx, l.x, l.y, l.len, l.ang, l.w, l.color, l.j, l.b));
    touchCtx.restore();
  }

  function step() {
    raf = 0;
    let moving = false;
    live.forEach((l) => {
      l.v = (l.v - l.b * 0.08) * 0.84;
      l.b = clamp(l.b + l.v, -1.3, 1.3);
      if (Math.abs(l.b) > 0.002 || Math.abs(l.v) > 0.002) moving = true;
      else l.b = l.v = 0;
    });
    drawLive();
    if (moving) raf = requestAnimationFrame(step);
  }

  function brush(x, y, dx) {
    const reach = 60 * S;
    live.forEach((l) => {
      const mx = l.x + Math.cos(l.ang) * l.len * 0.6, my = l.y + Math.sin(l.ang) * l.len * 0.6;
      const dist = Math.hypot(mx - x, my - y);
      if (dist > reach) return;
      const f = 1 - dist / reach;
      l.v += (clamp(dx, -30, 30) * 0.02 + Math.sign(mx - x || 1) * 0.08) * f;
    });
    if (!raf) raf = requestAnimationFrame(step);
  }

  if (touch) {
    hero.addEventListener("pointermove", (e) => {
      const rect = touch.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const onGrass = !e.target.closest(".intro, .live") && y > ridge(x);
      hero.classList.toggle("touching", onGrass);
      if (onGrass) brush(x, y, pointer ? x - pointer.x : 0);
      pointer = onGrass ? { x, y } : null;
    });
    hero.addEventListener("pointerleave", () => { hero.classList.remove("touching"); pointer = null; });
  }

  let t;
  // watch the canvas itself: late font loads shift the layout without a window resize
  new ResizeObserver(() => { cancelAnimationFrame(t); t = requestAnimationFrame(render); }).observe(canvas);
  // the cloud dodges the intro text, so repaint once the fonts have settled its height
  if (document.fonts) document.fonts.ready.then(() => { lastW = 0; render(); });
  render();

  // ---------------------------------------------------------------- parallax
  // On scroll the sky and cloud sink slower than the hill, and the intro
  // lifts away gently, so the scene reads as layers with depth.
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  let ticking = false;
  function parallax() {
    ticking = false;
    const y = still.matches ? 0 : clamp(window.scrollY, 0, hero.offsetHeight);
    skyCanvas.style.transform = `translate3d(0, ${y * 0.45}px, 0)`;
    if (intro) {
      intro.style.transform = `translate3d(0, ${y * 0.25}px, 0)`;
      intro.style.opacity = clamp(1 - y / (hero.offsetHeight * 0.6), 0, 1);
    }
  }
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
  }, { passive: true });
  still.addEventListener("change", parallax);
  parallax();

  // ---------------------------------------------------------------- music, clock
  // Paste the playlist link here once it's ready. Any element marked
  // data-playlist (e.g. a small "now playing" link in the intro) then points
  // at it; until then those elements stay hidden.
  const PLAYLIST_URL = "";
  document.querySelectorAll("[data-playlist]").forEach((el) => {
    if (!PLAYLIST_URL) { el.hidden = true; return; }
    el.href = PLAYLIST_URL;
    el.target = "_blank";
    el.rel = "noopener";
  });

  function tick() {
    if (!clock) return;
    const now = new Date();
    const h = now.getHours();
    const part = h < 5 ? "Late night" : h < 12 ? "Morning" : h < 17 ? "Afternoon" : h < 20 ? "Golden hour" : "Evening";
    clock.textContent = `${part} on the hill · ${now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} where you are`;
  }
  tick();
  setInterval(tick, 30000);

  const yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();
})();
