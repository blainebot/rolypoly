function bow(x,y){return `<rect class="bow" x="${x}" y="${y}" width="8" height="9"/>`+
  `<rect class="bowknot" x="${x+9}" y="${y+2}" width="5" height="5"/>`+
  `<rect class="bow" x="${x+15}" y="${y}" width="8" height="9"/>`}

function WALK(who){return `<svg width="70" height="50" viewBox="0 0 112 76" role="img" aria-label="${who} walking">
${bow(9,17)}
<rect class="foot" x="0" y="12" width="8" height="8"/><rect class="seg" x="8" y="20" width="8" height="8"/>
<rect class="shell" x="24" y="20" width="64" height="8"/><rect class="shell" x="16" y="28" width="80" height="8"/>
<rect class="shell" x="8" y="36" width="88" height="8"/><rect class="shell" x="8" y="44" width="88" height="8"/>
<rect class="seg" x="36" y="20" width="6" height="32"/><rect class="seg" x="56" y="20" width="6" height="32"/>
<rect class="seg" x="76" y="20" width="6" height="32"/>
<rect class="spk" x="28" y="20" width="7" height="7"/><rect class="spk" x="48" y="20" width="7" height="7"/>
<rect class="spk" x="68" y="20" width="7" height="7"/>
<rect class="eye" x="14" y="34" width="9" height="9"/>
<g class="legA"><rect class="shell" x="24" y="52" width="8" height="8"/><rect class="foot" x="24" y="60" width="8" height="7"/>
<rect class="shell" x="68" y="52" width="8" height="8"/><rect class="foot" x="68" y="60" width="8" height="7"/></g>
<g class="legB"><rect class="shell" x="46" y="52" width="8" height="8"/><rect class="foot" x="46" y="60" width="8" height="7"/></g>
</svg>`}

function BALL(who){return `<svg width="50" height="58" viewBox="0 0 64 74" role="img" aria-label="${who} curled up">
${bow(20,0)}
<rect class="shell" x="19" y="12" width="26" height="6"/>
<rect class="shell" x="11" y="18" width="43" height="6"/>
<rect class="shell" x="6" y="24" width="52" height="6"/>
<rect class="shell" x="3" y="30" width="57" height="6"/>
<rect class="shell" x="2" y="36" width="60" height="6"/>
<rect class="shell" x="2" y="42" width="60" height="6"/>
<rect class="shell" x="3" y="48" width="57" height="6"/>
<rect class="shell" x="6" y="54" width="52" height="6"/>
<rect class="shell" x="11" y="60" width="43" height="6"/>
<rect class="shell" x="19" y="66" width="26" height="6"/>
<rect class="seg" x="17" y="20" width="5" height="44"/>
<rect class="seg" x="30" y="13" width="5" height="58"/>
<rect class="seg" x="43" y="20" width="5" height="44"/>
<rect class="spk" x="22" y="22" width="6" height="6"/><rect class="spk" x="37" y="30" width="6" height="6"/>
<rect class="eye" x="6" y="38" width="8" height="8"/></svg>`}

const RELICS=[
 {n:"a brass streetcar token", g:`<rect x="4" y="0" width="14" height="4" fill="#C9954A"/>
<rect x="0" y="4" width="22" height="14" fill="#C9954A"/><rect x="4" y="18" width="14" height="4" fill="#C9954A"/>
<rect x="7" y="7" width="8" height="8" fill="#7A5828"/><rect x="4" y="4" width="5" height="4" fill="#E8C07A"/>`},
 {n:"a chipped blue marble", g:`<rect x="5" y="0" width="12" height="4" fill="#3E7BC4"/>
<rect x="1" y="4" width="20" height="14" fill="#3E7BC4"/><rect x="5" y="18" width="12" height="4" fill="#3E7BC4"/>
<rect x="5" y="5" width="7" height="6" fill="#9CD0F5"/><rect x="13" y="12" width="6" height="5" fill="#22508C"/>`},
 {n:"a flint arrowhead", g:`<rect x="9" y="0" width="4" height="5" fill="#B7AFA0"/>
<rect x="7" y="5" width="8" height="5" fill="#B7AFA0"/><rect x="4" y="10" width="14" height="5" fill="#B7AFA0"/>
<rect x="1" y="15" width="20" height="5" fill="#8E877A"/><rect x="8" y="6" width="4" height="8" fill="#D8D2C6"/>`},
 {n:"a bent tin soldier", g:`<rect x="7" y="0" width="8" height="5" fill="#C0392B"/>
<rect x="5" y="5" width="12" height="9" fill="#2E5B8A"/><rect x="5" y="14" width="4" height="8" fill="#2E5B8A"/>
<rect x="13" y="14" width="4" height="8" fill="#2E5B8A"/><rect x="8" y="7" width="6" height="4" fill="#E8C07A"/>`},
 {n:"a rusted skeleton key", g:`<rect x="0" y="6" width="6" height="10" fill="#A97B3C"/>
<rect x="2" y="9" width="2" height="4" fill="#3A2A12"/><rect x="6" y="9" width="14" height="4" fill="#A97B3C"/>
<rect x="16" y="13" width="4" height="5" fill="#A97B3C"/><rect x="10" y="13" width="3" height="4" fill="#A97B3C"/>`}
];
function RELIC(i){return `<g class="relic">${RELICS[i].g}</g>`}

