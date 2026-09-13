const POSSIBLE=ROUNDS.reduce((n,r)=>n+r.answers.reduce((m,a)=>m+a.v,0)+10,0);
const RUMBLED="\u{1F9AB}";
const CHAMBER="\u{1F3FA}";

function shareText(){
  const marks=results.map(r=>r.bust?RUMBLED:r.chamber?CHAMBER:tierFor(r.top).e).join("");
  return `rolypoly.gg #${GAMENO} \u{1FAB2}\n${banked} of ${POSSIBLE}\n${marks}`;
}
function showResults(){
  const t=tierFor(deepest);
  setShell(t.v);
  const banks=results.filter(r=>!r.bust).length;
  const busts=results.length-banks;
  const left=results.filter(r=>!r.bust).reduce((n,r)=>n+r.left,0);
  const best=results.reduce((a,b)=>b.cm>a.cm?b:a,results[0]);
  $("play").hidden=true;
  updateHud();
  const el=$("results");el.hidden=false;
  el.innerHTML=`<div class="label">your day</div>
    <p class="final">${banked}</p>
    <ul class="story">
      <li>${banks} clean ${banks===1?"bank":"banks"} · ${busts} ${busts===1?"rumble":"rumbles"}</li>
      <li>Deepest find: ${deepestName} · ${deepest}, ${t.name}</li>
      <li>Boldest round: ${best.domain} · ${best.cm}</li>
      ${results.some(r=>r.chamber)?`<li>You reached the hidden chamber.</li>`:""}
      <li>You dug ${banked} of the ${POSSIBLE} buried down there.</li>
      <li>You left ${left} behind in rounds you finished.</li>
    </ul>
    <div class="key">${TIERS.map(t=>
      `<span><b>${t.e}</b>${t.name} · ${t.lo}${t.max>900?"+":"\u2013"+t.max}</span>`).join("")}
      <span><b>${CHAMBER}</b>hidden chamber</span>
      <span><b>${RUMBLED}</b>rumbled</span></div>
    <pre class="share">${shareText()}</pre>
    <div class="acts"><button class="bank" id="copyBtn">Share result</button>
    <button id="againBtn">Practice dig</button></div>
    <p class="msg">Practice replays the same prompts and doesn't count toward today.</p>`;
  $("tunnels").innerHTML="";curCorr=null;
  $("digger").classList.remove("rolling","rollingin","parade");
  paceX=0;paceDir=1;
  $("rig").style.transform="translateX(0)";
  moveWorld(0);
  startPacing();
  $("copyBtn").onclick=async()=>{
    try{await navigator.clipboard.writeText(shareText());$("copyBtn").textContent="Copied"}
    catch(e){$("copyBtn").textContent="Select the text above"}
  };
  $("againBtn").onclick=()=>{
    idx=0;banked=0;deepest=0;deepestName="—";results.length=0;
    el.hidden=true;$("play").hidden=false;loadRound();
  };
}

/* ---------- intro ---------- */
function buildIntro(){
  $("cast").innerHTML=`<div>${WALK(me)}</div>`;
  $("denIntro").innerHTML=SLEEPER(false);
  $("chooser").innerHTML=`<button class="bank" id="beginBtn">Begin digging</button>`;
  $("beginBtn").onclick=()=>{
    $("intro").hidden=true;$("play").hidden=false;
    $("den").innerHTML=SLEEPER(false);
    $("hud").classList.remove("intro");
    loadRound();
  };
}
