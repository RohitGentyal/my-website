// The cursor's capsule. Over anything clickable (the intro's links, the Genzo card, the hobby words,
// Email, LinkedIn) one small speech bubble trails the cursor, its tail at the arrow's tip, and says
// something picked for the moment (style.css, .quip). It trails a little and never tilts:
// - the Genzo card speaks about whichever screenshot is up, and changes with it while you hover;
// - Email reads the visitor's own clock; "copy my email" knows once it has copied;
// - the hobby words change once you've heard them, and show an equalizer while their sound plays;
// - a line never repeats the one shown just before it, so each hover says something new.
// Touch screens don't get it (no cursor to follow).
(() => {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const LINES = {
    genzo: {
      home: ["every element moves. go see", "free, even for client work"],
      components: ["8 components, 0 invoices", "hover them, they flinch"],
      icons: ["356 icons, 162 of them dance", "icons that answer back"],
      calendar: ["pick a date, any date", "Diwali's in there. tap it"],
    },
    email: {
      morning: ["first email of the day?", "morning hi > evening hi"],
      day: ["say hi, I'm nice", "lunch-break email? bold"],
      evening: ["evening mail hits different", "no meeting, just a hi"],
      night: ["night owl? same", "I'll reply after sleeping"],
    },
    linkedin: ["connect, don't lurk", "endorse me for vibes", "less posting, more design", "we'd make a strong tie"],
    x: ["mostly design, some memes", "follow for pixels", "I post when it moves"],
    about: ["it's just below", "spoiler: football"],
    stack: {
      figma: ["Figma, where it all starts", "Figma, my second home"],
      ai: ["AI: Claude, ChatGPT, Gemini", "AI, for the 2 a.m. ideas", "AI, my thinking partner"],
      html5: ["HTML, CSS & JS: this site, by hand", "HTML, CSS & JS, no framework"],
      react: ["React, when it needs to be real", "React, components all the way"],
      framer: ["Framer, sites that ship fast", "Framer, for motion that publishes"],
    },
    verse: ["there’s an open sky past this", "the softer side", "lights low, this way"],
    poemDoor: ["they live under an open sky", "come and read a few", "the quiet side of me"],
    copy: { fresh: ["one click, it's yours", "no typing, promise"], done: ["copied. paste away", "it's in your clipboard"] },
    hob: {
      football: { fresh: ["kick it", "goal?", "on the pitch"], heard: ["again? fine", "encore"] },
      barbell: { fresh: ["lift it", "spot me?", "light weight"], heard: ["one more rep", "no pain"] },
      game: { fresh: ["press start", "insert coin", "player 2?"], heard: ["continue? 9… 8…", "new high score"] },
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
  addEventListener("scroll", () => { if (host && !host.matches(":hover")) hide(host); }, { passive: true });

  const wire = (el, getLines) => {
    el.addEventListener("pointerenter", (e) => show(el, getLines, e));
    el.addEventListener("pointerleave", () => hide(el));
    el.addEventListener("focus", () => { if (el.matches(":focus-visible")) show(el, getLines); });
    el.addEventListener("blur", () => hide(el));
  };

  // ---- the Genzo card: the line follows the screenshot on show
  const card = document.querySelector(".pcard");
  if (card) {
    const shot = () => {
      const on = card.querySelector(".board img.on") || card.querySelector(".board img");
      const key = (on.getAttribute("src").match(/genzo-(\w+)\./) || [])[1] || "home";
      return LINES.genzo[key] || LINES.genzo.home;
    };
    wire(card, shot);
    new MutationObserver(() => refresh(card)).observe(card.querySelector(".board"), { subtree: true, attributeFilter: ["class"] });
  }

  // ---- Email, LinkedIn and X at the end of About
  document.querySelectorAll(".links a").forEach((a) => {
    const mail = a.href.startsWith("mailto:");
    wire(a, () => {
      if (!mail) return a.hostname === "x.com" ? LINES.x : LINES.linkedin;
      const h = new Date().getHours(), e = LINES.email;
      return h >= 5 && h < 11 ? e.morning : h < 17 ? e.day : h < 22 ? e.evening : e.night;
    });
  });

  // ---- the intro's inline links. "copy my email" copies it (and says so); if the clipboard is refused
  // it copies through a hidden field, and only if that fails too, opens the mail app
  document.querySelectorAll(".intro [data-quip]").forEach((el) => {
    const kind = el.dataset.quip;
    let copied = false;
    const get = () => kind === "copy" ? LINES.copy[copied ? "done" : "fresh"]
      : LINES[kind];
    wire(el, get);
    if (kind !== "copy") return;
    el.addEventListener("click", () => {
      const mail = el.dataset.email;
      const done = () => { copied = true; refresh(el); };
      const fallback = () => {
        const f = document.createElement("textarea");
        f.value = mail;
        f.setAttribute("readonly", "");
        f.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(f);
        f.select();
        let ok = false;
        try { ok = document.execCommand("copy"); } catch (e) {}
        f.remove();
        el.focus({ preventScroll: true });
        if (ok) done(); else location.href = "mailto:" + mail;
      };
      if (navigator.clipboard) navigator.clipboard.writeText(mail).then(done, fallback);
      else fallback();
    });
  });

  // ---- the doors to the poems: the secret line under the footer, and "short poems" in About
  const poemDoor = document.querySelector(".poem-door");
  if (poemDoor) wire(poemDoor, () => LINES.poemDoor);
  const verse = document.getElementById("verse");
  if (verse) wire(verse, () => LINES.verse);

  // ---- Stack tiles: the tool's name, with an aside
  document.querySelectorAll(".stack li[data-tool]").forEach((li) => wire(li, () => LINES.stack[li.dataset.tool]));

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
