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
npm run check     # validate content, then build
npm run build     # writes dist/index.html
npm run validate  # content checks only
npm run serve     # build and serve dist/ locally
```

**`npm run check` must pass before any commit.** Vercel runs the same two scripts,
so a failure there means a failed deploy.

## Hard constraints

- **The build output is one self-contained HTML file.** No external assets beyond
  Google Fonts. This is what makes it droppable on any host and testable offline.
  Don't introduce a step that breaks it.
- **No dependencies, no framework, no bundler, no TypeScript.** `package.json` has
  an empty dependency list and should stay that way.
- `src/js/*.js` are numbered because they are **concatenated, not imported**. They
  share one scope. Keep the numbers spaced so a module can be inserted.
- `00-tiers.js` contains the marker `/*__ROUNDS__*/`, which the build replaces with
  compiled content. Don't remove it.

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

## Writing content

One JSON file per round in `content/games/<num>/`; five rounds make a game.
`content/config.json` picks which game is live. See `content/TEMPLATE.md`.

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

- **No daily rotation or persistence.** `config.json` selects the game by hand. All
  games are bundled at build time, so rotation is a date lookup away.
- **Off-list answers are always wrong.** A real version needs either exhaustive
  hand-authored lists or a model judging submissions at play time. This decision
  shapes how much content authoring costs, and hasn't been made.
- **No sound.**
- Content is two games. The hidden chamber at 95 is only reachable on the largest
  rounds, so reaching it is partly luck of the draw.
- The results screen is the least designed surface in the game, and it's the one
  people screenshot.
