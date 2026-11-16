// Click-me tags, below the hero. Every clickable there wears a small tilted ink tag on hover (style.css,
// .hob-tag), and its line is chosen for the moment, not fixed:
// - the Genzo card speaks about whichever screenshot is up, and changes with it while you hover;
// - Email reads the visitor's own clock; "copy my email" in the intro knows once it has copied;
// - the hobby words change once you've heard them;
// - a line never repeats the one shown just before it, so each hover says something new.
(() => {
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

  // a tag for links and the card (the hobby words already have theirs, with the equalizer)
  const tag = (host) => {
    host.classList.add("quipy");
    const t = document.createElement("span");
    t.className = "hob-tag";
    t.setAttribute("aria-hidden", "true");
    t.innerHTML = '<span class="say"></span>';
    host.appendChild(t);
    return t.querySelector(".say");
  };

  // Genzo card: the line follows the screenshot on show
  const card = document.querySelector(".pcard");
  if (card) {
    const say = tag(card);
    const shot = () => {
      const on = card.querySelector(".board img.on") || card.querySelector(".board img");
      const key = (on.getAttribute("src").match(/genzo-(\w+)\./) || [])[1] || "home";
      return LINES.genzo[key] || LINES.genzo.home;
    };
    let hovering = false;
    card.addEventListener("pointerenter", () => { hovering = true; say.textContent = pick(card, shot()); });
    card.addEventListener("pointerleave", () => { hovering = false; });
    card.addEventListener("focus", () => { say.textContent = pick(card, shot()); });
    // the shots crossfade on their own (work.js); the tag keeps up
    new MutationObserver(() => { if (hovering) say.textContent = pick(card, shot()); })
      .observe(card.querySelector(".board"), { subtree: true, attributeFilter: ["class"] });
  }

  // Email and LinkedIn
  document.querySelectorAll(".links a").forEach((a) => {
    const say = tag(a);
    const isMail = a.href.startsWith("mailto:");
    const lines = () => {
      if (!isMail) return LINES.linkedin;
      const h = new Date().getHours();
      const e = LINES.email;
      return h >= 5 && h < 11 ? e.morning : h < 17 ? e.day : h < 22 ? e.evening : e.night;
    };
    const set = () => { say.textContent = pick(a, lines()); };
    a.addEventListener("pointerenter", set);
    a.addEventListener("focus", set);
  });

  // the intro's inline links. "copy my email" copies it (and says so); without clipboard access it
  // falls back to opening the mail app
  const INTRO = {
    linkedin: () => LINES.linkedin,
    genzo: () => ["the thing I'm building", "it all moves, go on"],
    about: () => ["it's just below", "spoiler: football"],
  };
  document.querySelectorAll(".intro [data-quip]").forEach((el) => {
    const say = tag(el);
    const kind = el.dataset.quip;
    let copied = false;
    const lines = () => kind === "copy"
      ? copied ? ["copied. paste away", "it's in your clipboard"] : ["one click, it's yours", "no typing, promise"]
      : INTRO[kind]();
    const set = () => { say.textContent = pick(el, lines()); };
    el.addEventListener("pointerenter", set);
    el.addEventListener("focus", set);
    if (kind === "copy") {
      el.addEventListener("click", () => {
        const mail = el.dataset.email;
        const done = () => { copied = true; set(); el.classList.add("is-copied"); };
        // older browsers and locked-down frames: copy through a hidden field, and only if that fails too,
        // open the mail app
        const old = () => {
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
        if (navigator.clipboard) navigator.clipboard.writeText(mail).then(done, old);
        else old();
      });
    }
  });

  // hobby words: fresh lines until you've played it, then they know
  document.querySelectorAll(".hob[data-sound]").forEach((w) => {
    const key = /siuuu/.test(w.dataset.sound) ? "football" : /buddy/.test(w.dataset.sound) ? "barbell" : "game";
    const say = w.querySelector(".say");
    let heard = false;
    const set = () => { if (!w.classList.contains("is-playing")) say.textContent = pick(w, LINES.hob[key][heard ? "heard" : "fresh"]); };
    w.addEventListener("click", () => { heard = true; });
    w.addEventListener("pointerenter", set);
    w.addEventListener("focus", set);
  });
})();
