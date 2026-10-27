# my-website — start here

My portfolio site. Live at **https://rohitgentyal.github.io/my-website/** (GitHub Pages from `main`, root). Repo `RohitGentyal/my-website` is public; only I can push. For who I am and how I like to work, see `../CLAUDE.md`. **Keep this file current** when anything is decided, finished or left pending, and push.

## Workflow

- Plain HTML/CSS/JS, no build step. Preview: `npx serve . -l 5174`, or the `my-website` entry in `../.claude/launch.json`.
- `index.html` links `style.css?v=…` and `scene.js?v=…`. **Bump that `?v=` whenever either file changes.** Otherwise returning visitors get a stale cached script, and the hero has rendered blank before.
- Check at desktop and 375px widths, then commit and push in the same turn. The live site updates about a minute after a push; refresh once if it looks stale.
- `gh` CLI isn't signed in; `git push` works.

## Current state (2026-10-27)

- **Hero** (`scene.js`, canvas, seeded so it's the same on every visit): a painted, Ghibli-style scene with a flat teal-blue sky, one big cream cumulus cloud, a yellow-green hill with brushy grass detail, a winding sandy path, and a few dark rocks. Modelled on a reference painting I shared: repaint in that style, never trace or copy it. The intro text is white over the sky. **Parallax on scroll:** sky + cloud live on their own canvas (`#sky`) and sink at 0.45× scroll behind the hill (`#hill`); the intro drifts at 0.25× and fades out. Off under prefers-reduced-motion. **Touch grass:** all grass marks are drawn 2.1x taller (`TALL`/`THICK` in scene.js); every third slope blade lives on a `#touch` canvas, and moving the cursor over the slope makes those blades lean away and spring back. **Meadow detail** (from a mossy-hill reference I shared): long wispy grass tufts (`drawTufts`) and ten painted flower clumps (pink, orange, daisy; `planFlowers`) that sway when brushed like the grass, kept off the path; the two lowest show only on wide screens so they never sit under the caption. Hobby tiles are 38px with 24px icons.
- **Links:** nav and Email/LinkedIn draw a 1px line left to right on hover and retract on leave. A caption in the bottom right shows a quote plus the local time.
- **Intro:** "I'm a UX designer at Subculture Media Tech, where I lead product design for the Native Universe app…" plus hobby icons (football, gym, games, poetry) after "When I'm not designing,".
- **Work:** only Genzo for now (no link yet).
- **Experience:** from LinkedIn.
  - Subculture Media Tech, UX Designer: intern Dec 2025 to Jun 2026, full-time from Jun 2026.
  - Digital Nexus AI, UI/UX Design Intern: May to Dec 2025.
- **About:** minimal, without an "I'm Rohit" line (the name is in the hero).
- **Contact:** Email (rohitgentyal0201@gmail.com) and LinkedIn only. No GitHub link.

## Pending (waiting on me)

1. Genzo's live link: it isn't deployed yet.
2. My playlist link. Set `PLAYLIST_URL` in `scene.js` and add a small music link in the text marked `data-playlist`.
3. Direction for the grass texture.

## Design references

- neelsaswade.com (hero landscape idea)
- dannyjpwilliams.com/about (minimal About)
- kshv.me (overall minimalism)

## Rejected, don't bring back

- the dark background with scribbly white line art
- hobby clip-art scattered in the scene
- the hard seam line between the hill layers
- speckle-noise grass
- spiky noisy grass blades
- the person lying on the grass with a music player (removed at my request)
