#!/usr/bin/env node
// For every scoring answer in every round, derives the guesses a real player
// would plausibly type — from the name, and separately from each alias — and
// checks each one against the real matcher (src/js/10-matching.js, loaded and
// run for real, never reimplemented) plus dig()'s own exact/extras/distractors
// order (70-game.js). Nothing here is a hand-written list of guesses; every
// one is mechanically derived from the content itself, so this scales with
// the content instead of going stale next to it.
//
// Four outcomes per guess:
//   OK         resolves to the answer it was derived from (exact, or offered
//              as a "did you mean?" confirm)
//   WRONG      resolves to a DIFFERENT answer — the worst case, a real bug
//   AMBIGUOUS  several answers match — "be more specific," nothing lost
//   BUST       matches nothing (or is swallowed by an extra/distractor,
//              which also means the intended answer got no credit)
//
// Exit code is non-zero only on WRONG or BUST. AMBIGUOUS is reported but
// never fails the build — plenty of ambiguity is correct (eleven Monopoly
// avenues all plausibly answering "avenue" isn't a bug), and it's exactly
// the kind of judgment call this script hands to a person instead of a gate.

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const gamesDir = join(root, "content", "games");

// ---------- load the real matcher, run for real ----------
// 10-matching.js is pure (no DOM) — see CLAUDE.md "Answer matching" — so it
// runs in a bare vm context, the same trick smoke.mjs uses to run the real
// engine rather than reimplementing it. norm/fuzzyMatches are top-level
// `const`, which (like smoke.mjs's epilogue notes) never become properties
// of the sandbox's global object on their own; the explicit export does.
const matchingSrc = readFileSync(join(root, "src", "js", "10-matching.js"), "utf8");
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(matchingSrc + "\n;globalThis.__MATCH__={norm,fuzzyMatches};", sandbox, {
  filename: "src/js/10-matching.js",
});
const { norm, fuzzyMatches } = sandbox.__MATCH__;

// ---------- deriving plausible guesses ----------
function singularize(tok) {
  if (tok.endsWith("ies") && tok.length > 4) return tok.slice(0, -3) + "y";
  if (tok.endsWith("es") && tok.length > 3) return tok.slice(0, -2);
  if (tok.endsWith("s") && tok.length > 2) return tok.slice(0, -1);
  return null;
}
function pluralize(tok) {
  if (/[sxz]$/.test(tok) || /(ch|sh)$/.test(tok)) return tok + "es";
  if (/[^aeiou]y$/.test(tok)) return tok.slice(0, -1) + "ies";
  return tok + "s";
}

