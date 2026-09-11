function buildWorld(){
  const seed=mulberry32(seedFrom(DAY));
  let html="";
  for(const L of LAYERS){
    const top=210+(L.sky?L.from:depthPx(L.from)), h=L.sky?-L.from:(depthPx(L.to)-depthPx(L.from));
    let bits="";
    if(L.name){
      const kinds=L.name==="leaf litter"?["#C9D692","#B5651F"]
        :L.name==="topsoil"?["#DBC096","#6E4A28"]
        :L.name==="root line"?["#8A6E3C","#A8DCED"]
        :L.name==="bedrock"?["#8E7BA6","#D8B0E6"]:["#E0A33A","#F7EFD9"];
      const n=Math.floor(h/46);
      for(let i=0;i<n;i++){
        const x=6+seed()*88, y=8+seed()*(h-20), c=kinds[i%2];
        const cls=seed()<.3?"bit t":seed()<.5?"bit w":"bit";
        bits+=`<div class="${cls}" style="left:${x}%;top:${y}px;background:${c};opacity:.55"></div>`;
      }
    }
    const TREE=(w,x)=>`<div class="tree" style="left:${x}%;width:${w}px">
      <svg viewBox="0 0 60 104" aria-hidden="true">
        <rect class="bark" x="25" y="58" width="10" height="46"/>
        <rect class="barkdk" x="25" y="58" width="4" height="46"/>
        <rect class="bark" x="17" y="64" width="8" height="6"/>
        <rect class="bark" x="35" y="72" width="8" height="6"/>
        <rect class="leafmid" x="21" y="4" width="18" height="8"/>
        <rect class="leafmid" x="13" y="12" width="34" height="8"/>
        <rect class="leafmid" x="6" y="20" width="48" height="10"/>
        <rect class="leafmid" x="4" y="30" width="52" height="12"/>
        <rect class="leafmid" x="8" y="42" width="44" height="10"/>
        <rect class="leafmid" x="16" y="52" width="28" height="8"/>
        <rect class="leaflt" x="22" y="6" width="10" height="6"/>
        <rect class="leaflt" x="14" y="16" width="12" height="6"/>
        <rect class="leaflt" x="10" y="26" width="10" height="6"/>
        <rect class="leafdk" x="38" y="24" width="12" height="8"/>
        <rect class="leafdk" x="32" y="44" width="14" height="8"/>
        <rect class="leafdk" x="18" y="46" width="8" height="6"/>
        <rect class="berry" x="12" y="38" width="5" height="5"/>
        <rect class="berry" x="42" y="18" width="5" height="5"/>
        <rect class="berry" x="30" y="50" width="5" height="5"/>
      </svg></div>`;
    const BIRD=(cls,y,dur,delay)=>`<div class="bird ${cls}" style="bottom:${y}px;
      animation-duration:${dur}s;animation-delay:-${delay}s">
      <svg viewBox="0 0 26 16" aria-hidden="true">
        <rect class="quill" x="9" y="7" width="9" height="4"/>
        <rect class="quill" x="17" y="8" width="4" height="2"/>
        <rect class="beak" x="21" y="8" width="3" height="2"/>
        <g class="wingA"><rect class="quill" x="2" y="2" width="8" height="3"/>
          <rect class="quill" x="14" y="2" width="8" height="3"/></g>
        <g class="wingB"><rect class="quill" x="2" y="11" width="8" height="3"/>
          <rect class="quill" x="14" y="11" width="8" height="3"/></g>
      </svg></div>`;
    let flora="";
    if(L.sky){
      flora+=TREE(80,11)+TREE(58,76);
      flora+=BIRD("b1",88,46,0)+BIRD("b2",132,62,26);
      flora+=`<svg class="sun" viewBox="0 0 80 80" aria-hidden="true">
        <g class="rays">
          <rect class="ray r1" x="37" y="1" width="6" height="12"/><rect class="ray r1" x="37" y="67" width="6" height="12"/>
          <rect class="ray r1" x="1" y="37" width="12" height="6"/><rect class="ray r1" x="67" y="37" width="12" height="6"/>
          <rect class="ray r2" x="13" y="13" width="8" height="8"/><rect class="ray r2" x="59" y="13" width="8" height="8"/>
          <rect class="ray r2" x="13" y="59" width="8" height="8"/><rect class="ray r2" x="59" y="59" width="8" height="8"/>
        </g>
        <g class="sparks">
          <rect class="ray r3" x="24" y="4" width="5" height="5"/><rect class="ray r3" x="51" y="4" width="5" height="5"/>
          <rect class="ray r3" x="4" y="24" width="5" height="5"/><rect class="ray r3" x="71" y="24" width="5" height="5"/>
          <rect class="ray r3" x="4" y="51" width="5" height="5"/><rect class="ray r3" x="71" y="51" width="5" height="5"/>
          <rect class="ray r3" x="24" y="71" width="5" height="5"/><rect class="ray r3" x="51" y="71" width="5" height="5"/>
        </g>
        <rect class="disc" x="30" y="18" width="20" height="4"/><rect class="disc" x="26" y="22" width="28" height="4"/>
        <rect class="disc" x="22" y="26" width="36" height="4"/><rect class="disc" x="18" y="30" width="44" height="20"/>
        <rect class="disc" x="22" y="50" width="36" height="4"/><rect class="disc" x="26" y="54" width="28" height="4"/>
        <rect class="disc" x="30" y="58" width="20" height="4"/>
        <rect class="glow" x="26" y="26" width="22" height="22"/>
        <rect class="glow2" x="29" y="29" width="12" height="12"/>
      </svg>`;
      const puff=(x,y,w)=>{
        const b=w, m=Math.round(w*0.6), t=Math.round(w*0.34);
        return `<div class="cloud" style="left:${x.toFixed(2)}%;bottom:${y}px">
          <i style="left:0;bottom:0;width:${b}px"></i>
          <i style="left:${Math.round(w*0.16)}px;bottom:11px;width:${m}px"></i>
          <i style="left:${Math.round(w*0.38)}px;bottom:22px;width:${t}px"></i></div>`;
      };
      let cl="";
      for(let i=0;i<6;i++){
        const x=(i*8.3)+seed()*3.5;
        const y=95+(i%3)*52+((seed()*22)|0);
        const w=54+((seed()*66)|0);
        cl+=puff(x,y,w)+puff(x+50,y,w);
      }
      flora+=`<div class="clouds">${cl}</div>`;
    }
    if(!L.name){
      const petals=["#E8698F","#F2C744","#F3EDE0","#C87BE0","#F08A3C"];
      for(let i=0;i<86;i++){
        const x=seed()*100, hgt=9+seed()*26;
        flora+=`<div class="blade" style="left:${x}%;height:${hgt}px"></div>`;
      }
      for(let i=0;i<20;i++){
        const x=2+seed()*96, hgt=16+seed()*48, c=petals[Math.floor(seed()*petals.length)];
        flora+=`<div class="stalk" style="left:${x}%;height:${hgt}px"></div>`
          +`<div class="bloom" style="left:calc(${x}% - 6px);bottom:${hgt}px;background:${c}"></div>`
          +`<div class="bloom" style="left:calc(${x}% + 3px);bottom:${hgt}px;background:${c}"></div>`
          +`<div class="bloom" style="left:calc(${x}% - 1px);bottom:${hgt+5}px;background:${c}"></div>`
          +`<div class="bloom" style="left:calc(${x}% - 1px);bottom:${hgt-5}px;background:${c}"></div>`
          +`<div class="bloom" style="left:calc(${x}% - 1px);bottom:${hgt}px;background:#F2C744"></div>`;
      }
      for(let i=0;i<14;i++){
        flora+=`<div class="pebble" style="left:${seed()*100}%"></div>`;
      }
    }
    html+=`<div class="layer${L.sky?" sky":""}" style="top:${top}px;height:${h}px;background:${L.bg}">
      ${L.name?`<b>${L.name}</b>`:""}${bits}${flora}</div>`;
  }
  $("strata").innerHTML=html+`<svg class="tunsvg" width="3400" height="10000"><g id="tunnels" fill="#180F08"></g></svg>`;
}
const inner=svg=>svg.replace(/<\/?svg[^>]*>/g,"");
function BURROW(curled){
  const bug=curled?BALL(me):WALK(me);
  const off=curled
    ? "translate(82,60) scale(0.85) translate(-32,-37)"
    : "translate(82,60) rotate(-90) scale(0.85) translate(-48,-33)";
  return `<svg class="burrowsvg" width="164" height="120" viewBox="0 0 164 120" role="img" aria-label="${me} in the burrow">
<rect class="rimlt" x="34" y="0" width="96" height="5"/>
<rect class="rim" x="20" y="5" width="124" height="6"/>
<rect class="rim" x="8" y="11" width="148" height="8"/>
<rect class="rim" x="4" y="19" width="10" height="82"/><rect class="rim" x="150" y="19" width="10" height="82"/>
<rect class="rim" x="8" y="101" width="148" height="8"/>
<rect class="rim" x="20" y="109" width="124" height="6"/>
<rect class="rimlt" x="34" y="115" width="96" height="5"/>
<rect class="tunnel" x="30" y="5" width="104" height="6"/>
<rect class="tunnel" x="18" y="11" width="128" height="8"/>
<rect class="tunnel" x="14" y="19" width="136" height="82"/>
<rect class="tunnel" x="18" y="101" width="128" height="8"/>
<rect class="tunnel" x="30" y="109" width="104" height="6"/>
<rect class="rim" x="14" y="28" width="9" height="12"/><rect class="rim" x="141" y="48" width="9" height="14"/>
<rect class="rim" x="14" y="74" width="7" height="11"/>
<g transform="${off}">${inner(bug)}</g>
</svg>`}

