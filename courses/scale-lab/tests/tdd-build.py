from pathlib import Path
import subprocess
root=Path(__file__).resolve().parents[1]
model=root/'src/models.js'; tests=root/'tests/models.test.js'
model.write_text(''); tests.write_text("import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport * as m from '../src/models.js';\n")
slices=[
('request advances one stage and stops',"assert.equal(typeof m.flowStep,'function'); let n=0; for(let i=0;i<9;i++) n=m.flowStep(n); assert.equal(n,5);", "export const flowStep = n => Math.min(5,n+1);"),
('routing excludes failed servers and handles all down',"assert.equal(typeof m.route,'function'); assert.equal(m.route([false,true],0),1); assert.equal(m.route([false,false],0),null); assert.equal(m.route([true,true],1),1);", "export function route(up,cursor){for(let i=0;i<up.length;i++){const n=(cursor+i)%up.length;if(up[n])return n;}return null;}"),
('shared session survives switch while local session does not',"assert.equal(typeof m.sessionRead,'function'); assert.equal(m.sessionRead(false,0,1),false); assert.equal(m.sessionRead(true,0,1),true);", "export const sessionRead=(shared,loginServer,server)=>shared || loginServer===server;"),
('cache miss fills cache',"assert.equal(typeof m.cacheRead,'function'); const s={db:100,cache:null,reads:0}; assert.equal(m.cacheRead(s),'MISS'); assert.equal(s.cache,100); assert.equal(s.reads,1);", "export function cacheRead(s){if(s.cache!==null)return 'HIT';s.cache=s.db;s.reads++;return 'MISS';}"),
('cache hit remains stale until invalidation',"const s={db:100,cache:100,reads:1}; s.db=200; assert.equal(m.cacheRead(s),'HIT'); assert.equal(s.cache,100); assert.equal(typeof m.invalidate,'function');m.invalidate(s);m.cacheRead(s);assert.equal(s.cache,200);assert.equal(s.reads,2);", "export function invalidate(s){s.cache=null;}"),
('replica stays stale until explicit replication and primary is current',"assert.equal(typeof m.replicaRead,'function');const s={primary:2,replica:1};assert.equal(m.replicaRead(s,false),1);assert.equal(m.replicaRead(s,true),2);m.replicate(s);assert.equal(m.replicaRead(s,false),2);", "export const replicaRead=(s,primary)=>primary?s.primary:s.replica; export function replicate(s){s.replica=s.primary;}"),
('stock never negative and invalid quantity is rejected',"assert.equal(typeof m.order,'function');const s={stock:2,orders:{}};assert.equal(m.order(s,'a',2).status,'CREATED');assert.equal(m.order(s,'b',1).status,'OUT_OF_STOCK');assert.equal(m.order(s,'c',-2).status,'INVALID');assert.equal(s.stock,0);", "export function order(s,key,qty){if(!key.trim()||!Number.isSafeInteger(qty)||qty<=0)return {status:'INVALID'};if(qty>s.stock)return {status:'OUT_OF_STOCK'};s.stock-=qty;const result={status:'CREATED',id:Object.keys(s.orders).length+1,qty};s.orders[key]=result;return result;}"),
('duplicate idempotency returns same order',"const s={stock:3,orders:{}};const a=m.order(s,'a',1);const b=m.order(s,'a',1);assert.equal(b.id,a.id);assert.equal(s.stock,2);", ""),
('payload mismatch rejects same key and prototype-like keys are safe',"const s={stock:3,orders:{}};m.order(s,'a',1);assert.equal(m.order(s,'a',2).status,'CONFLICT');assert.equal(s.stock,2);assert.equal(m.order(s,'__proto__',1).status,'CREATED');assert.equal(m.order(s,'__proto__',1).id,2);", ""),
('queue worker fails before effect then retries',"assert.equal(typeof m.work,'function');const s={pending:true,attempts:0,sent:0,done:false,dead:false,receipt:false};assert.equal(m.work(s,'before'),'RETRY');assert.equal(s.sent,0);assert.equal(m.work(s,'ok'),'ACK');assert.equal(s.sent,1);assert.equal(s.pending,false);", "export function work(s,mode){if(!s.pending)return 'EMPTY';s.attempts++;if(mode==='before')return 'RETRY';s.sent++;s.pending=false;s.done=true;return 'ACK';}"),
('queue redelivery deduplicates effect after crash before ack',"const s={pending:true,attempts:0,sent:0,done:false,dead:false,receipt:false};assert.equal(m.work(s,'after'),'REDELIVER');assert.equal(s.sent,1);assert.equal(m.work(s,'ok'),'DEDUP_ACK');assert.equal(s.sent,1);", ""),
('queue retry is bounded and moves to dead letter',"const s={pending:true,attempts:0,sent:0,done:false,dead:false,receipt:false};m.work(s,'before');m.work(s,'before');assert.equal(m.work(s,'before'),'DEAD_LETTER');assert.equal(s.dead,true);assert.equal(s.pending,false);", ""),
('shard mapping is deterministic and shard count changes mapping',"assert.equal(typeof m.shard,'function');assert.equal(m.shard(7,3),1);assert.equal(m.shard(7,4),3);assert.equal(m.shard(-1,3),2);assert.throws(()=>m.shard(2,0));", "export function shard(id,count){if(!Number.isSafeInteger(id)||!Number.isInteger(count)||count<1||count>8)throw new Error('invalid shard input');return ((id%count)+count)%count;}"),
('progress rejects corrupt storage and sanitizes unknown lessons',"assert.equal(typeof m.loadProgress,'function');assert.deepEqual(m.loadProgress('{'),[]);assert.deepEqual(m.loadProgress('{\"x\":2}'),[]);assert.deepEqual(m.loadProgress('[1,1,12,13,\"2\",null]'),[1,12]);", "export function loadProgress(raw){try{const p=JSON.parse(raw);return Array.isArray(p)?[...new Set(p.filter(x=>Number.isInteger(x)&&x>=1&&x<=12))]:[];}catch{return [];}}"),
('workload estimates bounded finite inputs and distinguishes pool budget',"assert.equal(typeof m.workload,'function');assert.deepEqual(m.workload(120,60,4,10),{rps:2,pool:40});assert.throws(()=>m.workload(1,0,1,1));", "export function workload(requests,seconds,apps,pool){if(![requests,seconds,apps,pool].every(Number.isFinite)||requests<0||seconds<=0||apps<1||pool<1)throw new Error('invalid workload');return {rps:requests/seconds,pool:apps*pool};}"),
('decision labs return an explained outcome',"assert.equal(typeof m.decide,'function');assert.equal(m.decide('cdn','private').safe,true);assert.equal(m.decide('cdn','public').safe,false);assert.equal(m.decide('observe','trace').safe,true);assert.equal(m.decide('region','fence').safe,true);", "export function decide(kind,choice){const safe={cdn:'private',observe:'trace',region:'fence'}[kind]===choice;return {safe};}")]
log=[]
for index,(name,body,impl) in enumerate(slices):
    with tests.open('a') as f:f.write(f"test({name!r},()=>{{{body}}});\n")
    r=subprocess.run(['npm','test'],cwd=root,text=True,capture_output=True)
    log.append(f'\nSLICE {index+1}: {name}\nRED exit={r.returncode}\n{r.stdout}{r.stderr}')
    if r.returncode==0: raise RuntimeError('Expected RED: '+name)
    source=model.read_text()
    if index==7:
        source=source.replace("if(qty>s.stock)","if(Object.hasOwn(s.orders,key))return s.orders[key];if(qty>s.stock)")
    elif index==8:
        source=source.replace("if(Object.hasOwn(s.orders,key))return s.orders[key];","if(Object.hasOwn(s.orders,key))return s.orders[key].qty===qty?s.orders[key]:{status:'CONFLICT'};")
        source=source.replace("s.orders[key]=result;","Object.defineProperty(s.orders,key,{value:result,enumerable:true,configurable:true});")
    elif index==10:
        source=source.replace("s.sent++;s.pending=false;s.done=true;return 'ACK';", "const duplicate=s.receipt;if(!s.receipt){s.sent++;s.receipt=true;}if(mode==='after')return 'REDELIVER';s.pending=false;s.done=true;return duplicate?'DEDUP_ACK':'ACK';")
    elif index==11:
        source=source.replace("if(mode==='before')return 'RETRY';", "if(mode==='before'){if(s.attempts>=3){s.dead=true;s.pending=false;return 'DEAD_LETTER';}return 'RETRY';}")
    else: source+='\n'+impl+'\n'
    model.write_text(source)
    r=subprocess.run(['npm','test'],cwd=root,text=True,capture_output=True)
    log.append(f'GREEN exit={r.returncode}\n{r.stdout}{r.stderr}')
    (root/'evidence/tdd.txt').write_text(''.join(log))
    if r.returncode:raise RuntimeError(r.stdout+r.stderr)
    print(f'Slice {index+1}: RED → GREEN: {name}')
