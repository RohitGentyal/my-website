// Small engraved ornaments for the poems' writings, in cobalt ink, drawn in code: a laurel sprig set
// between poems and in the footer. (The page's hero is painted by poems-hero.js.)
const ENGRAVE = (() => {
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const rr = (a, b) => a + rnd() * (b - a);
  const f = (n) => n.toFixed(1);
  const C = "var(--cobalt)";
  const PAPER = "var(--paper)";
  let out = [];
  let clipN = 0;
  const path = (d, { fill = "none", stroke = C, w = 1.6 } = {}) =>
    out.push(`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`);

  // ---- leaves and branches
  function leaf(x, y, a, len, wid, filled) {
    const c = Math.cos(a), s = Math.sin(a);
    const P = (u, v) => `${f(x + u * c - v * s)} ${f(y + u * s + v * c)}`;
    path(`M${P(0, 0)}Q${P(len * 0.45, -wid)} ${P(len, 0)}Q${P(len * 0.45, wid)} ${P(0, 0)}Z`, { fill: filled ? C : PAPER, w: 1.1 });
    if (!filled) path(`M${P(len * 0.12, 0)}L${P(len * 0.82, 0)}`, { w: 0.6 });
  }
  const qpt = (p0, p1, p2, t) => {
    const u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
  };
  function branch(p0, p1, p2, { step = 0.045, len = 26, wid = 7, berries = true } = {}) {
    path(`M${f(p0[0])} ${f(p0[1])}Q${f(p1[0])} ${f(p1[1])} ${f(p2[0])} ${f(p2[1])}`, { w: 1.4 });
    let i = 0;
    for (let t = step; t < 0.98; t += step) {
      const [x, y] = qpt(p0, p1, p2, t);
      const [x2, y2] = qpt(p0, p1, p2, Math.min(1, t + 0.01));
      const a = Math.atan2(y2 - y, x2 - x);
      const l = len * (0.7 + 0.45 * Math.sin(t * Math.PI)) * rr(0.85, 1.1);
      leaf(x, y, a - 0.78 + rr(-0.14, 0.14), l, wid, i++ % 3 === 0);
      leaf(x, y, a + 0.78 + rr(-0.14, 0.14), l * 0.95, wid, i++ % 3 === 1);
      if (berries && rnd() < 0.18) out.push(`<circle cx="${f(x + rr(-6, 6))}" cy="${f(y + rr(-6, 6))}" r="2.6" fill="${C}"/>`);
    }
    const [bx, by] = qpt(p0, p1, p2, 0.96);
    leaf(p2[0], p2[1], Math.atan2(p2[1] - by, p2[0] - bx), len * 0.8, wid * 0.9, false);
  }
  function wreath(cx, cy, r, len = 18, wid = 5) {
    branch([cx - 4, cy + r], [cx - r * 2, cy], [cx - 4, cy - r], { step: 0.07, len, wid, berries: false });
    branch([cx + 4, cy + r], [cx + r * 2, cy], [cx + 4, cy - r], { step: 0.07, len, wid, berries: false });
  }

  // a small laurel sprig for between poems
  function sprig() {
    out = [];
    clipN = 0;
    seed = 3;
    branch([60, 24], [36, 30], [8, 18], { step: 0.16, len: 11, wid: 3.2, berries: false });
    branch([60, 24], [84, 30], [112, 18], { step: 0.16, len: 11, wid: 3.2, berries: false });
    out.push(`<circle cx="60" cy="25" r="2.6" fill="${C}"/>`);
    return `<svg viewBox="0 0 120 40" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round">${out.join("")}</svg>`;
  }

  // the page's seal: an engraved laurel wreath round an italic R, ringed by a line of text set in a circle
  // (style.css turns the ring slowly). Drawn in currentColor so it can sit on the sky in white
  function seal(ring) {
    out = [];
    seed = 5;
    wreath(50, 50, 17, 8.5, 2.6);
    const id = "sealring" + Math.floor(rnd() * 1e6);
    return `<svg viewBox="0 0 100 100" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round">
      <defs><path id="${id}" d="M50 50m-38 0a38 38 0 1 1 76 0a38 38 0 1 1 -76 0"/></defs>
      <g class="ring"><text font-family="Inter, sans-serif" font-size="8.4" font-weight="500" letter-spacing="3.1" fill="currentColor"><textPath href="#${id}" textLength="236" lengthAdjust="spacing">${ring}</textPath></text></g>
      <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" stroke-width=".6" opacity=".7"/>
      <g class="wreath">${out.join("")}</g>
      <text x="50" y="58" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="25" font-style="italic" font-weight="500" fill="currentColor">R</text>
    </svg>`;
  }

  return { sprig, seal };
})();
