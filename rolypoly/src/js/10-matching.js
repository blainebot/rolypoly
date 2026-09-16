const norm=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .replace(/[^a-z0-9 ]/g,"").replace(/^(the|a|an) /,"").replace(/\s+/g," ").trim();
const flatten=s=>s.replace(/ /g,"");
// A guess or candidate word shorter than this is too likely to be a real
// prefix of something unrelated for a fuzzy match to mean anything.
const MIN_FUZZY=4;
// Filler words never carry a match on their own, whatever a future content
// round's answers look like — not just a side effect of MIN_FUZZY (every one
// of these happens to be shorter than that anyway, but this is the rule
// itself, stated once, not an accident of an unrelated threshold).
const STOPWORDS=new Set(["the","a","an","of","and"]);
// Simple plural stemming — not a real stemmer, just every trailing-s/es/ies
// reading that might be the singular, offered as separate candidates rather
// than picked by a rule that has to guess right: stripping "es" turns
// "boxes" into "box" correctly but "lines" into "lin", and swapping "ies"
// for "y" turns "berries" into "berry" correctly but "Annies" (the plural
// of a name ending in -ie, not -y) into "anny" — so try all three and let
// matchScore's exact/prefix check find whichever one is real. Guards the
// short side so it doesn't nibble words already at the floor ("this"->"thi").
function stems(s){
  if(s.length<=MIN_FUZZY)return[s];
  const out=new Set([s]);
  if(s.endsWith("s"))out.add(s.slice(0,-1));
  if(s.endsWith("es"))out.add(s.slice(0,-2));
  if(s.endsWith("ies"))out.add(s.slice(0,-3)+"y");
  return[...out];
}
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
// Every transformed view of a piece of text the matcher is willing to
// compare: normalised, its plural stem, and both of those again with
// spaces removed too (so "Do-si-dos" and "do si dos" converge — norm()
// drops punctuation but never inserts a space for it). One list a guess
// and a whole candidate string are both reduced to, rather than a
// different rule per case.
function views(s){
  const n=norm(s),f=flatten(n);
  const all=new Set([n,f]);
  for(const v of[n,f])for(const st of stems(v))all.add(st);
  return[...all].filter(v=>v.length>=MIN_FUZZY&&!STOPWORDS.has(v));
}
// Below this length, a token only ever contributes an exact or prefix hit
// (see matchScore) — never a typo-distance one. A short common word like
// "park" or "avenue" is one edit away from plenty of other short common
// words ("york" landing 2 edits from both "park" and "work" nearly broke
// a whole Monopoly board); the old near-miss tolerance was only ever
// checked against a *whole* candidate name, long enough that a
// coincidental collision was rare. A long, distinctive word doesn't have
// that problem — "pennsyvania" (missing the second l) is 3 edits from
// "avenue" but only 1 from "pennsylvania", nowhere near ambiguous — so
// tokens at or past this length get the same typo tolerance a whole
// candidate string always has.
const MIN_TOKEN_TYPO=8;
// A candidate's individual tokens (each and its stem) — what lets a guess
// reach one distinctive word inside a multi-word name or alias, the piece
// `views()` alone can't see since it only ever looks at whole strings.
function tokenViews(s){
  const out=new Set();
  for(const t of norm(s).split(" ")){
    if(t.length<MIN_FUZZY||STOPWORDS.has(t))continue;
    out.add(t);
    for(const st of stems(t))out.add(st);
  }
  return [...out];
}
// The one scoring function every match decision runs through: how well
// does `guess` reach `candidateText`? 0 is as good as typing it outright —
// an exact match through some transformation, a whole token, or a clean
// 4+ character prefix of one. Otherwise it's a genuine edit-distance typo,
// scored as that distance divided by tolerance() at the pairing's own
// length — the same length-scaled allowance as before, just normalised so
// one fixed threshold (CONFIRM_THRESHOLD below) works at every length
// instead of a second, separately-tuned check. That typo check runs against
// the *whole* candidate always, and against an individual token once it's
// long enough (MIN_TOKEN_TYPO) to rule out a coincidental collision with
// some other short word in the same pool. Infinity means nothing gets them
// within reach at all.
function matchScore(guess,candidateText){
  const gViews=views(guess);
  if(!gViews.length)return Infinity;
  const tokens=tokenViews(candidateText);
  const whole=views(candidateText);
  let best=Infinity;
  for(const g of gViews){
    for(const c of tokens){
      if(g===c||(c.length>g.length&&c.startsWith(g)))return 0;
      if(c.length>=MIN_TOKEN_TYPO){
        const d=dist(g,c)/tolerance(Math.max(g.length,c.length));
        if(d<best)best=d;
      }
    }
    for(const c of whole){
      if(g===c||(c.length>g.length&&c.startsWith(g)))return 0;
      const d=dist(g,c)/tolerance(Math.max(g.length,c.length));
      if(d<best)best=d;
    }
  }
  return best;
}
const CONFIRM_THRESHOLD=1;
// Every answer `key` reaches well enough to offer a confirm on, scored
// against each one's name and every alias (the better of the two decides
// that answer's place in the list — trying both is how an alias like
// "caramel delites" gets found by "caramel" without the canonical name
// "Samoas" needing to). dig() turns the length of this list into an
// outcome exactly as it always has: one match confirms it, more than one
// asks to be more specific, none wakes Rumble.
//
// A clean (score 0) match — an exact hit, a whole token, a real prefix —
// is strong enough evidence on its own that a merely-within-tolerance
// typo-distance coincidence elsewhere in the pool shouldn't dilute it into
// false ambiguity (a long name sharing a common word with several others,
// "Pacific Avenue" next to "Atlantic Avenue" and "Baltic Avenue", has
// exactly this shape). Near-miss ties only get to compete with each other
// when nothing in the pool clears the bar cleanly.
function fuzzyMatches(key,pool){
  if(key.length<MIN_FUZZY||STOPWORDS.has(key))return[];
  const scored=pool.map(a=>({a,s:Math.min(matchScore(key,a.n),
    ...(a.alias||[]).map(al=>matchScore(key,al)))})).filter(({s})=>s<=CONFIRM_THRESHOLD);
  if(!scored.length)return[];
  const best=Math.min(...scored.map(x=>x.s));
  return(best===0?scored.filter(x=>x.s===0):scored).map(x=>x.a);
}

/* ---------- seeded daily randomness ---------- */
