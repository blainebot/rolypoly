// Poly is five overlapping armour plates, front to back: each plate's leading
// top edge is "spk", the seam where the next plate overlaps it is "seg", and
// the body is "shell" — all three read from --shell/-lt/-dk, so the whole bug
// recolours to the last find's tier. Never hardcode a shell colour. Antenna
// ("ant"/"anttip") and feet ("foot") are the fixed accents that keep her
// recognisable in every tier. She faces left; renderBug() mirrors her with
// scaleX when she walks right. No shading or anti-aliasing anywhere — at the
// ~64px she actually renders, soft edges turn to mush.
//
// The width attributes only matter where CSS doesn't size the sprite (the
// intro's .cast); they're kept at the old sprites' widths so swapping the art
// didn't also resize the title screen.
function WALK(who){return `<svg width="70" height="33" viewBox="0 0 300 140" role="img" aria-label="${who} walking">
<rect class="anttip" x="40" y="26" width="8" height="8"/>
<rect class="ant" x="48" y="34" width="8" height="8"/>
<rect class="ant" x="56" y="42" width="8" height="8"/>
<rect class="ant" x="64" y="50" width="8" height="8"/>
<rect class="anttip" x="18" y="52" width="8" height="8"/>
<rect class="ant" x="26" y="56" width="10" height="8"/>
<rect class="ant" x="36" y="60" width="10" height="8"/>
<rect class="ant" x="46" y="64" width="10" height="8"/>

<rect class="shell" x="56" y="64" width="40" height="8"/>
<rect class="shell" x="48" y="72" width="48" height="8"/>
<rect class="shell" x="44" y="80" width="52" height="8"/>
<rect class="shell" x="44" y="88" width="52" height="8"/>
<rect class="shell" x="48" y="96" width="48" height="8"/>
<rect class="shell" x="56" y="104" width="40" height="8"/>
<rect class="spk" x="60" y="64" width="22" height="8"/>
<rect class="eye" x="50" y="78" width="18" height="16"/>
<rect class="glint" x="54" y="81" width="7" height="7"/>

<rect class="shell" x="96" y="48" width="36" height="8"/>
<rect class="shell" x="92" y="56" width="44" height="8"/>
<rect class="shell" x="90" y="64" width="48" height="40"/>
<rect class="shell" x="96" y="104" width="42" height="8"/>
<rect class="spk" x="100" y="48" width="26" height="8"/>
<rect class="spk" x="96" y="56" width="22" height="8"/>
<rect class="seg" x="132" y="48" width="6" height="64"/>

<rect class="shell" x="136" y="40" width="40" height="8"/>
<rect class="shell" x="130" y="48" width="52" height="56"/>
<rect class="shell" x="136" y="104" width="46" height="8"/>
<rect class="spk" x="140" y="40" width="28" height="8"/>
<rect class="spk" x="134" y="48" width="24" height="8"/>
<rect class="seg" x="176" y="40" width="6" height="72"/>

<rect class="shell" x="180" y="40" width="38" height="8"/>
<rect class="shell" x="174" y="48" width="50" height="56"/>
<rect class="shell" x="180" y="104" width="44" height="8"/>
<rect class="spk" x="184" y="40" width="26" height="8"/>
<rect class="spk" x="178" y="48" width="22" height="8"/>
<rect class="seg" x="218" y="40" width="6" height="72"/>

<rect class="shell" x="222" y="48" width="34" height="8"/>
<rect class="shell" x="218" y="56" width="50" height="40"/>
<rect class="shell" x="220" y="96" width="44" height="8"/>
<rect class="shell" x="224" y="104" width="36" height="8"/>
<rect class="spk" x="226" y="48" width="24" height="8"/>
<rect class="spk" x="222" y="56" width="20" height="8"/>
<rect class="seg" x="260" y="56" width="6" height="48"/>

<rect class="shell" x="264" y="64" width="30" height="24"/>
<rect class="spk" x="266" y="64" width="16" height="8"/>

<g class="legA">
<rect class="shell" x="62" y="112" width="14" height="14"/><rect class="foot" x="62" y="126" width="14" height="8"/>
<rect class="shell" x="160" y="112" width="14" height="14"/><rect class="foot" x="160" y="126" width="14" height="8"/>
<rect class="shell" x="246" y="112" width="14" height="12"/><rect class="foot" x="246" y="124" width="14" height="8"/>
</g>
<g class="legB">
<rect class="shell" x="110" y="112" width="14" height="14"/><rect class="foot" x="110" y="126" width="14" height="8"/>
<rect class="shell" x="208" y="112" width="14" height="14"/><rect class="foot" x="208" y="126" width="14" height="8"/>
</g>
</svg>`}

// Curled: a proper circle with the plate seams radiating from the centre, so
// it reads as the same creature rolled up rather than a generic ball. The
// antenna tip peeking out at the front is what sells the pose.
function BALL(who){return `<svg width="50" height="50" viewBox="0 0 96 96" role="img" aria-label="${who} curled up">
<rect class="anttip" x="6" y="30" width="7" height="7"/>
<rect class="ant" x="13" y="34" width="8" height="6"/>
<rect class="shell" x="30" y="6" width="36" height="6"/>
<rect class="shell" x="20" y="12" width="56" height="6"/>
<rect class="shell" x="14" y="18" width="68" height="6"/>
<rect class="shell" x="10" y="24" width="76" height="6"/>
<rect class="shell" x="7" y="30" width="82" height="6"/>
<rect class="shell" x="5" y="36" width="86" height="6"/>
<rect class="shell" x="4" y="42" width="88" height="12"/>
<rect class="shell" x="5" y="54" width="86" height="6"/>
<rect class="shell" x="7" y="60" width="82" height="6"/>
<rect class="shell" x="10" y="66" width="76" height="6"/>
<rect class="shell" x="14" y="72" width="68" height="6"/>
<rect class="shell" x="20" y="78" width="56" height="6"/>
<rect class="shell" x="30" y="84" width="36" height="6"/>
<rect class="spk" x="30" y="10" width="26" height="6"/>
<rect class="spk" x="20" y="16" width="20" height="6"/>
<rect class="spk" x="14" y="22" width="14" height="6"/>
<rect class="seg" x="24" y="14" width="5" height="68"/>
<rect class="seg" x="42" y="7" width="5" height="82"/>
<rect class="seg" x="60" y="10" width="5" height="76"/>
<rect class="seg" x="74" y="20" width="5" height="56"/>
<rect class="eye" x="8" y="42" width="12" height="12"/>
<rect class="glint" x="11" y="45" width="5" height="5"/>
</svg>`}

