// The poems page's plate: one copperplate engraving in cobalt ink, drawn in code (nothing traced).
// You look out through a great Roman arch, its keystone a wreathed medallion, laurel garlands hanging
// inside it. Beyond: a sea running to the horizon with the sun setting into it, a cliff crowned with a
// small temple and cypresses on the left, a hill city on the right (temple, stairs, an obelisk, a quay of
// arches), a galley crossing under a striped sail, birds. The sea is the ink: its engraved lines crowd
// closer as they near you until they run solid, and that solid ink is the band the poems sit under.
// The middle of the sky stays clear for the title. Seeded, so it is the same plate on every visit.
const ENGRAVE = (() => {
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const rr = (a, b) => a + rnd() * (b - a);
  const f = (n) => n.toFixed(1);
  const C = "var(--cobalt)";
  const PAPER = "var(--paper)";
  let out = [];
  let clipN = 0;

  const path = (d, { fill = "none", stroke = C, w = 1.6, rule = "" } = {}) =>
    out.push(`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"${rule ? ` fill-rule="${rule}"` : ""}/>`);
  const clipped = (d, draw, rule = "") => {
    const id = "eg" + clipN++;
    out.push(`<clipPath id="${id}"><path d="${d}"${rule ? ` clip-rule="${rule}"` : ""}/></clipPath><g clip-path="url(#${id})">`);
    draw();
    out.push("</g>");
  };

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

  // ---- distant architecture (light lines: it sits far off across the water)
  function temple(x0, x1, base, colH, cols) {
    const w = 1;
    path(`M${x0 - 10} ${base}h${x1 - x0 + 20}v-5h${-(x1 - x0 + 20)}Z`, { fill: PAPER, w });
    path(`M${x0 - 6} ${base - 5}h${x1 - x0 + 12}v-4h${-(x1 - x0 + 12)}Z`, { fill: PAPER, w });
    const top = base - 9 - colH;
    let d = "";
    for (let xx = x0; xx < x1; xx += 1.8) d += `M${f(xx)} ${top + 4}V${base - 9}`;
    path(d, { w: 0.45 }); // the shade between the columns
    for (let k = 0; k < cols; k++) {
      const cx = x0 + ((x1 - x0) * k) / (cols - 1), cw = Math.max(4, (x1 - x0) / cols * 0.42);
      path(`M${f(cx - cw / 2)} ${base - 9}V${top}H${f(cx + cw / 2)}V${base - 9}Z`, { fill: PAPER, w: 0.9 });
      path(`M${f(cx + cw * 0.15)} ${base - 10}V${top + 2}`, { w: 0.4 });
      path(`M${f(cx - cw / 2 - 1.5)} ${top}h${f(cw + 3)}`, { w: 1 });
    }
    const eTop = top - 9;
    path(`M${x0 - 8} ${top}V${eTop}H${x1 + 8}V${top}Z`, { fill: PAPER, w });
    const mid = (x0 + x1) / 2, apex = eTop - (x1 - x0) * 0.17;
    path(`M${x0 - 12} ${eTop}L${mid} ${f(apex)}L${x1 + 12} ${eTop}Z`, { fill: PAPER, w: 1.1 });
    clipped(`M${x0 - 4} ${eTop - 2}L${mid} ${f(apex + 5)}L${x1 + 4} ${eTop - 2}Z`, () => {
      let h = "";
      for (let k = -120; k < 260; k += 3) h += `M${x0 + k} ${eTop}l60 -60`;
      path(h, { w: 0.4 });
    });
  }

  function cypress(x, base, h, w) {
    const d = `M${x} ${base - h}C${f(x + w * 0.55)} ${f(base - h * 0.75)} ${f(x + w * 0.62)} ${f(base - h * 0.22)} ${f(x + w * 0.14)} ${base}L${f(x - w * 0.14)} ${base}C${f(x - w * 0.62)} ${f(base - h * 0.22)} ${f(x - w * 0.55)} ${f(base - h * 0.75)} ${x} ${base - h}Z`;
    path(d, { fill: PAPER, w: 1 });
    clipped(d, () => {
      let s = "";
      for (let y = base - h + 4; y < base; y += 3.6) {
        for (let xx = x - w * 0.6; xx < x + w * 0.6; xx += rr(3, 5)) {
          if (xx < x - w * 0.05 && rnd() < 0.55) continue;
          s += `M${f(xx)} ${f(y)}q1.6 -3 3.2 -0.6`;
        }
      }
      path(s, { w: 0.5 });
    });
  }

  // a hatched hillside, its strata running along the slope
  function hill(d, step = 3.4, tilt = 0.18) {
    path(d, { fill: PAPER, w: 1.2 });
    clipped(d, () => {
      let s = "";
      for (let y = 380; y < 620; y += step) {
        let x = 100;
        while (x < 1500) {
          const len = rr(14, 46);
          s += `M${f(x)} ${f(y + rr(-1, 1))}l${f(len)} ${f(len * tilt * (rnd() < 0.5 ? 1 : -1))}`;
          x += len + rr(4, 16);
        }
      }
      path(s, { w: 0.5 });
    });
  }

  function galley(x, y, s) {
    // oars first, under the hull
    let o = "";
    for (let k = 0; k < 11; k++) o += `M${f(x - 62 * s + k * 12 * s)} ${f(y - 2 * s)}l${f(-9 * s)} ${f(22 * s)}`;
    path(o, { w: 0.9 });
    // hull with a curled stern and a beaked prow
    const hull = `M${f(x - 92 * s)} ${f(y - 30 * s)}q${f(-6 * s)} ${f(-14 * s)} ${f(8 * s)} ${f(-16 * s)}q${f(-12 * s)} ${f(8 * s)} ${f(-2 * s)} ${f(14 * s)}L${f(x - 74 * s)} ${f(y)}H${f(x + 70 * s)}L${f(x + 96 * s)} ${f(y - 8 * s)}L${f(x + 78 * s)} ${f(y - 12 * s)}L${f(x + 66 * s)} ${f(y - 16 * s)}H${f(x - 78 * s)}Z`;
    path(hull, { fill: PAPER, w: 1.3 });
    clipped(hull, () => {
      let h = "";
      for (let yy = y - 16 * s; yy < y; yy += 2.6) h += `M${f(x - 90 * s)} ${f(yy)}H${f(x + 96 * s)}`;
      path(h, { w: 0.5 });
    });
    path(`M${f(x - 70 * s)} ${f(y - 9 * s)}H${f(x + 64 * s)}`, { w: 1 });
    // mast, yard and a square sail with bold stripes, bellied by the wind
    path(`M${x} ${f(y - 16 * s)}V${f(y - 128 * s)}`, { w: 1.4 });
    path(`M${f(x - 52 * s)} ${f(y - 112 * s)}H${f(x + 52 * s)}`, { w: 1.6 });
    const sail = `M${f(x - 50 * s)} ${f(y - 112 * s)}H${f(x + 50 * s)}Q${f(x + 60 * s)} ${f(y - 72 * s)} ${f(x + 44 * s)} ${f(y - 34 * s)}H${f(x - 44 * s)}Q${f(x - 34 * s)} ${f(y - 72 * s)} ${f(x - 50 * s)} ${f(y - 112 * s)}Z`;
    path(sail, { fill: PAPER, w: 1.3 });
    clipped(sail, () => {
      for (let k = 0; k < 3; k++) path(`M${f(x - 34 * s + k * 30 * s)} ${f(y - 114 * s)}h${f(12 * s)}q${f(8 * s)} ${f(40 * s)} ${f(-2 * s)} ${f(82 * s)}h${f(-12 * s)}Z`, { fill: C, w: 0.6 });
    });
    path(`M${x} ${f(y - 128 * s)}l${f(18 * s)} ${f(5 * s)}l${f(-18 * s)} ${f(5 * s)}`, { fill: C, w: 0.8 });
    // its wake on the water
    path(`M${f(x + 70 * s)} ${f(y + 4 * s)}q${f(30 * s)} ${f(6 * s)} ${f(70 * s)} ${f(4 * s)}M${f(x - 74 * s)} ${f(y + 4 * s)}q${f(-40 * s)} ${f(8 * s)} ${f(-90 * s)} ${f(6 * s)}`, { w: 0.7 });
  }

  function birds() {
    for (const [x, y, s] of [[420, 190, 1], [462, 168, 0.8], [500, 204, 0.7], [1120, 176, 0.9], [1160, 158, 0.7], [1196, 186, 0.6]]) {
      path(`M${x} ${y}q${f(7 * s)} ${f(-8 * s)} ${f(14 * s)} 0q${f(7 * s)} ${f(-8 * s)} ${f(14 * s)} 0`, { w: 1.2 });
    }
  }

  // ---- the great arch that frames it all
  const ARCH = { cx: 800, spring: 340, ro: 676, rOy: 300, ri: 612, rIy: 250 };
  function archFrame() {
    const { cx, spring, ro, rOy, ri, rIy } = ARCH;
    const xo0 = cx - ro, xo1 = cx + ro, xi0 = cx - ri, xi1 = cx + ri;
    // the wall around the arch: the plate's frame, in dense cross-hatched stone
    const wall = `M0 0H1600V900H${xi1}V${spring}A${ri} ${rIy} 0 0 0 ${xi0} ${spring}V900H0Z`;
    path(wall, { fill: PAPER, w: 1.6 });
    clipped(wall, () => {
      let h = "";
      for (let y = 3; y < 900; y += 2.4) h += `M0 ${f(y)}H1600`;
      path(h, { w: 0.85 });
      // a second, diagonal pass for the deep stone
      let x2 = "";
      for (let k = -900; k < 1600; k += 5) x2 += `M${k} 900l900 -900`;
      path(x2, { w: 0.35 });
      // ashlar courses and joints, picked out in paper
      let a = "";
      for (let y = 30; y < 900; y += 46) {
        a += `M0 ${y}H1600`;
        for (let x = (y / 46) % 2 ? 0 : 50; x < 1600; x += 100) a += `M${x} ${y}v46`;
      }
      path(a, { stroke: PAPER, w: 2.6 });
    });
    // the arch band: voussoirs radiating from its centre, shaded on their inner edge
    const band = `M${xo0} ${spring}A${ro} ${rOy} 0 0 1 ${xo1} ${spring}H${xi1}A${ri} ${rIy} 0 0 0 ${xi0} ${spring}Z`;
    path(band, { fill: PAPER, w: 1.6 });
    clipped(band, () => {
      let v = "";
      for (let k = 1; k < 24; k++) {
        const t = Math.PI - (Math.PI * k) / 24;
        v += `M${f(cx + Math.cos(t) * ri)} ${f(spring - Math.sin(t) * rIy)}L${f(cx + Math.cos(t) * ro)} ${f(spring - Math.sin(t) * rOy)}`;
      }
      path(v, { w: 1.1 });
      let s = "";
      for (let k = 0; k < 6; k++) {
        const r = ri + 3 + k * 3.2, ry = rIy + 3 + k * 3.2 * (rOy - rIy) / (ro - ri);
        s += `M${cx - r} ${spring}A${r} ${f(ry)} 0 0 1 ${cx + r} ${spring}`;
      }
      path(s, { w: 0.55 });
    });
    // the piers with their imposts
    for (const [x0, x1] of [[xo0, xi0], [xi1, xo1]]) {
      path(`M${x0} 900V${spring}H${x1}V900`, { fill: PAPER, w: 1.6 });
      path(`M${x0 - 10} ${spring}h${x1 - x0 + 20}v-12h${-(x1 - x0 + 20)}Z`, { fill: PAPER, w: 1.4 });
      path(`M${x0 - 6} ${spring + 4}h${x1 - x0 + 12}`, { w: 0.8 });
      let p = "";
      for (let y = spring + 40; y < 900; y += 46) p += `M${x0} ${y}H${x1}`;
      for (let x = x0 + 3; x < x1; x += 3) if (x > x0 + (x1 - x0) * 0.55) p += `M${x} ${spring + 2}V900`;
      path(p, { w: 0.6 });
    }
    // keystone and its wreathed medallion
    path(`M${cx - 30} ${spring - rIy + 2}L${cx - 40} ${spring - rOy - 10}H${cx + 40}L${cx + 30} ${spring - rIy + 2}Z`, { fill: PAPER, w: 1.6 });
    out.push(`<circle cx="${cx}" cy="76" r="40" fill="${PAPER}" stroke="${C}" stroke-width="1.6"/>`);
    out.push(`<circle cx="${cx}" cy="76" r="34" fill="none" stroke="${C}" stroke-width="0.8"/>`);
    wreath(cx, 76, 31, 11, 3.2);
    out.push(`<text x="${cx}" y="89" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="36" font-style="italic" fill="${C}">R</text>`);
  }

  const wrap = (cls) => {
    const s = `<svg class="layer ${cls}" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round">${out.join("")}</svg>`;
    out = [];
    return s;
  };

  // The plate in depth layers, back to front, so it can move in parallax (poems.js): sky, the far shore,
  // the sea, the galley, and the arch in front, which stays put. Back layers reach past the opening so
  // nothing shows at its edges when they drift.
  function scene() {
    out = [];
    clipN = 0;
    seed = 11;
    const H = 604; // the horizon
    const layers = [];

    // sky: the sunset on the horizon with its rays, far mountains, birds
    let r = "";
    for (let a = Math.PI * 1.06; a < Math.PI * 1.94; a += Math.PI / 40) {
      const l = 44 + (Math.round(a * 40) % 2 ? rr(26, 46) : rr(70, 120));
      r += `M${f(800 + Math.cos(a) * 44)} ${f(H + Math.sin(a) * 44)}L${f(800 + Math.cos(a) * l)} ${f(H + Math.sin(a) * l)}`;
    }
    path(r, { w: 0.6 });
    path(`M766 ${H}A34 34 0 0 1 834 ${H}`, { fill: PAPER, w: 1.3 });
    let m = `M120 ${H - 22}`;
    for (let x = 120; x <= 1480; x += 30) m += `L${x} ${f(H - 10 - Math.abs(Math.sin(x / 120)) * 26 - rr(0, 6))}`;
    path(m, { w: 0.6 });
    out.push('<g class="birds">');
    birds();
    out.push("</g>");
    layers.push(wrap("l-sky"));

    // the far shore: the cliff with its temple and cypresses, the hill city and its quay
    hill(`M110 ${H + 6}V452C230 430 300 420 360 438C410 452 440 500 470 ${H + 6}Z`, 3.2, 0.22);
    temple(232, 334, 434, 40, 5);
    cypress(388, 448, 62, 13);
    cypress(410, 458, 44, 10);
    cypress(206, 446, 50, 11);
    hill(`M1130 ${H + 6}C1150 540 1200 500 1270 482C1330 468 1390 462 1490 468V${H + 6}Z`, 3.2, -0.2);
    let st = "";
    for (let k = 0; k < 9; k++) st += `M${1210 + k * 9} ${f(560 - k * 8)}h12v8`;
    path(st, { w: 0.9 });
    temple(1284, 1416, 474, 52, 7);
    path(`M1192 ${H - 52}l5 -78l5 78Z`, { fill: PAPER, w: 1 });
    path(`M1197 ${H - 130}v-6`, { w: 1 });
    let q = `M1140 ${H}V${H - 26}H1490`;
    for (let x = 1150; x < 1480; x += 22) q += `M${x} ${H}V${H - 12}a7 7 0 0 1 14 0V${H}`;
    path(q, { fill: PAPER, w: 0.9 });
    layers.push(wrap("l-shore"));

    // the sea, which is the ink: lines crowd closer as they come toward you, then run solid
    out.push(`<path d="M0 ${H}H1600V1000H0Z" fill="${PAPER}"/>`);
    out.push('<g class="swell">');
    let sea = "";
    let y = H + 4, gap = 3;
    while (y < 830) {
      let x = 60;
      while (x < 1540) {
        const len = rr(30, 140) * (1 + (y - H) / 260);
        sea += `M${f(x)} ${f(y)}q${f(len / 2)} ${f(rr(-1.6, 1.6))} ${f(len)} 0`;
        x += len + rr(2, 14) / (1 + (y - H) / 90);
      }
      y += gap;
      gap = Math.max(1.5, 3.6 - (y - H) / 90);
    }
    path(sea, { w: 0.7 });
    let road = "";
    for (let yy = H + 6; yy < 770; yy += 7) {
      const half = 10 + (yy - H) * 0.32;
      road += `M${f(800 - half * rr(0.3, 1))} ${f(yy)}h${f(half * rr(0.4, 1.4))}`;
    }
    path(road, { stroke: PAPER, w: 2.4 });
    out.push("</g>");
    path(`M612 ${H - 2}l10 -22l10 22Z`, { fill: PAPER, w: 0.9 });
    let flood = "M0 1000V808";
    for (let x = 0; x <= 1600; x += 40) flood += `L${x} ${f(812 + Math.sin(x / 120) * 7 + Math.sin(x / 37) * 3)}`;
    flood += "L1600 1000Z";
    path(flood, { fill: C, w: 1 });
    let glints = "";
    for (let k = 0; k < 70; k++) glints += `M${f(rr(60, 1520))} ${f(rr(832, 960))}h${f(rr(8, 40))}`;
    path(glints, { stroke: PAPER, w: 0.8 });
    layers.push(wrap("l-sea"));

    // the galley, bobbing on its own
    out.push('<g class="bob">');
    galley(1010, 712, 0.9);
    out.push("</g>");
    layers.push(wrap("l-ship"));

    // the arch in front, its garlands, and the ink at the threshold
    archFrame();
    branch([770, 112], [520, 300], [250, 250], { len: 24, wid: 6.5 });
    branch([830, 112], [1080, 300], [1350, 250], { len: 24, wid: 6.5 });
    path(`M0 900V858C300 846 500 864 800 856C1100 848 1300 866 1600 852V900Z`, { fill: C, w: 1 });
    layers.push(wrap("l-front"));
    return layers.join("");
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

  return { scene, sprig };
})();
