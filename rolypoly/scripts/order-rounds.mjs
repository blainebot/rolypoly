// Orders one game's rounds by difficulty, easiest to hardest, so the day
// builds instead of running in arbitrary filename order. Shared between
// build.mjs (what actually ships) and validate.mjs (what to warn about) so
// the two can't drift apart on what "the opening round" ends up being.
//
// Two rules beyond a plain sort:
// - Filename order (the array's own input order) is the tiebreak for equal
//   difficulty, since that's the one arbitrary-but-stable thing content
//   authors already control.
// - No two adjacent rounds share a difficulty if there's any way to avoid
//   it. A plain ascending sort can force this when a difficulty repeats
//   (e.g. {1,2,2,3,4} — the two 2's are adjacent in any non-decreasing
//   order), so this isn't optional post-processing, it's the actual rule:
//   pull the next differently-valued round forward to break the run,
//   accepting a small, local deviation from strict ascending order rather
//   than ship two same-difficulty rounds back to back.
export function orderRounds(rounds) {
  const sorted = rounds
    .map((r, i) => ({ r, i }))
    .sort((a, b) => (a.r.difficulty - b.r.difficulty) || (a.i - b.i))
    .map(x => x.r);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].difficulty === sorted[i - 1].difficulty) {
      let j = i + 1;
      while (j < sorted.length && sorted[j].difficulty === sorted[i].difficulty) j++;
      // If nothing but the same difficulty follows, the run can't be
      // broken without moving something earlier out of ascending order
      // even further — leave it; the adjacency is genuinely unavoidable.
      if (j < sorted.length) {
        const [moved] = sorted.splice(j, 1);
        sorted.splice(i, 0, moved);
      }
    }
  }
  return sorted;
}
