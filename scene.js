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
  const fade = document.querySelector(".scene .fade");
  const caption = document.querySelector(".live");
  if (!canvas || !skyCanvas) return;
  const hillCtx = canvas.getContext("2d");
  const skyCtx = skyCanvas.getContext("2d");
  const touch = document.getElementById("touch");
  const touchCtx = touch && touch.getContext("2d");
  const skyNight = document.getElementById("skyNight");
  const nightCtx = skyNight && skyNight.getContext("2d");
  const celest = document.getElementById("celestial");
  const celestCtx = celest && celest.getContext("2d");
  const cloudsEl = document.getElementById("clouds");
  const dusk = document.querySelector(".scene .dusk");
  const shade = document.getElementById("shade");
  const shadeCtx = shade && shade.getContext("2d");
  const landEl = document.getElementById("land");
  const glowCanvas = document.getElementById("glow");
  const glowCtx = glowCanvas && glowCanvas.getContext("2d");
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

  const DAY_SKY = { top: "#1d6e98", mid: "#2a83ad", low: "#4d9dbf", haze: "236, 239, 212", hazeA: 0.26 };
  const NIGHT_SKY = { top: "#0a1430", mid: "#132a55", low: "#26477a", haze: "110, 140, 200", hazeA: 0.2 };
  const DAY_CLOUD = { lit: "#f6f4dc", top: "#fbfaea", shade: "#e3e8d6", deep: "#cbdbd4", cast: "180, 208, 206" };
  const NIGHT_CLOUD = { lit: "#a9b6d3", top: "#c4cee4", shade: "#7d8cb0", deep: "#5f6f97", cast: "40, 58, 104" };
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
  // deeper overhead, hazier and lighter towards the horizon; painted once, so
  // it costs nothing per frame
  function drawSky(p) {
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.75);
    g.addColorStop(0, p.top);
    g.addColorStop(0.55, p.mid);
    g.addColorStop(1, p.low);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // light thickening just above the hill
    const hi = Math.min(ridge(0), ridge(W * 0.5), ridge(W));
    const haze = ctx.createLinearGradient(0, hi - H * 0.3, 0, hi + 20 * S);
    haze.addColorStop(0, `rgba(${p.haze}, 0)`);
    haze.addColorStop(1, `rgba(${p.haze}, ${p.hazeA})`);
    ctx.fillStyle = haze;
    ctx.fillRect(0, hi - H * 0.3, W, H);
  }

  // ---------------------------------------------------------------- night sky
  // Where the moon hangs: top right on wide screens; on phones the intro fills
  // the top, so it sits low on the left beside the cloud.
  function moonAt() {
    const heroTop = hero.getBoundingClientRect().top;
    const textBottom = intro ? intro.getBoundingClientRect().bottom - heroTop : 0;
    return narrow
      ? { x: W * 0.17, y: Math.min(textBottom + 60 * S, ridge(W * 0.17) - 70 * S), r: 20 * S }
      : { x: W * 0.88, y: H * 0.17, r: 28 * S };
  }

  // each star knows when it comes out (`at`, as the night deepens) and its own
  // slow twinkle
  let stars = [], moon = null;
  function planStars() {
    stars = [];
    const box = intro && intro.getBoundingClientRect(), heroTop = hero.getBoundingClientRect().top;
    const n = narrow ? 26 : 48;
    for (let i = 0, tries = 0; i < n && tries < 600; tries++) {
      const x = r(0, W), y = r(0, H * 0.75);
      if (y > ridge(x) - 20 * S || Math.hypot(x - moon.x, y - moon.y) < moon.r * 3) continue;
      // keep the intro text clean
      if (box && x > box.left - 10 && x < box.right + 10 && y > box.top - heroTop - 10 && y < box.bottom - heroTop + 10) continue;
      i++;
      // higher stars come out first, like a real dusk
      stars.push({ x, y, size: r(0.5, 1.4) * S, a: r(0.45, 1), at: 0.35 + 0.45 * (y / (H * 0.75)) + r(-0.08, 0.08), spark: rand() < 0.15, phase: r(0, 10), speed: r(0.6, 1.4) });
    }
  }

  function drawStars(g, p, now) {
    stars.forEach((s) => {
      const show = clamp((p - s.at) / 0.12, 0, 1);
      if (!show) return;
      const a = s.a * show * (still.matches ? 1 : 0.78 + 0.22 * Math.sin(now * 0.0012 * s.speed + s.phase));
      g.fillStyle = `rgba(255, 250, 225, ${a})`;
      g.beginPath(); g.arc(s.x, s.y, s.size, 0, Math.PI * 2); g.fill();
      // a few bright ones get a soft four-point twinkle
      if (s.spark) {
        g.strokeStyle = `rgba(255, 250, 225, ${a * 0.55})`;
        g.lineWidth = 0.7 * S;
        g.beginPath();
        g.moveTo(s.x - s.size * 4, s.y); g.lineTo(s.x + s.size * 4, s.y);
        g.moveTo(s.x, s.y - s.size * 4); g.lineTo(s.x, s.y + s.size * 4);
        g.stroke();
      }
    });
  }

  // The sun and moon share one spot in the sky. Going to night the sun sinks
  // behind the hill (which covers it), reddening as it goes, and then the moon
  // climbs up from behind it; going to day the same plays in reverse.
  const smooth = (t) => t * t * (3 - 2 * t);
  const sunUp = (p) => 1 - smooth(clamp(p / 0.55, 0, 1));
  const moonUp = (p) => smooth(clamp((p - 0.45) / 0.55, 0, 1));
  const sunAt = (p) => {
    const e = 1 - sunUp(p), r = moon.r * 1.15;
    return { x: moon.x + e * 30 * S, y: lerp(moon.y, ridge(moon.x) + r * 1.8, e), r, e };
  };
  const moonNow = (p) => {
    const e = moonUp(p);
    return { x: moon.x - (1 - e) * 30 * S, y: lerp(ridge(moon.x) + moon.r * 1.5, moon.y, e), r: moon.r, e };
  };

  function drawSun(g, p) {
    const { x, y, r, e } = sunAt(p);
    if (e >= 1) return;
    const c = (a, b) => Math.round(lerp(a, b, e));
    const halo = g.createRadialGradient(x, y, r * 0.9, x, y, r * 7);
    halo.addColorStop(0, `rgba(${c(255, 255)}, ${c(238, 150)}, ${c(170, 90)}, ${0.5 + 0.15 * e})`);
    halo.addColorStop(1, `rgba(${c(255, 255)}, ${c(238, 150)}, ${c(170, 90)}, 0)`);
    g.fillStyle = halo;
    g.fillRect(x - r * 7, y - r * 7, r * 14, r * 14);
    g.fillStyle = `rgb(255, ${c(246, 150)}, ${c(205, 95)})`;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.fillStyle = `rgba(255, 255, 240, ${0.6 * (1 - e)})`;
    g.beginPath(); g.arc(x - r * 0.15, y - r * 0.15, r * 0.6, 0, Math.PI * 2); g.fill();
  }

  // the moon rises from behind the hill (which covers it) as night falls
  function drawMoon(g, p) {
    const m = moonNow(p), e = m.e, rise = e;
    if (!rise) return;
    g.globalAlpha = clamp(rise * 3, 0, 1);
    const halo = g.createRadialGradient(m.x, m.y, m.r * 0.8, m.x, m.y, m.r * 6);
    halo.addColorStop(0, `rgba(210, 222, 255, ${0.28 * e})`);
    halo.addColorStop(1, "rgba(210, 222, 255, 0)");
    g.fillStyle = halo;
    g.fillRect(m.x - m.r * 6, m.y - m.r * 6, m.r * 12, m.r * 12);
    // warm and low while rising, cooling to silver at the top
    g.fillStyle = `rgb(${Math.round(lerp(255, 246, e))}, ${Math.round(lerp(214, 242, e))}, ${Math.round(lerp(160, 220, e))})`;
    g.beginPath(); g.arc(m.x, m.y, m.r, 0, Math.PI * 2); g.fill();
    // soft grey seas
    g.fillStyle = "rgba(196, 192, 168, .55)";
    [[-0.3, -0.25, 0.28], [0.25, 0.1, 0.2], [-0.05, 0.38, 0.16], [0.35, -0.38, 0.1]].forEach(([dx, dy, s]) => {
      g.beginPath(); g.ellipse(m.x + dx * m.r, m.y + dy * m.r, s * m.r, s * m.r * 0.8, 0.4, 0, Math.PI * 2); g.fill();
    });
    g.globalAlpha = 1;
  }

  // the sun, stars and moon layer, redrawn each frame while anything moves
  function drawCelestial(p, now) {
    if (!celestCtx || !moon) return;
    celestCtx.clearRect(0, 0, W, H);
    drawSun(celestCtx, p);
    if (p <= 0) return;
    drawStars(celestCtx, p, now);
    drawMoon(celestCtx, p);
  }

  // ---------------------------------------------------------------- shadows
  // Shadows fall away from the sun or moon onto their own softly blurred layer
  // under the grass: a pool of shade behind every tuft, grass clump and flower
  // clump, plus a tapered sliver behind each of their blades and stems. Low
  // light stretches them long (and fainter); they fade out at dusk and the moon
  // brings them back. Each kind is one batched fill, so the layer can repaint
  // every frame the light or the grass moves.
  let casters = [];
  function lightAt(p) {
    const s = sunUp(p), m = moonUp(p), src = s >= m ? sunAt(p) : moonNow(p);
    const elev = clamp((ridge(src.x) - src.y) / (H * 0.45), 0.05, 1);
    const reach = clamp(0.55 / elev, 0.55, 2.6);
    // longer shadows are paler, like real raking light
    return { x: src.x, y: src.y, reach, strength: (s >= m ? 0.3 * s : 0.42 * m) / (0.7 + 0.3 * reach) };
  }

  // where a point `h` tall at (x, y) throws its shadow tip, on the slope. It runs
  // ~9,000 times a frame while the light moves, so it fills one shared object
  // (read it straight away) rather than making garbage for the collector.
  const tip = { dx: 0, dy: 0 };
  function cast(L, x, y, h) {
    const vx = x - L.x, vy = y - L.y;
    const d = Math.hypot(vx, vy) || 1, k = h * L.reach;
    tip.dx = (vx / d) * k; tip.dy = (vy / d) * k * 0.35;
    return tip;
  }

  // Every shadow shape, handed to `line(set, x0, y0, x1, y1, width)` (a round-capped line) or
  // `oval(set, cx, cy, rx, ry, angle)`. Sets: 0 dapple, 1 pools, 2 rock shadows, 3 sliver, 4 sliver
  // root, 5 contact. Each set is one batch (one stroke or fill), so its shapes merge rather than
  // darken where they overlap. Contact shade always shows; the rest only while there is light.
  const SH_DAPPLE = 0, SH_POOL = 1, SH_ROCK = 2, SH_FULL = 3, SH_ROOT = 4, SH_CONTACT = 5;
  function shadeShapes(L, line, oval) {
    // contact shade hugging the roots of each clump, whatever the light
    casters.forEach((c) => oval(SH_CONTACT, c.x, c.y, c.w * 0.55, c.w * 0.14 + 1.5 * S, 0));
    if (L.strength < 0.01) return;
    // faint dappled shade across the meadow from a sample of the slope blades
    for (let i = 0; i < live.length; i += 9) {
      const o = live[i];
      if (!o.slope) continue;
      const { dx, dy } = cast(L, o.x, o.y, o.len * 0.6);
      line(SH_DAPPLE, o.x, o.y, o.x + dx, o.y + dy, 3.4 * S);
    }
    // each rock throws a long shadow (the rocks themselves stay unshaded)
    rocks.forEach((k) => {
      const { dx, dy } = cast(L, k.x, k.y, k.size * 0.9), len = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      oval(SH_ROCK, k.x + dx * 0.5, k.y + 1 + dy * 0.5, len * 0.55 + k.size * 0.75, k.size * 0.3, a);
    });
    // soft pools behind each clump of growth
    casters.forEach((c) => {
      const { dx, dy } = cast(L, c.x, c.y, c.h), len = Math.hypot(dx, dy);
      oval(SH_POOL, c.x + dx * 0.5, c.y + dy * 0.5, len * 0.5 + c.w * 0.35, c.w * 0.45 + 2 * S, Math.atan2(dy, dx));
    });
    // a tapered sliver behind each standing blade and stem: a thin line the
    // whole length over a wider one near the root. The dense slope blades are
    // left out; their shadows only muddied the grass.
    live.forEach((o) => {
      if (o.leaf || o.slope) return;
      let tx, ty;
      if (o.stem) { tx = o.hx + (o.ox || 0); ty = o.hy + (o.oy || 0); }
      else { const a = o.ang + o.b0 + o.b; tx = o.x + Math.cos(a) * o.len; ty = o.y + Math.sin(a) * o.len; }
      const h = o.y - ty;
      if (h <= 0) return;
      const { dx, dy } = cast(L, o.x, o.y, h), ex = (tx - o.x) * 0.35 + dx;
      line(SH_FULL, o.x, o.y, o.x + ex, o.y + dy, 1.2 * S);
      line(SH_ROOT, o.x, o.y, o.x + ex * 0.4, o.y + dy * 0.4, 2.6 * S);
    });
  }

  // shadows take the colour of the light's opposite: teal-green at noon,
  // violet as the sun gets low, deep blue under the moon
  function shadeTint() {
    const low = sunUp(glowT) >= moonUp(glowT) ? sunAt(glowT).e : 0, night = moonUp(glowT) > sunUp(glowT);
    return night ? [14, 24, 64] : [Math.round(lerp(22, 74, low)), Math.round(lerp(52, 40, low)), Math.round(lerp(42, 96, low))];
  }
  // how strong each set is (contact has its own fixed colour and strength)
  const shadeAlphas = (s) => [s * 0.4, s * 0.75, Math.min(s * 1.25, 0.6), s * 0.8, s * 0.8];

  // The shadows are redrawn every frame the light moves (the whole 2.8s switch) and while the
  // grass is brushed. On the graphics card (shadeGL, with the swaying grass) that is nearly free;
  // the 2D canvas below is only the fallback without WebGL2: stroking these ~6,000 lines cost the
  // GPU 50–60ms a frame and dropped the day/night switch to ~10–25fps.
  function drawShade() {
    if (!moon) return;
    if (shOn) { shadeGL(lightAt(glowT)); return; }
    if (!shadeCtx) return;
    const g = shadeCtx, L = lightAt(glowT);
    g.clearRect(0, 0, W, H);
    const lines = [], ovals = [];
    const at = (list, i) => list[i] || (list[i] = new Path2D());
    let widths = [];
    shadeShapes(L,
      (set, x0, y0, x1, y1, w) => { const p = at(lines, set); p.moveTo(x0, y0); p.lineTo(x1, y1); widths[set] = w; },
      (set, cx, cy, rx, ry, a) => { const p = at(ovals, set); p.moveTo(cx + Math.cos(a) * rx, cy + Math.sin(a) * rx); p.ellipse(cx, cy, rx, ry, a, 0, Math.PI * 2); });
    if (ovals[SH_CONTACT]) { g.fillStyle = "rgba(24, 48, 40, .14)"; g.fill(ovals[SH_CONTACT]); }
    if (L.strength < 0.01) return;
    const tint = shadeTint().join(", "), al = shadeAlphas(L.strength), ink = (a) => `rgba(${tint}, ${a})`;
    g.lineCap = "round";
    if (lines[SH_DAPPLE]) { g.strokeStyle = ink(al[SH_DAPPLE]); g.lineWidth = widths[SH_DAPPLE]; g.stroke(lines[SH_DAPPLE]); }
    if (ovals[SH_ROCK]) {
      g.save();
      const outside = new Path2D();
      outside.rect(0, 0, W, H);
      rocks.forEach((k) => outside.addPath(k.body));
      g.clip(outside, "evenodd");
      g.fillStyle = ink(al[SH_ROCK]);
      g.fill(ovals[SH_ROCK]);
      g.restore();
    }
    if (ovals[SH_POOL]) { g.fillStyle = ink(al[SH_POOL]); g.fill(ovals[SH_POOL]); }
    g.strokeStyle = ink(al[SH_FULL]);
    if (lines[SH_FULL]) { g.lineWidth = widths[SH_FULL]; g.stroke(lines[SH_FULL]); }
    if (lines[SH_ROOT]) { g.lineWidth = widths[SH_ROOT]; g.stroke(lines[SH_ROOT]); }
  }

  // the moon's light pooling on the slope and catching the ridge, screened on top
  function drawGlow(m) {
    const g = glowCtx;
    g.clearRect(0, 0, W, H);
    g.save();
    g.clip(hillPath());
    const px = narrow ? W * 0.35 : W * 0.66, py = lerp(ridge(px), H, 0.3);
    const pool = g.createRadialGradient(px, py, 0, px, py, Math.max(W, H) * 0.55);
    // kept faint (2026-11-19, my note: the slope looked plastic): the moonlight only touches the grass,
    // its brushwork stays visible as it is by day
    pool.addColorStop(0, "rgba(120, 150, 215, .13)");
    pool.addColorStop(0.5, "rgba(80, 105, 170, .05)");
    pool.addColorStop(1, "rgba(60, 80, 140, 0)");
    g.fillStyle = pool;
    g.fillRect(0, 0, W, H);
    g.restore();
    // a soft, blurred sheen on the crest, strongest under the moon. Its strokes
    // are laid on a scratch strip along the ridge and the strip is blurred once:
    // blurring each of the ~300 strokes on its own kept the GPU busy for about
    // a second, a freeze on the first frame of every switch to night.
    let lo = Infinity, hi = -Infinity;
    for (let x = 0; x <= W + 6; x += 6) { const y = ridge(x); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    const pad = 7 * S, y0 = Math.floor(lo + 6 * S - pad), y1 = Math.ceil(hi + 6 * S + pad);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const strip = document.createElement("canvas");
    // (wider than the screen, so the round caps past each edge still blur back in)
    strip.width = Math.round((W + pad * 2) * dpr); strip.height = Math.ceil((y1 - y0) * dpr);
    const s = strip.getContext("2d");
    s.setTransform(dpr, 0, 0, dpr, pad * dpr, -y0 * dpr);
    s.lineCap = "round";
    s.lineWidth = 7 * S;
    for (let x = 0; x < W; x += 6) {
      const near = 1 - clamp(Math.abs(x - m.x) / (W * 0.7), 0, 1);
      s.strokeStyle = `rgba(150, 178, 240, ${0.02 + 0.07 * near})`;
      s.beginPath(); s.moveTo(x, ridge(x) + 6 * S); s.lineTo(x + 6, ridge(x + 6) + 6 * S); s.stroke();
    }
    g.save();
    g.filter = `blur(${4 * S}px)`;
    g.drawImage(strip, -pad, y0, strip.width / dpr, strip.height / dpr);
    g.restore();
    strip.width = strip.height = 0;
  }

  // the big tower, kept clear of the intro text
  function towerSpec() {
    const heroTop = hero.getBoundingClientRect().top;
    const textBottom = intro ? intro.getBoundingClientRect().bottom - heroTop : 0;
    const cx = W * (narrow ? 0.64 : 0.68);
    const top = narrow ? textBottom + 22 * S : H * 0.1;
    const base = ridge(cx) + 30 * S;
    const ch = base - top;
    return { cx, base, ch, cw: Math.min(W * (narrow ? 0.56 : 0.28), ch * 1.1) };
  }

  // Paints a cloud onto its own small canvas `el`, cropped to the cloud, and
  // returns where that crop sits in the scene. Small canvases moved with
  // transforms let the clouds drift without repainting anything.
  function drawCloud(pal, el, { cx, base, ch, cw }) {
    if (ch < 12) { el.width = el.height = 0; return null; }

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
    const pad = 6 * S + 2;
    const x0 = Math.min(...lobes.map((l) => l.x - l.r)) - pad, x1 = Math.max(...lobes.map((l) => l.x + l.r)) + pad;
    const y0 = Math.min(...lobes.map((l) => l.y - l.r)) - pad, y1 = Math.max(...lobes.map((l) => l.y + l.r)) + pad;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const layer = document.createElement("canvas");
    layer.width = Math.ceil((x1 - x0) * dpr); layer.height = Math.ceil((y1 - y0) * dpr);
    const lc = layer.getContext("2d");
    lc.setTransform(dpr, 0, 0, dpr, -x0 * dpr, -y0 * dpr);
    const disc = (g, x, y, rad, color) => { g.fillStyle = color; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill(); };

    // brushy silhouette: overlapping dabs hugging the outer edge
    lobes.forEach((l) => {
      for (let k = 0; k < l.r * 0.7; k++) {
        const a = r(Math.PI * 0.9, Math.PI * 2.1), d = l.r * r(0.95, 1.01);
        lc.fillStyle = pal.lit;
        lc.beginPath();
        lc.ellipse(l.x + Math.cos(a) * d, l.y + Math.sin(a) * d, r(2, 4) * S, r(1.5, 3) * S, a, 0, Math.PI * 2);
        lc.fill();
      }
    });
    // back to front: each puff gets a thin, soft fold of shade underneath
    lobes.sort((a, b) => a.y - b.y).forEach((l) => {
      disc(lc, l.x, l.y, l.r, l.t < 0.35 ? pal.deep : pal.shade);
      disc(lc, l.x - l.r * 0.06, l.y - l.r * 0.11, l.r * 0.95, l.t > 0.7 ? pal.top : pal.lit);
    });
    // a pale blue cast gathering towards the base
    const body = new Path2D();
    lobes.forEach((l) => { body.moveTo(l.x + l.r, l.y); body.arc(l.x, l.y, l.r, 0, Math.PI * 2); });
    lc.save();
    lc.clip(body);
    const cast = lc.createLinearGradient(0, base - ch * 0.55, 0, base);
    cast.addColorStop(0, `rgba(${pal.cast}, 0)`);
    cast.addColorStop(1, `rgba(${pal.cast}, .55)`);
    lc.fillStyle = cast;
    lc.fillRect(cx - cw, base - ch, cw * 2.4, ch);
    // brushy highlights on the sunlit tops
    lobes.forEach((l) => {
      lc.fillStyle = pal.top;
      for (let k = 0; k < (l.t > 0.3 ? 4 : 1); k++) {
        lc.beginPath();
        lc.ellipse(l.x - l.r * r(0.05, 0.5), l.y - l.r * r(0.3, 0.7), r(3, 8) * S, r(1.5, 3) * S, -0.4, 0, Math.PI * 2);
        lc.fill();
      }
    });
    lc.restore();

    el.width = layer.width; el.height = layer.height;
    const g = el.getContext("2d");
    g.filter = "blur(0.8px)";
    g.drawImage(layer, 0, 0);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  // A small, far-off cumulus (the drifting clouds): one tall dome in the middle, smaller uneven domes
  // falling away to each side, a softly rounded flat base, light on top easing into gentle shade
  // underneath. The tower's painter squashed to this size read as a row of equal beads with a hard band
  // along the bottom, so the small clouds have their own.
  function drawPuff(pal, el, { cw }) {
    if (cw < 12) { el.width = el.height = 0; return null; }
    const u = cw;
    const shape = [[0, -0.2, 0.27], [-0.25, -0.09, 0.19], [0.24, -0.11, 0.21], [-0.43, -0.02, 0.12], [0.44, -0.03, 0.13], [0.08, -0.36, 0.16], [-0.12, -0.29, 0.14]];
    const lobes = shape.map(([x, y, rr]) => ({ x: (x + r(-0.02, 0.02)) * u, y: (y + r(-0.02, 0.02)) * u, r: rr * u * r(0.9, 1.1) }));
    const baseY = 0.03 * u;
    const pad = 6 * S + 2;
    const x0 = Math.min(...lobes.map((l) => l.x - l.r)) - pad, x1 = Math.max(...lobes.map((l) => l.x + l.r)) + pad;
    const y0 = Math.min(...lobes.map((l) => l.y - l.r)) - pad, y1 = baseY + pad;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const layer = document.createElement("canvas");
    layer.width = Math.ceil((x1 - x0) * dpr); layer.height = Math.ceil((y1 - y0) * dpr);
    const lc = layer.getContext("2d");
    lc.setTransform(dpr, 0, 0, dpr, -x0 * dpr, -y0 * dpr);
    // the body: every dome, plus a long low ellipse that rounds off the flat base
    const body = new Path2D();
    lobes.forEach((l) => { body.moveTo(l.x + l.r, l.y); body.arc(l.x, l.y, l.r, 0, Math.PI * 2); });
    body.moveTo(0.5 * u, -0.01 * u);
    body.ellipse(0, -0.01 * u, 0.5 * u, 0.06 * u, 0, 0, Math.PI * 2);
    lc.save();
    lc.beginPath(); lc.rect(x0, y0, x1 - x0, baseY - y0); lc.clip();
    lc.clip(body);
    // light on top, easing into a gentle shade underneath
    const top = Math.min(...lobes.map((l) => l.y - l.r));
    const g = lc.createLinearGradient(0, top, 0, baseY);
    g.addColorStop(0, pal.top); g.addColorStop(0.5, pal.lit); g.addColorStop(0.82, pal.shade); g.addColorStop(1, pal.deep);
    lc.fillStyle = g;
    lc.fillRect(x0, y0, x1 - x0, y1 - y0);
    // the same brushy edge as the tower: small dabs along the tops of the domes, so both look painted by one hand
    lobes.filter((l) => l.y < -0.05 * u).forEach((l) => {
      for (let k = 0; k < l.r * 0.35; k++) {
        const ang = r(Math.PI * 1.05, Math.PI * 1.95), d = l.r * r(0.9, 1.0);
        lc.fillStyle = r(0, 1) < 0.5 ? pal.top : pal.lit;
        lc.beginPath();
        lc.ellipse(l.x + Math.cos(ang) * d, l.y + Math.sin(ang) * d, r(1.5, 3) * S, r(1, 2) * S, ang, 0, Math.PI * 2);
        lc.fill();
      }
    });
    // each upper dome catches a little more light on its upper left
    lc.fillStyle = pal.top;
    lobes.filter((l) => l.y < -0.08 * u).forEach((l) => {
      lc.globalAlpha = 0.55;
      lc.beginPath(); lc.arc(l.x - l.r * 0.12, l.y - l.r * 0.16, l.r * 0.72, 0, Math.PI * 2); lc.fill();
    });
    lc.globalAlpha = 1;
    lc.restore();
    // the base melts away rather than ending in a line
    lc.globalCompositeOperation = "destination-out";
    const f = lc.createLinearGradient(0, baseY - 0.05 * u, 0, baseY);
    f.addColorStop(0, "rgba(0,0,0,0)"); f.addColorStop(1, "rgba(0,0,0,0.85)");
    lc.fillStyle = f;
    lc.fillRect(x0, baseY - 0.05 * u, x1 - x0, 0.05 * u + 1);
    lc.globalCompositeOperation = "source-over";

    el.width = layer.width; el.height = layer.height;
    const out = el.getContext("2d");
    out.filter = "blur(0.9px)";
    out.drawImage(layer, 0, 0);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
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
  const TALL = 2.4, THICK = 1.35;

  // one blade; `bend` tips it over from the root (0 = as painted)
  function blade(g, x, y, len, ang, w, color, j, bend) {
    g.strokeStyle = color;
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(ang + bend * 0.4) * len * 0.5 + j, y + Math.sin(ang + bend * 0.4) * len * 0.5, x + Math.cos(ang + bend) * len, y + Math.sin(ang + bend) * len);
    g.stroke();
  }

  // every blade lives on the touch layer, in paint order, so any of them can be
  // brushed; `slope` blades hide under the path, and ones rooted just under
  // the ridge are trimmed so they only fringe the sky a little
  let live = [];
  function stroke(x, y, len, ang, w, color, slope) {
    const o = { x, y, len: len * TALL, ang, w: w * THICK, color, j: r(-1, 1), b0: 0, b: 0, v: 0, slope };
    if (slope) o.len = Math.min(o.len, y - ridge(x) + 7 * S);
    live.push(o);
  }

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
    const count = Math.round((W * H) / 60);
    for (let i = 0; i < count; i++) {
      const x = r(0, W), y = r(ridge(W) - 4, H + 6);
      if (y < ridge(x) + 1) continue;
      const d = depth(y, x), n = patch(x, y);
      // far blades lean a shade darker so the upper slope reads as grass, not a flat wash
      const set = rand() < 0.35 + 0.35 * (1 - d) ? tone(n + 0.7) : rand() < 0.5 ? tone(n) : tone(n - 0.7);
      stroke(x, y, r(3, 9) * S * (0.95 + d * 0.9), -Math.PI / 2 + r(-0.6, 0.35), r(0.7, 1.6) * S * (0.85 + d * 0.75), pick(set), true);
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
    // a tight contact shadow where it sits (the cast shadow moves with the light)
    ctx.fillStyle = "#4f8030";
    ctx.beginPath();
    ctx.ellipse(x, y + 1, size * 0.95, size * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    // body
    const body = new Path2D();
    pts.forEach(([px, py], i) => (i ? body.lineTo(px, py) : body.moveTo(px, py)));
    body.lineTo(x + size, y + 2);
    body.lineTo(x - size, y + 2);
    body.closePath();
    ctx.fillStyle = "#454a51";
    ctx.fill(body);
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
    return body;
  }

  function drawRocks() {
    [[0.62, 0.9, 0.85], [0.69, 0.84, 0.7], [0.76, 0.875, 1.1], [0.86, 0.82, 0.75]].forEach(([u, v, s]) => {
      const x = u * W, y = Math.max(v * H, ridge(x) + 0.12 * H);
      const size = 32 * s * S * (0.6 + depth(y, x));
      rocks.push({ x, y, size, body: drawRock(x, y, size) });
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
    casters.push({ x, y, w: n * 1.1 * S, h: h * TALL * 0.8 });
  }

  function drawClumps() {
    const n = Math.round(W / 40);
    for (let i = 0; i < n; i++) {
      const x = r(0, W), y = r(ridge(x) + 10 * S, H + 4);
      clump(x, y, r(5, 11) * S * (0.4 + depth(y, x) * 1.4));
    }
  }

  // ---------------------------------------------------------------- tufts
  // long, soft wisps of grass that curl over at the tips, like a mossy meadow
  function drawTufts() {
    const n = Math.round(W / 16);
    for (let i = 0; i < n; i++) {
      const x = r(0, W), y = r(ridge(x) + 14 * S, H + 4);
      const d = depth(y, x), h = r(15, 28) * S * (0.4 + d * 1.2);
      const lean = r(-0.35, 0.35), blades = 6 + Math.floor(rand() * 6);
      casters.push({ x, y, w: blades * 1.4 * S, h: h * 0.75 });
      for (let k = 0; k < blades; k++) {
        const ang = -Math.PI / 2 + lean + (k - blades / 2) * 0.12 + r(-0.12, 0.12);
        live.push({ x: x + (k - blades / 2) * 1.4 * S, y, len: h * r(0.55, 1.05), ang, w: r(0.9, 1.7) * S * (0.6 + d), color: pick(k % 3 ? MIDS : LIGHTS), j: r(-3, 3) * S, b0: r(-0.25, 0.25), b: 0, v: 0 });
      }
    }
  }

  // ---------------------------------------------------------------- flowers
  // little painted clumps of blooms with leaves, each with a sprinkle of a
  // second colour; they join the touch layer on top of the blades
  const BLOOMS = {
    pink: { petals: ["#e9579b", "#f07bb4", "#d9468c"], heart: "#fbd2e4" },
    orange: { petals: ["#f39a3a", "#f7b54b", "#ec7f2c"], heart: "#ffe08a" },
    daisy: { petals: ["#fffbea", "#f6f1da", "#ffffff"], heart: "#f4c542" },
    purple: { petals: ["#9b6fd6", "#b48ce6", "#8257c4"], heart: "#f6ecff" },
    yellow: { petals: ["#f7d038", "#ffe066", "#f2c12e"], heart: "#e8892b" },
    red: { petals: ["#ef5b4c", "#f47c6a", "#e04a3f"], heart: "#ffd27a" },
    blue: { petals: ["#5a9fe6", "#7bb6f0", "#4a8bd6"], heart: "#fff4c2" },
  };
  const KINDS = Object.keys(BLOOMS);
  const LEAVES = ["#4f8a2e", "#5f9a34", "#6eaa3a"];
  let flowers = [];

  function planFlowers(path, dpr) {
    const spots = [[0.07, 0.8, "pink"], [0.27, 0.76, "orange"], [0.47, 0.72, "daisy"], [0.6, 0.67, "red"], [0.92, 0.6, "orange"],
      [0.17, 0.72, "blue"], [0.37, 0.66, "pink"], [0.78, 0.6, "purple"], [0.53, 0.94, "yellow"], [0.06, 0.95, "daisy"],
      [0.13, 0.87, "purple"], [0.33, 0.84, "yellow"], [0.69, 0.7, "daisy"], [0.42, 0.79, "red"], [0.24, 0.66, "pink"], [0.86, 0.66, "blue"]];
    spots.forEach(([u, v, kind]) => {
      // on phones the caption spans the bottom, so keep the low clumps for wide screens
      if (narrow && v > 0.86) return;
      const cx = u * W, cy = Math.max(v * H, ridge(cx) + 0.06 * H);
      const d = depth(cy, cx), R = 80 * S * (0.45 + d), accent = pick(KINDS);
      const clump = { heads: [] };
      casters.push({ x: cx, y: cy + R * 0.15, w: R * 1.5, h: 16 * S * (0.4 + d) });
      for (let k = 0; k < 70; k++) {
        const x = cx + r(-R, R), y = cy + r(-R * 0.3, R * 0.3);
        if (ctx.isPointInPath(path, x * dpr, y * dpr)) continue;
        live.push({ leaf: true, x, y, rx: r(3, 7) * S * (0.5 + d), ry: r(1.3, 2.8) * S * (0.5 + d), a: r(-0.9, 0.9), c: pick(LEAVES) });
      }
      const n = 32 + Math.floor(rand() * 14);
      for (let k = 0; k < n; k++) {
        const bx = cx + r(-R, R) * 0.9, by = cy + r(-R * 0.25, R * 0.3);
        if (ctx.isPointInPath(path, bx * dpr, by * dpr)) continue;
        const kd = rand() < 0.28 ? accent : kind, pal = BLOOMS[kd];
        const tall = r(9, 24) * S * (0.4 + d), hx = bx + r(-3, 3) * S, hy = by - tall;
        const size = r(3, 5) * S * (0.45 + d);
        const dabs = [];
        const count = kd === "daisy" ? 6 : 5;
        for (let p = 0; p < count; p++) {
          const a = (p / count) * Math.PI * 2 + r(-0.2, 0.2);
          dabs.push({ x: hx + Math.cos(a) * size * 0.9, y: hy + Math.sin(a) * size * 0.6, rx: size * (kd === "daisy" ? 0.75 : 0.85), ry: size * 0.5, a, c: pick(pal.petals) });
        }
        const head = { dabs, x: hx, y: hy, size, heart: pal.heart };
        const stem = { stem: true, x: bx, y: by, hx, hy, w: 0.9 * S * (0.5 + d), head, b: 0, v: 0, ox: 0, oy: 0 };
        head.stem = stem;
        live.push(stem);
        clump.heads.push(head);
      }
      if (clump.heads.length) flowers.push(clump);
    });
  }

  function paint(g, o) {
    if (o.leaf) {
      g.fillStyle = o.c; g.beginPath(); g.ellipse(o.x, o.y, o.rx, o.ry, o.a, 0, Math.PI * 2); g.fill();
    } else if (o.stem) {
      // a brushed stem swings its head around the root
      const dx = o.hx - o.x, dy = o.hy - o.y, c = Math.cos(o.b), sn = Math.sin(o.b);
      o.ox = o.x + dx * c - dy * sn - o.hx;
      o.oy = o.y + dx * sn + dy * c - o.hy;
      g.strokeStyle = LEAVES[0];
      g.lineWidth = o.w; g.beginPath(); g.moveTo(o.x, o.y);
      g.quadraticCurveTo(o.x + o.ox * 0.3, (o.y + o.hy) / 2, o.hx + o.ox, o.hy + o.oy); g.stroke();
      const h = o.head;
      h.dabs.forEach((p) => { g.fillStyle = p.c; g.beginPath(); g.ellipse(p.x + o.ox, p.y + o.oy, p.rx, p.ry, p.a, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = h.heart;
      g.beginPath(); g.arc(h.x + o.ox, h.y + o.oy, h.size * 0.38, 0, Math.PI * 2); g.fill();
    } else if (!glOn) {
      blade(g, o.x, o.y, o.len, o.ang, o.w, o.color, o.j, o.b0 + o.b);
    }
  }

  // ---------------------------------------------------------------- render
  let lastW = 0, lastH = 0;
  let fontsIn = !document.fonts;

  function size(c, dpr) {
    if (!c) return;
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // The night sky and moonlight are two more full-screen layers. They're only
  // allocated while night is showing or on its way: holding every layer at
  // once froze low-memory machines on refresh.
  // Painted in steps (the sky, each cloud, the moonlight): all at once when the page opens at
  // night, or one step a frame (`spread`) as the switch begins. The night layers are still nearly
  // invisible for the switch's first ~300ms; all at once, the GPU needed ~150ms, a visible hitch
  // on the first frame. Hovering the moon button starts them early (primeNight).
  let nightPainted = false, nightSteps = [];
  function paintNight(spread) {
    if (nightPainted || !nightCtx || !W) return;
    nightPainted = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    nightSteps = [() => {
      [skyNight, glowCanvas].forEach((c) => size(c, dpr));
      const keepCtx = ctx;
      ctx = nightCtx;
      drawSky(NIGHT_SKY);
      ctx = keepCtx;
    }];
    // each cloud's own seed, so its night copy has the same shape
    clouds.forEach((c) => nightSteps.push(() => {
      const keepSeed = seed;
      seed = c.seedNo;
      (c.small ? drawPuff : drawCloud)(NIGHT_CLOUD, c.night, c.spec);
      seed = keepSeed;
    }));
    if (glowCtx) nightSteps.push(() => drawGlow(moon));
    if (spread) nightSteps.shift()();
    else finishNight();
  }
  const finishNight = () => { while (nightSteps.length) nightSteps.shift()(); };
  function freeNight() {
    nightPainted = false;
    nightSteps = [];
    [skyNight, glowCanvas, ...clouds.map((c) => c.night)].forEach((c) => { if (c) { c.width = 0; c.height = 0; } });
  }

  // ---------------------------------------------------------------- clouds
  // The tower floats where it was painted. A few small, far-off clouds drift
  // in from the right on the breeze, in open sky clear of the intro text.
  // Each cloud is a small day + night canvas pair moved only by
  // transform, so drifting costs no repainting.
  let clouds = [];
  function makeCloud(spec, seedNo, small) {
    const el = document.createElement("div");
    el.className = "cloud";
    const day = document.createElement("canvas"), night = document.createElement("canvas");
    night.className = "night";
    el.append(day, night);
    const keep = seed;
    seed = seedNo;
    const box = (small ? drawPuff : drawCloud)(DAY_CLOUD, day, spec);
    // the tower carries on the hill's sequence; small clouds hand it back
    if (small) seed = keep;
    if (!box) return null;
    Object.assign(el.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` });
    // far-off clouds pass behind the tower
    if (small) cloudsEl.prepend(el); else cloudsEl.append(el);
    const c = { el, day, night, spec, seedNo, box, small, x: 0, y: 0 };
    clouds.push(c);
    return c;
  }

  function planSmallClouds() {
    const heroTop = hero.getBoundingClientRect().top;
    const t = intro ? intro.getBoundingClientRect() : null;
    const text = t ? { r: t.right + 12 * S, top: t.top - heroTop - 8 * S, bottom: t.bottom - heroTop + 8 * S } : { r: 0, top: H * 0.2, bottom: H * 0.45 };
    // Open sky only: under the top bar and above the name, and low over the
    // horizon below the intro, where they slip behind the hill like far-off
    // clouds. On phones the intro fills the top, so only the low band.
    const bar = 70, low = text.bottom + 6 * S, horizon = ridge(W * 0.15) - 8 * S;
    const bands = narrow
      ? [{ top: low, room: horizon - low, k: 0.9, v: 1 }]
      : [{ top: bar, room: text.top - bar, k: 1, v: 1.1 }, { top: bar + 6 * S, room: text.top - bar - 6 * S, k: 0.7, v: 0.75 }, { top: low, room: horizon - low, k: 1.1, v: 0.9 }];
    const pad = 6 * S + 2;
    bands.forEach((b, i) => {
      // a cloud's crop is about 0.8 × its width tall, plus padding
      const cw = Math.min(W * (narrow ? 0.2 : 0.075) * b.k, (b.room - pad * 2) / 0.8);
      if (cw < 30 * S) return;
      const c = makeCloud({ cx: 0, base: 0, ch: cw * 0.5, cw }, 7100 + i * 131, true);
      if (!c) return;
      c.y = b.top - c.box.y;
      // smaller reads as further away, so slower
      c.speed = (narrow ? 7 : 11) * S * b.v;
      c.pos = W * (0.1 + 0.8 * ((i * 0.41 + 0.15 * Math.random()) % 1));
    });
  }

  let lastDrift = 0;
  function driftClouds(now) {
    const s = lastDrift ? Math.min(now - lastDrift, 100) / 1000 : 0;
    lastDrift = now;
    clouds.forEach((c) => {
      if (c.small) {
        c.pos -= c.speed * s;
        // off the left edge, it comes round again from beyond the right
        if (c.pos + c.box.w < 0) c.pos = W + c.box.w * (0.2 + Math.random());
        c.x = c.pos - c.box.x;
      } else {
        // the tower sways and bobs, barely
        c.x = -6 * S + 8 * S * Math.sin(now / 5600);
        c.y = 3 * S * Math.sin(now / 4300);
      }
      c.el.style.transform = `translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, 0)`;
    });
  }
  function render() {
    if (!fontsIn) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return; // hidden or not laid out yet
    if (Math.abs(rect.width - lastW) < 1 && Math.abs(rect.height - lastH) < 1) return;
    lastW = rect.width; lastH = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    narrow = W < 760;
    S = clamp(Math.min(H / 800, W / 1200), 0.6, 1.2);
    [canvas, skyCanvas, celest, shade, touch, beeCanvas].forEach((c) => size(c, dpr));
    seed = 20261027;

    ctx = skyCtx;
    drawSky(DAY_SKY);
    clouds = [];
    if (cloudsEl) { cloudsEl.textContent = ""; makeCloud(towerSpec(), 20261027, false); }
    // stars take the next numbers in the sequence, then it's handed back so the
    // hill paints as it always has
    const resume = seed;
    moon = moonAt();
    planStars();
    seed = resume;
    if (cloudsEl) planSmallClouds();
    nightPainted = false;
    if (isNight) paintNight(); else freeNight();
    ctx = hillCtx;
    live = []; rocks = []; casters = [];
    drawSlope();
    const path = drawPath();
    drawRocks();
    drawClumps();
    drawTufts();
    flowers = [];
    planFlowers(path, dpr);
    // slope blades the path or a rock would have covered stay hidden
    live = live.filter((l) => {
      if (!l.slope) return true;
      const tx = l.x + Math.cos(l.ang) * l.len, ty = l.y + Math.sin(l.ang) * l.len;
      if (ctx.isPointInPath(path, l.x * dpr, l.y * dpr) || ctx.isPointInPath(path, tx * dpr, ty * dpr)) return false;
      return !rocks.some((k) => Math.abs(l.x - k.x) < k.size * 1.1 && l.y > k.y - k.size && l.y < k.y + 4);
    });
    buildSway(dpr);
    indexLive();
    active.clear();
    redraw(null);
    planBees();
    drawSway(performance.now());
    // start the animation loop now the bees exist: the scene paints after the
    // fonts load, which can be after the on-screen check that would have started it
    lastBuzz = 0;
    wake();
    applyNight();
    drawCelestial(glowT, performance.now());
  }

  // ---------------------------------------------------------------- touch grass
  // Run the cursor over the slope and every blade and flower under it leans
  // away and springs back. Only the grid cells around moving blades are
  // repainted each frame, so all of the grass can stay live.
  const CELL = 48;
  let raf = 0, pointer = null, cols = 0, rows = 0, grid = [];
  const active = new Set();

  // how far from its root a mark can reach, bent or not
  const reachOf = (o) => o.leaf ? Math.max(o.rx, o.ry) + 1 : o.stem ? Math.hypot(o.hx - o.x, o.hy - o.y) + o.head.size * 1.6 : o.len + Math.abs(o.j) + o.w;

  function cellsOf(o, fn) {
    const k = reachOf(o);
    const x0 = clamp(Math.floor((o.x - k) / CELL), 0, cols - 1), x1 = clamp(Math.floor((o.x + k) / CELL), 0, cols - 1);
    const y0 = clamp(Math.floor((o.y - k) / CELL), 0, rows - 1), y1 = clamp(Math.floor((o.y + k) / CELL), 0, rows - 1);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) fn(cy * cols + cx);
  }

  function indexLive() {
    cols = Math.ceil(W / CELL) + 1; rows = Math.ceil(H / CELL) + 1;
    grid = Array.from({ length: cols * rows }, () => []);
    live.forEach((o, i) => { o.i = i; cellsOf(o, (c) => grid[c].push(o)); });
  }

  // ---------------------------------------------------------------- swaying grass
  // The ~24,000 blades are drawn by the graphics card (WebGL2): uploaded once
  // per render, then a small shader bends every one each frame, so the whole
  // field sways with almost no work on the main thread (repainting them on a
  // 2D canvas cost 45–60ms a frame). Like a breeze through barley: a slow swell
  // rolls right to left, the way the clouds drift, the field leans one way and
  // rocks, and blades on a crest catch a little more light. Near the cursor
  // each blade still has its own spring (see brush/step); only the bends of
  // the springing ones change, and they're sent up as one small array.
  // Flowers and leaves stay on the 2D touch layer. Without WebGL2 the blades
  // are painted there, still, as they always were.
  const swayCanvas = document.getElementById("sway");
  let gl = null, glOn = false, glProg = null, glVao = null, glInst = null, glBend = null, glCount = 0, glU = null;
  let bends = new Float32Array(0), bendsDirty = false;

  const SWAY_VS = `#version 300 es
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
  // the swell rolls right to left over a longer, slower one; each blade adds a faint flutter
  float swell = 0.5 + 0.5 * sin(6.2832 * (root.x / (520.0 * uS) + uTime / 6.0) + root.y * 0.012);
  float roll = 0.5 + 0.5 * sin(6.2832 * (root.x / (1400.0 * uS) + uTime / 14.0));
  float bend = -(0.09 + 0.52 * swell * (0.4 + 0.6 * roll)) + 0.07 * sin(uTime * 1.5 + ph * 6.2832);
  // the blade's own spring, when the cursor has brushed it
  bend += aBend;
  float t = aCorner.x;
  vec2 p1 = root + vec2(cos(ang + bend * 0.4), sin(ang + bend * 0.4)) * len * 0.5 + vec2(j, 0.0);
  vec2 p2 = root + vec2(cos(ang + bend), sin(ang + bend)) * len;
  vec2 pos = mix(mix(root, p1, t), mix(p1, p2, t), t);
  vec2 tg = mix(p1 - root, p2 - p1, t);
  tg = length(tg) > 1e-4 ? normalize(tg) : vec2(0.0, -1.0);
  float hw = w * 0.5;
  // widened a pixel for a soft edge, and a round-cap's worth past the tip
  pos += vec2(-tg.y, tg.x) * aCorner.y * (hw + uPx) + tg * (t > 0.99 ? hw : 0.0);
  vEdge = aCorner.y * (hw + uPx);
  vHalf = hw;
  vColor = aColor * (1.0 + 0.09 * swell * roll);
  gl_Position = vec4(pos.x / uSize.x * 2.0 - 1.0, 1.0 - pos.y / uSize.y * 2.0, 0.0, 1.0);
}`;
  const SWAY_FS = `#version 300 es
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
    const g = swayCanvas && swayCanvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
    if (!g) return false;
    const shader = (type, src) => { const s = g.createShader(type); g.shaderSource(s, src); g.compileShader(s); return g.getShaderParameter(s, g.COMPILE_STATUS) ? s : null; };
    const vs = shader(g.VERTEX_SHADER, SWAY_VS), fs = shader(g.FRAGMENT_SHADER, SWAY_FS);
    if (!vs || !fs) return false;
    const p = g.createProgram();
    g.attachShader(p, vs); g.attachShader(p, fs); g.linkProgram(p);
    if (!g.getProgramParameter(p, g.LINK_STATUS)) return false;
    glProg = p;
    glVao = g.createVertexArray();
    g.bindVertexArray(glVao);
    // one blade: a strip of 4 points along its curve, each with a left and right edge
    g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([0, -1, 0, 1, 1 / 3, -1, 1 / 3, 1, 2 / 3, -1, 2 / 3, 1, 1, -1, 1, 1]), g.STATIC_DRAW);
    g.enableVertexAttribArray(0);
    g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
    // per blade: x, y, length, angle | width, jitter, phase | r, g, b
    glInst = g.createBuffer();
    g.bindBuffer(g.ARRAY_BUFFER, glInst);
    [[1, 4, 0], [2, 3, 16], [3, 3, 28]].forEach(([loc, n, off]) => {
      g.enableVertexAttribArray(loc);
      g.vertexAttribPointer(loc, n, g.FLOAT, false, 40, off);
      g.vertexAttribDivisor(loc, 1);
    });
    // per blade: the extra bend from its spring
    glBend = g.createBuffer();
    g.bindBuffer(g.ARRAY_BUFFER, glBend);
    g.enableVertexAttribArray(4);
    g.vertexAttribPointer(4, 1, g.FLOAT, false, 4, 0);
    g.vertexAttribDivisor(4, 1);
    g.enable(g.BLEND);
    g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA);
    glU = ["uSize", "uTime", "uS", "uPx"].reduce((u, n) => ((u[n] = g.getUniformLocation(p, n)), u), {});
    // if the graphics card drops the context, fall back to painting the blades in 2D
    swayCanvas.addEventListener("webglcontextlost", () => { gl = false; glOn = false; swayCanvas.hidden = true; lastW = 0; render(); });
    gl = g;
    return true;
  }

  const rgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);

  function buildSway(dpr) {
    glOn = false; shOn = false;
    // the shadows sit on the 2D #shade layer unless the graphics card takes them (sizeShade)
    if (shade) shade.hidden = false;
    if (!initGL()) { sh = null; if (swayCanvas) swayCanvas.hidden = true; return; }
    const blades = live.filter((o) => !o.leaf && !o.stem && /^#[0-9a-f]{6}$/i.test(o.color));
    if (blades.length !== live.filter((o) => !o.leaf && !o.stem).length) { swayCanvas.hidden = true; return; }
    const data = new Float32Array(blades.length * 10);
    blades.forEach((o, i) => {
      const k = i * 10, [cr, cg, cb] = rgb(o.color);
      o.gi = i;
      data.set([o.x, o.y, o.len, o.ang, o.w, o.j, (o.x * 0.0137 + o.y * 0.031) % 1, cr, cg, cb], k);
    });
    swayCanvas.width = Math.round(W * dpr);
    swayCanvas.height = Math.round(H * dpr);
    gl.bindBuffer(gl.ARRAY_BUFFER, glInst);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    bends = new Float32Array(blades.length);
    gl.bindBuffer(gl.ARRAY_BUFFER, glBend);
    gl.bufferData(gl.ARRAY_BUFFER, bends, gl.DYNAMIC_DRAW);
    bendsDirty = false;
    glCount = blades.length;
    gl.useProgram(glProg);
    gl.uniform2f(glU.uSize, W, H);
    gl.uniform1f(glU.uS, S);
    gl.uniform1f(glU.uPx, 1 / dpr);
    swayCanvas.hidden = false;
    glOn = true;
    // the 2D shadow layer is then not needed at all, so it gives its memory back
    if (sizeShade(dpr) && shade) { shade.hidden = true; shade.width = shade.height = 0; }
  }

  // ---------------------------------------------------------------- shadows on the GPU
  // The shadows (see shadeShapes) drawn with the swaying grass, under its blades, instead of on the
  // blurred 2D #shade layer, and looking the same:
  // 1. every shape is drawn with its exact anti-aliased coverage into its set's colour channel of
  //    two textures, keeping the larger value where shapes overlap, so a set merges like one fill;
  // 2. the sets are laid over each other in the 2D layer's order and colours (the rock shadows cut
  //    out of the rocks, from a mask of their bodies), and blurred with the same Gaussian as the
  //    layer's CSS blur(1.4·S px), across then down;
  // 3. each frame that result is drawn first, then the blades on top.
  // Only step 3 runs every frame; 1–2 run when the light or the brushed grass moves.
  const SH_SHAPE_VS = `#version 300 es
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec4 aA;
layout(location = 2) in vec3 aB;
uniform vec2 uSize;
uniform float uDpr;
out vec2 vLocal;
flat out vec3 vP;
flat out float vKind, vSet;
void main() {
  vKind = aB.y; vSet = aB.z;
  vec2 pos;
  if (aB.y < 0.5) {
    // a round-capped line: a box around it, in the line's own frame
    vec2 p0 = aA.xy * uDpr, p1 = aA.zw * uDpr, d = p1 - p0;
    float len = length(d), hw = aB.x * 0.5 * uDpr;
    vec2 u = len > 1e-4 ? d / len : vec2(1.0, 0.0), n = vec2(-u.y, u.x);
    float along = mix(-(hw + 1.0), len + hw + 1.0, aCorner.x * 0.5 + 0.5), across = aCorner.y * (hw + 1.0);
    pos = p0 + u * along + n * across;
    vLocal = vec2(along, across);
    vP = vec3(len, hw, 0.0);
  } else {
    // a turned ellipse: a box around it, in the ellipse's own frame
    vec2 c = aA.xy * uDpr, r = aA.zw * uDpr, q = aCorner * (r + 1.0);
    float cs = cos(aB.x), sn = sin(aB.x);
    pos = c + vec2(q.x * cs - q.y * sn, q.x * sn + q.y * cs);
    vLocal = q;
    vP = vec3(r, 0.0);
  }
  gl_Position = vec4(pos.x / uSize.x * 2.0 - 1.0, 1.0 - pos.y / uSize.y * 2.0, 0.0, 1.0);
}`;
  const SH_SHAPE_FS = `#version 300 es
precision highp float;
in vec2 vLocal;
flat in vec3 vP;
flat in float vKind, vSet;
layout(location = 0) out vec4 o0;
layout(location = 1) out vec4 o1;
void main() {
  float k;
  if (vKind < 0.5) {
    // share of this pixel inside a round-capped line of half width vP.y
    float dist = length(vec2(vLocal.x - clamp(vLocal.x, 0.0, vP.x), vLocal.y)), hw = vP.y;
    k = clamp(min(dist + 0.5, hw) - max(dist - 0.5, -hw), 0.0, 1.0);
  } else {
    // share of this pixel inside the ellipse, from its distance to the edge
    vec2 p = vLocal, r = vP.xy;
    float f = dot(p / r, p / r) - 1.0;
    vec2 gr = 2.0 * p / (r * r);
    k = clamp(0.5 - f / max(length(gr), 1e-6), 0.0, 1.0);
  }
  int s = int(vSet + 0.5);
  o0 = vec4(s == 0 ? k : 0.0, s == 1 ? k : 0.0, s == 2 ? k : 0.0, s == 3 ? k : 0.0);
  o1 = vec4(s == 4 ? k : 0.0, s == 5 ? k : 0.0, 0.0, 0.0);
}`;
  const SH_FULL_VS = `#version 300 es
void main() {
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  gl_Position = vec4(p, 0.0, 1.0);
}`;
  // uMode 0: lay the sets over each other and blur across; 1: blur down; 2: copy onto the canvas
  const SH_PASS_FS = `#version 300 es
precision highp float;
uniform sampler2D uT0, uT1, uMask;
uniform int uMode, uRad;
uniform vec2 uDir;
uniform float uSigma;
uniform vec3 uTint;
uniform float uA[5];
out vec4 o;
vec4 shadeAt(ivec2 p) {
  vec4 a = texelFetch(uT0, p, 0);
  vec2 b = texelFetch(uT1, p, 0).rg;
  float m = texelFetch(uMask, p, 0).a;
  float ink = 1.0 - (1.0 - uA[0] * a.r) * (1.0 - uA[2] * a.b * (1.0 - m)) * (1.0 - uA[1] * a.g) * (1.0 - uA[3] * a.a) * (1.0 - uA[4] * b.r);
  float c = 0.14 * b.g;
  return vec4(uTint * ink + vec3(24.0, 48.0, 40.0) / 255.0 * c * (1.0 - ink), ink + c * (1.0 - ink));
}
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy), size = textureSize(uT0, 0);
  if (uMode == 2) { o = texelFetch(uT0, p, 0); return; }
  vec4 sum = vec4(0.0);
  float wsum = 0.0;
  for (int i = -24; i <= 24; i++) {
    if (i < -uRad || i > uRad) continue;
    float w = exp(-float(i * i) / (2.0 * uSigma * uSigma));
    wsum += w;
    ivec2 q = p + ivec2(uDir) * i;
    if (q.x < 0 || q.y < 0 || q.x >= size.x || q.y >= size.y) continue;
    sum += w * (uMode == 0 ? shadeAt(q) : texelFetch(uT0, q, 0));
  }
  o = sum / wsum;
}`;

  let sh = null, shOn = false, shData = new Float32Array(0), shCount = 0, shDirty = false, shL = null;
  function initShade() {
    if (sh !== null) return !!sh;
    sh = false;
    const g = gl;
    if (!g) return false;
    const shader = (type, src) => { const s = g.createShader(type); g.shaderSource(s, src); g.compileShader(s); return g.getShaderParameter(s, g.COMPILE_STATUS) ? s : null; };
    const program = (vsSrc, fsSrc) => {
      const vs = shader(g.VERTEX_SHADER, vsSrc), fs = shader(g.FRAGMENT_SHADER, fsSrc);
      if (!vs || !fs) return null;
      const p = g.createProgram();
      g.attachShader(p, vs); g.attachShader(p, fs); g.linkProgram(p);
      return g.getProgramParameter(p, g.LINK_STATUS) ? p : null;
    };
    const shapes = program(SH_SHAPE_VS, SH_SHAPE_FS), pass = program(SH_FULL_VS, SH_PASS_FS);
    if (!shapes || !pass) return false;
    const vao = g.createVertexArray();
    g.bindVertexArray(vao);
    g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
    g.enableVertexAttribArray(0);
    g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
    const inst = g.createBuffer();
    g.bindBuffer(g.ARRAY_BUFFER, inst);
    g.enableVertexAttribArray(1); g.vertexAttribPointer(1, 4, g.FLOAT, false, 28, 0); g.vertexAttribDivisor(1, 1);
    g.enableVertexAttribArray(2); g.vertexAttribPointer(2, 3, g.FLOAT, false, 28, 16); g.vertexAttribDivisor(2, 1);
    const empty = g.createVertexArray();
    g.bindVertexArray(null);
    const U = (p, names) => names.reduce((u, n) => ((u[n] = g.getUniformLocation(p, n)), u), {});
    sh = { shapes, pass, vao, inst, empty, uS: U(shapes, ["uSize", "uDpr"]), uP: U(pass, ["uT0", "uT1", "uMask", "uMode", "uRad", "uDir", "uSigma", "uTint", "uA"]), tex: [], fbo: [] };
    return true;
  }

  // textures the size of the canvas: two for the sets, one between the blurs, the rock mask
  function sizeShade(dpr) {
    shOn = false;
    if (!glOn || !initShade()) return false;
    const g = gl, w = swayCanvas.width, h = swayCanvas.height;
    sh.tex.forEach((t) => g.deleteTexture(t));
    sh.fbo.forEach((f) => g.deleteFramebuffer(f));
    const tex = (fmt, ifmt, data) => {
      const t = g.createTexture();
      g.bindTexture(g.TEXTURE_2D, t);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
      if (data) { g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true); g.texImage2D(g.TEXTURE_2D, 0, ifmt, fmt, g.UNSIGNED_BYTE, data); g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, false); }
      else g.texImage2D(g.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, g.UNSIGNED_BYTE, null);
      return t;
    };
    // the rocks' bodies (in the mask's alpha), painted with the same paths as on the hill, so their edges match
    const mc = document.createElement("canvas");
    mc.width = w; mc.height = h;
    const m = mc.getContext("2d");
    m.setTransform(dpr, 0, 0, dpr, 0, 0);
    m.fillStyle = "#fff";
    rocks.forEach((k) => m.fill(k.body));
    const t0 = tex(g.RGBA, g.RGBA8), t1 = tex(g.RGBA, g.RGBA8), tb = tex(g.RGBA, g.RGBA8), tm = tex(g.RGBA, g.RGBA8, mc);
    mc.width = mc.height = 0;
    const fbo = (...ts) => {
      const f = g.createFramebuffer();
      g.bindFramebuffer(g.FRAMEBUFFER, f);
      ts.forEach((t, i) => g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0 + i, g.TEXTURE_2D, t, 0));
      const ok = g.checkFramebufferStatus(g.FRAMEBUFFER) === g.FRAMEBUFFER_COMPLETE;
      return ok ? f : null;
    };
    // sets → t0 + t1; across-blur → tb; down-blur → t0, which then holds the finished shadows
    const sets = fbo(t0, t1), blur = fbo(tb), done = fbo(t0);
    g.bindFramebuffer(g.FRAMEBUFFER, null);
    sh.tex = [t0, t1, tb, tm];
    sh.fbo = [sets, blur, done].filter(Boolean);
    if (!sets || !blur || !done) return false;
    Object.assign(sh, { t0, t1, tb, tm, sets, blur, done, dpr });
    shOn = true;
    return true;
  }

  // gather this light's shapes (cheap) and mark the textures out of date; they're redrawn just
  // before the next frame of grass, or now if no frames are running
  function shadeGL(L) {
    let n = 0;
    const need = (live.length / 9 + casters.length * 2 + rocks.length + live.length * 2) * 7;
    if (shData.length < need) shData = new Float32Array(Math.ceil(need));
    const d = shData;
    shadeShapes(L,
      (set, x0, y0, x1, y1, w) => { const k = n++ * 7; d[k] = x0; d[k + 1] = y0; d[k + 2] = x1; d[k + 3] = y1; d[k + 4] = w; d[k + 5] = 0; d[k + 6] = set; },
      (set, cx, cy, rx, ry, a) => { const k = n++ * 7; d[k] = cx; d[k + 1] = cy; d[k + 2] = rx; d[k + 3] = ry; d[k + 4] = a; d[k + 5] = 1; d[k + 6] = set; });
    shCount = n; shL = L; shDirty = true;
    if (!framing && !beeRaf) drawSway(performance.now());
  }

  function bakeShade() {
    shDirty = false;
    const g = gl, w = swayCanvas.width, h = swayCanvas.height, L = shL;
    g.viewport(0, 0, w, h);
    // 1. each set's coverage
    g.bindFramebuffer(g.FRAMEBUFFER, sh.sets);
    g.drawBuffers([g.COLOR_ATTACHMENT0, g.COLOR_ATTACHMENT1]);
    g.clearColor(0, 0, 0, 0);
    g.clear(g.COLOR_BUFFER_BIT);
    g.useProgram(sh.shapes);
    g.uniform2f(sh.uS.uSize, W, H);
    g.uniform1f(sh.uS.uDpr, sh.dpr);
    g.bindVertexArray(sh.vao);
    g.bindBuffer(g.ARRAY_BUFFER, sh.inst);
    g.bufferData(g.ARRAY_BUFFER, shData.subarray(0, shCount * 7), g.STREAM_DRAW);
    g.blendEquation(g.MAX);
    g.blendFunc(g.ONE, g.ONE);
    g.drawArraysInstanced(g.TRIANGLE_STRIP, 0, 4, shCount);
    g.blendEquation(g.FUNC_ADD);
    g.disable(g.BLEND);
    // 2. lay them over each other and blur, across then down
    g.useProgram(sh.pass);
    g.bindVertexArray(sh.empty);
    const tint = shadeTint().map((c) => c / 255), strong = L.strength >= 0.01;
    g.uniform3f(sh.uP.uTint, tint[0], tint[1], tint[2]);
    g.uniform1fv(sh.uP.uA, strong ? shadeAlphas(L.strength) : [0, 0, 0, 0, 0]);
    const sigma = 1.4 * S * sh.dpr;
    g.uniform1f(sh.uP.uSigma, sigma);
    g.uniform1i(sh.uP.uRad, Math.min(24, Math.ceil(sigma * 3)));
    [[sh.t0, 0], [sh.t1, 1], [sh.tm, 2]].forEach(([t, i]) => { g.activeTexture(g.TEXTURE0 + i); g.bindTexture(g.TEXTURE_2D, t); });
    g.uniform1i(sh.uP.uT0, 0); g.uniform1i(sh.uP.uT1, 1); g.uniform1i(sh.uP.uMask, 2);
    g.bindFramebuffer(g.FRAMEBUFFER, sh.blur);
    g.uniform1i(sh.uP.uMode, 0);
    g.uniform2f(sh.uP.uDir, 1, 0);
    g.drawArrays(g.TRIANGLES, 0, 3);
    g.bindFramebuffer(g.FRAMEBUFFER, sh.done);
    g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, sh.tb);
    g.uniform1i(sh.uP.uMode, 1);
    g.uniform2f(sh.uP.uDir, 0, 1);
    g.drawArrays(g.TRIANGLES, 0, 3);
    g.bindFramebuffer(g.FRAMEBUFFER, null);
    g.enable(g.BLEND);
    g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA);
  }

  let framing = false;
  function drawSway(now) {
    if (!glOn) return;
    if (bendsDirty) {
      gl.bindBuffer(gl.ARRAY_BUFFER, glBend);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, bends);
      bendsDirty = false;
    }
    if (shOn && shDirty) bakeShade();
    gl.viewport(0, 0, swayCanvas.width, swayCanvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (shOn) {
      // the shadows first, under the blades
      gl.useProgram(sh.pass);
      gl.bindVertexArray(sh.empty);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, sh.t0);
      gl.uniform1i(sh.uP.uT0, 0);
      gl.uniform1i(sh.uP.uMode, 2);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.useProgram(glProg);
    gl.bindVertexArray(glVao);
    gl.uniform1f(glU.uTime, still.matches ? 0 : (now / 1000) % 3600);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 8, glCount);
  }

  // repaint one block of cells [x0..x1] × [y0..y1] (or everything when `box`
  // is null), in paint order; a single rectangle keeps the clip cheap
  function redraw(box) {
    if (!touchCtx) return;
    const g = touchCtx;
    let marks = live;
    g.save();
    if (box) {
      const seen = new Set();
      for (let cy = box.y0; cy <= box.y1; cy++) for (let cx = box.x0; cx <= box.x1; cx++) grid[cy * cols + cx].forEach((o) => { if (!(glOn && o.gi !== undefined)) seen.add(o); });
      const x = box.x0 * CELL, y = box.y0 * CELL, w = (box.x1 - box.x0 + 1) * CELL, h = (box.y1 - box.y0 + 1) * CELL;
      g.clearRect(x, y, w, h);
      g.beginPath(); g.rect(x, y, w, h); g.clip();
      marks = [...seen].sort((a, b) => a.i - b.i);
    } else {
      g.clearRect(0, 0, W, H);
    }
    g.lineCap = "round";
    marks.forEach((o) => paint(g, o));
    g.restore();
  }

  let shadedAt = 0;
  function step() {
    raf = 0;
    const box = { x0: cols, y0: rows, x1: -1, y1: -1 };
    let moved = false;
    active.forEach((l) => {
      l.v = (l.v - l.b * 0.08) * 0.84;
      l.b = clamp(l.b + l.v, -1.3, 1.3);
      if (Math.abs(l.b) < 0.002 && Math.abs(l.v) < 0.002) { l.b = l.v = 0; active.delete(l); }
      moved = true;
      // a GPU blade just hands its bend to the shader; only flowers repaint in 2D
      if (glOn && l.gi !== undefined) { bends[l.gi] = l.b0 + l.b; bendsDirty = true; return; }
      cellsOf(l, (c) => {
        const cx = c % cols, cy = (c - cx) / cols;
        box.x0 = Math.min(box.x0, cx); box.x1 = Math.max(box.x1, cx);
        box.y0 = Math.min(box.y0, cy); box.y1 = Math.max(box.y1, cy);
      });
    });
    if (box.x1 >= 0) redraw(box);
    // on the graphics card the shadows follow the grass every frame; on the 2D
    // fallback they keep up at ~12fps (repainting the whole layer every frame
    // made brushing stutter) and land exactly once it settles
    if (moved && (shOn || !active.size || performance.now() - shadedAt > 80)) { drawShade(); shadedAt = performance.now(); }
    // with reduced motion the frame loop is off, so draw the brushed blades here
    if (bendsDirty && still.matches) drawSway(performance.now());
    if (active.size) raf = requestAnimationFrame(step);
  }

  function brush(x, y, dx) {
    const reach = 60 * S, seen = new Set();
    const x0 = clamp(Math.floor((x - reach) / CELL), 0, cols - 1), x1 = clamp(Math.floor((x + reach) / CELL), 0, cols - 1);
    const y0 = clamp(Math.floor((y - reach) / CELL), 0, rows - 1), y1 = clamp(Math.floor((y + reach) / CELL), 0, rows - 1);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) grid[cy * cols + cx].forEach((o) => seen.add(o));
    seen.forEach((o) => {
      if (o.leaf) return;
      const mx = o.stem ? o.hx : o.x + Math.cos(o.ang) * o.len * 0.6, my = o.stem ? o.hy : o.y + Math.sin(o.ang) * o.len * 0.6;
      const dist = Math.hypot(mx - x, my - y);
      if (dist > reach) return;
      const f = 1 - dist / reach;
      o.v += (clamp(dx, -30, 30) * (o.stem ? 0.015 : 0.02) + Math.sign(mx - x || 1) * (o.stem ? 0.06 : 0.08)) * f;
      active.add(o);
    });
    if (!raf && active.size) raf = requestAnimationFrame(step);
  }

  // ---------------------------------------------------------------- bees
  // A few bees potter about the flowers. Get the cursor close and they buzz off
  // in an arc to another clump, every time. At night they slowly turn into
  // fireflies and drift about more lazily.
  const beeCanvas = document.getElementById("bees");
  const beeCtx = beeCanvas && beeCanvas.getContext("2d");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  let bees = [], beeRaf = 0, heroOnScreen = true, lastBuzz = 0;
  // How far into night the scene is: `nightT` walks 0 → 1 (or back) over the
  // switch, and `glowT` is that eased. Everything keys off glowT: the sky
  // darkening, a warm dusk glow that peaks halfway, the hill cooling to
  // moonlight, the moon rising, stars coming out, and bees becoming fireflies.
  const root = document.documentElement, SWITCH = 2800;
  let isNight = root.dataset.theme === "night", nightT = isNight ? 1 : 0, glowT = nightT;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function applyNight() {
    const p = glowT, d = Math.sin(Math.PI * p);
    if (skyNight) skyNight.style.opacity = p;
    // the night copy fades in over the day one, which steps out once covered
    clouds.forEach((c) => { c.night.style.opacity = p; c.day.style.opacity = p >= 1 ? 0 : 1; });
    if (glowCanvas) glowCanvas.style.opacity = clamp((p - 0.45) / 0.55, 0, 1);
    if (dusk) dusk.style.opacity = d;
    // day → a warm dusk → cool moonlight, in one filter so it blends smoothly. It
    // tints the hill, shadows, grass and flowers together (.land): one filter over
    // the stack looks the same as one on each layer (it's a colour matrix), and
    // the compositor redoes one full-screen pass a frame instead of four.
    const f = p || d ? `brightness(${lerp(1, 0.48, p) - 0.08 * d}) sepia(${0.4 * d}) saturate(${lerp(1, 0.86, p) + 0.2 * d}) hue-rotate(${lerp(0, 16, p) - 12 * d}deg)` : "";
    if (landEl) landEl.style.filter = f;
    else [canvas, shade, touch, swayCanvas].forEach((el) => { if (el) el.style.filter = f; });
    // the 2D shade layer (no WebGL2) is also blurred so every shadow has a soft edge
    if (shade && !shOn) shade.style.filter = `blur(${(1.4 * S).toFixed(2)}px)${landEl ? "" : " " + f}`;
    drawShade();
  }

  function stepNight(dt) {
    const target = isNight ? 1 : 0;
    if (nightT === target) return;
    nightT = clamp(nightT + (isNight ? 1 : -1) * dt / SWITCH, 0, 1);
    glowT = ease(nightT);
    applyNight();
    if (nightT === 0) freeNight();
  }

  const headAt = (h) => ({ x: h.x + h.stem.ox, y: h.y + h.stem.oy - h.size * 1.4 - 5 * S });

  function land(b, clump) {
    b.clump = clump;
    b.head = pick(clump.heads);
    b.landed = performance.now();
    b.hop = b.landed + r(1800, 4200);
    b.flight = null;
  }

  function planBees() {
    bees = [];
    if (!beeCtx || !flowers.length) return;
    const n = Math.min(narrow ? 2 : 4, flowers.length);
    const order = flowers.map((f, i) => [rand(), f]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
    for (let i = 0; i < n; i++) {
      const b = { phase: r(0, 10), clock: 0, face: rand() < 0.5 ? -1 : 1, tilt: 0 };
      land(b, order[i]);
      const p = headAt(b.head);
      b.x = p.x; b.y = p.y;
      bees.push(b);
    }
    drawBees(performance.now());
  }

  // a curved flight to a flower: in another clump when spooked, or a short hop
  function fly(b, clump, ax, ay) {
    const head = pick(clump.heads), to = headAt(head);
    const away = ax === undefined ? 0 : Math.sign(b.x - ax || 1);
    const mx = (b.x + to.x) / 2 + away * r(30, 70) * S, my = Math.min(b.y, to.y) - r(away ? 60 : 15, away ? 130 : 35) * S;
    const dist = Math.hypot(to.x - b.x, to.y - b.y);
    b.flight = { sx: b.x, sy: b.y, mx, my, head, clump, t0: performance.now(), dur: clamp(dist * 3.2, 600, 1900) * (1 + 0.6 * glowT) };
  }

  function scare(x, y) {
    if (still.matches || flowers.length < 2) return;
    bees.forEach((b) => {
      if (b.flight && b.flight.clump !== b.clump) return; // already fleeing
      if (Math.hypot(b.x - x, b.y - y) > 48 * S) return;
      const others = flowers.filter((f) => f !== b.clump);
      fly(b, pick(others), x, y);
    });
    wake();
  }

  function moveBees(now) {
    const dt = lastBuzz ? Math.min(now - lastBuzz, 100) : 16;
    lastBuzz = now;
    stepNight(dt);
    bees.forEach((b) => {
      b.clock += dt * (1 - 0.5 * glowT);
      const px = b.x;
      if (b.flight) {
        const f = b.flight, t = clamp((now - f.t0) / f.dur, 0, 1);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        b.x = (1 - e) * (1 - e) * f.sx + 2 * (1 - e) * e * f.mx + e * e * headAt(f.head).x;
        b.y = (1 - e) * (1 - e) * f.sy + 2 * (1 - e) * e * f.my + e * e * headAt(f.head).y;
        if (t >= 1) { land(b, f.clump); b.head = f.head; }
      } else {
        // bob about over the flower, easing in after landing
        const p = headAt(b.head), s = clamp((now - b.landed) / 700, 0, 1), k = b.clock / 1000 + b.phase;
        // fireflies float wider and a little higher than bees
        b.x = p.x + Math.sin(k * 1.3) * (9 + 7 * glowT) * S * s;
        b.y = p.y + (Math.sin(k * 2.3) * (4 + 4 * glowT) - 8 * glowT) * S * s;
        if (now > b.hop) fly(b, b.clump);
      }
      const vx = b.x - px;
      if (Math.abs(vx) > 0.3) b.face = vx > 0 ? 1 : -1;
      b.tilt = lerp(b.tilt, clamp(vx * 0.08, -0.35, 0.35), 0.2);
    });
  }

  function drawBee(g, b, now) {
    if (glowT < 1) { g.globalAlpha = 1 - glowT; drawHoneybee(g, b, now); }
    if (glowT > 0) { g.globalAlpha = glowT; drawFirefly(g, b, now); }
    g.globalAlpha = 1;
  }

  function drawFirefly(g, b, now) {
    const pulse = still.matches ? 0.8 : 0.55 + 0.45 * Math.sin(now * 0.004 + b.phase * 3);
    const R = 26 * S * (0.75 + 0.35 * pulse);
    const halo = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, R);
    halo.addColorStop(0, `rgba(240, 255, 170, ${0.95 * pulse})`);
    halo.addColorStop(0.25, `rgba(200, 245, 100, ${0.45 * pulse})`);
    halo.addColorStop(1, "rgba(190, 240, 90, 0)");
    g.fillStyle = halo;
    g.fillRect(b.x - R, b.y - R, R * 2, R * 2);
    const k = 1.3 * S;
    g.save();
    g.translate(b.x, b.y);
    g.rotate(b.tilt);
    g.scale(b.face * k, k);
    const flap = still.matches ? 0.8 : 0.5 + 0.5 * Math.abs(Math.sin(now * 0.03 + b.phase));
    g.fillStyle = "rgba(200, 215, 255, .35)";
    g.beginPath(); g.ellipse(0.5, -2.8, 2.2, 3.2 * flap, -0.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#2d2b24";
    g.beginPath(); g.ellipse(1.6, 0, 3, 1.9, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(4.4, 0, 1.4, 0, Math.PI * 2); g.fill();
    // the lantern
    g.fillStyle = "#f3ffb8";
    g.beginPath(); g.ellipse(-2.2, 0.2, 2.6, 2.2, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  function drawHoneybee(g, b, now) {
    const k = 1.55 * S;
    g.save();
    g.translate(b.x, b.y);
    g.rotate(b.tilt);
    g.scale(b.face * k, k);
    const flap = still.matches ? 0.8 : 0.45 + 0.55 * Math.abs(Math.sin(now * 0.05 + b.phase));
    g.fillStyle = "rgba(255, 255, 255, .55)";
    g.beginPath(); g.ellipse(-1.5, -4, 2.6, 4.4 * flap, -0.5, 0, Math.PI * 2); g.fill();
    // body with two stripes, a dark head and a tiny sting
    g.fillStyle = "#f6c23e";
    g.beginPath(); g.ellipse(0, 0, 5.4, 3.7, 0, 0, Math.PI * 2); g.fill();
    g.save(); g.clip();
    g.fillStyle = "#3b2d1f";
    g.fillRect(-2.2, -4, 1.5, 8); g.fillRect(0.9, -4, 1.5, 8);
    g.restore();
    g.fillStyle = "#3b2d1f";
    g.beginPath(); g.arc(5.2, 0.3, 2.3, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(-5.2, -0.6); g.lineTo(-7.4, 0.3); g.lineTo(-5.2, 1.1); g.fill();
    g.fillStyle = "rgba(255, 255, 255, .8)";
    g.beginPath(); g.ellipse(1, -4.4, 2.3, 4 * flap, 0.35, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  // clear only around where each bee was (a firefly's halo reaches ~29·S):
  // wiping the whole full-screen layer every frame made scrolling lag
  let beeMarks = [];
  function drawBees(now) {
    if (!beeCtx) return;
    beeMarks.forEach(([x, y, s]) => beeCtx.clearRect(x - s, y - s, s * 2, s * 2));
    const s = 34 * S + 2;
    beeMarks = bees.map((b) => [b.x, b.y, s]);
    bees.forEach((b) => drawBee(beeCtx, b, now));
  }

  function buzz(now) {
    beeRaf = 0;
    framing = true;
    if (nightSteps.length) nightSteps.shift()();
    moveBees(now);
    drawBees(now);
    driftClouds(now);
    drawSway(now);
    if (glowT > 0 || nightT !== (isNight ? 1 : 0)) drawCelestial(glowT, now);
    framing = false;
    wake();
  }
  function wake() {
    if (!beeRaf && bees.length && heroOnScreen && !still.matches) beeRaf = requestAnimationFrame(buzz);
  }
  new IntersectionObserver(([e]) => { heroOnScreen = e.isIntersecting; lastBuzz = 0; wake(); }).observe(hero);
  // jump straight to the current mode (reduced motion, or nothing animating)
  function settleNight() {
    nightT = glowT = isNight ? 1 : 0;
    if (isNight) { paintNight(); finishNight(); } else freeNight();
    applyNight();
    drawCelestial(glowT, performance.now());
    drawBees(performance.now());
  }
  still.addEventListener("change", settleNight);

  // ---------------------------------------------------------------- day / night
  // The moon in the top bar switches the whole page to night (and the sun back);
  // the choice is remembered. The sky, hill and moonlight cross-fade in CSS.
  const modeBtn = document.getElementById("mode");
  const sceneEl = document.getElementById("scene");
  function showMode() {
    // the scene's description follows the light, so a screen reader hears the night when it shows
    if (sceneEl) sceneEl.setAttribute("aria-label", isNight
      ? "A painted hillside at night under a full moon and stars, fireflies over the flowers, and a sandy path winding up the grassy slope past a few rocks."
      : "A painted summer hillside under a teal sky with one towering cloud, and a sandy path winding up the grassy slope past a few rocks.");
    tick();
    if (!modeBtn) return;
    modeBtn.setAttribute("aria-pressed", isNight);
    modeBtn.setAttribute("aria-label", isNight ? "Day mode" : "Night mode");
  }
  if (modeBtn) {
    showMode();
    modeBtn.addEventListener("click", () => {
      isNight = !isNight;
      if (isNight) root.dataset.theme = "night"; else delete root.dataset.theme;
      try { localStorage.setItem("theme", isNight ? "night" : "day"); } catch (e) {}
      showMode();
      clearTimeout(unprime);
      lastBuzz = 0;
      if (still.matches || !heroOnScreen || !bees.length) settleNight();
      else { if (isNight) paintNight(true); wake(); }
    });
    // A cursor on the moon button is about to switch to night: paint the night
    // layers over the next few frames, so the switch starts with nothing left to
    // paint. If it leaves without switching they're freed again (low-memory PCs).
    let unprime = 0;
    const primeNight = () => {
      clearTimeout(unprime);
      if (!isNight && heroOnScreen && !still.matches && bees.length) { paintNight(true); wake(); }
    };
    modeBtn.addEventListener("pointerenter", primeNight);
    modeBtn.addEventListener("focus", primeNight);
    const unprimeNight = () => {
      clearTimeout(unprime);
      unprime = setTimeout(() => { if (!isNight && nightT === 0) freeNight(); }, 1500);
    };
    modeBtn.addEventListener("pointerleave", unprimeNight);
    modeBtn.addEventListener("blur", unprimeNight);
  }

  // Scrolling slides the page under a still cursor and Chrome reports that as
  // pointer moves; ignore those so the grass and shadows don't repaint mid-scroll
  let scrolledAt = 0;
  window.addEventListener("scroll", () => { scrolledAt = performance.now(); }, { passive: true });

  if (touch) {
    hero.addEventListener("pointermove", (e) => {
      if (performance.now() - scrolledAt < 150) return;
      const rect = touch.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const onGrass = !e.target.closest(".intro, .live") && y > ridge(x);
      hero.classList.toggle("touching", onGrass);
      scare(x, y);
      if (onGrass) brush(x, y, pointer ? x - pointer.x : 0);
      pointer = onGrass ? { x, y } : null;
    });
    hero.addEventListener("pointerleave", () => { hero.classList.remove("touching"); pointer = null; });
  }

  let t;
  // watch the canvas itself: late font loads shift the layout without a window resize
  new ResizeObserver(() => { cancelAnimationFrame(t); t = requestAnimationFrame(render); }).observe(canvas);
  // the cloud dodges the intro text, so paint once, after the fonts have settled
  // its height (painting before and again after froze the page on load);
  // slow fonts get a fallback paint and a repaint when they do arrive
  function paintNow() { if (fontsIn) return; fontsIn = true; render(); }
  if (document.fonts) {
    document.fonts.ready.then(() => { if (fontsIn) { lastW = 0; render(); } else paintNow(); });
    setTimeout(paintNow, 1500);
  }
  render();

  // ---------------------------------------------------------------- parallax
  // On scroll the sky and cloud sink slower than the hill, and the intro
  // lifts away gently, so the scene reads as layers with depth. The layers ease after the scroll rather
  // than snapping to it (like the poems page), so the hero glides.
  let ticking = false, eased = clamp(window.scrollY, 0, hero.offsetHeight), lastT = 0;
  function parallax(now) {
    ticking = false;
    const target = still.matches ? 0 : clamp(window.scrollY, 0, hero.offsetHeight);
    // time-based, so a slow frame does not leave the sky lagging behind
    const dt = lastT && now ? Math.min(250, now - lastT) : 16.7;
    lastT = now || 0;
    eased += (target - eased) * (1 - Math.pow(0.86, dt / 16.7));
    if (Math.abs(target - eased) < 0.3) { eased = target; lastT = 0; }
    else { ticking = true; requestAnimationFrame(parallax); }
    const y = eased;
    skyCanvas.style.transform = `translate3d(0, ${y * 0.45}px, 0)`;
    [skyNight, celest, cloudsEl, dusk].forEach((el) => { if (el) el.style.transform = skyCanvas.style.transform; });
    if (intro) {
      intro.style.transform = `translate3d(0, ${y * 0.25}px, 0)`;
      intro.style.opacity = clamp(1 - y / (hero.offsetHeight * 0.6), 0, 1);
    }
    // the foot of the hill melts into the page as it scrolls away
    const over = clamp(y / (hero.offsetHeight * 0.45), 0, 1);
    if (fade) fade.style.opacity = over;
    // the corner caption belongs to the hill: it stays cream with its shadow and leaves with the hill,
    // fading out as the grass melts into the page (turning it to page ink left a muddy grey on pale green,
    // which broke the look; 2026-11-19, my ask)
    if (caption) caption.style.opacity = clamp(1 - over / 0.55, 0, 1).toFixed(3);
  }
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
  }, { passive: true });
  still.addEventListener("change", () => { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } });
  parallax();

  // ---------------------------------------------------------------- hobby sounds
  // The hobby words in About (football pitch, barbell, game) play their sound on click, from the start,
  // cutting off any other; the word keeps its line and its tag shows an equalizer until the sound ends.
  let playing = null;
  document.querySelectorAll(".hob[data-sound]").forEach((word) => {
    // nothing downloads until a cursor or finger reaches the word (305 KB of sound most visitors never
    // play); it loads then, in the moment before the click
    const sound = new Audio();
    sound.preload = "none";
    const ready = () => { if (!sound.src) { sound.src = word.dataset.sound; sound.load(); } };
    const done = () => word.classList.remove("is-playing");
    word.addEventListener("pointerenter", ready);
    word.addEventListener("focus", ready);
    word.addEventListener("touchstart", ready, { passive: true });
    sound.addEventListener("ended", done);
    sound.addEventListener("pause", done);
    word.addEventListener("click", () => {
      ready();
      if (playing && playing !== sound) playing.pause();
      sound.currentTime = 0;
      sound.play().then(() => word.classList.add("is-playing")).catch(() => {});
      playing = sound;
    });
  });

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
    // the words follow the hill, not the visitor's clock: morning while it's day, night once it turns dark
    const now = new Date();
    const part = isNight ? "Night" : "Morning";
    clock.textContent = `${part} on the hill · ${now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} where you are`;
  }
  tick();
  setInterval(tick, 30000);

  const yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();
})();