const JAG=mulberry32(seedFrom(DAY+"#edge"));
const CH=84, DW=96, CX=1700, STEP=16;
const WOBT=[],WOBB=[],WOBL=[],WOBR=[],WOBC=[];
for(let i=0;i<400;i++){WOBT.push(JAG()*2-1);WOBB.push(JAG()*2-1);
  WOBL.push(JAG()*2-1);WOBR.push(JAG()*2-1);WOBC.push(JAG()*2-1)}
const wob=(a,i)=>a[((i%a.length)+a.length)%a.length];

let paceX=0, paceDir=1, pacer=null, curCorr=null, curCm=0;
const RANGE=()=>Math.max(70,(window.innerWidth/2)-48);
const svgEl=t=>document.createElementNS("http://www.w3.org/2000/svg",t);

function worldY(cm){return 210+depthPx(cm)}

function corridorPath(cm,mn,mx){
  const y=worldY(cm)-25, x0=CX+mn-DW/2, x1=CX+mx+DW/2, half=CH/2;
  const top=[],bot=[];
  const put=xx=>{
    const i=Math.round(xx/STEP);
    const fade=Math.min(1,Math.min(xx-x0,x1-xx)/34);
    const h=half*(0.34+0.66*fade);
    top.push(`${xx|0},${(y-h+wob(WOBT,i)*8)|0}`);
    bot.push(`${xx|0},${(y+h+wob(WOBB,i)*8)|0}`);
  };
  put(x0);
  for(let i=Math.ceil(x0/STEP);i*STEP<x1;i++)put(i*STEP);
  put(x1);
  return "M"+top.join("L")+"L"+bot.reverse().join("L")+"Z";
}

