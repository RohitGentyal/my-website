// Painted hillside: one smooth summer-green hill, one tree, one small figure.
// Rendered once to a canvas from a seeded random, so it looks the same every
// visit and is redrawn only when its size changes.
(function () {
  const scene = document.getElementById("scene");
  const canvas = document.getElementById("hill");
  const ball = document.getElementById("ball");
  const clock = document.getElementById("clock");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let seed;
  const rand = () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = (a, b) => a + rand() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  let W, H, S;
  // One broad, smooth hill cresting left of centre, like a summer field
  const ridge = (x) => {
    const u = x / W;
    return H * (0.62 - 0.22 * Math.exp(-(((u - 0.33) / 0.42) ** 2))) + 1.2 * Math.sin(x * 0.009);
  };
  // Where the darker foreground field begins
  const field = (x) => H * (0.86 - 0.05 * (x / W)) + 3 * Math.sin(x * 0.006 + 2);

  // Colour ramps, built once so the hot loops only index into arrays
  const ramp = (n, from, to) => Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const [h, s, l] = from.map((v, k) => v + (to[k] - v) * t);
    return `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`;
  });
  const GRASS = ramp(12, [112, 62, 26], [84, 66, 52]);
  const LEAF = ramp(20, [104, 48, 12], [80, 56, 48]);

  // Fine speckle used as a grass texture; tiny, low contrast, tiled
  let grain;
  function makeGrain() {
    const g = document.createElement("canvas");
    g.width = g.height = 160;
    const gx = g.getContext("2d");
    for (let i = 0; i < 5200; i++) {
      const x = rand() * 160, y = rand() * 160, light = rand() < 0.5;
      gx.fillStyle = light ? "rgba(235,255,170,.55)" : "rgba(10,50,0,.55)";
      gx.fillRect(x, y, 0.8, r(1.2, 2.6)); // short vertical flecks read as grass
    }
    return ctx.createPattern(g, "repeat");
  }

  // ---------------------------------------------------------------- hill
  function hillPath() {
    const p = new Path2D();
    p.moveTo(0, H);
    for (let x = 0; x <= W + 4; x += 3) p.lineTo(x, ridge(x));
    p.lineTo(W, H);
    p.closePath();
    return p;
  }

  function drawGrass() {
    let top = Infinity;
    for (let x = 0; x <= W; x += 6) top = Math.min(top, ridge(x));
    const hill = hillPath();
    const crestX = W * 0.33;

    ctx.save();
    ctx.clip(hill);

    // body: sunlit yellow-green on the crest, deepening to emerald below
    const body = ctx.createLinearGradient(0, top, 0, H);
    body.addColorStop(0, "#a6d640");
    body.addColorStop(0.18, "#7cc232");
    body.addColorStop(0.5, "#3f9a26");
    body.addColorStop(1, "#24741b");
    ctx.fillStyle = body;
    ctx.fillRect(0, top - 2, W, H - top + 2);

    // broad light from the upper left, across the crest
    const sun = ctx.createRadialGradient(crestX - W * 0.05, top, 0, crestX - W * 0.05, top, W * 0.55);
    sun.addColorStop(0, "rgba(214, 240, 120, .55)");
    sun.addColorStop(0.5, "rgba(170, 220, 80, .18)");
    sun.addColorStop(1, "rgba(170, 220, 80, 0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, top - 2, W, H);

    // the far side of the hill falls into soft shade
    const shade = ctx.createRadialGradient(W * 0.95, H * 0.78, 0, W * 0.95, H * 0.78, W * 0.5);
    shade.addColorStop(0, "rgba(10, 70, 20, .45)");
    shade.addColorStop(1, "rgba(10, 70, 20, 0)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, top - 2, W, H);

    // faint mowing bands that follow the contour of the hill
    ctx.lineCap = "round";
    for (let i = 0; i < 9; i++) {
      const off = 14 + i * (H - top) * 0.075;
      ctx.strokeStyle = i % 2 ? "rgba(230, 255, 150, .035)" : "rgba(0, 50, 0, .03)";
      ctx.lineWidth = r(14, 34) * S;
      ctx.beginPath();
      for (let x = -20; x <= W + 20; x += 12) ctx.lineTo(x, ridge(x) + off * (0.75 + 0.25 * x / W));
      ctx.stroke();
    }

    // foreground field: a darker, cooler green below a soft seam
    const fTop = Math.min(field(0), field(W));
    const fg = ctx.createLinearGradient(0, fTop, 0, H);
    fg.addColorStop(0, "#2f7f22");
    fg.addColorStop(1, "#1d5e16");
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W + 6; x += 6) ctx.lineTo(x, field(x));
    ctx.lineTo(W, H);
    ctx.fill();
    ctx.strokeStyle = "rgba(60, 50, 20, .35)";
    ctx.lineWidth = 2.2 * S;
    ctx.filter = "blur(1.2px)";
    ctx.beginPath();
    for (let x = 0; x <= W + 6; x += 6) ctx.lineTo(x, field(x) + 1);
    ctx.stroke();
    ctx.filter = "none";

    // fine grass grain over everything, stronger in the foreground
    ctx.fillStyle = grain;
    ctx.globalAlpha = 0.16;
    ctx.fillRect(0, top - 2, W, H);
    ctx.globalAlpha = 0.22;
    ctx.fillRect(0, fTop, W, H);
    ctx.globalAlpha = 1;
    ctx.restore();

    // a softly fuzzy crest so the skyline isn't a hard vector edge
    const fuzz = Array.from({ length: GRASS.length }, () => new Path2D());
    for (let x = 0; x < W; x += r(0.8, 1.8)) {
      const y = ridge(x) + r(0, 1.5), h = r(1, 3.2) * S;
      const p = fuzz[Math.floor(clamp(0.55 + 0.45 * Math.exp(-(((x - crestX) / (W * 0.4)) ** 2)) + r(-0.15, 0.1), 0, 0.999) * GRASS.length)];
      p.moveTo(x - 0.5, y);
      p.lineTo(x + r(-0.4, 0.8), y - h);
      p.lineTo(x + 0.5, y);
    }
    fuzz.forEach((p, i) => { ctx.fillStyle = GRASS[i]; ctx.fill(p); });
  }

  // ---------------------------------------------------------------- tree
  function drawTree(tx, s) {
    const ty = ridge(tx) + 2 * s;
    const segs = [], clusters = [];

    function grow(x, y, ang, len, w, depth, max) {
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      segs.push({ x, y, x2, y2, w, w2: w * 0.66, bend: r(-0.12, 0.12) * len });
      if (depth >= max) {
        clusters.push({ x: x2, y: y2 - 4 * s, r: r(24, 36) * s });
        return;
      }
      if (depth >= 1) clusters.push({ x: (x + x2) / 2, y: (y + y2) / 2 - 6 * s, r: r(16, 26) * s });
      const kids = rand() < 0.55 ? 2 : 3;
      for (let i = 0; i < kids; i++) {
        let a = ang + (i - (kids - 1) / 2) * r(0.45, 0.7) + r(-0.15, 0.15);
        a = a * 0.86 + -Math.PI / 2 * 0.14; // keep reaching for the light
        grow(x2, y2, a, len * r(0.62, 0.78), w * 0.66, depth + 1, max);
      }
    }

    // trunk forks low into broad limbs: a wide, sheltering crown
    const fork = { x: tx - 4 * s, y: ty - 92 * s };
    segs.push({ x: tx, y: ty, x2: fork.x, y2: fork.y, w: 24 * s, w2: 17 * s, bend: -6 * s });
    [[-2.75, 92, 4], [-2.2, 96, 4], [-1.85, 66, 3], [-1.52, 80, 3], [-1.18, 68, 3], [-0.92, 100, 4], [-0.5, 88, 4]].forEach(([a, l, d]) =>
      grow(fork.x, fork.y, a, l * s, 11 * s, 1, d));

    // soft shadow on the grass
    const sh = ctx.createRadialGradient(tx + 12 * s, ty, 0, tx + 12 * s, ty, 150 * s);
    sh.addColorStop(0, "rgba(10, 60, 10, .35)");
    sh.addColorStop(1, "rgba(10, 60, 10, 0)");
    ctx.fillStyle = sh;
    ctx.save();
    ctx.translate(0, ty);
    ctx.scale(1, 0.09);
    ctx.beginPath();
    ctx.arc(tx + 12 * s, 0, 150 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // leaves behind the limbs, in shadow
    leafPass(clusters, s, true);

    // limbs and trunk
    segs.forEach(({ x, y, x2, y2, w, w2, bend }) => {
      const len = Math.hypot(x2 - x, y2 - y);
      const nx = -(y2 - y) / len, ny = (x2 - x) / len;
      const mx = (x + x2) / 2 + nx * bend, my = (y + y2) / 2 + ny * bend;
      const g = ctx.createLinearGradient(x + nx * w, y + ny * w, x - nx * w, y - ny * w);
      g.addColorStop(0, "#4a3a28");
      g.addColorStop(0.55, "#7a6448");
      g.addColorStop(1, "#a28a68");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x + nx * w / 2, y + ny * w / 2);
      ctx.quadraticCurveTo(mx + nx * (w + w2) / 4, my + ny * (w + w2) / 4, x2 + nx * w2 / 2, y2 + ny * w2 / 2);
      ctx.lineTo(x2 - nx * w2 / 2, y2 - ny * w2 / 2);
      ctx.quadraticCurveTo(mx - nx * (w + w2) / 4, my - ny * (w + w2) / 4, x - nx * w / 2, y - ny * w / 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x2, y2, w2 / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // root flare and bark grain
    ctx.fillStyle = "#5c4a34";
    ctx.beginPath();
    ctx.moveTo(tx - 20 * s, ty + 1);
    ctx.quadraticCurveTo(tx - 11 * s, ty - 3 * s, tx - 11.5 * s, ty - 16 * s);
    ctx.lineTo(tx + 11.5 * s, ty - 16 * s);
    ctx.quadraticCurveTo(tx + 11 * s, ty - 3 * s, tx + 22 * s, ty + 1);
    ctx.fill();
    ctx.strokeStyle = "rgba(40, 30, 20, .35)";
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const bx = tx + r(-9, 9) * s, by = ty - r(4, 84) * s;
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + r(-1.5, 1.5) * s, by - 8 * s, bx + r(-1, 1) * s, by - r(10, 22) * s);
    }
    ctx.stroke();

    // sunlit leaves in front
    leafPass(clusters, s, false);
    return { top: Math.min(...clusters.map((c) => c.y - c.r)) };
  }

  function leafPass(clusters, s, under) {
    const buckets = Array.from({ length: LEAF.length }, () => new Path2D());
    const lx = -0.55, ly = -0.84; // light from upper left
    let cTop = Infinity, cBot = -Infinity;
    clusters.forEach((c) => { cTop = Math.min(cTop, c.y); cBot = Math.max(cBot, c.y); });
    clusters.forEach((c) => {
      const n = Math.round((c.r * c.r) / (under ? 7 : 4.5) / (s * s));
      for (let i = 0; i < n; i++) {
        const a = rand() * Math.PI * 2, d = Math.sqrt(rand());
        const ox = Math.cos(a) * d, oy = Math.sin(a) * d * 0.78;
        const x = c.x + ox * c.r + (under ? 5 * s : 0);
        const y = c.y + oy * c.r + (under ? 6 * s : 0);
        let lum;
        if (under) lum = r(0, 0.22);
        else {
          const facing = (ox * lx + oy * ly) * 0.5 + 0.5;
          const height = 1 - (c.y - cTop) / Math.max(1, cBot - cTop);
          lum = clamp(facing * 0.6 + height * 0.25 + r(-0.12, 0.18), 0, 1);
        }
        const p = buckets[Math.round(lum * (LEAF.length - 1))];
        const rw = r(1.6, 3.4) * s, rh = rw * r(0.45, 0.7), rot = r(-1, 1) + 0.5;
        p.moveTo(x + rw, y);
        p.ellipse(x, y, rw, rh, rot, 0, Math.PI * 2);
      }
    });
    buckets.forEach((p, i) => { ctx.fillStyle = LEAF[i]; ctx.fill(p); });
  }

  // ---------------------------------------------------------------- figure
  // A small footballer, facing the tree, ball at their feet.
  function drawFigure(fx, u) {
    const fy = ridge(fx) + 1;
    const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(fx + x * u, fy - (y + h) * u, w * u, h * u); };
    const SKIN = "#8a5a3c", KIT = "#b04a36", SHORTS = "#24262b", SOCK = "#efece4";

    ctx.fillStyle = "rgba(10, 60, 10, .3)";
    ctx.beginPath();
    ctx.ellipse(fx + 2 * u, fy, 7 * u, 1.3 * u, 0, 0, Math.PI * 2);
    ctx.fill();

    rect(-3.4, 0, 3.2, 1.3, "#1d1d1f"); rect(0.6, 0, 3.4, 1.3, "#1d1d1f");      // boots
    rect(-2.9, 1.2, 2.4, 8.5, SOCK);   rect(0.7, 1.2, 2.4, 8.5, SOCK);           // socks
    rect(-2.9, 9.6, 2.4, 5.4, SKIN);   rect(0.7, 9.6, 2.4, 5.4, SKIN);           // legs
    rect(-3.6, 14.8, 7.4, 5.6, SHORTS);                                           // shorts
    ctx.fillStyle = KIT;                                                           // shirt
    ctx.beginPath();
    ctx.moveTo(fx - 3.9 * u, fy - 20 * u);
    ctx.lineTo(fx - 4.5 * u, fy - 32.5 * u);
    ctx.quadraticCurveTo(fx, fy - 34.4 * u, fx + 4.5 * u, fy - 32.5 * u);
    ctx.lineTo(fx + 3.9 * u, fy - 20 * u);
    ctx.fill();
    rect(-6.1, 25.5, 2, 7, KIT); rect(4.1, 25.5, 2, 7, KIT);                       // sleeves
    rect(-6, 19.6, 1.8, 6.2, SKIN); rect(4.2, 19.6, 1.8, 6.2, SKIN);              // arms
    rect(-1.1, 33.2, 2.2, 2.2, SKIN);                                              // neck
    ctx.fillStyle = SKIN;
    ctx.beginPath();
    ctx.ellipse(fx + 0.4 * u, fy - 38.4 * u, 3.3 * u, 3.8 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#17120f";                                                     // hair
    ctx.beginPath();
    ctx.ellipse(fx - 0.2 * u, fy - 40.2 * u, 3.5 * u, 2.6 * u, -0.15, Math.PI * 0.95, Math.PI * 2.05);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.18)";                                        // light on the shirt
    ctx.fillRect(fx - 4.2 * u, fy - 32 * u, 2 * u, 11 * u);

    // a few blades in front of the boots so the figure stands in the grass
    ctx.fillStyle = "#79bf33";
    ctx.beginPath();
    for (let i = 0; i < 26; i++) {
      const x = fx + r(-9, 12) * u, y = fy + r(0, 1.6) * u, h = r(1.5, 3.6) * u, l = r(0, 1.4) * u;
      ctx.moveTo(x - 0.4 * u, y); ctx.lineTo(x + l, y - h); ctx.lineTo(x + 0.4 * u, y);
    }
    ctx.fill();

    // place the ball (a DOM element so it can roll on hover)
    if (ball) {
      const bs = Math.max(6, 5.2 * u);
      ball.style.width = ball.style.height = bs + "px";
      ball.style.left = fx + 7 * u - bs / 2 + "px";
      ball.style.top = canvas.offsetTop + ridge(fx + 7 * u) - bs + 0.6 * u + "px";
    }
  }

  // ---------------------------------------------------------------- render
  let lastW = 0, lastH = 0;
  function render() {
    const rect = canvas.getBoundingClientRect();
    if (Math.abs(rect.width - lastW) < 1 && Math.abs(rect.height - lastH) < 1) return;
    lastW = rect.width; lastH = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    S = clamp(H / 560, 0.62, 1.15);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    grain = grain || makeGrain(); // made before seeding so the tree never changes
    seed = 20261027;

    const ts = clamp(Math.min((H * 0.5) / 360, W / 1300), 0.42, 1);
    drawGrass();
    drawTree(W - Math.max(W * 0.17, 215 * ts), ts);
    drawFigure(W * (W < 600 ? 0.3 : 0.47), clamp(H / 560, 0.75, 1.15));
  }

  let t;
  // watch the canvas itself: late font loads shift the layout without a window resize
  new ResizeObserver(() => { cancelAnimationFrame(t); t = requestAnimationFrame(render); }).observe(canvas);
  if (document.fonts) document.fonts.ready.then(render);
  render();

  // ---------------------------------------------------------------- hobbies, clock
  const kickers = document.querySelectorAll('[data-kick]');
  kickers.forEach((k) => {
    k.addEventListener("mouseenter", () => scene.classList.add("kick"));
    k.addEventListener("mouseleave", () => scene.classList.remove("kick"));
    k.addEventListener("focus", () => scene.classList.add("kick"));
    k.addEventListener("blur", () => scene.classList.remove("kick"));
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
