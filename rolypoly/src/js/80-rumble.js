const TAUNTS=["Rumble collapsed the tunnel.","Rumble got there first.",
  "Rumble ate the whole seam.","Rumble doesn't play fair."];

function wakeRumble(){
  const d=$("den");
  if(!d)return;
  d.innerHTML=SLEEPER(true);
  if(calm()){d.classList.add("gone");return}
  setTimeout(()=>d.classList.add("tremble"),260);
  setTimeout(()=>{d.classList.remove("tremble");d.classList.add("gone")},760);
}

function rumble(lost,kept){
  const scene=ROUNDS[idx].s||ROUNDS[idx].domain;
  const c=$("crack");
  c.classList.remove("go");void c.offsetWidth;c.classList.add("go");
  document.body.classList.remove("shaking");void document.body.offsetWidth;
  document.body.classList.add("shaking");
  $("flash").classList.remove("on");void $("flash").offsetWidth;$("flash").classList.add("on");
  setTimeout(()=>{
    // Lead with what survived, not what went — a bare "lost" number reads
    // as a score, and a large 0 sitting above "your first find is safe"
    // reads as a contradiction. Three shapes, by what actually happened:
    // nothing found before the bust (no safe find to report at all, so no
    // banner); the bust landed on the very next dig with nothing else
    // gained (lost===0 — the headline is what got banked, never 0); or
    // digging continued and some of it was lost (the headline is the loss,
    // with the safe amount folded into the smaller line below it instead
    // of restated as its own big number).
    const banner=kept===0?""
      :lost===0?`<p class="kept">Your first find is safe.</p>
        <div class="lost"><span id="bigNum">${kept}</span><em>banked</em></div>`
      :`<div class="lost"><span id="bigNum">${lost}</span><em>lost</em></div>
        <p class="kept">Your first find, ${kept}, is safe.</p>`;
    $("rumbleBox").innerHTML=`<div class="scrim" id="scrim" role="dialog" aria-modal="true" aria-label="Rumble">
      <div class="rumble" style="background:${(SCENE[scene]||{}).bg||"var(--bust)"}">
        <div class="gopher">${GOPHER(scene)}</div>
        <b>RUMBLED!</b>
        <p class="taunt">${TAUNTS[Math.floor(Math.random()*TAUNTS.length)]}</p>
        ${banner}
        <button id="shakeBtn">Shake it off</button>
      </div></div>`;
    // Only animate a drain when there's something to drain — the banked
    // case shows what was kept, not what was lost, so there's nothing to
    // count down.
    if(lost>0){
      let n=lost;
      const iv=setInterval(()=>{n=Math.max(0,n-Math.ceil(lost/14));$("bigNum").textContent=n;
        if(n===0)clearInterval(iv)},50);
    }
    const close=()=>{
      $("rumbleBox").innerHTML="";
      document.body.classList.remove("shaking");
      roundDepth=0;setShell("sand");moveWorld(0,true);updateHud();
      document.removeEventListener("keydown",esc);
      document.removeEventListener("keydown",trap,true);
      $("bankBtn").focus();
    };
    const esc=e=>{if(e.key==="Escape")close()};
    // endRound() (called before rumble()'s own 420ms delay) already
    // re-enables bankBtn for the "Next round"/"See your day" step — it's
    // sitting live underneath this scrim the whole time. aria-modal alone
    // doesn't stop Tab from reaching it; without this trap, Tab from
    // shakeBtn walks straight into that still-visible-under-the-overlay
    // button, so a keyboard user can advance the round while RUMBLED! is
    // still on screen. Capture-phase so it runs before any other keydown
    // handling on the page.
    const trap=e=>{
      if(e.key!=="Tab")return;
      const scrim=$("scrim");
      if(!scrim)return;
      const focusable=[...scrim.querySelectorAll("button,[href],input,select,textarea,[tabindex]")]
        .filter(el=>!el.disabled&&el.tabIndex!==-1&&el.offsetParent!==null);
      if(!focusable.length)return;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
    };
    document.addEventListener("keydown",esc);
    document.addEventListener("keydown",trap,true);
    $("shakeBtn").onclick=close;
    $("scrim").onclick=e=>{if(e.target.id==="scrim")close()};
    $("shakeBtn").focus();
  },420);
}

/* ---------- results ---------- */
