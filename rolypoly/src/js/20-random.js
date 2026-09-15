function seedFrom(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// The one place that constructs a date. The puzzle day rolls over at
// midnight US Eastern, not UTC — Intl's timezone database handles the
// DST transition correctly, so there's no hand-rolled offset math to get
// wrong twice a year. Everything that needs "today" reads DAY below;
// nothing else should call `new Date()`.
function puzzleDay(){
  const override=new URLSearchParams(location.search).get("day");
  if(override&&/^\d{4}-\d{2}-\d{2}$/.test(override))return override;
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",
    year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const get=t=>parts.find(p=>p.type===t).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
const DAY=puzzleDay();

// GAMES, SCHEDULE, CONFIG_OVERRIDE and gameForDay() come from the build's
// content-injection block in 00-tiers.js, earlier in this same concatenated
// script — they exist by the time this line runs even though they're
// defined "before" DAY, because DAY is what gameForDay() needs.
// `?game=003` in the URL jumps straight to that game, no rebuild required —
// the quickest way to flip between games while authoring content. Falls
// back to the config override, then the schedule, same as always.
function gameOverride(){
  const g=new URLSearchParams(location.search).get("game");
  return (g&&GAMES[g])?g:null;
}
const GAMENO=gameOverride()||CONFIG_OVERRIDE||gameForDay(DAY);
const ROUNDS=GAMES[GAMENO];

// The site's canonical address — bare domain, no protocol, matching how it
// reads in the share text. This is the only place it's written; the score
// API URL and the share text both derive from it. Swap this one line when
// the real domain is live.
const SITE_DOMAIN="rolypoly-seven.vercel.app";

/* ---------- state ---------- */
