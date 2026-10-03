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
// Exit code is non-zero on WRONG or a "genuine" BUST. AMBIGUOUS is reported
// but never fails the build — plenty of ambiguity is correct (eleven
// Monopoly avenues all plausibly answering "avenue" isn't a bug), and it's
// exactly the kind of judgment call this script hands to a person instead
// of a gate. A BUST only counts as genuine when both hold:
//   - at least one of the rules that derived it is NOT in NON_GATING_RULES
//     (the two deliberately adversarial mutations — a character deleted, two
//     swapped, which exist to probe *past* where the matcher's own typo
//     tolerance is supposed to give up, MIN_TOKEN_TYPO/tolerance() in
//     10-matching.js — plus plural/singular and first+last-with-middle-
//     dropped, which review found were the two rules most prone to landing
//     on a fragment nobody would actually type: "atom mother", "dogs",
//     "thes"). A guess tagged with any other rule (the full name, a real
//     token, first/last token alone, no-article, flattened) still gates even
//     if it also happens to arise from one of these.
//   - the guess is at least MIN_FUZZY characters — below that floor the
//     matcher can never reach it through fuzzy matching at all, by the same
//     deliberate design that made "Ono" need an explicit alias rather than a
//     lowered floor (see "Answer matching" in CLAUDE.md).
// Without these cuts, some mutation, pluralized fragment, or bare short word
// somewhere across 400+ answers busts on effectively every run, and the exit
// code could never settle on green no matter how clean the content actually
// is. These BUSTs still print, under their own heading, same reasoning as
// AMBIGUOUS: visible,
// never hidden, just never the reason the build goes red.
//
// scripts/probe-allowlist.json covers the other kind of judgment call: a
// WRONG/BUST finding a person has actually looked at and decided isn't
// worth fixing (a matcher quirk too narrow to chase, or — "bulldog" vs
// French Bulldog — not a bug at all, the specified behavior, just one the
// probe has no way to know was intentional). An allowed finding still
// prints, under its own heading, so it never just quietly vanishes; it only
// stops being the reason the build goes red. A stale entry (nothing in the
// current run matches it — content changed enough that the exception no
// longer applies) warns instead of silently rotting in the file forever.

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const gamesDir = join(root, "content", "games");

const allowlist = JSON.parse(readFileSync(join(root, "scripts", "probe-allowlist.json"), "utf8"));
const allowKey = (e) => `${e.game}|${e.file}|${e.guess}`;
const allowed = new Map(allowlist.map((e) => [allowKey(e), e]));
const allowlistUsed = new Set();

// ---------- load the real matcher, run for real ----------
// 10-matching.js is pure (no DOM) — see CLAUDE.md "Answer matching" — so it
// runs in a bare vm context, the same trick smoke.mjs uses to run the real
// engine rather than reimplementing it. norm/fuzzyMatches are top-level
// `const`, which (like smoke.mjs's epilogue notes) never become properties
// of the sandbox's global object on their own; the explicit export does.
const matchingSrc = readFileSync(join(root, "src", "js", "10-matching.js"), "utf8");
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(matchingSrc + "\n;globalThis.__MATCH__={norm,fuzzyMatches,MIN_FUZZY};", sandbox, {
  filename: "src/js/10-matching.js",
});
const { norm, fuzzyMatches, MIN_FUZZY } = sandbox.__MATCH__;

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

