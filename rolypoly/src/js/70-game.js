function say(t,cls){$("msg").textContent=t;$("msg").className="msg "+(cls||"")}
const breadthBonus=()=>Math.max(0,(found.length-2)*2);
function renderFacts(){
  $("facts").innerHTML=found.length
    ? `<div class="chips">`+found.map((x,i)=>
        `<span class="chip${i===found.length-1?" fresh":""}">${x.n}<i>+${x.v}</i></span>`).join("")+`</div>`
    : "";
}
function revealFacts(){
  if(!found.length){$("facts").innerHTML="";return}
  $("facts").innerHTML=`<div class="dugup">What you dug up</div>`+
    found.map(x=>`<div class="fact"><b>${x.n}</b><i>+${x.v}</i><p>${x.f}</p></div>`).join("");
}

// resuming=true rebuilds the play screen for whatever idx/roundDepth/found
// were just restored by resumeGame(), instead of resetting them — the only
// difference from a normal round start. See saveInProgress() for why the
// world redraw below is one clean shaft to roundDepth, not the real
// dig-by-dig tunnel history.
function loadRound(resuming){
  const r=ROUNDS[idx];
  if(!resuming){roundDepth=0;found=[];chamberHit=false}
  $("chamberBox").innerHTML="";
  $("domain").textContent=r.domain.toLowerCase();
  $("prompt").textContent=r.prompt;
  $("facts").innerHTML="";
  $("roundSummary").innerHTML="";
  $("missedBox").innerHTML="";
  $("confirmBox").innerHTML="";
  $("answer").value="";$("answer").disabled=false;
  $("entry").hidden=false;$("deadend").hidden=true;
  $("digBtn").hidden=false;$("digBtn").disabled=false;
  $("digBtn").textContent=found.length?"Dig again":"Dig";
  const bonus=breadthBonus();
  $("bankBtn").disabled=found.length===0;
  $("bankBtn").textContent=found.length?`Bank and roll +${roundDepth+bonus}`:"Bank and roll";
  $("bankBtn").onclick=bank;
  $("bonusNum").hidden=bonus<=0;
  $("bonusNum").textContent=bonus>0?`+${bonus} bonus`:"";
  $("den").classList.remove("gone","tremble");$("den").innerHTML=SLEEPER(false);
  $("gainNum").textContent=roundDepth;$("gainPlus").textContent="";
  setShell(found.length?tierFor(found[found.length-1].v).v:"sand");
  renderFacts();
  rollIn(idx===0||resuming);
  if(resuming&&roundDepth>0){moveWorld(roundDepth);newDrop(0,0,roundDepth);newCorridor(roundDepth,0)}
  updateHud();
  say(resuming&&found.length?`Resumed — ${roundDepth} at risk.`:"");
  softFocus();
  saveInProgress();
}

function reveal(hit,then){
  const t=tierFor(hit.v);
  const from=roundDepth-hit.v, x=paceX;
  setShell(t.v);
  stopPacing();
  renderBug("dig");
  newDrop(x,from,roundDepth);
  $("controls").hidden=true;
  $("reveal").hidden=false;
  $("revName").textContent=hit.n;
  $("revTier").textContent=t.name;
  $("revTier").className="stamp t-"+t.v;
  moveWorld(roundDepth);
  if(calm()){newCorridor(roundDepth,x);startPacing();
    $("revCm").textContent="+"+hit.v;
    setTimeout(()=>{$("reveal").hidden=true;$("controls").hidden=false;then()},400);
    return;
  }
  let n=0;const step=Math.max(1,Math.ceil(hit.v/20));
  $("revCm").textContent="+0";
  const iv=setInterval(()=>{n=Math.min(hit.v,n+step);$("revCm").textContent="+"+n;
    if(n>=hit.v)clearInterval(iv)},52);
  setTimeout(()=>{
    newCorridor(roundDepth,x);
    if(!chamberHit&&roundDepth>=CHAMBER_AT){
      chamberHit=true;
      placeRelic(x);
      $("chamberBox").innerHTML=`<div class="chamber">
        <span class="ct">The hidden chamber</span>
        <p>Poly broke through past ${CHAMBER_AT}. ${RELICS[RELIC_PICK].n} is down here in the dark.</p></div>`;
    }
    startPacing();
  },1050);
  setTimeout(()=>{$("reveal").hidden=true;$("controls").hidden=false;then()},1900);
}

