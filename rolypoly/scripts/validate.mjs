#!/usr/bin/env node
// Checks every round file before it can ship. These are the mistakes that
// actually bit us while building: a canonical name that should have been the
// alias, a value outside its tier, an alias that collides with another answer.

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { orderRounds } from "./order-rounds.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const gamesDir = join(root, "content", "games");

const MIN_ANSWERS = 6;
const MAX_SCORING = 15;
const MIN_VALUE = 1;
const MAX_VALUE = 60;
const MAX_FACT = 180;

// Same normalisation the game uses, so collisions are caught the way players hit them.
const norm = s =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "").replace(/^(the|a|an) /, "")
    .replace(/\s+/g, " ").trim();

const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 5;
const OPENER_MAX = 2; // never open a game above this — see content/TEMPLATE.md

const errors = [];
const warnings = [];
const files = [];
for (const num of readdirSync(gamesDir).sort()) {
  for (const f of readdirSync(join(gamesDir, num)).filter(f => f.endsWith(".json")).sort())
    files.push({ num, f, file: join(num, f) });
}
if (!files.length) errors.push("no round files found in content/games/");

// Rounds with a valid difficulty, grouped by game, so the "never open above
// 2" rule can be checked against the order the build will actually produce
// (orderRounds(), shared with build.mjs) — not filename order, which no
// longer means anything past being its tiebreak.
const byGame = new Map();

const gameFolders = readdirSync(gamesDir);

// config.activeGame is an optional manual override for local development;
// null/absent means the schedule decides, which is the production default.
const config = JSON.parse(readFileSync(join(root, "content", "config.json"), "utf8"));
if (config.activeGame && !gameFolders.includes(config.activeGame))
  errors.push(`config.activeGame is "${config.activeGame}" but that folder does not exist`);

const schedule = JSON.parse(readFileSync(join(root, "content", "schedule.json"), "utf8"));
if (!/^\d{4}-\d{2}-\d{2}$/.test(schedule.start))
  errors.push(`content/schedule.json's "start" must be YYYY-MM-DD, got ${JSON.stringify(schedule.start)}`);
if (!Array.isArray(schedule.order) || !schedule.order.length)
  errors.push(`content/schedule.json's "order" must be a non-empty array of game numbers`);
else
  for (const num of schedule.order)
    if (!gameFolders.includes(num))
      errors.push(`content/schedule.json's order references game "${num}", but content/games/${num} does not exist`);

