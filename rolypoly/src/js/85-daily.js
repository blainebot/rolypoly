/* ---------- daily persistence ---------- */
// A finished day is stored once, keyed to the day and the game that was
// actually played, so returning later shows that result instead of a fresh
// board — the game is only playable once per day. Practice replays never
// reach saveTodayResult() (see isPractice, gated in showResults()).
const STORAGE_KEY="rolypoly:result";

function saveTodayResult(){
  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify({
      day:DAY,gameNo:GAMENO,banked,deepest,deepestName,
      results,share:shareText()
    }));
  }catch{/* private mode / quota / disabled storage — losing persistence isn't fatal */}
}

function loadTodayResult(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw)return null;
    const rec=JSON.parse(raw);
    if(!rec||rec.day!==DAY||rec.gameNo!==GAMENO)return null;
    if(typeof rec.banked!=="number"||!Array.isArray(rec.results))return null;
    return rec;
  }catch{return null}
}

function showStoredResults(rec){
  banked=rec.banked;
  deepest=rec.deepest;
  deepestName=rec.deepestName;
  results.length=0;
  results.push(...rec.results);
  idx=ROUNDS.length;
  $("intro").hidden=true;
  $("hud").classList.remove("intro");
  showResults(true);
}

// Every round's found list was snapshotted into results[i].found in
// endRound() (src/js/70-game.js); "still down there" is derived from the
// round's real answers rather than also stored, so a review never disagrees
// with what content/games/ currently says.
function reviewAnswersHtml(){
  const rounds=ROUNDS.map((r,i)=>{
    const res=results[i];
    if(!res)return"";
    const foundNames=new Set(res.found.map(a=>a.n));
    const missed=r.answers.filter(a=>!foundNames.has(a.n)).sort((x,y)=>y.v-x.v);
    const foundHtml=res.found.length
      ?res.found.map(a=>`<div class="fact"><b>${a.n}</b><i>+${a.v}</i><p>${a.f}</p></div>`).join("")
      :`<p class="none">Nothing found before Rumble got there.</p>`;
    const missedHtml=missed.length
      ?`<div class="grid">`+missed.map(a=>`<p>${a.n}<span class="cm">${a.v}</span></p>`).join("")+`</div>`
      :"";
    return `<div class="reviewRound">
      <div class="dugup">${r.domain}${res.bust?" — rumbled":""}</div>
      ${foundHtml}
      ${missed.length?`<div class="dugup">Still down there</div>${missedHtml}`:""}
    </div>`;
  }).join("");
  return `<details class="missed" id="reviewBox"><summary>Review your answers</summary>
    <div class="review">${rounds}</div></details>`;
}

/* ---------- results ---------- */