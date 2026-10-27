// Hand-drawn hillside. Everything is generated from a seeded random so the
// drawing looks the same on every visit, but still has a wobbly pen quality.
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.getElementById("scene-svg");
  const scene = document.getElementById("scene");
  const caption = document.getElementById("caption");
  if (!svg) return;

  const CAPTIONS = {
    football: "Sunday league, usually at the back. Still chasing the perfect through ball.",
    gym: "Early mornings, heavy things, slow progress.",
    gaming: "A few levels deep in whatever I'm playing this month.",
    poetry: "Short poems, mostly written on the way home.",
  };

  // Seeded random (mulberry32)
  let seed = 20261027;
  const rand = () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = (a, b) => a + rand() * (b - a);
  const f = (n) => Math.round(n * 10) / 10;

  const ground = (x) => 300 - 16 * Math.sin(x / 190 + 0.4) - 6 * Math.sin(x / 71 + 1.3);

  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(n);
    return n;
  };
  const path = (d, cls, parent, extra) => el("path", Object.assign({ d, class: cls }, extra || {}), parent);

  // Filters: a light wobble for ink, a heavier bleed for watercolour washes
  const defs = el("defs", {});
  defs.innerHTML = `
    <filter id="ink" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4"/>
      <feDisplacementMap in="SourceGraphic" scale="2.4"/>
    </filter>
    <filter id="wash" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="9"/>
      <feDisplacementMap in="SourceGraphic" scale="9"/>
    </filter>`;

  // Smooth closed blob through jittered points around an ellipse
  function blob(cx, cy, rx, ry, jitter, n) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const k = 1 + r(-jitter, jitter);
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    let d = "";
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      if (i === 0) d += `M${f(p1[0])} ${f(p1[1])}`;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d + "Z";
  }

  // Curly pen scribble that traces the edge of a foliage clump
  function scribble(cx, cy, rx, ry) {
    let d = "";
    const steps = Math.round((rx + ry) * 1.6);
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2 + 0.3;
      const loop = i * 1.9;
      const lr = r(3, 6);
      const x = cx + Math.cos(a) * rx * 0.86 + Math.cos(loop) * lr;
      const y = cy + Math.sin(a) * ry * 0.86 + Math.sin(loop) * lr * 0.8;
      d += (i ? "L" : "M") + f(x) + " " + f(y);
    }
    // little leaf ticks inside the clump
    for (let i = 0; i < (rx * ry) / 90; i++) {
      const a = r(0, Math.PI * 2), q = Math.sqrt(rand()) * 0.7;
      const x = cx + Math.cos(a) * rx * q, y = cy + Math.sin(a) * ry * q;
      d += `M${f(x)} ${f(y)}q${f(r(1.5, 3))} ${f(r(-3, -1.5))} ${f(r(3.5, 5))} 0`;
    }
    return d;
  }

  const thing = (name, extraClass) => el("g", { "data-thing": name, class: extraClass || "" });

  // ---------------------------------------------------------------- land
  let far = "";
  for (let x = -20; x <= 1020; x += 10) far += (x < -10 ? "M" : "L") + x + " " + f(ground(x) - 46 + 10 * Math.sin(x / 120));
  path(far + "L1020 360L-20 360Z", "w-grass-deep", null, { filter: "url(#wash)", opacity: ".18" });
  path(far, "hair", null, { opacity: ".3" });

  let land = "";
  for (let x = -20; x <= 1020; x += 10) land += (x < -10 ? "M" : "L") + x + " " + f(ground(x) - 3);
  path(land + "L1020 360L-20 360Z", "w-grass", null, { filter: "url(#wash)" });
  let land2 = "";
  for (let x = -20; x <= 1020; x += 10) land2 += (x < -10 ? "M" : "L") + x + " " + f(ground(x) + 22 + 6 * Math.sin(x / 50));
  path(land2 + "L1020 360L-20 360Z", "w-grass-deep", null, { filter: "url(#wash)" });

  // Birds
  const birds = el("g", { filter: "url(#ink)" });
  [[372, 74, 1], [396, 62, 0.8], [574, 96, 0.7]].forEach(([x, y, s]) =>
    path(`M${x - 7 * s} ${y}q${3 * s} -${4 * s} ${7 * s} 0q${4 * s} -${4 * s} ${7 * s} 0`, "ink", birds, { "stroke-width": 1 }));

  // ---------------------------------------------------------------- football
  const fb = thing("football", "bounce");
  const fbInk = el("g", { filter: "url(#ink)" }, fb);
  const gL = 196, gR = 296, top = Math.min(ground(gL), ground(gR)) - 64;
  const back = { x: 20, y: 12 };
  // net (back plane and roof), drawn as hairline mesh
  let net = "";
  for (let x = gL + back.x; x <= gR + back.x; x += 7) net += `M${f(x)} ${f(top + back.y)}L${f(x - back.x * 0.1)} ${f(ground(x) - 2)}`;
  for (let y = top + back.y + 7; y < ground(gR); y += 7) net += `M${gL + back.x} ${f(y)}L${gR + back.x} ${f(y)}`;
  for (let i = 0; i <= 14; i++) {
    const x = gL + ((gR - gL) * i) / 14;
    net += `M${f(x)} ${f(top)}L${f(x + back.x)} ${f(top + back.y)}`;
  }
  path(net, "hair", fbInk);
  path(`M${gL + back.x} ${top + back.y}L${gR + back.x} ${top + back.y}M${gL} ${top}L${gL + back.x} ${top + back.y}M${gR} ${top}L${gR + back.x} ${top + back.y}`, "ink", fbInk, { "stroke-width": 1 });
  path(`M${gL} ${f(ground(gL) + 2)}L${gL} ${top}L${gR} ${top}L${gR} ${f(ground(gR) + 2)}`, "ink", fbInk, { "stroke-width": 2.6 });
  // ball
  const bx = 352, by = ground(352) - 10;
  path(blob(bx + 2, by + 10, 13, 2.5, 0.1, 8), "w-grass-deep", fb, { filter: "url(#wash)" });
  const ball = el("g", { class: "ball", filter: "url(#ink)" }, fb);
  el("circle", { cx: bx, cy: by, r: 10, class: "w-paper", "stroke-width": 1.3 }, ball);
  path(`M${bx} ${by - 3.6}l3.4 2.5l-1.3 4h-4.2l-1.3 -4z`, "solid", ball);
  path(`M${bx} ${by - 3.6}v-6.2M${bx + 3.4} ${by - 1.1}l5.6 -1.6M${bx + 2.1} ${by + 2.9}l3.2 5M${bx - 2.1} ${by + 2.9}l-3.2 5M${bx - 3.4} ${by - 1.1}l-5.6 -1.6`, "ink", ball, { "stroke-width": 0.8 });
  el("rect", { x: gL - 8, y: top - 10, width: bx - gL + 24, height: ground(gL) - top + 20, class: "hit" }, fb);

  // ---------------------------------------------------------------- tree
  const tx = 700, tg = ground(tx);
  const tree = el("g", {});
  const trunkTop = tg - 96;
  const clumps = [
    [tx - 74, tg - 140, 54, 30],
    [tx + 70, tg - 150, 58, 32],
    [tx - 112, tg - 108, 34, 20],
    [tx + 118, tg - 112, 36, 21],
    [tx - 4, tg - 196, 70, 40],
    [tx - 46, tg - 230, 36, 22],
    [tx + 42, tg - 228, 40, 22],
  ];
  const tInk = el("g", { filter: "url(#ink)" }, tree);
  path(`M${tx - 13} ${tg + 2}C${tx - 8} ${tg - 30} ${tx - 9} ${tg - 66} ${tx - 6} ${trunkTop}M${tx + 13} ${tg + 2}C${tx + 7} ${tg - 34} ${tx + 9} ${tg - 70} ${tx + 6} ${trunkTop}`, "ink", tInk, { "stroke-width": 1.6 });
  path(blob(tx, tg - 46, 9, 48, 0.04, 10), "w-earth", tree, { filter: "url(#wash)" });
  let bark = "";
  for (let i = 0; i < 9; i++) {
    const x = tx + r(-7, 7), y = tg - r(8, 80);
    bark += `M${f(x)} ${f(y)}q${f(r(-1, 1))} -6 ${f(r(-1, 1))} -${f(r(8, 16))}`;
  }
  path(bark, "hair", tInk);
  // roots
  path(`M${tx - 13} ${tg + 1}q-9 2 -18 6M${tx + 13} ${tg + 1}q10 1 20 7M${tx - 4} ${tg + 2}q-3 5 -8 9`, "ink", tInk, { "stroke-width": 1.2 });
  // branches to each clump
  let br = "";
  clumps.forEach(([cx, cy, , ry]) => {
    const sx = tx + (cx > tx ? 3 : -3), sy = trunkTop + r(-6, 16);
    const ey = Math.min(cy + ry * 0.45, sy - 6);
    br += `M${f(sx)} ${f(sy)}Q${f((sx + cx) / 2 + r(-8, 8))} ${f((sy + ey) / 2 + r(4, 14))} ${f(cx * 0.8 + tx * 0.2)} ${f(ey)}`;
  });
  path(br, "ink", tInk, { "stroke-width": 1.3 });
  clumps.forEach(([cx, cy, rx, ry]) => path(blob(cx, cy, rx, ry, 0.12, 9), "w-leaf", tree, { filter: "url(#wash)" }));
  clumps.forEach(([cx, cy, rx, ry]) => path(scribble(cx, cy, rx, ry), "ink", tInk, { "stroke-width": 0.8, opacity: 0.85 }));

  // ---------------------------------------------------------------- gaming
  // A controller in the grass whose cable wanders off and becomes a root.
  const gm = thing("gaming");
  const cx0 = 474, cg = ground(cx0);
  const cy0 = cg - 14;
  const cab = `M${cx0 + 2} ${f(cy0 - 9)}C${cx0 + 8} ${f(cy0 - 44)} ${cx0 + 48} ${f(cy0 - 40)} ${cx0 + 40} ${f(cy0 - 16)}C${cx0 + 34} ${f(cy0 + 2)} ${cx0 + 70} ${f(ground(550) - 2)} 586 ${f(ground(586) - 3)}S${tx - 50} ${f(ground(tx - 50) - 1)} ${tx - 22} ${f(tg + 4)}`;
  const gInk = el("g", { filter: "url(#ink)" }, gm);
  path(cab, "ink", gInk, { "stroke-width": 1.3 });
  const pad = el("g", { transform: `translate(${cx0} ${f(cy0)}) rotate(-9)` }, gInk);
  path("M-22 -10C-28 -10 -32 -4 -33 4C-35 14 -31 20 -25 19C-20 18 -17 12 -13 9L13 9C17 12 20 18 25 19C31 20 35 14 33 4C32 -4 28 -10 22 -10Z", "w-paper", pad, { "stroke-width": 1.3 });
  path("M-21 -4v8M-25 0h8", "ink", pad, { "stroke-width": 2.2 });
  [[20, -5], [25, 0], [20, 5], [15, 0]].forEach(([x, y]) => el("circle", { cx: x, cy: y, r: 1.9, class: "solid" }, pad));
  path("M-6 1h4M2 1h4", "ink", pad, { "stroke-width": 1 });
  el("rect", { x: cx0 - 40, y: cy0 - 48, width: 100, height: 70, class: "hit" }, gm);

  // ---------------------------------------------------------------- gym
  const gy = thing("gym");
  const yInk = el("g", { filter: "url(#ink)" }, gy);
  const kx = 650, kg = ground(kx);
  path(blob(kx + 3, kg + 1, 18, 3, 0.1, 8), "w-grass-deep", gy, { filter: "url(#wash)" });
  path(`M${kx - 9} ${f(kg - 24)}C${kx - 12} ${f(kg - 42)} ${kx + 12} ${f(kg - 42)} ${kx + 9} ${f(kg - 24)}`, "ink", yInk, { "stroke-width": 3.4 });
  el("circle", { cx: kx, cy: f(kg - 14), r: 14, class: "solid" }, yInk);
  path(`M${kx - 8} ${f(kg - 20)}q2 -5 7 -6`, "ink", yInk, { "stroke-width": 1.4, style: "stroke: var(--paper); opacity: .7" });
  path(`M${kx - 6} ${f(kg - 2)}h12`, "ink", yInk, { "stroke-width": 2 });
  const dx = 770, dg = ground(dx);
  path(`M${dx - 15} ${f(dg - 7)}h30`, "ink", yInk, { "stroke-width": 2 });
  [[-17, 16], [-12, 12], [12, 12], [17, 16]].forEach(([o, h]) =>
    el("rect", { x: dx + o - 2.5, y: f(dg - 7 - h / 2), width: 5, height: h, rx: 1.2, class: "solid" }, yInk));
  el("rect", { x: kx - 22, y: kg - 46, width: 46, height: 50, class: "hit" }, gy);
  el("rect", { x: dx - 26, y: dg - 22, width: 52, height: 26, class: "hit" }, gy);

  // ---------------------------------------------------------------- poetry
  const po = thing("poetry");
  const pInk = el("g", { filter: "url(#ink)" }, po);
  function page(parent, w, h) {
    path(`M${-w / 2} ${-h / 2}h${w}v${h}h${-w}z`, "w-paper", parent);
    let lines = "";
    for (let i = 0; i < 4; i++) {
      const y = -h / 2 + 4 + i * ((h - 7) / 4);
      lines += `M${f(-w / 2 + 2.5)} ${f(y)}h${f(r(w * 0.35, w - 5))}`;
    }
    path(lines, "hair", parent, { opacity: 0.8 });
  }
  // a page resting in the grass, with a quill planted beside it
  const px = 578, pg = ground(px);
  page(el("g", { transform: `translate(${px} ${f(pg - 6)}) rotate(-14)` }, pInk), 22, 26);
  const qx = 602, qg = ground(qx);
  path(`M${qx} ${f(qg + 3)}Q${qx + 6} ${f(qg - 30)} ${qx + 20} ${f(qg - 60)}`, "ink", pInk, { "stroke-width": 1.1 });
  path(`M${qx + 3} ${f(qg - 14)}C${qx - 6} ${f(qg - 34)} ${qx + 6} ${f(qg - 58)} ${qx + 20} ${f(qg - 60)}C${qx + 22} ${f(qg - 42)} ${qx + 16} ${f(qg - 24)} ${qx + 3} ${f(qg - 14)}Z`, "w-paper", pInk, { "stroke-width": 1 });
  let barbs = "";
  for (let i = 1; i < 9; i++) {
    const t = i / 9, sx = qx + 3 + 17 * t * t * 0.9 + 3 * t, sy = qg - 14 - 46 * t;
    barbs += `M${f(sx)} ${f(sy)}l${f(-5 + t * 2)} ${f(-2)}M${f(sx)} ${f(sy)}l${f(5 - t * 2)} ${f(-3)}`;
  }
  path(barbs, "hair", pInk);
  // pages drifting down out of the tree like leaves
  [
    [tx - 70, tg - 140, 9, 0],
    [tx + 80, tg - 150, 12, -4],
    [tx + 10, tg - 196, 11, -7.5],
    [tx - 110, tg - 108, 13, -2],
  ].forEach(([x, y, dur, delay], i) => {
    const holder = el("g", { transform: `translate(${f(x)} ${f(y)})` }, po);
    const slip = el("g", { class: "fall", style: `--dx1:${i % 2 ? 22 : -18}px;--dx2:${i % 2 ? -6 : 14}px;--drop:${f(ground(x) - y - 8)}px;--r1:${i % 2 ? 40 : -50}deg;--r2:${i % 2 ? 160 : -140}deg;animation-duration:${dur}s;animation-delay:${delay}s;transform-box:fill-box;transform-origin:50% 50%` }, holder);
    page(slip, 9, 11);
  });
  el("rect", { x: px - 18, y: qg - 66, width: 52, height: 72, class: "hit" }, po);

  svg.insertBefore(tree, gy); // tree sits behind the kettlebell and dumbbell

  // ---------------------------------------------------------------- grass, drawn last so it overlaps everything
  const grass = el("g", {});
  for (let chunk = -20; chunk < 1020; chunk += 60) {
    let d = "";
    for (let x = chunk; x < chunk + 60; x += r(1.5, 3.2)) {
      const y = ground(x) + r(-1, 7);
      const tall = Math.sin(x / 37) > 0.55 ? 8 : 0;
      const h = r(5, 15) + tall;
      const lean = r(-5, 5);
      d += `M${f(x)} ${f(y)}Q${f(x + lean * 0.2)} ${f(y - h * 0.6)} ${f(x + lean)} ${f(y - h)}`;
    }
    const g = el("g", { class: "sway", style: `animation-delay:${f(-r(0, 6))}s;animation-duration:${f(r(5, 7.5))}s` }, grass);
    path(d, "ink", g, { "stroke-width": 0.65, opacity: 0.7 });
  }
  // a few tiny flowers
  let flowers = "";
  for (let i = 0; i < 16; i++) {
    const x = r(0, 1000), y = ground(x) + r(-6, 6);
    flowers += `M${f(x - 1.6)} ${f(y)}a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0`;
  }
  path(flowers, "ink", grass, { "stroke-width": 0.7 });

  // ---------------------------------------------------------------- linking words and drawings
  const buttons = document.querySelectorAll(".thing");
  const groups = svg.querySelectorAll("[data-thing]");
  let pinned = null;

  function focus(name) {
    scene.classList.toggle("has-focus", !!name);
    groups.forEach((g) => g.classList.toggle("on", g.dataset.thing === name));
    buttons.forEach((b) => b.classList.toggle("on", b.dataset.thing === name));
    if (name) caption.textContent = CAPTIONS[name];
  }
  const release = () => focus(pinned);

  [...buttons, ...groups].forEach((node) => {
    node.addEventListener("mouseenter", () => focus(node.dataset.thing));
    node.addEventListener("mouseleave", release);
    node.addEventListener("focus", () => focus(node.dataset.thing));
    node.addEventListener("blur", release);
    node.addEventListener("click", () => {
      pinned = pinned === node.dataset.thing ? null : node.dataset.thing;
      focus(pinned);
    });
  });

  const yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();
})();