// Never named to the player (see "The mantle" in CLAUDE.md) — the
// comment on each entry is just so an author editing this list can tell
// what they're looking at.
const RELICS=[
 // a brass streetcar token
 {g:`<rect x="4" y="0" width="14" height="4" fill="#C9954A"/>
<rect x="0" y="4" width="22" height="14" fill="#C9954A"/><rect x="4" y="18" width="14" height="4" fill="#C9954A"/>
<rect x="7" y="7" width="8" height="8" fill="#7A5828"/><rect x="4" y="4" width="5" height="4" fill="#E8C07A"/>`},
 // a chipped blue marble
 {g:`<rect x="5" y="0" width="12" height="4" fill="#3E7BC4"/>
<rect x="1" y="4" width="20" height="14" fill="#3E7BC4"/><rect x="5" y="18" width="12" height="4" fill="#3E7BC4"/>
<rect x="5" y="5" width="7" height="6" fill="#9CD0F5"/><rect x="13" y="12" width="6" height="5" fill="#22508C"/>`},
 // a flint arrowhead
 {g:`<rect x="9" y="0" width="4" height="5" fill="#B7AFA0"/>
<rect x="7" y="5" width="8" height="5" fill="#B7AFA0"/><rect x="4" y="10" width="14" height="5" fill="#B7AFA0"/>
<rect x="1" y="15" width="20" height="5" fill="#8E877A"/><rect x="8" y="6" width="4" height="8" fill="#D8D2C6"/>`},
 // a bent tin soldier
 {g:`<rect x="7" y="0" width="8" height="5" fill="#C0392B"/>
<rect x="5" y="5" width="12" height="9" fill="#2E5B8A"/><rect x="5" y="14" width="4" height="8" fill="#2E5B8A"/>
<rect x="13" y="14" width="4" height="8" fill="#2E5B8A"/><rect x="8" y="7" width="6" height="4" fill="#E8C07A"/>`},
 // a rusted skeleton key
 {g:`<rect x="0" y="6" width="6" height="10" fill="#A97B3C"/>
<rect x="2" y="9" width="2" height="4" fill="#3A2A12"/><rect x="6" y="9" width="14" height="4" fill="#A97B3C"/>
<rect x="16" y="13" width="4" height="5" fill="#A97B3C"/><rect x="10" y="13" width="3" height="4" fill="#A97B3C"/>`}
];
function RELIC(i){return `<g class="relic">${RELICS[i].g}</g>`}