for (const { num, f, file } of files) {
  const where = m => `${file}: ${m}`;
  let r;
  try {
    r = JSON.parse(readFileSync(join(gamesDir, file), "utf8"));
  } catch (e) {
    errors.push(where("invalid JSON — " + e.message));
    continue;
  }

  if (!r.domain) errors.push(where("missing domain"));
  if (!r.prompt) errors.push(where("missing prompt"));
  if (r.prompt && !/[.?]$/.test(r.prompt)) warnings.push(where("prompt has no end punctuation"));
  if (r.note !== undefined && typeof r.note !== "string")
    errors.push(where("note must be a string"));

  // Closed set or not (see "Choosing a topic" in content/TEMPLATE.md) —
  // optional so the fourteen rounds written before this existed don't all
  // need retrofitting, but type-checked when present, and `closed: false`
  // gets a warning on *every* validate run, not just when first written.
  // That persistence is the point: a one-time note would age exactly the
  // way the old moons round did — quietly, until a player hit the gap.
  if (r.closed !== undefined && typeof r.closed !== "boolean")
    errors.push(where('"closed" must be true or false'));
  else if (r.closed === false)
    warnings.push(where(`open set — review before it goes stale${r.note ? `: ${r.note}` : " (no note explaining the mitigation)"}`));

  // Judged on recall — how hard it is to produce ANY answer at all — never
  // on how deep the round goes. Those are different: a round can be an easy
  // opener and still run long once you're in it. See content/TEMPLATE.md.
  const hasDifficulty = typeof r.difficulty === "number" && Number.isInteger(r.difficulty)
    && r.difficulty >= MIN_DIFFICULTY && r.difficulty <= MAX_DIFFICULTY;
  if (!hasDifficulty)
    errors.push(where(`difficulty must be a whole number ${MIN_DIFFICULTY}-${MAX_DIFFICULTY} (got ${JSON.stringify(r.difficulty)}) — 1 means most people produce an answer immediately, 5 means many people will stall at a blank box`));
  else {
    if (!byGame.has(num)) byGame.set(num, []);
    byGame.get(num).push({ r, f });
  }

  if (!Array.isArray(r.answers)) { errors.push(where("answers is not an array")); continue; }

  const n = r.answers.length;
  if (n < MIN_ANSWERS) errors.push(where(`only ${n} answers (minimum ${MIN_ANSWERS})`));
  if (n > MAX_SCORING) warnings.push(where(`${n} scoring answers — past ${MAX_SCORING}, the "safe opener / spread / a couple of deep cuts" shape gets hard to hold onto and the round drags; a correct answer should still score no matter how long the list gets, so this is a nudge to check the round's shape, not a cue to cut anything`));

  const seen = new Map();   // normalised string -> which answer claimed it
  const values = [];

  for (const a of r.answers) {
    const label = a.name || "(unnamed)";
    if (!a.name) errors.push(where("an answer has no name"));
    if (typeof a.value !== "number" || !Number.isInteger(a.value))
      errors.push(where(`${label}: value must be a whole number`));
    else {
      if (a.value < MIN_VALUE || a.value > MAX_VALUE)
        errors.push(where(`${label}: value ${a.value} outside ${MIN_VALUE}-${MAX_VALUE}`));
      values.push(a.value);
    }
    if (!a.fact) errors.push(where(`${label}: missing fact`));
    else if (a.fact.length > MAX_FACT)
      warnings.push(where(`${label}: fact is ${a.fact.length} chars (aim under ${MAX_FACT})`));

    for (const s of [a.name, ...(a.aliases || [])]) {
      if (!s) continue;
      const k = norm(s);
      if (!k) { errors.push(where(`${label}: "${s}" normalises to nothing`)); continue; }
      if (seen.has(k) && seen.get(k) !== label)
        errors.push(where(`"${s}" is claimed by both ${seen.get(k)} and ${label}`));
      seen.set(k, label);
    }
  }

  // Extras: correct but outside the scoring pool. No value, no fact — they
  // never score and never bust, so nothing about them feeds the value/par
  // checks below. They still have to not secretly BE a scoring answer,
  // which is the one way an extra could actually hurt a player: claim it
  // in dig()'s exact/fuzzy scoring check first and it'd score or confirm
  // like normal, making the "extras" entry dead, unreachable content.
  if (r.extras !== undefined) {
    if (!Array.isArray(r.extras)) errors.push(where("extras is not an array"));
    else for (const x of r.extras) {
      const label = x.name || "(unnamed extra)";
      const tag = `extra: ${label}`;
      if (!x.name) errors.push(where("an extra has no name"));
      if (x.fact !== undefined && typeof x.fact !== "string") errors.push(where(`extra ${label}: fact must be a string`));
      for (const s of [x.name, ...(x.aliases || [])]) {
        if (!s) continue;
        const k = norm(s);
        if (!k) { errors.push(where(`extra ${label}: "${s}" normalises to nothing`)); continue; }
        if (seen.has(k) && seen.get(k) !== tag)
          errors.push(where(`extra "${s}" (${label}) collides with "${seen.get(k)}"`));
        seen.set(k, tag);
      }
    }
  }

  // Distractors: never correct, so — like extras — no value or fact, and
  // the same collision rule applies for the same reason (a distractor
  // sharing text with a scoring answer would just be dead content, always
  // beaten to the match by the real answer). Each also needs a `note`,
  // since a distractor with nothing to say is just a worse bust message.
  if (r.distractors !== undefined) {
    if (!Array.isArray(r.distractors)) errors.push(where("distractors is not an array"));
    else for (const x of r.distractors) {
      const label = x.name || "(unnamed distractor)";
      const tag = `distractor: ${label}`;
      if (!x.name) errors.push(where("a distractor has no name"));
      if (!x.note) errors.push(where(`distractor ${label}: missing note`));
      if (x.bust !== undefined && typeof x.bust !== "boolean")
        errors.push(where(`distractor ${label}: "bust" must be true or false`));
      for (const s of [x.name, ...(x.aliases || [])]) {
        if (!s) continue;
        const k = norm(s);
        if (!k) { errors.push(where(`distractor ${label}: "${s}" normalises to nothing`)); continue; }
        if (seen.has(k) && seen.get(k) !== tag)
          errors.push(where(`distractor "${s}" (${label}) collides with "${seen.get(k)}"`));
        seen.set(k, tag);
      }
    }
  }

  if (values.length) {
    const total = values.reduce((s, v) => s + v, 0);
    const par = [...values].sort((a, b) => a - b).slice(0, 3).reduce((s, v) => s + v, 0);
    if (r.par === undefined)
      warnings.push(where(`no par set — defaulting to ${par} (sum of three cheapest answers)`));
    else if (typeof r.par !== "number" || !Number.isInteger(r.par))
      errors.push(where("par must be a whole number"));
    else if (r.par > total)
      errors.push(where(`par ${r.par} exceeds ${total}, the round's total available value`));
  }

  // A round with no cheap answers has no safe opening move.
  if (values.length && Math.min(...values) > 8)
    warnings.push(where(`cheapest answer is ${Math.min(...values)} — no easy way in`));

  // A round where everything is worth the same has no press-your-luck curve.
  if (values.length && Math.max(...values) - Math.min(...values) < 8)
    warnings.push(where("values are too flat to make digging a real decision"));

  const dupes = values.filter((v, i) => values.indexOf(v) !== i);
  if (new Set(dupes).size > Math.ceil(n / 3))
    warnings.push(where("many answers share the same value — consider spreading them"));
}

// The first round sets whether someone keeps playing — warn if the round
// orderRounds() would actually open the game with is harder than that's
// worth risking. Checked against the real sort, not filename order.
for (const [num, entries] of byGame) {
  const ordered = orderRounds(entries.map(e => e.r));
  const openerIdx = entries.findIndex(e => e.r === ordered[0]);
  const opener = entries[openerIdx];
  if (opener.r.difficulty > OPENER_MAX)
    warnings.push(`${num}/${opener.f}: opens the game after sorting (difficulty ${opener.r.difficulty}) — first round of a game should be ${MIN_DIFFICULTY}-${OPENER_MAX}`);
}

for (const w of warnings) console.log("warn  " + w);
for (const e of errors) console.log("ERROR " + e);

console.log(`\n${files.length} rounds checked · ${errors.length} errors · ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
