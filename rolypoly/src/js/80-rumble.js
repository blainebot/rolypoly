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

function rumble(lost){
  const scene=ROUNDS[idx].s||ROUNDS[idx].domain;
  const c=$("crack");
  c.classList.remove("go");void c.offsetWidth;c.classList.add("go");
  document.body.classList.remove("shaking");void document.body.offsetWidth;
  document.body.classList.add("shaking");
  $("flash").classList.remove("on");void $("flash").offsetWidth;$("flash").classList.add("on");
  setTimeout(()=>{
    $("rumbleBox").innerHTML=`<div class="scrim" id="scrim" role="dialog" aria-modal="true" aria-label="Rumble">
      <div class="rumble" style="background:${(SCENE[scene]||{}).bg||"var(--bust)"}">
        <div class="gopher">${GOPHER(scene)}</div>
        <b>RUMBLED!</b>
        <p class="taunt">${TAUNTS[Math.floor(Math.random()*TAUNTS.length)]}</p>
        <div class="lost"><span id="lostNum">${lost}</span><em>gone, and ${me} is back on the surface</em></div>
        <button id="shakeBtn">Shake it off</button>
      </div></div>`;
    let n=lost;
    const iv=setInterval(()=>{n=Math.max(0,n-Math.ceil(lost/14));$("lostNum").textContent=n;
      if(n===0)clearInterval(iv)},50);
    const close=()=>{
      $("rumbleBox").innerHTML="";
      document.body.classList.remove("shaking");
      roundDepth=0;setShell("sand");moveWorld(0,true);updateHud();
      document.removeEventListener("keydown",esc);
      $("bankBtn").focus();
    };
    const esc=e=>{if(e.key==="Escape")close()};
    document.addEventListener("keydown",esc);
    $("shakeBtn").onclick=close;
    $("scrim").onclick=e=>{if(e.target.id==="scrim")close()};
    $("shakeBtn").focus();
  },420);
}

/* ---------- results ---------- */
