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
{ "start": "2026-09-14", "order": ["002", "001", "003"] }
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

For jumping between games while authoring content, `?game=003` in the URL
(`gameOverride()`, `src/js/20-random.js`) is quicker than editing
`config.json` and rebuilding — it wins over the config override, silently
falls through to it (then the schedule) if the number doesn't match a real
`content/games/` folder, and needs no rebuild since it's read at load time.
It's a testing convenience, not a player-facing feature: nothing links to
it, and a finished result under an overridden game is still keyed to that
`(day, game)` pair (see below), so it can never masquerade as the real
scheduled day's result.

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

## Answer matching

`src/js/10-matching.js`. `dig()` in `70-game.js` tries an exact `norm()` match first
(instant credit, no confirm — typing the real name or alias verbatim should never
feel like it's being second-guessed), then calls `fuzzyMatches()`: one match routes
to "Did you mean X?", never an automatic accept; several fall through to "be more
specific, nothing lost"; none wakes Rumble.

`fuzzyMatches()` used to be two separately-tuned functions, `partialMatches()`
(whole-token and whole-string-prefix matching) and `nearMiss()` (edit-distance typo
tolerance) — a fork that kept growing new special cases as gaps turned up in play
("mint" busting instead of reaching "Thin Mints" was one). It's now one scoring
function, `matchScore(guess, candidateText)`, called once per candidate: every
transformation the matcher understands — exact match, leading article stripped,
punctuation and spaces removed so hyphenated and spaced spellings converge, simple
plural stemming, a whole token, a 4+ character token prefix — feeds into one number
(0 = as good as typing it outright; a positive ratio for a genuine edit-distance
typo, scaled to `tolerance()` at that pairing's own length, same formula as before;
`Infinity` for nothing close). `CONFIRM_THRESHOLD` (1) is the one cutoff that
decides confirm versus no-match, replacing what used to be two independently-tuned
gates. `STOPWORDS` (the, a, an, of, and) is an explicit rule, not a side effect of
the length floor every one of them happens to sit under — future content shouldn't
be able to reintroduce a filler-word match by changing an unrelated threshold.

Two subtleties the rewrite had to get right to actually preserve behavior, not just
resemble it:

- **Typo-distance tolerance only ever applies to a whole candidate string, or to a
  single token once it's long enough (`MIN_TOKEN_TYPO`, 8 characters).**
  `tolerance()` is generous enough (up to a flat 4-edit allowance past length 12)
  that checking it against every token unconditionally creates real collisions
  between short, common words that recur across a round — "york" landing 2 edits
  from both "park" and "work" nearly turned every New York Avenue guess ambiguous
  on a Monopoly board where "Park Place" and "Water Works" are also answers. A
  prefix or exact match still works per-token at any length (that's the whole
  point — it's how "mint" reaches "Thin Mints"); it was the *fuzzy* edit-distance
  fallback that had to stay whole-string-only at first, exactly where the old
  `nearMiss()` also drew that line — until a real bug report showed the cost of
  that restriction: "pennsyvania" (missing the second l) for "Pennsylvania
  Avenue" busted instead of confirming, because "pennsyvania" isn't remotely
  close to the *whole* string "pennsylvania avenue" (the un-typo'd "avenue" alone
  costs 7 edits), only to the one word inside it that was actually typo'd.
  `MIN_TOKEN_TYPO` reopens per-token fuzzy matching, but only past a length where
  a coincidental collision stops being plausible — 8 characters keeps "york" (4),
  "park" (4), "work" (4), and "avenue" (6) all exact/prefix-only, while letting
  "pennsylvania" (12) forgive a real typo. Checked the same way as the two bugs
  below: every 8+ character token in every answer or alias across all three
  games, with one character dropped and with each adjacent pair swapped —
  every one still resolves to the right answer alone or safely joins a genuine
  ambiguity (a word close to two *different* long words, which still correctly
  falls through to "be more specific"), never a bust and never the wrong credit.
- **A clean (score 0) match isn't diluted by a weaker one elsewhere in the pool.**
  Collecting every candidate under threshold independently turned "Pacific Avenue"
  ambiguous against "Atlantic Avenue" and "Baltic Avenue" — all three cleared
  `CONFIRM_THRESHOLD` once one of them matched exactly, since a shared 6-character
  suffix ("avenue") is common enough that a handful of edits closes the rest of the
  gap on a 12+ character name. `fuzzyMatches()` only lets near-miss ties compete
  with each other when *nothing* in the pool scores a clean 0 — a real structural
  match (exact, token, prefix) always wins outright over a merely-within-tolerance
  coincidence, the same discipline the old two-function split had by construction
  (the single best near-miss silently beat a same-quality runner-up) but that this
  rewrite had to state on purpose instead of getting for free.

Both were caught the same way: comparing every derived guess (full name, each 4+
token, singular/plural forms, hyphen-as-space, flattened) against every real answer
in all three games, old matcher vs. new, and reading every disagreement rather than
trusting that "the tests still pass" meant the rewrite was faithful. Simple
trailing-s/es/ies stemming got the same treatment — offered as separate candidate
stems rather than picked by a single rule ("lines" only correctly reaches "line" by
trying the plain strip-s reading alongside the strip-es one, which alone would give
"lin"), since a rule that has to guess which suffix pattern applies will guess wrong
often enough to matter. `scripts/smoke.mjs`'s matcher tests use a synthetic
girl-scout-cookie pool (plus two answers outside that theme, `Kakapos` and
`Ostriches`, to confirm the fix generalizes) for the original "mint" bug, and the
existing Pink-Floyd-themed pool's `park`/`Hyde Park`/`Jurassic Park` ambiguity case
still covers the two-tier confirm-vs-specific contract on the new implementation.

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

The band carries one number of its own: `dayTierBandSvg()` prints the point
where the open-ended top band begins (e.g. "300+") right-aligned under the
band. This is not `POSSIBLE` — it's just where the visible scale tops out, a
design threshold rather than a claim about achievable or typical scores, so
it doesn't carry the "reads as failure" problem `POSSIBLE` does. Derived from
`DAY_TIERS` the same way the band's widths are — never a second authored
number.

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

**A round's topic has to be a closed set — the answer count fixed by a real
authority, not one that can keep growing.** Shipped broken once, the
motivating case for the rule rather than a hypothetical: `001/04-space.json`
was "Name a moon of Saturn," fifteen hand-picked answers, and Saturn has 274
confirmed moons and rising — that's ongoing discovery, not a fixed body of
fact, so *every* fixed list for that topic was wrong by construction, not by
gap-filling. A tester correctly answered "Telesto" and busted anyway; no
amount of adding more moons to the list would have fixed it, because the true
count doesn't stay still. Replaced with "Name a planet in the solar system" —
eight, fixed by the IAU's 2006 General Assembly Resolution B5 (the same one
that reclassified Pluto to a dwarf planet), and genuinely closed: no future
discovery adds a ninth without the IAU redefining the term itself. Before
writing a new round, check whether some governing body, fixed historical
event, or finite official count actually closes the topic's answer set —
"Big Ten schools" and "Declaration signers" do (a conference's own roster, a
finite historical document); "moons of a planet," "islands in a chain," or
anything gated by ongoing discovery or measurement doesn't, no matter how
exhaustively it's researched. If it can't close, the fix is a different
topic, not a longer list. `designNotes` (optional, `content/TEMPLATE.md`) is
where the authority gets cited once found, author-facing only — never shown
to players, dropped by `build.mjs` before compiling — so the citation lives
with the file it justifies instead of aging out of a commit message.

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

**A correct answer always scores, no matter how long the round's list gets.**
`validate.mjs` warns past 15 scoring answers (`MAX_SCORING`) because the "at least
one answer under 8 / real spread / two or three deep cuts" shape from above gets
hard to hold onto in a very long list and the round can drag — but it's a nudge to
look at the round's shape, never a cue to cut a correct answer just to get under the
number. This shipped the other way once: four rounds (History, Sport, Literature,
Food) had their longer tail moved into non-scoring `extras` purely to hit 15, which
meant a player who knew, say, Minnesota was a Big Ten school got "right, but not one
of today's fifteen" instead of points — correct, and unrewarded. Don't reintroduce
that. A round is allowed to be long.

`extras` (a round's optional second list, see `content/TEMPLATE.md`) exists for the
one case where "correct but doesn't score" is actually honest: something that's
still a genuinely correct answer to the round's real prompt, just past the scoring
cutoff. No round currently uses it that way — Sport/History/Literature/Food just run
long instead (see above), and Film/Games (below) turned out not to be `extras`
cases at all. If a future round narrows its prompt on purpose, `extras` is the right
tool only for whatever the *broader* question would still accept and the narrower
one does too; anything the narrower prompt actually excludes is a wrong answer, not
an extra — see the `distractors` / `bust: true` case right below for what that one
actually needs.

An extra needs only a `name` and optional `aliases` — no value, no fact, since it
never scores. Submitting one says so ("Right, but not one of today's fifteen") and
the round continues exactly as if nothing had been typed: no score, no bust, no
entry in the reveal or in any count. `dig()` in `70-game.js` checks extras last,
after the real scoring list has had every chance to claim the guess (exact, then
`fuzzyMatches()`) and right before Rumble would otherwise wake up — an extra is
deliberately not offered a confirm step the way a scoring guess is, since accepting
or declining the suggestion changes nothing either way. `validate.mjs` errors if an
extra's name or alias collides with a scoring answer (or another extra) in the same
round — a collision would make the scoring answer win the match first, leaving the
extras entry dead, unreachable content.

If a round's scoring list ever does get trimmed for real (an honest editorial call,
not a mechanical cap), keep the round's *shape*, not just the tail cut off: at least
three answers under 8 so there's always a safe opening move, a spread through the
middle, and two or three genuine deep cuts so there's a reason to keep digging once
the easy ones are gone. Cutting only the obscure answers removes the round's ceiling
and flattens the whole curve.

**`distractors`** is the third list a round can carry, for a different problem than
`extras` solves: a guess that's never correct, but predictable enough to deserve an
explanation instead of a bare bust. Real bug report: a player entered "Buckeyes" for
"name a school in the Big Ten conference" and got dinged with no indication of what
went wrong. A mascot isn't a school under any reading of that prompt — unlike an
extra, there's no honest sense in which the guess is "right" — but it's an
understandable miss (the player likely does know the answer, just named the wrong
kind of thing), and busting the round teaches nothing. `dig()` checks `distractors`
right after `extras` and right before Rumble wakes up, using the same exact-or-fuzzy
reach as everything else (so "Buckeye" singular, or a typo, still gets caught): no
score, no bust, no confirm step — same reasoning as extras, accepting or declining
the "hint" changes nothing, so there's nothing worth interrupting play to ask about.

Each distractor carries its own `note` rather than a templated message, since the
wrong category isn't always the same shape — a round could just as easily need this
for a brand name instead of a variety, or a nickname instead of a person. `note` is
plain prose, shown as `"${raw}" isn't it — ${note} Nothing lost, try again.`; the
content author writes what the guess actually *is* ("That's Ohio State's mascot, not
the school.") and the engine supplies the rest. Same collision rule as extras, same
reason: `validate.mjs` errors if a distractor's name or alias collides with a scoring
answer, an extra, or another distractor in the same round.

**A distractor can opt into `bust: true`** for the other kind of predictable wrong
guess: not a category mix-up to forgive, but wrong on the actual merits of a
narrowed prompt. Real bug report: Film's prompt is "a feature film Steven Spielberg
directed in the 2000s or later," and a player entered Schindler's List (1993) — a
real Spielberg film, so it *felt* right, but not what this specific prompt asks for.
That round had it filed as an `extras` entry, which told the player "right, but not
one of today's fifteen — nothing lost." That's false: Schindler's List isn't right
for this prompt at all, it's just wrong in an understandable way (correct director,
wrong decade), and it deserves the actual consequence a wrong answer has, not a free
pass — just with the reason spelled out instead of a bare "isn't on the list."
`dig()` in `70-game.js` checks a `distractors` hit's `bust` flag: `false` (or
omitted) is the Big Ten mascot behavior above, and `true` routes into the exact same
dead-end/Rumble-wakes/round-ends path a genuine dead end takes (`bustWith()`, shared
by both), just with the note as the shown reason. `validate.mjs` requires `bust`,
when present, to be a boolean.

