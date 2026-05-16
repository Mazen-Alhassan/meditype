# meditype — Working Handoff

Context doc for picking up where this project left off. Pairs with `DEPLOY.md` (which covers the *original* tech-stack and one-time deploy steps). This file covers everything that's happened *since* deployment — workflows, gotchas, and the recurring quirks of syncing from the design tool.

## What this is, in one line

A static React-in-browser typing app for public-domain books, deployed to Vercel, with auto-deploy on every push to `main`.

- **Live:** https://meditype-omega.vercel.app
- **Repo:** https://github.com/Mazen-Alhassan/meditype (private)
- **Local:** `~/PycharmProjects/meditype/meditype`

## Day-to-day workflow

```
cd ~/PycharmProjects/meditype/meditype
# edit files
git add . && git commit -m "..." && git push
# Vercel auto-deploys in ~30s
```

Verify live: `curl -sI https://meditype-omega.vercel.app/ | head -1` should return `HTTP/2 200`.

## Syncing design updates

The designer exports a zip (named `meditype*.zip`, usually to `~/Downloads/`). The flow:

```bash
mkdir -p ~/Downloads/meditype-update
unzip -o ~/Downloads/meditype\(N\).zip -d ~/Downloads/meditype-update
./sync.sh        # additive — copies new/changed files, prompts to commit
./sync.sh --clean   # mirror — also deletes local files missing from export
```

`sync.sh` excludes `.git`, `.vercel`, `node_modules`, `screenshots/`, `uploads/`, `.DS_Store`, `sync.sh` itself, `DEPLOY.md`, and `HANDOFF.md`. Run it, review `git status` and the diff, then commit only the genuine design changes — see the next section.

## ⚠️ Recurring design-tool regressions (READ THIS)

The design tool doesn't know about post-deploy code changes and re-exports an older snapshot of several files every time. **Every sync** these come back wrong and must be reverted:

| File | What the export does | What you want |
|---|---|---|
| `vercel.json` | Rewrites root to `/meditype.html` | Must be `/meditype` (cleanUrls would otherwise 404 the root) |
| `data.jsx` | Adds demo `continue: 0.42/0.18/0.67` to a few books | All `continue: null` (clean library for new users) |
| `meditype.html` | `screen: "prepare"`, removes favicon + OG tags + analytics + `<script src="storage.jsx">`, replaces hydration with localStorage(`meditype`) | `screen: "library"`, all the meta tags, storage.jsx loaded, MTStorage hydration |
| `components/prepare.jsx` | Strips MTStorage wiring around `ambient/background/length` | MTStorage hydration + write-on-change |
| `components/reading.jsx` | Strips MTStorage wiring around volume / sessionSettings / tsPreset / etc. | MTStorage hydration + write-on-change |

**Quick revert pattern after sync:**
```bash
git checkout HEAD -- vercel.json data.jsx
# For meditype.html and prepare.jsx/reading.jsx: usually checkout HEAD
# then re-apply *only* the genuinely new design lines from the export.
```

**The design tool DOES legitimately change:** `popovers.jsx`, `typing-sound.jsx`, `hint.jsx`, `primitives.jsx`, `complete.jsx`, `library.jsx`, `tokens.css`, the `readingVariant` / `libraryTone` defaults inside the `EDITMODE-BEGIN` block of `meditype.html`, and the actual layout/component JSX inside `reading.jsx` and `prepare.jsx`. Keep those.

The recipe each sync:
1. Run `./sync.sh`, decline auto-commit.
2. `git diff --stat` to see what changed.
3. For each modified file, `git diff <file>` and identify: design change vs. regression.
4. Revert pure-regression files; for mixed files, restore from HEAD then patch in the genuine design diff with `Edit`.
5. Commit with a message describing the design changes, push.

## Architecture quirks added since DEPLOY.md

### `storage.jsx` — versioned persistence layer

