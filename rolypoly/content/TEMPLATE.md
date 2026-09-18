# Writing a round

One JSON file per round, inside `games/<number>/`. Five rounds make a game. Filenames
still need a numeric prefix to sort, but that prefix no longer decides play order —
see **difficulty** below for what does.

```json
{
  "domain": "Geography",
  "prompt": "Name a country that shares a land border with Germany.",
  "difficulty": 2,
  "par": 12,
  "answers": [
    {
      "name": "France",
      "value": 3,
      "fact": "The Rhine marks much of it; Alsace has changed hands four times since 1870.",
      "aliases": ["frankreich"]
    }
  ],
  "extras": [
    { "name": "Liechtenstein" }
  ],
  "distractors": [
    { "name": "Germany", "note": "That's the country in the prompt, not one of its neighbours." },
    { "name": "Austria", "note": "Borders Germany, but not one of the four this round counts.", "bust": true }
  ]
}
```

- **difficulty** — required, a whole number 1 to 5. Judged on **recall: how hard
  it is to produce *any* answer at all**, not on how deep the round goes or how
  hard it is to keep digging once you've started — those are a different
  question, and a round can be easy to open and still run long. 1 means most
  people produce an answer immediately (Girl Scout cookies, apple varieties); 5
  means many people will stall at a blank box (an element whose symbol is a
  single letter). `scripts/build.mjs` sorts each game's five rounds by this
  number, easiest to hardest, before the round is compiled — see "Ordering a
  game's rounds" below.
- **designNotes** — optional, a string. Author-facing only: never shown to
  players, never read by the engine (`build.mjs` drops it before compiling).
  For citing the authority behind a closed-set topic (see "Choosing a topic"
  below), or leaving any other rationale worth keeping attached to the file
  it's about instead of scattered in a commit message or this doc.
- **name** — the canonical answer. If a term is a brand and another is the real
  thing, the real thing is the name and the brand is an alias. (Cripps Pink is
  the variety; Pink Lady is the trademark.)
- **value** — centimetres, 1 to 60. See the tier table in the README.
- **fact** — one sentence, under 180 characters. Shown after the round ends.
- **aliases** — optional. Surnames and single distinctive words are matched
  automatically, so only add genuine alternate names.
- **par** — optional integer, the "you did fine" benchmark shown at the end of
  the round. When omitted it defaults to the sum of the three cheapest answers.
  The validator errors if par exceeds the round's total available value.
- **extras** — optional. Answers that are correct but sit outside the scoring
  fifteen — the cap on `answers` (the validator warns past 15). Each needs a
  **name** and, optionally, **aliases** — no value, no fact. Submitting one says
  so ("Right, but not one of today's fifteen") and the round carries on: it
  never scores, never busts, and never shows up in the reveal or in any count.
  An extra can't share a name or alias with a scoring answer in the same round
  (or with another extra) — the validator errors on that, since it would just
  make the scoring answer win the match and the extras entry dead.
- **distractors** — optional. Guesses that are never correct, but predictable
  enough to explain instead of just busting — a round asking for the school
  will keep getting the mascot, a round asking for a variety will keep getting
  the brand it's sold under. Each needs a **name** and a **note**: one sentence
  in your own voice saying what the guess actually is, shown as "'Buckeyes'
  isn't it — *note*. Nothing lost, try again." Like an extra, it never scores,
  can't share a name or alias with a scoring answer, an extra, or another
  distractor in the same round — and by default never busts either, since the
  usual case is a category mix-up the player can shrug off and retry.
  Set **bust: true** when the guess is wrong on the prompt's own merits
  instead — a real film Spielberg directed, just not "in the 2000s or later";
  a real Monopoly property, just not one named after a state. That's not a
  category mix-up to forgive, so it plays out as a normal bust (Rumble wakes,
  the round ends), just with the note as the reason instead of a bare "isn't
  on the list."

## Choosing a topic: closed sets only

Only build a round around a topic where a real authority fixes the answer
count — not one that can keep growing no matter how thorough the list gets.
Real incident: "Name a moon of Saturn" shipped with 15 hand-picked answers,
but Saturn has 274 confirmed moons and rising (ongoing discovery, not a fixed
body of fact) — any list was wrong by construction, not by oversight. A
tester correctly answered "Telesto" and busted anyway. No amount of adding
more answers would have fixed that round; the topic itself was open-ended.

Replaced with "Name a planet in the solar system" — eight, fixed by the
IAU's 2006 definition (the same resolution that reclassified Pluto), and
closed: no future discovery can add a ninth without the IAU redefining the
term. Before starting a new round, check whether a governing body, a fixed
historical event, or a finite official count actually closes the set. If it
can't, the round needs a different topic, not a longer list — cite the
authority in `designNotes` once you've found one, so the next person editing
the file knows the set is safe to treat as complete.

Prefer narrowing the prompt over demoting answers into extras when a round runs
long — a tighter prompt keeps the round honest about what it's actually asking;
extras are the fallback for a set of answers people genuinely know in full,
where there's no honest way to narrow further. When choosing which answers stay
in the scoring fifteen, keep the round's shape, not just its size: at least
three answers under 8 (a safe opening move), a spread through the middle, and
two or three genuine deep cuts (a reason to keep digging). Cutting only the
obscure ones removes the round's ceiling.

## Ordering a game's rounds

Five rounds, sorted easiest to hardest by `difficulty` (`scripts/order-rounds.mjs`,
shared by `build.mjs` and `validate.mjs`), so the day builds instead of running in
whatever order the files happen to sort in. Filename order is only the tiebreak
between two rounds that share a difficulty.

Two rules on top of the plain sort:

- **Never open a game on a 4 or 5.** The first round sets whether someone keeps
  playing. `validate.mjs` warns if the round that would actually open the game
  (after sorting) is above 2.
- **Never run two rounds of the same difficulty back to back, if it can be
  avoided.** A plain ascending sort can force this when a difficulty repeats —
  five rounds with difficulties `{1, 2, 2, 3, 4}` put the two 2's next to each
  other in any non-decreasing order. When that happens, `orderRounds()` pulls
  the next differently-valued round forward to break the run, accepting a
  small, local dip out of strict ascending order rather than ship two
  same-difficulty rounds back to back. `{1, 2, 2, 3, 4}` becomes
  `1, 2, 3, 2, 4` — not `1, 2, 2, 3, 4`.

**Difficulty is about recall, not depth — the distinction most likely to get
flattened later.** They're independent axes. "How hard is it to think of a
single answer at all" (recall/difficulty) is not "how hard is it to keep the
round going once you're in it" (depth — answer count, value spread, how deep
the tail runs). A round can be trivial to open and still run long: Food's Girl
Scout cookies (difficulty 1) has eleven answers. A round can also be a hard
open that, once you're past the first answer, isn't especially deep. Rate
difficulty on the opening move alone — could most people type *something* into
the box without stalling — and let a hard-to-open round land late in the day
even if it wouldn't objectively be the longest round to play out.

Run `npm run validate` before committing.
