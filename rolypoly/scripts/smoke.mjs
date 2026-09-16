#!/usr/bin/env node
// Plays the built game start to finish against a hand-rolled stub DOM, and
// asserts on outcomes — banked totals, bust salvage, matcher decisions,
// share text — never on how the engine gets there. There are no tests on
// game logic otherwise, only on content (validate.mjs); this is that net.
//
// dist/index.html is one big concatenated script (see CLAUDE.md — the
// src/js/*.js files share one scope by design). We extract that script and
// run it for real, once per scenario, inside a fresh node:vm context built
// to look just enough like a browser that the engine never notices the
// difference. Nothing here reimplements game rules; every assertion below
// is checked against the actual compiled engine's own state and functions.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distPath = join(root, "dist", "index.html");

let html;
try {
  html = readFileSync(distPath, "utf8");
} catch {
  console.error(`ERROR could not read ${distPath} — run "npm run build" first`);
  process.exit(1);
}
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("ERROR no <script> tag found in dist/index.html — build looks broken");
  process.exit(1);
}
const engineSource = scriptMatch[1];

// ---------- stub DOM ----------
// The engine only ever reaches the DOM through document.getElementById(id)
// (never real parent/child traversal into HTML it strings together itself),
// so a flat id -> element cache is a complete stand-in: no HTML parser
// needed. See CLAUDE.md "Puzzle day" for why ?day= exists — it's reused
// here to make every seeded/date-dependent value deterministic.
function makeElement() {
  const attrs = {};
  const classes = new Set();
  const el = {
    innerHTML: "",
    textContent: "",
    value: "",
    hidden: false,
    disabled: false,
    style: { setProperty(k, v) { this[k] = v; } },
    dataset: {},
    onclick: null,
    onkeydown: null,
    classList: {
      add(...c) { c.forEach((x) => classes.add(x)); },
      remove(...c) { c.forEach((x) => classes.delete(x)); },
      toggle(c, f) { const on = f === undefined ? !classes.has(c) : f; classes[on ? "add" : "delete"](c); return on; },
      contains(c) { return classes.has(c); },
    },
    setAttribute(k, v) { attrs[k] = String(v); },
    getAttribute(k) { return attrs[k] ?? null; },
    removeAttribute(k) { delete attrs[k]; },
    appendChild(child) { return child; },
    addEventListener() {},
    removeEventListener() {},
    focus() {},
    select() {},
    get offsetWidth() { return 100; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
  return el;
}

// A minimal Web Storage stand-in, backed by a plain Map. Callers that want
// to simulate "close the tab, reopen it" pass the same store into a second
// createSandbox() call; callers that don't care get an isolated fresh one.
function makeLocalStorage() {
  const data = new Map();
  return {
    writes: 0, // a deterministic replay can write back an identical value,
    // so tests that need to know whether a write happened at all (not just
    // whether the end value changed) should assert on this count.
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem(k, v) { data.set(k, String(v)); this.writes++; },
    removeItem: (k) => { data.delete(k); },
    clear: () => data.clear(),
  };
}

function createSandbox({ day, active, localStorage }) {
  const byId = new Map();
  const getElementById = (id) => {
    if (!byId.has(id)) byId.set(id, makeElement());
    return byId.get(id);
  };

  // Fake timers: setTimeout callbacks really do run (via setImmediate, so
  // ordering matches call order — every real setTimeout pair in this
  // codebase is called shortest-delay-first, so this is equivalent to
  // honoring the real delays without the test suite waiting on them).
  // setInterval/requestAnimationFrame never fire; nothing this test asserts
  // on depends on an interval or animation frame actually ticking — see the
  // smoke.mjs comment block below for why that's safe.
  let pending = 0;
  const cancelled = new Set();
  let nextId = 1;
  const timers = {
    setTimeout(fn, _ms, ...args) {
      const id = nextId++;
      pending++;
      setImmediate(() => {
        pending--;
        if (!cancelled.has(id)) fn(...args);
      });
      return id;
    },
    clearTimeout(id) { cancelled.add(id); },
    setInterval() { return nextId++; },
    clearInterval() {},
    requestAnimationFrame() { return nextId++; },
    cancelAnimationFrame() {},
  };
  async function flush() {
    let spins = 0;
    while (pending > 0) {
      await new Promise((r) => setImmediate(r));
      if (++spins > 10000) throw new Error("flush(): timers never settled — a setTimeout is probably missing from the stub");
    }
  }

  const documentEventHandlers = { keydown: [] };
  const sandbox = {
    console,
    Intl,
    URLSearchParams,
    AbortController,
    fetch: () => Promise.reject(new Error("smoke test: network disabled")),
    ...timers,
    navigator: { clipboard: { writeText: async () => {} } },
    location: { search: `?day=${day}` },
    localStorage: localStorage || makeLocalStorage(),
    document: {
      getElementById,
      activeElement: null,
      body: getElementById("__body__"),
      documentElement: getElementById("__documentElement__"),
      createElementNS: () => makeElement(),
      addEventListener(type, fn) { (documentEventHandlers[type] ||= []).push(fn); },
      removeEventListener(type, fn) {
        const list = documentEventHandlers[type];
        if (list) { const i = list.indexOf(fn); if (i >= 0) list.splice(i, 1); }
      },
    },
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.window.innerWidth = 800;
  sandbox.window.innerHeight = 900;
  sandbox.window.matchMedia = () => ({ matches: false }); // real chamber/animation logic path, real timers stand in for delay
  // visualViewport deliberately omitted: 99-boot.js's sync IIFE checks
  // `if(!vv)return` and is inert without it — nothing under test reads it.

  const context = vm.createContext(sandbox);

  // Bridge the engine's own let/const bindings out to the test driver. Only
  // `function` declarations attach to the sandbox's global object on their
  // own (standard classic-script behavior, true in a real browser too); the
  // arrow-const helpers and the mutable `let` state need an explicit export
  // because they never become properties of the global object.
  const epilogue = `
;globalThis.__TEST__ = {
  dig, bank, loadRound, showResults, askConfirm, endRound,
  saveTodayResult, loadTodayResult, showStoredResults,
  $, norm, matchScore, fuzzyMatches, tierFor, dayTierFor, avail, shareText, breadthBonus,
  get idx(){return idx}, get roundDepth(){return roundDepth}, get banked(){return banked},
  get found(){return found}, get deepest(){return deepest}, get chamberHit(){return chamberHit},
  get results(){return results}, get isPractice(){return isPractice},
  ROUNDS, GAMENO, POSSIBLE, DAY, DAY_TIERS, CHAMBER_AT, RELICS, SITE_DOMAIN,
};`;
  vm.runInContext(engineSource + epilogue, context, { filename: "dist/index.html <script>" });
  if (typeof active === "string" && context.GAMENO !== active) {
    throw new Error(`built game is "${context.GAMENO}", expected "${active}" — pass the right activeGame or drop the check`);
  }
  return { context, E: context.__TEST__, flush };
}

// ---------- tiny test runner ----------
const failures = [];
let ran = 0;
async function test(name, fn) {
  ran++;
  try {
    await fn();
    console.log(`ok    ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`FAIL  ${name}: ${e.message}`);
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }
function assertEqual(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

const TEST_DAY = "2026-01-01"; // fixed so every scenario is deterministic

function fresh(opts = {}) {
  return createSandbox({ day: TEST_DAY, ...opts });
}

// A small, fully-known answer pool for tests that need controlled content
// rather than whatever happens to be in content/games/ today — the matcher
// tests in particular should keep passing no matter how the real trivia
// content changes. Mirrors the real compiled shape from build.mjs's
// toEngine(): n/v/f/alias, not name/value/fact/aliases.
function syntheticPool() {
  return [
    { n: "Wish You Were Here", v: 5, f: "fact", alias: ["barrett"] },
    { n: "The Dark Side of the Moon", v: 3, f: "fact" },
    { n: "Jurassic Park", v: 8, f: "fact" },
    { n: "Hyde Park", v: 9, f: "fact" },
    { n: "Meddle", v: 6, f: "fact" },
    { n: "Animals", v: 7, f: "fact" },
  ];
}
function loadSynthetic(E, pool = syntheticPool(), extras) {
  E.ROUNDS[0].domain = "Test";
  E.ROUNDS[0].prompt = "Test prompt.";
  E.ROUNDS[0].par = 10;
  E.ROUNDS[0].answers = pool;
  if (extras) E.ROUNDS[0].extras = extras;
  E.$("chooser").innerHTML = ""; // buildIntro() already ran; loadRound() is the real entry point
  E.$("play").hidden = false;
  E.loadRound();
}

// A second synthetic pool, modelled on the real girl-scout-cookie round
// that exposed a matcher bug: "mint" busted instead of offering "Did you
// mean Thin Mints?" Two general causes, not just that one word —
// partialMatches() only ever compared a guess against a whole token, never
// a prefix of one, and norm() strips hyphens without inserting a space, so
// a hyphenated name ("Do-si-dos" -> "dosidos") and the same name typed with
// spaces ("do si dos") normalised to different strings and never met.
// Kakapos/Ostriches sit outside the cookie theme on purpose, to confirm the
// fix is general — plural-token prefix matching, not something cookie- or
// hyphen-specific.
function cookiePool() {
  return [
    { n: "Thin Mints", v: 3, f: "fact" },
    { n: "Samoas", v: 4, f: "fact", alias: ["caramel delites"] },
    { n: "Tagalongs", v: 6, f: "fact", alias: ["peanut butter patties"] },
    { n: "Trefoils", v: 8, f: "fact" },
    { n: "Do-si-dos", v: 9, f: "fact", alias: ["peanut butter sandwich"] },
    { n: "Lemon-Ups", v: 13, f: "fact" },
    { n: "Toffee-tastic", v: 16, f: "fact" },
    { n: "Caramel Chocolate Chip", v: 19, f: "fact" },
    { n: "Exploremores", v: 21, f: "fact" },
    { n: "Kakapos", v: 5, f: "fact" },
    { n: "Ostriches", v: 5, f: "fact" },
  ];
}

// A third synthetic pool, modelled on the real bug report: "pennsyvania"
// (missing the second l) for "Pennsylvania Avenue" busted instead of
// offering a confirm. Typo tolerance only ever checked a guess against the
// *whole* candidate string, and "pennsyvania" isn't close enough to the
// whole "pennsylvania avenue" — a one-letter typo in just one word of a
// multi-word answer had no path to a confirm at all. Park Place and Water
// Works sit in the same pool to confirm the fix (per-token typo tolerance
// once a token's long enough, MIN_TOKEN_TYPO in 10-matching.js) didn't
// reopen the "york" one-edit-from-both-"park"-and-"work" false-ambiguity
// bug that whole-string-only tolerance was built to prevent in the first
// place — short tokens still get no typo tolerance, only exact/prefix.
function statePropertyPool() {
  return [
    { n: "Pennsylvania Avenue", v: 4, f: "fact" },
    { n: "Park Place", v: 4, f: "fact" },
    { n: "Water Works", v: 11, f: "fact" },
    { n: "New York Avenue", v: 6, f: "fact" },
  ];
}

async function digAnswer(E, flush, name) {
  E.$("answer").value = name;
  E.dig();
  await flush();
}
async function confirmYes(E, flush) {
  const yes = E.$("yesBtn");
  assert(typeof yes.onclick === "function", "expected a \"Did you mean X?\" confirm to be showing, but no Yes button is wired up");
  yes.onclick();
  await flush();
}

// ---------- scenarios ----------

await test("clean round: dig three, bank, banked total includes breadth bonus", async () => {
  const { E, flush } = fresh();
  const picks = E.avail().slice(0, 3);
  for (const a of picks) await digAnswer(E, flush, a.n);
  assertEqual(E.found.length, 3, "finds before banking");
  E.bank();
  await flush();
  const sum = picks.reduce((s, a) => s + a.v, 0);
  const expectedBonus = Math.max(0, (3 - 2) * 2);
  assertEqual(expectedBonus, 2, "sanity: breadth bonus formula for 3 finds");
  assertEqual(E.banked, sum + expectedBonus, "banked total after a clean 3-find bank");
  assertEqual(E.results[0].bust, false, "results[0].bust");
  assertEqual(E.results[0].cm, sum + expectedBonus, "results[0].cm");
});

await test("bust: first find is salvaged, the second find is lost entirely", async () => {
  const { E, flush } = fresh();
  const [first, second] = E.avail();
  await digAnswer(E, flush, first.n);
  await digAnswer(E, flush, second.n);
  assertEqual(E.found.length, 2, "finds before busting");
  await digAnswer(E, flush, "zzz-not-a-real-answer-12345");
  assertEqual(E.banked, first.v, "banked after a bust must equal only the first find's value");
  assert(E.banked !== first.v + second.v, "the second find's value must not have survived the bust");
  assertEqual(E.results[0].bust, true, "results[0].bust");
  assertEqual(E.results[0].cm, first.v, "results[0].cm (the salvaged amount)");
});

// The Rumble panel always headlines what was kept, never what was lost —
// three shapes, by what actually happened, each asserted against the
// panel's actual rendered HTML rather than just the engine's internal
// found/banked state, since this is a copy bug as much as a logic one.
await test("rumble panel: busted on the first dig — 0 is the honest headline, no kept/loss line at all", async () => {
  const { E, flush } = fresh();
  await digAnswer(E, flush, "zzz-not-a-real-answer-11111");
  const html = E.$("rumbleBox").innerHTML;
  assert(html.includes('id="bankedNum">0<'), `expected a banked headline of 0, got: ${html}`);
  assert(!html.includes('class="kept"'), `nothing was found or lost, so there should be no secondary line: ${html}`);
});

await test("rumble panel: busted with exactly one find — that find headlines, no loss is ever mentioned", async () => {
  const { E, flush } = fresh();
  const first = E.avail()[0];
  await digAnswer(E, flush, first.n);
  await digAnswer(E, flush, "zzz-not-a-real-answer-22222");
  const html = E.$("rumbleBox").innerHTML;
  assert(html.includes(`id="bankedNum">${first.v}<`), `expected the banked headline to be the first find's value (${first.v}), got: ${html}`);
  assert(html.includes("Your first find is safe."), `expected the no-loss sentence: ${html}`);
  assert(!html.includes("lost"), `a single-find bust must never mention a loss: ${html}`);
});

await test("rumble panel: busted with several finds — kept is still the large headline, lost is the small line", async () => {
  const { E, flush } = fresh();
  const picks = E.avail().slice(0, 3);
  for (const a of picks) await digAnswer(E, flush, a.n);
  await digAnswer(E, flush, "zzz-not-a-real-answer-33333");
  const first = picks[0];
  const lostAmount = picks.slice(1).reduce((s, a) => s + a.v, 0);
  assert(lostAmount >= 0, "sanity: the lost figure (round total minus the first find) must never be negative");
  const html = E.$("rumbleBox").innerHTML;
  assert(html.includes(`id="bankedNum">${first.v}<`), `expected the banked headline to be the first find's value (${first.v}), not the lost total: ${html}`);
  assert(html.includes(`${lostAmount} lost beyond that`), `expected the lost figure ${lostAmount} in the small line: ${html}`);
});

await test("clearing a whole round pays the +10 clear bonus and the breadth bonus", async () => {
  const { E, flush } = fresh();
  const all = E.avail();
  for (const a of all) await digAnswer(E, flush, a.n);
  const sum = all.reduce((s, a) => s + a.v, 0);
  const expectedBonus = Math.max(0, (all.length - 2) * 2);
  assertEqual(E.banked, sum + 10 + expectedBonus, "banked total after clearing every answer in the round");
  assertEqual(E.results[0].bust, false, "a cleared round must not be recorded as a bust");
});

await test("a full five-round game: final total and share text", async () => {
  const { E, flush } = fresh();
  assertEqual(E.ROUNDS.length, 5, "expected a five-round game");
  let expected = 0;
  const busts = [];
  for (let r = 0; r < E.ROUNDS.length; r++) {
    const picks = E.avail().slice(0, Math.min(3, E.avail().length));
    for (const a of picks) await digAnswer(E, flush, a.n);
    if (r === E.ROUNDS.length - 1) {
      // bust the last round deliberately, so the game exercises both paths
      // before results — first find still banks, the rest is forfeit.
      await digAnswer(E, flush, "zzz-not-a-real-answer-99999");
      expected += picks[0].v;
      busts.push(r);
    } else {
      E.bank();
      await flush();
      const sum = picks.reduce((s, a) => s + a.v, 0);
      expected += sum + Math.max(0, (picks.length - 2) * 2);
    }
    E.$("bankBtn").onclick();
    await flush();
  }
  assertEqual(E.banked, expected, "final banked total across all five rounds");
  assertEqual(E.results.length, 5, "one result recorded per round");
  assertEqual(E.results.filter((r) => r.bust).length, busts.length, "bust count across the day");

  const share = E.shareText();
  const lines = share.split("\n");
  assertEqual(lines.length, 4, "share text line count (game line, tier line, score, emoji row)");
  assert(lines[0].startsWith(`${E.SITE_DOMAIN} #${E.GAMENO}`), `share text game line: ${JSON.stringify(lines[0])}`);
  assertEqual(lines[2], String(E.banked), "share text's bare score line");
  assert(!share.includes("of"), 'share text must not show "N of POSSIBLE" — see CLAUDE.md "Scoring"');
  assertEqual([...lines[3]].length, 5, "share text emoji row: one mark per round");
});

await test("matcher: exact name", async () => {
  const { E, flush } = fresh();
  loadSynthetic(E);
  await digAnswer(E, flush, "Wish You Were Here");
  assertEqual(E.found.length, 1, "finds after an exact canonical-name match");
  assertEqual(E.found[0].n, "Wish You Were Here", "matched answer");
});

await test("matcher: exact alias", async () => {
  const { E, flush } = fresh();
  loadSynthetic(E);
  await digAnswer(E, flush, "barrett");
  assertEqual(E.found.length, 1, "finds after an exact alias match");
  assertEqual(E.found[0].n, "Wish You Were Here", "matched answer via alias");
});

await test("matcher: unambiguous partial (a distinctive word) offers a confirm, then credits", async () => {
  const { E, flush } = fresh();
  loadSynthetic(E);
  await digAnswer(E, flush, "moon"); // "The Dark Side of the Moon" is the only answer containing "moon"
  assertEqual(E.found.length, 0, "a partial match must not auto-credit before confirmation");
  assert(E.$("confirmBox").innerHTML.includes("The Dark Side of the Moon"), "confirm box should name the suggested answer");
  await confirmYes(E, flush);
  assertEqual(E.found.length, 1, "finds after confirming a partial match");
  assertEqual(E.found[0].n, "The Dark Side of the Moon", "matched answer via partial word");
});

await test("matcher: misspelling offers \"did you mean\", then credits on confirm", async () => {
  const { E, flush } = fresh();
  loadSynthetic(E);
  await digAnswer(E, flush, "medle"); // one letter short of "Meddle"
  assertEqual(E.found.length, 0, "a fuzzy match must not auto-credit before confirmation");
  assert(E.$("confirmBox").innerHTML.includes("Meddle"), "confirm box should offer the near-miss suggestion");
  await confirmYes(E, flush);
  assertEqual(E.found.length, 1, "finds after confirming a misspelling");
  assertEqual(E.found[0].n, "Meddle", "matched answer via fuzzy match");
});

await test("matcher: ambiguous partial asks the player to be more specific, credits nothing", async () => {
  const { E, flush } = fresh();
  loadSynthetic(E);
  await digAnswer(E, flush, "park"); // both "Jurassic Park" and "Hyde Park" qualify
  assertEqual(E.found.length, 0, "an ambiguous partial must not credit any answer");
  assert(E.$("confirmBox").innerHTML === "", "an ambiguous partial must not open a confirm dialog either");
});

await test("matcher: a genuinely wrong answer matches nothing and busts", async () => {
  const { E, flush } = fresh();
  loadSynthetic(E);
  await digAnswer(E, flush, "xxqzflorp");
  assertEqual(E.found.length, 0, "finds after a wrong answer");
  assertEqual(E.results.length, 1, "a wrong answer with no prior finds should end the round");
  assertEqual(E.results[0].bust, true, "a wrong answer with nothing on the board must bust");
});

// A fragment ("mint"), a plural mismatch in either direction ("samoa" into
// "Samoas"), or a hyphenated name typed with spaces instead ("do si dos"
// into "Do-si-dos") — every one of these must reach the confirm prompt and
// be creditable there, never bust and never auto-credit. Real bug: "mint"
// busted the round instead of offering "Did you mean Thin Mints?"
for (const w of ["mint", "mints", "samoa", "tagalong", "trefoil", "do si dos", "dosido", "lemon up", "toffee", "explore", "kakapo", "ostrich"]) {
  await test(`matcher: "${w}" is a fragment/plural/hyphen mismatch — confirm offered, no bust`, async () => {
    const { E, flush } = fresh();
    loadSynthetic(E, cookiePool());
    await digAnswer(E, flush, w);
    assertEqual(E.found.length, 0, `"${w}" must not auto-credit before confirmation`);
    assertEqual(E.results.length, 0, `"${w}" must not bust the round`);
    assert(typeof E.$("yesBtn").onclick === "function", `"${w}" should offer a "Did you mean X?" confirm`);
    await confirmYes(E, flush);
    assertEqual(E.found.length, 1, `"${w}" should credit its answer once confirmed`);
  });
}

// A word genuinely shared by more than one answer must still fall through
// to "be more specific" — the fragment/plural/hyphen fix above must not
// collapse real ambiguity into a guessed confirm.
for (const w of ["caramel", "peanut butter"]) {
  await test(`matcher: "${w}" matches more than one cookie — be more specific, nothing lost`, async () => {
    const { E, flush } = fresh();
    loadSynthetic(E, cookiePool());
    await digAnswer(E, flush, w);
    assertEqual(E.found.length, 0, `"${w}" must not credit any answer`);
    assertEqual(E.results.length, 0, `"${w}" must not bust the round`);
    assert(E.$("confirmBox").innerHTML === "", `"${w}" is ambiguous and must not open a confirm dialog`);
  });
}

// And a guess that genuinely isn't on the list must still bust — the fix
// widens what counts as a fragment/plural/hyphen match, not what counts as
// a match at all.
for (const w of ["oreo", "snickerdoodle", "girl scout", "zzzz"]) {
  await test(`matcher: "${w}" is a genuine dead end — still busts`, async () => {
    const { E, flush } = fresh();
    loadSynthetic(E, cookiePool());
    await digAnswer(E, flush, w);
    assertEqual(E.found.length, 0, `"${w}" should not match anything`);
    assertEqual(E.results.length, 1, `"${w}" should end the round`);
    assertEqual(E.results[0].bust, true, `"${w}" should bust`);
  });
}

await test('matcher: "pennsyvania" — a typo inside one word of a multi-word answer — offers a confirm, then credits', async () => {
  const { E, flush } = fresh();
  loadSynthetic(E, statePropertyPool());
  await digAnswer(E, flush, "pennsyvania");
  assertEqual(E.found.length, 0, "a fuzzy match must not auto-credit before confirmation");
  assert(E.$("confirmBox").innerHTML.includes("Pennsylvania Avenue"), "confirm box should name Pennsylvania Avenue");
  await confirmYes(E, flush);
  assertEqual(E.found.length, 1, "finds after confirming");
  assertEqual(E.found[0].n, "Pennsylvania Avenue", "matched answer");
});

await test('matcher: per-token typo tolerance on long words does not reopen short-word collisions ("york" still only reaches New York Avenue)', async () => {
  const { E, flush } = fresh();
  loadSynthetic(E, statePropertyPool());
  await digAnswer(E, flush, "york");
  assertEqual(E.found.length, 0, "a partial match must not auto-credit before confirmation");
  const html = E.$("confirmBox").innerHTML;
  assert(html.includes("New York Avenue"), "should offer New York Avenue");
  assert(!html.includes("Park Place") && !html.includes("Water Works"), `"york" must not ambiguously reach short unrelated words: ${html}`);
});

await test('matcher: a typo in a short word still busts — typo tolerance never applies below MIN_TOKEN_TYPO', async () => {
  const { E, flush } = fresh();
  loadSynthetic(E, statePropertyPool());
  await digAnswer(E, flush, "watr"); // "water" is 5 characters, short of the token-typo floor
  assertEqual(E.found.length, 0, "should not match anything");
  assertEqual(E.results.length, 1, "should end the round");
  assertEqual(E.results[0].bust, true, "a short-word typo below the floor should still bust");
});

await test("extras: correct but outside the scoring fifteen — no score, no bust, no reveal", async () => {
  const { E, flush } = fresh();
  const extras = [{ n: "Adventurefuls", alias: ["adventurefuls cookie"] }];
  loadSynthetic(E, cookiePool(), extras);

  // Exact name.
  await digAnswer(E, flush, "Adventurefuls");
  assertEqual(E.found.length, 0, "an extra must not score");
  assertEqual(E.results.length, 0, "an extra must not end the round");
  assertEqual(E.roundDepth, 0, "an extra must not add to the unbanked total");
  assert(E.$("msg").textContent.includes("not one of today's fifteen"), `unexpected message: ${E.$("msg").textContent}`);
  assert(!E.$("digBtn").disabled, "digging an extra must not lock out further play");

  // Alias.
  await digAnswer(E, flush, "adventurefuls cookie");
  assertEqual(E.found.length, 0, "an extra's alias must not score either");
  assertEqual(E.results.length, 0, "an extra's alias must not end the round");

  // A fragment/plural of an extra — same fuzzy reach the scoring list gets,
  // routed straight to the same outcome (no confirm step; see 70-game.js).
  await digAnswer(E, flush, "adventureful");
  assertEqual(E.found.length, 0, "a fuzzy match to an extra must not score");
  assertEqual(E.results.length, 0, "a fuzzy match to an extra must not bust");

  // Finish the round for real, then confirm the extra never appears
  // anywhere a real answer would: not in the reveal, not in "still down
  // there," not in avail() at all.
  assert(!E.avail().some((a) => a.n === "Adventurefuls"), "an extra must never be part of the scoring pool avail() draws from");
  const picks = E.avail().slice(0, 2);
  for (const a of picks) await digAnswer(E, flush, a.n);
  assert(!E.$("facts").innerHTML.includes("Adventurefuls"), "an extra must never appear in the reveal");
  E.bank();
  await flush();
  assertEqual(E.results[0].bust, false, "sanity: the round banked normally after the extra digs");
  assert(!E.$("missedBox").innerHTML.includes("Adventurefuls"), "an extra must never appear in \"still down there\"");
});

await test("hidden chamber fires once roundDepth crosses its threshold", async () => {
  const { E, flush } = fresh();
  const targetIdx = E.ROUNDS.findIndex((r) => r.answers.reduce((s, a) => s + a.v, 0) > E.CHAMBER_AT);
  assert(targetIdx >= 0, `no round in the active game has enough total value to cross CHAMBER_AT (${E.CHAMBER_AT}) — the test can't exercise this without content that clears it`);

  // Play rounds up to the target one, banking cleanly, to reach it via loadRound().
  for (let r = 0; r < targetIdx; r++) {
    const a = E.avail()[0];
    await digAnswer(E, flush, a.n);
    E.bank();
    await flush();
    E.$("bankBtn").onclick();
    await flush();
  }
  assertEqual(E.idx, targetIdx, "reached the target round");
  assert(!E.chamberHit, "chamber should not be hit before digging anything in the target round");
  for (const a of E.avail()) {
    if (E.chamberHit) break;
    await digAnswer(E, flush, a.n);
  }
  assert(E.chamberHit, `chamberHit should be true after digging past ${E.CHAMBER_AT} in round ${targetIdx}`);
});

async function playWholeGame(E, flush) {
  let expected = 0;
  for (let r = 0; r < E.ROUNDS.length; r++) {
    const picks = E.avail().slice(0, Math.min(3, E.avail().length));
    for (const a of picks) await digAnswer(E, flush, a.n);
    E.bank();
    await flush();
    expected += picks.reduce((s, a) => s + a.v, 0) + Math.max(0, (picks.length - 2) * 2);
    E.$("bankBtn").onclick();
    await flush();
  }
  return expected;
}

await test("replay-blocking: a finished day is stored and restored on the next boot", async () => {
  const store = makeLocalStorage();

  // Session 1: play the real game to completion.
  const { E: E1, flush: flush1 } = fresh({ localStorage: store });
  const expected = await playWholeGame(E1, flush1);
  assertEqual(E1.banked, expected, "sanity: session 1's banked total");
  assertEqual(E1.isPractice, false, "session 1 must not be flagged as practice");
  const saved = store.getItem("rolypoly:result");
  assert(saved, "finishing the real game must save a result to localStorage");
  assertEqual(JSON.parse(saved).banked, expected, "the stored record's banked total");

  // Session 2: a fresh boot (new sandbox = new vm context, same underlying
  // store — simulating a page reload) on the same day must present that
  // day as already complete, not offer a fresh board.
  const { E: E2 } = fresh({ localStorage: store });
  assertEqual(E2.banked, expected, "reloading the same day should restore the stored banked total");
  assertEqual(E2.idx, E2.ROUNDS.length, "reloading a finished day should present it as already complete");
  assertEqual(E2.results.length, E2.ROUNDS.length, "reloading should restore every round's result");
  assertEqual(E2.results[0].found.length > 0, true, "restored results should carry the found-answer detail used for review");
});

await test("replay-blocking: a stale stored record (wrong day or game) is never shown as today's", async () => {
  // This is the mechanism that protects against the day rolling over
  // mid-session: whatever gets saved is tagged with the day/game that was
  // actually played, and a mismatch on either must fall back to a fresh
  // board rather than showing stale results as if they were today's.
  const wrongDay = makeLocalStorage();
  wrongDay.setItem("rolypoly:result", JSON.stringify({
    day: "2020-01-01", gameNo: "002", banked: 999, deepest: 5, deepestName: "x", results: [],
  }));
  const { E: byDay } = fresh({ localStorage: wrongDay });
  assertEqual(byDay.idx, 0, "a record for a different day must not short-circuit a fresh board");
  assertEqual(byDay.banked, 0, "a record for a different day must not leak its banked total in");

  const wrongGame = makeLocalStorage();
  wrongGame.setItem("rolypoly:result", JSON.stringify({
    day: TEST_DAY, gameNo: "not-a-real-game", banked: 999, deepest: 5, deepestName: "x", results: [],
  }));
  const { E: byGame } = fresh({ localStorage: wrongGame });
  assertEqual(byGame.idx, 0, "a record for a different game (same day) must not short-circuit a fresh board");
  assertEqual(byGame.banked, 0, "a record for a different game must not leak its banked total in");
});

await test("replay-blocking: practice mode after a finished day never touches storage", async () => {
  const store = makeLocalStorage();
  const { E, flush } = fresh({ localStorage: store });
  await playWholeGame(E, flush);
  const before = store.getItem("rolypoly:result");
  assert(before, "sanity: a real result was saved");

  const writesBefore = store.writes;
  E.$("againBtn").onclick();
  assertEqual(E.isPractice, true, "clicking Practice dig must flag the session as practice");
  // Play a full second game start to finish — showResults() (where saving
  // happens) is only reached once idx hits the end, so a partial replay
  // wouldn't actually exercise the isPractice gate this test exists to check.
  // Assert on write *count*, not just the stored value: a deterministic
  // replay of the same content can write back an identical value, which a
  // plain equality check against `before` wouldn't catch as a write at all.
  await playWholeGame(E, flush);

  assertEqual(store.writes, writesBefore, "a practice playthrough must not write to localStorage at all");
  assertEqual(store.getItem("rolypoly:result"), before, "a practice playthrough must not overwrite the stored real result");
  assertEqual(E.results.length, E.ROUNDS.length, "sanity: the practice replay itself completed all rounds");
});

await test("in-progress: a mid-round reload resumes the same round, found list, and totals", async () => {
  const store = makeLocalStorage();

  // Session 1: bank round 0 for real, then dig two answers into round 1
  // without banking — a genuinely mid-round, unfinished game.
  const { E: E1, flush: flush1 } = fresh({ localStorage: store });
  const round0Picks = E1.avail().slice(0, 3);
  for (const a of round0Picks) await digAnswer(E1, flush1, a.n);
  E1.bank();
  await flush1();
  const round0Total = round0Picks.reduce((s, a) => s + a.v, 0) + Math.max(0, (round0Picks.length - 2) * 2);

  // The narrow window right here — round 0's result is recorded (endRound()
  // already pushed it and saved), but idx hasn't advanced yet because the
  // "Next round" button hasn't been clicked — is exactly the case
  // saveInProgress()'s resumeIdx-from-results.length logic exists for. A
  // reload here must resume into a *fresh* round 1, never back into round 0
  // (which would let it be dug and banked a second time). Check it directly
  // before clicking past it, since once the button's clicked idx and
  // results.length agree again and this specific bug stops being visible.
  {
    const { E: mid } = fresh({ localStorage: store });
    assertEqual(mid.idx, 1, "a reload between finishing a round and clicking past it must resume into the next round");
    assertEqual(mid.found.length, 0, "that resume must not carry over the just-finished round's found list");
    assertEqual(mid.results.length, 1, "that resume must still credit the just-finished round exactly once");
  }

  E1.$("bankBtn").onclick(); // advance to round 1
  await flush1();
  assertEqual(E1.idx, 1, "sanity: advanced into round 1");

  const round1Picks = E1.avail().slice(0, 2);
  for (const a of round1Picks) await digAnswer(E1, flush1, a.n);
  const round1Depth = round1Picks.reduce((s, a) => s + a.v, 0);
  assertEqual(E1.roundDepth, round1Depth, "sanity: round 1's unbanked total before the simulated reload");
  assert(store.getItem("rolypoly:progress"), "an in-progress game must be saved to localStorage");
  assertEqual(store.getItem("rolypoly:result"), null, "an unfinished day must not have a finished-result record");

  // Session 2: simulate a reload — a fresh sandbox (new vm context, so no
  // in-memory state carries over), same underlying store, same day.
  const { E: E2, flush: flush2 } = fresh({ localStorage: store });
  assertEqual(E2.idx, 1, "resumed round index");
  assertEqual(E2.banked, round0Total, "resumed banked total from the completed round");
  assertEqual(E2.roundDepth, round1Depth, "resumed unbanked total for the round in progress");
  assertEqual(E2.found.length, round1Picks.length, "resumed found-list length for the round in progress");
  assertEqual(
    E2.found.map((a) => a.n).sort().join(","),
    round1Picks.map((a) => a.n).sort().join(","),
    "resumed found list matches what was actually dug before the reload"
  );
  assertEqual(E2.results.length, 1, "resumed results carry the one completed round, not the in-progress one");

  // Restored found entries come back through JSON as plain-object copies —
  // dig()'s duplicate check is found.includes(hit), reference equality
  // against an object pulled fresh from avail(). If resumeGame() doesn't
  // re-bind each restored entry to the real answer object, that check
  // silently never matches and an already-found answer can be dug (and
  // scored) a second time after a reload. This caught a real bug once.
  await digAnswer(E2, flush2, round1Picks[0].n);
  assertEqual(E2.found.length, round1Picks.length, "re-typing an already-found answer after a resume must not add a duplicate find");
  assertEqual(E2.roundDepth, round1Depth, "re-typing an already-found answer after a resume must not add its value again");
  assertEqual(E2.$("msg").textContent, "Already dug that one.", "re-digging a pre-resume find should say so, the same as any other duplicate");

  // The resumed session must still be genuinely playable, not a dead end.
  const nextPick = E2.avail().find((a) => !E2.found.some((f) => f.n === a.n));
  await digAnswer(E2, flush2, nextPick.n);
  assertEqual(E2.found.length, round1Picks.length + 1, "digging after a resume still works");
  const round1Finds = [...round1Picks, nextPick];
  const round1Total = round1Finds.reduce((s, a) => s + a.v, 0) + Math.max(0, (round1Finds.length - 2) * 2);
  E2.bank();
  await flush2();
  assertEqual(E2.banked, round0Total + round1Total, "final banked total after resuming and banking is correct, not corrupted by the reload");
});

console.log(`\n${ran} scenarios · ${failures.length} failures`);
if (failures.length) {
  console.log("failed: " + failures.join(", "));
  process.exit(1);
}