Both rounds that narrow their prompt on an excluding criterion use this: Film's
seventeen pre-2000s Spielberg features (`content/games/002/04-film.json`, each
noting its actual release year) and Games' eighteen non-state-named Monopoly
properties (`content/games/003/04-games.json`, each noting what it's actually named
for — a railroad, a utility, or just a board property that isn't a state).
Auditing Film's old `extras` list for this fix also turned up a second, unrelated
bug: The Post (2017) was sitting in `extras` as if it were a pre-2000s classic, when
it's actually a correct, in-era answer that had been silently denied credit — moved
into `answers` instead. Worth re-auditing any future `extras` list against its
round's actual prompt criteria before trusting it; this is exactly how that one went
unnoticed.

Content authored so far: `content/games/003/01-sport.json`'s eighteen Big Ten
mascots, one per school (non-busting); the Film and Games era/category distractors
above (busting); `content/games/001/04-space.json`'s five dwarf planets
(non-busting) — the most likely single guess in that round, Pluto, gets a note
that actually engages with why it feels right instead of a generic "wrong
category" line, plus a nod to New Mexico's legislature still calling it one.

## Round order

Filename order used to *be* the play order — five files, sorted alphabetically,
dug in whatever sequence they happened to sort in, arbitrary. Rounds now carry a
required **`difficulty`** (1-5, see `content/TEMPLATE.md`), and
`scripts/order-rounds.mjs`'s `orderRounds()` sorts each game's five rounds by it,
easiest to hardest, before `build.mjs` compiles them — so the day actually builds
instead of opening on whatever round happened to be `01-*.json`. Filename order
survives only as the tiebreak between two rounds sharing a difficulty.
`validate.mjs` imports the same function `build.mjs` does, rather than
re-implementing the sort, so its "first round of a game" warning (below) checks
the order that will actually ship, not a second guess at it.

**Difficulty is judged on recall, not depth — the distinction someone will
flatten by accident later.** "How hard is it to produce *any* answer at all"
(difficulty) and "how hard is it to keep a round going once you're in it"
(depth: answer count, value spread, how far the tail runs) are independent.
Food's Girl Scout cookies is difficulty 1 — nearly everyone's opening move is
instant — and still an eleven-answer round with real depth once you're
digging. Games' Monopoly-properties-named-after-a-state is difficulty 3 even
though the round itself is short (ten answers): most players' instant
Monopoly recall is Boardwalk, Park Place, the railroads — none of which are
state names — so the *opening* move stalls even though the round doesn't run
long once you're past it. Rate the blank box, not the round's shape; a round
earns a late slot by being a hard open, never by being a long one.

**Two rules beyond the plain sort, both enforced (one by the sort, one by the
validator):**

- **Never open a game on a 4 or 5.** The first round sets whether someone keeps
  playing. `validate.mjs` runs `orderRounds()` per game and warns if the round
  that comes out first is above 2 — checked against the real sort, so a content
  edit that reshuffles the opener gets caught even if no individual round file
  looks wrong on its own.
- **Never run two same-difficulty rounds back to back if it can be avoided.**
  This is a real constraint on the sort itself, not just a validator warning,
  because a plain ascending sort can *force* an adjacent repeat: difficulties
  `{1, 2, 2, 3, 4}` put the two 2's next to each other in any non-decreasing
  arrangement — there's no way to keep them apart and stay strictly ascending.
  `orderRounds()` resolves this by pulling the next differently-valued round
  forward to break the run: `1, 2, 3, 2, 4`, not `1, 2, 2, 3, 4`. That's a
  deliberate, small deviation from strict ascending order, not a bug — the
  no-repeat rule wins over strict monotonicity when the two conflict, and in
  practice it still reads as "the day builds," just with the hardest round
  landing at the end rather than mid-pack. If a game's remaining rounds are all
  the *same* difficulty once a run starts, the repeat is left in place —
  genuinely unavoidable, not something to force a worse rearrangement to dodge.

`validate.mjs` also errors on a missing or out-of-range `difficulty` — 1 to 5,
a whole number — the same way it errors on a missing `domain` or `prompt`; a
round can't be ordered at all without one.

## Accessibility

An audit walked the game keyboard-only and with a screen reader in mind and
found a ranked list of gaps; the critical and high ones are fixed, the rest
are still open. Read the audit notes (not reproduced here) before assuming
something's covered — plenty isn't yet.

**The Rumble overlay is a real focus trap, not just `aria-modal`.** That
attribute is a hint to assistive tech; it does nothing to stop a sighted
keyboard user from tabbing out of it. `endRound()` re-enables `bankBtn`
("Next round"/"See your day") before `rumble()`'s own 420ms delay even
builds the dialog, so it's sitting live underneath the scrim the whole time
the overlay is up — without a trap, Tab from "Shake it off" walked straight
into it, letting a keyboard user advance the round while RUMBLED! was still
on screen. `rumble()` now adds a capture-phase `keydown` listener alongside
the existing Escape handler, wrapping Tab/Shift+Tab within whatever's
focusable inside `#scrim` at that moment (queried live, not a fixed list, so
it stays correct if the dialog ever gains more controls). Both listeners are
added and removed together, in `close()`.

**Nothing moved focus when a round or a day ended.** `bank()` disables the
input/buttons, `endRound()` re-enables `bankBtn` — but never focused it, so
the browser dropped focus to `document.body`: silence for a keyboard or
screen-reader user, no cue anything happened or where to go. Same gap at the
day's end, when `showResults()` hides `#play` (and whatever had focus inside
it) and rendered a new screen with nothing focused. Fixed in both places:
`endRound()` focuses `bankBtn` on a bank outcome (bust is untouched — the
Rumble dialog already owns focus there, correctly); `showResults()` focuses
the results screen's heading. That heading — `#dayHeading` — didn't exist
before either; the results screen had no heading element at all, so a
screen-reader user navigating by heading found nothing there. It's now an
`<h1>` (the tier name, e.g. "leaf litter"), `tabindex="-1"` so it's
programmatically focusable without joining the normal tab order, doubling as
both the fix for the missing heading and the landing point after the
screen-transition — one control point, not two unrelated toggles that could
drift out of sync. Applies whether the screen just finished for real, was
restored from a stored result, or is a practice run. `.daytier` also carries
`scroll-margin-top` — the browser's default scroll-into-view on focus was
landing the heading partially behind the fixed HUD bar otherwise.

