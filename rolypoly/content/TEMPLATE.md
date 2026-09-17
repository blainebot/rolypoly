# Writing a round

One JSON file per round, inside `games/<number>/`. Five rounds make a game. Filenames sort, so prefix with a number.

```json
{
  "domain": "Geography",
  "prompt": "Name a country that shares a land border with Germany.",
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

Prefer narrowing the prompt over demoting answers into extras when a round runs
long — a tighter prompt keeps the round honest about what it's actually asking;
extras are the fallback for a set of answers people genuinely know in full,
where there's no honest way to narrow further. When choosing which answers stay
in the scoring fifteen, keep the round's shape, not just its size: at least
three answers under 8 (a safe opening move), a spread through the middle, and
two or three genuine deep cuts (a reason to keep digging). Cutting only the
obscure ones removes the round's ceiling.

Run `npm run validate` before committing.