const SCENE={
 Music:{
  bg:"#6B4A2E",
  hat:`<rect class="hair" x="12" y="4" width="64" height="10"/><rect class="hair" x="6" y="10" width="12" height="20"/>
<rect class="hair" x="70" y="10" width="12" height="20"/><rect class="hair" x="16" y="14" width="56" height="8"/>
<rect class="hair" x="20" y="22" width="14" height="4"/><rect class="hair" x="54" y="22" width="14" height="4"/>`,
  prop:`<rect class="gtr" x="40" y="64" width="34" height="7"/><rect class="gtrdk" x="30" y="61" width="10" height="13"/>
<rect class="gtr" x="70" y="70" width="32" height="28"/>
<rect class="gtrlt" x="74" y="74" width="24" height="20"/><rect class="gtrdk" x="80" y="79" width="10" height="9"/>`,
  float:`<g class="nt nt1"><rect class="note" x="128" y="46" width="10" height="7"/><rect class="note" x="136" y="30" width="3" height="17"/></g>
<g class="nt nt2"><rect class="note" x="138" y="34" width="10" height="7"/><rect class="note" x="146" y="18" width="3" height="17"/></g>
<g class="nt nt3"><rect class="note" x="130" y="66" width="10" height="7"/><rect class="note" x="138" y="50" width="3" height="17"/></g>`},
 Geography:{
  bg:"#2E3A42",
  prop:`<rect class="pole" x="86" y="12" width="3" height="80"/>
<g class="flagwave"><rect class="flagedge" x="86" y="9" width="38" height="27"/>
<rect class="flagK" x="89" y="12" width="32" height="7"/>
<rect class="flagR" x="89" y="19" width="32" height="7"/>
<rect class="flagY" x="89" y="26" width="32" height="7"/></g>`},
 Film:{
  bg:"#55514C",
  prop:`<rect class="clap" x="84" y="60" width="46" height="17"/>
<rect class="clapx" x="88" y="66" width="8" height="5"/><rect class="clapx" x="102" y="66" width="8" height="5"/>
<g class="claptop"><rect class="clap" x="84" y="50" width="46" height="9"/>
<rect class="clapx" x="88" y="51" width="7" height="7"/><rect class="clapx" x="100" y="51" width="7" height="7"/>
<rect class="clapx" x="112" y="51" width="7" height="7"/></g>`},
 Space:{
  bg:"#101A3A",
  eyes:`<rect class="fur" x="22" y="24" width="13" height="13"/><rect class="fur" x="53" y="24" width="13" height="13"/>
<g class="pupil"><rect class="eye" x="26" y="28" width="7" height="7"/><rect class="eye" x="57" y="28" width="7" height="7"/></g>`,
  prop:`<g class="orbit"><rect class="ring" x="82" y="30" width="44" height="4"/>
<rect class="planet" x="96" y="20" width="14" height="4"/><rect class="planet" x="92" y="24" width="22" height="14"/>
<rect class="planet" x="96" y="38" width="14" height="4"/>
<rect class="ring" x="82" y="30" width="12" height="4"/><rect class="ring" x="114" y="30" width="12" height="4"/></g>`},

 pinkfloyd:{
  bg:"#241F47",
  float:(()=>{
    const pig=`<rect class="pigskin" x="3" y="3" width="19" height="10"/>
<rect class="pigskin" x="0" y="5" width="4" height="6"/><rect class="pigdk" x="0" y="7" width="2" height="2"/>
<rect class="pigskin" x="6" y="0" width="5" height="4"/><rect class="pigdk" x="7" y="1" width="2" height="2"/>
<rect class="pigskin" x="5" y="13" width="3" height="4"/><rect class="pigskin" x="15" y="13" width="3" height="4"/>
<rect class="pigdk" x="22" y="4" width="3" height="2"/><rect class="pigdk" x="24" y="6" width="2" height="3"/>`;
    const at=(x,y,s,c)=>`<g transform="translate(${x},${y}) scale(${s})"><g class="pig ${c}">${pig}</g></g>`;
    return at(4,0,2.0,"pg1")+at(106,2,2.0,"pg2")+at(2,58,1.7,"pg3")+at(112,60,1.8,"pg4");
  })()},

 arctic:{
  bg:"#10394F",
  hat:`<rect class="pom" x="38" y="0" width="12" height="7"/>
<rect class="wool" x="22" y="7" width="46" height="7"/>
<rect class="wool" x="14" y="14" width="62" height="7"/>
<rect class="cuff" x="12" y="21" width="66" height="7"/>
<rect class="woollt" x="24" y="9" width="8" height="5"/><rect class="woollt" x="52" y="16" width="8" height="5"/>`,
  prop:`<rect class="scarf" x="10" y="70" width="68" height="10"/>
<rect class="cuff" x="26" y="70" width="7" height="10"/><rect class="cuff" x="56" y="70" width="7" height="10"/>
<rect class="scarf" x="62" y="80" width="14" height="20"/>
<rect class="cuff" x="62" y="88" width="14" height="5"/>`,
  float:`<g class="flake f1"><rect x="16" y="0" width="6" height="6" fill="#F3EDE0"/></g>
<g class="flake f2"><rect x="52" y="0" width="5" height="5" fill="#F3EDE0"/></g>
<g class="flake f3"><rect x="98" y="0" width="6" height="6" fill="#F3EDE0"/></g>
<g class="flake f4"><rect x="134" y="0" width="5" height="5" fill="#F3EDE0"/></g>
<g class="flake f5"><rect x="76" y="0" width="5" height="5" fill="#F3EDE0"/></g>
<g class="flake f6"><rect x="120" y="0" width="6" height="6" fill="#F3EDE0"/></g>`},

 wonderland:{
  bg:"#3C1836",
  prop:`<g class="axe">
<rect class="haft" x="96" y="30" width="5" height="54"/>
<rect class="heart" x="86" y="6" width="9" height="6"/><rect class="heart" x="102" y="6" width="9" height="6"/>
<rect class="heart" x="84" y="12" width="29" height="7"/>
<rect class="heart" x="86" y="19" width="25" height="6"/>
<rect class="heart" x="90" y="25" width="17" height="5"/>
<rect class="heart" x="94" y="30" width="9" height="5"/>
<rect class="heartlt" x="88" y="9" width="6" height="5"/><rect class="heartlt" x="104" y="9" width="5" height="4"/>
<rect class="heartdk" x="84" y="17" width="29" height="2"/></g>`,
  float:`<g class="bubble"><rect class="bub" x="2" y="2" width="64" height="42"/>
<rect class="bub" x="52" y="44" width="11" height="9"/>
<text class="bubt" x="8" y="20" textLength="52" lengthAdjust="spacingAndGlyphs">OFF WITH</text>
<text class="bubt" x="8" y="37" textLength="52" lengthAdjust="spacingAndGlyphs">YOUR HEAD!</text></g>`},

 revolution:{
  bg:"#5E4A3A",
  hat:`<rect class="tri" x="30" y="4" width="26" height="12"/>
<rect class="tri" x="2" y="8" width="16" height="10"/><rect class="tri" x="68" y="8" width="16" height="10"/>
<rect class="tri" x="4" y="16" width="78" height="7"/>
<rect class="braid" x="4" y="16" width="78" height="3"/>
<rect class="braid" x="34" y="7" width="6" height="9"/>`,
  prop:`<rect class="coat" x="10" y="76" width="20" height="24"/>
<rect class="coat" x="58" y="76" width="20" height="24"/>
<rect class="coatdk" x="10" y="76" width="20" height="4"/><rect class="coatdk" x="58" y="76" width="20" height="4"/>
<rect class="cuff" x="34" y="68" width="20" height="8"/>
<rect class="cuff" x="38" y="76" width="13" height="9"/>
<rect class="braid" x="30" y="82" width="4" height="4"/><rect class="braid" x="30" y="92" width="4" height="4"/>
<rect class="braid" x="54" y="82" width="4" height="4"/><rect class="braid" x="54" y="92" width="4" height="4"/>`},

 Food:{
  bg:"#1F3A22",
  prop:`<rect class="stem" x="60" y="46" width="3" height="6"/><rect class="leafy" x="63" y="46" width="9" height="4"/>
<g class="apw"><rect class="apple" x="52" y="52" width="22" height="18"/><rect class="apple" x="56" y="70" width="14" height="4"/></g>
<g class="apb"><rect class="apple" x="60" y="52" width="14" height="18"/><rect class="apple" x="52" y="52" width="8" height="5"/>
<rect class="apple" x="52" y="65" width="8" height="5"/><rect class="apple" x="60" y="70" width="10" height="4"/></g>`}
};
const HA=`<text class="ha ha1" x="128" y="52">ha</text><text class="ha ha2" x="138" y="38">ha</text><text class="ha ha3" x="130" y="72">ha</text>`;

