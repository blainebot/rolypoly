# rolypoly.gg — working notes

A daily press-your-luck trivia dig. Read this before changing anything; it records
decisions that are easy to undo by accident.

## What it is

Five prompts a day, five unrelated domains. Every right answer digs Poly deeper and
adds to an unbanked total. Dig again to keep going, or **bank and roll** to lock in
the round. One wrong answer wakes **Rumble** and wipes out everything unbanked.

The tension between digging and banking is the entire product. Anything that
softens it needs a real argument.

## Commands

```bash
npm run check     # validate content, build, then smoke-test the result
npm run build     # writes dist/index.html
npm run validate  # content checks only
npm run smoke     # plays scripted games against the built engine
npm run serve     # build and serve dist/ locally
```

**`npm run check` must pass before any commit.** Vercel, Netlify, and Cloudflare
Pages all run the same three scripts, so a failure there means a failed deploy.

## Hard constraints

- **The build output is one self-contained HTML file.** No external assets beyond
  Google Fonts. This is what makes it droppable on any host and testable offline.
  Don't introduce a step that breaks it. The one deliberate exception is the score
  histogram (`src/js/95-scores.js`), which makes a single best-effort network call
  behind a hard 2-second timeout — see "Score distribution" below. It never blocks
  play, never delays the results screen, and fails silently to nothing rendered.
  It does not make the file itself require a network connection to work.
- **No dependencies, no framework, no bundler, no TypeScript.** `package.json` has
  an empty dependency list and should stay that way.
- `src/js/*.js` are numbered because they are **concatenated, not imported**. They
  share one scope. Keep the numbers spaced so a module can be inserted.
- `00-tiers.js` contains the marker `/*__ROUNDS__*/`, which the build replaces with
  compiled content. Don't remove it.

## Puzzle day

`puzzleDay()` in `src/js/20-random.js` is the only place a date gets
constructed. The puzzle rolls over at **midnight US Eastern**, not UTC —
`new Date().toISOString()` is UTC and was rolling the day (and everything
seeded from it) at 8pm Eastern. It uses `Intl.DateTimeFormat` with the
`America/New_York` time zone rather than any hand-rolled offset, so DST
transitions are handled by the platform's own timezone database, not
reimplemented here. `?day=2026-09-20` in the URL overrides it for testing —
looking at a specific day's puzzle doesn't require changing the system clock.

`DAY`, computed once from `puzzleDay()` at load, is what everything else
reads: the world's jagged tunnel edges and which relic waits in the hidden
chamber (both in `src/js/50-world.js`), and — see "Daily rotation and
persistence" below — which game is live and whether today's already done.

## Site address

`SITE_DOMAIN` in `src/js/20-random.js`, next to `GAMENO`, is the only place
the site's address is written — a bare domain, no protocol, matching how it
reads in the share text. The score API URL (`src/js/95-scores.js`) is
derived from it (`https://${SITE_DOMAIN}/api/score`) rather than carrying
its own copy. It's currently the Vercel deployment's address, not
`rolypoly.gg` — that domain isn't registered yet. When it is, this one line
is the whole change; nothing else should ever hardcode the address again.

## Daily rotation and persistence

**Which game plays on which day** is `content/schedule.json` — the one
obvious place to edit this, and the only place a rotation is authored:

```json
{ "start": "2026-09-14", "order": ["002", "001"] }
```

Games cycle through `order` one per day starting from `start`, wrapping
indefinitely in both directions (dates before `start` resolve too — the
modulo arithmetic in `gameForDay()` handles negative offsets correctly, not
just positive ones). Add a new game to the rotation by appending its number
to `order`; nothing else needs to change, and there's never a date with no
answer the way a manually-maintained date → game dictionary could end up
with if someone forgot to extend it.

