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
    // The headline is always what survived, never what went — kept/banked
    // is the number that matters to a player deciding whether the risk was
    // worth it, and it's the one number that's always honest to show large,
    // including at 0 (the only case where 0 *is* the honest headline: the
    // very first dig busted, so there was never anything to lose either).
    // A loss only gets a line at all when one actually happened, and even
    // then it's the small supporting fact, not competing with the banked
    // total for the same spot.
    const keptLine=kept===0?""
      :lost===0?`<p class="kept">Your first find is safe.</p>`
      :`<p class="kept">Your first find is safe — ${lost} lost beyond that.</p>`;
    $("rumbleBox").innerHTML=`<div class="scrim" id="scrim" role="dialog" aria-modal="true" aria-label="Rumble">
      <div class="rumble" style="background:${(SCENE[scene]||{}).bg||"var(--bust)"}">
        <div class="gopher">${GOPHER(scene)}</div>
        <b>RUMBLED!</b>
        <p class="taunt">${TAUNTS[Math.floor(Math.random()*TAUNTS.length)]}</p>
        ${keptLine}
        <div class="banked"><span id="bankedNum">${kept}</span><em>banked</em></div>
        <button id="shakeBtn">Shake it off</button>
      </div></div>`;
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
