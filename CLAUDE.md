# my-website — start here

My portfolio site. Live at **https://rohitgentyal.github.io/my-website/** (GitHub Pages from `main`, root). Repo `RohitGentyal/my-website` is public; only I can push. For who I am and how I like to work, see `../CLAUDE.md`. **Keep this file current** when anything is decided, finished or left pending, and push.

## Workflow

- Plain HTML/CSS/JS, no build step. Preview: `npx serve . -l 5174`, or the `my-website` entry in `../.claude/launch.json`.
- `index.html` links `style.css?v=…` and `scene.js?v=…`. **Bump that `?v=` whenever either file changes.** Otherwise returning visitors get a stale cached script, and the hero has rendered blank before.
- Check at desktop and 375px widths, then commit and push in the same turn. The live site updates about a minute after a push; refresh once if it looks stale.
- `gh` CLI isn't signed in; `git push` works.

## Current state (2026-10-27)

- **Hero** (`scene.js`, canvas, seeded so it's the same on every visit): a painted, Ghibli-style scene with a flat teal-blue sky, one big cream cumulus cloud, a yellow-green hill with brushy grass detail, a winding sandy path, and a few dark rocks. Modelled on a reference painting I shared: repaint in that style, never trace or copy it. The intro text is white over the sky. **Parallax on scroll:** sky + cloud live on their own canvas (`#sky`) and sink at 0.45× scroll behind the hill (`#hill`); the intro drifts at 0.25× and fades out, and the bottom 35% of the hill fades into the page colour (`.scene .fade`) as it scrolls away. The corner quote stays at full opacity (I asked for that). Off under prefers-reduced-motion. **Touch grass:** all grass marks are drawn 2.4x taller, and distant blades shrink less with distance than before (`TALL`/`THICK` in scene.js). *Every* blade, tuft, clump, path-edge blade and flower lives on the `#touch` canvas (blades rooted near the ridge are trimmed so they only fringe the sky slightly), and the cursor makes them lean away and spring back. To keep that cheap, marks are indexed into a 48px grid and each frame repaints only one rectangle of cells around the moving marks (`redraw`). Don't add a shape clip to that partial repaint: rect + hill-path clipping caused multi-second stalls. **Meadow detail** (from a mossy-hill reference I shared): denser wispy tufts (`drawTufts`) and 16 flower clumps in pink, orange, daisy, purple, yellow, red and blue (`planFlowers`), each with a sprinkle of a second colour. They sway when brushed and stay off the path; the lowest ones show only on wide screens so they never sit under the caption. **Bees** (`#bees` canvas, 4 on desktop, 2 on phones) bob over flower heads and hop within their clump now and then; bring the cursor near one and it flies off in an arc to a different clump, every time. They pause when the hero is off screen and stay still under reduced motion. Hobby tiles are 48px with 32px icons: a football, a dumbbell, a game controller, and paper with a quill (redrawn 2026-10-28 to read more clearly).
- **Day / night mode:** a moon button left of "Work" switches to night (it becomes a sun to switch back). The choice is saved in localStorage (`theme`), and an inline script in `<head>` applies it before paint. Day is the default; I decided to keep it manual, with no automatic switch after dark.
  - **Sun and moon** share one spot in the sky (top right on desktop, low left beside the cloud on phones).
  - **The switch** plays as one eased ~2.8s timeline in scene.js (`nightT`/`glowT`, `applyNight`). Going to night: the sun sinks behind the hill, reddening; a warm dusk glow (`.dusk`) peaks halfway; the hill warms, then cools to a moonlit blue (one CSS filter, set from JS); the moon climbs from behind the hill; stars come out one by one, highest first, then twinkle gently; bees cross-fade into fireflies. Going to day plays it in reverse.
  - **Layers:** `#sky` (day sky and cloud), `#skyNight` (night gradient), `#celestial` (sun, stars, moon), `#cloudNight`, `.dusk`, `#hill`, `#shade`, `#touch`, `#glow` (moonlight pool plus a soft crest sheen, screen blend), `#bees`.
  - **Shadows** (`drawShade`, on a CSS-blurred `#shade` layer): a soft pool of shade behind every tuft, grass clump and flower clump (`casters`), plus a tapered sliver behind each of their blades and stems, all falling away from the sun or moon. Dense slope blades cast none, because that looked scratchy. Long shadows are paler. Shadows are tinted by the light: teal-green at noon, violet as the sun gets low, deep blue under the moon. There is also always-on contact shade at the roots of each clump, faint dappled shade from every 9th slope blade, and rocks that cast moving shadows (clipped so the rocks themselves stay unshaded; the painted rock shadow is now only a tight contact patch). Draw everything as batched strokes or a single fill of ellipses: one fill of thousands of shapes cost about 30ms. Now about 2–4ms a frame. Shadows lengthen as the light drops, fade at dusk and return with the moon, and they follow the grass when it's brushed.
  - No hard rim line on the ridge: that read as the rejected seam.
- **Hobby sounds:** clicking a hobby tile plays its sound (`data-sound` on the tile, files in `sounds/`): Football → "SIUUU", Gym → "Yeah buddy, lightweight baby", Gaming → "Bingo bango bongo". Each click restarts it and cuts off any other. Poetry has no sound yet.
- **Links:** nav and Email/LinkedIn draw a 1px line left to right on hover and retract on leave. A caption in the bottom right shows a quote plus the local time.
- **Intro:** "I'm a UX designer at Subculture Media Tech, where I lead product design for the Native Universe app…" plus hobby icons (football, gym, games, poetry) after "When I'm not designing,".
- **Work:** only Genzo for now (no link yet).
- **Experience:** from LinkedIn.
  - Subculture Media Tech, UX Designer: intern Dec 2025 to Jun 2026, full-time from Jun 2026.
  - Digital Nexus AI, UI/UX Design Intern: May to Dec 2025.
- **About:** minimal, without an "I'm Rohit" line (the name is in the hero).
- **Contact:** Email (rohitgentyal0201@gmail.com) and LinkedIn only. No GitHub link.

## Resume here (2026-10-28)

Today: a day/night mode (moon button in the top bar) with a sunset-to-moonrise transition, stars, a moonlit hill, fireflies, and grass shadows that move with the light; hobby tiles play sound effects on click (football, gym, gaming) and were redrawn bigger and clearer; the far, upper slope has bigger, slightly darker blades that also brush, right up to the ridge; every grass blade now reacts to the cursor; grass is taller and denser; flowers are more numerous and colourful; bees hop between flowers and flee the cursor. Everything is pushed. Not yet checked: real frame rate on a slower laptop or phone (the preview pane was throttled during testing). If brushing ever feels laggy, lower the slope blade density (`(W * H) / 60` in `drawSlope`) first.

Earlier (2026-10-27): scroll parallax, larger type, darker greys, link hover underline, bigger nav/hobby tiles, quirky hobby icons and footer line, copy edits, the hill-to-page fade on scroll.

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
- an automatic day/night cycle on a hidden timer (a minute of day, a minute of night): tried 2026-10-29, I didn't like it