// Every rule below runs once against the canonical name, and once more
// against each alias independently (see dig()'s own rule: an alias is a
// genuine alternate name, matched exactly the same way the name is).
function deriveGuesses(s) {
  const guesses = new Set();
  const add = (g) => {
    if (g && g.trim()) guesses.add(g.trim().toLowerCase());
  };

  add(s); // the full name/alias, lowercased

  const tokens = s.split(/[\s-]+/).filter(Boolean);
  for (const t of tokens) if (t.length >= 2) add(t); // every token, down to 2 chars
  if (tokens.length > 1) {
    add(tokens[tokens.length - 1]); // last token alone
    add(tokens[0]); // first token alone
  }
  if (tokens.length > 2) add(`${tokens[0]} ${tokens[tokens.length - 1]}`); // first+last, middle dropped

  const noArticle = s.replace(/^(the|a|an)\s+/i, "");
  if (noArticle !== s) add(noArticle); // without a leading article

  add(s.replace(/[\s-]+/g, "")); // hyphens and spaces removed

  for (const t of tokens) {
    if (t.length < 2) continue;
    const sing = singularize(t);
    if (sing && sing.length >= 2) add(sing);
    add(pluralize(t)); // singular and plural of each token
  }

  const full = s.toLowerCase();
  if (full.length > 3) {
    const delPositions = [...new Set([1, Math.floor(full.length / 3), Math.floor((2 * full.length) / 3), full.length - 2])].filter(
      (i) => i >= 0 && i < full.length
    );
    for (const i of delPositions) add(full.slice(0, i) + full.slice(i + 1)); // one char deleted

    const swapPositions = [...new Set([0, Math.floor(full.length / 3), Math.floor((2 * full.length) / 3)])].filter(
      (i) => i >= 0 && i < full.length - 1
    );
    for (const i of swapPositions) {
      const chars = full.split("");
      [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
      add(chars.join("")); // two adjacent chars swapped
    }
  }

  return [...guesses];
}

// ---------- resolving a guess, mirroring dig() in 70-game.js ----------
// Exact match first (name or alias, verbatim), then fuzzyMatches against the
// scoring pool, then extras, then distractors — the same order dig() checks
// them in, replicated here (not imported) only because dig() lives inside
// the concatenated engine, not as a standalone module; keep this in sync if
// dig()'s order ever changes.
function adapt(list) {
  return (list || []).map((x) => ({ n: x.name, alias: x.aliases || [], bust: !!x.bust }));
}
function findExact(key, list) {
  return list.find((a) => norm(a.n) === key || a.alias.some((al) => norm(al) === key));
}
function resolveGuess(guess, pool, extras, distractors) {
  const key = norm(guess);
  const exact = findExact(key, pool);
  if (exact) {
    // Mirrors dig()'s own sibling-ambiguity check in 70-game.js: an exact
    // match that's also a clean word-boundary prefix of a *different*
    // answer's name ("michigan" naming Michigan, but also the whole first
    // word of "Michigan State") is ambiguous, not a free pass to the
    // shorter name. The probe has no "already found" state (every answer
    // is checked as if the round just started), so unlike the engine this
    // never collapses back down to a single live candidate — a sibling
    // pair is always ambiguous here, which is exactly the first-guess-of-
    // the-round case the engine's extra collapsing logic doesn't apply to.
    const siblings = pool.filter((a) => a !== exact && norm(a.n).startsWith(key + " "));
    if (siblings.length) return { type: "ambiguous", matches: [exact, ...siblings] };
    return { type: "exact", answer: exact };
  }

  const matches = fuzzyMatches(key, pool);
  if (matches.length === 1) return { type: "confirm", answer: matches[0] };
  if (matches.length > 1) return { type: "ambiguous", matches };

  if (extras.length) {
    const hit = findExact(key, extras) || fuzzyMatches(key, extras)[0];
    if (hit) return { type: "extra", answer: hit };
  }
  if (distractors.length) {
    const hit = findExact(key, distractors) || fuzzyMatches(key, distractors)[0];
    if (hit) return { type: hit.bust ? "distractor-bust" : "distractor", answer: hit };
  }
  return { type: "bust" };
}
function classify(outcome, target) {
  switch (outcome.type) {
    case "exact":
      return outcome.answer === target ? { sev: "OK", detail: "exact match" } : { sev: "WRONG", detail: `exact-matched "${outcome.answer.n}" instead` };
    case "confirm":
      return outcome.answer === target
        ? { sev: "OK", detail: "offered as a confirm" }
        : { sev: "WRONG", detail: `confirm offered "${outcome.answer.n}" instead` };
    case "ambiguous":
      return { sev: "AMBIGUOUS", detail: `ambiguous among: ${outcome.matches.map((m) => m.n).join(", ")}` };
    case "extra":
      return { sev: "BUST", detail: `swallowed by extra "${outcome.answer.n}" (right, but not scored)` };
    case "distractor":
      return { sev: "BUST", detail: `swallowed by distractor note for "${outcome.answer.n}"` };
    case "distractor-bust":
      return { sev: "BUST", detail: `busted via distractor "${outcome.answer.n}"` };
    default:
      return { sev: "BUST", detail: "matched nothing" };
  }
}

// ---------- walk every game, every round, every answer ----------
const SEV_RANK = { WRONG: 0, BUST: 1, AMBIGUOUS: 2, OK: 3 };
const findings = []; // { sev, game, file, domain, guess, detail, sources: [names] }
let totalGuesses = 0;
const okCount = { OK: 0 };

for (const num of readdirSync(gamesDir).sort()) {
  const files = readdirSync(join(gamesDir, num))
    .filter((f) => f.endsWith(".json"))
    .sort();
  for (const f of files) {
    const r = JSON.parse(readFileSync(join(gamesDir, num, f), "utf8"));
    if (!Array.isArray(r.answers)) continue;
    const pool = adapt(r.answers);
    const extras = adapt(r.extras);
    const distractors = adapt(r.distractors);

    // guess -> { outcome, sources: Set<answer name> } — collapsed per round
    // so eleven answers that all plausibly derive the same guess (eleven
    // Monopoly avenues deriving "avenue") produce one finding, not eleven.
    const perGuess = new Map();
    const resolveCache = new Map();

    for (let i = 0; i < r.answers.length; i++) {
      const a = r.answers[i];
      const target = pool[i];
      const sources = [a.name, ...(a.aliases || [])];
      const guesses = new Set();
      for (const s of sources) for (const g of deriveGuesses(s)) guesses.add(g);

      for (const guess of guesses) {
        totalGuesses++;
        if (!resolveCache.has(guess)) resolveCache.set(guess, resolveGuess(guess, pool, extras, distractors));
        const outcome = resolveCache.get(guess);
        const { sev, detail } = classify(outcome, target);
        if (sev === "OK") {
          okCount.OK++;
          continue;
        }
        const key = `${sev}|${guess}|${detail}`;
        if (!perGuess.has(key)) perGuess.set(key, { sev, guess, detail, sources: new Set() });
        perGuess.get(key).sources.add(a.name);
      }
    }

    for (const { sev, guess, detail, sources } of perGuess.values()) {
      findings.push({ sev, game: num, file: f, domain: r.domain, guess, detail, sources: [...sources] });
    }
  }
}

// ---------- report, worst first ----------
findings.sort((a, b) => SEV_RANK[a.sev] - SEV_RANK[b.sev] || a.game.localeCompare(b.game) || a.file.localeCompare(b.file));

const bySev = { WRONG: [], BUST: [], AMBIGUOUS: [] };
for (const f of findings) bySev[f.sev].push(f);

const sourceList = (names) => (names.length <= 4 ? names.join(", ") : `${names.slice(0, 4).join(", ")}, +${names.length - 4} more`);

for (const sev of ["WRONG", "BUST", "AMBIGUOUS"]) {
  const group = bySev[sev];
  if (!group.length) continue;
  console.log(`\n${sev} (${group.length})`);
  for (const f of group) {
    console.log(`  ${f.game}/${f.file} (${f.domain}) — guess "${f.guess}" [from: ${sourceList(f.sources)}]: ${f.detail}`);
  }
}

console.log(
  `\n${totalGuesses} guesses derived · ${okCount.OK} OK · ${bySev.AMBIGUOUS.length} ambiguous · ${bySev.BUST.length} bust · ${bySev.WRONG.length} wrong`
);
process.exit(bySev.WRONG.length || bySev.BUST.length ? 1 : 0);
