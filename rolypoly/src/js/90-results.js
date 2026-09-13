// Kept for tuning DAY_TIERS against later, but never shown to a player —
// "N of POSSIBLE" made every day look like a failure against a denominator
// nobody will ever approach.
const POSSIBLE=ROUNDS.reduce((n,r)=>n+r.answers.reduce((m,a)=>m+a.v,0)+10+Math.max(0,r.answers.length-2)*2,0);
const RUMBLED="\u{1F9AB}";
const CHAMBER="\u{1F3FA}";

// Each band's rendered share of the tier-band width, derived from DAY_TIERS'
// thresholds — the open-ended top band borrows the previous band's width
// rather than trying to represent infinity proportionally.
function dayTierWidths(){
  const w=[];
  for(let i=0;i<DAY_TIERS.length;i++){
    const lo=i===0?0:DAY_TIERS[i-1].max+1;
    w.push(DAY_TIERS[i].max===Infinity?w[i-1]:(DAY_TIERS[i].max-lo+1));
  }
  return w;
}
function dayTierMarkerX(score,widths){
  let x=0;
  for(let i=0;i<DAY_TIERS.length;i++){
    const t=DAY_TIERS[i],lo=i===0?0:DAY_TIERS[i-1].max+1;
    if(score<=t.max){
      const span=t.max===Infinity?widths[i]:(t.max-lo+1);
      const into=t.max===Infinity?Math.min(widths[i],score-lo):(score-lo);
      return x+(span>0?(into/span)*widths[i]:0);
    }
    x+=widths[i];
  }
  return x;
}
function dayTierBandSvg(score){
  const widths=dayTierWidths();
  const total=widths.reduce((a,b)=>a+b,0);
  const H=14,markerH=8;
  let x=0;
  const rects=DAY_TIERS.map((t,i)=>{
    const r=`<rect x="${x}" y="${markerH}" width="${widths[i]}" height="${H}" fill="var(--${t.v})"/>`;
    x+=widths[i];
    return r;
  }).join("");
  const mx=dayTierMarkerX(score,widths);
  const marker=`<polygon points="${mx-5},0 ${mx+5},0 ${mx},${markerH}" fill="var(--cream)"/>`;
  return `<div class="dist"><svg class="tierband" aria-hidden="true" viewBox="0 0 ${total} ${markerH+H}"
    width="100%" height="${(markerH+H)*2.4}">${rects}${marker}</svg></div>`;
}

function shareText(){
  const dt=dayTierFor(banked);
  const marks=results.map(r=>r.bust?RUMBLED:r.chamber?CHAMBER:tierFor(r.top).e).join("");
  return `rolypoly.gg #${GAMENO} \u{1FAB2}\n${dt.e} ${dt.name}\n${banked}\n${marks}`;
}
function showResults(){
  const t=tierFor(deepest);
  setShell(t.v);
  const dt=dayTierFor(banked);
  const banks=results.filter(r=>!r.bust).length;
  const busts=results.length-banks;
  const bustKept=results.filter(r=>r.bust).reduce((n,r)=>n+r.cm,0);
  const left=results.filter(r=>!r.bust).reduce((n,r)=>n+r.left,0);
  const best=results.reduce((a,b)=>b.cm>a.cm?b:a,results[0]);
  const totalPar=ROUNDS.reduce((s,r)=>s+r.par,0);
  $("play").hidden=true;
  updateHud();
  const el=$("results");el.hidden=false;
  el.innerHTML=`<div class="label">your day</div>
    <p class="daytier" style="color:var(--${dt.v}-lt)">${dt.e} ${dt.name}</p>
    <p class="final">${banked}</p>
    <p class="daycopy">${dt.copy}</p>
    <div id="distBox">${dayTierBandSvg(banked)}</div>
    <ul class="story">
      <li>${banks} clean ${banks===1?"bank":"banks"} · ${busts} ${busts===1?"rumble":"rumbles"}${bustKept>0?` · kept ${bustKept}`:""}</li>
      <li>Deepest find: ${deepestName} · ${deepest}, ${t.name}</li>
      <li>Boldest round: ${best.domain} · ${best.cm}</li>
      ${results.some(r=>r.chamber)?`<li>You reached the hidden chamber.</li>`:""}
      <li>Par ${totalPar} · you banked ${banked}</li>
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
  renderDistribution(banked);
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
