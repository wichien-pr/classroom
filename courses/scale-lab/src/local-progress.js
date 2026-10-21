// Frozen pre-LAB05-swap order. Never interpret legacy numbers using display order.
const legacy=['flow','workload','stock','balance','session','replica','cache','cdn','queue','observe','region','shard'];
const known=[...legacy,'stateless-web'];
export const LOCAL_PROGRESS_KEY='scale-lab-progress-v2';
export function readLocalProgress(current,old){
 try {
  if(current!==null){const p=JSON.parse(current);return p?.version===2&&Array.isArray(p.completed)?[...new Set(p.completed.filter(x=>known.includes(x)))]:[];}
  const p=JSON.parse(old);return Array.isArray(p)?[...new Set(p.filter(x=>Number.isInteger(x)&&x>=1&&x<=legacy.length).map(x=>legacy[x-1]))]:[];
 }catch{return [];}
}
// Retired IDs remain historical; callers intersect with current lessons for display.
export const mergeLocalProgress=(previous,current)=>[...new Set([...previous,...current].filter(id=>known.includes(id)))];
export const encodeLocalProgress=completed=>JSON.stringify({version:2,completed});
