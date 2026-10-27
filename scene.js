// Painted hillside: flat, brushy planes of green, one tree, and someone lying
// on the slope listening to music.
// Rendered once to a canvas from a seeded random, so it looks the same every
// visit and is redrawn only when its size changes.
(function () {
  const scene = document.getElementById("scene");
  const canvas = document.getElementById("hill");
  const listener = document.getElementById("listener");
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
  // Where the cool shadow plane in the foreground begins
  const shadowTop = (x) => {
    const u = x / W;
    return H * (0.86 - 0.1 * Math.exp(-(((u - 0.42) / 0.34) ** 2))) + 4 * S * Math.sin(x * 0.013 + 1);
  };

  // A few flat tones, like a painted background plate
  const LIT = "#a6cc5b", LIT_DARK = "#93bb4d", LIT_LIGHT = "#bcdc72";
  const SHADE = "#5ea06c", SHADE_DARK = "#4c8b5d", SHADE_LIGHT = "#78b67d";
  const LEAF = ["#22432f", "#2e5b3d", "#45764a", "#699553"];

  // ---------------------------------------------------------------- hill
  function hillPath() {
    const p = new Path2D();
    p.moveTo(0, H);
    for (let x = 0; x <= W + 4; x += 3) p.lineTo(x, ridge(x));
    p.lineTo(W, H);
    p.closePath();
    return p;
  }

  // Short upright blades along an edge, for a brushy rather than vector line
  function fringe(edge, color, hMin, hMax) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let x = 0; x < W; x += r(1, 2.6)) {
      const y = edge(x) + 1.5, h = r(hMin, hMax) * S, lean = r(-1.2, 2.2) * S;
      ctx.moveTo(x - 0.9 * S, y);
      ctx.lineTo(x + lean, y - h);
      ctx.lineTo(x + 0.9 * S, y);
    }
    ctx.fill();
  }

  // A handful of dry-brush marks: thin, loose, roughly parallel strokes
  function dryBrush(x, y, color) {
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    const dir = rand() < 0.5 ? -1 : 1, ang = dir * r(0.35, 0.8);
    for (let i = 0, n = 3 + Math.floor(rand() * 4); i < n; i++) {
      const len = r(14, 34) * S, ox = x + i * 3 * S + r(-2, 2), oy = y + i * 1.5 * S + r(-2, 2);
      ctx.lineWidth = r(0.8, 1.6) * S;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.quadraticCurveTo(ox + Math.cos(ang) * len * 0.5, oy - Math.sin(ang) * len * 0.5 + 2 * S,
        ox + Math.cos(ang) * len, oy - Math.sin(ang) * len);
      ctx.stroke();
    }
  }

  // A soft dapple in the shade: a few short, fat strokes
  function dapple(x, y, color) {
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    for (let i = 0, n = 3 + Math.floor(rand() * 3); i < n; i++) {
      ctx.lineWidth = r(3, 6) * S;
      const ox = x + r(-14, 14) * S, oy = y + r(-4, 4) * S, len = r(6, 18) * S;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + len, oy + r(-2, 2) * S);
      ctx.stroke();
    }
  }

  function drawGrass() {
    // lit plane
    ctx.fillStyle = LIT;
    ctx.fill(hillPath());
    fringe(ridge, LIT, 1.5, 4);
    for (let i = 0, n = Math.round(W / 130); i < n; i++) {
      const x = r(0, W), y = r(ridge(x) + 18 * S, shadowTop(x) - 14 * S);
      if (y > ridge(x) + 12 * S) dryBrush(x, y, rand() < 0.6 ? LIT_DARK : LIT_LIGHT);
    }

    // cool shadow plane in the foreground, with a ragged grassy edge
    ctx.fillStyle = SHADE;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W + 4; x += 4) ctx.lineTo(x, shadowTop(x) + 2);
    ctx.lineTo(W, H);
    ctx.fill();
    fringe(shadowTop, SHADE, 2, 7);
    for (let i = 0, n = Math.round(W / 170); i < n; i++) {
      const x = r(0, W), y = r(shadowTop(x) + 16 * S, H - 8);
      if (y < H - 6) dapple(x, y, rand() < 0.6 ? SHADE_DARK : SHADE_LIGHT);
    }
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

    // flat shadow on the grass
    ctx.fillStyle = LIT_DARK;
    ctx.beginPath();
    ctx.ellipse(tx + 14 * s, ty + 1, 78 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // leaves behind the limbs, in shadow
    leafPass(clusters, s, true);

    // limbs and trunk
    segs.forEach(({ x, y, x2, y2, w, w2, bend }) => {
      const len = Math.hypot(x2 - x, y2 - y);
      const nx = -(y2 - y) / len, ny = (x2 - x) / len;
      const mx = (x + x2) / 2 + nx * bend, my = (y + y2) / 2 + ny * bend;
      const g = ctx.createLinearGradient(x + nx * w, y + ny * w, x - nx * w, y - ny * w);
      g.addColorStop(0, "#47392b");
      g.addColorStop(0.55, "#47392b");
      g.addColorStop(0.55, "#6f5a43");
      g.addColorStop(1, "#6f5a43");
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
    ctx.fillStyle = "#47392b";
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
        if (under) lum = 0;
        else {
          const facing = (ox * lx + oy * ly) * 0.5 + 0.5;
          const height = 1 - (c.y - cTop) / Math.max(1, cBot - cTop);
          lum = clamp(facing * 0.6 + height * 0.25 + r(-0.12, 0.18), 0, 1);
        }
        const p = buckets[Math.round(lum * (LEAF.length - 1))];
        const rw = r(2.4, 4.6) * s, rh = rw * r(0.5, 0.75), rot = r(-1, 1) + 0.5;
        p.moveTo(x + rw, y);
        p.ellipse(x, y, rw, rh, rot, 0, Math.PI * 2);
      }
    });
    buckets.forEach((p, i) => { ctx.fillStyle = LEAF[i]; ctx.fill(p); });
  }

  // ---------------------------------------------------------------- listener
  // The drawing lives in the page as SVG (so it can move and be clicked);
  // here we just set it down on the slope at the right angle.
  function placeListener(fx, k) {
    if (!listener) return;
    const w = 130 * k, h = 56 * k;
    const ang = Math.atan2(ridge(fx + 30) - ridge(fx - 30), 60) * 180 / Math.PI;
    listener.style.width = w + "px";
    listener.style.height = h + "px";
    listener.style.left = fx - w / 2 + "px";
    listener.style.top = canvas.offsetTop + ridge(fx) - h * (52 / 56) + 1 + "px";
    listener.style.transform = `rotate(${ang.toFixed(2)}deg)`;
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
    S = clamp(H / 560, 0.62, 1.15);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    seed = 20261027;

    const ts = clamp(Math.min((H * 0.5) / 360, W / 1300), 0.42, 1);
    drawGrass();
    drawTree(W - Math.max(W * 0.17, 215 * ts), ts);
    placeListener(W * (W < 600 ? 0.3 : 0.5), clamp(H / 560, 0.62, 1) * 1.05);
  }

  let t;
  // watch the canvas itself: late font loads shift the layout without a window resize
  new ResizeObserver(() => { cancelAnimationFrame(t); t = requestAnimationFrame(render); }).observe(canvas);
  if (document.fonts) document.fonts.ready.then(render);
  render();

  // ---------------------------------------------------------------- music, clock
  // Paste the playlist link here once it's ready; the listener on the hill opens it.
  const PLAYLIST_URL = "";
  if (listener) {
    listener.dataset.label = PLAYLIST_URL ? "Now playing · open the playlist" : "Now playing · playlist coming soon";
    listener.addEventListener("click", () => {
      if (PLAYLIST_URL) window.open(PLAYLIST_URL, "_blank", "noopener");
      else listener.classList.toggle("show-label");
    });
    listener.addEventListener("blur", () => listener.classList.remove("show-label"));
  }

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
