// Rohit's poems. Add one by putting an object in POEMS, newest first:
//   { title: "Optional title", date: "2026-11-17" (optional), art: [one image name or null per stanza], lines: ["first line", "second line", "", "a new stanza"] }
// An empty string in lines leaves a stanza break. The title and date can be left out. Poems are numbered
// in Roman numerals (the oldest is I) and dated the Roman way ("XVII November MMXXVI").
// While POEMS is empty the page says so, plainly: "Nothing here yet. Some things take longer to say."
// The hero above them is three image layers in assets/poems; the laurel sprigs come from poems-art.js.
const POEMS = [
  {
    title: "Mansion",
    // the last line leaves a lamp on: a warm light comes up behind it once it has dried in
    light: true,
    // a walk through the house behind the words, one faded artwork per stanza (assets/poems/mansion);
    // null leaves that stanza on bare paper (the room with no windows)
    art: ["doors", "gallery", null, "icarus", "lamp"],
    lines: [
    "I think there is a house inside me.",
    "Not a metaphor I chose,",
    "just something I noticed after spending too much time",
    "walking through the same rooms",
    "and calling them different names.",
    "There is a room for the things I want,",
    "another for the things I think I am allowed to want,",
    "and somehow they never seem to be the same room.",
    "I move between them quietly,",
    "like I am visiting someone who might wake up.",
    "Sometimes I find myself holding the handle of a door",
    "for a long time,",
    "not opening it,",
    "not leaving either.",
    "",
    "There are people in this house",
    "who don’t know they live here.",
    "A laugh I remember at the wrong hour.",
    "A voice I can still hear saying my name.",
    "Someone’s shoulder beside mine.",
    "A conversation that meant nothing at the time",
    "and somehow became furniture.",
    "I keep these things.",
    "I don’t know why.",
    "Maybe because some people leave so naturally",
    "that you only realize they were important",
    "when you find their absence",
    "has taken up an entire room.",
    "I have wanted to tell people,",
    "stay, I’ve made space for you,",
    "but the words always sound larger",
    "once they leave the mouth.",
    "So I say something smaller.",
    "Something ordinary.",
    "Something that can survive",
    "if they decide to go.",
    "",
    "There is also a room I built myself.",
    "No windows.",
    "One chair.",
    "A lock on the inside.",
    "I go there when everything outside",
    "starts asking too many questions.",
    "It is quiet in there.",
    "Almost comforting.",
    "I can become detached without having to explain it.",
    "I can want someone badly",
    "and still convince myself I never needed them.",
    "I can look at love and calculate",
    "how much of myself I would have to lose",
    "before it became dangerous.",
    "Sometimes I think I deserve everything.",
    "Sometimes I can’t understand",
    "why anything would choose me.",
    "Both thoughts can live in the same room.",
    "That’s the strange part.",
    "Neither one has to win.",
    "",
    "And then there is the room I avoid most.",
    "The one where I keep God.",
    "I only seem to remember the door",
    "when I need something.",
    "A little help.",
    "A little mercy.",
    "A reason for something to make sense.",
    "Then I wonder if I have become",
    "the kind of person I would resent,",
    "someone who knocks only when they need warmth.",
    "Maybe that’s why I understand leaving.",
    "Maybe that’s why I fear being needed",
    "more than I fear being alone.",
    "I want to love people enough",
    "to keep every version of them,",
    "the beautiful parts,",
    "the difficult parts,",
    "the parts they hide when nobody is looking.",
    "I want to say, you’re mine,",
    "not like possession,",
    "more like there is a place for you here.",
    "And still,",
    "there is no one standing outside my door",
    "saying the same thing to me.",
    "",
    "So I walk the halls.",
    "I straighten things that were never out of place.",
    "I repaint walls that were only dirty because I kept touching them.",
    "I tell myself this is what growing up looks like.",
    "That everyone has rooms like these.",
    "That everyone locks something away.",
    "That wanting less is easier",
    "and needing less is safer",
    "and maybe safety is enough.",
    "Then, somewhere between sleep and morning,",
    "I hear the front door in my head.",
    "For a second,",
    "I think someone has come home.",
    "I don’t check.",
    "I already know there is no one there.",
    "Still, I leave the light on.",
    ],
  },
];

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
  // the seal at the top: its ring reads the name, the page and the year, round and round
  document.getElementById("seal").innerHTML = ENGRAVE.seal(`ROHIT · POEMS · ${roman(now.getFullYear())} · `);
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
    // a poem dries in a part at a time (its head, each stanza, its date), each as it comes into view, so a
    // long poem never waits on lines far below the screen
    const put = (box, el, i) => { el.style.setProperty("--i", i); box.appendChild(el); return el; };
    const part = (tag, cls) => { const d = document.createElement(tag); d.className = "dry " + cls; return d; };

    const head = part("header", "poem-head");
    const num = document.createElement("span");
    num.className = "num";
    num.textContent = roman(POEMS.length - k);
    put(head, num, 0);
    if (poem.title) {
      const h = document.createElement("h2");
      h.textContent = poem.title;
      put(head, h, 1);
    }
    a.appendChild(head);

    // stanzas, split at the empty lines
    const stanzas = [[]];
    poem.lines.forEach((l) => {
      if (l.trim()) stanzas[stanzas.length - 1].push(l);
      else if (stanzas[stanzas.length - 1].length) stanzas.push([]);
    });
    const body = document.createElement("div");
    body.className = "lines";
    stanzas.forEach((st, n) => {
      const box = part("p", "stanza");
      st.forEach((l, i) => {
        const s = document.createElement("span");
        s.textContent = l;
        if (poem.light && n === stanzas.length - 1 && i === st.length - 1) s.className = "light";
        put(box, s, i);
      });
      body.appendChild(box);
    });
    a.appendChild(body);

    if (poem.date) {
      const end = part("footer", "poem-end");
      const t = document.createElement("time");
      t.dateTime = poem.date;
      t.textContent = romanDate(new Date(poem.date + "T00:00:00"));
      put(end, t, 0);
      a.appendChild(end);
    }
    list.appendChild(a);
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -12% 0px" });
  list.querySelectorAll(".dry").forEach((p) => io.observe(p));

  // ---- the journey: behind a poem with `art`, each stanza has a faded artwork printed into the paper.
  // It surfaces as its stanza comes up, is fullest while it is read, and sinks away as the next arrives,
  // so the reader walks room to room. Each drifts slower than the page and slowly pushes in (walking
  // forward). Only opacity and transform move; the eased values glide after the scroll like the hero.
  const rooms = [];
  POEMS.forEach((poem, k) => {
    if (!poem.art) return;
    const stanzas = list.querySelectorAll(".poem")[k].querySelectorAll(".stanza");
    poem.art.forEach((name, n) => { if (name && stanzas[n]) rooms.push({ name, el: stanzas[n] }); });
  });
  if (rooms.length) {
    const layer = document.createElement("div");
    layer.className = "journey";
    layer.setAttribute("aria-hidden", "true");
    rooms.forEach((r) => {
      const img = document.createElement("img");
      img.src = `assets/poems/mansion/${r.name}.webp`;
      img.alt = "";
      img.decoding = "async";
      img.fetchPriority = "low";
      img.className = "room room-" + r.name;
      layer.appendChild(img);
      r.img = img;
      r.o = 0; r.p = 0;
    });
    document.body.prepend(layer);
    const ease = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
    let jr = 0;
    const step = () => {
      jr = 0;
      const vh = innerHeight;
      let moving = false;
      rooms.forEach((r) => {
        const b = r.el.getBoundingClientRect();
        // in as the stanza's top climbs from 95% to 50% of the screen; out as its end leaves the top 40%
        const o = Math.min(ease((vh * 0.95 - b.top) / (vh * 0.45)), ease((b.bottom - vh * 0.05) / (vh * 0.4)));
        // where it is on its way past: 0 entering below, 1 gone above
        const p = Math.min(1, Math.max(0, (vh - b.top) / (vh + b.height)));
        const k = calm ? 1 : 0.08;
        r.o += (o - r.o) * k;
        r.p += (p - r.p) * k;
        if (Math.abs(o - r.o) > 0.002 || Math.abs(p - r.p) > 0.0005) moving = true;
        if (r.peak == null) r.peak = parseFloat(getComputedStyle(r.img).getPropertyValue("--peak")) || 0.3;
        r.img.style.opacity = (r.o * r.peak).toFixed(3);
        r.img.style.visibility = r.o < 0.004 ? "hidden" : "visible";
        if (!calm) r.img.style.transform = `translate3d(0, ${((0.5 - r.p) * 7).toFixed(2)}vh, 0) scale(${(1.12 - r.p * 0.08).toFixed(4)})`;
      });
      if (moving) jr = requestAnimationFrame(step);
    };
    const go = () => { if (!jr) jr = requestAnimationFrame(step); };
    addEventListener("scroll", go, { passive: true });
    addEventListener("resize", go);
    go();
  }
})();
