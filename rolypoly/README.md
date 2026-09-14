# rolypoly.gg

A daily press-your-luck trivia dig. Five prompts, five unrelated domains. Every
right answer digs Poly deeper. Dig again to keep going, or bank and roll to lock
in the round. One wrong answer wakes Rumble and wipes out everything unbanked.

The whole game is one self-contained HTML file with no runtime dependencies. Which
game plays is a date lookup (see "Daily rotation" below), and it's once per day —
finishing shows that day's results on every return visit, with a way to review
what you found, until the next one rolls over. The results screen also shows how
your score compares to today's other players; that one piece calls out to a small
hosted API and fails silently to nothing shown if it can't reach it — see "Score
comparison" below.

## Running it

```bash
npm run check     # validate content, build, then smoke-test the result
npm run serve     # build and serve dist/ locally
```

`npm run build` writes `dist/index.html`. That file is the game — open it
directly, drag it onto any static host, or email it to someone.

## Hosting

The build output is a single static file, so anything that serves static files
works. Three routes, in order of how much extra you have to set up:

**GitHub Pages — nothing extra.** `.github/workflows/pages.yml` already builds and
publishes on every push to main. Turn it on once under Settings → Pages → Source →
"GitHub Actions". The catch: on a free personal account Pages only serves from a
**public** repository. Private repos need GitHub Pro. The URL is
`https://<you>.github.io/rolypoly/` — the built file has no relative paths, so
serving from a subfolder is fine.

**Vercel — one signup, zero configuration, works with a private repo.**
`vercel.json` already sets the build command and output directory, so importing the
repo is the whole job. Note the free Hobby plan is for non-commercial use; if the
game ever earns money it needs a paid plan. Vercel is also the only host that runs
`api/score.js`; the other three still serve the static game fine, they just won't
have score comparison unless `src/js/95-scores.js`'s `SCORES_API` points at a
Vercel deployment that does. See "Score comparison" below.

**Cloudflare Pages — one signup, works with a private repo.** It does not read any
config file, so enter these by hand:

| Setting          | Value                                                                      |
|------------------|-----------------------------------------------------------------------------|
| Build command    | `node scripts/validate.mjs && node scripts/build.mjs && node scripts/smoke.mjs` |
| Output directory | `dist`                                                                     |
| Framework preset | None                                                                       |

**Netlify — one signup, zero configuration.** `netlify.toml` already specifies the
build command and publish folder, so importing the repo is the whole job.

All four give branch previews and rebuild on push. Pick on whether the repo needs
to stay private.

## Layout

```
src/
  template.html      page shell
  css/styles.css     all styling
  js/                engine, concatenated in filename order
content/
  schedule.json      which game plays on which day
  config.json        manual game override, for local development
  games/001/*.json   one folder per game, five rounds each
  games/002/*.json
scripts/
  build.mjs          inlines everything into dist/index.html
  validate.mjs       checks content before it can ship
  smoke.mjs          plays scripted games against the built engine
api/
  score.js           Vercel function backing the optional score comparison
```

The `src/js/` files are numbered because they are concatenated, not imported.
They share one scope, exactly as the original single file did. Keep the numbers
spaced so you can insert a module without renaming everything.

`00-tiers.js` contains the marker `/*__ROUNDS__*/`, which the build replaces
with the compiled content. Don't remove it.

## Writing content

See `content/TEMPLATE.md`. Add a game by creating `content/games/<num>/` with
five round files, then appending its number to `order` in
`content/schedule.json` so it enters the rotation. Every game is bundled into
the build regardless; which one plays on a given day is a date lookup against
the schedule (`content/config.json`'s `activeGame` overrides that for local
testing — leave it `null` to ship). Run `npm run validate` before committing —
it catches missing facts, colliding aliases, out-of-range values, and rounds
with no cheap opening answer.

## Tier rules

A value is in centimetres and decides both the score and the colour of Poly's
shell when she finds it. Assign by how many people could produce the answer, not
by how much you personally like it.

| Tier        | Value | The kind of answer it is                                   |
|-------------|-------|------------------------------------------------------------|
| Leaf litter | 1–7   | Most people who know the topic at all name this first       |
| Topsoil     | 8–14  | Comes up if you think for a moment                          |
| Root line   | 15–24 | You need to actually know the subject                       |
| Bedrock     | 25+   | A genuine deep cut; most players will never reach it        |

