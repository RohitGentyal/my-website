// Project boards: the screenshots take turns while the board is on screen, crossfading every 3.2s; the
// dots under them show which one is up (style.css, .board). Reduced motion keeps the first one.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll(".board[data-cycle]").forEach((board) => {
    const shots = [...board.querySelectorAll("img")];
    const dots = [...board.querySelectorAll(".dots i")];
    if (shots.length < 2) return;
    let i = 0, timer = 0;
    const show = (n) => {
      shots[i].classList.remove("on"); dots[i] && dots[i].classList.remove("on");
      i = n;
      shots[i].classList.add("on"); dots[i] && dots[i].classList.add("on");
    };
    const start = () => { if (!timer) timer = setInterval(() => show((i + 1) % shots.length), 3200); };
    const stop = () => { clearInterval(timer); timer = 0; };
    // the next shots start loading only once the board is near the screen
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { shots.forEach((s) => (s.loading = "eager")); start(); } else stop();
    }, { rootMargin: "200px 0px" }).observe(board);
  });
})();
