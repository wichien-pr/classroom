import './style.css';
import './cache.css';
import {cacheInitial,cacheAction} from './cache.js';
import {cacheControls,cacheDiagram,cacheNotes} from './cache-view.js';
import {LOCAL_PROGRESS_KEY,readLocalProgress,encodeLocalProgress,mergeLocalProgress} from './local-progress.js';
import './single-server.css';
import './database.css';
import './scaling.css';
import './balance.css';
import './replication.css';
import {replicationInitial,replicationAction,dbName} from './replication.js';
import {replicationControls,replicationDiagram,replicationNotes} from './replication-view.js';
import {balanceInitial,balanceControls,balanceDiagram,balanceNotes,routeBalance} from './balance.js';
import {scalingInitial,scalingControls,scalingDiagram,scalingNotes,evaluateScaling} from './scaling.js';
import {databaseInitial,databaseControls,databaseDiagram,databaseNotes,evaluateDatabase} from './database.js';
import {createParticipation} from './participation.js';
const participation = import.meta.env.VITE_CLASSROOM_PROGRESS_URL
  ? createParticipation(import.meta.env.VITE_CLASSROOM_PROGRESS_URL.replace(/\/progress$/, '/participation')) : null;
import {createAccountProgress} from './progress.js';
import {classroomLink} from './integration.js';
import './terms.css';
import {installTermHints} from './terms.js';
installTermHints(document.querySelector('#app'));
import * as m from './models.js';
import {flowView,singleServerDiagram} from './single-server.js';
import {lessons} from './lessons.js';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const account = import.meta.env.VITE_CLASSROOM_PROGRESS_URL
  ? createAccountProgress(import.meta.env.VITE_CLASSROOM_PROGRESS_URL) : null;
