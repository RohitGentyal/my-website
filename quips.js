// The cursor's capsule: one small speech bubble that trails the cursor, its tail at the arrow's tip (style.css, .quip).
// Only on a few things (my ask): the two Work cards (Genzo names the clip on show; Vantyx offers the case study),
// the poems line under the footer, and the
// hobby words (says a click plays a sound; an equalizer while it plays). Plain words, nothing cryptic.
// Touch screens don't get it (no cursor to follow).

// "Email" in the footer copies the address on any device: the word turns to "Copied" for a moment, and
// the bubble (on a mouse) says so too
(() => {
  document.querySelectorAll("[data-copy]").forEach((el) => {
    const label = el.textContent;
    let t = 0;
    el.addEventListener("click", () => {
      const text = el.dataset.copy;
      const done = () => {
        el.textContent = "Copied"; el.dataset.copied = "1";
        el.dispatchEvent(new Event("copied"));
        clearTimeout(t); t = setTimeout(() => { el.textContent = label; }, 1600);
      };
      const fallback = () => {
        const f = document.createElement("textarea");
        f.value = text; f.setAttribute("readonly", ""); f.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(f); f.select();
        let ok = false;
        try { ok = document.execCommand("copy"); } catch (e) {}
        f.remove(); el.focus({ preventScroll: true });
        if (ok) done(); else location.href = "mailto:" + text;
      };
      // the clipboard can wait forever in a window without focus; after half a second copy the old way
      let settled = false;
      const once = (fn) => () => { if (!settled) { settled = true; fn(); } };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(once(done), once(fallback));
        setTimeout(once(fallback), 500);
      } else fallback();
    });
  });
})();

