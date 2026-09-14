// Text, not just the risk-N colour, for the escalation — colour alone
// (cream/gold/orange/pulsing ember) doesn't reach a colourblind sighted
// player or a screen reader, and risk-3's pulse is motion-based, so it
// drops out entirely under prefers-reduced-motion too. A stacked line
// under the number, not a longer caption: lengthening "at risk" itself
// overflowed the HUD on narrow screens.
const RISK_FLAG=["","","rising","high"];
function updateHud(){
  $("hudBanked").textContent=banked;
  $("hudRisk").textContent=roundDepth;
  const lvl=roundDepth>=40?3:roundDepth>=20?2:roundDepth>=8?1:0;
  $("riskCell").className="cell right risk-"+lvl;
  $("riskFlag").textContent=RISK_FLAG[lvl];
  $("pips").innerHTML=ROUNDS.map((r,i)=>{
    const done=results[i];
    const status=done?(done.bust?"rumbled":"banked"):(i===idx?"in progress":"not yet played");
    const cls=done?(done.bust?"pip lost":"pip on"):(i===idx?"pip now":"pip");
    return `<span class="${cls}" role="img" aria-label="Round ${i+1}: ${status}"></span>`;
  }).join("");
}

/* ---------- steals ---------- */
