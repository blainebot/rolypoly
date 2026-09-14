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

function createSandbox({ day, active }) {
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
  $, norm, partialMatches, nearMiss, tierFor, dayTierFor, avail, shareText, breadthBonus,
  get idx(){return idx}, get roundDepth(){return roundDepth}, get banked(){return banked},
  get found(){return found}, get deepest(){return deepest}, get chamberHit(){return chamberHit},
  get results(){return results},
  ROUNDS, GAMENO, POSSIBLE, DAY, DAY_TIERS, CHAMBER_AT, RELICS,
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

function fresh() {
  return createSandbox({ day: TEST_DAY });
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
function loadSynthetic(E) {
  E.ROUNDS[0].domain = "Test";
  E.ROUNDS[0].prompt = "Test prompt.";
  E.ROUNDS[0].par = 10;
  E.ROUNDS[0].answers = syntheticPool();
  E.$("chooser").innerHTML = ""; // buildIntro() already ran; loadRound() is the real entry point
  E.$("play").hidden = false;
  E.loadRound();
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
  assert(lines[0].startsWith(`rolypoly.gg #${E.GAMENO}`), `share text game line: ${JSON.stringify(lines[0])}`);
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

console.log(`\n${ran} scenarios · ${failures.length} failures`);
if (failures.length) {
  console.log("failed: " + failures.join(", "));
  process.exit(1);
}
