const norm=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .replace(/[^a-z0-9 ]/g,"").replace(/^(the|a|an) /,"").replace(/\s+/g," ").trim();
function dist(a,b){
  const m=a.length,n=b.length,d=[];
  for(let i=0;i<=m;i++)d[i]=[i];
  for(let j=0;j<=n;j++)d[0][j]=j;
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){
    const c=a[i-1]===b[j-1]?0:1;
    d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+c);
    if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
  }
  return d[m][n];
}
const tolerance=l=>l<=3?1:l<=6?2:l<=12?3:4;
function partialMatches(key,pool){
  if(key.length<4)return[];
  return pool.filter(a=>[a.n,...(a.alias||[])].some(c0=>{
    const c=norm(c0);
    if(c===key)return true;
    if(c.split(" ").filter(t=>t.length>=4).includes(key))return true;
    return c.length>key.length&&c.startsWith(key)&&key.length>=4;
  }));
}
function nearMiss(key,pool){
  if(key.length<4)return null;
  let best=null,bd=Infinity;
  for(const a of pool)for(const cand of [a.n,...(a.alias||[])]){
    const c=norm(cand);
    if(c.length<4)continue;
    const d=dist(key,c);
    if(d<=tolerance(Math.max(key.length,c.length))&&d<bd){best=a;bd=d}
  }
  return best;
}

/* ---------- seeded daily randomness ---------- */
