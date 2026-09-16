#!/usr/bin/env node
// Assembles src/ + content/ into a single self-contained dist/index.html.
// No bundler, no dependencies. The output is one file you can drag anywhere.

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => readFileSync(join(root, ...p), "utf8");

// --- content: every game folder, keyed by its number ---
const gamesDir = join(root, "content", "games");
const config = JSON.parse(read("content", "config.json"));

const defaultPar = answers =>
  answers.map(a => a.value).sort((a, b) => a - b).slice(0, 3).reduce((s, v) => s + v, 0);

const toEngine = r => ({
  domain: r.domain,
  prompt: r.prompt,
  par: typeof r.par === "number" ? r.par : defaultPar(r.answers),
  ...(r.scene ? { s: r.scene } : {}),
  answers: r.answers.map(a => ({
    n: a.name,
    v: a.value,
    f: a.fact,
    ...(a.aliases && a.aliases.length ? { alias: a.aliases } : {})
  })),
  // Correct but outside the scoring fifteen — no value, no fact, never in
  // avail()'s pool, so they can't score, bust, or show up in the reveal.
  ...(r.extras && r.extras.length ? {
    extras: r.extras.map(x => ({
      n: x.name,
      ...(x.aliases && x.aliases.length ? { alias: x.aliases } : {})
    }))
  } : {})
});

const games = {};
for (const num of readdirSync(gamesDir).sort()) {
  const files = readdirSync(join(gamesDir, num)).filter(f => f.endsWith(".json")).sort();
  games[num] = files.map(f => toEngine(JSON.parse(readFileSync(join(gamesDir, num, f), "utf8"))));
}

// --- schedule: which game plays on which day ---
const schedule = JSON.parse(read("content", "schedule.json"));
if (!/^\d{4}-\d{2}-\d{2}$/.test(schedule.start))
  throw new Error(`content/schedule.json's "start" must be YYYY-MM-DD, got ${JSON.stringify(schedule.start)}`);
if (!Array.isArray(schedule.order) || !schedule.order.length)
  throw new Error(`content/schedule.json's "order" must be a non-empty array of game numbers`);
for (const num of schedule.order)
  if (!games[num]) throw new Error(`content/schedule.json's order references game "${num}", but content/games/${num} does not exist`);

// config.activeGame is a manual override for local development — leave it
// null in production so the schedule (and therefore the puzzle day) decides.
const override = config.activeGame || null;
if (override && !games[override])
  throw new Error(`config.activeGame is "${override}" but content/games/${override} does not exist`);

// gameForDay() can't run until DAY exists (src/js/20-random.js, later in the
// concatenated script — see CLAUDE.md "Puzzle day"), so this block only
// defines the data and the function; 20-random.js calls it once DAY is set.
const roundsJs =
  "const GAMES=" + JSON.stringify(games) + ";\n" +
  "const SCHEDULE=" + JSON.stringify(schedule) + ";\n" +
  `const CONFIG_OVERRIDE=${JSON.stringify(override)};\n` +
  "function gameForDay(day){\n" +
  '  const days=Math.round((Date.parse(day+"T00:00:00Z")-Date.parse(SCHEDULE.start+"T00:00:00Z"))/86400000);\n' +
  "  const n=SCHEDULE.order.length;\n" +
  "  return SCHEDULE.order[((days%n)+n)%n];\n" +
  "}";

// --- engine: numbered modules, concatenated in order ---
const jsDir = join(root, "src", "js");
const modules = readdirSync(jsDir).filter(f => f.endsWith(".js")).sort();
const engine = modules
  .map(f => `/* ---- ${f} ---- */\n` + readFileSync(join(jsDir, f), "utf8"))
  .join("\n");

const script = engine.replace("/*__ROUNDS__*/", roundsJs);
if (script.includes("/*__ROUNDS__*/") || !script.includes("const GAMES=")) {
  throw new Error("ROUNDS placeholder not found or not replaced in src/js — check 00-tiers.js");
}
if (!script.includes("const ROUNDS=GAMES[GAMENO]")) {
  throw new Error("src/js/20-random.js should define ROUNDS from GAMES[GAMENO] once DAY exists — check it wasn't removed");
}

const styles = read("src", "css", "styles.css");
const html = read("src", "template.html")
  .replace("/*__STYLES__*/", styles)
  .replace("/*__SCRIPT__*/", script);

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist", "index.html"), html);

const kb = n => (n / 1024).toFixed(1) + "KB";
console.log(`built dist/index.html  ${kb(html.length)}`);
for (const [num, g] of Object.entries(games)) {
  const answers = g.reduce((n, r) => n + r.answers.length, 0);
  const possible = g.reduce((n, r) => n + r.answers.reduce((m, a) => m + a.v, 0) + 10 + Math.max(0, r.answers.length - 2) * 2, 0);
  const tag = override === num ? " (config override)" : schedule.order.includes(num) ? "" : " (not scheduled)";
  console.log(`  game ${num}${tag}  ${g.length} rounds, ${answers} answers, ${possible} possible`);
}
console.log(`  ${modules.length} modules, ${kb(styles.length)} css`);
console.log(
  override
    ? `  schedule: starts ${schedule.start}, order ${schedule.order.join(" → ")} — overridden to ${override}`
    : `  schedule: starts ${schedule.start}, order ${schedule.order.join(" → ")} — no override, date-driven`
);