**The at-risk escalation (`src/js/60-hud.js`) was colour only.** Four
levels, cream → gold → orange → pulsing ember, and nothing else changed —
not even the pulse helped, since risk-3's animation is disabled under
`prefers-reduced-motion` the same as everything else, leaving that state
colour-only too for anyone with reduced motion set. Fixed with a short text
flag stacked under the number (`#riskFlag`: empty at levels 0–1, "rising" at
2, "high" at 3) — deliberately a second stacked line, not a longer "at risk"
caption on the same line, because the longer caption overflowed the HUD on
narrow screens; caught that by testing at mobile width, not by guessing.

**Round-end content had no live region**, so `#roundSummary`
(finds/dug/bonus/par), `.facts` ("what you dug up"), and `#missedBox`
("still down there") were never announced — only the terse `say()` messages
("Banked N.") were, via the one `#msg` region that already works.
`.facts`/`#roundSummary`/`#missedBox` weren't made `aria-live` directly:
`renderFacts()` also fires on every single dig mid-round, not just at round
end, so a live `.facts` would re-announce the whole growing chip list on
every find — worse, not better. Instead, `endRound()` folds the same numbers
into one richer message on the existing `#msg` channel for a bank outcome:
"Banked 14. 3 finds · 12 dug · +2 bonus. Par 12. 12 still down there." Bust
is intentionally left alone — the Rumble dialog is already the accessible
narrative for a bust, and duplicating round-summary detail into `#msg` on
top of that would just be two competing announcements.

