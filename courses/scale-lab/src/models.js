
export const FLOW_STEPS = 6;
export const flowStep = n => Math.min(FLOW_STEPS,n+1);

export function route(up,cursor){for(let i=0;i<up.length;i++){const n=(cursor+i)%up.length;if(up[n])return n;}return null;}

export const sessionRead=(shared,loginServer,server)=>shared || loginServer===server;

export function cacheRead(s){if(s.cache!==null)return 'HIT';s.cache=s.db;s.reads++;return 'MISS';}

export function invalidate(s){s.cache=null;}

export const replicaRead=(s,primary)=>primary?s.primary:s.replica; export function replicate(s){s.replica=s.primary;}

export function order(s,key,qty){if(!key.trim()||!Number.isSafeInteger(qty)||qty<=0)return {status:'INVALID'};if(Object.hasOwn(s.orders,key))return s.orders[key].qty===qty?s.orders[key]:{status:'CONFLICT'};if(qty>s.stock)return {status:'OUT_OF_STOCK'};s.stock-=qty;const result={status:'CREATED',id:Object.keys(s.orders).length+1,qty};Object.defineProperty(s.orders,key,{value:result,enumerable:true,configurable:true});return result;}

export function work(s,mode){if(!s.pending)return 'EMPTY';s.attempts++;if(mode==='before'){if(s.attempts>=3){s.dead=true;s.pending=false;return 'DEAD_LETTER';}return 'RETRY';}const duplicate=s.receipt;if(!s.receipt){s.sent++;s.receipt=true;}if(mode==='after')return 'REDELIVER';s.pending=false;s.done=true;return duplicate?'DEDUP_ACK':'ACK';}

export function shard(id,count){if(!Number.isSafeInteger(id)||!Number.isInteger(count)||count<1||count>8)throw new Error('invalid shard input');return ((id%count)+count)%count;}

export function loadProgress(raw){try{const p=JSON.parse(raw);return Array.isArray(p)?[...new Set(p.filter(x=>Number.isInteger(x)&&x>=1&&x<=12))]:[];}catch{return [];}}

export function workload(requests,seconds,apps,pool){if(![requests,seconds,apps,pool].every(Number.isFinite)||requests<0||seconds<=0||apps<1||pool<1)throw new Error('invalid workload');return {rps:requests/seconds,pool:apps*pool};}

export function decide(kind,choice){const safe={cdn:'private',observe:'trace',region:'fence'}[kind]===choice;return {safe};}