let localHistory=[],progress=[],storageOK=true,pendingLesson=null;
const failedLessons=new Set();
const quizSelections=new Map(); // Per-lesson choices survive simulation reset/navigation, not reload.
// Shuffle presentation once per lesson/page, before first paint. Original indices
// remain semantic choice IDs for correctness, selection and durable award actions.
const quizOrder=new Map(lessons.map(l=>[l.kind,Math.random()<0.5?[1,0]:[0,1]]));
if (!account) { try{const ids=readLocalProgress(localStorage.getItem(LOCAL_PROGRESS_KEY),localStorage.getItem('scale-lab-progress'));localHistory=ids;progress=lessons.filter(l=>ids.includes(l.kind)).map(l=>l.id);localStorage.setItem(LOCAL_PROGRESS_KEY,encodeLocalProgress(ids));}catch{storageOK=false;} }
let selected=1,state,events=[],feedback='',message='พร้อมทดลอง — เปลี่ยนตัวแปร แล้วเดินระบบทีละขั้น';
function initial(){return {cacheLab:cacheInitial(),replication:replicationInitial(),balance:balanceInitial(),scaling:scalingInitial(),database:databaseInitial(),step:0,client:'browser',up:[true,true],cursor:0,shared:false,logged:false,db:100,cache:null,reads:0,primary:0,replica:0,stock:5,orders:{},pending:true,attempts:0,sent:0,done:false,dead:false,receipt:false,active:selected===1?0:-1};}
const button=(id,text)=>`<button type="button" id="${id}" data-action="${id}">${text}</button>`;
const number=(id,label,value,min=0,max=1000000)=>`<label>${label}<input id="${id}" type="number" value="${value}" min="${min}" max="${max}" step="1"></label>`;
function controls(kind){switch(kind){
case 'flow':return '<label>แหล่งคำขอ (เปลี่ยนแล้วเริ่มใหม่ ไม่เพิ่มคะแนน)<select id="flow-client"><option value="browser">Browser · HTML ตัวอย่าง</option><option value="mobile">Mobile app · JSON ตัวอย่าง</option></select></label>'+button('step','เดิน request 1 ขั้น');
case 'workload':return databaseControls();
case 'stock':return scalingControls();
case 'balance':return balanceControls();
case 'replica':return replicationControls();
case 'cache':return cacheControls();
case 'queue':return '<label>จุดที่ worker ล้มเหลว<select id="failure"><option value="after">หลัง side effect ก่อน ACK</option><option value="before">ก่อน side effect</option><option value="ok">ทำงานสำเร็จ</option></select></label>'+button('work','เดิน worker / retry 1 ครั้ง');
case 'shard':return number('customer','Customer ID',7,0)+number('shards','จำนวน shards',3,1,8)+button('shard','Route key');
case 'cdn':return '<label>Policy ของหน้า account<select id="choice"><option value="public">public cache ร่วมกัน</option><option value="private">private / no-store ตามความอ่อนไหว</option></select></label>'+button('decision','ทดลองการตัดสินใจ');
case 'observe':return '<label>CPU ปกติ แต่ checkout ช้า<select id="choice"><option value="cpu">เพิ่ม CPU ทันที</option><option value="trace">ดู trace, pool wait และ lock wait</option></select></label>'+button('decision','ทดลองการตัดสินใจ');
case 'region':return '<label>Region หลักติดต่อไม่ได้<select id="choice"><option value="dns">สลับ DNS แล้วเปิด writer ทันที</option><option value="fence">Fence writer เดิม ตรวจ lag แล้ว promote</option></select></label>'+button('decision','ทดลองการตัดสินใจ');
}}
function mount(){
const l=lessons[selected-1];
feedback=quizSelections.has(l.kind) ? (quizSelections.get(l.kind)===1?'ถูกต้อง — ':'ยังไม่ถูก — ')+l.why : '';
$('#app').innerHTML=`${classroomLink(import.meta.env.VITE_CLASSROOM_URL)}<a class="skip" href="#main">ข้ามไปห้องทดลอง</a><div class="layout"><aside class="sidebar"><div class="brand"><span class="brand-mark">S<span>↗</span></span><div>Scale Lab<small>SYSTEM DESIGN / TH</small></div></div><div class="course-label">ORDER SYSTEM · ${lessons.length} LABS</div><nav aria-label="บทเรียน">${lessons.map(x=>`<button data-lesson="${x.id}" aria-current="${x.id===selected?'page':'false'}"><span class="nav-num">${String(x.id).padStart(2,'0')}</span><span>${x.title}</span><span class="done">${progress.includes(x.id)?'✓':''}</span></button>`).join('')}</nav><div class="sidebar-bottom"><p id="progress-status" role="status"></p><button id="retry-progress" hidden>ลองโหลดอีกครั้ง</button><span id="progress">${progress.length} / ${lessons.length} บทเรียนจบ</span><progress max="${lessons.length}" value="${progress.length}" aria-label="ความคืบหน้าบทเรียน"></progress></div></aside><div class="workspace"><div class="simulation"><span class="dot"></span><strong>EDUCATIONAL SIMULATION</strong><span>โครงสร้างและค่าทั้งหมดเป็นแบบจำลองเพื่อการเรียนรู้ ไม่ใช่ benchmark จริง</span></div><header class="topbar"><span>ห้องทดลอง / ระบบสั่งซื้อสินค้า</span><span class="source-ref">คู่มือต้นฉบับ §${l.chapter}</span></header><main id="main"><div class="lesson-heading"><div><p class="eyebrow">LAB ${String(l.id).padStart(2,'0')} / ${l.en}</p><h1>${l.title}</h1><p class="objective">${l.objective}</p></div><span class="manual-tag">MANUAL STEP</span></div><section class="participation" aria-label="Participation Score"><strong>Participation Score · <span id="participation-score">—</span></strong><p id="participation-status" role="status"></p><button id="retry-participation" hidden>ลองบันทึกคะแนนอีกครั้ง</button><small>ทดลองหรือกดตอบ quiz แต่ละปุ่มครั้งแรกได้ 1 คะแนนต่อบัญชี ไม่ว่าถูกหรือผิด · นับตามตัวเลือกเดิม ไม่ใช่ตำแหน่ง A/B · สุ่มลำดับเมื่อเปิดหน้าใหม่ · กดซ้ำ โหลดใหม่ หรือเข้าสู่ระบบใหม่ไม่เพิ่มคะแนน · ระหว่างบันทึกปุ่มจะปิดชั่วคราว รอให้พร้อมก่อนกดครั้งถัดไป · คะแนนไม่ใช่ Level · ในบัญชีต้องครบ 3 เงื่อนไขทุกบท: กดเรียนจบ + ทดลองหลัก + ตอบ A หรือ B จึงนับคลาสสำหรับ Level · ไม่รวมเปิดหน้า/เปลี่ยนบท/รีเซ็ต</small></section><section class="lesson-completion" aria-label="สถานะการเรียนบทนี้"><button type="button" id="complete-lesson" aria-describedby="completion-status">ทำเครื่องหมายว่าเรียนจบ</button><p id="completion-status" role="status"></p><button type="button" id="retry-completion-load" hidden>ลองโหลดอีกครั้ง</button></section><div class="learning-grid"><section class="lab" aria-label="ห้องทดลองแบบจำลอง"><div class="panel-title"><h2>ทดลองกับระบบ</h2><button id="reset">เริ่มการทดลองใหม่</button></div><div class="architecture" id="architecture" aria-label="แผนภาพสถาปัตยกรรม"></div><div class="state-grid" id="state-view" aria-label="สถานะแบบจำลอง"></div><div class="control-area"><h3>01 / ตั้งสถานการณ์และลงมือ</h3><div class="controls">${controls(l.kind)}</div></div><div class="observation"><h3>02 / สิ่งที่เกิดขึ้น</h3><p id="outcome" role="status" aria-live="polite"></p></div><div class="event-area"><div class="event-heading"><h3>บันทึกเหตุการณ์</h3><span>เรียงตามขั้น · ไม่ใช่เวลาจริง</span></div><ol id="event-log"></ol></div></section><aside class="teaching" aria-label="คำอธิบายประกอบ"><section><p class="eyebrow">WHY IT WORKS</p><h2>เข้าใจเหตุผล ก่อนเพิ่มเครื่องมือ</h2><p>${l.explain}</p><div class="experiment"><strong>ลองตามนี้</strong><p>${l.try}</p></div></section><section class="quiz"><p class="eyebrow">CHECK YOUR THINKING</p><h2>${l.question}</h2><div class="answers">${quizOrder.get(l.kind).map((choice,i)=>`<button data-answer="${choice}"><span>${i===0?'A':'B'}</span>${l.answers[choice]}</button>`).join('')}</div><p id="feedback" role="status">${feedback||'เลือกคำตอบเพื่อดูเหตุผล — ตอบใหม่ได้เสมอ'}</p></section></aside></div><footer><span>${storageOK?'บันทึกเฉพาะความคืบหน้าใน browser นี้':'บันทึกไม่ได้ — ใช้งานต่อได้ แต่ความคืบหน้าอยู่ในหน่วยความจำ'}</span><button id="next">${selected===12?'กลับบทแรก':'บทถัดไป →'}</button></footer></main></div></div><dialog id="help-dialog"><div class="dialog-header"><h2 id="dialog-title"></h2><button id="close-dialog" autofocus>ปิด</button></div><div id="dialog-content"></div></dialog>`;
 if(l.kind==='cache'){
  document.querySelector('.teaching section').insertAdjacentHTML('afterend',cacheNotes());
  document.querySelector('.source-ref').textContent='Cache · สำเนาชั่วคราว';
  for(const action of ['tick','outage','restart'])$('#cache-'+action).onclick=()=>act(action);
 }
 if(l.kind==='replica'){
  document.querySelector('.teaching section').insertAdjacentHTML('afterend',replicationNotes());
  document.querySelector('.source-ref').textContent='Database replication';
  [0,1,2].forEach(i=>$('#db-up-'+i).onchange=e=>{state.replication.up[i]=e.target.checked;renderState();});
  $('#fenced').onchange=e=>{state.replication.fenced=e.target.checked;};
  $('#accept-loss').onchange=e=>{state.replication.acceptLoss=e.target.checked;};
  $('#promote').onclick=()=>act('promote');
 }
 if(l.kind==='balance'){document.querySelector('.teaching section').insertAdjacentHTML('afterend',balanceNotes());document.querySelector('.source-ref').textContent='Load-balancer · หน้า 1–2';}
 if(l.kind==='stock'){document.querySelector('.teaching section').insertAdjacentHTML('afterend',scalingNotes());document.querySelector('.source-ref').textContent='Scale up / Scale out';}
 if(l.kind==='workload') {
  document.querySelector('.teaching section').insertAdjacentHTML('afterend',databaseNotes());
  document.querySelector('.source-ref').textContent='แยกชั้น · เลือกฐานข้อมูล';
  $('#db-layout').onchange=()=>{$('#data-size').disabled=$('#db-layout').value==='single';};
 }
 document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>navigate(Number(b.dataset.lesson)));
 document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>act(b.dataset.action));
 document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>answer(Number(b.dataset.answer)));
 $('#reset').onclick=()=>{state=initial();events=[];message='พร้อมทดลอง — เริ่มสถานะใหม่แล้ว';mount();$('#reset').focus();};
 $('#next').onclick=()=>navigate(selected===lessons.length?1:selected+1);
 $('#close-dialog').onclick=()=>$('#help-dialog').close();
 if(l.kind==='flow'){$('#flow-client').value=state.client;$('#flow-client').onchange=e=>{state.client=e.target.value;state.step=0;events=[];message=flowView(0,state.client).message;renderState();};}
 renderState();
 renderProgress();
 renderParticipation();
 $('#retry-participation').onclick=()=>participationOperation(participation.status==='load-error' ? 'load' : 'retry');
 $('#retry-progress').onclick=loadAccount;
 $('#retry-completion-load').onclick=loadAccount;
 $('#complete-lesson').onclick=()=>completeLesson(lessons[selected-1]);
}
function navigate(id){selected=id;state=initial();events=[];feedback='';message='พร้อมทดลอง — เปลี่ยนตัวแปร แล้วเดินระบบทีละขั้น';mount();$('#main').setAttribute('tabindex','-1');$('#main').focus({preventScroll:true});}
function renderState(){const l=lessons[selected-1];$('#architecture').innerHTML=l.kind==='cache'?cacheDiagram(state.cacheLab):l.kind==='replica'?replicationDiagram(state.replication):l.kind==='balance'?balanceDiagram(state.balance):l.kind==='stock'?scalingDiagram(state.scaling):l.kind==='workload'?databaseDiagram(state.database):l.kind==='flow'?singleServerDiagram(state.step,state.client):l.nodes.map((n,i)=>`<div class="node ${state.active===i?'active':''}"><span>${String(i+1).padStart(2,'0')}</span><strong>${n}</strong>${state.active===i?'<small>ขั้นล่าสุด</small>':''}</div>${i<l.nodes.length-1?'<span class="arrow" aria-hidden="true">→</span>':''}`).join('');
let entries=[];
switch(l.kind){case 'flow':{const v=flowView(state.step,state.client);entries=[['ขั้นที่เดินแล้ว',`${state.step} / ${m.FLOW_STEPS}`],['Domain',v.domain],['IP ที่ client ได้รับ',v.ip],['HTTP request',v.request],['HTTP response',v.response]];break;}
case 'workload':{const r=evaluateDatabase(state.database);entries=[['ทรัพยากร Web',`Web tier: ${r.web}`],['ทรัพยากร DB',`Data tier: ${r.data}`],['การขยาย',r.independent?'แยกอิสระ':'ทรัพยากรร่วม'],['Database',r.ready?'พร้อม':'ไม่พร้อม']];break;}
case 'cache':{const s=state.cacheLab;entries=[['DB / source of truth',s.db],['Cache / สำเนา',s.cache??'ว่าง'],['DB reads',s.reads],['Hits / Misses',`${s.hits} / ${s.misses}`],['เวลาจำลอง / TTL',`${s.now} / ${s.ttl}`],['Cache server',s.up?'พร้อม':'ล่ม · fallback ไป DB']];break;}
case 'stock':{const r=evaluateScaling(state.scaling);entries=[['จำนวนเครื่อง',state.scaling.servers],['กำลังต่อเครื่อง',`${state.scaling.power} หน่วย`],['เครื่องที่รับ traffic',r.routed],['กำลังที่เข้าถึงได้',`${r.capacity} หน่วย`]];break;}
case 'replica':entries=[['Writer ปัจจุบัน',dbName(state.replication.writer)],...state.replication.versions.map((v,i)=>[dbName(i),`version ${v}`]),['ขั้นเขียนที่สูญเสียตอน promote',state.replication.lost]];$('#db-up-0').disabled=state.replication.writer!==0;break;
case 'queue':entries=[['Attempts',state.attempts],['Side effects',state.sent],['Job',state.dead?'DEAD LETTER':state.pending?'PENDING':'ACKED']];break;
case 'balance':entries=state.balance.counts.map((n,i)=>['App '+ 'ABC'[i],`รับแล้ว ${n} request`]);break;
default:entries=[['โหมด','กำหนดทีละขั้น'],['ข้อมูล','สมมติฐานของผู้เรียน']];}
$('#state-view').innerHTML=entries.map(([k,v])=>`<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('');$('#outcome').textContent=l.kind==='flow'&&state.step===0?flowView(0,state.client).message:message;if(l.kind==='flow'){$('#state-view').insertAdjacentHTML('beforeend',`<pre id="flow-payload" aria-label="ตัวอย่าง response">${esc(state.step<5?'ยังไม่ได้รับ response':state.client==='mobile'?'{"id": 12, "firstName": "John", "lastName": "Smith"}':'<h1>John Smith</h1>')}</pre>`);}$('#event-log').innerHTML=events.length?events.map((e,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span>${esc(e)}</li>`).join(''):'<li><span>—</span>พร้อมทดลอง ยังไม่มีเหตุการณ์</li>';
}
function val(id){const el=$('#'+id);if(!el.checkValidity()||el.value.trim()==='')throw new Error('กรุณากรอกตัวเลขในช่วงที่กำหนด');return Number(el.value);}
function act(action){if(participation && participation.status!=='saved') return;
const lesson=lessons[selected-1].kind;
let meaningful=!(action==='step' && state.step>=m.FLOW_STEPS) && !(action==='work' && !state.pending);
if(action==='step' && !meaningful)return;
try{switch(action){
case 'step':state.step=m.flowStep(state.step);message=flowView(state.step,state.client).message;break;
case 'estimate':{
 const config={layout:$('#db-layout').value,web:val('web-size'),data:val('data-size'),available:$('#db-available').checked,scenario:$('#db-scenario').value,engine:$('#db-engine').value};
 const r=evaluateDatabase(config);state.database=config;
 message=`${r.ready?'Database พร้อมรับงาน':'อ่านข้อมูลไม่ได้: Database ไม่พร้อม แม้ Web tier ยังทำงาน'} · ${r.independent?'ปรับ Web / Data แยกกันได้':'เครื่องเดียว: ปรับทรัพยากรร่วมกัน'} · ${r.fit?'เหมาะเป็นจุดเริ่มต้น':'ทบทวนตัวเลือก ไม่ใช่ว่าทำไม่ได้'}: ${r.reason} ข้อควรระวัง: ${r.caveat}`;
 break;}
case 'order':{const config={power:val('scale-power'),servers:val('scale-servers'),traffic:val('scale-traffic'),balanced:$('#scale-balanced').checked,down:$('#scale-down').checked};const r=evaluateScaling(config);state.scaling=config;message=`${{offline:'เข้าใช้งานไม่ได้: ไม่มีเครื่องที่พร้อมบนเส้นทางนี้',overloaded:'โหลดเกินกำลังที่เข้าถึงได้: อาจตอบช้าหรือเชื่อมต่อไม่สำเร็จ',ready:'รับโหลดได้ตามสมมติฐานนี้ ไม่ใช่ผล benchmark'}[r.status]} · โหลด ${config.traffic} / กำลัง ${r.capacity} หน่วย · ${config.balanced?'LB ส่งเฉพาะเครื่องที่พร้อม (สมมติรู้ health แล้ว)':'ต่อเครื่อง 1 โดยตรง เครื่องอื่นไม่รับ traffic'}${config.power===4?' · ถึงเพดานกำลังในแบบจำลองแล้ว':''}`;break;}
case 'route':{const n=routeBalance(state.balance,[$('#up-a').checked,$('#up-b').checked,$('#up-c').checked]);message=n===null?'503 · ไม่มี backend พร้อมรับงาน — ห้าม route ไปเครื่องที่ล้ม':`200 · ส่ง request ไป App ${'ABC'[n]} ตาม round-robin เฉพาะเครื่องพร้อม`;break;}
case 'write':case 'read-primary':case 'read-replica':case 'sync':case 'promote':{const result=replicationAction(state.replication,action);message=result.message;meaningful=result.meaningful;break;}
case 'read-cache':case 'update':case 'invalidate':case 'tick':case 'outage':case 'restart':{const result=cacheAction(state.cacheLab,action,action==='update'?val('price'):undefined);message=result.message;meaningful=result.meaningful;break;}
case 'work':{const result=m.work(state,$('#failure').value);state.active=2;message=`${result} · attempts ${state.attempts} · side effects ${state.sent} — ${result==='REDELIVER'?'ผลเกิดแล้วแต่ยังไม่ ACK; provider receipt กันซ้ำเมื่อส่งใหม่':result==='RETRY'?'ยังไม่มีผลข้างเคียง กดขั้นถัดไปแทนเวลารอ backoff':result==='DEAD_LETTER'?'ครบ 3 ครั้ง ต้องมีผู้รับผิดชอบตรวจงาน':result==='DEDUP_ACK'?'provider รับ key เดิม จึงไม่ส่งซ้ำ':result==='EMPTY'?'ไม่มีงานพร้อมให้ทำ':'งานสำเร็จและ ACK แล้ว'}`;break;}
case 'shard':{const id=val('customer'),n=val('shards');message=`customer ${id} % ${n} → Shard ${m.shard(id,n)} (เริ่มนับ 0) — เปลี่ยนจำนวน shard ไม่ได้ย้ายข้อมูลจริง`;state.active=1;break;}
case 'decision':{const kind=lessons[selected-1].kind,r=m.decide(kind,$('#choice').value);message=(r.safe?'เหมาะกับโจทย์นี้ · ':'เสี่ยง · ')+({cdn:r.safe?'private/no-store ลดการแชร์ response ส่วนบุคคล แต่ต้องตรวจ policy จริง':'public key ที่ไม่แยก user อาจรั่วข้อมูลข้ามบัญชี',observe:r.safe?'trace และ wait metrics ช่วยแยก lock, pool, network ก่อนเลือกแก้':'CPU ปกติ การเพิ่มเครื่องไม่อธิบายเวลารอ lock หรือ downstream',region:r.safe?'fencing ป้องกัน writer เก่า ต้องตรวจ RPO/RTO และ capacity สำรองด้วย':'DNS cache และ writer เก่าอาจยังทำงาน เกิด split brain ได้'}[kind]);state.active=3;break;}
}if(participation && meaningful) participationOperation('record',lesson,action);
events.push(message);if(events.length>30)events.shift();renderState();}catch(e){message=e.message;renderState();}}
function renderParticipation(){
  $('#participation-score').textContent=participation?.score ?? '—';
  $('#participation-status').textContent=participation ? ({loading:'กำลังโหลดคะแนนบัญชี…',saved:participation.reason==='already_counted'?'ปุ่มนี้นับคะแนนแล้ว · กดซ้ำไม่เพิ่มคะแนน':'คะแนนที่บันทึกในบัญชีแล้ว',saving:'กำลังบันทึกคะแนน…','load-error':'โหลดคะแนนไม่ได้ — ลองใหม่ หรือเข้าสู่ระบบอีกครั้ง','save-error':'บันทึกไม่ได้ — ลองอีกครั้งด้วยเหตุการณ์เดิม ก่อนทดลองต่อ'}[participation.status]) : 'Standalone · ไม่บันทึกคะแนนบัญชี ทดลองได้ตามปกติ';
  $('#retry-participation').hidden=!participation || !['load-error','save-error'].includes(participation.status);
  $('#retry-participation').textContent=participation?.status==='load-error'?'ลองโหลดคะแนนอีกครั้ง':'ลองบันทึกคะแนนอีกครั้ง';
  document.querySelectorAll('[data-action]').forEach(b=>b.disabled=!!participation && participation.status!=='saved');
  renderQuizControls();
}
async function participationOperation(operation,...args){
  const pending=participation[operation](...args); renderParticipation();
  await pending; renderParticipation();
  if(account && operation!=='load' && participation.status==='saved') {
    const refresh=account.refresh();
    await Promise.resolve(); renderProgress();
    try { await refresh; } catch { /* Explicit load retry remains available. */ }
    renderProgress();
  }
}
function quizBlocked(){
  return (!!participation && participation.status!=='saved') || (!!account && ['loading','load-error','saving'].includes(account.status));
}
function renderQuizControls(){
  document.querySelectorAll('[data-answer]').forEach(b=>{
    b.disabled=quizBlocked();
    b.setAttribute('aria-pressed',String(quizSelections.get(lessons[selected-1].kind)===Number(b.dataset.answer)));
  });
}
function renderProgress(){
  if(account) progress=lessons.filter(l=>account.completed.includes(l.kind)).map(l=>l.id);
  const total=account && account.status!=='loading' && account.status!=='load-error' ? account.total : lessons.length;
  $('#progress').textContent=`${progress.length} / ${total} บทเรียนจบ`;
  $('progress').max=total; $('progress').value=progress.length;
  document.querySelectorAll('[data-lesson]').forEach(b=>b.querySelector('.done').textContent=progress.includes(Number(b.dataset.lesson))?'✓':'');
  $('#progress-status').textContent=account ? ({loading:'กำลังโหลดความคืบหน้าบัญชี…',saved:'บันทึกความคืบหน้าในบัญชีแล้ว',saving:'กำลังบันทึกในบัญชี…','load-error':'โหลดความคืบหน้าไม่ได้ — ลองใหม่ หรือเข้าสู่ระบบอีกครั้ง','save-error':'บันทึกไม่ได้ — กลับบทที่บันทึกไม่สำเร็จแล้วกดลองบันทึกอีกครั้ง หรือเข้าสู่ระบบอีกครั้ง'}[account.status]) : (storageOK?'ความคืบหน้าเฉพาะเบราว์เซอร์นี้':'บันทึกไม่ได้ — ความคืบหน้าอยู่ในหน่วยความจำ');
  $('#retry-progress').hidden=!account || account.status!=='load-error';
  renderQuizControls();
  const criteria=account?.criteria?.[lessons[selected-1].kind];
  const done=progress.includes(selected);
  const marked=criteria?.manual;
  const missing=criteria ? Object.entries({manual:'กดเรียนจบ',simulation:'ทดลองหลักอย่างน้อย 1 ครั้ง',thinking:'ตอบ Check your thinking A หรือ B อย่างน้อย 1 ครั้ง (ไม่ต้องถูก)'}).filter(([key])=>!criteria[key]).map(([,label])=>label) : [];
  const blocked=!!account && ['loading','load-error','saving'].includes(account.status);
  const failed=failedLessons.has(selected);
  $('#complete-lesson').textContent=marked && !done?'✓ กดเรียนจบแล้ว':done?'✓ เรียนจบแล้ว':pendingLesson===selected?'กำลังบันทึก…':failed?'ลองบันทึกอีกครั้ง':'ทำเครื่องหมายว่าเรียนจบ';
  $('#complete-lesson').disabled=done || marked || blocked || pendingLesson!==null;
  $('#retry-completion-load').hidden=!account || account.status!=='load-error';
  $('#completion-status').textContent=account && ['loading','load-error'].includes(account.status)
    ? $('#progress-status').textContent
    : pendingLesson!==null ? `กำลังบันทึกบท ${pendingLesson} ในบัญชี… โปรดรอสักครู่`
    : failed ? 'บันทึกไม่ได้ — ยังไม่ยืนยันว่าเรียนจบ กดลองบันทึกอีกครั้ง หรือเข้าสู่ระบบอีกครั้ง'
    : !account && !storageOK ? 'บันทึกไม่ได้ — สถานะอยู่ในหน่วยความจำเท่านั้น เมื่อปิดหน้าอาจสูญหาย'
    : done ? (account?'เรียนจบบทนี้แล้ว · บันทึกในบัญชีแล้ว':'เรียนจบบทนี้แล้ว · บันทึกในเบราว์เซอร์นี้')
    : criteria ? `ยังขาด: ${missing.join(' · ')} · ทำตามลำดับใดก็ได้ ครบทุกบทจึงนับคลาสสำหรับ Level`
    : 'อ่านและทดลองแล้ว กดเพื่อบันทึกว่าเรียนจบ (ไม่ใช่คะแนนแบบทดสอบ)';
  if(account) $('footer span').textContent='ความคืบหน้าตามบัญชี · ไม่รวมข้อมูลเดิมในเบราว์เซอร์';
  else if(!storageOK) $('footer span').textContent='บันทึกไม่ได้ — ใช้งานต่อได้ แต่ความคืบหน้าอยู่ในหน่วยความจำ';
}
async function loadAccount(){
  const loading=account.load(); renderProgress();
  try { await loading; } catch { /* Status and retry are rendered below. */ }
  renderProgress();
}
async function answer(a){
  if(quizBlocked()) return;
  const l=lessons[selected-1]; // Capture lesson before any asynchronous save/navigation.
  quizSelections.set(l.kind,a);
  renderQuizControls();
  feedback=(a===1?'ถูกต้อง — ':'ยังไม่ถูก — ')+l.why;
  $('#feedback').textContent=feedback;
  if(participation) participationOperation('record',l.kind,a===0?'quiz-answer-a':'quiz-answer-b','check-your-thinking');
  if(a===1 && !account) await completeLesson(l);
}
async function completeLesson(l){
  if(pendingLesson!==null || (account && ['loading','load-error','saving'].includes(account.status))) return;
  if(!progress.includes(l.id)){
    if(account){
      pendingLesson=l.id; // Synchronous guard covers rapid manual/quiz clicks.
      renderProgress();
      try { await account.complete(l.kind); failedLessons.delete(l.id); }
      catch { failedLessons.add(l.id); } // Only server-confirmed completion is displayed.
      finally { pendingLesson=null; }
    }else{
      progress.push(l.id);
      try{localStorage.setItem(LOCAL_PROGRESS_KEY,encodeLocalProgress(localHistory=mergeLocalProgress(localHistory,lessons.filter(l=>progress.includes(l.id)).map(l=>l.kind))));}catch{storageOK=false;}
    }
  }
  renderProgress();
}
async function help(type){$('#dialog-title').textContent=type==='guide'?'คู่มือสอนทีม — ฉบับเต็ม':'คำศัพท์และวิธีใช้';$('#dialog-content').textContent='กำลังเปิดเอกสาร…';$('#help-dialog').showModal();if(type==='guide'){try{const r=await fetch(import.meta.env.BASE_URL+'TEAM_TRAINING_TH.md');if(!r.ok)throw new Error();const pre=document.createElement('pre');pre.className='source-guide';pre.textContent=await r.text();$('#dialog-content').replaceChildren(pre);}catch{$('#dialog-content').textContent='เปิดคู่มือไม่สำเร็จ กรุณาปิดแล้วลองใหม่ หรือเปิดไฟล์ public/TEAM_TRAINING_TH.md';}}else{$('#dialog-content').innerHTML='<p>เลือกบท → อ่านเป้าหมาย → เปลี่ยนสถานการณ์ → กดเดินระบบ → เปรียบเทียบผล → ตอบคำถาม ในบัญชีต้องกดเรียนจบ ทดลองหลัก และตอบคำถาม A หรือ B (ไม่ต้องถูก) ครบทุกบทจึงนับคลาสสำหรับ Level ทำตามลำดับใดก็ได้ ส่วน Standalone บันทึกในเบราว์เซอร์เมื่อกดเรียนจบหรือตอบถูก การเรียนจบไม่ใช่คะแนนสอบ รีเซ็ตการทดลองไม่ลบความคืบหน้า</p><dl><dt>Source of truth</dt><dd>แหล่งข้อมูลหลักที่ใช้ตัดสินความถูกต้อง</dd><dt>Idempotency</dt><dd>ทำคำขอเดิมซ้ำโดยไม่เพิ่มผลข้างเคียง ต้องตรวจ payload และขอบเขต key</dd><dt>Replication lag</dt><dd>สำเนายังตามการเขียนที่ primary ไม่ทัน</dd><dt>ACK / Redelivery</dt><dd>การยืนยันรับงานสำเร็จ / การส่งงานเดิมให้ประมวลผลอีก</dd><dt>RPO / RTO</dt><dd>ขอบเขตข้อมูลที่ยอมสูญเสีย / เวลากู้บริการที่ยอมรับได้</dd><dt>Backpressure</dt><dd>ควบคุมงานเข้าเมื่อส่วนปลายรับไม่ไหว</dd><dt>ข้อจำกัด</dt><dd>ไม่มี network, DB, payment หรือ email จริง ทุกขั้นทำตามลำดับ ไม่มีการวัด latency หรือ load test เวลารอและ backoff แทนด้วยการกดปุ่ม ไม่จำลอง concurrency, TTL, failover election หรือ resharding migration</dd></dl>';}}
state=initial();mount();
if(account) loadAccount();
if(participation) participationOperation('load');