const SCENE={
 Music:{
  bg:"#6B4A2E",
  hat:`<rect class="hair" x="62" y="10" width="92" height="10"/>
<rect class="hair" x="30" y="14" width="26" height="58"/><rect class="hair" x="160" y="14" width="26" height="58"/>
<rect class="hair" x="44" y="20" width="128" height="16"/>
<rect class="hair" x="56" y="36" width="34" height="9"/><rect class="hair" x="126" y="36" width="34" height="9"/>
<rect class="hair" x="90" y="36" width="36" height="4"/>`,
  prop:`<rect class="gtr" x="40" y="74" width="34" height="7"/><rect class="gtrdk" x="30" y="71" width="10" height="13"/>
<rect class="gtr" x="70" y="78" width="32" height="28"/>
<rect class="gtrlt" x="74" y="82" width="24" height="20"/><rect class="gtrdk" x="80" y="87" width="10" height="9"/>`,
  float:`<g class="nt nt1"><rect class="note" x="128" y="46" width="10" height="7"/><rect class="note" x="136" y="30" width="3" height="17"/></g>
<g class="nt nt2"><rect class="note" x="138" y="34" width="10" height="7"/><rect class="note" x="146" y="18" width="3" height="17"/></g>
<g class="nt nt3"><rect class="note" x="130" y="66" width="10" height="7"/><rect class="note" x="138" y="50" width="3" height="17"/></g>`},
 Geography:{
  bg:"#2E3A42",
  prop:`<rect class="pole" x="90" y="12" width="3" height="80"/>
<g class="flagwave"><rect class="flagedge" x="90" y="9" width="38" height="27"/>
<rect class="flagK" x="93" y="12" width="32" height="7"/>
<rect class="flagR" x="93" y="19" width="32" height="7"/>
<rect class="flagY" x="93" y="26" width="32" height="7"/></g>`},
 Film:{
  bg:"#55514C",
  prop:(()=>{
    const bx=90,by=50,bw=46,bh=9,n=7,slant=5,unit=(bw+slant)/n;
    let stripes="";
    for(let i=0;i<n;i++){
      const cls=i%2?"clapx":"clap";
      const xT=bx-slant+i*unit,xTend=xT+unit,xB=xT+slant,xBend=xTend+slant;
      const cxT=Math.max(bx,Math.min(bx+bw,xT)),cxTend=Math.max(bx,Math.min(bx+bw,xTend));
      const cxB=Math.max(bx,Math.min(bx+bw,xB)),cxBend=Math.max(bx,Math.min(bx+bw,xBend));
      if(cxTend>cxT||cxBend>cxB)
        stripes+=`<polygon class="${cls}" points="${cxT},${by} ${cxTend},${by} ${cxBend},${by+bh} ${cxB},${by+bh}"/>`;
    }
    return `<rect class="clap" x="${bx}" y="${by+10}" width="${bw}" height="17"/>
<rect class="clapx" x="${bx+4}" y="${by+16}" width="22" height="2"/>
<rect class="clapx" x="${bx+4}" y="${by+21}" width="14" height="2"/>
<g class="claptop"><rect class="clap" x="${bx}" y="${by}" width="${bw}" height="${bh}"/>${stripes}</g>`;
  })()},
 Space:{
  bg:"#101A3A",
  eyes:`<rect class="sclera" x="54" y="46" width="32" height="24"/><rect class="sclera" x="130" y="46" width="32" height="24"/>
<g class="pupil"><rect class="eye" x="63" y="52" width="14" height="14"/><rect class="eye" x="139" y="52" width="14" height="14"/></g>`,
  prop:`<g class="orbit"><rect class="ring" x="90" y="30" width="44" height="4"/>
<rect class="planet" x="104" y="20" width="14" height="4"/><rect class="planet" x="100" y="24" width="22" height="14"/>
<rect class="planet" x="104" y="38" width="14" height="4"/>
<rect class="ring" x="90" y="30" width="12" height="4"/><rect class="ring" x="122" y="30" width="12" height="4"/></g>`},

 pinkfloyd:{
  bg:"#241F47",
  float:(()=>{
    const pig=`<rect class="pigskin" x="8" y="2" width="18" height="11"/>
<rect class="pigskin" x="5" y="0" width="5" height="4"/><rect class="pigdk" x="6" y="1" width="2" height="2"/>
<rect class="pigskin" x="0" y="4" width="9" height="9"/>
<rect class="eye" x="4" y="6" width="2" height="2"/>
<rect class="pigdk" x="1" y="10" width="1" height="1"/><rect class="pigdk" x="3" y="10" width="1" height="1"/>
<rect class="pigskin" x="10" y="13" width="4" height="5"/><rect class="pigskin" x="20" y="13" width="4" height="5"/>
<rect class="pigdk" x="25" y="1" width="3" height="2"/><rect class="pigdk" x="27" y="3" width="2" height="3"/>`;
    const at=(x,y,s,c)=>`<g transform="translate(${x},${y}) scale(${s})"><g class="pig ${c}">${pig}</g></g>`;
    return at(4,0,2.0,"pg1")+at(100,2,2.0,"pg2")+at(2,58,1.7,"pg3")+at(105,60,1.8,"pg4");
  })()},

 arctic:{
  bg:"#10394F",
  hat:`<rect class="pom" x="96" y="9" width="24" height="12"/>
<rect class="wool" x="70" y="19" width="76" height="11"/>
<rect class="wool" x="52" y="30" width="112" height="10"/>
<rect class="cuff" x="42" y="40" width="132" height="10"/>
<rect class="woollt" x="82" y="21" width="14" height="8"/><rect class="woollt" x="126" y="31" width="14" height="8"/>`,
  prop:`<rect class="scarf" x="10" y="74" width="68" height="10"/>
<rect class="cuff" x="26" y="74" width="7" height="10"/><rect class="cuff" x="56" y="74" width="7" height="10"/>
<rect class="scarf" x="62" y="84" width="14" height="20"/>
<rect class="cuff" x="62" y="92" width="14" height="5"/>`,
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
  hat:`<rect class="tri" x="74" y="10" width="68" height="22"/>
<rect class="tri" x="32" y="18" width="32" height="18"/><rect class="tri" x="152" y="18" width="32" height="18"/>
<rect class="tri" x="34" y="32" width="148" height="12"/>
<rect class="braid" x="34" y="32" width="148" height="4"/>
<rect class="braid" x="84" y="14" width="10" height="18"/>`,
  prop:`<rect class="coat" x="10" y="76" width="20" height="24"/>
<rect class="coat" x="58" y="76" width="20" height="24"/>
<rect class="coatdk" x="10" y="76" width="20" height="4"/><rect class="coatdk" x="58" y="76" width="20" height="4"/>
<rect class="cuff" x="34" y="74" width="20" height="8"/>
<rect class="cuff" x="38" y="82" width="13" height="9"/>
<rect class="braid" x="30" y="82" width="4" height="4"/><rect class="braid" x="30" y="92" width="4" height="4"/>
<rect class="braid" x="54" y="82" width="4" height="4"/><rect class="braid" x="54" y="92" width="4" height="4"/>`},

 Food:{
  bg:"#1F3A22",
  prop:`<rect class="stem" x="64" y="52" width="3" height="6"/><rect class="leafy" x="67" y="52" width="9" height="4"/>
<g class="apw"><rect class="apple" x="56" y="58" width="22" height="18"/><rect class="apple" x="60" y="76" width="14" height="4"/></g>
<g class="apb"><rect class="apple" x="64" y="58" width="14" height="18"/><rect class="apple" x="56" y="58" width="8" height="5"/>
<rect class="apple" x="56" y="71" width="8" height="5"/><rect class="apple" x="64" y="76" width="10" height="4"/></g>`},

 bigten:{
  bg:"#1E4A2A",
  // The dome covers the skull and ears and stops at y=50, above the eye line
  // (y=54). The facemask is two side rails outside the cheeks plus three thin
  // bars low across the jaw — the first one below the nose (which ends at
  // y=94) — with real gaps so the teeth read through. A solid cage here was
  // the original bug: eyes, nose and teeth all painted over.
  hat:`<rect class="helm" x="66" y="10" width="84" height="6"/>
<rect class="helm" x="36" y="16" width="144" height="10"/>
<rect class="helm" x="34" y="26" width="148" height="18"/>
<rect class="helmstripe" x="100" y="10" width="16" height="34"/>
<rect class="helmdk" x="34" y="44" width="148" height="6"/>
<rect class="mask" x="28" y="50" width="6" height="64"/><rect class="mask" x="182" y="50" width="6" height="64"/>
<rect class="mask" x="34" y="96" width="148" height="5"/>
<rect class="mask" x="34" y="108" width="148" height="5"/>
<rect class="mask" x="34" y="119" width="148" height="5"/>`,
  prop:`<rect class="pads" x="2" y="66" width="26" height="16"/>
<rect class="pads" x="60" y="66" width="26" height="16"/>
<rect class="jersey" x="12" y="78" width="64" height="22"/>
<rect class="num" x="24" y="82" width="6" height="16"/>
<rect class="num" x="42" y="82" width="16" height="4"/><rect class="num" x="42" y="94" width="16" height="4"/>
<rect class="num" x="42" y="86" width="4" height="8"/><rect class="num" x="54" y="86" width="4" height="8"/>`},

 girlscout:{
  bg:"#4A3A28",
  hat:`<rect class="beret" x="120" y="10" width="14" height="8"/>
<rect class="beret" x="70" y="16" width="100" height="12"/>
<rect class="beret" x="44" y="28" width="134" height="12"/>
<rect class="beretdk" x="46" y="40" width="130" height="8"/>`,
  prop:`<polygon class="sash" points="14,70 32,70 76,104 54,104"/>
<rect class="badgeD" x="18" y="71" width="6" height="6"/>
<rect class="badgeA" x="24" y="77" width="8" height="8"/>
<rect class="badgeB" x="33" y="83" width="8" height="8"/>
<rect class="badgeC" x="42" y="89" width="8" height="8"/>`},

 labcoat:{
  bg:"#14383C",
  hat:`<rect class="gogrim" x="38" y="26" width="140" height="10"/>
<rect class="gogrim" x="56" y="16" width="44" height="32"/><rect class="gogrim" x="116" y="16" width="44" height="32"/>
<rect class="goggle" x="60" y="20" width="36" height="24"/><rect class="goggle" x="120" y="20" width="36" height="24"/>
<rect class="gogrim" x="100" y="26" width="16" height="10"/>`,
  prop:`<rect class="lab" x="10" y="74" width="26" height="28"/>
<rect class="lab" x="52" y="74" width="26" height="28"/>
<rect class="labdk" x="34" y="74" width="8" height="28"/><rect class="labdk" x="46" y="74" width="8" height="28"/>
<rect class="flaskrim" x="92" y="24" width="24" height="5"/>
<rect class="flask" x="98" y="29" width="12" height="14"/>
<rect class="flask" x="94" y="43" width="20" height="6"/>
<rect class="flask" x="90" y="49" width="28" height="20"/>
<rect class="brew" x="90" y="57" width="28" height="12"/>
<rect class="brewlt" x="94" y="57" width="8" height="4"/>`,
  float:`<g class="bub1"><rect x="98" y="46" width="5" height="5" fill="#B6F0A6"/></g>
<g class="bub2"><rect x="108" y="46" width="4" height="4" fill="#B6F0A6"/></g>
<g class="bub3"><rect x="102" y="46" width="4" height="4" fill="#B6F0A6"/></g>`},

 monopoly:{
  bg:"#3E5A47",
  // hat paints over eyes (see GOPHER()'s render order) — the brim has to stop
  // above the monocle's top edge (y=44), not just the eye line, or it blots
  // out the frame. Brim ends at y=41.
  hat:`<rect class="tophat" x="72" y="9" width="72" height="25"/>
<rect class="hatband" x="72" y="26" width="72" height="8"/>
<rect class="tophat" x="50" y="34" width="116" height="7"/>
<rect class="hatlt" x="78" y="12" width="9" height="14"/>`,
  eyes:`<rect class="eye" x="56" y="54" width="28" height="8"/>
<rect class="mono" x="124" y="44" width="44" height="34"/>
<rect class="monoglass" x="130" y="48" width="32" height="26"/>
<rect class="eye" x="132" y="54" width="28" height="8"/>
<rect class="chain" x="166" y="76" width="5" height="28"/>
<rect class="chain" x="168" y="100" width="18" height="5"/>`},

 penguins:{
  bg:"#2A5A72",
  eyes:`<rect class="sclera" x="54" y="46" width="32" height="24"/><rect class="sclera" x="130" y="46" width="32" height="24"/>
<g class="lookLR"><rect class="eye" x="63" y="52" width="14" height="14"/><rect class="eye" x="139" y="52" width="14" height="14"/></g>`,
  float:(()=>{
    const p=`<rect class="pengdk" x="10" y="0" width="12" height="6"/>
<rect class="pengdk" x="8" y="6" width="16" height="6"/><rect class="pengdk" x="6" y="12" width="20" height="6"/>
<rect class="pengdk" x="4" y="18" width="24" height="12"/><rect class="pengdk" x="6" y="30" width="20" height="6"/>
<rect class="pengdk" x="8" y="36" width="16" height="6"/>
<rect class="pengwh" x="10" y="16" width="12" height="24"/>
<rect class="pengwh" x="10" y="4" width="4" height="4"/><rect class="pengwh" x="18" y="4" width="4" height="4"/>
<rect class="eye" x="11" y="5" width="2" height="2"/><rect class="eye" x="19" y="5" width="2" height="2"/>
<rect class="pengbk" x="14" y="8" width="5" height="4"/>
<rect class="pengdk" x="0" y="18" width="5" height="16"/><rect class="pengdk" x="27" y="18" width="5" height="16"/>
<rect class="pengbk" x="7" y="42" width="8" height="4"/><rect class="pengbk" x="18" y="42" width="8" height="4"/>`;
    return `<g transform="translate(4,54) scale(1.25)">${p}</g>`
         + `<g transform="translate(116,52) scale(1.35)">${p}</g>`;
  })()},

 // Game 005. Same rules as above: hat/eyes in head coordinates, props in
 // viewBox coordinates, side props between x=90 and the "ha" strip at 136.
 animator:{
  bg:"#55514C",
  // Eyeshade visor: band across the forehead, brim just above the eyes, and
  // a translucent shadow strip under the brim that shades them without
  // covering them (the face trap).
  hat:`<rect class="visorband" x="40" y="32" width="136" height="8"/>
<rect class="visor" x="46" y="40" width="124" height="9"/>
<rect class="visorsh" x="54" y="49" width="108" height="4"/>`,
  prop:`<polygon class="eraser" points="83,77 87,79 89,75 85,73"/>
<polygon class="pencil" points="85,73 89,75 103,49 99,47"/>
<polygon class="lead" points="99,47 103,49 104,42"/>
<rect class="paper" x="100" y="88" width="30" height="8"/>
<rect class="paperdk" x="100" y="90" width="30" height="1"/><rect class="paperdk" x="100" y="93" width="30" height="1"/>
<polygon class="paper" points="98,86 124,82 126,85 100,89"/>
<polygon class="paper" points="108,84 134,86 133,88 107,86"/>`,
  float:`<g class="flake f1"><rect class="paper" x="104" y="0" width="9" height="11"/></g>
<g class="flake f3"><rect class="paper" x="128" y="0" width="8" height="10"/></g>
<g class="flake f5"><rect class="paper" x="148" y="0" width="9" height="11"/></g>`},

 showdog:{
  bg:"#2A4A33",
  // Groomed for the ring: a puff of fur gathered into a topknot (the dark
  // band is where it's tied), with a tiny bow at the side of the tie.
  hat:`<rect class="fur" x="100" y="9" width="16" height="3"/><rect class="fur" x="96" y="12" width="24" height="7"/>
<rect class="furlt" x="100" y="12" width="9" height="4"/>
<rect class="furdk" x="94" y="19" width="28" height="3"/>
<rect class="bow" x="118" y="15" width="7" height="7"/><rect class="bowknot" x="125" y="17" width="4" height="4"/>
<rect class="bow" x="129" y="15" width="7" height="7"/>`,
  prop:`<rect class="rosette" x="12" y="66" width="18" height="3"/>
<rect class="rosette" x="8" y="69" width="26" height="16"/>
<rect class="rosette" x="12" y="85" width="18" height="3"/>
<rect class="rosettelt" x="14" y="73" width="14" height="8"/>
<rect class="ribbon" x="11" y="88" width="6" height="10"/><rect class="ribbon" x="25" y="88" width="6" height="10"/>
<rect class="trophy" x="100" y="74" width="20" height="10"/>
<rect class="trophy" x="96" y="76" width="4" height="6"/><rect class="trophy" x="120" y="76" width="4" height="6"/>
<rect class="trophy" x="104" y="84" width="12" height="3"/><rect class="trophy" x="108" y="87" width="4" height="4"/>
<rect class="trophydk" x="102" y="91" width="16" height="5"/>
<rect class="trophylt" x="103" y="76" width="4" height="6"/>`},

 redjacket:{
  bg:"#1A1A20",
  // A gopher in a jacket, nothing more — no hair, hat or facial feature
  // that could read as a likeness. The jacket and one white glove carry it.
  prop:`<rect class="jacket" x="8" y="72" width="26" height="28"/>
<rect class="jacket" x="56" y="72" width="26" height="28"/>
<rect class="jacket" x="34" y="74" width="22" height="26"/>
<polygon class="chevron" points="8,72 45,86 82,72 82,77 45,91 8,77"/>
<polygon class="chevron" points="8,82 45,96 82,82 82,87 45,101 8,87"/>
<rect class="jacketdk" x="76" y="76" width="12" height="4"/>
<rect class="glove" x="78" y="62" width="12" height="14"/><rect class="glove" x="75" y="66" width="4" height="6"/>`},

 ballpark:{
  bg:"#23384F",
  // Cap on sideways, brim off to one side, a cardinal on the crown. The bird
  // lives in `hat`, not `float`: float doesn't bob with his head, so a
  // perched bird there would hover while the cap moved out from under it.
  // Rhymes with penguins — same lookLR eye-dart, pupils pushed up to watch.
  hat:`<rect class="cap" x="70" y="18" width="76" height="8"/>
<rect class="cap" x="52" y="26" width="112" height="8"/>
<rect class="cap" x="42" y="34" width="132" height="8"/>
<rect class="capdk" x="42" y="42" width="132" height="3"/>
<rect class="capdk" x="102" y="14" width="12" height="4"/><rect class="capbrim" x="166" y="36" width="44" height="8"/>
<rect class="card" x="78" y="11" width="14" height="7"/><rect class="card" x="73" y="13" width="6" height="3"/>
<rect class="card" x="88" y="9" width="4" height="3"/><rect class="card" x="90" y="11" width="7" height="6"/>
<rect class="cardk" x="93" y="12" width="3" height="3"/><rect class="cardbk" x="97" y="13" width="3" height="2"/>`,
  eyes:`<rect class="sclera" x="54" y="46" width="32" height="24"/><rect class="sclera" x="130" y="46" width="32" height="24"/>
<g class="lookLR"><rect class="eye" x="63" y="47" width="14" height="12"/><rect class="eye" x="139" y="47" width="14" height="12"/></g>`,
  prop:`<rect class="stick" x="88" y="48" width="3" height="36"/>
<polygon class="pennant" points="91,50 91,66 128,58"/>
<polygon class="pennantlt" points="91,55 91,61 106,58"/>`},

 passport:{
  bg:"#3E2E22",
  // The joke is scale: a full-size magnifying glass over a map not much
  // bigger than one of its own pixels. Passport in the other paw.
  prop:`<rect class="passport" x="2" y="68" width="12" height="15"/>
<rect class="passportlt" x="5" y="72" width="6" height="4"/>
<rect class="lens" x="94" y="70" width="18" height="3"/><rect class="lens" x="94" y="85" width="18" height="3"/>
<rect class="lens" x="91" y="73" width="3" height="12"/><rect class="lens" x="112" y="73" width="3" height="12"/>
<rect class="lensglass" x="94" y="73" width="18" height="12"/>
<rect class="lens" x="86" y="86" width="8" height="3"/>
<rect class="map" x="101" y="93" width="4" height="3"/><rect class="mapdk" x="102" y="94" width="2" height="1"/>
<rect class="case" x="118" y="82" width="18" height="14"/>
<rect class="casedk" x="118" y="87" width="18" height="2"/><rect class="casedk" x="124" y="78" width="6" height="4"/>
<rect class="tag" x="131" y="78" width="4" height="5"/>`},

 // Game 006. Generic on purpose: no chain's colours or marks, no dwarf, no
 // band member — a crew cap, a miner, a pilot, a pair of shades.
 drivethru:{
  bg:"#2E4B5A",
  // Paper crew cap, plus a headset whose boom runs down the cheek outside
  // the eye (x≥160 at the eye line) to a mic beside the muzzle.
  hat:`<rect class="crew" x="66" y="14" width="84" height="10"/>
<rect class="crew" x="56" y="24" width="104" height="12"/>
<rect class="crewdk" x="106" y="14" width="4" height="22"/>
<rect class="crewband" x="52" y="36" width="112" height="6"/>
<rect class="headset" x="168" y="40" width="12" height="20"/>
<polygon class="headset" points="170,58 175,61 141,99 136,96"/>
<rect class="headset" x="128" y="94" width="12" height="7"/>`,
  prop:`<rect class="straw" x="103" y="64" width="3" height="12"/>
<rect class="cuplid" x="92" y="75" width="18" height="4"/>
<rect class="cup" x="94" y="79" width="14" height="17"/>
<rect class="crewband" x="94" y="84" width="14" height="5"/>
<rect class="bag" x="114" y="74" width="20" height="22"/>
<rect class="bagdk" x="114" y="74" width="20" height="3"/><rect class="bagdk" x="118" y="82" width="12" height="2"/>
<rect class="paper" x="128" y="69" width="5" height="8"/>`},

 miner:{
  bg:"#3A3530",
  // Hard hat with a lamp; the brim stops at y=48, above the eye line.
  hat:`<rect class="mhat" x="72" y="12" width="72" height="8"/>
<rect class="mhat" x="56" y="20" width="104" height="12"/>
<rect class="mhat" x="44" y="32" width="128" height="10"/>
<rect class="mhatlt" x="78" y="16" width="14" height="8"/>
<rect class="mhatdk" x="38" y="42" width="140" height="6"/>
<rect class="lampcase" x="96" y="20" width="24" height="18"/>
<rect class="lamp" x="100" y="24" width="16" height="10"/>`,
  // Pickaxe in the raised paw, and seven small gems on the mound.
  prop:`<polygon class="mhandle" points="82,79 86,81 112,33 108,31"/>
<polygon class="pick" points="94,36 110,25 132,29 134,33 112,30 97,40"/>
<rect class="gemR" x="102" y="90" width="6" height="6"/><rect class="gemB" x="109" y="90" width="6" height="6"/>
<rect class="gemG" x="116" y="90" width="6" height="6"/><rect class="gemY" x="123" y="90" width="6" height="6"/>
<rect class="gemB" x="130" y="90" width="6" height="6"/>
<rect class="gemG" x="112" y="84" width="6" height="6"/><rect class="gemR" x="119" y="84" width="6" height="6"/>`},

 pilot:{
  bg:"#2D4F6E",
  // Captain's cap: white crown, wings badge, black band and visor with gold braid.
  // Visor ends at y=47, above the eye line.
  hat:`<rect class="pcap" x="62" y="12" width="92" height="10"/>
<rect class="pcap" x="48" y="22" width="120" height="12"/>
<rect class="pband" x="48" y="34" width="120" height="6"/>
<rect class="pbadge" x="88" y="22" width="40" height="4"/><rect class="pbadge" x="102" y="18" width="12" height="11"/>
<rect class="pband" x="54" y="40" width="108" height="7"/>
<rect class="wings" x="62" y="40" width="92" height="2"/>`,
  prop:`<rect class="collar" x="30" y="72" width="10" height="5"/><rect class="collar" x="48" y="72" width="10" height="5"/>
<rect class="tie" x="40" y="74" width="8" height="5"/>
<polygon class="tie" points="40,79 48,79 50,92 44,98 38,92"/>
<rect class="wings" x="58" y="82" width="14" height="2"/><rect class="wings" x="62" y="80" width="6" height="5"/>`,
  // A small jet crossing the corner, nose first, with a short contrail.
  float:`<g class="jet"><rect class="trail" x="98" y="23" width="10" height="2"/><rect class="trail" x="110" y="23" width="6" height="2"/>
<polygon class="plane" points="118,16 122,16 126,21 118,21"/>
<rect class="plane" x="118" y="21" width="30" height="5"/><rect class="plane" x="148" y="22" width="4" height="3"/>
<polygon class="plane" points="130,24 138,24 132,31 127,31"/>
<rect class="planedk" x="134" y="22" width="2" height="2"/><rect class="planedk" x="138" y="22" width="2" height="2"/><rect class="planedk" x="142" y="22" width="2" height="2"/></g>`},

 seventies:{
  bg:"#7A4E2E",
  // Woven headband and big round tinted shades. The shades are `eyes`, so
  // they're allowed over the eye line — they are the eyes here.
  hat:`<rect class="hband" x="44" y="34" width="128" height="7"/>
<rect class="hbandlt" x="56" y="36" width="8" height="3"/><rect class="hbandlt" x="80" y="36" width="8" height="3"/>
<rect class="hbandlt" x="104" y="36" width="8" height="3"/><rect class="hbandlt" x="128" y="36" width="8" height="3"/>
<rect class="hbandlt" x="152" y="36" width="8" height="3"/>`,
  eyes:`<rect class="frame" x="40" y="54" width="12" height="3"/><rect class="frame" x="164" y="54" width="12" height="3"/>
<rect class="frame" x="88" y="52" width="40" height="3"/>
<rect class="frame" x="54" y="44" width="32" height="28"/><rect class="frame" x="50" y="48" width="40" height="20"/>
<rect class="frame" x="130" y="44" width="32" height="28"/><rect class="frame" x="126" y="48" width="40" height="20"/>
<rect class="shade" x="57" y="47" width="26" height="22"/><rect class="shade" x="53" y="51" width="34" height="14"/>
<rect class="shade" x="133" y="47" width="26" height="22"/><rect class="shade" x="129" y="51" width="34" height="14"/>
<rect class="shadelt" x="60" y="50" width="7" height="5"/><rect class="shadelt" x="136" y="50" width="7" height="5"/>`,
  // An LP held up by its edge in the raised paw.
  prop:`<rect class="vinyl" x="94" y="52" width="18" height="30"/><rect class="vinyl" x="88" y="58" width="30" height="18"/>
<rect class="vinyl" x="91" y="55" width="24" height="24"/>
<rect class="vinylgr" x="94" y="60" width="18" height="2"/><rect class="vinylgr" x="94" y="72" width="18" height="2"/>
<rect class="vlabel" x="98" y="62" width="10" height="10"/><rect class="vinyl" x="102" y="66" width="2" height="2"/>`},

 // Game 007.
 prism:{
  bg:"#17171F",
  // Eyes open and turned toward the rainbow he's splitting.
  eyes:`<rect class="sclera" x="54" y="46" width="32" height="24"/><rect class="sclera" x="130" y="46" width="32" height="24"/>
<rect class="eye" x="70" y="52" width="14" height="14"/><rect class="eye" x="146" y="52" width="14" height="14"/>`,
  // White light in from the left, seven bands fanning out to the right,
  // red least bent at the top and violet most bent at the bottom. The fan
  // stops at x=136, where the "ha" strip starts.
  prop:(()=>{
    let fan="";
    for(let i=0;i<7;i++){
      const y0=83.6+i*.4,y1=y0+.4,Y0=70+i*4,Y1=Y0+4;
      fan+=`<polygon class="rb${i}" points="118,${y0.toFixed(1)} 136,${Y0} 136,${Y1} 118,${y1.toFixed(1)}"/>`;
    }
    return `<polygon class="beam" points="90,82 108,83 108,86 90,85"/>
<polygon class="prism" points="100,96 112,72 124,96"/>
<polygon class="prismlt" points="105,92 112,78 114,82 109,92"/>${fan}`;
  })()},

 chalkboard:{
  bg:"#4E3E30",
  // Half-moon reading glasses perched below the eyes, so he peers over them.
  eyes:`<rect class="eye" x="56" y="54" width="28" height="8"/><rect class="eye" x="132" y="54" width="28" height="8"/>
<rect class="specs" x="52" y="62" width="36" height="3"/><rect class="specs" x="128" y="62" width="36" height="3"/>
<rect class="specs" x="52" y="62" width="3" height="10"/><rect class="specs" x="85" y="62" width="3" height="10"/>
<rect class="specs" x="128" y="62" width="3" height="10"/><rect class="specs" x="161" y="62" width="3" height="10"/>
<rect class="specs" x="55" y="71" width="30" height="3"/><rect class="specs" x="131" y="71" width="30" height="3"/>
<rect class="specs" x="88" y="63" width="40" height="2"/>`,
  // Chalk in the raised paw; a board on an easel with a sum in numerals.
  prop:`<polygon class="chalk" points="84,73 87,74 93,64 90,63"/>
<polygon class="bframe" points="98,96 101,96 106,79 103,79"/><polygon class="bframe" points="130,96 133,96 127,79 124,79"/>
<rect class="bframe" x="94" y="46" width="42" height="34"/>
<rect class="board" x="97" y="49" width="36" height="28"/>
<text class="chalktx" x="100" y="60" textLength="30" lengthAdjust="spacingAndGlyphs">XX+XXII</text>
<text class="chalktx" x="100" y="73" textLength="22" lengthAdjust="spacingAndGlyphs">=XLII</text>`},

 explorer:{
  bg:"#1F3A2A",
  // Canvas bush hat; the brim stops at y=44, above the eye line.
  hat:`<rect class="bush" x="70" y="12" width="76" height="10"/>
<rect class="bush" x="60" y="22" width="96" height="14"/>
<rect class="bushband" x="60" y="30" width="96" height="6"/>
<rect class="bushbrim" x="34" y="36" width="148" height="8"/>`,
  // Binoculars on the chest, a folded map in the raised paw.
  prop:`<rect class="strap" x="30" y="70" width="3" height="10"/><rect class="strap" x="57" y="70" width="3" height="10"/>
<rect class="binoc" x="34" y="78" width="10" height="13"/><rect class="binoc" x="46" y="78" width="10" height="13"/>
<rect class="binoc" x="44" y="81" width="2" height="5"/>
<rect class="binoclt" x="35" y="88" width="8" height="2"/><rect class="binoclt" x="47" y="88" width="8" height="2"/>
<rect class="map" x="88" y="56" width="28" height="20"/>
<rect class="mapdk" x="96" y="60" width="9" height="10"/><rect class="mapdk" x="99" y="70" width="4" height="3"/>
<rect class="route" x="90" y="66" width="3" height="2"/><rect class="route" x="106" y="62" width="3" height="2"/><rect class="route" x="111" y="66" width="3" height="2"/>
<rect class="paperdk" x="102" y="56" width="1" height="20"/>`,
  // Two blue butterflies drifting, in place of the "ha".
  float:(()=>{
    const b=`<rect class="morpho" x="0" y="0" width="6" height="5"/><rect class="morpho" x="8" y="0" width="6" height="5"/>
<rect class="morphodk" x="1" y="5" width="5" height="3"/><rect class="morphodk" x="8" y="5" width="5" height="3"/>
<rect class="eye" x="6" y="1" width="2" height="7"/>`;
    return `<g transform="translate(112,14)"><g class="pig pg1">${b}</g></g><g transform="translate(138,40)"><g class="pig pg3">${b}</g></g>`;
  })()},

 carol:{
  bg:"#4A1E28",
  // A sprig of holly tucked at the side of the crown, berries on the leaves.
  hat:`<polygon class="holly" points="118,24 132,14 140,18 128,28"/>
<polygon class="holly" points="132,26 148,20 152,28 136,32"/>
<rect class="hberry" x="128" y="20" width="5" height="5"/><rect class="hberry" x="134" y="24" width="5" height="5"/><rect class="hberry" x="139" y="20" width="5" height="5"/>`,
  // An open carol book held in both paws, and a partridge in a pear tree.
  prop:`<rect class="paper" x="18" y="76" width="26" height="16"/><rect class="paper" x="46" y="76" width="26" height="16"/>
<rect class="spine" x="44" y="75" width="2" height="18"/>
<rect class="paperdk" x="21" y="80" width="20" height="1"/><rect class="paperdk" x="21" y="84" width="20" height="1"/><rect class="paperdk" x="21" y="88" width="14" height="1"/>
<rect class="paperdk" x="49" y="80" width="20" height="1"/><rect class="paperdk" x="49" y="84" width="20" height="1"/><rect class="paperdk" x="49" y="88" width="17" height="1"/>
<rect class="ptrunk" x="114" y="70" width="5" height="26"/>
<rect class="ptree" x="102" y="46" width="30" height="10"/><rect class="ptree" x="98" y="56" width="38" height="12"/><rect class="ptree" x="104" y="68" width="26" height="4"/>
<rect class="pear" x="104" y="58" width="4" height="5"/><rect class="pear" x="124" y="50" width="4" height="5"/><rect class="pear" x="128" y="61" width="4" height="5"/>
<rect class="pdg" x="110" y="38" width="12" height="8"/><rect class="pdg" x="120" y="35" width="5" height="5"/>
<rect class="pdglt" x="112" y="40" width="6" height="4"/><rect class="eye" x="122" y="36" width="2" height="2"/>
<rect class="cardbk" x="125" y="37" width="2" height="2"/><rect class="pdg" x="106" y="38" width="4" height="4"/>`},

 podium:{
  bg:"#1E2330",
  // A plain lectern — a star, not a seal — with a mic by his chin, and the
  // Senate gavel a vice president presides with, in the raised paw.
  prop:`<rect class="lecttop" x="6" y="72" width="78" height="5"/>
<rect class="lectern" x="12" y="77" width="66" height="23"/>
<rect class="lectdk" x="12" y="77" width="66" height="2"/>
<rect class="wings" x="43" y="81" width="2" height="3"/><rect class="wings" x="39" y="84" width="10" height="3"/>
<rect class="wings" x="41" y="87" width="6" height="3"/><rect class="wings" x="40" y="90" width="3" height="2"/><rect class="wings" x="45" y="90" width="3" height="2"/>
<rect class="mic" x="60" y="64" width="5" height="6"/><rect class="mic" x="62" y="70" width="2" height="2"/>
<polygon class="mhandle" points="83,78 86,79 101,59 98,58"/>
<polygon class="gavel" points="96.7,48.4 109.5,58 105.3,63.6 92.5,54"/>`},

 // Game 008. Baseball reuses ballpark.
 lantern:{
  bg:"#1E1A2A",
  // A red paper lantern on a stick, held up in the raised paw. Just the
  // lantern — nothing worn, nothing that reads as a costume of a people.
  prop:`<polygon class="mhandle" points="84,78 87,79 115,41 112,40"/>
<rect class="lgold" x="113" y="40" width="2" height="6"/>
<rect class="lgold" x="106" y="46" width="16" height="3"/>
<rect class="lantern" x="104" y="49" width="20" height="4"/><rect class="lantern" x="102" y="53" width="24" height="12"/>
<rect class="lantern" x="104" y="65" width="20" height="4"/>
<rect class="lanterndk" x="109" y="49" width="2" height="20"/><rect class="lanterndk" x="117" y="49" width="2" height="20"/>
<rect class="lanternlt" x="104" y="55" width="4" height="7"/>
<rect class="lgold" x="106" y="69" width="16" height="3"/><rect class="lgold" x="113" y="72" width="2" height="9"/>`},

 globe:{
  bg:"#2A2F45",
  // Summit delegate: a lanyard and pass on the chest, a desk globe on the
  // mound. Generic pass — no G7 or host-country marks.
  prop:`<polygon class="lanyard" points="28,70 32,70 41,84 38,85"/><polygon class="lanyard" points="58,70 62,70 52,85 49,84"/>
<rect class="idcard" x="37" y="84" width="16" height="12"/><rect class="idband" x="37" y="84" width="16" height="4"/>
<rect class="paperdk" x="40" y="90" width="10" height="1"/><rect class="paperdk" x="40" y="93" width="7" height="1"/>
<rect class="gbrass" x="104" y="92" width="22" height="4"/><rect class="gbrass" x="113" y="83" width="4" height="9"/>
<rect class="gocean" x="109" y="54" width="12" height="3"/><rect class="gocean" x="105" y="57" width="20" height="3"/>
<rect class="gocean" x="103" y="60" width="24" height="15"/>
<rect class="gocean" x="105" y="75" width="20" height="3"/><rect class="gocean" x="109" y="78" width="12" height="3"/>
<rect class="gland" x="107" y="59" width="7" height="6"/><rect class="gland" x="111" y="65" width="4" height="7"/>
<rect class="gland" x="118" y="61" width="6" height="4"/><rect class="gland" x="119" y="70" width="4" height="5"/>
<rect class="gbrass" x="99" y="60" width="2" height="15"/><rect class="gbrass" x="129" y="60" width="2" height="15"/>
<rect class="gbrass" x="101" y="56" width="3" height="4"/><rect class="gbrass" x="126" y="56" width="3" height="4"/>
<rect class="gbrass" x="101" y="75" width="3" height="4"/><rect class="gbrass" x="126" y="75" width="3" height="4"/>
<rect class="gbrass" x="104" y="79" width="22" height="2"/>`},

 fellowship:{
  bg:"#15141C",
  // A traveller, nothing from any film: hooded cloak, plain clasp, a staff.
  // The hood stops at y=44 across the forehead and its sides run down
  // outside the eyes (x≤44 and x≥172), so the face stays clear.
  hat:`<rect class="hood" x="64" y="10" width="88" height="10"/>
<rect class="hood" x="46" y="20" width="124" height="12"/>
<rect class="hood" x="36" y="32" width="144" height="10"/>
<rect class="hooddk" x="42" y="42" width="132" height="3"/>
<rect class="hood" x="30" y="42" width="14" height="42"/><rect class="hood" x="172" y="42" width="14" height="42"/>`,
  prop:`<rect class="cloak" x="8" y="72" width="28" height="28"/><rect class="cloak" x="54" y="72" width="28" height="28"/>
<rect class="cloak" x="4" y="78" width="6" height="22"/><rect class="hooddk" x="30" y="72" width="6" height="28"/><rect class="hooddk" x="54" y="72" width="6" height="28"/>
<rect class="clasp" x="40" y="75" width="10" height="6"/><rect class="hooddk" x="43" y="77" width="4" height="2"/>
<polygon class="staff" points="85,96 88,96 99,34 96,33"/>
<rect class="staff" x="93" y="27" width="9" height="7"/><rect class="staff" x="100" y="24" width="3" height="5"/>`},

 riverboat:{
  bg:"#1F3A4F",
  // Straw boater (brim ends y=37), and a paddle steamer on the mound with
  // steam rising from both stacks in place of the "ha".
  hat:`<rect class="boater" x="66" y="12" width="84" height="12"/>
<rect class="sband" x="66" y="24" width="84" height="6"/>
<rect class="boaterlt" x="44" y="30" width="128" height="7"/>`,
  prop:`<rect class="river" x="90" y="93" width="46" height="3"/>
<rect class="hull" x="94" y="86" width="38" height="7"/><rect class="sband" x="94" y="90" width="38" height="2"/>
<rect class="hull" x="100" y="78" width="26" height="8"/>
<rect class="cabwin" x="103" y="81" width="3" height="3"/><rect class="cabwin" x="109" y="81" width="3" height="3"/>
<rect class="cabwin" x="115" y="81" width="3" height="3"/><rect class="cabwin" x="121" y="81" width="3" height="3"/>
<rect class="hull" x="104" y="73" width="18" height="5"/>
<rect class="stack" x="106" y="56" width="4" height="17"/><rect class="stack" x="116" y="56" width="4" height="17"/>
<rect class="stack" x="104" y="54" width="8" height="3"/><rect class="stack" x="114" y="54" width="8" height="3"/>
<rect class="pwheel" x="126" y="78" width="10" height="14"/>
<rect class="stack" x="130" y="78" width="2" height="14"/><rect class="stack" x="126" y="84" width="10" height="2"/>`,
  float:`<g class="bub1"><rect class="steam" x="105" y="46" width="6" height="6"/></g>
<g class="bub2"><rect class="steam" x="115" y="46" width="6" height="6"/></g>
<g class="bub3"><rect class="steam" x="110" y="44" width="5" height="5"/></g>`}
};
// Each "ha" is ~21 units wide and floats 24 straight up (haFloat), so it
// lives in the strip right of every scene's side prop (those end by x=136)
// and left of the viewBox edge at 160. It used to drift 16 sideways as well,
// which ran it out past 160 and clipped it.
const HA=`<text class="ha ha1" x="136" y="58">ha</text><text class="ha ha2" x="138" y="42">ha</text><text class="ha ha3" x="137" y="76">ha</text>`;

