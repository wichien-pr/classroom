// Synthetic capacity units: no benchmark or real database/migration.
export const dataTierInitial=()=>({mode:'vertical',power:1,shards:4,key:'user',traffic:'uniform',user:7,up:true});
export function evaluateDataTier(c){
 if(!Number.isInteger(c.power)||c.power<1||c.power>4)throw Error('กำลังต่อเครื่องต้องเป็น 1–4');
 if(!['vertical','horizontal'].includes(c.mode)||![2,4,8].includes(c.shards)||!['user','country'].includes(c.key)||!['uniform','hotspot'].includes(c.traffic)||typeof c.up!=='boolean')throw Error('ตั้งค่าการทดลองไม่ถูกต้อง');
 if(!Number.isSafeInteger(c.user)||c.user<0||c.user>1000000)throw Error('user_id ต้องเป็นจำนวนเต็ม 0–1000000');
 const capacity=8*c.power,count=c.mode==='vertical'?1:c.shards;
 const route=id=>c.mode==='vertical'?0:(c.key==='country'?0:id%c.shards);
 const rows=Array.from({length:count},()=>[]),loads=Array(count).fill(0);
 for(let id=0;id<16;id++)rows[route(id)].push(id);
 const requests=c.traffic==='uniform'?Array.from({length:16},(_,i)=>i):[...Array(13).fill(4),0,1,2];
 for(const id of requests)loads[route(id)]++;
 const moves=c.mode==='horizontal'?Array.from({length:16},(_,id)=>({id,from:id%4,to:route(id)})).filter(x=>x.from!==x.to):[];
 return {moves,capacity,total:requests.length,rows,loads,target:route(c.user),status:!c.up?'unavailable':loads.some(n=>n>capacity)?'overloaded':'ready'};
}
