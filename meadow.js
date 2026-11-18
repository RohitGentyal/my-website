// The footer: the far end of the hero's world. The same sky, cloud and meadow, painted in the same hand
// (seeded brush marks, the hill's palette), seen from further off: a bank of cumulus sitting on the far
// hills, the sandy path from the top of the page finally arriving at a lone tree, flowers along the way.
// At night: the night sky, stars, the land tinted moonlit, a few fireflies.
// One canvas, painted once when the footer comes near (and again only if its width or the theme changes).
// No per-frame work. The page fades into its sky (style.css, .meadow mask), the way the hill fades into
// the page, so the flow never breaks.
(() => {
  const foot = document.getElementById("end");
  const cv = document.getElementById("meadow");
  if (!foot || !cv) return;
  const main = cv.getContext("2d");
  let g = main;

  let seed;
  const rand = () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = (a, b) => a + rand() * (b - a);
  const pick = (a) => a[Math.floor(rand() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // the hill's own palette (scene.js)
  const DAY_SKY = { top: "#1d6e98", mid: "#2a83ad", low: "#4d9dbf", haze: "236, 239, 212", hazeA: 0.3 };
  const NIGHT_SKY = { top: "#0a1430", mid: "#132a55", low: "#26477a", haze: "110, 140, 200", hazeA: 0.22 };
  const DAY_CLOUD = { lit: "#f6f4dc", top: "#fbfaea", shade: "#e3e8d6", deep: "#cbdbd4" };
  const NIGHT_CLOUD = { lit: "#a9b6d3", top: "#c4cee4", shade: "#7d8cb0", deep: "#5f6f97" };
  const GRASS = "#a3cd4c";
  const LIGHTS = ["#b4d75a", "#bcdc63", "#aed354"];
  const MIDS = ["#97c446", "#8fbe42", "#9cc84a"];
  const DARKS = ["#7cb13c", "#72a838", "#83b740"];
  const DEEPS = ["#5f9532", "#68a036", "#578b2f"];
  const PATH = "#e6ddb5", PATH_TAN = "#cdbd8b", PATH_LIGHT = "#f3edd2";
  const BLOOMS = [
    ["#e9579b", "#f07bb4", "#fbd2e4"], ["#f39a3a", "#f7b54b", "#ffe08a"], ["#fffbea", "#f6f1da", "#f4c542"],
    ["#9b6fd6", "#b48ce6", "#f6ecff"], ["#f7d038", "#ffe066", "#e8892b"], ["#ef5b4c", "#f47c6a", "#ffd27a"], ["#5a9fe6", "#7bb6f0", "#fff4c2"],
  ];
  const LEAVES = ["#4f8a2e", "#5f9a34", "#6eaa3a"];

  let W, H, S, narrow, lift = 0; // phones drop the horizon so the stacked words keep open sky
  // far hills, then the near meadow's rolling edge
  const far = (x) => H * (0.6 + lift + 0.022 * Math.sin((x / W) * 5.2 + 1) + 0.012 * Math.sin((x / W) * 14 + 0.3));
  const near = (x) => H * (0.69 + lift - 0.035 * Math.sin((x / W) * 3.1 + 0.6) + 0.01 * Math.sin((x / W) * 11 + 2));
  const depth = (y) => clamp((y - H * (0.66 + lift)) / (H * (0.34 - lift)), 0, 1);
  const patch = (x, y) => Math.sin(x * 0.0075 + 1.3) * Math.sin(y * 0.021 + 0.4) + 0.6 * Math.sin(x * 0.0165 - y * 0.012 + 2.1) + 0.35 * Math.sin(x * 0.041 + y * 0.03);
  const tone = (n) => (n > 1.15 ? DEEPS : n > 0.55 ? DARKS : n < -0.75 ? LIGHTS : MIDS);

  function sky(p) {
    const s = g.createLinearGradient(0, 0, 0, H * (0.66 + lift));
    s.addColorStop(0, p.low); s.addColorStop(0.4, p.mid); s.addColorStop(0.7, p.mid); s.addColorStop(1, p.low);
    g.fillStyle = s; g.fillRect(0, 0, W, H);
    const hz = g.createLinearGradient(0, H * 0.3, 0, H * 0.66);
    hz.addColorStop(0, `rgba(${p.haze},0)`); hz.addColorStop(1, `rgba(${p.haze},${p.hazeA})`);
    g.fillStyle = hz; g.fillRect(0, H * 0.3, W, H * 0.4);
  }

  function stars() {
    for (let i = 0; i < 90; i++) {
      const x = r(0, W), y = r(H * 0.1, H * 0.55), a = r(0.25, 0.9) * (1 - y / (H * 0.6)) + 0.1;
      g.fillStyle = `rgba(255, 250, 225, ${a.toFixed(2)})`;
      g.beginPath(); g.arc(x, y, r(0.5, 1.3) * S, 0, Math.PI * 2); g.fill();
    }
  }

  // a cumulus like the hero's small clouds: a tall middle dome, smaller uneven domes to the sides, a soft
  // flat base that melts away, light on top easing into shade, brushy dabs along the tops
  function puff(cx, baseY, u, pal) {
    const shape = [[0, -0.2, 0.27], [-0.25, -0.09, 0.19], [0.24, -0.11, 0.21], [-0.43, -0.02, 0.12], [0.44, -0.03, 0.13], [0.08, -0.36, 0.16], [-0.12, -0.29, 0.14]];
    const lobes = shape.map(([x, y, rr]) => ({ x: cx + (x + r(-0.03, 0.03)) * u, y: baseY + (y + r(-0.02, 0.02)) * u, r: rr * u * r(0.88, 1.12) }));
    const body = new Path2D();
    lobes.forEach((l) => { body.moveTo(l.x + l.r, l.y); body.arc(l.x, l.y, l.r, 0, Math.PI * 2); });
    body.moveTo(cx + 0.5 * u, baseY - 0.01 * u);
    body.ellipse(cx, baseY - 0.01 * u, 0.5 * u, 0.06 * u, 0, 0, Math.PI * 2);
    const top = Math.min(...lobes.map((l) => l.y - l.r));
    g.save();
    g.beginPath(); g.rect(cx - u, top - 10, 2 * u, baseY - top + 10); g.clip();
    g.clip(body);
    const gr = g.createLinearGradient(0, top, 0, baseY);
    gr.addColorStop(0, pal.top); gr.addColorStop(0.5, pal.lit); gr.addColorStop(0.82, pal.shade); gr.addColorStop(1, pal.deep);
    g.fillStyle = gr; g.fillRect(cx - u, top - 10, 2 * u, baseY - top + 10);
    g.fillStyle = pal.top;
    lobes.filter((l) => l.y < baseY - 0.08 * u).forEach((l) => {
      g.globalAlpha = 0.55; g.beginPath(); g.arc(l.x - l.r * 0.12, l.y - l.r * 0.16, l.r * 0.72, 0, Math.PI * 2); g.fill();
    });
    g.globalAlpha = 1;
    g.restore();
    lobes.filter((l) => l.y < baseY - 0.05 * u).forEach((l) => {
      for (let k = 0; k < l.r * 0.35; k++) {
        const a = r(Math.PI * 1.05, Math.PI * 1.95), d = l.r * r(0.9, 1);
        g.fillStyle = rand() < 0.5 ? pal.top : pal.lit;
        g.beginPath(); g.ellipse(l.x + Math.cos(a) * d, l.y + Math.sin(a) * d, r(1.5, 3) * S, r(1, 2) * S, a, 0, Math.PI * 2); g.fill();
      }
    });
  }

  function clouds(pal) {
    // a bank resting on the far hills (their bases hide behind them), smaller ones further off, and one
    // drifting high on the right; sized so they stay under the footer's words
    const max = narrow ? 150 : 230;
    const xs = narrow ? [0.12, 0.5, 0.86] : [0.04, 0.2, 0.37, 0.55, 0.72, 0.9];
    xs.forEach((u, i) => puff(u * W + r(-30, 30) * S, far(u * W) + 14 * S, r(0.62, 1) * max * S * (i % 2 ? 0.8 : 1), pal));
  }

  function hills(night) {
    // far hills: hazy, cooler, a few soft dabs
    const p = new Path2D(); p.moveTo(0, H);
    for (let x = 0; x <= W + 4; x += 4) p.lineTo(x, far(x));
    p.lineTo(W, H); p.closePath();
    const fg = g.createLinearGradient(0, H * 0.57, 0, H * 0.72);
    fg.addColorStop(0, "#a9d0a4"); fg.addColorStop(1, "#7fb07a");
    g.fillStyle = fg; g.fill(p);
    g.save(); g.clip(p);
    for (let i = 0; i < W / 1.5; i++) {
      const x = r(0, W), y = r(far(x), far(x) + H * 0.1);
      g.fillStyle = pick(["#8dbd8f", "#a7cfa3", "#93c294", "#78a974", "#b5d6ad"]); g.globalAlpha = 0.55;
      g.beginPath(); g.ellipse(x, y, r(6, 16) * S, r(1.5, 3) * S, 0, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
    // a row of far trees along the crest, little rounded dabs
    for (let x = r(0, 30); x < W; x += r(14, 60) * S) {
      const y = far(x) + 2, s = r(4, 9) * S;
      g.fillStyle = pick(["#6fa070", "#7aac78", "#64946a"]);
      g.beginPath(); g.ellipse(x, y - s * 0.6, s, s * 0.85, 0, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }

  function meadow() {
    const p = new Path2D(); p.moveTo(0, H);
    for (let x = 0; x <= W + 4; x += 3) p.lineTo(x, near(x));
    p.lineTo(W, H); p.closePath();
    g.save(); g.clip(p);
    g.fillStyle = GRASS; g.fillRect(0, 0, W, H);
    const step = 7 * S;
    for (let y = H * (0.62 + lift); y < H + step; y += step * 0.7) for (let x = -step; x < W + step; x += step) {
      const jx = x + r(-step, step), jy = y + r(-step, step) * 0.6, n = patch(jx, jy);
      if (n > -0.75 && n < 0.55) continue;
      const d = depth(jy);
      g.fillStyle = pick(tone(n));
      g.beginPath(); g.ellipse(jx, jy, r(5, 10) * S * (0.6 + d), r(2, 4) * S * (0.6 + d), r(-0.25, 0.1), 0, Math.PI * 2); g.fill();
    }
    g.lineCap = "round";
    const count = Math.round((W * H * (0.36 - lift)) / 40);
    for (let i = 0; i < count; i++) {
      const x = r(0, W), y = r(H * (0.62 + lift), H + 6);
      if (y < near(x) + 1) continue;
      const d = depth(y), n = patch(x, y);
      const set = rand() < 0.5 ? tone(n + 0.7) : tone(n - 0.5);
      blade(x, y, r(3, 9) * S * (0.9 + d) * 2.2, -Math.PI / 2 + r(-0.6, 0.35), r(0.7, 1.5) * S * (0.8 + d * 0.8), pick(set));
    }
    g.restore();
    // a crisp grassy edge against the far hills
    for (let x = 0; x < W; x += r(1, 2.4)) {
      const y = near(x) + 1.5, h = r(2, 6) * S * 2.2, lean = r(-1.5, 2.5) * S;
      g.fillStyle = rand() < 0.75 ? GRASS : pick(MIDS);
      g.beginPath(); g.moveTo(x - S, y); g.lineTo(x + lean, y - h); g.lineTo(x + S, y); g.fill();
    }
  }

  function blade(x, y, len, ang, w, color) {
    g.strokeStyle = color; g.lineWidth = w;
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(ang) * len * 0.5 + r(-1, 1), y + Math.sin(ang) * len * 0.5, x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    g.stroke();
  }

  // the path from the top of the page, arriving at the tree: wide and near at the bottom left, narrowing
  // as it climbs away
  let tree;
  function path() {
    const end = [tree.x - 6 * S, tree.y + 3 * S];
    const ctrl = narrow
      ? [[-0.1, 1.06], [0.14, 0.99], [0.34, 0.94], [0.56, 0.9], [end[0] / W, end[1] / H]]
      : [[-0.06, 1.1], [0.07, 1.0], [0.17, 0.93], [0.27, 0.87], [0.36, 0.82], [end[0] / W, end[1] / H]];
    const P = ctrl.map(([u, v]) => [u * W, v * H]);
    const pts = [];
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      for (let t = 0; t < 1; t += 0.05) {
        const t2 = t * t, t3 = t2 * t, f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        pts.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    pts.push(end);
    const L = [], R = [];
    pts.forEach(([x, y], i) => {
      const [a, b] = pts[Math.min(i + 1, pts.length - 1)], [c, d] = pts[Math.max(i - 1, 0)];
      const dx = a - c, dy = b - d, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
      const w = lerp(2.5, 40, Math.pow(depth(y), 1.3)) * S * (1 + 0.2 * Math.sin(i * 0.7));
      L.push([x + nx * w * r(0.85, 1.1), y + ny * w * r(0.85, 1.1)]);
      R.push([x - nx * w * r(0.85, 1.1), y - ny * w * r(0.85, 1.1)]);
    });
    const shape = new Path2D();
    L.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
    [...R].reverse().forEach(([x, y]) => shape.lineTo(x, y));
    shape.closePath();
    g.fillStyle = PATH; g.fill(shape);
    g.save(); g.clip(shape);
    pts.forEach(([x, y]) => {
      const d = depth(y);
      for (let k = 0; k < 3; k++) {
        g.fillStyle = rand() < 0.6 ? PATH_TAN : PATH_LIGHT; g.globalAlpha = r(0.35, 0.8);
        g.beginPath(); g.ellipse(x + r(-30, 30) * S * d, y + r(-6, 6) * S * d, r(4, 12) * S * (0.3 + d), r(1, 3) * S * (0.3 + d), r(-0.3, 0.1), 0, Math.PI * 2); g.fill();
      }
    });
    g.globalAlpha = 1; g.restore();
    g.lineCap = "round";
    [L, R].forEach((edge) => edge.forEach(([x, y]) => {
      const d = depth(y);
      for (let k = 0; k < 3; k++) blade(x + r(-3, 3) * S, y + r(0, 3) * S, r(3, 9) * S * (0.3 + d) * 2.2, -Math.PI / 2 + r(-0.7, 0.7), r(0.8, 1.5) * S * (0.4 + d), pick(rand() < 0.5 ? MIDS : DARKS));
    }));
  }

  // the tree at the end of the path: a forked trunk and a full crown built from leafy clusters, dark
  // underneath, catching light on its upper left like the clouds
  function drawTree() {
    const { x, y, h } = tree;
    // shade on the grass, falling right
    g.save();
    g.translate(x + h * 0.16, y + 2 * S); g.scale(1, 0.13);
    const sh = g.createRadialGradient(0, 0, 0, 0, 0, h * 0.46);
    sh.addColorStop(0, "rgba(58, 98, 36, 0.5)"); sh.addColorStop(0.6, "rgba(64, 110, 40, 0.28)"); sh.addColorStop(1, "rgba(70, 120, 40, 0)");
    g.fillStyle = sh; g.beginPath(); g.arc(0, 0, h * 0.46, 0, Math.PI * 2); g.fill();
    g.restore();
    // trunk and two limbs
    g.fillStyle = "#5b4636"; g.strokeStyle = "#5b4636"; g.lineCap = "round";
    g.beginPath();
    g.moveTo(x - h * 0.045, y); g.quadraticCurveTo(x - h * 0.022, y - h * 0.25, x - h * 0.016, y - h * 0.46);
    g.lineTo(x + h * 0.02, y - h * 0.46); g.quadraticCurveTo(x + h * 0.024, y - h * 0.25, x + h * 0.05, y); g.closePath(); g.fill();
    [[-1, 0.16, 0.6], [1, 0.2, 0.66], [-0.3, 0.05, 0.75]].forEach(([dir, spread, top]) => {
      g.lineWidth = h * 0.016;
      g.beginPath(); g.moveTo(x, y - h * 0.36); g.quadraticCurveTo(x + dir * h * spread * 0.4, y - h * 0.5, x + dir * h * spread, y - h * top); g.stroke();
    });
    g.fillStyle = "#7a624d";
    g.beginPath(); g.ellipse(x - h * 0.012, y - h * 0.2, h * 0.006, h * 0.12, 0, 0, Math.PI * 2); g.fill();
    // crown: clusters on a wide dome
    const cx = x + h * 0.02, cy = y - h * 0.66, R = h * 0.4;
    const blobs = [];
    // the dome: clusters scattered over an uneven, lopsided oval
    for (let i = 0; i < 22; i++) {
      const a = r(0, Math.PI * 2), d = Math.sqrt(rand()) * 0.95;
      blobs.push({ x: cx + Math.cos(a) * R * d * 1.08, y: cy + Math.sin(a) * R * d * 0.74, r: R * r(0.22, 0.4) });
    }
    // a few clusters bulging out and hanging lower, so the outline is never a smooth lollipop
    [[-1.15, 0.25], [1.2, 0.18], [-0.7, 0.55], [0.75, 0.52], [0.1, -0.78], [-0.45, -0.62], [0.55, -0.6]].forEach(([u, v]) =>
      blobs.push({ x: cx + u * R * r(0.9, 1.05), y: cy + v * R * r(0.9, 1.05), r: R * r(0.24, 0.32) }));
    blobs.sort((a, b) => a.y - b.y);
    const leaf = (bx, by, br, set, n, sz) => {
      for (let k = 0; k < n; k++) {
        const a = r(0, Math.PI * 2), d = Math.sqrt(rand()) * br;
        g.fillStyle = pick(set);
        g.beginPath(); g.ellipse(bx + Math.cos(a) * d, by + Math.sin(a) * d * 0.85, r(3.5, 7) * S * sz, r(2.2, 4.2) * S * sz, r(-0.6, 0.6), 0, Math.PI * 2); g.fill();
      }
    };
    // deep base, then mid body, then light on the upper left of each cluster
    blobs.forEach((b) => leaf(b.x, b.y + b.r * 0.05, b.r * 0.95, ["#3f6f2a", "#456f2c", "#3a6527"], b.r * 2.4, 1.5));
    blobs.forEach((b) => leaf(b.x, b.y + b.r * 0.1, b.r, ["#4f8a2e", "#578b2f", "#4a7f2b"], b.r * 1.4, 1.1));
    blobs.filter((b) => b.y > cy + R * 0.15).forEach((b) => leaf(b.x, b.y + b.r * 0.35, b.r * 0.7, ["#3d6b29", "#44752c", "#365f25"], b.r * 1.1, 1));
    blobs.filter((b) => b.y < cy + R * 0.3).forEach((b) => leaf(b.x - b.r * 0.15, b.y - b.r * 0.2, b.r * 0.72, DARKS.concat(MIDS), b.r * 1.1, 1));
    const lit = (b) => (b.x - cx) / R * 0.6 + (b.y - cy) / R < -0.15; // the upper-left side of the whole crown
    blobs.filter(lit).forEach((b) => leaf(b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.5, LIGHTS, b.r * 0.6, 0.9));
    blobs.filter((b) => !lit(b) && b.y < cy).forEach((b) => leaf(b.x - b.r * 0.25, b.y - b.r * 0.3, b.r * 0.4, MIDS, b.r * 0.4, 0.9));
    // a few gaps of sky through the crown edge
    // grass round the foot of the trunk
    for (let k = 0; k < 26; k++) blade(x + r(-h * 0.08, h * 0.08), y + r(0, 3) * S, r(4, 9) * S * 2, -Math.PI / 2 + r(-0.6, 0.6), r(0.8, 1.4) * S, pick(DARKS));
  }

  function flowers() {
    const spots = narrow
      ? [[0.12, 0.86], [0.5, 0.88], [0.9, 0.85]]
      : [[0.05, 0.82], [0.2, 0.8], [0.66, 0.86], [0.76, 0.79], [0.88, 0.84], [0.97, 0.76], [0.33, 0.95], [0.5, 0.9]];
    spots.forEach(([u, v]) => {
      const cx = u * W, cy = Math.max(v * H, near(cx) + 0.04 * H), d = depth(cy), R = 70 * S * (0.3 + d);
      const pal = pick(BLOOMS), alt = pick(BLOOMS);
      for (let k = 0; k < 50; k++) {
        g.fillStyle = pick(LEAVES);
        g.beginPath(); g.ellipse(cx + r(-R, R), cy + r(-R * 0.3, R * 0.3), r(3, 6) * S * (0.4 + d), r(1.2, 2.6) * S * (0.4 + d), r(-0.9, 0.9), 0, Math.PI * 2); g.fill();
      }
      const n = 26 + Math.floor(rand() * 12);
      for (let k = 0; k < n; k++) {
        const bx = cx + r(-R, R) * 0.9, by = cy + r(-R * 0.25, R * 0.3), tall = r(8, 20) * S * (0.35 + d);
        const hx = bx + r(-3, 3) * S, hy = by - tall, size = r(3, 5) * S * (0.4 + d), P = rand() < 0.28 ? alt : pal;
        g.strokeStyle = LEAVES[0]; g.lineWidth = 0.9 * S * (0.5 + d);
        g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx, (by + hy) / 2, hx, hy); g.stroke();
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2 + r(-0.2, 0.2);
          g.fillStyle = P[p % 2];
          g.beginPath(); g.ellipse(hx + Math.cos(a) * size * 0.9, hy + Math.sin(a) * size * 0.6, size * 0.85, size * 0.5, a, 0, Math.PI * 2); g.fill();
        }
        g.fillStyle = P[2]; g.beginPath(); g.arc(hx, hy, size * 0.38, 0, Math.PI * 2); g.fill();
      }
    });
  }

  // moonlight: the land cooled and dimmed in one pass (like the hero's night filter), then fireflies
  function moonlit() {
    g.save();
    for (let i = 0; i < (narrow ? 7 : 14); i++) {
      const x = r(0.04, 0.96) * W, y = r(H * 0.7, H * 0.95), R = r(10, 18) * S;
      const gl = g.createRadialGradient(x, y, 0, x, y, R);
      gl.addColorStop(0, "rgba(240, 255, 170, 0.9)"); gl.addColorStop(0.25, "rgba(220, 250, 130, 0.45)"); gl.addColorStop(1, "rgba(200, 245, 100, 0)");
      g.fillStyle = gl; g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#f3ffb8"; g.beginPath(); g.arc(x, y, 1.4 * S, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }

  let maskCopy = null;
  const landMask = () => maskCopy;
  let painted = "", near_ = false;
  function paint() {
    const night = document.documentElement.dataset.theme === "night";
    const w = foot.clientWidth, h = foot.clientHeight;
    const key = `${w}x${h}:${night}`;
    if (!w || !h || key === painted) return;
    painted = key;
    W = w; H = h; narrow = W < 640; lift = narrow ? 0.09 : 0; S = clamp(W / 1440, 0.62, 1.15);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed = 4242;
    sky(night ? NIGHT_SKY : DAY_SKY);
    seed = 77;
    if (night) stars();
    seed = 91;
    clouds(night ? NIGHT_CLOUD : DAY_CLOUD);
    // at night the land is painted on its own layer and cooled in one pass, so the tint touches only the
    // land (tree crown included) and never the sky
    let layer = null;
    if (night) {
      layer = document.createElement("canvas");
      layer.width = cv.width; layer.height = cv.height;
      g = layer.getContext("2d");
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    seed = 13;
    hills(night);
    meadow();
    const tx = (narrow ? 0.8 : 0.47) * W;
    tree = { x: tx, y: near(tx) + 6 * S, h: (narrow ? 0.17 : 0.34) * H };
    seed = 5;
    path();
    seed = 8;
    flowers();
    seed = 21;
    drawTree();
    if (night) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      maskCopy = document.createElement("canvas"); maskCopy.width = layer.width; maskCopy.height = layer.height;
      maskCopy.getContext("2d").drawImage(layer, 0, 0);
      g.globalCompositeOperation = "multiply";
      g.fillStyle = "#4a5f96"; g.fillRect(0, 0, layer.width, layer.height);
      g.globalCompositeOperation = "destination-in";   // keep the land's own shape after multiplying
      g.drawImage(landMask(layer), 0, 0);
      g.globalCompositeOperation = "source-over";
      g = main;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(layer, 0, 0);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      maskCopy = null; // freed: both scratch canvases go once the night is painted
      seed = 3; moonlit();
    }
  }

  const later = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 400 }) : setTimeout(fn, 60));
  new IntersectionObserver(([e]) => { near_ = e.isIntersecting; if (near_) later(paint); }, { rootMargin: "900px 0px" }).observe(foot);
  let rt = 0;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (near_) paint(); else painted = ""; }, 200); });
  // the theme switch repaints it (the footer is off screen while the switch is pressed at the top)
  new MutationObserver(() => { if (near_) later(paint); else painted = ""; }).observe(document.documentElement, { attributeFilter: ["data-theme"] });
})();
