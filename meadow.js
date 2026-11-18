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
  const skyCv = document.getElementById("meadowSky"), skyG = skyCv.getContext("2d");
  const cloudBox = document.getElementById("meadowClouds");
  let drift = []; // { el, x, w } for each cloud
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

  // one cloud on its own little canvas, cropped to it, so it can drift by transform alone
  function cloudOn(cx, base, u, pal) {
    const x0 = cx - 0.62 * u, y0 = base - 0.62 * u - 8 * S, w = 1.24 * u, h = 0.62 * u + 12 * S;
    const el = document.createElement("canvas");
    el.width = Math.ceil(w * dpr); el.height = Math.ceil(h * dpr);
    el.style.width = w + "px"; el.style.height = h + "px";
    const keep = g;
    g = el.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, -x0 * dpr, -y0 * dpr);
    puff(cx, base, u, pal);
    g = keep;
    el.style.transform = `translate(${x0.toFixed(1)}px, ${y0.toFixed(1)}px)`;
    cloudBox.appendChild(el);
    drift.push({ el, x: x0, y: y0, w });
  }

  function clouds(pal) {
    // a bank resting on the far hills (their bases hide behind them), smaller ones further off, and one
    // drifting high on the right; sized so they stay under the footer's words
    const max = narrow ? 150 : 230;
    // a gap is left under the link columns on the right, so that sky stays open
    const xs = narrow ? [0.12, 0.5, 0.86] : [0.02, 0.17, 0.32, 0.5, 0.93];
    // the words above must stay on clear sky: each cloud is capped so its top stays under them
    const top = foot.querySelector(".foot-top"), fr = foot.getBoundingClientRect();
    const clear = top ? top.getBoundingClientRect().bottom - fr.top + 18 : 0;
    xs.forEach((u, i) => {
      const x = u * W + r(-30, 30) * S, base = far(u * W) + 14 * S;
      const size = Math.min(r(0.62, 1) * max * S * (i % 2 ? 0.8 : 1), (base - clear) / 0.58);
      if (size > 40 * S) cloudOn(x, base, size, pal);
    });
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
    // soft shade where the far slope folds down behind the meadow
    const fold = g.createLinearGradient(0, H * (0.63 + lift), 0, H * (0.72 + lift));
    fold.addColorStop(0, "rgba(90, 140, 85, 0)"); fold.addColorStop(1, "rgba(90, 140, 85, 0.35)");
    g.fillStyle = fold; g.fillRect(0, H * (0.6 + lift), W, H * 0.14);
    // distant grass: thousands of short upright strokes, shorter and paler the further up the slope
    g.lineCap = "round";
    const FAR = ["#9cc898", "#a9d0a4", "#8fbe8c", "#b3d6ab", "#86b583", "#97c493"];
    const n = Math.round(W * H * 0.11 / 5);
    for (let i = 0; i < n; i++) {
      const x = r(0, W), top = far(x), y = r(top + 1, top + H * 0.12);
      const t = clamp((y - top) / (H * 0.1), 0, 1);
      g.strokeStyle = pick(FAR); g.globalAlpha = 0.5 + 0.4 * t; g.lineWidth = (0.6 + 0.7 * t) * S;
      const len = (1.5 + 4 * t) * S, a = -Math.PI / 2 + r(-0.35, 0.35);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
    }
    g.globalAlpha = 1;
    // a lighter crest catching the sun
    for (let x = 0; x < W; x += r(1.5, 3)) {
      g.strokeStyle = rand() < 0.6 ? "#b8dab0" : "#a7cfa3"; g.lineWidth = 0.9 * S;
      const y = far(x) + 1;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + r(-0.8, 0.8) * S, y - r(1.5, 3.5) * S); g.stroke();
    }
    // a row of far trees along the crest, little rounded dabs
    for (let x = r(0, 30); x < W; x += r(14, 60) * S) {
      const y = far(x) + 2, s = r(4, 9) * S;
      g.fillStyle = pick(["#6fa070", "#7aac78", "#64946a"]);
      for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + r(-0.5, 0.5) * s, y - s * r(0.4, 0.9), s * r(0.45, 0.7), s * r(0.4, 0.6), 0, 0, Math.PI * 2); g.fill(); }
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
      const len = r(3, 9) * S * (0.9 + d) * 2.2, ang = -Math.PI / 2 + r(-0.6, 0.35), w = r(0.7, 1.5) * S * (0.8 + d * 0.8), c = pick(set);
      if (useGL) blades.push({ x, y, len, ang, w, c, j: r(-1, 1) });
      else blade(x, y, len, ang, w, c);
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
    pathShape = shape;
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
      clumps.push({ x: cx, y: cy, R });
      const pal = pick(BLOOMS), alt = pick(BLOOMS);
      for (let k = 0; k < 50; k++) {
        fl.leaves.push({ x: cx + r(-R, R), y: cy + r(-R * 0.3, R * 0.3), rx: r(3, 6) * S * (0.4 + d), ry: r(1.2, 2.6) * S * (0.4 + d), a: r(-0.9, 0.9), c: pick(LEAVES) });
      }
      const n = 26 + Math.floor(rand() * 12);
      for (let k = 0; k < n; k++) {
        const bx = cx + r(-R, R) * 0.9, by = cy + r(-R * 0.25, R * 0.3), tall = r(8, 20) * S * (0.35 + d);
        const hx = bx + r(-3, 3) * S, hy = by - tall, size = r(3, 5) * S * (0.4 + d), P = rand() < 0.28 ? alt : pal;
        const dabs = [];
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2 + r(-0.2, 0.2);
          dabs.push({ dx: Math.cos(a) * size * 0.9, dy: Math.sin(a) * size * 0.6, rx: size * 0.85, ry: size * 0.5, a, c: P[p % 2] });
        }
        fl.stems.push({ x: bx, y: by, hx, hy, w: 0.9 * S * (0.5 + d), dabs, heart: P[2], hs: size * 0.38, b: 0, v: 0 });
      }
    });
  }

  let fl = { leaves: [], stems: [] };
  const touchCv = document.getElementById("meadowTouch"), tg = touchCv.getContext("2d");
  const hex = (c) => "#" + c.map((v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, "0")).join("");
  const moonOf = (c) => { const [a, b, d] = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255); return hex([a * MOON[0], b * MOON[1], d * MOON[2]]); };
  function tintFlowers() {
    fl.leaves.forEach((l) => (l.c = moonOf(l.c)));
    fl.stems.forEach((s) => { s.heart = moonOf(s.heart); s.dabs.forEach((p) => (p.c = moonOf(p.c))); });
    fl.stemC = moonOf(LEAVES[0]);
  }
  function drawFlowers() {
    tg.setTransform(1, 0, 0, 1, 0, 0);
    tg.clearRect(0, 0, touchCv.width, touchCv.height);
    tg.setTransform(dpr, 0, 0, dpr, 0, 0);
    fl.leaves.forEach((l) => { tg.fillStyle = l.c; tg.beginPath(); tg.ellipse(l.x, l.y, l.rx, l.ry, l.a, 0, Math.PI * 2); tg.fill(); });
    tg.lineCap = "round";
    fl.stems.forEach((s) => {
      const dx = s.hx - s.x, dy = s.hy - s.y, c = Math.cos(s.b), sn = Math.sin(s.b);
      const ox = s.x + dx * c - dy * sn - s.hx, oy = s.y + dx * sn + dy * c - s.hy;
      tg.strokeStyle = fl.stemC || LEAVES[0]; tg.lineWidth = s.w;
      tg.beginPath(); tg.moveTo(s.x, s.y); tg.quadraticCurveTo(s.x + ox * 0.3, (s.y + s.hy) / 2, s.hx + ox, s.hy + oy); tg.stroke();
      s.dabs.forEach((p) => { tg.fillStyle = p.c; tg.beginPath(); tg.ellipse(s.hx + ox + p.dx, s.hy + oy + p.dy, p.rx, p.ry, p.a, 0, Math.PI * 2); tg.fill(); });
      tg.fillStyle = s.heart; tg.beginPath(); tg.arc(s.hx + ox, s.hy + oy, s.hs, 0, Math.PI * 2); tg.fill();
    });
  }

  // ---------------------------------------------------------------- falling leaves
  // Now and then a leaf lets go of the tree and drifts down, slow and calm: it sways side to side,
  // turns over as it falls (it narrows as it shows its edge), drifts a little with the breeze, settles
  // in the grass, rests a moment and fades. Never more than five at once. Only on its own small canvas
  // round the tree, so each frame costs next to nothing.
  const leafCv = document.createElement("canvas");
  leafCv.setAttribute("aria-hidden", "true");
  leafCv.className = "meadow-leaves";
  const lg = leafCv.getContext("2d");
  let fallen = [], nextLeaf = 0, box = null, leafNight = false;
  const LEAF_DAY = ["#b4d75a", "#c9cf5a", "#d8c05a", "#e0a94a", "#d98f3e", "#a9c24c"];
  function setLeaves(night) {
    const { x, y, h } = tree;
    box = { x: x - h * 0.95, y: y - h * 1.15, w: h * 1.9, h: h * 1.15 + 34 * S };
    leafCv.width = Math.round(box.w * dpr); leafCv.height = Math.round(box.h * dpr);
    leafCv.style.cssText = `position:absolute;left:${box.x.toFixed(1)}px;top:${box.y.toFixed(1)}px;width:${box.w.toFixed(1)}px;height:${box.h.toFixed(1)}px;pointer-events:none`;
    if (!leafCv.parentNode) touchCv.after(leafCv);
    fallen = []; nextLeaf = 1.2; leafNight = night;
  }
  function fall(dt) {
    if (!box) return;
    const { x, y, h } = tree, R = h * 0.4, cx = x + h * 0.02, cy = y - h * 0.66;
    nextLeaf -= dt;
    if (nextLeaf <= 0 && fallen.length < 5) {
      nextLeaf = r(2.2, 4.5);
      const c = pick(LEAF_DAY);
      fallen.push({
        x0: cx + r(-0.85, 0.85) * R, y: cy + r(0, 0.45) * R, t: 0, ph: r(0, 6.28), w: r(0.7, 1.15),
        amp: r(10, 22) * S, wind: r(-9, -2) * S, vy: r(10, 16) * S, size: r(4.6, 6.4) * S,
        ground: y + r(-4, 26) * S, rest: -1, c: leafNight ? moonOf(c) : c,
      });
    }
    lg.setTransform(1, 0, 0, 1, 0, 0);
    lg.clearRect(0, 0, leafCv.width, leafCv.height);
    lg.setTransform(dpr, 0, 0, dpr, -box.x * dpr, -box.y * dpr);
    fallen = fallen.filter((l) => {
      l.t += dt;
      let a = 1, flip, tilt;
      if (l.rest < 0) {
        l.y += l.vy * dt;
        l.x = l.x0 + l.wind * l.t + l.amp * Math.sin(l.w * l.t + l.ph);
        flip = Math.cos(l.t * l.w * 1.6 + l.ph);
        tilt = 0.7 * Math.sin(l.w * l.t + l.ph + 1.2);
        if (l.y >= l.ground) { l.rest = 0; l.flip = flip; l.tilt = tilt; }
      } else {
        l.rest += dt; flip = l.flip; tilt = l.tilt;
        a = l.rest < 2.5 ? 1 : 1 - (l.rest - 2.5) / 2;
        if (a <= 0) return false;
      }
      lg.save();
      lg.globalAlpha = a;
      lg.translate(l.x, l.y); lg.rotate(tilt);
      lg.fillStyle = l.c;
      // a leaf: a pointed oval that narrows as it turns edge-on, with a faint midrib
      const ry = l.size * 0.48 * (0.25 + 0.75 * Math.abs(flip));
      lg.beginPath();
      lg.moveTo(-l.size, 0);
      lg.quadraticCurveTo(0, -ry * 2, l.size, 0);
      lg.quadraticCurveTo(0, ry * 2, -l.size, 0);
      lg.fill();
      lg.strokeStyle = "rgba(60, 90, 30, 0.35)"; lg.lineWidth = 0.5 * S;
      lg.beginPath(); lg.moveTo(-l.size * 0.9, 0); lg.lineTo(l.size * 1.25, 0); lg.stroke();
      lg.restore();
      return true;
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

  // ---------------------------------------------------------------- swaying grass
  // The meadow's blades on the graphics card with the hero's own sway (scene.js, SWAY_VS): a swell rolling
  // right to left over a longer, slower one, the field leaning and rocking, a flutter per blade, crests a
  // touch lighter. The cursor parts them with the hero's per-blade springs. Only while the footer is on
  // screen, never with reduced motion. Without WebGL2 the blades stay painted, still, on the canvas.
  const swayCv = document.getElementById("meadowSway");
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  let useGL = false, blades = [], clumps = [], pathShape = null;
  let gl = null, prog, vao, inst, bendBuf, U, count = 0, bends = new Float32Array(0), dirty = false;
  const VS = `#version 300 es
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec4 aBlade;
layout(location = 2) in vec3 aShape;
layout(location = 3) in vec3 aColor;
layout(location = 4) in float aBend;
uniform vec2 uSize;
uniform float uTime, uS, uPx;
out vec3 vColor;
out float vEdge, vHalf;
void main() {
  vec2 root = aBlade.xy;
  float len = aBlade.z, ang = aBlade.w, w = aShape.x, j = aShape.y, ph = aShape.z;
  float swell = 0.5 + 0.5 * sin(6.2832 * (root.x / (520.0 * uS) + uTime / 6.0) + root.y * 0.012);
  float roll = 0.5 + 0.5 * sin(6.2832 * (root.x / (1400.0 * uS) + uTime / 14.0));
  float bend = -(0.09 + 0.52 * swell * (0.4 + 0.6 * roll)) + 0.07 * sin(uTime * 1.5 + ph * 6.2832) + aBend;
  float t = aCorner.x;
  vec2 p1 = root + vec2(cos(ang + bend * 0.4), sin(ang + bend * 0.4)) * len * 0.5 + vec2(j, 0.0);
  vec2 p2 = root + vec2(cos(ang + bend), sin(ang + bend)) * len;
  vec2 pos = mix(mix(root, p1, t), mix(p1, p2, t), t);
  vec2 tg = mix(p1 - root, p2 - p1, t);
  tg = length(tg) > 1e-4 ? normalize(tg) : vec2(0.0, -1.0);
  float hw = w * 0.5;
  pos += vec2(-tg.y, tg.x) * aCorner.y * (hw + uPx) + tg * (t > 0.99 ? hw : 0.0);
  vEdge = aCorner.y * (hw + uPx);
  vHalf = hw;
  vColor = aColor * (1.0 + 0.09 * swell * roll);
  gl_Position = vec4(pos.x / uSize.x * 2.0 - 1.0, 1.0 - pos.y / uSize.y * 2.0, 0.0, 1.0);
}`;
  const FS = `#version 300 es
precision highp float;
in vec3 vColor;
in float vEdge, vHalf;
uniform float uPx;
out vec4 o;
void main() {
  float a = clamp((vHalf - abs(vEdge)) / uPx + 0.5, 0.0, 1.0);
  o = vec4(vColor * a, a);
}`;
  function initGL() {
    if (gl !== null) return !!gl;
    gl = false;
    const c = swayCv && swayCv.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
    if (!c) return false;
    const sh = (type, src) => { const s = c.createShader(type); c.shaderSource(s, src); c.compileShader(s); return c.getShaderParameter(s, c.COMPILE_STATUS) ? s : null; };
    const vs = sh(c.VERTEX_SHADER, VS), fs = sh(c.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return false;
    prog = c.createProgram(); c.attachShader(prog, vs); c.attachShader(prog, fs); c.linkProgram(prog);
    if (!c.getProgramParameter(prog, c.LINK_STATUS)) return false;
    vao = c.createVertexArray(); c.bindVertexArray(vao);
    c.bindBuffer(c.ARRAY_BUFFER, c.createBuffer());
    c.bufferData(c.ARRAY_BUFFER, new Float32Array([0, -1, 0, 1, 1 / 3, -1, 1 / 3, 1, 2 / 3, -1, 2 / 3, 1, 1, -1, 1, 1]), c.STATIC_DRAW);
    c.enableVertexAttribArray(0); c.vertexAttribPointer(0, 2, c.FLOAT, false, 0, 0);
    inst = c.createBuffer(); c.bindBuffer(c.ARRAY_BUFFER, inst);
    [[1, 4, 0], [2, 3, 16], [3, 3, 28]].forEach(([loc, n, off]) => { c.enableVertexAttribArray(loc); c.vertexAttribPointer(loc, n, c.FLOAT, false, 40, off); c.vertexAttribDivisor(loc, 1); });
    bendBuf = c.createBuffer(); c.bindBuffer(c.ARRAY_BUFFER, bendBuf);
    c.enableVertexAttribArray(4); c.vertexAttribPointer(4, 1, c.FLOAT, false, 4, 0); c.vertexAttribDivisor(4, 1);
    c.enable(c.BLEND); c.blendFunc(c.ONE, c.ONE_MINUS_SRC_ALPHA);
    U = ["uSize", "uTime", "uS", "uPx"].reduce((u, n) => ((u[n] = c.getUniformLocation(prog, n)), u), {});
    // if the graphics card drops the context, repaint with the blades painted still
    swayCv.addEventListener("webglcontextlost", () => { gl = false; count = 0; swayCv.hidden = true; painted = ""; if (near_) paint(); });
    gl = c;
    return true;
  }
  const rgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  // the night's multiply, the same one the land layer gets, so the blades sit in the same moonlight
  const MOON = rgb("#4a5f96");

  // blades in a grid of cells, so the cursor only looks at its neighbours
  const CELL = 48;
  let grid = [], cols = 0, rows = 0, active = new Set(), springRaf = 0;
  function buildSway(night, dpr) {
    // keep off the path, the flower clumps and the foot of the tree, which are painted on top
    const kept = blades.filter((b) => {
      if (pathShape && g.isPointInPath(pathShape, b.x * dpr, b.y * dpr)) return false;
      if (Math.abs(b.x - tree.x) < tree.h * 0.07 && Math.abs(b.y - tree.y) < 10 * S) return false;
      return !clumps.some((c) => Math.abs(b.x - c.x) < c.R * 0.95 && b.y > c.y - c.R * 0.35 && b.y < c.y + c.R * 0.35);
    });
    const data = new Float32Array(kept.length * 10);
    cols = Math.ceil(W / CELL); rows = Math.ceil(H / CELL);
    grid = Array.from({ length: cols * rows }, () => []);
    kept.forEach((b, i) => {
      let [cr, cg, cb] = rgb(b.c);
      if (night) { cr *= MOON[0]; cg *= MOON[1]; cb *= MOON[2]; }
      data.set([b.x, b.y, b.len, b.ang, b.w, b.j, (b.x * 0.0137 + b.y * 0.031) % 1, cr, cg, cb], i * 10);
      b.i = i; b.b = 0; b.v = 0;
      const cx = clamp(Math.floor(b.x / CELL), 0, cols - 1), cy = clamp(Math.floor(b.y / CELL), 0, rows - 1);
      grid[cy * cols + cx].push(b);
    });
    swayCv.width = Math.round(W * dpr); swayCv.height = Math.round(H * dpr);
    gl.bindBuffer(gl.ARRAY_BUFFER, inst); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    bends = new Float32Array(kept.length);
    gl.bindBuffer(gl.ARRAY_BUFFER, bendBuf); gl.bufferData(gl.ARRAY_BUFFER, bends, gl.DYNAMIC_DRAW);
    active.clear();
    count = kept.length;
    gl.useProgram(prog);
    gl.uniform2f(U.uSize, W, H); gl.uniform1f(U.uS, S); gl.uniform1f(U.uPx, 1 / dpr);
    swayCv.hidden = false;
    blades = [];
    drawSway(performance.now());
    run();
  }
  function drawSway(now) {
    if (!gl || !count) return;
    if (dirty) { gl.bindBuffer(gl.ARRAY_BUFFER, bendBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, bends); dirty = false; }
    gl.viewport(0, 0, swayCv.width, swayCv.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog); gl.bindVertexArray(vao);
    gl.uniform1f(U.uTime, still.matches ? 0 : (now / 1000) % 3600);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 8, count);
  }
  // the loop runs only while the footer is on screen
  let loop = 0, onScreen = false;
  let lastT = 0;
  const frame = (now) => {
    loop = 0;
    const dt = lastT ? Math.min(100, now - lastT) / 1000 : 0;
    lastT = now;
    drawSway(now);
    fall(dt);
    const v = (narrow ? 7 : 11) * S;
    drift.forEach((c) => {
      c.x -= v * dt;
      if (c.x + c.w < 0) c.x += W + c.w;
      c.el.style.transform = `translate(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px)`;
    });
    if (onScreen && !still.matches) loop = requestAnimationFrame(frame); else lastT = 0;
  };
  function run() { if (!loop && onScreen && (count || drift.length) && !still.matches) { lastT = 0; loop = requestAnimationFrame(frame); } }
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; run(); }).observe(foot);

  // the hero's springs: a brushed blade is pushed away from the cursor and along its movement, then
  // wobbles back to rest
  let flowersMoved = false;
  function step() {
    springRaf = 0;
    active.forEach((b) => {
      b.v = (b.v - b.b * 0.08) * 0.84;
      b.b = clamp(b.b + b.v, -1.3, 1.3);
      if (Math.abs(b.b) < 0.002 && Math.abs(b.v) < 0.002) { b.b = b.v = 0; active.delete(b); }
      if (b.hx === undefined) { bends[b.i] = b.b; dirty = true; } else flowersMoved = true;
    });
    if (flowersMoved) { drawFlowers(); flowersMoved = false; }
    if (still.matches) drawSway(performance.now());
    if (active.size) springRaf = requestAnimationFrame(step);
  }
  function brush(x, y, dx) {
    const reach = 60 * S;
    fl.stems.forEach((s) => {
      const dist = Math.hypot(s.hx - x, s.hy - y);
      if (dist > reach) return;
      const f = 1 - dist / reach;
      s.v += (clamp(dx, -30, 30) * 0.015 + Math.sign(s.hx - x || 1) * 0.06) * f;
      active.add(s);
    });
    const x0 = clamp(Math.floor((x - reach) / CELL), 0, cols - 1), x1 = clamp(Math.floor((x + reach) / CELL), 0, cols - 1);
    const y0 = clamp(Math.floor((y - reach) / CELL), 0, rows - 1), y1 = clamp(Math.floor((y + reach) / CELL), 0, rows - 1);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) grid[cy * cols + cx].forEach((b) => {
      const mx = b.x + Math.cos(b.ang) * b.len * 0.6, my = b.y + Math.sin(b.ang) * b.len * 0.6;
      const dist = Math.hypot(mx - x, my - y);
      if (dist > reach) return;
      const f = 1 - dist / reach;
      b.v += (clamp(dx, -30, 30) * 0.02 + Math.sign(mx - x || 1) * 0.08) * f;
      active.add(b);
    });
    if (!springRaf && active.size) springRaf = requestAnimationFrame(step);
  }
  let lastX = null, scrolledAt = 0;
  addEventListener("scroll", () => { scrolledAt = performance.now(); }, { passive: true });
  foot.addEventListener("pointermove", (e) => {
    // Chrome reports the page sliding under a still cursor as moves; ignore those, like the hero
    if (e.pointerType !== "mouse" || !(count || fl.stems.length) || performance.now() - scrolledAt < 150) { lastX = null; return; }
    const r0 = foot.getBoundingClientRect(), x = e.clientX - r0.left, y = e.clientY - r0.top;
    if (lastX !== null) brush(x, y, x - lastX);
    lastX = x;
  }, { passive: true });
  foot.addEventListener("pointerleave", () => { lastX = null; });

  let maskCopy = null;
  const landMask = () => maskCopy;
  let painted = "", near_ = false, dpr = 1;
  function paint() {
    const night = document.documentElement.dataset.theme === "night";
    const w = foot.clientWidth, h = foot.clientHeight;
    const key = `${w}x${h}:${night}`;
    if (!w || !h || key === painted) return;
    painted = key;
    W = w; H = h; narrow = W < 640; lift = narrow ? 0.09 : 0.05; S = clamp(W / 1440, 0.62, 1.15);
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    skyCv.width = cv.width; skyCv.height = cv.height;
    touchCv.width = cv.width; touchCv.height = cv.height;
    fl = { leaves: [], stems: [] };
    cloudBox.replaceChildren(); drift = [];
    useGL = initGL(); blades = []; clumps = []; pathShape = null; count = 0;
    if (!useGL && swayCv) swayCv.hidden = true;
    seed = 4242;
    g = skyG; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    sky(night ? NIGHT_SKY : DAY_SKY);
    seed = 77;
    if (night) stars();
    g = main;
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
    if (useGL) buildSway(night, dpr);
    if (night) tintFlowers();
    drawFlowers();
    setLeaves(night);
    run();
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
