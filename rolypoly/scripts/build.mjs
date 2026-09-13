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
  }))
});

const games = {};
for (const num of readdirSync(gamesDir).sort()) {
  const files = readdirSync(join(gamesDir, num)).filter(f => f.endsWith(".json")).sort();
  games[num] = files.map(f => toEngine(JSON.parse(readFileSync(join(gamesDir, num, f), "utf8"))));
}

const active = config.activeGame;
if (!games[active]) throw new Error(`config.activeGame is "${active}" but content/games/${active} does not exist`);

const roundsJs =
  "const GAMES=" + JSON.stringify(games) + ";\n" +
  `const GAMENO=${JSON.stringify(active)};\n` +
  "const ROUNDS=GAMES[GAMENO];";

// --- engine: numbered modules, concatenated in order ---
const jsDir = join(root, "src", "js");
const modules = readdirSync(jsDir).filter(f => f.endsWith(".js")).sort();
const engine = modules
  .map(f => `/* ---- ${f} ---- */\n` + readFileSync(join(jsDir, f), "utf8"))
  .join("\n");

const script = engine.replace("/*__ROUNDS__*/", roundsJs);
if (!script.includes("const ROUNDS=")) {
  throw new Error("ROUNDS placeholder not found in src/js — check 00-tiers.js");
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
  console.log(`  game ${num}${num === active ? " (active)" : "         "}  ${g.length} rounds, ${answers} answers, ${possible} possible`);
}
console.log(`  ${modules.length} modules, ${kb(styles.length)} css`);
