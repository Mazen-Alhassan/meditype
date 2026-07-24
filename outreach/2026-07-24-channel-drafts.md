# 2026-07-24, Channel drafts (7 items)

---

**[Channel: Twitter/X post]**
- **Source link:** n/a (standalone post)
- **Posted by OP:** n/a
- **Why it fits:** Privacy and transparency angle. Yesterday was the anti-WPM thesis. Today leads with the "no tracking anywhere" fact, which reads differently to indie-web and privacy-aware crowds.
- **Draft (paste ready):**
> meditype is a static site with no backend, no database, no account system. everything runs in the browser. you pick a public-domain book, set some ambient sound, and type. nothing you do is sent anywhere or stored on a server.
>
> https://meditype-omega.vercel.app

---

**[Channel: Reddit comment]**
- **Source link:** https://www.reddit.com/r/Stoicism/ (active threads about morning practice, engaging with texts, reading habits)
- **Posted by OP:** check before posting, target threads posted within 48h
- **Why it fits:** r/Stoicism regularly discusses morning rituals and ways to engage with the Meditations, Seneca, Epictetus. meditype has a dedicated "Stoic Mornings" shelf with those exact texts. Copying out a passage by hand (or keyboard) is a legitimate contemplative practice with historical roots.
- **Draft (paste ready):**
> there's a typing app called meditype where you can work through the meditations or seneca at your own pace, with ambient sound and no score. copying stoic texts to internalize them is an old practice and this is the closest thing i've found digitally. no timer, no streak. just you and the passage.
>
> https://meditype-omega.vercel.app

---

**[Channel: Reddit comment]**
- **Source link:** https://www.reddit.com/r/MechanicalKeyboards/ (threads about enjoying the typing feel, favorite typing experiences, "what do you type on")
- **Posted by OP:** check before posting, target threads posted within 48h
- **Why it fits:** r/MechanicalKeyboards loves the sensory side of typing and discussions about "just enjoying your switches." The WPM-test framing annoys a lot of people in this sub. meditype is specifically for enjoying the feel of typing without being graded.
- **Draft (paste ready):**
> if you want something that lets you actually enjoy the sound and feel without being graded on it, meditype is worth a look. public-domain books, no WPM counter, optional ambient rain or background sound. it's less typing practice and more just... sitting with your board and a nice text.
>
> https://meditype-omega.vercel.app

---

