// Words preloader, after Skiper UI skiper8 (from dennissnellenberg.com):
// "Hello" in a few languages, then the curtain lifts with a curved lower edge.
(function () {
  const root = document.documentElement;
  const el = document.getElementById("loader");
  if (!el || !root.classList.contains("loading")) return;

  const word = el.querySelector(".loader-word span");
  const path = el.querySelector("path");
  const words = ["Hello", "Bonjour", "Ciao", "Olà", "やあ", "Hallå", "Guten tag", "नमस्ते"];
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function done() {
    root.classList.remove("loading");
    el.hidden = true;
  }

  // the full greeting plays once per visit; a refresh, or coming back from Genzo, gets a quick fade
  let seen = false;
  try { seen = sessionStorage.getItem("greeted") === "1"; sessionStorage.setItem("greeted", "1"); } catch (e) {}
  if (still || seen) {
    el.classList.add("out-fade");
    setTimeout(done, 400);
    return;
  }

  // the first word lingers, the rest flick past
  let i = 0;
  word.textContent = words[0];
  el.classList.add("on");
  function next() {
    i++;
    if (i >= words.length) return setTimeout(lift, 260);
    word.textContent = words[i];
    setTimeout(next, 150);
  }
  setTimeout(next, 1000);

  // curve sags 300px below the panel, then flattens as it rises
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function shape(sag) {
    const w = innerWidth;
    path.setAttribute("d", `M0 0 L${w} 0 L${w} 1 Q${w / 2} ${1 + sag} 0 1 Z`);
  }
  function lift() {
    el.classList.add("out");
    root.classList.remove("loading");
    const h = innerHeight;
    const dur = 900;
    const t0 = performance.now();
    shape(300);
    (function frame(now) {
      const t = Math.min(1, (now - t0) / dur);
      const e = ease(t);
      el.style.transform = `translateY(${-e * (h + 320)}px)`;
      shape(300 * (1 - Math.min(1, e * 1.25)));
      if (t < 1) requestAnimationFrame(frame);
      else done();
    })(t0);
  }
})();
