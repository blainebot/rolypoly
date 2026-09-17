const TIERS=[
  {max:7,  name:"leaf litter", v:"moss",  e:"\u{1F342}", lo:1},
  {max:14, name:"topsoil",     v:"sand",  e:"\u{1FAB1}", lo:8},
  {max:24, name:"root line",   v:"rust",  e:"\u{1FAB5}", lo:15},
  {max:999,name:"bedrock",     v:"ember", e:"\u{1F48E}", lo:25}
];
const tierFor=v=>TIERS.find(t=>v<=t.max);

// Day-score bands for the results screen. The only numbers that matter for
// tuning live here — max is the sole authored threshold; everything a band
// needs to render (its lower bound, its share of the tier-band width) is
// derived from this list, never duplicated elsewhere.
const DAY_TIERS=[
  {max:59,      name:"leaf litter",    v:"moss",    e:"\u{1F342}", copy:"Barely broke the surface."},
  {max:119,     name:"topsoil",        v:"sand",    e:"\u{1FAB1}", copy:"A decent dig."},
  {max:199,     name:"root line",      v:"rust",    e:"\u{1FAB5}", copy:"Down past the roots. Solid."},
  {max:299,     name:"bedrock",        v:"ember",   e:"\u{1F48E}", copy:"Deep. Most people don't get here."},
  {max:Infinity,name:"hidden chamber", v:"chamber", e:"\u{1F3FA}", copy:"Absurd. You dug through the whole board."}
];
const dayTierFor=v=>DAY_TIERS.find(t=>v<=t.max);

// The chamber's floor — 75cm below CHAMBER_AT (30-state.js, its ceiling).
// Declared here, ahead of CHAMBER_AT in concat order, because LAYERS needs it
// immediately below; moveWorld() (50-world.js) reuses this same constant as
// its camera cap rather than duplicating the number, unlike CHAMBER_AT/`95`
// below, which — pre-existing — is duplicated between LAYERS and 30-state.js.
const CHAMBER_FLOOR_AT=170;
const LAYERS=[
  {name:"",              from:-520,to:0,  sky:1, bg:"linear-gradient(#3E96D4 0%,#74BCE5 52%,#A6D6EE 94.5%,#79A650 94.5%,#5B8341 100%)"},
  {name:"leaf litter",   from:0,   to:12, bg:"linear-gradient(#7D8A5A,#A98F4E)"},
  {name:"topsoil",       from:12,  to:32, bg:"linear-gradient(#C1934F,#BC7F3C)"},
  {name:"root line",     from:32,  to:58, bg:"linear-gradient(#B4692F,#A04E1D)"},
  {name:"bedrock",       from:58,  to:95, bg:"linear-gradient(#8E3A22,#6A2413)"},
  // Not another gradient band with a tunnel cut through it — this one's an
  // open void. The background is near the tunnel's own carve colour (#180F08)
  // on purpose: the whole room reads as "already hollow," so buildWorld()'s
  // ceiling/floor rock and flecks (below) are the only extra art it needs;
  // nothing here gets a corridor drawn through it (see digTo/settleAt in
  // 50-world.js).
  {name:"hidden chamber",from:95,  to:CHAMBER_FLOOR_AT,bg:"linear-gradient(#170F0B 0%,#070403 100%)"}
];

/*__ROUNDS__*/


/* ---------- matching ---------- */