function dropPath(x,y0,y1,p){
  const ya=worldY(y0)-10, yb=ya+(worldY(y1)-worldY(y0)+20)*p, halfW=DW/2;
  const L=[],R=[];
  const ys=[ya];
  for(let i=Math.ceil(ya/STEP);i*STEP<yb;i++)ys.push(i*STEP);
  ys.push(yb);
  for(const yy of ys){
    const i=Math.round(yy/STEP);
    const u=(yy-ya)/Math.max(1,yb-ya);
    const drift=Math.sin(Math.PI*u)*wob(WOBC,i)*22;
    const cx=CX+x+drift;
    const fade=Math.min(1,Math.min(yy-ya,yb-yy)/30);
    const w=halfW*(0.42+0.58*fade);
    L.push(`${(cx-w+wob(WOBL,i)*7)|0},${yy|0}`);
    R.push(`${(cx+w+wob(WOBR,i)*7)|0},${yy|0}`);
  }
  if(!L.length)return "";
  return "M"+L.join("L")+"L"+R.reverse().join("L")+"Z";
}

function newCorridor(cm,x){
  curCorr=null;
  if(cm<=0)return;
  const p=svgEl("path");
  p.dataset.min=x;p.dataset.max=x;
  curCm=cm;
  p.setAttribute("d",corridorPath(cm,x,x));
  $("tunnels").appendChild(p);
  curCorr=p;
}
function clipCorridor(x){
  if(!curCorr)return;
  const mn=Math.min(+curCorr.dataset.min,x), mx=Math.max(+curCorr.dataset.max,x);
  if(mn===+curCorr.dataset.min&&mx===+curCorr.dataset.max)return;
  curCorr.dataset.min=mn;curCorr.dataset.max=mx;
  curCorr.setAttribute("d",corridorPath(curCm,mn,mx));
}
const RELIC_PICK=Math.floor(mulberry32(seedFrom(DAY+"#relic"))()*RELICS.length);
function placeRelic(x){
  const g=svgEl("g");
  g.setAttribute("transform",`translate(${CX+x+74},${worldY(CHAMBER_AT)-11})`);
  g.innerHTML=RELIC(RELIC_PICK);
  $("tunnels").appendChild(g);
}