// Every rule is tagged with its own name rather than collected into a flat
// list of strings, so NON_GATING_RULES (below) can tell which guesses are
// genuine candidates worth gating a build on — see the file header comment
// for what that split means and why. A guess gets every rule that produced
// it, since the same text can arise more than one way (e.g. a mutation that
// happens to coincide with a real token still counts as genuine).
//
// Every rule below runs once against the canonical name, and once more
// against each alias independently (see dig()'s own rule: an alias is a
// genuine alternate name, matched exactly the same way the name is).
function deriveGuesses(s) {
  const guesses = new Map(); // guess -> Set<rule>
  const add = (g, rule) => {
    const key = g && g.trim().toLowerCase();
    if (!key) return;
    if (!guesses.has(key)) guesses.set(key, new Set());
    guesses.get(key).add(rule);
  };

  add(s, "name"); // the full name/alias, lowercased

  const tokens = s.split(/[\s-]+/).filter(Boolean);
  for (const t of tokens) if (t.length >= 2) add(t, "token"); // every token, down to 2 chars
  // Stripped of surrounding punctuation for first/last-token purposes only
  // — "(Pretty" / "Thing)" from "P.Y.T. (Pretty Young Thing)" otherwise
  // leaves an orphaned paren in "first+last" ("p.y.t. thing)"), a derivation
  // artifact, not a real candidate guess. The raw, unstripped tokens above
  // still get the plain "every token" treatment untouched.
  const edge = tokens.map((t) => t.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "")).filter((t) => t.length >= 2);
  if (edge.length > 1) {
    add(edge[edge.length - 1], "last-token"); // last token alone
    add(edge[0], "first-token"); // first token alone
  }
  if (edge.length > 2) add(`${edge[0]} ${edge[edge.length - 1]}`, "first-last"); // first+last, middle dropped

  const noArticle = s.replace(/^(the|a|an)\s+/i, "");
  if (noArticle !== s) add(noArticle, "no-article"); // without a leading article

  add(s.replace(/[\s-]+/g, ""), "flattened"); // hyphens and spaces removed

  for (const t of tokens) {
    if (t.length < 2) continue;
    const sing = singularize(t);
    if (sing && sing.length >= 2) add(sing, "singular");
    add(pluralize(t), "plural"); // singular and plural of each token
  }

  const full = s.toLowerCase();
  if (full.length > 3) {
    const delPositions = [...new Set([1, Math.floor(full.length / 3), Math.floor((2 * full.length) / 3), full.length - 2])].filter(
      (i) => i >= 0 && i < full.length
    );
    for (const i of delPositions) add(full.slice(0, i) + full.slice(i + 1), "mutate"); // one char deleted

    const swapPositions = [...new Set([0, Math.floor(full.length / 3), Math.floor((2 * full.length) / 3)])].filter(
      (i) => i >= 0 && i < full.length - 1
    );
    for (const i of swapPositions) {
      const chars = full.split("");
      [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
      add(chars.join(""), "mutate"); // two adjacent chars swapped
    }
  }

  return guesses;
}
// "mutate" (adversarial by design) and "plural"/"singular"/"first-last"
// (the three rules that, by review, turned out most prone to landing on an
// unnatural fragment nobody would actually type — "atom mother", "dogs",
// "thes") never gate on their own. A guess tagged with any *other* rule
// (the full name, a real token, first/last token alone, no-article,
// flattened) is still genuine even if it also happens to arise from one of
// these — only an EXCLUSIVELY soft-ruled guess gets downgraded.
const NON_GATING_RULES = new Set(["mutate", "plural", "singular", "first-last"]);
// A guess below MIN_FUZZY can never be reached through fuzzy matching at
// all by deliberate design (10-matching.js) — it only ever credits through
// an exact alias, a human's own judgment call (see "Ono"/"Lee"/"Cat" in
// CLAUDE.md's "Answer matching"), not something to auto-gate a build on.
const isGenuine = (rules, guess) => guess.length >= MIN_FUZZY && [...rules].some((r) => !NON_GATING_RULES.has(r));

// ---------- resolving a guess, mirroring dig() in 70-game.js ----------
// Exact match first (name or alias, verbatim), then an exact extra or
// distractor, then fuzzyMatches against the scoring pool, then extras, then
// distractors — the same order dig() checks
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

  // dig() lets an exact extra/distractor hit outrank a fuzzy answer match.
  const authored = findExact(key, extras) || findExact(key, distractors);
  const matches = authored ? [] : fuzzyMatches(key, pool);
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
      const guesses = new Map(); // guess -> Set<rule>, merged across name + every alias
      for (const s of sources)
        for (const [g, rules] of deriveGuesses(s)) {
          if (!guesses.has(g)) guesses.set(g, new Set());
          for (const rule of rules) guesses.get(g).add(rule);
        }

      for (const [guess, rules] of guesses) {
        totalGuesses++;
        if (!resolveCache.has(guess)) resolveCache.set(guess, resolveGuess(guess, pool, extras, distractors));
        const outcome = resolveCache.get(guess);
        const { sev, detail } = classify(outcome, target);
        if (sev === "OK") {
          okCount.OK++;
          continue;
        }
        const genuine = sev !== "BUST" || isGenuine(rules, guess);
        const key = `${sev}|${guess}|${detail}`;
        if (!perGuess.has(key)) perGuess.set(key, { sev, guess, detail, sources: new Set(), genuine: false });
        const entry = perGuess.get(key);
        entry.sources.add(a.name);
        entry.genuine = entry.genuine || genuine; // genuine if *any* contributing source/rule is
      }
    }

    for (const { sev, guess, detail, sources, genuine } of perGuess.values()) {
      const key = `${num}|${f}|${guess}`;
      const allow = (sev === "WRONG" || sev === "BUST") && allowed.get(key);
      if (allow) allowlistUsed.add(key);
      findings.push({ sev, game: num, file: f, domain: r.domain, guess, detail, sources: [...sources], allow, genuine });
    }
  }
}

