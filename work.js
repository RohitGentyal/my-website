// Project boards: short clips of single components take turns while the board is on screen. Each clip
// plays once, then the next one crossfades in; the dots under them show which one is up (style.css, .board).
// Clips load only once the board is near the screen. Reduced motion shows the first clip's opening frame.
(() => {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".board[data-cycle]").forEach((board) => {
    const shots = [...board.querySelectorAll(".shot")];
    const dots = [...board.querySelectorAll(".dots i")];
    if (!shots.length) return;
    let i = 0, live = false;
    const play = () => { const v = shots[i]; v.currentTime = 0; const p = v.play(); if (p) p.catch(() => {}); };
    const show = (n) => {
      shots[i].classList.remove("on"); dots[i] && dots[i].classList.remove("on");
      shots[i].pause();
      i = n;
      shots[i].classList.add("on"); dots[i] && dots[i].classList.add("on");
      if (live) play();
    };
    shots.forEach((v) => v.addEventListener("ended", () => show((i + 1) % shots.length)));
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        shots.forEach((v) => { if (v.preload !== "auto") { v.preload = "auto"; v.load(); } });
        if (calm) return;
        live = true; play();
      } else { live = false; shots[i].pause(); }
    }, { rootMargin: "200px 0px" }).observe(board);
  });
})();