function SLEEPER(awake){
  const eyes = awake
    ? `<rect class="sclera" x="29" y="61" width="14" height="14"/>
<rect class="sclera" x="57" y="61" width="14" height="14"/>
<g class="glance"><rect class="eye" x="33" y="64" width="6" height="8"/>
<rect class="eye" x="61" y="64" width="6" height="8"/></g>`
    : `<rect class="eye" x="30" y="67" width="12" height="3"/><rect class="eye" x="58" y="67" width="12" height="3"/>`;
  const zs = awake ? "" : `<text class="zz z1" x="84" y="46">z</text>
<text class="zz z2" x="94" y="32">z</text><text class="zz z3" x="104" y="20">z</text>`;
  return `<svg class="densvg" viewBox="0 0 124 100" role="img" aria-label="Rumble asleep in his burrow">
<rect class="rimlt" x="12" y="26" width="72" height="5"/>
<rect class="rim" x="4" y="31" width="88" height="7"/>
<rect class="rim" x="0" y="38" width="8" height="62"/><rect class="rim" x="84" y="38" width="8" height="62"/>
<rect class="tunnel" x="8" y="38" width="76" height="62"/>
<rect class="tunnel" x="16" y="31" width="60" height="7"/>
<g class="sleephead">
<rect class="furdk" x="14" y="52" width="11" height="11"/><rect class="furdk" x="67" y="52" width="11" height="11"/>
<rect class="fur" x="24" y="56" width="44" height="7"/>
<rect class="fur" x="18" y="63" width="56" height="9"/>
<rect class="fur" x="18" y="72" width="56" height="9"/>
<rect class="fur" x="26" y="81" width="40" height="6"/>
<rect class="furlt" x="20" y="74" width="7" height="7"/><rect class="furlt" x="65" y="74" width="7" height="7"/>
${eyes}
<rect class="furdk" x="40" y="75" width="13" height="5"/>
<rect class="incisor" x="39" y="84" width="6" height="3"/><rect class="incisor" x="48" y="84" width="6" height="3"/>
<rect class="tooth" x="39" y="87" width="6" height="11"/><rect class="tooth" x="48" y="87" width="6" height="11"/>
</g>
${zs}
</svg>`}

