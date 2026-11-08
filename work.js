// Project rows: hovering one, the "Visit" pill follows the cursor with a soft lag (style.css, .visit).
(() => {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".w-item").forEach((item) => {
    const pill = item.querySelector(".visit");
    const link = item.querySelector(".w-link");
    if (!pill || !link) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0, on = false;
    const place = () => { pill.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`; };
    const frame = () => {
      raf = 0;
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      place();
      if (on && Math.abs(tx - x) + Math.abs(ty - y) > 0.3) raf = requestAnimationFrame(frame);
    };
    const aim = (e) => {
      const r = item.getBoundingClientRect();
      // a little below and right of the pointer, so it never covers what you're reading
      tx = e.clientX - r.left + 16;
      ty = e.clientY - r.top + 18;
    };
    link.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      aim(e);
      // it appears where the cursor is, then follows
      x = tx; y = ty; place();
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
