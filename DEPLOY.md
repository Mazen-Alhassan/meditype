# meditype — Handoff for Deployment

## What this is

**meditype** is a finished, fully-working web app. It is *not* a mockup or design reference — every screen, interaction, and audio system is implemented and runs in the browser as-is. The goal of this handoff is to **deploy it to Vercel** with auto-deploy from GitHub, so the owner can keep iterating on the design and have changes go live automatically.

> Web app premise: a meditative typing app for reading public-domain literature. The user picks a book, picks a passage, and types it slowly while ambient sound plays. No WPM, no accuracy %, no leaderboards — just a calm, paper-feeling reading practice.

## Tech stack (already in place)

- **Pure static site.** No build step, no bundler, no package.json, no node_modules.
- **HTML + React 18 (UMD) + Babel Standalone** — the JSX files are transpiled in the browser at load time.
- **WebAudio + HTMLAudioElement** for ambient sounds and per-keystroke typing sounds.
- **localStorage** for per-book reading progress.
- All runtime dependencies are loaded from `unpkg.com` via `<script>` tags with pinned versions and SRI hashes.

This means deploying it is trivial: serve the folder as static files. Vercel handles this with zero config.

## File structure

```
meditype/
├── meditype.html          ← entry point (the only HTML file)
├── tokens.css             ← design tokens (colors, type, spacing) — light + dark
├── data.jsx               ← seed data: books, moods, ambient presets, typing-sound presets
├── passages.jsx           ← public-domain passage library for all 24 books + progress store
├── components/
│   ├── primitives.jsx     ← shared icon + cover + progress-line components
│   ├── library.jsx        ← Library screen (mood-organized shelf)
│   ├── prepare.jsx        ← Prepare screen (per-book settings before a session)
│   ├── reading.jsx        ← Reading screen (the typing surface, three layout variants)
│   ├── complete.jsx       ← Session-complete screen
│   ├── popovers.jsx       ← Sound / Background / Settings popovers + ambient audio engine
│   └── typing-sound.jsx   ← Per-keystroke sample-based typing sound engine
└── assets/
    ├── rain.mp3           ← ambient: rain on a window (looped)
    ├── fireplace.mp3      ← ambient: hearth fire (looped)
    ├── full.mp3           ← ambient: soft piano (looped)
    ├── whitenoise.mp3     ← ambient: white noise (looped)
    ├── typing-soft.wav    ← typing preset: soft keys
    ├── typing-pen.wav     ← typing preset: fountain pen
    ├── thocky-01.wav … thocky-10.wav  ← typing preset: thocky switches (10-sample bank)
    ├── typing-typewriter.wav          ← (legacy, unused — safe to keep or delete)
    ├── thocky-source.mp3              ← (source mp3 used to generate the thocky bank — not loaded at runtime; safe to delete)
    ├── jazz1.mp3, jazz2.mp3           ← (legacy, unused — safe to delete)
```

`screenshots/` and `uploads/` folders, if present, are leftover from the design iteration sandbox and are **not** referenced by the app. Safe to exclude from deployment.

## How the app loads (read this once)

`meditype.html` does, in order:
1. Loads `tokens.css`.
2. Loads React 18 + ReactDOM + Babel Standalone from unpkg (pinned + SRI).
3. Loads each `.jsx` file via `<script type="text/babel" src="…">` — Babel transpiles them in the browser. Order matters: `data.jsx` → `passages.jsx` → `components/primitives.jsx` → screen components → popovers → typing-sound.
4. The last `<script type="text/babel">` block in `meditype.html` defines the App shell and routes between Library / Prepare / Reading / Complete via React state.

There is **no bundling, no transpilation at build time, no server**. Open `meditype.html` in a browser via `file://` and it works (modulo browser autoplay policies for the WebAudio engine, which only kick in on first user interaction — already handled).

## Deploying to Vercel

Two paths. Pick one — both work. The GitHub path is recommended because it gives auto-deploy on every change.

### Path A — Vercel + GitHub (recommended, auto-deploy)

