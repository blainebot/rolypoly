$("gameno").textContent=GAMENO;
// iOS keeps the layout viewport tall when the keyboard opens, which buries the
// input. Watch the visual viewport and collapse the scenery while it is up.
(function(){
  const vv=window.visualViewport;
  if(!vv)return;
  const sync=()=>{
    const covered=window.innerHeight-vv.height;
    document.body.classList.toggle("kb",covered>150);
  };
  vv.addEventListener("resize",sync);
  vv.addEventListener("scroll",sync);
  sync();
})();

buildWorld();
moveWorld(0);
renderBug("pace");
startPacing();
buildIntro();
$("digBtn").onclick=dig;
$("bankBtn").onclick=bank;
$("answer").addEventListener("keydown",e=>{if(e.key==="Enter")dig()});
$("answer").addEventListener("focus",()=>{
  setTimeout(()=>$("answer").scrollIntoView({block:"center",behavior:"smooth"}),320);
});

const storedResult=loadTodayResult();
if(storedResult)showStoredResults(storedResult);
