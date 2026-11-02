# my-website — start here

My portfolio site. Live at **https://rohitgentyal.vercel.app** (Vercel project `rohitgentyal` on account rohitgentyal0201, connected to the GitHub repo: every push to `main` deploys to production; set up 2026-11-02). The old GitHub Pages copy at https://rohitgentyal.github.io/my-website/ stays on until I turn Pages off. The Vercel CLI (`npx vercel`) is logged in on this PC; `.vercel/` and `.env*` are gitignored. Repo `RohitGentyal/my-website` is public; only I can push. For who I am and how I like to work, see `../CLAUDE.md`. **Keep this file current** when anything is decided, finished or left pending, and push.

## Workflow

- Plain HTML/CSS/JS, no build step. Preview: `npx serve . -l 5174`, or the `my-website` entry in `../.claude/launch.json`.
- `index.html` links `style.css?v=…`, `scene.js?v=…` and `loader.js?v=…`. **Bump a file's `?v=` whenever it changes.** Otherwise returning visitors get a stale cached script, and the hero has rendered blank before.
- **Load speed (2026-11-02):** a full scene paint costs ~150–250ms, so it must happen only once on load. The page scrollbar is hidden (I didn't want the grey bar and white strip, and it appearing after the loader narrowed the page and forced a second paint mid-curtain, which froze the page on refresh). `render()` waits for the fonts (1.5s fallback) instead of painting before and again after them. Don't add anything that changes the page width or the hero's size after load. **Memory:** my PC has 7.4 GB RAM (often <1 GB free) and a 2020 AMD integrated-GPU driver; refreshing made Chrome freeze and stop working. So the 3 night layers (`skyNight`, `cloudNight`, `glow`) are only allocated while night shows or is on its way (`paintNight` / `freeNight`); day mode holds 6 full-screen canvases instead of 9. Don't add more full-screen canvases or CSS filters on big layers. **Scroll (2026-11-03):** the bee layer clears only a box around each bee's last spot (`beeMarks`), not the whole canvas every frame, and pointer moves within 150ms of a scroll are ignored (Chrome reports the page sliding under a still cursor as moves, which set off grass and shadow repaints). Any per-frame drawing should repaint only what changed.
- **Sky, clouds, wind, caption (2026-11-03, my asks):**
  - **Sky** (`drawSky(DAY_SKY / NIGHT_SKY)`): deeper teal overhead easing to a hazier, lighter blue at the horizon, and a soft light band just above the hill. Painted once per render. **Rejected:** faint wind-combed wisps/streaks in the sky ("not good").
  - **Clouds** are no longer painted on the sky. Each is its own small canvas pair (day + night, cropped to the cloud) inside `#clouds`, moved only by transform: the tower sways and bobs a few px; small far-off clouds drift right to left (2 in a high band under the top bar and above my name, 1 low over the horizon, slipping behind the hill; phones get one low one) and wrap around. **No hover effect on clouds** (my call, 2026-11-03: "keep the cloud as it was"). Tried and removed the same day: a nudge away from the cursor, and a hover "vaporize" that tore the cloud apart. Night copies are only painted while night shows. The old full-screen `cloudNight` layer is gone.
  - **Grass sway (WebGL2, `#sway` canvas, "swaying grass" section of scene.js):** all ~24,000 blades (slope blades and tufts) are uploaded to the graphics card once per render, and a shader bends each one every frame, so the whole field moves at ~0ms of main-thread script. Modelled on my reference (a breeze through barley): a slow swell rolls right to left (wavelength 520·S px, 6s) over a longer one (1400·S px, 14s), the field leans left 0.08–0.5 rad and rocks (tips swing ~8–16px; I asked for "a bit more" after 0.06–0.36, and 0.03–0.13 read as not moving), each blade has a flutter of ±0.06 rad, and crest blades are up to 9% lighter. **The animation loop (`buzz`) is started at the end of `render()`:** the scene paints after the fonts load, which can be after the hero's on-screen check, and before this fix the bees, cloud drift and grass sway all sat frozen on some loads. **Cursor:** every blade near the cursor keeps its own spring, as in the original 2D version (`brush`/`step`); the springing blades' bends go to the shader as one per-blade float array (`bends`, uploaded only while something moves). **Rejected:** one shared cursor "push" in the shader ("not as smooth as it was": the bent patch jumped with the mouse and blades snapped back). While brushing, the shadow layer repaints at most every 80ms plus once when the grass settles (a full repaint every frame cost ~7ms), and the 2D repaint gathers only flowers and leaves. Flowers and leaves stay on the 2D `#touch` layer and react as before; they now always sit above the blades. Night tint is the same CSS filter as the hill. If WebGL2 is missing or the context is lost, the blades are painted on `#touch`, still, as before. **Rejected:** CSS light bands sweeping over the grass ("too heavy"), and 2D-canvas per-blade wind (43–62ms a frame).
  - **Corner caption:** cream with a soft shadow on the grass; as the hill fades into the page on scroll, it blends to the page ink (`--over-page`, set in `parallax`). **Rejected:** dark ink text on the grass ("looks really bad").
  - Checked at 1920×960: a steady 60fps with no long frames and no script time in them, with the bees, clouds and grass sway all running.
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
- **Loader** (`loader.js`, 2026-11-02, after Skiper UI skiper8 / dennissnellenberg.com): on every load a near-black curtain (#1c1b17) shows "· Hello" in cream Instrument Serif italic for 1s, then Bonjour, Ciao, Olà, やあ, Hallå, Guten tag, नमस्ते at 150ms each; then it lifts off the top in 0.9s with a curved lower edge that flattens as it rises. The head script adds `.loading` (so without JS there is no loader); reduced motion gets a quick fade instead. `[hidden] { display: none !important; }` guards it.
- **Links:** nav and Email/LinkedIn draw a 1px line left to right on hover and retract on leave. A caption in the bottom right shows a quote plus the local time.
- **Intro:** "I'm a UX designer at Subculture Media Tech, where I lead product design for the Native Universe app…" plus hobby icons (football, gym, games, poetry) after "When I'm not designing,".
- **Work:** only Genzo for now (no link yet).
- **Experience:** from LinkedIn.
  - Subculture Media Tech, UX Designer: intern Dec 2025 to Jun 2026, full-time from Jun 2026.
  - Digital Nexus AI, UI/UX Design Intern: May to Dec 2025.
- **About:** minimal, without an "I'm Rohit" line (the name is in the hero).
- **Contact:** Email (rohitgentyal0201@gmail.com) and LinkedIn only. No GitHub link.

## Resume here (2026-11-02)

Today: added the words loader (Skiper8 style), pushed; its timings are in `loader.js`. A cursor trail was tried and removed the same day (see Rejected).

## Earlier (2026-10-28)

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
- a cursor trail (2026-11-02): tried a thin rainbow line, a striped rainbow band, then a rainbow mist with sparkles from the arrow's lower end; I had it removed
