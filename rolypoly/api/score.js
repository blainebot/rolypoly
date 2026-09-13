// Anonymous score-distribution store for the results screen.
//
// Stores nothing about a player beyond a score folded into a per-game
// histogram in Redis (Upstash, connected via the Vercel Marketplace under
// Storage). No IP, no identity, no per-submission record — one HINCRBY
// against a bucketed count, nothing more. Needs KV_REST_API_URL /
// KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)
// in the project's environment variables; without them this responds 503
// and the game degrades to hiding the comparison, per design.

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUCKETS = 20;

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(...command) {
  const url = `${REDIS_URL}/${command.map(encodeURIComponent).join("/")}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${REDIS_TOKEN}` } });
  if (!res.ok) throw new Error(`redis ${command[0]} failed: ${res.status}`);
  const { result } = await res.json();
  return result;
}

// Same formula as scripts/build.mjs's printed total and src/js/90-results.js's
// POSSIBLE — duplicated rather than shared, same call as validate.mjs's norm().
function possibleFor(game) {
  const dir = join(root, "content", "games", game);
  const files = readdirSync(dir).filter(f => f.endsWith(".json"));
  let possible = 0;
  for (const f of files) {
    const r = JSON.parse(readFileSync(join(dir, f), "utf8"));
    const n = r.answers.length;
    possible += r.answers.reduce((s, a) => s + a.value, 0) + 10 + Math.max(0, n - 2) * 2;
  }
  return possible;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(503).json({ error: "store not configured" });

  const { game, score } = req.body || {};
  if (typeof game !== "string" || !/^[a-zA-Z0-9_-]+$/.test(game))
    return res.status(400).json({ error: "invalid game" });

  let possible;
  try {
    possible = possibleFor(game);
  } catch {
    return res.status(400).json({ error: "unknown game" });
  }

  if (typeof score !== "number" || !Number.isInteger(score) || score < 0 || score > possible)
    return res.status(400).json({ error: "score out of range" });

  const width = Math.max(1, Math.ceil(possible / BUCKETS));
  const bucket = Math.min(BUCKETS - 1, Math.floor(score / width));

  try {
    await redis("HINCRBY", `scores:${game}`, String(bucket), "1");
    const raw = await redis("HGETALL", `scores:${game}`);
    const buckets = new Array(BUCKETS).fill(0);
    for (let i = 0; i < raw.length; i += 2) buckets[Number(raw[i])] = Number(raw[i + 1]);
    const count = buckets.reduce((a, b) => a + b, 0);
    const below = buckets.slice(0, bucket).reduce((a, b) => a + b, 0);
    const percentile = count ? Math.round((100 * (below + buckets[bucket] / 2)) / count) : 0;
    return res.status(200).json({ count, buckets, bucketWidth: width, percentile });
  } catch {
    return res.status(502).json({ error: "store unavailable" });
  }
}