`content/config.json`'s `activeGame` is a **manual override for local
development** — set it to force a specific game regardless of the date, for
testing that game specifically. It should stay `null` in production; that's
what ships. Combine it with `?day=` (see "Puzzle day") for full control over
what a given test session sees. `build.mjs` validates `schedule.json` and
the override the same way it validates round content — a `schedule.json`
entry naming a game that doesn't exist under `content/games/`, or an
override naming one, fails the build rather than shipping broken.

Both the schedule data and `gameForDay()` are injected into `00-tiers.js`
via the same `/*__ROUNDS__*/` marker as `GAMES` always was, but the actual
`GAMENO`/`ROUNDS` assignment lives in `src/js/20-random.js`, right after
`DAY` — `gameForDay(day)` needs `DAY` to exist, and `DAY` isn't defined
until that file runs. Function declarations hoist through the whole
concatenated script regardless of file order, so `20-random.js` calling a
function injected earlier is fine; what wouldn't work is computing
`GAMENO`/`ROUNDS` inside the injected block itself, before `DAY` exists.

**A finished day is stored once** (`src/js/85-daily.js`), in
`localStorage["rolypoly:result"]`: `day`, `gameNo`, `banked`, `deepest`,
`deepestName`, `results` (which now also carries each round's actual found
answers, snapshotted in `endRound()`, not just the aggregate counts it used
to), and the share text. `showResults()` only saves when it's a genuine
first completion — never when it's re-displaying a stored result
(`restoring`, set by `showStoredResults()`), and never during a practice
replay (`isPractice`, set the moment "Practice dig" is clicked and never
cleared for the rest of the session — there's no path back to "real" once
you're finished for the day). The same two flags gate the score-histogram
submission in `95-scores.js`, for the same reason: re-displaying or
practice-replaying a result must not resubmit it.

**On boot**, before anything else renders, `loadTodayResult()` checks for a
stored record. It's only trusted if **both** `day` and `gameNo` match the
current ones — not `day` alone. That match (not "handle a live midnight
tick") is what actually protects a session that's open when the day rolls
over: whatever a player is mid-round on when midnight passes still gets
tagged, on completion, with the day and game they *started* — `DAY` and
`GAMENO` are computed once at load and never re-derived — so it's still
self-consistent even though the wall clock has since moved on. What the
match check catches is a config-override switch or a schedule edit landing
on top of a still-valid record for a different day/game combination; without
checking both fields, that stale record could otherwise be shown as today's,
or silently block a day it doesn't actually belong to. There's no
mid-session banner or live re-check — a tab left open past midnight keeps
showing whatever it already loaded until it's reloaded.

**An unfinished game is also saved**, separately, to
`localStorage["rolypoly:progress"]`: `idx`, `banked`, `roundDepth`, `found`,
`deepest`, `deepestName`, `chamberHit`, `results`. `saveInProgress()` is
called after every state change that matters (`accept()`, the clear-board
+10, `endRound()`, `loadRound()`) rather than on a timer, so a reload never
loses more than whatever happened in the last few milliseconds. It's a
no-op during practice (`isPractice`), same reasoning as the finished-result
save.

The one subtlety: `idx` doesn't advance until the player clicks past a
round's summary screen, but `endRound()` has already pushed that round into
`results` before that click. In the window between the two, saving the raw
`idx` would resume back into a round that's already banked — replaying and
banking it again would double-count it. `saveInProgress()` uses
`results.length` as the round to resume into, not `idx`, which is exactly
right in both states: mid-round (`idx===results.length`) it also saves the
live `roundDepth`/`found`/`chamberHit`; in that just-finished window
(`idx` behind `results.length`) it resumes into the *next* round fresh
instead, the safe choice, not a faked one. Once `results.length` reaches
`ROUNDS.length` the day is over regardless of whether `idx` caught up, so
`saveInProgress()` clears the in-progress record instead of writing one —
and `saveTodayResult()` clears it again on the way to writing the finished
result, so nothing stale is left behind either way a day can end.

On boot, an in-progress record is only consulted if there's no finished
result for today (finished always wins). `resumeGame()` restores the saved
state and calls `loadRound(true)` — `loadRound()`'s only behavior change
when resuming is skipping the reset it normally does at the top
(`roundDepth`/`found`/`chamberHit`), since those are exactly what was just
restored. One re-binding step matters here: `found` comes back through
`JSON.parse` as plain-object copies, not the same object references as
`ROUNDS[idx].answers` — and `dig()`'s duplicate check
(`found.includes(hit)`) is reference equality against an object pulled from
`avail()`. Skip the re-bind and an already-found answer silently stops
being detected as a duplicate after a resume, and can be dug — and scored —
a second time. `resumeGame()` re-binds each restored entry to its real
answer object by name before assigning `found`. This shipped broken once;
`scripts/smoke.mjs` now digs a pre-resume find again and asserts it's
rejected, specifically so it can't ship broken twice.

The world isn't replayed tunnel-by-tunnel on resume — that history is live
pacing/animation state that was never persisted, and reconstructing the
exact dig-by-dig path isn't worth the complexity for a redraw. `loadRound(true)`
draws one clean shaft straight down to `roundDepth` instead: correct depth,
not a faked history.

**Reviewing past answers** — the results screen (freshly finished, restored,
or practice) has a "Review your answers" `<details>`, one subsection per
round: what was found (name, value, the fact — the same markup `revealFacts()`
already uses mid-round) and, derived from the round's real `content/games/`
answers rather than also stored, what wasn't. A round's found answers are
kept even when it busted — only the first find scores, but reviewing what
you actually dug up is a different question than what it paid.

`scripts/smoke.mjs` is the only test on game *logic* — `validate.mjs` only
checks content. It reads `dist/index.html`, extracts the one `<script>` (the
whole engine, concatenated — see "Hard constraints" above), and runs that
real source inside a hand-rolled `node:vm` context built to look just enough
like a browser that the engine doesn't notice: a flat id → element cache
standing in for `document.getElementById` (the engine never traverses real
DOM structure, only ever looks things up by id, so no HTML parser is
needed), and fake timers. `setTimeout` really fires — via `setImmediate`, so
callback order matches call order, which is what every real-delay pair in
this codebase already relies on — so `reveal()`'s cascading 1050ms/1900ms
continuations (the chamber check lives in the first one) genuinely run.
`setInterval` and `requestAnimationFrame` are no-ops that never fire, since
nothing under test depends on an interval or animation frame actually
ticking — only on the one-shot timeouts that gate game-state transitions.
`fetch` always rejects, so the score-comparison call in `95-scores.js`
resolves to nothing almost instantly, exactly as it would offline — no
sandbox talks to the network. `calm()` (reduced motion) is deliberately kept
`false`, not stubbed true, because the calm-branch in `reveal()` skips the
hidden-chamber check entirely — faking reduced motion would silently disable
the ability to test the chamber at all.

Every scenario gets its own fresh `vm` context rather than sharing one reset
between tests — slightly more setup per scenario, far less risk of one
test's leftover state leaking into the next. Matcher scenarios run against a
small synthetic answer pool authored in the test file itself, not whatever's
currently in `content/games/`, so they keep passing regardless of future
content edits; the scoring scenarios (clean round, bust, clear, full game,
chamber) deliberately do use the real compiled `ROUNDS`, reading `avail()`
dynamically rather than hardcoding answer names, so they also survive
content edits without going stale.

Assertions are checked against the engine's actual resulting state (`banked`,
`found`, `results`, `shareText()`) — expected values are computed
independently in the test file from the rules in "Scoring" above, not copied
from the implementation. If you're tempted to make a failing assertion pass
by editing the assertion instead of the engine, stop and read why it failed
first — that's the entire point of this file existing.

`npm run smoke` runs it alone; `npm run check` runs it after the build, and
so does every deploy target's build command (Vercel, Netlify, Cloudflare,
GitHub Pages) and the CI workflow.

