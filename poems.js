// Rohit's poems. Add one by putting an object in POEMS, newest first:
//   { slug: "mansion", title: "Mansion", cover: "doors", art: [one image name or null per stanza],
//     lines: ["first line", "second line", "", "a new stanza"] }
// poems.html shows every poem as a card (its cover, its title, its first line); a click opens it on
// poem.html#<slug>, where it opens on its title and its art walks behind it. Images live in
// assets/poems/<slug>/. An empty string in lines leaves a stanza break. No numbers; a `date` is optional
// and shows the Roman way ("XVII November MMXXVI").
// While POEMS is empty the page says so, plainly: "Nothing here yet. Some things take longer to say."
// The hero above them is three image layers in assets/poems; the laurel sprigs come from poems-art.js.
const POEMS = [
  {
    slug: "garden",
    title: "Garden",
    // the picture on its card: the garden in full bloom, every flower, every person
    cover: "colosseum",
    // a walk through the garden behind the words (assets/poems/garden): I the garden overflowing,
    // II the cut-back arches, III bare paper (the garden dying, the prayer), IV the arches again, gate open
    art: ["colosseum", "arches", null, "arches"],
    lines: [
    "There is a garden outside my house",
    "that I keep forgetting is mine.",
    "Things grow there without asking me,",
    "old wishes, half-finished prayers,",
    "names I haven’t said in years,",
    "little pieces of people I thought I’d forgotten.",
    "Some mornings I want to fill it with everything.",
    "Every flower. Every color. Every person.",
    "I want to give someone a place here,",
    "not just a bench to sit on,",
    "but a tree with their name underneath it,",
    "somewhere they can come back to",
    "without having to knock.",
    "And then I remember",
    "how quickly things grow roots,",
    "how difficult it is to move something",
    "once you’ve decided it belongs to you.",
    "",
    "So I cut things back.",
    "Not because I don’t like the flowers.",
    "Because I like them too much.",
    "I tell myself I’m keeping the garden manageable.",
    "I leave certain corners untouched.",
    "I let some things bloom only halfway.",
    "There are days I want to pick every flower",
    "and make a life out of all of it.",
    "There are days I don’t even want to look.",
    "I can stand in the same garden",
    "and somehow feel both,",
    "I deserve all of this,",
    "and what makes you think any of it is for you?",
    "Neither thought sounds strange anymore.",
    "They’ve both been here long enough",
    "to know where I keep the water.",
    "",
    "Sometimes I wonder if I only pray",
    "when the garden is dying.",
    "I don’t visit God when the roses are doing well.",
    "I remember Him when something bends,",
    "when something doesn’t bloom,",
    "when I need rain immediately.",
    "And I hate that about myself.",
    "I wouldn’t want someone to love me like that,",
    "to come only when the soil is dry,",
    "to leave when everything starts growing again.",
    "Maybe that’s why I hesitate",
    "when someone comes close.",
    "I want to give them everything I have grown.",
    "I want to say,",
    "take it, it’s yours, I kept it alive for you.",
    "But somewhere behind me",
    "there is always a voice asking",
    "what happens when they take the flowers",
    "and don’t stay for the garden.",
    "",
    "Still, I keep planting.",
    "That’s the part I don’t understand.",
    "After every season,",
    "after every thing I swore I wouldn’t grow again,",
    "I find my hands in the soil.",
    "Slower now.",
    "Not happier, exactly.",
    "Just less afraid of the quiet.",
    "Maybe the garden was never supposed to give me everything.",
    "Maybe it was only supposed to teach me",
    "that wanting is not the same as needing,",
    "that losing one flower doesn’t mean the ground failed,",
    "that letting something grow beside you",
    "doesn’t mean it has to belong to you forever.",
    "So I leave the gate unlocked tonight.",
    "Not because I’m expecting anyone.",
    "Just because I don’t want to spend another season",
    "standing inside,",
    "watching the garden through the window,",
    "telling myself it would have been beautiful",
    "if I had only let myself live in it.",
    ],
  },
  {
    slug: "mansion",
    title: "Mansion",
    // the picture on its card: the first room of the house
    cover: "doors",
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
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reading = document.body.dataset.view === "read";
  const list = document.getElementById("poems");

  if (!reading) gate();
  if (!POEMS.length) {
    const e = document.createElement("div");
    e.className = "empty";
    e.innerHTML = "<p>Nothing here yet.</p><p>Some things take longer to say.</p>";
    list.appendChild(e);
    return;
  }
  if (reading) read(); else cards();

  // ---- poems.html: a list of poems, one row each, ruled with hairlines like a book's contents page: a
  // small framed thumbnail of its cover, its title, its first line, how long it takes to read. Hover: the
  // row warms, the arrow slips out, and a small "✦ READ ✦" tag in Roman capitals trails the cursor (fine pointers)
  function cards() {
    list.classList.add("index");
    let peek = null, px = 0, py = 0, tx = 0, ty = 0, pr = 0;
    if (fine) {
      peek = document.createElement("div");
      peek.className = "peek";
      peek.setAttribute("aria-hidden", "true");
      // a small tag in Roman capitals, not a picture (2026-11-17, my ask)
      peek.innerHTML = "<span><i>✦</i>Read<i>✦</i></span>";
      document.body.appendChild(peek);
    }
    // the print trails the cursor with a soft lag
    const trail = () => {
      pr = 0;
      tx += (px - tx) * (calm ? 1 : 0.18);
      ty += (py - ty) * (calm ? 1 : 0.18);
      peek.style.translate = `${tx.toFixed(1)}px ${ty.toFixed(1)}px`;
      if (Math.abs(px - tx) > 0.3 || Math.abs(py - ty) > 0.3) pr = requestAnimationFrame(trail);
    };
    POEMS.forEach((poem) => {
      const a = document.createElement("a");
      a.className = "row";
      a.href = `poem.html#${poem.slug}`;
      const words = poem.lines.join(" ").split(/\s+/).filter(Boolean).length;
      const mins = Math.max(1, Math.round(words / 180));
      const first = poem.lines.find((l) => l.trim()) || "";
      const cover = poem.cover ? `assets/poems/${poem.slug}/${poem.cover}.webp` : "";
      a.innerHTML = `
        <span class="thumb">${cover ? `<img src="${cover}" alt="" loading="lazy" decoding="async" style="view-transition-name: cover-${poem.slug}">` : ""}</span>
        <span class="text"><span class="name">${poem.title}</span><span class="first">${first}</span></span>
        <span class="kind">${roman(mins)} min<span class="arrow" aria-hidden="true">↗</span></span>`;
      a.setAttribute("aria-label", `${poem.title}. Read the poem, about ${mins} minute${mins > 1 ? "s" : ""}.`);
      if (peek) {
        a.addEventListener("pointerenter", (e) => {
          px = tx = e.clientX; py = ty = e.clientY;
          peek.style.translate = `${tx}px ${ty}px`;
          peek.classList.add("on");
        });
        a.addEventListener("pointermove", (e) => { px = e.clientX; py = e.clientY; if (!pr) pr = requestAnimationFrame(trail); });
        a.addEventListener("pointerleave", () => peek.classList.remove("on"));
      }
      list.appendChild(a);
    });
    addEventListener("scroll", () => peek && peek.classList.remove("on"), { passive: true });
  }

  // ---- poem.html#<slug>: one poem, opening on its title, its art walking behind it
  function read() {
    const poem = POEMS.find((p) => p.slug === location.hash.slice(1)) || POEMS[0];
    document.title = `${poem.title} — Rohit`;
    render(poem);
    journey(poem);
  }

  function render(poem) {
    const a = document.createElement("article");
    a.className = "poem";
    // a poem dries in a part at a time (its head, each stanza, its date), each as it comes into view, so a
    // long poem never waits on lines far below the screen
    const put = (box, el, i) => { el.style.setProperty("--i", i); box.appendChild(el); return el; };
    const part = (tag, cls) => { const d = document.createElement(tag); d.className = "dry " + cls; return d; };

    // the poem opens as its own section, set like the hero's poster: a laurel sprig, the title between
    // two hairlines with ✦, and no number
    const head = part("header", "poem-head");
    const rule = () => { const r = document.createElement("div"); r.className = "rule"; r.setAttribute("aria-hidden", "true"); r.innerHTML = "<i>✦</i><i>✦</i>"; return r; };
    const leaf = document.createElement("div");
    leaf.className = "head-sprig";
    leaf.innerHTML = sprig;
    put(head, leaf, 0);
    put(head, rule(), 1);
    const h = document.createElement("h1");
    h.textContent = poem.title;
    put(head, h, 2);
    put(head, rule(), 3);
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

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -12% 0px" });
    list.querySelectorAll(".dry").forEach((p) => io.observe(p));
  }

  // ---- the journey: behind a poem with `art`, each stanza has a faded artwork printed into the paper.
  // It surfaces as its stanza comes up, is fullest while it is read, and sinks away as the next arrives,
  // so the reader walks room to room. Each drifts slower than the page and slowly pushes in (walking
  // forward). Only opacity and transform move; the eased values glide after the scroll like the hero.
  function journey(poem) {
    if (!poem.art) return;
    const rooms = [];
    const stanzas = list.querySelectorAll(".stanza");
    // the first room already shows behind the poem's opening, so the walk starts at its title
    const opening = list.querySelector(".poem-head");
    poem.art.forEach((name, n) => { if (name && stanzas[n]) rooms.push({ name, el: stanzas[n], from: n === 0 ? opening : stanzas[n] }); });
    if (!rooms.length) return;
    const layer = document.createElement("div");
    layer.className = "journey";
    layer.setAttribute("aria-hidden", "true");
    rooms.forEach((r, n) => {
      const img = document.createElement("img");
      img.src = `assets/poems/${poem.slug}/${r.name}.webp`;
      img.alt = "";
      img.decoding = "async";
      if (n) img.fetchPriority = "low";
      img.className = "room room-" + r.name;
      // the card's picture grows into this one when the poem is opened (a view transition)
      if (r.name === poem.cover) img.style.viewTransitionName = `cover-${poem.slug}`;
      layer.appendChild(img);
      r.img = img;
      r.o = -1; r.p = 0;
    });
    document.body.prepend(layer);
    const ease = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
    let jr = 0;
    const step = () => {
      jr = 0;
      const vh = innerHeight;
      let moving = false;
      rooms.forEach((r) => {
        // its stretch of the page: from where it starts (a stanza, or the poem's opening) to its stanza's end
        const top = r.from.getBoundingClientRect().top, bottom = r.el.getBoundingClientRect().bottom;
        // in as that top climbs from 95% to 50% of the screen; out as its end leaves the top 40%
        const o = Math.min(ease((vh * 0.95 - top) / (vh * 0.45)), ease((bottom - vh * 0.05) / (vh * 0.4)));
        // where it is on its way past: 0 entering below, 1 gone above
        const p = Math.min(1, Math.max(0, (vh - top) / (vh + bottom - top)));
        // the first frame lands where it should be, so the opening is never bare
        const k = calm ? 1 : 0.08;
        if (r.o < 0) { r.o = o; r.p = p; }
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
    step();
  }

  // ---- poems.html, the gate: its three image layers move in a smooth, eased parallax
  function gate() {
    const gate = document.getElementById("gate");
    const poster = document.getElementById("poster");
    // each layer: how much of the scroll it follows (far things more, so they seem to lag behind), and how
    // far it leans toward the cursor; the near flowers rise faster than the page
    const DEPTH = { "g-sky": [0.42, 12, 6], "g-front": [0.08, 26, 8], "g-near": [-0.18, 40, 12] };
    let cur = scrollY, mx = 0, my = 0, tx = 0, ty = 0, raf = 0, away = false;
    // measured once (and on resize), and the layers looked up once, so a frame only writes transforms
    let H = gate.offsetHeight;
    addEventListener("resize", () => { H = gate.offsetHeight; }, { passive: true });
    const layers = [...gate.querySelectorAll(".gl")].map((c) => [c, DEPTH[c.classList[1]]]).filter((l) => l[1]);
    function frame() {
      raf = 0;
      const target = Math.min(scrollY, H * 1.1);
      // ease toward where the page is: the scene glides after the scroll instead of snapping to it
      cur += (target - cur) * (calm ? 1 : 0.09);
      tx += (mx - tx) * 0.06;
      ty += (my - ty) * 0.06;
      if (!calm) {
        layers.forEach(([c, d]) => {
          c.style.transform = `translate3d(${(-tx * d[1]).toFixed(2)}px, ${(cur * d[0] - ty * d[2]).toFixed(2)}px, 0)`;
        });
        poster.style.transform = `translate3d(${(-tx * 8).toFixed(2)}px, ${(cur * 0.32).toFixed(2)}px, 0)`;
        poster.style.opacity = String(Math.max(0, 1 - cur / (H * 0.6)).toFixed(3));
      }
      if (Math.abs(target - cur) > 0.2 || Math.abs(mx - tx) > 0.001 || Math.abs(my - ty) > 0.001) raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    addEventListener("scroll", () => { if (!away || scrollY < H * 1.2) kick(); }, { passive: true });
    if (fine && !calm) addEventListener("pointermove", (e) => {
      if (away) return;
      mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; kick();
    }, { passive: true });
    new IntersectionObserver(([e]) => { away = !e.isIntersecting; gate.classList.toggle("is-away", away); }).observe(gate);
    kick();
  }
})();
