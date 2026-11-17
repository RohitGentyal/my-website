// Rohit's poems. Add one by putting an object in POEMS, newest first:
//   { title: "Optional title", date: "2026-11-17", lines: ["first line", "second line", "", "a new stanza"] }
// An empty string in lines leaves a stanza break. The title and date can be left out.
// While POEMS is empty the page shows one honest line saying they are on their way.
const POEMS = [];

(() => {
  document.getElementById("yr").textContent = new Date().getFullYear();
  const list = document.getElementById("poems");
  const opening = document.querySelector(".opening");
  opening.querySelector("h1").classList.add("develop");
  opening.querySelector(".sub").classList.add("develop", "d2");

  if (!POEMS.length) {
    const p = document.createElement("p");
    p.className = "empty develop d3";
    p.textContent = "The first poems are still drying. Come back soon.";
    list.appendChild(p);
    return;
  }

  const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  POEMS.forEach((poem) => {
    const a = document.createElement("article");
    a.className = "poem";
    let i = 0;
    if (poem.title) {
      const h = document.createElement("h2");
      h.textContent = poem.title;
      h.style.setProperty("--i", i++);
      a.appendChild(h);
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
      t.textContent = fmt(poem.date);
      t.style.setProperty("--i", i++);
      a.appendChild(t);
    }
    list.appendChild(a);
  });

  // each poem's lines dry in as it comes into view
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -15% 0px" });
  list.querySelectorAll(".poem").forEach((p) => io.observe(p));
})();