function accept(hit){
  found.push(hit);
  roundDepth+=hit.v;
  $("gainNum").textContent=roundDepth;
  $("gainPlus").textContent="+"+hit.v;
  const g=$("gain"), pl=$("gainPlus");
  g.classList.remove("pop");void g.offsetWidth;g.classList.add("pop");
  pl.classList.remove("fly");void pl.offsetWidth;pl.classList.add("fly");
  if(hit.v>deepest){deepest=hit.v;deepestName=hit.n}
  $("answer").value="";
  updateHud();
  const bonus=breadthBonus();
  $("bonusNum").hidden=bonus<=0;
  $("bonusNum").textContent=bonus>0?`+${bonus} bonus`:"";
  saveInProgress();
  reveal(hit,()=>{
    renderFacts();
    const found_=`${hit.n} — ${tierFor(hit.v).name}, +${hit.v}.`;
    if(found.length===avail().length){
      roundDepth+=10;updateHud();
      saveInProgress();
      say(`${found_} You cleared the whole list. +10.`,"good");
      rollOut(()=>endRound("bank"));
      return;
    }
    $("bankBtn").disabled=false;
    $("bankBtn").textContent=`Bank and roll +${roundDepth+bonus}`;
    $("digBtn").textContent="Dig again";
    say(`${found_} ${roundDepth} at risk.`,"good");
    keepFocus();
  });
}

function askConfirm(raw,hit){
  $("digBtn").disabled=true;$("bankBtn").disabled=true;$("answer").disabled=true;
  $("confirmBox").innerHTML=`<div class="confirm"><p>Did you mean <b>${hit.n}</b>?</p>
    <div class="acts"><button class="dig" id="yesBtn">Yes, dig it</button>
    <button id="noBtn">No, let me retype</button></div></div>`;
  say(`"${raw}" isn't quite on the list — did you mean ${hit.n}? Nothing lost yet.`,"");
  $("yesBtn").focus();
  $("yesBtn").onclick=()=>{
    $("confirmBox").innerHTML="";
    $("digBtn").disabled=false;$("answer").disabled=false;
    if(found.includes(hit)){say("You already dug that one.","");$("answer").select();return}
    hadFocus=true;accept(hit);
  };
  $("noBtn").onclick=()=>{
    $("confirmBox").innerHTML="";
    $("digBtn").disabled=false;$("answer").disabled=false;
    $("bankBtn").disabled=found.length===0;
    say("");$("answer").select();
  };
}

