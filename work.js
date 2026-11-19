// Project boards: the screenshots take turns while the board is on screen, crossfading every 3.2s; the
// dots under them show which one is up (style.css, .board). Reduced motion keeps the first one.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll(".board[data-cycle]").forEach((board) => {
    const shots = [...board.querySelectorAll(".shot")];
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
    // only the first shot loads with the page; the rest (data-src) are fetched once the board is on screen,
    // since they only show 3.2s later (2026-11-19: all seven loaded at the top, 75% of the first load)
    const fetchRest = () => shots.forEach((s) => { if (s.dataset.src) { s.src = s.dataset.src; delete s.dataset.src; } });
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { fetchRest(); start(); } else stop();
    }, { threshold: 0.1 }).observe(board);
  });
})();
