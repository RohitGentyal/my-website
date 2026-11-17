// The poems page's hero, painted in code like the hill on the home page (nothing traced, no photos):
// a sunlit classical gate. Two great Doric columns frame the edges, two more stand on a stone platform
// with steps; between them a blue sky with soft cumulus, snow-capped mountains and a green valley. White
// blossoms spill over one capital, ivy trails from the right, a dove flies and another perches, and out of
// focus in front, white flowers. Each depth is its own canvas so poems.js can move them in parallax.
// Painted once (and again on resize), seeded so it is the same scene on every visit.
const GATE = (() => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const rr = (a, b) => a + rnd() * (b - a);
  const lerp = (a, b, t) => a + (b - a) * t;

  // a smooth 1D noise from a few sines with seeded phases
  const noiser = () => {
    const w = Array.from({ length: 6 }, (_, i) => [rr(0, 6.28), 1 + i * 1.7 + rr(0, 0.6), 1 / (1 + i * 1.3)]);
    return (x) => w.reduce((s, [p, fq, a]) => s + Math.sin(x * fq + p) * a, 0) / 2.2;
  };

  function canvas(host, cls, w, h, dpr, top = 0) {
    let c = host.querySelector("canvas." + cls);
    if (!c) { c = document.createElement("canvas"); c.className = "gl " + cls; host.appendChild(c); }
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    c.style.width = w + "px"; c.style.height = h + "px"; c.style.top = top + "px";
    const g = c.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return g;
  }

  // ---- sky and clouds
  function sky(g, W, H, top) {
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, "#3f78c6");
    gr.addColorStop(0.35, "#7aa9de");
    gr.addColorStop(0.62, "#b9d3ee");
    gr.addColorStop(0.8, "#e3edf6");
    gr.addColorStop(1, "#f1f4f4");
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    // a warm sun glow, high on the left
    const sun = g.createRadialGradient(W * 0.3, top + H * 0.02, 0, W * 0.3, top + H * 0.02, W * 0.5);
    sun.addColorStop(0, "rgba(255, 246, 222, .55)");
    sun.addColorStop(1, "rgba(255, 246, 222, 0)");
    g.fillStyle = sun;
    g.fillRect(0, 0, W, H);
  }
  function cloud(g, x, y, w, h) {
    // shaded underside first, then the lit tops, then a few bright crowns
    const puffs = [];
    const n = Math.round(w / 9);
    for (let i = 0; i < n; i++) {
      const t = rnd();
      const px = x + (t - 0.5) * w;
      const dome = Math.sin(t * Math.PI);
      const py = y - dome * h * rr(0.35, 1) + rr(-h * 0.08, h * 0.12);
      puffs.push([px, py, rr(0.18, 0.34) * h * (0.6 + dome)]);
    }
    for (const [px, py, r] of puffs) {
      const s = g.createRadialGradient(px, py + r * 0.35, 0, px, py + r * 0.35, r * 1.1);
      s.addColorStop(0, "rgba(176, 190, 212, .55)");
      s.addColorStop(1, "rgba(176, 190, 212, 0)");
      g.fillStyle = s;
      g.beginPath(); g.arc(px, py + r * 0.35, r * 1.1, 0, 7); g.fill();
    }
    for (const [px, py, r] of puffs) {
      const s = g.createRadialGradient(px - r * 0.2, py - r * 0.3, 0, px, py, r);
      s.addColorStop(0, "rgba(255, 255, 255, .96)");
      s.addColorStop(0.65, "rgba(246, 249, 253, .85)");
      s.addColorStop(1, "rgba(236, 242, 250, 0)");
      g.fillStyle = s;
      g.beginPath(); g.arc(px, py, r, 0, 7); g.fill();
    }
    // a flat, soft base
    const b = g.createLinearGradient(0, y - h * 0.1, 0, y + h * 0.25);
    b.addColorStop(0, "rgba(214, 224, 238, 0)");
    b.addColorStop(1, "rgba(214, 224, 238, .0)");
  }

  // ---- mountains and the valley
  function range(g, W, base, peak, color, snow, rock, nz, sharp) {
    const pts = [];
    for (let x = -10; x <= W + 10; x += 4) {
      const u = x / W;
      // a central massif, lower toward the sides, with ragged ridges
      const mass = Math.exp(-Math.pow((u - 0.52) / 0.32, 2)) * 0.85 + 0.25;
      const n = nz(u * 9) * 0.35 + nz(u * 31 + 5) * 0.12 * sharp;
      pts.push([x, base - (base - peak) * Math.max(0.05, mass + n)]);
    }
    const path = () => { g.beginPath(); g.moveTo(-10, base + 400); pts.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(W + 10, base + 400); g.closePath(); };
    const top = Math.min(...pts.map((p) => p[1]));
    path();
    const gr = g.createLinearGradient(0, top, 0, base);
    gr.addColorStop(0, snow);
    gr.addColorStop(0.32, snow);
    gr.addColorStop(0.5, color);
    gr.addColorStop(1, color);
    g.fillStyle = gr;
    g.fill();
    g.save();
    path();
    g.clip();
    // rock ribs running down the slopes, darker on the shaded side of each ridge
    g.lineCap = "round";
    for (let i = 0; i < pts.length - 1; i += 2) {
      const [x, y] = pts[i];
      const [x2, y2] = pts[Math.min(pts.length - 1, i + 3)];
      const slope = (y2 - y) / (x2 - x);
      const len = rr(18, 80) * ((base - y) / (base - peak + 1));
      g.strokeStyle = slope > 0 ? rock : "rgba(255, 255, 255, .35)";
      g.globalAlpha = rr(0.15, 0.45);
      g.lineWidth = rr(0.8, 2.2);
      g.beginPath();
      g.moveTo(x + rr(-2, 2), y + rr(2, 10));
      g.quadraticCurveTo(x + slope * 6 + rr(-6, 6), y + len * 0.5, x + slope * 10 + rr(-10, 10), y + len);
      g.stroke();
    }
    g.globalAlpha = 1;
    // haze at its foot
    const hz = g.createLinearGradient(0, base - (base - top) * 0.35, 0, base);
    hz.addColorStop(0, "rgba(220, 232, 242, 0)");
    hz.addColorStop(1, "rgba(220, 232, 242, .55)");
    g.fillStyle = hz;
    g.fillRect(0, top, W, base - top + 400);
    g.restore();
  }
  function valley(g, W, y0, H) {
    const nz = noiser();
    const layers = [
      [y0, "#7d9e86", "#6a8f6f", 0.012],
      [y0 + H * 0.05, "#5f8a5e", "#4d7a4c", 0.02],
      [y0 + H * 0.11, "#6e9a55", "#5c8746", 0.016],
    ];
    layers.forEach(([y, c1, c2, f], k) => {
      g.beginPath();
      g.moveTo(-10, H * 2);
      for (let x = -10; x <= W + 10; x += 6) g.lineTo(x, y + nz(x * f + k * 3) * H * 0.03 + Math.abs(x / W - 0.5) * -H * 0.06 * (k === 0 ? 1 : 0.4));
      g.lineTo(W + 10, H * 2);
      g.closePath();
      const gr = g.createLinearGradient(0, y - H * 0.03, 0, y + H * 0.2);
      gr.addColorStop(0, c1);
      gr.addColorStop(1, c2);
      g.fillStyle = gr;
      g.fill();
      // forest: clusters of dark firs along each band
      for (let i = 0; i < W / (k === 0 ? 3 : 2.2); i++) {
        const x = rr(0, W), yy = y + rr(H * 0.006, H * 0.07) + nz(x * f + k * 3) * H * 0.03;
        if (nz(x * 0.004 + k) < -0.1) continue;
        const h = rr(4, 9) * (1 + k * 0.5);
        g.fillStyle = k === 0 ? "rgba(52, 82, 64, .55)" : "rgba(34, 66, 40, .7)";
        g.beginPath(); g.moveTo(x, yy - h); g.lineTo(x + h * 0.28, yy); g.lineTo(x - h * 0.28, yy); g.fill();
      }
    });
  }

  // ---- marble columns
  function column(g, cx, top, bot, w, light = 1) {
    const tw = w * 0.86; // the shaft narrows as it rises
    const capH = w * 0.32, baseH = w * 0.12;
    const st = top + capH, sb = bot - baseH;
    const shaft = () => {
      g.beginPath();
      g.moveTo(cx - w / 2, sb); g.lineTo(cx - tw / 2, st); g.lineTo(cx + tw / 2, st); g.lineTo(cx + w / 2, sb); g.closePath();
    };
    // a cylinder lit from the left
    const cyl = (x0, x1) => {
      const gr = g.createLinearGradient(x0, 0, x1, 0);
      gr.addColorStop(0, `rgb(${150 * light | 0}, ${145 * light | 0}, ${136 * light | 0})`);
      gr.addColorStop(0.28, "#ebe6dc");
      gr.addColorStop(0.45, "#e2ddd2");
      gr.addColorStop(0.78, "#b8b1a4");
      gr.addColorStop(1, "#8e887d");
      return gr;
    };
    shaft();
    g.fillStyle = cyl(cx - w / 2, cx + w / 2);
    g.fill();
    g.save();
    shaft();
    g.clip();
    // flutes: a shadowed line and a lit line beside it, bunching toward the edges like a real cylinder
    const N = 14;
    for (let i = 1; i < N; i++) {
      const a = (i / N) * Math.PI;
      const u = (1 - Math.cos(a)) / 2;
      const xb = cx - w / 2 + w * u, xt = cx - tw / 2 + tw * u;
      g.strokeStyle = `rgba(92, 86, 76, ${0.22 + 0.25 * Math.abs(u - 0.3)})`;
      g.lineWidth = Math.max(0.6, w * 0.006);
      g.beginPath(); g.moveTo(xb, sb); g.lineTo(xt, st); g.stroke();
      g.strokeStyle = "rgba(255, 255, 255, .35)";
      g.beginPath(); g.moveTo(xb + w * 0.012, sb); g.lineTo(xt + w * 0.012, st); g.stroke();
    }
    // drum joints
    for (let k = 1; k < 5; k++) {
      const y = lerp(st, sb, k / 5 + rr(-0.02, 0.02));
      g.strokeStyle = "rgba(96, 90, 80, .28)";
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(cx - w, y); g.lineTo(cx + w, y + rr(-1, 1)); g.stroke();
    }
    // weathering: soft stains and a few cracks
    for (let k = 0; k < 7; k++) {
      const x = cx + rr(-w / 2, w / 2), y = rr(st, sb), r = rr(w * 0.08, w * 0.3);
      const s = g.createRadialGradient(x, y, 0, x, y, r);
      s.addColorStop(0, "rgba(120, 112, 98, .14)");
      s.addColorStop(1, "rgba(120, 112, 98, 0)");
      g.fillStyle = s;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.strokeStyle = "rgba(70, 64, 56, .38)";
    g.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      let x = cx + rr(-w * 0.35, w * 0.35), y = rr(st, sb);
      g.beginPath(); g.moveTo(x, y);
      for (let j = 0; j < 6; j++) { x += rr(-w * 0.05, w * 0.05); y += rr(w * 0.04, w * 0.12); g.lineTo(x, y); }
      g.stroke();
    }
    g.restore();
    // Doric capital: annulets, the echinus swelling out, the square abacus
    const ey = top + capH * 0.42;
    g.beginPath();
    g.moveTo(cx - tw / 2, st);
    g.quadraticCurveTo(cx - w * 0.62, ey + capH * 0.18, cx - w * 0.66, ey);
    g.lineTo(cx + w * 0.66, ey);
    g.quadraticCurveTo(cx + w * 0.62, ey + capH * 0.18, cx + tw / 2, st);
    g.closePath();
    g.fillStyle = cyl(cx - w * 0.66, cx + w * 0.66);
    g.fill();
    g.strokeStyle = "rgba(96, 90, 80, .35)";
    g.lineWidth = 1;
    for (let k = 1; k <= 3; k++) { g.beginPath(); g.moveTo(cx - tw / 2, st - k * 3); g.lineTo(cx + tw / 2, st - k * 3); g.stroke(); }
    const ab = g.createLinearGradient(0, top, 0, ey);
    ab.addColorStop(0, "#efeae0");
    ab.addColorStop(1, "#cfc8bb");
    g.fillStyle = ab;
    g.fillRect(cx - w * 0.7, top, w * 1.4, ey - top);
    g.fillStyle = "rgba(90, 84, 74, .3)";
    g.fillRect(cx - w * 0.7, ey - 2, w * 1.4, 2);
    // base slab
    g.fillStyle = cyl(cx - w * 0.66, cx + w * 0.66);
    g.fillRect(cx - w * 0.64, sb, w * 1.28, baseH);
    g.fillStyle = "rgba(90, 84, 74, .3)";
    g.fillRect(cx - w * 0.64, sb, w * 1.28, 2);
  }

  function platform(g, W, y, H) {
    // the stone platform and three broad steps down toward you
    const slab = (x0, x1, y0, h, k) => {
      const gr = g.createLinearGradient(0, y0, 0, y0 + h);
      gr.addColorStop(0, "#e6e0d4");
      gr.addColorStop(0.2, "#d4cdbf");
      gr.addColorStop(1, "#a59e90");
      g.fillStyle = gr;
      g.fillRect(x0, y0, x1 - x0, h);
      g.fillStyle = "rgba(255, 255, 255, .4)";
      g.fillRect(x0, y0, x1 - x0, 1.5);
      // joints and weathering
      g.strokeStyle = "rgba(90, 84, 74, .3)";
      g.lineWidth = 1;
      for (let x = x0 + rr(30, 90); x < x1; x += rr(70, 160)) { g.beginPath(); g.moveTo(x, y0 + 2); g.lineTo(x + rr(-3, 3), y0 + h); g.stroke(); }
      for (let i = 0; i < 18 + k * 6; i++) {
        const x = rr(x0, x1), yy = rr(y0, y0 + h), r = rr(6, 26);
        const s = g.createRadialGradient(x, yy, 0, x, yy, r);
        s.addColorStop(0, "rgba(110, 102, 88, .12)");
        s.addColorStop(1, "rgba(110, 102, 88, 0)");
        g.fillStyle = s;
        g.fillRect(x - r, yy - r, r * 2, r * 2);
      }
    };
    slab(-20, W + 20, y, H * 0.035, 0);
    slab(W * 0.12, W * 0.88, y + H * 0.035, H * 0.045, 1);
    slab(W * 0.06, W * 0.94, y + H * 0.08, H * 0.05, 2);
    slab(-20, W + 20, y + H * 0.13, H * 0.2, 3);
  }

  // ---- blossoms, ivy, wildflowers
  function blossom(g, x, y, r, tint) {
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2 + rr(-0.2, 0.2);
      const gr = g.createRadialGradient(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, 0, x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.65);
      gr.addColorStop(0, "#ffffff");
      gr.addColorStop(1, tint);
      g.fillStyle = gr;
      g.beginPath(); g.ellipse(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.58, r * 0.42, a, 0, 7); g.fill();
    }
    g.fillStyle = "#e7c45a";
    g.beginPath(); g.arc(x, y, r * 0.18, 0, 7); g.fill();
  }
  function leafy(g, x, y, len, a, color) {
    g.fillStyle = color;
    g.save(); g.translate(x, y); g.rotate(a);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.5, -len * 0.32, len, 0); g.quadraticCurveTo(len * 0.5, len * 0.32, 0, 0); g.fill();
    g.restore();
  }
  function blossomSpill(g, x, y, w) {
    // a mound of white blossom and leaves over a capital, trailing down one side
    for (let i = 0; i < 70; i++) leafy(g, x + rr(-w * 0.55, w * 0.55), y + rr(-w * 0.12, w * 0.12) + Math.max(0, rr(-1, 1)) * w * 0.2, rr(8, 16), rr(0, 6.28), rnd() < 0.5 ? "#4f7a3c" : "#6a9450");
    for (let i = 0; i < 26; i++) leafy(g, x - w * 0.55 + rr(-6, 10), y + rr(0, w * 0.9), rr(8, 14), rr(1, 2.2), "#55803f");
    for (let i = 0; i < 46; i++) {
      const px = x + rr(-w * 0.55, w * 0.55), py = y + rr(-w * 0.14, w * 0.1);
      blossom(g, px, py, rr(6, 10), rnd() < 0.4 ? "#f1d9de" : "#eae8e2");
    }
    for (let i = 0; i < 12; i++) blossom(g, x - w * 0.55 + rr(-4, 8), y + rr(w * 0.05, w * 0.8), rr(5, 8), "#ece7e2");
  }
  function ivy(g, x, y, len) {
    g.strokeStyle = "#5b4a32";
    g.lineWidth = 1.4;
    for (let s = 0; s < 4; s++) {
      let px = x + rr(-30, 10), py = y;
      g.beginPath(); g.moveTo(px, py);
      const L = len * rr(0.5, 1);
      for (let t = 0; t < L; t += 14) {
        px += rr(-10, 6); py += 14;
        g.lineTo(px, py);
        leafy(g, px, py, rr(10, 16), rr(-0.4, 3.6), rnd() < 0.5 ? "#557d3a" : "#6f9a48");
      }
      g.stroke();
    }
  }
  function wildflowers(g, x0, x1, y) {
    for (let i = 0; i < (x1 - x0) / 7; i++) {
      const x = rr(x0, x1), h = rr(8, 26);
      g.strokeStyle = "#4f7a3c"; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + rr(-4, 4), y - h * 0.6, x + rr(-3, 3), y - h); g.stroke();
      leafy(g, x, y - h * 0.3, rr(6, 10), rr(-2.6, -0.4), "#5d8a45");
      const c = ["#d9443a", "#5c79d6", "#f0d36a", "#ffffff", "#8a6bd1"][Math.floor(rr(0, 5))];
      g.fillStyle = c;
      g.beginPath(); g.arc(x + rr(-2, 2), y - h, rr(2, 3.6), 0, 7); g.fill();
    }
  }

  // ---- doves
  function dove(g, x, y, s, flying, face = 1) {
    g.save(); g.translate(x, y); g.scale(s * face, s);
    const body = g.createLinearGradient(0, -10, 0, 12);
    body.addColorStop(0, "#ffffff");
    body.addColorStop(1, "#c9ced6");
    g.fillStyle = body;
    if (flying) {
      // raised wings, feathers fanned
      for (const side of [-1, 1]) {
        g.save(); g.scale(1, 1);
        g.beginPath();
        g.moveTo(-4, -2);
        g.bezierCurveTo(-14, -30 * (side > 0 ? 1 : 0.8), 8, -46, 24 * (side > 0 ? 1 : 0.8), -40);
        g.bezierCurveTo(14, -26, 12, -10, 8, -2);
        g.closePath();
        g.fillStyle = side > 0 ? body : "#e1e5eb";
        g.fill();
        g.restore();
      }
      g.strokeStyle = "rgba(150, 158, 170, .6)"; g.lineWidth = 0.8;
      for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(6 + k * 2, -8 - k * 2); g.lineTo(12 + k * 3, -30 - k); g.stroke(); }
    }
    g.fillStyle = body;
    g.beginPath(); g.ellipse(0, 0, 18, 8, -0.12, 0, 7); g.fill();
    g.beginPath(); g.arc(16, -6, 6, 0, 7); g.fill();
    g.beginPath(); g.moveTo(-14, 0); g.lineTo(-30, -4); g.lineTo(-30, 6); g.closePath(); g.fill();
    g.fillStyle = "#e3a07a";
    g.beginPath(); g.moveTo(21, -6); g.lineTo(26, -5); g.lineTo(21, -4); g.fill();
    g.fillStyle = "#2a2a30";
    g.beginPath(); g.arc(17.5, -7, 1.1, 0, 7); g.fill();
    if (!flying) {
      g.fillStyle = "#e1e5eb";
      g.beginPath(); g.ellipse(-2, -2, 13, 6, -0.25, 0, 7); g.fill();
      g.strokeStyle = "#c98a6a"; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(2, 8); g.lineTo(2, 12); g.moveTo(6, 8); g.lineTo(6, 12); g.stroke();
    }
    g.restore();
  }

  // ---- out-of-focus white flowers in front
  function bokehFlowers(g, W, H, hTop) {
    const off = document.createElement("canvas");
    off.width = W; off.height = H - hTop;
    const o = off.getContext("2d");
    const big = (x, y, r) => {
      for (let p = 0; p < 7; p++) {
        const a = (p / 7) * Math.PI * 2 + rr(-0.15, 0.15);
        const px = x + Math.cos(a) * r * 0.55, py = y + Math.sin(a) * r * 0.55;
        const gr = o.createRadialGradient(px, py, 0, px, py, r * 0.62);
        gr.addColorStop(0, "rgba(255, 255, 255, 1)");
        gr.addColorStop(0.7, "rgba(244, 242, 236, .95)");
        gr.addColorStop(1, "rgba(220, 218, 210, .9)");
        o.fillStyle = gr;
        o.beginPath(); o.ellipse(px, py, r * 0.62, r * 0.4, a, 0, 7); o.fill();
      }
      o.fillStyle = "#e9cf74";
      o.beginPath(); o.arc(x, y, r * 0.16, 0, 7); o.fill();
    };
    const h = H - hTop;
    for (let i = 0; i < 14; i++) big(rr(-W * 0.05, W * 0.3), rr(h * 0.25, h * 1.1), rr(h * 0.1, h * 0.24));
    for (let i = 0; i < 14; i++) big(rr(W * 0.7, W * 1.05), rr(h * 0.25, h * 1.1), rr(h * 0.1, h * 0.24));
    for (let i = 0; i < 6; i++) big(rr(W * 0.25, W * 0.75), rr(h * 0.85, h * 1.2), rr(h * 0.08, h * 0.16));
    g.filter = `blur(${Math.max(3, W / 260)}px)`;
    g.drawImage(off, 0, hTop);
    g.filter = "none";
  }

  // ---- paint everything into the host
  function paint(host) {
    const W = host.clientWidth, H = host.clientHeight;
    const dpr = Math.min(1.5, devicePixelRatio || 1);
    const small = W < 760;
    seed = 7;
    // sky (taller than the hero so it can drift), with clouds
    const over = H * 0.3;
    let g = canvas(host, "g-sky", W, H + over, Math.min(dpr, 1.25), -over);
    sky(g, W, H + over, over);
    seed = 21;
    const cl = [[0.18, 0.2, 0.34], [0.52, 0.3, 0.26], [0.86, 0.17, 0.3], [0.36, 0.46, 0.3], [0.7, 0.44, 0.24], [0.08, 0.52, 0.2]];
    cl.forEach(([x, y, w]) => cloud(g, W * x, over + H * y, W * w, H * 0.09 + W * w * 0.12));
    // mountains and valley
    seed = 33;
    g = canvas(host, "g-hills", W, H * 1.15, dpr, 0);
    range(g, W, H * 0.64, H * 0.4, "#8ea4c0", "#eef3f8", "#5a6e88", noiser(), 1);
    range(g, W, H * 0.68, H * 0.5, "#7b93ae", "#e4ebf3", "#4b5f78", noiser(), 1.4);
    valley(g, W, H * 0.66, H);
    // the middle columns on their platform, with blossom and a perched dove
    seed = 47;
    g = canvas(host, "g-mid", W, H * 1.1, dpr, 0);
    const py = H * 0.82;
    platform(g, W, py, H);
    wildflowers(g, W * 0.12, W * 0.88, py + 2);
    const mw = small ? W * 0.16 : W * 0.1;
    column(g, W * 0.24, H * 0.2, py, mw, 0.95);
    column(g, W * 0.76, H * 0.2, py, mw, 0.95);
    blossomSpill(g, W * 0.24, H * 0.2, mw * 1.05);
    dove(g, W * 0.76 + mw * 0.1, H * 0.2 - mw * 0.05, Math.max(0.6, mw / 120), false, -1);
    // the great columns at the edges, with ivy
    seed = 59;
    g = canvas(host, "g-front", W, H * 1.05, dpr, 0);
    const ew = small ? W * 0.26 : W * 0.17;
    column(g, ew * 0.18, -H * 0.06, H * 0.97, ew, 0.85);
    column(g, W - ew * 0.18, -H * 0.06, H * 0.97, ew, 0.85);
    ivy(g, W - ew * 0.55, 0, H * 0.22);
    // the flying dove gets its own small canvas so it can glide
    seed = 71;
    g = canvas(host, "g-dove", 140, 110, dpr, 0);
    dove(g, 70, 70, 1.3, true, 1);
    // white flowers out of focus at your feet
    seed = 83;
    const ft = H * 0.62;
    g = canvas(host, "g-near", W, H * 1.12, Math.min(dpr, 1), 0);
    bokehFlowers(g, W, H * 1.12, ft);
  }

  return { paint };
})();