**[Channel: Bluesky / Mastodon]**
- **Source link:** n/a (standalone post, target #indieweb #SlowWeb tags)
- **Posted by OP:** n/a
- **Why it fits:** The indie-web and slow-web crowds on Bluesky/Mastodon respond to honest builds with no tracking. Different angle from yesterday's Stoic post (which was mood-library focused). Today's post leads with the architecture transparency and the no-tracking fact.
- **Draft (paste ready):**
> built a typing site that runs entirely in the browser. no backend, no account, no tracking. a shelf of public-domain books sorted by mood. ambient sound (rain, hearth fire, forest at dusk, ocean). type slowly.
>
> https://meditype-omega.vercel.app
>
> #indieweb #SlowWeb #PublicDomain

---

**[Channel: Blog/article comment]**
- **Source link:** https://www.pixelthoughts.co/articles/calming-websites/ (article: "The best free calming websites," surfaced in search results, comment section likely open)
- **Posted by OP:** article date unknown, check before posting
- **Why it fits:** The article lists tools designed to calm you down (sand art, rain sounds, etc.). meditype belongs in this category but comes from a completely different angle: typography and literature rather than visuals. Worth adding as a commenter.
- **Draft (paste ready):**
> great list. one i'd add that fits the same category: meditype (https://meditype-omega.vercel.app). pick a public-domain book, set some ambient sound, and just type through it slowly. no score, no timer. the whole design is built around slowing down rather than speeding up. different from the others on this list but scratches the same itch.

---

**[Channel: Hacker News - Show HN post]**
- **Source link:** n/a (this IS the submission)
- **Posted by OP:** n/a
- **Why it fits:** Show HN is the highest-priority channel per HANDOFF notes. The architecture details (no build step, JSX loaded directly in browser) are legitimately interesting to the HN audience. Slot appears unused this week. MAX 1 per week, verify posting history before shipping.
- **Draft (paste ready):**
> **Title:** Show HN: Meditype, type through public-domain books with no WPM counter
>
> https://meditype-omega.vercel.app
>
> Built this for myself and decided to put it out there. Most typing apps are built around speed metrics, streaks, and leaderboards. This one deliberately has none of that. You pick a book from a shelf of public-domain writing (Marcus Aurelius, Thoreau, Rilke, Moby-Dick, Alice in Wonderland, the Tao Te Ching), add an ambient sound (rain, hearth fire, forest at dusk, ocean), and type at your own pace.
>
> Books are sorted by mood: Stoic Mornings, Slow Sundays, Wonder, Melancholy, Adventure.
>
> No WPM counter, no timer, no streak, no account, no backend. Architecture: static React app, components loaded from JSX files directly in the browser (no build step, no bundler), preferences persisted to localStorage with a versioned wrapper, auto-deployed to Vercel on push. Happy to answer questions about the implementation or the book selection.

---

**[Channel: Twitter/X reply]**
- **Source link:** search twitter/x for "monkeytype alternative" OR "what typing site do you use" OR "recommend a typing app" (live threads, pick one under 48h)
- **Posted by OP:** varies, verify before sending
- **Why it fits:** Typing app recommendation threads pop up regularly. Most replies in these threads list WPM-focused tools (TypeRacer, Keybr, Typeracer). meditype is the only one in the "no score at all" category and fills a real gap in the thread.
- **Draft (paste ready):**
> depends what you want from it. for speed, keybr or typeracer. if you want something with no WPM at all, meditype is the one: public-domain books, ambient sound, no score anywhere on the page. https://meditype-omega.vercel.app

---

## Today's notes

**Trends spotted:**
- Works from 1930 entered the public domain on Jan 1, 2026. This hasn't been used as a hook yet and could add a timely angle to Twitter/X copy later this week. Frame: "some of the best writing of the 20th century is now free to read, copy, and type through."
- TypeLit.io and Entertrained are the two closest direct competitors found today. Both use books for typing practice. Both still have WPM tracking and some gamification. meditype's clean differentiator holds: zero WPM, zero score, ambient sound, mood-sorted library.
- The FANSTIK "Analog 2026" article (CEOs quitting typing, "paper firewall") and LinkedIn's anti-productivity reading list confirm the slow-down trend is still running. Good backdrop for all outreach.
- r/Stoicism is an untapped channel. The library has Marcus Aurelius, Seneca, Epictetus, Emerson and an explicit "Stoic Mornings" category. This sub responds well to practical tools for engaging with Stoic texts.
- r/MechanicalKeyboards has a strong "enjoy the feel without being graded" undercurrent. The sub is large and the "no WPM" angle is genuinely unusual there.

**Queries that returned nothing useful:**
- Reddit JSON API blocked entirely in this environment. No live threads from last 24-48h verifiable. Reddit reply drafts are templates: user needs to find a live thread before sending.
- Twitter/X live thread search returned zero usable results. Twitter/X reply draft is a template for pasting into a live thread.
- Bluesky posts not accessible via WebFetch or search. Post can be sent directly via the Bluesky app.
- HN WebFetch returned 403 on all item pages. Thread ages could not be confirmed.
- Firecrawl API not tested (likely blocked in this environment per the prompt note).

**Channels worth doubling down on:**
- Show HN (highest-priority per HANDOFF, slot likely open this week)
- r/Stoicism (natural fit, library is perfect, angle unused so far)
- r/MechanicalKeyboards (large community, "enjoy the feel" angle resonates)
- Bluesky #indieweb #SlowWeb (growing platform, 44M users as of May 2026)

**Channels to hold this week:**
- r/InternetIsBeautiful fresh post (used yesterday, Jul 23, weekly limit hit)
- HN "What Are You Working On?" comment (used yesterday, Jul 23)

**Note on Notion:** Notion MCP is not connected in this session. File logged to outreach/2026-07-24-channel-drafts.md as fallback. Connect the Notion MCP server to enable automatic page creation on future runs.
