const TIERS=[
  {max:7,  name:"leaf litter", v:"moss",  e:"\u{1F342}", lo:1},
  {max:14, name:"topsoil",     v:"sand",  e:"\u{1FAB1}", lo:8},
  {max:24, name:"root line",   v:"rust",  e:"\u{1FAB5}", lo:15},
  {max:999,name:"bedrock",     v:"ember", e:"\u{1F48E}", lo:25}
];
const tierFor=v=>TIERS.find(t=>v<=t.max);

const LAYERS=[
  {name:"",              from:-520,to:0,  sky:1, bg:"linear-gradient(#3E96D4 0%,#74BCE5 52%,#A6D6EE 94.5%,#79A650 94.5%,#5B8341 100%)"},
  {name:"leaf litter",   from:0,   to:12, bg:"linear-gradient(#7D8A5A,#A98F4E)"},
  {name:"topsoil",       from:12,  to:32, bg:"linear-gradient(#C1934F,#BC7F3C)"},
  {name:"root line",     from:32,  to:58, bg:"linear-gradient(#B4692F,#A04E1D)"},
  {name:"bedrock",       from:58,  to:95, bg:"linear-gradient(#8E3A22,#6A2413)"},
  {name:"hidden chamber",from:95,  to:280,bg:"linear-gradient(#4A1A0D,#1A0602)"}
];

/*__ROUNDS__*/


/* ---------- matching ---------- */
