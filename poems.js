// Rohit's poems. Add one by putting an object in POEMS, newest first:
//   { title: "Optional title", date: "2026-11-17", lines: ["first line", "second line", "", "a new stanza"] }
// An empty string in lines leaves a stanza break. The title and date can be left out. Poems are numbered
// in Roman numerals (the oldest is I) and dated the Roman way ("XVII November MMXXVI").
// While POEMS is empty the page shows one honest inscription saying they are on their way.
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
  document.getElementById("dateline").textContent = romanDate(now);
  document.getElementById("art").innerHTML = ENGRAVE.scene();
  const sprig = ENGRAVE.sprig();
  document.getElementById("sprig-foot").innerHTML = sprig;

  // parallax: the plate's layers drift at their own depth as you scroll, and lean a touch toward the
  // cursor on desktop; the arch in front holds still, so you look through it into depth
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const art = document.getElementById("art");
    const title = document.querySelector(".title");
    const DEPTH = { "l-sky": [0.3, 16, 9], "l-shore": [0.17, 11, 6], "l-sea": [0.12, 6, 3], "l-ship": [0.14, 8, 4], "l-front": [0, 0, 0] };
    const layers = [...art.querySelectorAll(".layer")].map((el) => [el, DEPTH[el.classList[1]] || [0, 0, 0]]);
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    let mx = 0, my = 0, tx = 0, ty = 0, raf = 0;
    const frame = () => {
      raf = 0;
      tx += (mx - tx) * 0.08;
      ty += (my - ty) * 0.08;
      const h = art.offsetHeight;
      const sy = Math.min(scrollY, h * 1.2);
      // layers are in plate units; scroll offsets are in px against the plate's own height
      layers.forEach(([el, [k, ax, ay]]) => {
        el.style.transform = `translate3d(${(-tx * ax).toFixed(2)}px, ${(sy * k - ty * ay).toFixed(2)}px, 0)`;
      });
      if (title && getComputedStyle(title).position === "absolute") {
        title.style.transform = `translate3d(${(-tx * 5).toFixed(2)}px, ${(sy * 0.34).toFixed(2)}px, 0)`;
        title.style.opacity = String(Math.max(0, 1 - sy / (h * 0.75)));
      } else if (title) {
        // phones: the title sits above the plate and stays put
        title.style.transform = "";
        title.style.opacity = "";
      }
      if (Math.abs(mx - tx) > 0.001 || Math.abs(my - ty) > 0.001) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", kick);
    if (fine) addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; kick(); }, { passive: true });
    kick();
  }

  const list = document.getElementById("poems");
  if (!POEMS.length) {
    const e = document.createElement("div");
    e.className = "empty";
    e.innerHTML = '<span class="num">I</span><p>The first poems are still drying.</p><p>Come back soon.</p>';
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