function GOPHER(scene){
  const sc=SCENE[scene]||{};
  const eyes=sc.eyes||`<rect class="eye" x="24" y="28" width="9" height="5"/><rect class="eye" x="55" y="28" width="9" height="5"/>`;
  return `<svg class="goph ${scene?"sc-"+scene:""}" width="150" height="113" viewBox="0 0 160 120" role="img" aria-label="Rumble the gopher">
<g class="figure">
<rect class="fur" x="16" y="68" width="56" height="10"/>
<rect class="fur" x="12" y="78" width="64" height="22"/>
<rect class="furlt" x="28" y="80" width="30" height="18"/>
<g class="armL"><rect class="fur" x="2" y="80" width="14" height="9"/><rect class="furdk" x="0" y="84" width="7" height="9"/></g>
<g class="armR"><rect class="fur" x="72" y="80" width="14" height="9"/><rect class="furdk" x="82" y="84" width="7" height="9"/></g>
<g class="bob">
<rect class="furdk" x="6" y="10" width="14" height="14"/><rect class="furdk" x="68" y="10" width="14" height="14"/>
<rect class="fur" x="10" y="14" width="6" height="6"/><rect class="fur" x="72" y="14" width="6" height="6"/>
<rect class="fur" x="20" y="18" width="48" height="8"/><rect class="fur" x="12" y="26" width="64" height="8"/>
<rect class="fur" x="12" y="34" width="64" height="8"/><rect class="fur" x="12" y="42" width="64" height="8"/>
<rect class="fur" x="20" y="50" width="48" height="8"/>
<rect class="furlt" x="14" y="36" width="8" height="8"/><rect class="furlt" x="66" y="36" width="8" height="8"/>
${eyes}
<rect class="furdk" x="36" y="40" width="16" height="7"/>
<g class="jaw"><rect class="incisor" x="35" y="50" width="8" height="4"/><rect class="incisor" x="45" y="50" width="8" height="4"/>
<rect class="tooth" x="35" y="54" width="8" height="14"/><rect class="tooth" x="45" y="54" width="8" height="14"/></g>
${sc.hat||""}
</g>
${sc.prop||""}
</g>
<rect class="dirt" x="0" y="96" width="160" height="24"/>
<rect class="dirtlt" x="0" y="96" width="160" height="5"/>
${sc.float||HA}
</svg>`}

/* ---------- world ---------- */
const PX=34, CLEAR=76;
const depthPx=cm=>cm>0?CLEAR+cm*PX:0;
