const norm=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .replace(/[^a-z0-9 ]/g,"").replace(/^(the|a|an) /,"").replace(/\s+/g," ").trim();
// A guess shorter than this is too likely to be a real prefix of something
// unrelated for a fuzzy match to mean anything \u2014 every path below requires
// it, same threshold as before.
const MIN_FUZZY=4;
// Not a real stemmer \u2014 the one suffix that actually shows up in round
// content ("mint"/"mints", "samoa"/"samoas"). Guards the short side so it
// doesn't nibble words that are already at the floor ("this"->"thi").
const destem=s=>s.length>MIN_FUZZY&&s.endsWith("s")?s.slice(0,-1):s;
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
// Does `key` reach `word` \u2014 the same text, a plural of it either direction,
// or a genuine prefix (4+ chars, gated on `key`'s own length so a 2-char
// flattened-space fragment can't prefix-match everything)? Called once per
// whole candidate and once per token, so "mint" finds the token "mints" in
// "Thin Mints", and "peanut butter" (flattened) finds the whole alias
// "peanut butter patties" without needing "peanut" and "butter" to each be
// their own hit.
function reaches(key,word){
  if(word.length<MIN_FUZZY)return false;
  if(word===key)return true;
  const dk=destem(key),dw=destem(word);
  if(dw===dk)return true;
  if(key.length<MIN_FUZZY)return false;
  if(word.length>key.length&&word.startsWith(key))return true;
  return dw.length>dk.length&&dw.startsWith(dk);
}
function partialMatches(key,pool){
  if(key.length<MIN_FUZZY)return[];
  // A space-stripped form alongside the normal one, so a hyphenated name
  // ("Do-si-dos", which norm() reduces to "dosidos" since it only strips
  // punctuation, never inserts a space for it) still matches someone typing
  // it with spaces instead ("do si dos"), and the reverse.
  const flat=key.replace(/ /g,"");
  return pool.filter(a=>[a.n,...(a.alias||[])].some(c0=>{
    const full=norm(c0),flatFull=full.replace(/ /g,"");
    if(reaches(key,full)||reaches(flat,flatFull))return true;
    // Both forms against each token individually too — flat matters here
    // whenever a hyphen sits mid-name rather than at the start ("Extra-
    // Terrestrial" is one token by itself once norm() drops the hyphen; a
    // guess of "extra terrestrial" only reaches it flattened).
    return full.split(" ").some(t=>reaches(key,t)||reaches(flat,t));
  }));
}
function nearMiss(key,pool){
  if(key.length<MIN_FUZZY)return null;
  const flat=key.replace(/ /g,"");
  let best=null,bd=Infinity;
  for(const a of pool)for(const cand of [a.n,...(a.alias||[])]){
    const c=norm(cand),cf=c.replace(/ /g,"");
    if(c.length<MIN_FUZZY)continue;
    const d=Math.min(dist(key,c),flat.length>=MIN_FUZZY?dist(flat,cf):Infinity);
    if(d<=tolerance(Math.max(key.length,c.length))&&d<bd){best=a;bd=d}
  }
  return best;
}

/* ---------- seeded daily randomness ---------- */
