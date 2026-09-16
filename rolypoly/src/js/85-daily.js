/* ---------- daily persistence ---------- */
// A finished day is stored once, keyed to the day and the game that was
// actually played, so returning later shows that result instead of a fresh
// board — the game is only playable once per day. Practice replays never
// reach saveTodayResult() (see isPractice, gated in showResults()).
const STORAGE_KEY="rolypoly:result";
const PROGRESS_KEY="rolypoly:progress";

function saveTodayResult(){
  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify({
      day:DAY,gameNo:GAMENO,banked,deepest,deepestName,
      results,share:shareText()
    }));
  }catch{/* private mode / quota / disabled storage — losing persistence isn't fatal */}
  clearInProgress();
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

/* ---------- in-progress persistence ---------- */
// An unfinished game is saved after every state change (not on a timer) so
// a mid-round reload resumes rather than losing the day. resumeIdx is
// always results.length — how many rounds are actually recorded — rather
// than the live idx variable, because idx doesn't advance until the player
// clicks past a round's summary screen: between endRound() finishing a
// round and that click, idx still points at the just-finished round, and
// saving that idx directly would resume back into a round already banked,
// double-counting it. Falling back to a fresh (round-not-started) resume
// state in that narrow window is the safe choice, not a faked one.
function saveInProgress(){
  if(isPractice)return;
  try{
    const resumeIdx=results.length;
    if(resumeIdx>=ROUNDS.length){clearInProgress();return}
    const midRound=idx===resumeIdx;
    localStorage.setItem(PROGRESS_KEY,JSON.stringify({
      day:DAY,gameNo:GAMENO,
      idx:resumeIdx,
      banked,deepest,deepestName,
      roundDepth:midRound?roundDepth:0,
      found:midRound?found:[],
      chamberHit:midRound?chamberHit:false,
      results
    }));
  }catch{/* private mode / quota / disabled storage — degrade to not saving */}
}

function loadInProgress(){
  try{
    const raw=localStorage.getItem(PROGRESS_KEY);
    if(!raw)return null;
    const rec=JSON.parse(raw);
    if(!rec||rec.day!==DAY||rec.gameNo!==GAMENO)return null;
    if(typeof rec.idx!=="number"||rec.idx<0||rec.idx>=ROUNDS.length)return null;
    if(typeof rec.banked!=="number"||!Array.isArray(rec.found)||!Array.isArray(rec.results))return null;
    return rec;
  }catch{return null}
}

function clearInProgress(){
  try{localStorage.removeItem(PROGRESS_KEY)}catch{/* nothing to do if storage is unavailable */}
}

// Restores state, then rebuilds the play screen for the resumed round via
// loadRound(true) — see loadRound() for why "resuming" skips the reset it
// normally does. The exact tunnel-by-tunnel dig history isn't reconstructed
// (that's live pacing/animation state, never persisted); loadRound(true)
// draws one clean shaft straight to roundDepth instead of faking the real
// dig-by-dig path.
function resumeGame(rec){
  idx=rec.idx;
  banked=rec.banked;
  roundDepth=rec.roundDepth;
  // rec.found came back through JSON, so its entries are plain-object
  // copies, not the same references as ROUNDS[idx].answers — dig()'s
  // "already dug that one" check is found.includes(hit) (reference
  // equality against a hit pulled from avail()), so a copy would silently
  // never match and let an already-found answer be dug, and scored, twice.
  // Re-bind each restored entry to its real answer object by name.
  const pool=ROUNDS[idx].answers;
  found=rec.found.map(f=>pool.find(a=>a.n===f.n)||f);
  deepest=rec.deepest;
  deepestName=rec.deepestName;
  chamberHit=rec.chamberHit;
  results.length=0;
  results.push(...rec.results);
  $("intro").hidden=true;$("play").hidden=false;
  $("hud").classList.remove("intro");
  loadRound(true);
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
      <div class="dugup">${r.domain}${res.bust?(res.cm>0?` — rumbled · kept ${res.cm}`:" — rumbled"):""}</div>
      ${foundHtml}
      ${missed.length?`<div class="dugup">Still down there</div>${missedHtml}`:""}
    </div>`;
  }).join("");
  return `<details class="missed" id="reviewBox"><summary>Review your answers</summary>
    <div class="review">${rounds}</div></details>`;
}

/* ---------- results ---------- */