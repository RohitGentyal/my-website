// Project rows: hovering one, the preview window follows the cursor with a soft lag and leans the way you
// move it, settling upright when you stop (style.css, .visit).
(() => {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".w-item").forEach((item) => {
    const pill = item.querySelector(".visit");
    const link = item.querySelector(".w-link");
    if (!pill || !link) return;
    let tx = 0, ty = 0, x = 0, y = 0, tilt = 0, raf = 0, on = false;
    const place = () => {
      pill.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      pill.style.rotate = `${tilt.toFixed(2)}deg`;
    };
    const frame = () => {
      raf = 0;
      const dx = (tx - x) * 0.16;
      x += dx;
      y += (ty - y) * 0.16;
      // leans into the motion (up to 7°), and eases back upright as it catches up
      tilt += (Math.max(-7, Math.min(7, dx * 0.9)) - tilt) * 0.18;
      place();
      if (on && (Math.abs(tx - x) + Math.abs(ty - y) > 0.3 || Math.abs(tilt) > 0.05)) raf = requestAnimationFrame(frame);
    };
    const aim = (e) => {
      const r = item.getBoundingClientRect();
      // a little below and right of the pointer, so it never covers what you're reading; where there
      // isn't room (the right edge, the bottom of the window) it hangs on the other side instead
      const W = pill.offsetWidth || 280, H = pill.offsetHeight || 250;
      const left = e.clientX + 16 + W > innerWidth - 12 ? e.clientX - 16 - W : e.clientX + 16;
      const top = e.clientY + 18 + H > innerHeight - 12 ? e.clientY - 18 - H : e.clientY + 18;
      tx = left - r.left;
      ty = top - r.top;
    };
    link.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      aim(e);
      // it appears where the cursor is, then follows
      x = tx; y = ty; tilt = 0; place();
      on = true;
      item.classList.add("is-hover");
    });
    link.addEventListener("pointermove", (e) => {
      if (!on) return;
      aim(e);
      if (calm) { x = tx; y = ty; place(); return; }
      if (!raf) raf = requestAnimationFrame(frame);
    });
    link.addEventListener("pointerleave", () => { on = false; item.classList.remove("is-hover"); });
  });
})();
