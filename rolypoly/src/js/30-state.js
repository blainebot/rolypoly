let idx=0,roundDepth=0,banked=0,found=[],deepest=0,deepestName="—",chamberHit=false;
const CHAMBER_AT=95;
const me="Poly";
const results=[];
const $=id=>document.getElementById(id);
const isMobile=()=>window.matchMedia("(max-width:640px)").matches;
const calm=()=>window.matchMedia("(prefers-reduced-motion:reduce)").matches;
let hadFocus=false;
const softFocus=()=>{if(!isMobile())setTimeout(()=>$("answer").focus(),0)};
const keepFocus=()=>{if(hadFocus||!isMobile())setTimeout(()=>{const a=$("answer");if(!a.disabled)a.focus()},0)};
const avail=()=>ROUNDS[idx].answers;

function setShell(v){
  const r=document.documentElement.style;
  r.setProperty("--shell",`var(--${v})`);
  r.setProperty("--shell-dk",`var(--${v}-dk)`);
  r.setProperty("--shell-lt",`var(--${v}-lt)`);
}

/* ---------- sprites ---------- */
