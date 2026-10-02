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

 // All five below are prop-only by design — no hat, no eyes — sidestepping
 // the face trap entirely rather than relying on getting the y-coordinates
 // right (see "Rumble's costumes" in CLAUDE.md for the two scenes that
 // shipped broken from exactly that).
 animator:{
  bg:"#3A3228",
  prop:`<rect class="easel" x="96" y="30" width="4" height="60"/><rect class="easel" x="110" y="30" width="4" height="60"/>
<rect class="easelbar" x="94" y="56" width="24" height="4"/>
<rect class="canvas" x="92" y="18" width="30" height="26"/>
<rect class="canvaslt" x="96" y="22" width="22" height="18"/>
<rect class="brush" x="70" y="70" width="3" height="20"/><rect class="brushtip" x="68" y="88" width="6" height="6"/>`},

 showdog:{
  bg:"#4A3824",
  prop:`<rect class="rosette" x="56" y="75" width="18" height="3"/>
<rect class="rosette" x="52" y="78" width="26" height="12"/>
<rect class="rosette" x="56" y="90" width="18" height="3"/>
<rect class="rosettelt" x="58" y="81" width="14" height="6"/>
<rect class="ribbon" x="57" y="93" width="5" height="10"/><rect class="ribbon" x="68" y="93" width="5" height="10"/>`},

 redjacket:{
  bg:"#2E1620",
  prop:`<rect class="jacket" x="8" y="74" width="24" height="26"/>
<rect class="jacket" x="58" y="74" width="24" height="26"/>
<rect class="jacketdk" x="8" y="74" width="24" height="5"/><rect class="jacketdk" x="58" y="74" width="24" height="5"/>
<rect class="zipper" x="38" y="74" width="4" height="26"/>
<rect class="zippull" x="37" y="74" width="6" height="4"/>
<rect class="cuff" x="2" y="90" width="12" height="7"/>
<rect class="glove" x="0" y="80" width="16" height="14"/>`},

 ballpark:{
  bg:"#5E4A2E",
  prop:`<rect class="mitt" x="82" y="58" width="28" height="24"/>
<rect class="mittlt" x="88" y="62" width="16" height="14"/>
<rect class="lace" x="92" y="64" width="2" height="10"/><rect class="lace" x="98" y="64" width="2" height="10"/>
<rect class="ball" x="90" y="40" width="14" height="14"/>
<rect class="stitch" x="93" y="43" width="2" height="2"/><rect class="stitch" x="99" y="47" width="2" height="2"/><rect class="stitch" x="93" y="51" width="2" height="2"/>`},

 passport:{
  bg:"#163038",
  prop:`<rect class="passport" x="92" y="48" width="26" height="34"/>
<rect class="passportlt" x="96" y="52" width="18" height="10"/>
<rect class="stamp" x="98" y="66" width="6" height="6"/><rect class="stamp" x="106" y="70" width="6" height="6"/>
<rect class="tagstring" x="124" y="44" width="2" height="12"/><rect class="tag" x="120" y="54" width="12" height="10"/>`}
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