Two rules that matter more than the exact numbers:

1. **Every round needs at least one answer under 8.** Without a cheap opening
   move there is no safe first dig, and the round becomes a coin flip.
2. **Spread the values.** If everything is worth 10, digging again is a free
   decision and the game stops being about restraint. The validator warns when
   a round's range is under 8.

Anchor values to something measurable rather than instinct — Wikipedia pageviews
bucketed into the four bands works well — then hand-adjust the outliers. The
values currently in the repo were assigned by feel and should be re-derived once
there is a rule.

## Rumble's costumes

Each round can name a `scene` in its JSON; without one it falls back to the domain
name. Scene art lives in `SCENE` in `src/js/40-sprites.js` and fills up to four
slots: `hat`, `prop`, `eyes` and `float`. Everything on his body goes inside the
scaled figure group; anything drifting around him goes in `float`.

A scene can also set `bg` to recolour the whole Rumble panel. Without one it
falls back to red (`--bust`, #B93A2B), which is the trap: red, maroon and mid
navy props vanish against it. Either pick a `bg` that suits the scene, or keep
props above roughly 1.8:1 contrast with the red. Whatever you choose, the panel
text and the "Shake it off" button are cream, so the background has to stay dark
enough to read them.

Two traps, both of which caught us: a red prop on the red default panel is
invisible, and a near-black prop is invisible on any dark background. Rumble's
own fur is #B0824F, so a scene that also has black props needs a mid-tone
background — roughly 0.06 to 0.13 relative luminance — to keep both readable.
When a prop can't avoid a clash, put a cream plate behind it, as the German flag
does.

Use `.sc-<scene> .figure` to scale or shift him when a prop needs the room.

## Answer matching

Players' answers are matched in this order, and none of these cost them a round:

1. Exact match against the canonical name or an alias.
2. Partial match — a surname, or any distinctive word of four or more letters.
   Ambiguous partials ask the player to be more specific.
3. Fuzzy match by edit distance, tolerance scaled to word length. Offered as
   "Did you mean X?" rather than accepted silently, so a lucky typo never scores
   an answer the player didn't know.

Only an answer that fails all three wakes Rumble.

## Daily rotation

`content/schedule.json` sets which game plays on which day: a start date and
an ordered list of game numbers, cycling one per day and wrapping around
indefinitely. Append a new game's number to the list to add it to the
rotation — that's the only edit a new game needs to actually go live.
`content/config.json`'s `activeGame` overrides the schedule for local
development (testing one specific game without waiting for its day); it
should be `null` in production.

The game is playable once per day. Finishing writes the result — score,
what was found and missed each round, the share text — to that browser's
`localStorage`, keyed to the day and the game actually played. Returning
later the same day shows that result again, with a "Review your answers"
section, rather than a fresh board; a different day (or a different browser
or device — there's no server-side account) gets a fresh board of its own.
"Practice dig" from the results screen replays the same prompts without
touching any of this — it doesn't count, and doesn't overwrite the real
result.

## Score comparison

The results screen shows a small histogram and "you scored better than N% of
today's players," backed by `api/score.js` — a Vercel function that stores
nothing but a per-game count of scores bucketed into a histogram, in Redis
(Upstash, connected once via the project's Storage tab in the Vercel
dashboard — not something a config file can do for you). Once connected,
Vercel sets `KV_REST_API_URL` / `KV_REST_API_TOKEN` in the project's
environment variables automatically; the function also accepts
`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` if you wire it up by hand.

Without that store connected, the endpoint responds 503 and the client just
doesn't show the comparison — same as if it's offline. Nothing about a player
is stored beyond the bucketed count: no IP, no identity, no per-submission
record. Below 50 recorded scores for a game the curve stays hidden entirely
and only the par comparison shows; there's no meaningful curve to draw yet.

This isn't hardened against someone forging a request by hand — submitted
scores are checked against that game's real maximum, but there's no
server-side replay of the scoring engine to confirm a score was actually
earned. Fine for an ambient stat with no stakes; would need real work if that
ever changes.

## Known gaps

- Off-list answers are always wrong. A real version needs either exhaustive
  hand-authored lists or a model judging submissions at play time.
- No sound.
- Content is two games (ten rounds), not a bank — the rotation in
  `content/schedule.json` repeats every two days until more are added.
- No cross-device sync. A finished day lives in that browser's `localStorage`
  only.