// ---------- report, worst first ----------
findings.sort((a, b) => SEV_RANK[a.sev] - SEV_RANK[b.sev] || a.game.localeCompare(b.game) || a.file.localeCompare(b.file));

const bySev = { WRONG: [], BUST: [], AMBIGUOUS: [] };
const allowedFindings = [];
const expectedBust = []; // BUST, but only via the mutation rules or below MIN_FUZZY — informational only, see isGenuine()
for (const f of findings) {
  if (f.allow) allowedFindings.push(f);
  else if (f.sev === "BUST" && !f.genuine) expectedBust.push(f);
  else bySev[f.sev].push(f);
}

const sourceList = (names) => (names.length <= 4 ? names.join(", ") : `${names.slice(0, 4).join(", ")}, +${names.length - 4} more`);

for (const sev of ["WRONG", "BUST", "AMBIGUOUS"]) {
  const group = bySev[sev];
  if (!group.length) continue;
  console.log(`\n${sev} (${group.length})`);
  for (const f of group) {
    console.log(`  ${f.game}/${f.file} (${f.domain}) — guess "${f.guess}" [from: ${sourceList(f.sources)}]: ${f.detail}`);
  }
}

if (allowedFindings.length) {
  console.log(`\nALLOWED — reviewed, not blocking the build (${allowedFindings.length})`);
  for (const f of allowedFindings) {
    console.log(`  ${f.sev}  ${f.game}/${f.file} (${f.domain}) — guess "${f.guess}" [from: ${sourceList(f.sources)}]: ${f.detail}`);
    console.log(`    ${f.allow.reason}`);
  }
}

if (expectedBust.length) {
  console.log(
    `\nBUST — not gating, informational (${expectedBust.length})\n` +
      `  (only ever reached via an adversarial mutation, a plural/singular or first+last rule landing on an unnatural\n` +
      `   fragment, or shorter than the matcher's own MIN_FUZZY floor — needs an alias if it's a genuine way to name\n` +
      `   the answer, same call as "Ono"/"Lee"/"Cat" in CLAUDE.md, not something to gate a build on)`
  );
  for (const f of expectedBust) {
    console.log(`  ${f.game}/${f.file} (${f.domain}) — guess "${f.guess}" [from: ${sourceList(f.sources)}]: ${f.detail}`);
  }
}

const stale = allowlist.filter((e) => !allowlistUsed.has(allowKey(e)));
if (stale.length) {
  console.log(`\nSTALE ALLOWLIST ENTRIES — matched nothing this run, content may have changed (${stale.length})`);
  for (const e of stale) console.log(`  ${e.game}/${e.file} — guess "${e.guess}": no longer found; consider removing from scripts/probe-allowlist.json`);
}

console.log(
  `\n${totalGuesses} guesses derived · ${okCount.OK} OK · ${bySev.AMBIGUOUS.length} ambiguous · ${bySev.BUST.length} bust · ${bySev.WRONG.length} wrong` +
    (expectedBust.length ? ` · ${expectedBust.length} expected bust (informational)` : "") +
    (allowedFindings.length ? ` · ${allowedFindings.length} allowed` : "")
);
process.exit(bySev.WRONG.length || bySev.BUST.length ? 1 : 0);
