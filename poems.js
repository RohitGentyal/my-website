// Rohit's poems. Add one by putting an object in POEMS, newest first:
//   { title: "Optional title", date: "2026-11-17", lines: ["first line", "second line", "", "a new stanza"] }
// An empty string in lines leaves a stanza break. The title and date can be left out. Poems are numbered
// in Roman numerals (the oldest is I) and dated the Roman way ("XVII November MMXXVI").
// While POEMS is empty the page says so, plainly: "Nothing here yet. Some things take longer to say."
// The hero above them is three image layers in assets/poems; the laurel sprigs come from poems-art.js.
const POEMS = [];

(() => {
  const roman = (n) => {
    const m = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let s = "";
    for (const [v, r] of m) while (n >= v) { s += r; n -= v; }
    return s;
  };
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const romanDate = (d) => `${roman(d.getDate())} ${MONTHS[d.getMonth()]} ${roman(d.getFullYear())}`;

  const now = new Date();
  document.getElementById("yr").textContent = roman(now.getFullYear());
  document.getElementById("year-top").textContent = roman(now.getFullYear());
  const sprig = ENGRAVE.sprig();
  document.getElementById("sprig-foot").innerHTML = sprig;

  // ---- the gate: its three image layers move in a smooth, eased parallax
  const gate = document.getElementById("gate");
  const poster = document.getElementById("poster");
  // each layer: how much of the scroll it follows (far things more, so they seem to lag behind), and how
  // far it leans toward the cursor; the near flowers rise faster than the page
  const DEPTH = { "g-sky": [0.42, 12, 6], "g-front": [0.08, 26, 8], "g-near": [-0.18, 40, 12] };
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  let cur = scrollY, mx = 0, my = 0, tx = 0, ty = 0, raf = 0, away = false;
  function frame() {
    raf = 0;
    const H = gate.offsetHeight;
    const target = Math.min(scrollY, H * 1.1);
    // ease toward where the page is: the scene glides after the scroll instead of snapping to it
    cur += (target - cur) * (calm ? 1 : 0.09);
    tx += (mx - tx) * 0.06;
    ty += (my - ty) * 0.06;
    if (!calm) {
      gate.querySelectorAll(".gl").forEach((c) => {
        const d = DEPTH[c.classList[1]];
        if (d) c.style.transform = `translate3d(${(-tx * d[1]).toFixed(2)}px, ${(cur * d[0] - ty * d[2]).toFixed(2)}px, 0)`;
      });
      poster.style.transform = `translate3d(${(-tx * 8).toFixed(2)}px, ${(cur * 0.32).toFixed(2)}px, 0)`;
      poster.style.opacity = String(Math.max(0, 1 - cur / (H * 0.6)).toFixed(3));
    }
    if (Math.abs(target - cur) > 0.2 || Math.abs(mx - tx) > 0.001 || Math.abs(my - ty) > 0.001) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener("scroll", () => { if (!away || scrollY < gate.offsetHeight * 1.2) kick(); }, { passive: true });
  if (fine && !calm) addEventListener("pointermove", (e) => {
    if (away) return;
    mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; kick();
  }, { passive: true });
  // the dove and butterflies rest while the gate is off screen
  new IntersectionObserver(([e]) => { away = !e.isIntersecting; gate.classList.toggle("is-away", away); }).observe(gate);
  kick();

  const list = document.getElementById("poems");
  if (!POEMS.length) {
    const e = document.createElement("div");
    e.className = "empty";
    e.innerHTML = '<span class="num">I</span><p>Nothing here yet.</p><p>Some things take longer to say.</p>';
    list.appendChild(e);
    return;
  }

  POEMS.forEach((poem, k) => {
    if (k > 0) {
      const s = document.createElement("div");
      s.className = "sprig";
      s.innerHTML = sprig;
      list.appendChild(s);
    }
    const a = document.createElement("article");
    a.className = "poem";
    let i = 0;
    const add = (el) => { el.style.setProperty("--i", i++); a.appendChild(el); return el; };
    const num = document.createElement("span");
    num.className = "num";
    num.textContent = roman(POEMS.length - k);
    add(num);
    if (poem.title) {
      const h = document.createElement("h2");
      h.textContent = poem.title;
      add(h);
    }
    const lines = document.createElement("p");
    lines.className = "lines";
    poem.lines.forEach((l) => {
      const s = document.createElement("span");
      if (l.trim()) s.textContent = l; else s.className = "gap";
      s.style.setProperty("--i", i++);
      lines.appendChild(s);
    });
    a.appendChild(lines);
    if (poem.date) {
      const t = document.createElement("time");
      t.dateTime = poem.date;
      t.textContent = romanDate(new Date(poem.date + "T00:00:00"));
      add(t);
    }
    list.appendChild(a);
  });

  // each poem's lines dry in as it comes into view
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -15% 0px" });
  list.querySelectorAll(".poem").forEach((p) => io.observe(p));
})();