## Decisions already made

Don't reintroduce these without asking:

- **No multipliers.** Rounds are equally weighted. A centimetre is a centimetre;
  once the score stops matching the dig, the depth track becomes decoration.
- **No stolen answers.** Rumble used to take answers off the board mid-round. It was
  cut for being confusing. Every answer is reachable.
- **No ghost opponent, no second mascot.** Poly digs. Rumble is the disaster. That
  is the whole cast.
- **The answer count is hidden during play.** Showing it turns "do I know another?"
  into inventory management.
- **Facts are withheld until the round ends.** During play you get name and value
  only; the explanations land under "What you dug up" afterwards.
- **Fuzzy matches are confirmed, never auto-accepted.** A typo gets "Did you mean X?"
  so a lucky misspelling can't score an answer the player didn't know.

## Scoring

- **The first find each round is always safe.** A bust banks the value of the
  first answer you found that round instead of 0 — the harshest possible
  outcome in a daily game. Everything from the second dig onward carries
  exactly the risk it always did; only the bust payout changed.
- **Breadth bonus: +2 per find beyond the second.** Three finds pays +2, five
  pays +6. Paid only when you bank or clear the board — a bust forfeits the
  bonus entirely, including on the guaranteed first find. This is a flat bonus
  keyed to find *count*, not a multiplier on value — the "no multipliers" rule
  above still holds; a centimetre is still a centimetre.
