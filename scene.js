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
  if (!canvas || !skyCanvas) return;
  const hillCtx = canvas.getContext("2d");
  const skyCtx = skyCanvas.getContext("2d");
  const touch = document.getElementById("touch");
  const touchCtx = touch && touch.getContext("2d");
  const skyNight = document.getElementById("skyNight");
  const nightCtx = skyNight && skyNight.getContext("2d");
  const celest = document.getElementById("celestial");
  const celestCtx = celest && celest.getContext("2d");
  const cloudNight = document.getElementById("cloudNight");
  const cloudNightCtx = cloudNight && cloudNight.getContext("2d");
  const dusk = document.querySelector(".scene .dusk");
  const shade = document.getElementById("shade");
  const shadeCtx = shade && shade.getContext("2d");
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

  const SKY = "#287fa8", SKY_LOW = "#2f8ab3";
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
  function drawSky(top = SKY, low = SKY_LOW) {
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.7);
    g.addColorStop(0, top);
    g.addColorStop(1, low);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
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

  // where a point `h` tall at (x, y) throws its shadow tip, on the slope
  function cast(L, x, y, h) {
    const vx = x - L.x, vy = y - L.y;
    const d = Math.hypot(vx, vy) || 1, k = h * L.reach;
    return { dx: (vx / d) * k, dy: (vy / d) * k * 0.35 };
  }

  function drawShade() {
    if (!shadeCtx || !moon) return;
    const g = shadeCtx, L = lightAt(glowT);
    g.clearRect(0, 0, W, H);
    // contact shade hugging the roots of each clump, whatever the light
    const contact = new Path2D();
    casters.forEach((c) => {
      contact.moveTo(c.x + c.w * 0.55, c.y);
      contact.ellipse(c.x, c.y, c.w * 0.55, c.w * 0.14 + 1.5 * S, 0, 0, Math.PI * 2);
    });
    g.fillStyle = "rgba(24, 48, 40, .14)";
    g.fill(contact);
    if (L.strength < 0.01) return;
    // shadows take the colour of the light's opposite: teal-green at noon,
    // violet as the sun gets low, deep blue under the moon
    const low = sunUp(glowT) >= moonUp(glowT) ? sunAt(glowT).e : 0, night = moonUp(glowT) > sunUp(glowT);
    const tint = night ? [14, 24, 64] : [Math.round(lerp(22, 74, low)), Math.round(lerp(52, 40, low)), Math.round(lerp(42, 96, low))].join(", ");
    const ink = (a) => `rgba(${tint}, ${a})`;
    // faint dappled shade across the meadow from a sample of the slope blades
    const dapple = new Path2D();
    for (let i = 0; i < live.length; i += 9) {
      const o = live[i];
      if (!o.slope) continue;
      const { dx, dy } = cast(L, o.x, o.y, o.len * 0.6);
      dapple.moveTo(o.x, o.y); dapple.lineTo(o.x + dx, o.y + dy);
    }
    g.lineCap = "round";
    g.strokeStyle = ink(L.strength * 0.4);
    g.lineWidth = 3.4 * S;
    g.stroke(dapple);
    // each rock throws a long shadow; the rocks themselves stay unshaded
    if (rocks.length) {
      g.save();
      const outside = new Path2D();
      outside.rect(0, 0, W, H);
      rocks.forEach((k) => outside.addPath(k.body));
      g.clip(outside, "evenodd");
      const stones = new Path2D();
      rocks.forEach((k) => {
        const { dx, dy } = cast(L, k.x, k.y, k.size * 0.9), len = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
        const rx = len * 0.55 + k.size * 0.75, cx = k.x + dx * 0.5, cy = k.y + 1 + dy * 0.5;
        stones.moveTo(cx + Math.cos(a) * rx, cy + Math.sin(a) * rx);
        stones.ellipse(cx, cy, rx, k.size * 0.3, a, 0, Math.PI * 2);
      });
      g.fillStyle = ink(Math.min(L.strength * 1.25, 0.6));
      g.fill(stones);
      g.restore();
    }
    // soft pools behind each clump of growth
    const pools = new Path2D();
    casters.forEach((c) => {
      const { dx, dy } = cast(L, c.x, c.y, c.h), len = Math.hypot(dx, dy);
      const rx = len * 0.5 + c.w * 0.35, ry = c.w * 0.45 + 2 * S, a = Math.atan2(dy, dx);
      const cx = c.x + dx * 0.5, cy = c.y + dy * 0.5;
      pools.moveTo(cx + Math.cos(a) * rx, cy + Math.sin(a) * rx);
      pools.ellipse(cx, cy, rx, ry, a, 0, Math.PI * 2);
    });
    g.fillStyle = ink(L.strength * 0.75);
    g.fill(pools);
    // a tapered sliver behind each standing blade and stem: a thin stroke the
    // whole length over a wider one near the root (strokes batch far faster
    // than thousands of filled shapes). The dense slope blades are left out;
    // their shadows only muddied the grass.
    const full = new Path2D(), root = new Path2D();
    live.forEach((o) => {
      if (o.leaf || o.slope) return;
      let tx, ty;
      if (o.stem) { tx = o.hx + (o.ox || 0); ty = o.hy + (o.oy || 0); }
      else { const a = o.ang + o.b0 + o.b; tx = o.x + Math.cos(a) * o.len; ty = o.y + Math.sin(a) * o.len; }
      const h = o.y - ty;
      if (h <= 0) return;
      const { dx, dy } = cast(L, o.x, o.y, h), ex = (tx - o.x) * 0.35 + dx;
      full.moveTo(o.x, o.y); full.lineTo(o.x + ex, o.y + dy);
      root.moveTo(o.x, o.y); root.lineTo(o.x + ex * 0.4, o.y + dy * 0.4);
    });
    g.lineCap = "round";
    g.strokeStyle = ink(L.strength * 0.8);
    g.lineWidth = 1.2 * S; g.stroke(full);
    g.lineWidth = 2.6 * S; g.stroke(root);
  }

  // the moon's light pooling on the slope and catching the ridge, screened on top
  function drawGlow(m) {
    const g = glowCtx;
    g.clearRect(0, 0, W, H);
    g.save();
    g.clip(hillPath());
    const px = narrow ? W * 0.35 : W * 0.66, py = lerp(ridge(px), H, 0.3);
    const pool = g.createRadialGradient(px, py, 0, px, py, Math.max(W, H) * 0.55);
    pool.addColorStop(0, "rgba(120, 150, 215, .38)");
    pool.addColorStop(0.5, "rgba(80, 105, 170, .16)");
    pool.addColorStop(1, "rgba(60, 80, 140, 0)");
    g.fillStyle = pool;
    g.fillRect(0, 0, W, H);
    g.restore();
    // a soft, blurred sheen on the crest, strongest under the moon
    g.save();
    g.filter = `blur(${4 * S}px)`;
    g.lineCap = "round";
    for (let x = 0; x < W; x += 6) {
      const near = 1 - clamp(Math.abs(x - m.x) / (W * 0.7), 0, 1);
      g.strokeStyle = `rgba(150, 178, 240, ${0.04 + 0.16 * near})`;
      g.lineWidth = 7 * S;
      g.beginPath(); g.moveTo(x, ridge(x) + 6 * S); g.lineTo(x + 6, ridge(x + 6) + 6 * S); g.stroke();
    }
    g.restore();
  }

  function drawCloud(pal) {
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
    } else {
      blade(g, o.x, o.y, o.len, o.ang, o.w, o.color, o.j, o.b0 + o.b);
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
    [canvas, skyCanvas, skyNight, celest, cloudNight, shade, touch, glowCanvas, beeCanvas].forEach((c) => {
      if (!c) return;
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    seed = 20261027;

    ctx = skyCtx;
    drawSky();
    drawCloud(DAY_CLOUD);
    // the night sky reuses the same seed so its cloud has the same shape, then
    // hands the sequence back so the hill paints as it always has
    const resume = seed;
    if (nightCtx && cloudNightCtx) {
      ctx = nightCtx;
      moon = moonAt();
      drawSky("#0b1633", "#23426f");
      planStars();
      ctx = cloudNightCtx;
      seed = 20261027;
      drawCloud(NIGHT_CLOUD);
      if (glowCtx) drawGlow(moon);
    }
    seed = resume;
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
    indexLive();
    active.clear();
    redraw(null);
    planBees();
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

  // repaint one block of cells [x0..x1] × [y0..y1] (or everything when `box`
  // is null), in paint order; a single rectangle keeps the clip cheap
  function redraw(box) {
    if (!touchCtx) return;
    const g = touchCtx;
    let marks = live;
    g.save();
    if (box) {
      const seen = new Set();
      for (let cy = box.y0; cy <= box.y1; cy++) for (let cx = box.x0; cx <= box.x1; cx++) grid[cy * cols + cx].forEach((o) => seen.add(o));
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

  function step() {
    raf = 0;
    const box = { x0: cols, y0: rows, x1: -1, y1: -1 };
    active.forEach((l) => {
      l.v = (l.v - l.b * 0.08) * 0.84;
      l.b = clamp(l.b + l.v, -1.3, 1.3);
      if (Math.abs(l.b) < 0.002 && Math.abs(l.v) < 0.002) { l.b = l.v = 0; active.delete(l); }
      cellsOf(l, (c) => {
        const cx = c % cols, cy = (c - cx) / cols;
        box.x0 = Math.min(box.x0, cx); box.x1 = Math.max(box.x1, cx);
        box.y0 = Math.min(box.y0, cy); box.y1 = Math.max(box.y1, cy);
      });
    });
    if (box.x1 >= 0) { redraw(box); drawShade(); }
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
  // How far into night the scene is: `nightT` walks 0 → 1 (or back), and
  // `glowT` is that eased. Everything keys off glowT: the sky darkening, a warm
  // dusk glow that peaks halfway, the hill cooling to moonlight, the moon
  // rising, stars coming out, and bees becoming fireflies.
  // A hidden clock starts when the page opens: a minute of day, a minute of
  // night, and so on. The last TURN of each minute is a slow sunset (or
  // sunrise). The button skips ahead, chasing the clock at SWITCH speed.
  const root = document.documentElement, SWITCH = 2800, DAY = 60000, TURN = 24000;
  let isNight = false, nightT = 0, glowT = 0, clock0 = performance.now();
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function clockAt(now) {
    const t = (now - clock0) % (2 * DAY), k = clamp((t % DAY - (DAY - TURN)) / TURN, 0, 1);
    return t < DAY ? k : 1 - k;
  }

  function setTheme(night) {
    if (night === isNight) return;
    isNight = night;
    if (night) root.dataset.theme = "night"; else delete root.dataset.theme;
    showMode();
  }

  function applyNight() {
    const p = glowT, d = Math.sin(Math.PI * p);
    if (skyNight) skyNight.style.opacity = p;
    if (cloudNight) cloudNight.style.opacity = p;
    if (glowCanvas) glowCanvas.style.opacity = clamp((p - 0.45) / 0.55, 0, 1);
    if (dusk) dusk.style.opacity = d;
    // day → a warm dusk → cool moonlight, in one filter so it blends smoothly
    const f = p || d ? `brightness(${lerp(1, 0.48, p) - 0.08 * d}) sepia(${0.4 * d}) saturate(${lerp(1, 0.7, p) + 0.2 * d}) hue-rotate(${lerp(0, 16, p) - 12 * d}deg)` : "";
    [canvas, touch].forEach((el) => { if (el) el.style.filter = f; });
    // the shade layer is also blurred so every shadow has a soft edge
    if (shade) shade.style.filter = `blur(${(1.4 * S).toFixed(2)}px) ${f}`;
    drawShade();
  }

  function stepNight(dt, now) {
    const target = clockAt(now), step = dt / SWITCH;
    if (nightT === target) return false;
    nightT = Math.abs(target - nightT) <= step ? target : nightT + Math.sign(target - nightT) * step;
    glowT = ease(nightT);
    setTheme(nightT > 0.5);
    applyNight();
    return true;
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
    const turning = stepNight(dt, now);
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
    return turning;
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

  function drawBees(now) {
    if (!beeCtx) return;
    beeCtx.clearRect(0, 0, W, H);
    bees.forEach((b) => drawBee(beeCtx, b, now));
  }

  function buzz(now) {
    beeRaf = 0;
    const turning = moveBees(now);
    drawBees(now);
    if (glowT > 0 || turning) drawCelestial(glowT, now);
    wake();
  }
  function wake() {
    if (!beeRaf && bees.length && heroOnScreen && !still.matches) beeRaf = requestAnimationFrame(buzz);
  }
  new IntersectionObserver(([e]) => { heroOnScreen = e.isIntersecting; lastBuzz = 0; wake(); }).observe(hero);
  // jump straight to the current mode (reduced motion, or nothing animating)
  function settleNight() {
    nightT = glowT = isNight ? 1 : 0;
    clock0 = performance.now() - (isNight ? DAY : 0);
    applyNight();
    drawCelestial(glowT, performance.now());
    drawBees(performance.now());
  }
  still.addEventListener("change", settleNight);

  // While the hero is off screen nothing animates, but the clock keeps going
  // and the page below still turns to night and back. Reduced motion holds
  // the clock still, so only the button changes the light.
  setInterval(() => {
    if (still.matches) { clock0 += 1000; return; }
    if (!beeRaf) setTheme(clockAt(performance.now()) > 0.5);
  }, 1000);

  // ---------------------------------------------------------------- day / night
  // The moon in the top bar skips ahead to night (and the sun back to day); the
  // clock carries on from there.
  const modeBtn = document.getElementById("mode");
  function showMode() {
    if (!modeBtn) return;
    modeBtn.setAttribute("aria-pressed", isNight);
    modeBtn.setAttribute("aria-label", isNight ? "Day mode" : "Night mode");
  }
  if (modeBtn) {
    showMode();
    modeBtn.addEventListener("click", () => {
      setTheme(!isNight);
      clock0 = performance.now() - (isNight ? DAY : 0);
      lastBuzz = 0;
      if (still.matches || !heroOnScreen || !bees.length) settleNight();
      else wake();
    });
  }

  if (touch) {
    hero.addEventListener("pointermove", (e) => {
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
  // the cloud dodges the intro text, so repaint once the fonts have settled its height
  if (document.fonts) document.fonts.ready.then(() => { lastW = 0; render(); });
  render();

  // ---------------------------------------------------------------- parallax
  // On scroll the sky and cloud sink slower than the hill, and the intro
  // lifts away gently, so the scene reads as layers with depth.
  let ticking = false;
  function parallax() {
    ticking = false;
    const y = still.matches ? 0 : clamp(window.scrollY, 0, hero.offsetHeight);
    skyCanvas.style.transform = `translate3d(0, ${y * 0.45}px, 0)`;
    [skyNight, celest, cloudNight, dusk].forEach((el) => { if (el) el.style.transform = skyCanvas.style.transform; });
    if (intro) {
      intro.style.transform = `translate3d(0, ${y * 0.25}px, 0)`;
      intro.style.opacity = clamp(1 - y / (hero.offsetHeight * 0.6), 0, 1);
    }
    // the foot of the hill melts into the page as it scrolls away
    if (fade) fade.style.opacity = clamp(y / (hero.offsetHeight * 0.45), 0, 1);
  }
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
  }, { passive: true });
  still.addEventListener("change", parallax);
  parallax();

  // ---------------------------------------------------------------- hobby sounds
  // Clicking a hobby tile plays its sound from the start, cutting off any other.
  let playing = null;
  document.querySelectorAll(".tile[data-sound]").forEach((tile) => {
    const sound = new Audio(tile.dataset.sound);
    sound.preload = "auto";
    tile.addEventListener("click", () => {
      if (playing && playing !== sound) playing.pause();
      sound.currentTime = 0;
      sound.play().catch(() => {});
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
