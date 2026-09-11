function updateHud(){
  $("hudBanked").textContent=banked;
  $("hudRisk").textContent=roundDepth;
  const lvl=roundDepth>=40?3:roundDepth>=20?2:roundDepth>=8?1:0;
  $("riskCell").className="cell right risk-"+lvl;
  $("pips").innerHTML=ROUNDS.map((r,i)=>{
    const done=results[i];
    const cls=done?(done.bust?"pip lost":"pip on"):(i===idx?"pip now":"pip");
    return `<span class="${cls}"></span>`;
  }).join("");
}

/* ---------- steals ---------- */