- **Par is a per-round benchmark**, not a difficulty gate. It defaults to the
  sum of the three cheapest answers when a round doesn't set one explicitly.
- **The day's banked total is never shown against `POSSIBLE`.** That
  denominator is the sum of every answer on every list plus every clear and
  breadth bonus — nobody will ever approach it, and "145 of 1411" reads as a
  failure no matter how the day actually went. `POSSIBLE` stays in
  `90-results.js`, unused by anything a player sees, in case a tier threshold
  ever wants deriving from it. If you're tempted to surface it again, that's
  the argument you're up against.

## Day tiers

The results-screen headline is a named band, not the raw number — "leaf
litter" through "hidden chamber," in `DAY_TIERS` in `src/js/00-tiers.js`. That
table is the *only* place the thresholds are authored: each entry's `max` is
the sole number that matters, and everything the tier band needs to render —
a band's lower bound, its share of the band's width — is derived from that
list in `90-results.js`, not duplicated. Tune the day by editing the five
`max` values; nothing else needs to change. The open-ended top band (`max:
Infinity`) borrows the previous band's width for layout, since there's no
sensible way to draw "infinity" proportionally.

Same shape as the round-level `TIERS`, one entry per row: `max`, `name`, a
colour key (`v`, reusing moss/sand/rust/ember plus a new `chamber` purple),
an emoji (reusing the round tier emoji, plus the hidden-chamber `🏺`), and one
line of copy. The tier name, the emoji, and that copy line all also open the
share text, right after the game number line.

## Score distribution

`#distBox` on the results screen always starts out holding the day-tier band
(`dayTierBandSvg()` in `90-results.js`), rendered synchronously — it works
from day one, needs no backend, and is the permanent fallback. The histogram
— "you scored better than N% of today's players" — only ever *replaces* it,
same position, same job, better information, once there's enough data. This
is the one feature that isn't self-contained in the static file:

- `src/js/95-scores.js` fires one `POST` to `SCORES_API` (hardcoded to the live
  deployment — edit that constant if the domain changes) with a hard 2-second
  `AbortController` timeout. Success or failure, it never delays rendering the
  rest of the results screen, which is built and shown first.
- **Below 50 recorded scores for that game, the curve doesn't render at all**
  — the tier band stays up. Below that count a histogram is more noise than
  signal, and there's nothing to compare against yet.
- Any failure — offline, timeout, malformed response, non-2xx, opened from
  `file://` — leaves the tier band exactly where it was. No placeholder, no
  cached number, no fake curve. Degrade to the tier band, never to a fake.
