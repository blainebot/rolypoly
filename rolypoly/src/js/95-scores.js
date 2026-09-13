/* ---------- score distribution (optional — degrades to hidden, never fake) ---------- */
// This is the one piece of the game that isn't self-contained: it tries a
// single network call to a hosted API. If that call is slow, fails, or the
// page has no network at all (opened from disk, offline), the section
// simply doesn't render — the rest of the results screen is unaffected.
// Edit SCORES_API if this ever moves to a different deployment/domain.
const SCORES_API="https://rolypoly-seven.vercel.app/api/score";
const SCORES_TIMEOUT_MS=2000;
const MIN_FOR_CURVE=50;

async function fetchDistribution(game,score){
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),SCORES_TIMEOUT_MS);
  try{
    const res=await fetch(SCORES_API,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({game,score}),
      signal:ctrl.signal
    });
    if(!res.ok)return null;
    const data=await res.json();
    if(typeof data.count!=="number"||!Array.isArray(data.buckets))return null;
    return data;
  }catch{
    return null;
  }finally{
    clearTimeout(timer);
  }
}

function histogramSvg(buckets,myBucket){
  const bw=8,gap=1,h=32;
  const max=Math.max(1,...buckets);
  const bars=buckets.map((c,i)=>{
    const bh=Math.max(1,Math.round((c/max)*h));
    return `<rect class="distbar${i===myBucket?" me":""}" x="${i*(bw+gap)}" y="${h-bh}" width="${bw}" height="${bh}"/>`;
  }).join("");
  const w=buckets.length*(bw+gap)-gap;
  return `<svg aria-hidden="true" viewBox="0 0 ${w} ${h}" width="${w*2}" height="${h*2}">${bars}</svg>`;
}

async function renderDistribution(score){
  const box=$("distBox");
  if(!box)return;
  const data=await fetchDistribution(GAMENO,score);
  if(!data||data.count<MIN_FOR_CURVE)return;
  const width=data.bucketWidth||1;
  const myBucket=Math.min(data.buckets.length-1,Math.floor(score/width));
  box.innerHTML=`<div class="dist">
    ${histogramSvg(data.buckets,myBucket)}
    <p class="distline">You scored better than ${data.percentile}% of today's players.</p>
  </div>`;
}
