// Public action allowlist only; never import private assessment answers.
export const LOCAL_ELIGIBILITY_KEY='scale-lab-eligibility-v1';
export function createLocalEligibility(allowlist,storage){
 let records=[];
 let storageOK=true;
 try{const saved=JSON.parse(storage.getItem(LOCAL_ELIGIBILITY_KEY)||'[]');if(Array.isArray(saved)) records=saved.filter(r=>Array.isArray(r)&&r.length===3&&allowlist[r[0]]?.[r[1]]?.includes(r[2]));}catch{storageOK=false;}
 return {
  get storageOK(){return storageOK;},
  criteria(lesson){const actions=records.filter(r=>r[0]===lesson);return {simulation:actions.some(r=>r[1]!=='check-your-thinking'),thinking:actions.some(r=>r[1]==='check-your-thinking'&&['quiz-answer-a','quiz-answer-b'].includes(r[2]))};},
  record(lesson,action,simulation=lesson){
   if(!allowlist[lesson]?.[simulation]?.includes(action))return;
   if(!records.some(r=>r[0]===lesson&&r[1]===simulation&&r[2]===action))records.push([lesson,simulation,action]);
   try{storage.setItem(LOCAL_ELIGIBILITY_KEY,JSON.stringify(records));}catch{storageOK=false;}
  }
 };
}