// Rumble's head is drawn in its own native frame, roughly twice the scale of
// the viewBoxes it sits in, and placed with one transform per sprite —
// HEAD_AT in GOPHER (the bust panel), SLEEP_AT in SLEEPER (the den).
// A scene's `eyes` and `hat` render inside that same transform, so they're
// authored in head coordinates, not viewBox coordinates — see "Rumble's
// costumes" in CLAUDE.md for the landmarks (skull top, eye line, muzzle).
// `prop` and `float` stay in viewBox coordinates, outside the head.
function RUMBLE_HEAD(eyes,chomp=true){return `
<rect class="furdk" x="36" y="14" width="30" height="30"/>
<rect class="furdk" x="150" y="14" width="30" height="30"/>
<rect class="fur" x="44" y="22" width="16" height="16"/>
<rect class="fur" x="156" y="22" width="16" height="16"/>
<rect class="fur" x="72" y="20" width="72" height="10"/>
<rect class="fur" x="56" y="30" width="104" height="10"/>
<rect class="fur" x="46" y="40" width="124" height="10"/>
<rect class="fur" x="40" y="50" width="136" height="10"/>
<rect class="fur" x="38" y="60" width="140" height="20"/>
<rect class="fur" x="40" y="80" width="136" height="10"/>
<rect class="fur" x="46" y="90" width="124" height="10"/>
<rect class="fur" x="56" y="100" width="104" height="10"/>
<rect class="furlt" x="72" y="20" width="56" height="10"/>
<rect class="furlt" x="56" y="30" width="48" height="10"/>
<rect class="furlt" x="44" y="76" width="26" height="24"/>
<rect class="furlt" x="146" y="76" width="26" height="24"/>
<rect class="muzzle" x="84" y="74" width="48" height="28"/>
<rect class="furdk" x="94" y="80" width="28" height="14"/>
${eyes}
<g${chomp?' class="jaw"':""}>
<rect class="tooth" x="92" y="102" width="14" height="22"/>
<rect class="tooth" x="110" y="102" width="14" height="22"/>
<rect class="incisor" x="92" y="102" width="14" height="5"/>
<rect class="incisor" x="110" y="102" width="14" height="5"/>
</g>`}
const EYES_CLOSED=`<rect class="eye" x="56" y="54" width="28" height="8"/>
<rect class="eye" x="132" y="54" width="28" height="8"/>`;
// Scale 0.6, centred on the body (x≈46) with the ear tips at y≈8 — big enough
// to read as the new rounder head, small enough to leave his shoulders and
// arms showing above the dirt.
const HEAD_AT="translate(-18.8,-0.4) scale(.6)";