function newDrop(x,y0,y1){
  const p=svgEl("path");
  $("tunnels").appendChild(p);
  if(calm()){p.setAttribute("d",dropPath(x,y0,y1,1));return}
  const t0=Date.now(), dur=1050;
  (function step(){
    const t=Math.min(1,(Date.now()-t0)/dur);
    p.setAttribute("d",dropPath(x,y0,y1,1-Math.pow(1-t,2.2)));
    if(t<1)requestAnimationFrame(step);
  })();
}

function renderBug(mode){
  const rig=$("rig");
  const sprite=(mode==="ball"||mode==="curl")?BALL(me):WALK(me);
  const cls=(mode==="ball"||mode==="curl")?"bug ball":(mode==="dig"?"bug dig":"bug");
  rig.innerHTML=`<div class="${cls}">${sprite}</div>`;
  rig.style.transform=`translateX(${Math.round(paceX)}px) scaleX(${mode==="pace"&&paceDir>0?-1:1})`;
}
function startPacing(){
  stopPacing();
  if(calm()){renderBug("pace");return}
  renderBug("pace");
  let last=Date.now();
  pacer=setInterval(()=>{
    const now=Date.now(), dt=Math.min(.1,(now-last)/1000); last=now;
    const R=RANGE();
    paceX+=paceDir*34*dt;
    if(paceX>=R){paceX=R;paceDir=-1;renderBug("pace")}
    else if(paceX<=-R){paceX=-R;paceDir=1;renderBug("pace")}
    else{$("rig").style.transform=`translateX(${Math.round(paceX)}px) scaleX(${paceDir>0?-1:1})`}
    clipCorridor(paceX);
  },1000/30);
}
function stopPacing(){if(pacer){clearInterval(pacer);pacer=null}}

function rollOut(then){
  const d=$("digger");
  stopPacing();
  renderBug("ball");
  if(calm()){then();return}
  d.classList.remove("rollingin");void d.offsetWidth;d.classList.add("rolling");
  setTimeout(then,1700);
}
function rollIn(first){
  const d=$("digger");
  d.classList.remove("rolling","parade");
  paceX=0;paceDir=1;
  $("tunnels").innerHTML="";curCorr=null;
  $("rig").style.transform="translateX(0)";
  if(first||calm()){moveWorld(0);startPacing();return}
  renderBug("ball");
  void d.offsetWidth;d.classList.add("rollingin");
  setTimeout(()=>{d.classList.remove("rollingin");moveWorld(0);startPacing()},2200);
}
function moveWorld(cm,curled){
  const d=Math.min(cm,280);
  $("strata").style.transform=`translateY(${Math.round(-depthPx(d))}px)`;
  if(curled!==undefined)renderBug(curled?"curl":"pace");
}

/* ---------- hud ---------- */