// Shared by a genuine dead end and a distractor marked `bust: true` — same
// visual beat (dead-end card, Rumble wakes, round ends) either way. `raw` is
// the player's own text, `why` is the sentence to show after it: nothing for
// a plain dead end, a distractor's `note` when there's something to explain.
function bustWith(raw,why){
  $("digBtn").disabled=true;$("bankBtn").disabled=true;$("answer").disabled=true;
  $("entry").hidden=true;$("digBtn").hidden=true;
  $("deadend").hidden=false;
  $("deadend").innerHTML=`<b>${raw}</b> …`;
  say(`"${raw}"${why?` isn't it — ${why}`:" isn't on the list."} Rumble wakes up.`,"bad");
  wakeRumble();
  setTimeout(()=>{
    $("deadend").innerHTML=`<b>${raw}</b>${why?` isn't it — ${why}`:" isn't on the list."}`;
    endRound("bust");
  },1150);
}

function dig(){
  hadFocus=(document.activeElement===$("answer"));
  const raw=$("answer").value.trim();
  if(!raw){say("Type an answer first.","bad");$("answer").focus();return}
  const key=norm(raw), pool=avail();
  const hit=pool.find(a=>norm(a.n)===key||(a.alias||[]).some(al=>norm(al)===key));
  if(hit){
    if(found.includes(hit)){say("Already dug that one.","");$("answer").select();return}
    accept(hit);return;
  }
  const matches=fuzzyMatches(key,pool);
  if(matches.length===1){askConfirm(raw,matches[0]);return}
  if(matches.length>1){
    const undug=matches.filter(a=>!found.includes(a));
    if(undug.length===1){askConfirm(raw,undug[0]);return}
    say(`More than one answer matches "${raw}". Be more specific — nothing lost.`,"");
    $("answer").select();return;
  }
  // Extras: correct, but outside the scoring fifteen. Checked last, after
  // the real scoring list has had every chance to claim the guess, and
  // before Rumble would otherwise wake up for an answer that's genuinely
  // right. No confirm step — unlike a scoring guess, accepting or
  // rejecting the suggestion changes nothing either way, so there's
  // nothing worth interrupting play to ask about.
  const extras=ROUNDS[idx].extras;
  if(extras&&(extras.some(x=>norm(x.n)===key||(x.alias||[]).some(al=>norm(al)===key))
    ||fuzzyMatches(key,extras).length)){
    say(`"${raw}" is right, but not one of today's fifteen — nothing lost.`,"");
    $("answer").select();return;
  }
  // Distractors: a predictable wrong guess worth naming instead of a bare
  // bust message — the player often does know something, just not quite
  // the right thing. Checked after extras (a genuinely correct answer
  // always wins first). No confirm step: this guess was never going to be
  // credited either way, so there's nothing to ask about. `note` is
  // author-written prose, not templated.
  //
  // Most distractors are a *wrong-category* guess (Ohio State's mascot
  // isn't Ohio State) — forgiven, same as an extra: nothing lost, try
  // again. But a distractor can opt into `bust: true` for a guess that's
  // wrong on the actual merits of the prompt, not just misfiled (Schindler's
  // List directed by Spielberg, sure, but not "in the 2000s or later" —
  // that's a real wrong answer, not a category mix-up, and deserves the
  // same consequence a bust always has, just with the reason spelled out
  // instead of a bare "isn't on the list").
  const distractors=ROUNDS[idx].distractors;
  if(distractors){
    const hit=distractors.find(x=>norm(x.n)===key||(x.alias||[]).some(al=>norm(al)===key))
      ||fuzzyMatches(key,distractors)[0];
    if(hit){
      if(hit.bust){bustWith(raw,hit.note);return}
      say(`"${raw}" isn't it — ${hit.note} Nothing lost, try again.`,"");
      $("answer").select();return;
    }
  }
  bustWith(raw);
}

function bank(){
  if(!found.length){say("Dig at least once before you roll.","bad");return}
  say(`Banked ${roundDepth+breadthBonus()}.`,"good");
  $("digBtn").disabled=true;$("bankBtn").disabled=true;$("answer").disabled=true;
  rollOut(()=>endRound("bank"));
}

function endRound(kind){
  $("answer").disabled=true;$("digBtn").disabled=true;$("bankBtn").disabled=true;
  $("entry").hidden=true;$("digBtn").hidden=true;
  stopPacing();
  const bonus=breadthBonus();
  const firstFind=found.length?found[0].v:0;
  const dug=roundDepth;
  const gained=kind==="bank"?roundDepth+bonus:firstFind;
  const left=avail().filter(a=>!found.includes(a)).reduce((n,a)=>n+a.v,0);
  const top=found.reduce((m,a)=>Math.max(m,a.v),0);
  banked+=gained;
  const foundSnap=found.map(a=>({n:a.n,v:a.v,f:a.f}));
  results.push({domain:ROUNDS[idx].domain,digs:found.length,cm:gained,bust:kind==="bust",left,top,chamber:chamberHit,found:foundSnap});
  if(kind==="bust"){$("gainNum").textContent="0";rumble(dug-firstFind,firstFind)}
  else{updateHud()}
  revealFacts();
  showRoundSummary(kind,bonus,dug);
  showMissed();
  $("bankBtn").disabled=false;
  $("bankBtn").textContent=idx===ROUNDS.length-1?"See your day":"Next round";
  $("bankBtn").onclick=()=>{
    idx++;
    if(idx>=ROUNDS.length)showResults();
    else loadRound();
  };
  if(kind==="bank"){
    // #roundSummary/#missedBox have no live region of their own (renderFacts()
    // fires on every dig, not just round end, so making .facts itself live
    // would re-announce the whole growing chip list on every single find) —
    // this folds the same numbers into the one aria-live channel that
    // already works instead. The bust path leaves #msg as dig() set it
    // ("isn't on the list. Rumble wakes up.") since the Rumble dialog itself
    // is the accessible narrative for a bust; this is bank-only.
    const finds=found.length;
    const par=ROUNDS[idx].par;
    const restCount=avail().length-finds;
    say(`Banked ${gained}. ${finds} ${finds===1?"find":"finds"} · ${dug} dug${bonus>0?` · +${bonus} bonus`:""}. Par ${par}.${restCount?` ${restCount} still down there.`:""}`,"good");
    // endRound() ends every round with focus wherever it was (often the now-
    // disabled #answer), which browsers drop to document.body — silence for
    // a keyboard/screen-reader user, with no cue the round ended or where to
    // go. The bust path already restores focus on Rumble's close(); this is
    // the bank-path equivalent.
    $("bankBtn").focus();
  }
  saveInProgress();
}

function showRoundSummary(kind,bonus,dug){
  const par=ROUNDS[idx].par;
  const finds=found.length;
  const roundsum=kind==="bank"
    ?`<p class="roundsum">${finds} ${finds===1?"find":"finds"} · ${dug} dug · +${bonus} bonus</p>`
    :"";
  $("roundSummary").innerHTML=roundsum+`<p class="parline">Par ${par} · you dug ${dug}</p>`;
}

function showMissed(){
  const rest=avail().filter(a=>!found.includes(a)).sort((x,y)=>y.v-x.v);
  if(!rest.length)return;
  const open=isMobile()?"":" open";
  $("missedBox").innerHTML=`<details class="missed"${open}>
    <summary>Still down there — ${rest.length} you didn't reach</summary><div class="grid">`+
    rest.map(a=>`<p>${a.n}<span class="cm">${a.v}</span></p>`).join("")+`</div></details>`;
}

/* ---------- rumble ---------- */