// Wide awake, for the moment Rumble wakes in his den: the pupils glance
// sideways once (.glance) before the den collapses.
const EYES_OPEN=`<rect class="sclera" x="54" y="46" width="32" height="24"/>
<rect class="sclera" x="130" y="46" width="32" height="24"/>
<g class="glance"><rect class="eye" x="62" y="52" width="14" height="14"/>
<rect class="eye" x="138" y="52" width="14" height="14"/></g>`;
// Fits the head inside the burrow's tunnel (x 8–84) with the ears below the
// rim and the teeth ending just above the bottom edge.
const SLEEP_AT="translate(-3.7,41.6) scale(.46)";

function SLEEPER(awake){
  const zs = awake ? "" : `<text class="zz z1" x="84" y="46">z</text>
<text class="zz z2" x="94" y="32">z</text><text class="zz z3" x="104" y="20">z</text>`;
  return `<svg class="densvg" viewBox="0 0 124 100" role="img" aria-label="Rumble asleep in his burrow">
<rect class="rimlt" x="12" y="26" width="72" height="5"/>
<rect class="rim" x="4" y="31" width="88" height="7"/>
<rect class="rim" x="0" y="38" width="8" height="62"/><rect class="rim" x="84" y="38" width="8" height="62"/>
<rect class="tunnel" x="8" y="38" width="76" height="62"/>
<rect class="tunnel" x="16" y="31" width="60" height="7"/>
<g class="sleephead"><g transform="${SLEEP_AT}">
${RUMBLE_HEAD(awake?EYES_OPEN:EYES_CLOSED,false)}
</g></g>
${zs}
</svg>`}