- `api/score.js` is a Vercel serverless function backed by Redis (Upstash, via
  the Vercel Marketplace under the project's Storage tab — a one-time setup
  step in the dashboard, not something `npm run check` can verify). It needs
  `KV_REST_API_URL` / `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` /
  `UPSTASH_REDIS_REST_TOKEN`) in the project's environment variables; without
  them it responds 503 and the client falls back to the tier band, per the
  rule above.
- The store holds nothing but a per-game histogram of bucketed score counts —
  no IP, no identity, no per-submission record, no field beyond the count in
  each bucket. A submitted score is validated server-side against that game's
  actual `content/games/<n>/` answers (same formula as `POSSIBLE` above)
  before it's allowed to increment anything, and the `game` parameter is
  regex-validated to block path traversal into `content/`.
- This is a soft bound, not hardened anti-cheat: someone could still forge a
  request by hand. There's no server-side replay of the scoring engine to
  verify a submitted score was actually played out — that would mean
  maintaining scoring logic in two places. Acceptable for an ambient stat with
  no stakes attached; revisit if that ever changes.

## Writing content

One JSON file per round in `content/games/<num>/`; five rounds make a game.
Every game gets bundled at build time; `content/schedule.json` picks which one
is live on which day (see "Daily rotation and persistence"). See
`content/TEMPLATE.md`.

Values are in centimetres and set both score and Poly's shell colour:

| Tier        | Value | The kind of answer it is                              |
|-------------|-------|-------------------------------------------------------|
| Leaf litter | 1–7   | Named first by anyone who knows the topic at all      |
| Topsoil     | 8–14  | Comes with a moment's thought                         |
| Root line   | 15–24 | You need to actually know the subject                 |
| Bedrock     | 25+   | A genuine deep cut                                    |

Two rules the validator enforces or warns on: every round needs at least one answer
under 8, or there's no safe opening move; and values need real spread, or digging
again costs nothing to decide.

An optional `par` integer sets the round's benchmark, shown as "Par N · you dug M"
when the round ends. Leave it unset to default to the sum of the three cheapest
answers — the validator warns when it's missing and errors if it exceeds the
round's total available value.

Current values were assigned by feel and should be re-derived from something
measurable — Wikipedia pageviews bucketed into the four bands is the usual approach.

Be generous about including debatable-but-true answers. A valid answer that isn't on
the list wipes the round, which is the most enraging thing this game can do.

## Rumble's costumes

A round may name a `scene`; without one it falls back to the domain. Art lives in
`SCENE` in `src/js/40-sprites.js`, filling `hat`, `prop`, `eyes`, `float` and `bg`.
Body-worn art goes inside the scaled `figure` group; drifting art goes in `float`.
`.sc-<scene> .figure` scales or shifts him when a prop needs room.

**The contrast trap.** Each scene colours its own panel via `bg`; without one it is
alarm red (#B93A2B). Red props on red and near-black props on dark backgrounds both
disappear — both shipped broken before being caught. Rumble's fur is #B0824F, so a
scene with black props needs a mid-tone background, roughly 0.06–0.13 luminance.
Aim for 1.8:1 minimum on every prop. When a clash is unavoidable, put a cream plate
behind it, as the German flag does.

## Known gaps

- **Off-list answers are always wrong.** A real version needs either exhaustive
  hand-authored lists or a model judging submissions at play time. This decision
  shapes how much content authoring costs, and hasn't been made.
- **No sound.**
- Content is two games, so `content/schedule.json`'s rotation repeats every two
  days. The hidden chamber at 95 is only reachable on the largest rounds, so
  reaching it is partly luck of the draw.
- The results screen is the least designed surface in the game, and it's the one
  people screenshot.
- **No cross-device sync.** A finished day lives in that browser's `localStorage`
  only — a different browser or device sees a fresh board for the same day.
