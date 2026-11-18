// Below the hero nothing drifts on scroll (2026-11-19, my ask). Each block appears once as it comes into
// view instead: it rises a few pixels, fades in and sharpens from a soft blur, the way the rest of the
// site develops into place. Items that arrive together come in a beat apart. Opacity, translate and
// filter only, once per element. Off with reduced motion; without JavaScript everything simply shows.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  const $ = (s) => [...document.querySelectorAll(s)];
  const [svcHead, expHead] = $("#about h2.sub");
  // [the items that come in together, how far apart (ms)]
  const groups = [
    [$("#work h2, #work .pcard"), 90],
    [$("#about > h2:not(.sub), #about > p"), 80],
    [[svcHead, ...$(".svc li")], 45],
    [$(".svc-ways"), 0],
    [[expHead, ...$(".exp > div")], 90],
  ];
  const all = [];
  groups.forEach(([els, gap]) => {
    els.filter(Boolean).forEach((el, i) => {
      el.classList.add("rv");
      el.style.setProperty("--rv-delay", `${i * gap}ms`);
      all.push(el);
    });
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("rv-in");
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  all.forEach((el) => io.observe(el));
})();
