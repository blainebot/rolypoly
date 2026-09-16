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

Prefer narrowing the prompt over demoting answers into extras when a round runs
long — a tighter prompt keeps the round honest about what it's actually asking;
extras are the fallback for a set of answers people genuinely know in full,
where there's no honest way to narrow further. When choosing which answers stay
in the scoring fifteen, keep the round's shape, not just its size: at least
three answers under 8 (a safe opening move), a spread through the middle, and
two or three genuine deep cuts (a reason to keep digging). Cutting only the
obscure ones removes the round's ceiling.

Run `npm run validate` before committing.