function GOPHER(scene){
  const sc=SCENE[scene]||{};
  return `<svg class="goph ${scene?"sc-"+scene:""}" width="150" height="113" viewBox="0 0 160 120" role="img" aria-label="Rumble the gopher">
<g class="figure">
<rect class="fur" x="16" y="68" width="56" height="10"/>
<rect class="fur" x="12" y="78" width="64" height="22"/>
<rect class="furlt" x="28" y="80" width="30" height="18"/>
<g class="armL"><rect class="fur" x="2" y="80" width="14" height="9"/><rect class="furdk" x="0" y="84" width="7" height="9"/></g>
<g class="armR"><rect class="fur" x="72" y="80" width="14" height="9"/><rect class="furdk" x="82" y="84" width="7" height="9"/></g>
<g class="bob"><g transform="${HEAD_AT}">
${RUMBLE_HEAD(sc.eyes||EYES_CLOSED)}
${sc.hat||""}
</g></g>
${sc.prop||""}
</g>
<rect class="dirt" x="0" y="96" width="160" height="24"/>
<rect class="dirtlt" x="0" y="96" width="160" height="5"/>
${sc.float||HA}
</svg>`}

/* ---------- world ---------- */
const PX=34, CLEAR=76;
const depthPx=cm=>cm>0?CLEAR+cm*PX:0;