1. **Create a GitHub repo.** Anywhere — public or private, Vercel reads both.
   ```bash
   cd /path/to/meditype
   git init
   git add .
   git commit -m "Initial commit: meditype"
   git branch -M main
   git remote add origin git@github.com:<your-username>/meditype.git
   git push -u origin main
   ```

2. **Add a `vercel.json`** at the project root so Vercel knows this is a plain static site (no build):
   ```json
   {
     "cleanUrls": true,
     "trailingSlash": false,
     "rewrites": [
       { "source": "/", "destination": "/meditype.html" }
     ]
   }
   ```
   The rewrite makes `https://your-domain.vercel.app/` serve `meditype.html` so users don't have to type the filename. Without it the root URL would 404.

3. **Add a `.gitignore`** so the design-iteration leftovers don't get pushed:
   ```
   screenshots/
   uploads/
   .DS_Store
   *.log
   ```

4. **Connect to Vercel.**
   - Go to vercel.com → "Add New" → "Project" → "Import Git Repository" → pick the meditype repo.
   - Framework preset: **Other** (it's a static site).
   - Build command: leave **empty**.
   - Output directory: leave **empty** (defaults to project root, which is what we want).
   - Click **Deploy**.

5. Done. You'll get a URL like `https://meditype.vercel.app`. Every `git push` to `main` from now on auto-deploys in ~30 seconds.

### Path B — Vercel CLI (one-off deploy, no GitHub)

```bash
npm i -g vercel
cd /path/to/meditype
vercel             # answers: link to your account, project name "meditype",
                   # framework "Other", build command empty, output dir "."
vercel --prod      # promote to production
```

Same `vercel.json` from Path A applies.

## Custom domain (optional)

In the Vercel dashboard for the project: **Settings → Domains → Add**. Vercel will give you DNS records to set at your registrar (an `A` record or `CNAME` depending on your setup). Propagation is usually a few minutes. HTTPS is automatic.

## Browser support / known constraints

- **Chrome, Edge, Firefox, Safari (current versions).** All confirmed working.
- **Babel-in-browser** means a few hundred KB of transpilation runs at first load. Cold load is ~1.5s on a fast connection; subsequent loads are instant (everything is cached). If load time becomes a concern post-launch, the future migration path is to pre-compile the JSX with esbuild — but it is **not** required to ship.
- **WebAudio autoplay policies** require a user gesture before audio starts. The app already handles this: ambient sound only kicks in after the user opens a book and presses a key.
- **localStorage** holds per-book progress (`meditype.progress` key). No backend, no accounts. If a user clears site data, their progress resets. This is intentional — the app is single-device by design.

## Iterating after deploy

The owner of this project plans to keep iterating visually. The flow is:
1. Edit files locally (or in the design tool that produced this handoff).
2. `git add . && git commit -m "tweak" && git push`.
3. Vercel auto-deploys in ~30 seconds.

**No code changes are needed for visual iteration** — the designer can edit `tokens.css`, the screen components, or the data files and push directly. The app is structured so that:
- All colors live in `tokens.css` (CSS custom properties).
- All copy lives in `data.jsx` (book titles, mood names, ambient labels) and `passages.jsx` (the typing texts).
- Each screen is a single file in `components/`.

If the designer wants to add a new ambient sound: drop the mp3 into `assets/`, add an entry to the `AMBIENTS` array in `data.jsx`, and add a `case 'newId':` block in the `Ambience.play()` method in `components/popovers.jsx`. That's it.

## What NOT to do

- **Don't introduce a build step "to clean things up."** The browser-Babel approach is intentional — it lets the designer iterate without a node toolchain. If you want to pre-compile for perf later, do it as an additive step that produces a `dist/` folder; don't replace the source layout.
- **Don't rewrite this in Next.js / Vite / a framework.** It's a static site with React running in the browser. That's the whole point. A framework would add complexity with zero user-facing benefit.
- **Don't strip the SRI hashes** on the unpkg `<script>` tags in `meditype.html`. They pin React/ReactDOM/Babel to specific verified versions.

## Questions / contact

Send back to the designer (Claude Design conversation that produced this handoff) for any visual or content changes. Use Claude Code for deploy, infrastructure, custom-domain setup, analytics integration, or migrating to a build pipeline if the time comes.