Not done in this pass, deliberately scoped out — the audit's moderate/low
findings (bonus not announced on its own, the hidden-chamber discovery not
announced, `body.kb` hiding `.facts`/`#missedBox` for anyone with a
continuously-open on-screen keyboard, the day-tier band's adjacent hues,
reveal announcements landing ~1.9s behind the visual animation, no
auto-focus into the answer field on mobile at round start) are still open.
No new smoke coverage was added for the fixes above either — verified all
of them by hand in a real browser instead (Tab/Shift+Tab trapped, focus
landing correctly, the enriched message's exact text), since the smoke
harness's stub DOM doesn't track `document.activeElement` at all right now;
teaching it to would be real scope, not a quick addition, if focus behavior
ever needs regression coverage here.

## Rumble's overlay: the banked number is always the headline

`rumble(lost, kept)` in `80-rumble.js` headlines `kept`, never `lost` — in every
reachable state, not just some of them. An earlier version of this panel headlined
whichever number was more dramatic (the loss, when there was one), which reads as a
score rather than a bust summary, and put a bare, unlabeled **0** directly above
"Your first find, 15, is safe" on the one path where nothing was lost — a flat
contradiction. The fix isn't "pick the right number sometimes," it's dropping the
lost-as-headline idea entirely: `kept` is always what a player actually walks away
with, so it's always what's large, always labelled "banked" (`.banked em`), including
at 0 — that's the one case where 0 genuinely is the honest headline, since it's also
the only case where nothing was lost either.

Three shapes, chosen by what actually happened, share that one headline:

- **Nothing found before the bust** (`kept===0`): no secondary line — there's no
  find to reference — just `0` / "banked".
- **Busted with exactly one find** (`lost===0`, so `kept` is that find's value):
  "Your first find is safe." above the headline. Never mentions a loss, because
  there wasn't one — the second dig is what busted, before anything more was found.
- **Busted with several finds** (`lost>0`): "Your first find is safe — `lost` lost
  beyond that." above the same headline shape. The loss is real here, so it gets a
  sentence, but never the large number — that's still `kept`.

`lost` itself is `dug - firstFind` (`endRound()` in `70-game.js`), where `dug` is
`roundDepth` captured before the bust resets it and `firstFind` is the value of
whichever answer was found first. Since `roundDepth` only ever increases as answers
are accepted, `dug` is always `firstFind` plus the sum of everything found
afterward — `lost` can never be negative, and `kept===0` and `lost===0` are only
ever both true together (no finds means nothing accumulated, either to keep or lose).

The daily "Review your answers" list (`reviewAnswersHtml()` in `85-daily.js`) gets
the same treatment: a busted round reads "Domain — rumbled" alone when nothing was
kept, or "Domain — rumbled · kept N" when it was — the per-round echo of the same
"lead with what was kept" rule, not a second, differently-tuned copy of it.

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

**The face trap.** `hat` renders *last* inside `figure` — after `eyes`, the nose, and
the jaw/teeth group (`GOPHER()` in `40-sprites.js`) — so anything in `hat` that
reaches down far enough paints over them. Default eyes sit at y=28–33 (x=24–33 and
55–64 in the 160×120 viewBox); the nose stripe is y=40–47; teeth are y=50–68. Shipped
broken twice from this exact mistake: `bigten`'s helmet and facemask were one solid
block from y=6 to y=60, blotting out the whole face (fixed by pulling the dome up to
stop at y=25, and turning the facemask into three thin bars with real gaps low across
the muzzle, starting after the nose at y=47 — see the comment on that scene for the
detail); `monopoly`'s top-hat brim independently reached to y=34, blotting out the
default left eye and the monocle's own top edge, even though the monocle itself
(`eyes`) was fine. Check both bounds whenever a scene's `hat` or `prop` sits near the
head: **hat art must stay above y≈26**, clear of the eye row, and any facemask-style
art must stay low (y≥47) with real gaps, not a solid span down to the teeth. `eyes`
itself is exempt from the first rule (it's drawn *at* y=28+ by design), but must never
be covered by something in `hat` that reaches that far down.

## The hidden chamber is a void, not another band

Every layer above it (leaf litter through bedrock) is solid ground with a
corridor cut through it — `corridorPath()`/`dropPath()` in `50-world.js`
carving a jagged shaft into a colour band. The hidden chamber used to be
drawn the exact same way: one more gradient band, tunnelled through like the
rest, just named as if it were a discovery. It wasn't earning the name — the
fix leans on the one contrast that actually sells "you broke into something":
solid ground above, open space below, with nothing carved through the
open part because there's nothing there left to carve.

**`CHAMBER_FLOOR_AT`** (`00-tiers.js`, 170) is the chamber's floor — declared
there, ahead of `CHAMBER_AT` (95, `30-state.js`) in concat order, because
`LAYERS`' hidden-chamber entry needs it immediately below. `moveWorld()`
(`50-world.js`) reuses this same constant as its camera cap instead of
duplicating the number, so the visible floor and the point the camera stops
scrolling can't drift apart. (`CHAMBER_AT`/`95` itself is still duplicated
between `LAYERS` and `30-state.js` — pre-existing, not fixed here.)

**No tunnel is ever drawn at or past `CHAMBER_AT`.** `digTo(x,from,to)` caps
every drop at the ceiling (`Math.min(to,CHAMBER_AT)`) and does nothing at all
once `from>=CHAMBER_AT` — there's nothing to carve when she's already inside
the open space. `settleAt(depth,x)` is the corresponding decision for what
happens once a dig actually lands: a normal corridor and pacing above the
ceiling, or `startFloat()` (below) once she's past it, never both. Both are
shared between `reveal()`'s live breakthrough and `loadRound()`'s resume
path (reloading mid-round already past the ceiling) — one rule, not two
copies that could disagree about where the tunnel stops.

**The void itself is `buildWorld()`'s per-layer content for the "hidden
chamber" entry**, not a `#tunnels` element, so it survives every round's
`$("tunnels").innerHTML=""` reset instead of needing to be redrawn:

- Background is a near-black gradient close to the tunnel's own carve colour
  (`#180F08`) on purpose — the room reads as "already hollow," the same dark
  as everywhere else something's been dug out, just filling the whole space
  instead of a shaft through it.
- A jagged rock edge hangs from the ceiling and rises from the floor
  (`.tooth`), coloured from bedrock's own gradient stops so the break reads
  as bedrock giving way, not a new material appearing from nowhere.
- A *few* pale flecks (`.fleck`) — minerals or old bone, not a dense
  scatter — because nobody's been here. Deliberately sparser than the
  density formula every other layer's bits use; "a few" was the ask, not
  "as many as the old formula would give a 75cm-tall band."

**`placeRelic()` and the new `placeLightShaft()`** are still per-round,
dynamic, drawn into `#tunnels` at the actual moment of discovery — same
reasoning as before, just repositioned. The relic used to sit
`worldY(CHAMBER_AT)-11`: just below the ceiling, floating, the exact bug
reported. It now sits `worldY(CHAMBER_FLOOR_AT)-24`: on the floor. The light
shaft is one angled SVG wedge, narrow at the ceiling and widening as it
leans toward the floor, filled with a gradient that front-loads brightness
into roughly the first 10-15% of its height — a slow, shallow fade across
the *full* ceiling-to-floor distance was tried first and read as a flat tan
wash with no visible "light" to it, since almost everything on screen at
once sits well past where a gentle gradient has already faded out.
`mix-blend-mode` was tried too and does nothing useful here: it only adds
brightness against a base that already has some, and the base is
near-black. Brighter stops, a narrower beam, was the fix that actually
worked.

**`showChamberDiscovery(x)`** (`50-world.js`) wraps the light shaft, the
relic, and the `#chamberBox` panel into one call, used by both `reveal()`'s
breakthrough and `loadRound()`'s resume path — the same real bug class as
`digTo`/`settleAt` above: two copies of "what the chamber looks like on
discovery" drift apart the moment one of them changes and the other doesn't.

**The panel copy doesn't name the relic or the threshold.** It used to read
"Poly broke through past 95. A chipped blue marble is down here in the
dark." — both halves were wrong. `95` is a bare number the player has no
reason to recognise (and every other number in the game carries units or a
label; this one didn't). And naming the relic promised more than the game
delivers: it doesn't score, isn't in the share text, can't be collected —
so calling it out by name reads like a feature that's half-built, not a
flourish. The relic stays fully visible in the world (`placeRelic()`,
unchanged) — only the narration of it is gone. `RELICS` entries dropped
their `n` field for the same reason: once nothing reads it, keeping it
around implies something still does. Each entry keeps a `//` comment naming
what it draws, for whoever's editing the list next, not for the player.
Current copy: "The dirt gives way to open dark — nobody's ever been this
deep." — the fact of breaking through is the news; nothing else needs
saying.

**Poly floats instead of walking once she's past the ceiling.** `startFloat()`
is deliberately not a real fall or a tracked float path — there's no
corridor to clip against inside the void, so there's no per-frame interval
either, just the curled ball sprite (`renderBug("float")`) with a CSS
`chamberDrift` bob-and-sway loop. Cheaper than real physics, and there's no
walking surface for the side-to-side pacing loop to make sense on out there
anyway. In the reduced-motion kill-list alongside `.relic`/`.chamber`.

**Fixed in the same pass, required for any of the above to survive a
reload:** `chamberHit` was only ever persisted to `localStorage` by whatever
dig happened *after* the crossing one — `accept()`'s own `saveInProgress()`
call runs before `reveal()`'s 1050ms breakthrough timeout sets `chamberHit`,
and nothing re-saved it once that timeout fired. Cross the threshold as the
last dig of a session (a very plausible way to stop playing) and a reload
would resume with `chamberHit` still `false`: no relic, no float, a
corridor redrawn straight through the void — the exact bug this whole pass
was fixing, reappearing on resume. `reveal()` now calls `saveInProgress()`
again right after setting `chamberHit=true`.

## Known gaps

- **Off-list answers are always wrong.** A real version needs either exhaustive
  hand-authored lists or a model judging submissions at play time. This decision
  shapes how much content authoring costs, and hasn't been made.
- **No sound.**
- Content is three games, so `content/schedule.json`'s rotation repeats every
  three days. The hidden chamber at 95 is only reachable on the largest
  rounds, so reaching it is partly luck of the draw.
- The results screen is the least designed surface in the game, and it's the one
  people screenshot.
- **No cross-device sync.** A finished day lives in that browser's `localStorage`
  only — a different browser or device sees a fresh board for the same day.