A `MTStorage` wrapper around `localStorage` that namespaces under `meditype.v{N}.{key}` with `{ __v, value }` envelopes. Mismatched versions silently fall back — bump the version to evolve schema without bricking returning users.

API: `MTStorage.get(key, version, fallback)`, `.set(key, version, value)`, and convenience `prefs.getField(field, fallback)` / `prefs.setField(field, value)` for the single v1 prefs blob.

**What's persisted** (all under `meditype.v1.prefs`):
- App-level: `libraryTone`, `readingVariant`
- Prepare defaults: `ambient`, `background`, `length`
- Reading session: `typeSize`, `strict`, `showTimer`, `margins`, `ambientVolume`
- Typing sound: `typingPreset`, `typingVolume`, `typingMistake`, `rainHintDismissed`

**Explicitly NOT persisted** (every visit boots fresh): `screen`, `book`, `settings`.

**Untouched:** `meditype.progress` (per-book typing position, owned by `passages.jsx`). Do not fold into MTStorage — schema is stable.

**Migration:** on first load the wrapper silently moves legacy `meditype` and `meditype.typingSound` keys into v1 prefs, then deletes them. Gated by `meditype.migrated.v1` flag — idempotent.

### `sync.sh`

Bash wrapper around `rsync` for design-tool exports. Auto-detects nested folders in the unzipped export. `--help` for usage. Lives at repo root, executable, committed.

### Vercel + GitHub

Project `meditype` under Vercel org `mazens-projects-de6b4d2d`. Repo `Mazen-Alhassan/meditype` (private) connected; every push to `main` deploys. Stable production alias: `meditype-omega.vercel.app`. Vercel Web Analytics enabled (script tag in `meditype.html`).

### Favicon + social

`/medilogo.png` is the favicon, Apple touch icon, and OG/Twitter card image. The `<head>` meta block in `meditype.html` is one of the things the design tool keeps removing — preserve it.

## File map (delta from DEPLOY.md)

```
meditype/
├── storage.jsx              ← NEW: MTStorage versioned persistence
├── sync.sh                  ← NEW: design-export sync workflow
├── HANDOFF.md               ← NEW: this file
├── DEPLOY.md                ← original handoff (tech stack reference)
├── components/
│   └── hint.jsx             ← NEW: onboarding hint card (5 buttons, defaults)
└── medilogo.png             ← NEW: favicon + social card
```

Everything else matches `DEPLOY.md` § File structure.

## Commit hygiene

- Use `git -c user.email=mazenalhassan@cmail.carleton.ca -c user.name="Mazen Alhassan"` if the global config isn't set (the deploy session used this).
- One commit per logical change. Don't squash design-syncs together with code work.
- Prefix is loose — `feat:`, `fix:`, `design:`, plain prose all show up in `git log`. Match the surrounding pattern.

## Common verification commands

```bash
# Confirm the latest commit is live
curl -s https://meditype-omega.vercel.app/meditype | grep -E "MTStorage|readingVariant"

# Tail recent deploys
vercel ls meditype | head -5

# Wait for next deploy
until curl -s https://meditype-omega.vercel.app/meditype | grep -q "<unique-string-from-new-commit>"; do sleep 8; done && echo LIVE
```

## Marketing notes (for the curious)

Tagline: **A quiet place to type.** The Reddit/HN pitch lives in conversation history — short version: lead with the experience, not "I made this." Best channels in priority: Hacker News (Show HN), Product Hunt, TikTok screen recordings, niche newsletters. Reddit is hit-or-miss.

## Open follow-ups (none blocking)

- `assets/thocky-09.wav`, `assets/thocky-10.wav` are unreferenced after the bank was trimmed to 8. Safe to `git rm` if you want to slim the bundle.
- `assets/typing-typewriter.wav`, `assets/thocky-source.mp3`, `assets/jazz1.mp3`, `assets/jazz2.mp3` were already legacy per DEPLOY.md — also safe to delete.
- Custom domain not configured. Vercel default URL is fine for now; add via Vercel dashboard → Settings → Domains when ready.