(() => {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // plain words: say what the thing is and what a click does
  const LINES = {
    genzo: {
      home: ["Open Genzo ↗"],
      components: ["See the components in Genzo ↗"],
      icons: ["See the icons in Genzo ↗"],
      calendar: ["See Calendar in Genzo ↗"],
    },
    vantyx: ["Read the case study →"],
    verse: ["Come read my poems"],
    say: {
      email: { fresh: ["Click to copy my email"], done: ["Copied, paste it anywhere"] },
      linkedin: ["Let's connect on LinkedIn"],
      twitter: ["Follow along on Twitter"],
    },
    hob: {
      football: { fresh: ["Hear my goal celebration"], heard: ["Once more?"] },
      barbell: { fresh: ["Hear my gym hype"], heard: ["One more rep?"] },
      game: { fresh: ["Hear my game-night call"], heard: ["Another round?"] },
    },
  };

  // never the same line twice in a row for one element
  const last = new WeakMap();
  const pick = (el, list) => {
    const prev = last.get(el);
    const pool = list.length > 1 ? list.filter((l) => l !== prev) : list;
    const line = pool[Math.floor(Math.random() * pool.length)];
    last.set(el, line);
    return line;
  };

  // ---- the capsule
  const quip = document.createElement("div");
  quip.className = "quip";
  quip.setAttribute("aria-hidden", "true");
  quip.innerHTML = '<span class="quip-pill"><span class="quip-say"></span><span class="quip-eq"><i></i><i></i><i></i><i></i></span></span>';
  document.body.appendChild(quip);
  const pill = quip.firstChild;
  const sayEl = pill.querySelector(".quip-say");

  let host = null, lines = null;
  let mx = 0, my = 0, x = 0, y = 0, raf = 0, placed = false;

  const say = (text) => {
    if (sayEl.textContent === text) return;
    sayEl.textContent = text;
    sayEl.classList.remove("is-new");
    void sayEl.offsetWidth; // restart the roll
    sayEl.classList.add("is-new");
  };

  const frame = () => {
    raf = 0;
    const w = pill.offsetWidth;
    // sits just under the arrow, tail up at its tip; near the right edge the tail moves to the right end
    const left = mx - 14 + w > innerWidth - 12;
    quip.classList.toggle("is-left", left);
    const tx = left ? mx - w + 14 : mx - 14;
    const ty = my + 26;
    if (!placed || calm) { x = tx; y = ty; placed = true; }
    x += (tx - x) * 0.2;
    y += (ty - y) * 0.2;
    quip.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
    if (host && (Math.abs(tx - x) > 0.2 || Math.abs(ty - y) > 0.2)) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  const show = (el, getLines, e) => {
    host = el;
    lines = getLines;
    if (e && e.clientX !== undefined) { mx = e.clientX; my = e.clientY; }
    else { const r = el.getBoundingClientRect(); mx = r.left + 4; my = r.bottom - 8; } // keyboard focus
    placed = quip.classList.contains("is-on") ? placed : false;
    say(pick(el, lines()));
    quip.classList.toggle("is-playing", el.classList.contains("is-playing"));
    quip.classList.add("is-on");
    kick();
  };
  const hide = (el) => {
    if (host !== el) return;
    host = null;
    quip.classList.remove("is-on", "is-playing");
  };
  const refresh = (el) => { if (host === el) say(pick(el, lines())); };

  addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; if (host) kick(); }, { passive: true });
  // scrolling can slide the element out from under a still cursor
  // scrolling slides things out from under a still cursor without the browser updating :hover (the gliding
  // wheel scrolls by script), so check what is really under the cursor now and let the bubble go if it left
  // (2026-11-19: the card's bubble stayed on screen after the card had scrolled away)
  let px = -1, py = -1, sRaf = 0;
  addEventListener("pointermove", (e) => { px = e.clientX; py = e.clientY; }, { passive: true });
  addEventListener("scroll", () => {
    if (!host || sRaf) return;
    sRaf = requestAnimationFrame(() => {
      sRaf = 0;
      if (!host) return;
      const under = px < 0 ? null : document.elementFromPoint(px, py);
      if (!under || !host.contains(under)) hide(host);
    });
  }, { passive: true });

  const wire = (el, getLines) => {
    el.addEventListener("pointerenter", (e) => show(el, getLines, e));
    el.addEventListener("pointerleave", () => hide(el));
    el.addEventListener("focus", () => { if (el.matches(":focus-visible")) show(el, getLines); });
    el.addEventListener("blur", () => hide(el));
  };

  // ---- the Work cards, each found by where it goes (not by order: the first card used to be Genzo, and when
  // Vantyx moved first it showed "Open Genzo", 2026-11-19). Genzo's line follows the screenshot on show.
  const vantyx = document.querySelector('.pcard[href="nexus.html"]');
  if (vantyx) wire(vantyx, () => LINES.vantyx);
  const card = document.querySelector('.pcard[href*="genzoui"]');
  if (card) {
    const shot = () => {
      const on = card.querySelector(".board .shot.on") || card.querySelector(".board .shot");
      return LINES.genzo[on && on.dataset.key] || LINES.genzo.home;
    };
    wire(card, shot);
    new MutationObserver(() => refresh(card)).observe(card.querySelector(".board"), { subtree: true, attributeFilter: ["class"] });
  }

  // ---- "copy my email" in the intro: no bubble (only Work, the poems line and the hobby words have one),
  // but a click still copies the address while the link opens Gmail
  document.querySelectorAll('.intro [data-quip="copy"]').forEach((el) => {
    el.addEventListener("click", () => {
      const mail = el.dataset.email;
      const fallback = () => {
        const f = document.createElement("textarea");
        f.value = mail;
        f.setAttribute("readonly", "");
        f.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(f);
        f.select();
        try { document.execCommand("copy"); } catch (e) {}
        f.remove();
      };
      if (navigator.clipboard) navigator.clipboard.writeText(mail).catch(fallback);
      else fallback();
    });
  });

  // ---- the doors to the poems: the secret line under the footer, and "short poems" in About
  const verse = document.getElementById("verse");
  if (verse) wire(verse, () => LINES.verse);
  // ---- the footer's Say hi links
  document.querySelectorAll(".foot-cols [data-quip]").forEach((a) => {
    const k = a.dataset.quip;
    if (k !== "email") { wire(a, () => LINES.say[k]); return; }
    wire(a, () => LINES.say.email[a.dataset.copied ? "done" : "fresh"]);
    a.addEventListener("copied", () => refresh(a));
  });

  // ---- hobby words: fresh lines until you've played it, then they know; an equalizer while it plays
  document.querySelectorAll(".hob[data-sound]").forEach((w) => {
    const key = /siuuu/.test(w.dataset.sound) ? "football" : /buddy/.test(w.dataset.sound) ? "barbell" : "game";
    let heard = false;
    wire(w, () => LINES.hob[key][heard ? "heard" : "fresh"]);
    w.addEventListener("click", () => { heard = true; });
    // scene.js marks the word while its sound plays
    new MutationObserver(() => {
      if (host !== w) return;
      const on = w.classList.contains("is-playing");
      quip.classList.toggle("is-playing", on);
      if (!on) refresh(w);
    }).observe(w, { attributeFilter: ["class"] });
  });
})();
