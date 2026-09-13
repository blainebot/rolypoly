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

Run `npm run validate` before committing.
