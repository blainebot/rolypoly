function updateHud(){
  $("hudBanked").textContent=banked;
  $("hudRisk").textContent=roundDepth;
  const lvl=roundDepth>=40?3:roundDepth>=20?2:roundDepth>=8?1:0;
  $("riskCell").className="cell right risk-"+lvl;
  $("pips").innerHTML=ROUNDS.map((r,i)=>{
    const done=results[i];
    const status=done?(done.bust?"rumbled":"banked"):(i===idx?"in progress":"not yet played");
    const cls=done?(done.bust?"pip lost":"pip on"):(i===idx?"pip now":"pip");
    return `<span class="${cls}" role="img" aria-label="Round ${i+1}: ${status}"></span>`;
  }).join("");
}

/* ---------- steals ---------- */
