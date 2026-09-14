function seedFrom(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// The one place that constructs a date. The puzzle day rolls over at
// midnight US Eastern, not UTC — Intl's timezone database handles the
// DST transition correctly, so there's no hand-rolled offset math to get
// wrong twice a year. Everything that needs "today" reads DAY below;
// nothing else should call `new Date()`.
function puzzleDay(){
  const override=new URLSearchParams(location.search).get("day");
  if(override&&/^\d{4}-\d{2}-\d{2}$/.test(override))return override;
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",
    year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const get=t=>parts.find(p=>p.type===t).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
const DAY=puzzleDay();

/* ---------- state ---------- */
