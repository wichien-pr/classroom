import {setWorkloadIcon} from './workload-view.js';
export const queueTopics=[
 ['ส่งเข้าคิว ยังไม่ใช่งานสำเร็จ','enqueue-jobs','ส่ง Crop 3 งาน · ดูงานรอเพิ่ม โดยยังไม่มีงานเสร็จ'],
 ['Workers หยุด ยังรับงานได้','enqueue-jobs process-jobs','มี Crop รอ 3 งาน · ส่งอีกชุดขณะ Workers หยุด แล้วลองประมวลผล'],
 ['Producer หยุด งานเก่าทำต่อได้','process-jobs','มีงานรอ 6 งาน · Producer หยุด แต่ Worker 1 เครื่องยังพร้อม'],
 ['งานเข้าเร็วกว่างานออก','enqueue-jobs process-jobs','ส่ง Sharpen 3 ชุด แต่ประมวลผลเพียง 1 รอบ · ดูคิวสะสม'],
 ['เพิ่ม Workers ลดงานค้าง','process-jobs','มี Blur รอ 9 งาน · ใช้ Workers 4 เครื่อง โดยไม่เพิ่ม Producer'],
];
export function queueRoutes(f){if(!f)return [];if(f.action==='enqueue-jobs'&&f.state.jobs.length>f.before.jobs.length)return [['producer','queue']];if(f.action==='process-jobs'&&f.state.completed.length>f.before.completed.length)return [['queue','worker']];return [];}
const names={crop:'Crop',sharpen:'Sharpen',blur:'Blur'};
function jobs(items,compact=false){return items.map(j=>`<span class="queue-job" data-job="${j.id}" aria-label="#${j.id} ${names[j.type]}">#${j.id}${compact?'':` ${names[j.type]}`}</span>`).join('')||'<span class="queue-empty">ไม่มีงาน</span>';}
// Presentation-only intermediate states, projected from the two captured snapshots.
export function queueBacklogSnapshot(f,phase){
 const enqueue=f.action==='enqueue-jobs',before=f.before,after=f.state;
 const moved=enqueue?after.jobs.filter(j=>!before.jobs.some(b=>b.id===j.id)):after.completed.filter(j=>!before.completed.some(b=>b.id===j.id));
 const settled=phase==='settled',transfer=phase==='transfer';
 return {waiting:settled||!enqueue?after.jobs:transfer?before.jobs:after.jobs,
 completed:settled?after.completed:before.completed,transit:transfer?moved:[],working:!enqueue&&phase==='processing'?moved:[],
 received:(enqueue&&transfer?before:after).jobs.length+(enqueue&&transfer?before:after).completed.length};
}
export function queueScene(s,f,topic){
 const before=f?.before||s,routes=queueRoutes(f),backlog=topic===3;


 return `<figure class="queue-scene${backlog?' queue-backlog':''}" data-phase="idle" data-playback="idle" aria-label="งานภาพจากผู้ส่ง เข้าคิว แล้วประมวลผลโดย Workers"><div class="queue-backlog-summary" aria-live="polite"><span>เข้าแล้ว <b id="queue-ingress">${before.jobs.length+before.completed.length}</b> งาน</span><span id="queue-balance">${f?'กำลังทดลอง':backlog?'กด ▶ ดูงานเข้าทีละชุด':'กด ▶ ดูเส้นทางงาน'}</span></div><div class="queue-map"><div class="queue-transit" hidden></div><svg class="queue-wires" aria-hidden="true">${routes.map(([a,b],i)=>`<path class="queue-wire" data-from="${a}" data-to="${b}"/>`).join('')}</svg>
 <section class="queue-node ${s.producerUp?'':'queue-offline'}" data-node="producer"><strong>Producer</strong><span>${s.producerUp?'พร้อมส่งงาน':'หยุดส่งงาน'}</span></section>
 <section class="queue-node" data-node="queue"><strong>คิว · งานรอ <b id="mq-backlog">${before.jobs.length}</b> / 30</strong><div id="queue-waiting" class="queue-jobs">${jobs(before.jobs,true)}</div></section>
 <section class="queue-node ${s.consumerUp?'':'queue-offline'}" data-node="worker"><strong>Workers · ${s.workers} เครื่อง</strong><span>${s.consumerUp?'พร้อมประมวลผล':'หยุด · งานยังค้างในคิว'}</span><div id="queue-working" class="queue-jobs"></div><span>เสร็จแล้ว <b id="mq-done">${before.completed.length}</b> งาน</span><div id="queue-completed" class="queue-jobs">${jobs(before.completed,true)}</div></section></div>
 <div class="workload-actions"><div class="queue-experiments"></div><div class="workload-playback"><button id="queue-replay" type="button" disabled></button><button id="queue-pause" type="button" disabled aria-pressed="false"></button></div><div class="workload-feedback"><p id="queue-result" role="status">${f?'กำลังแสดงการเปลี่ยนแปลง':'ยังไม่ได้ทดลอง'}</p></div></div><figcaption>หนึ่ง Worker ทำหนึ่งงานต่อรอบ · คิวพร้อมตลอด · ไม่จำลอง ack, retry หรือการรับประกันส่งงาน</figcaption></figure>`;
}

let cleanup=()=>{};
export function stopQueuePlayback(){cleanup();cleanup=()=>{};}
export function bindQueuePlayback(main,play=false,frame=null){
 stopQueuePlayback();const scene=main.querySelector('.queue-scene');if(!scene)return;
 const map=scene.querySelector('.queue-map'),svg=scene.querySelector('svg'),pause=scene.querySelector('#queue-pause');
 setWorkloadIcon(scene.querySelector('#queue-replay'),'replay','เล่นภาพซ้ำ');setWorkloadIcon(pause,'pause','พักภาพ');
 let animation,disposed=false,resolveDone;const done=new Promise(r=>resolveDone=r);
 function layout(){const base=map.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${base.width} ${base.height}`);for(const wire of svg.querySelectorAll('path')){const a=map.querySelector(`[data-node="${wire.dataset.from}"]`).getBoundingClientRect(),b=map.querySelector(`[data-node="${wire.dataset.to}"]`).getBoundingClientRect();const half=map.querySelector('.queue-transit').getBoundingClientRect().height/2;const d=`M ${a.x+a.width/2-base.x} ${a.bottom-base.y+half} V ${b.top-base.y-half}`;wire.setAttribute('d',d);const token=map.querySelector('.queue-transit');if(token)token.style.offsetPath=`path('${d}')`;}}
 const observer=new ResizeObserver(layout);observer.observe(map);layout();
 const backlog=scene.classList.contains('queue-backlog'),transit=scene.querySelector('.queue-transit');
 function project(phase){
  const p=queueBacklogSnapshot(frame,phase),enqueue=frame.action==='enqueue-jobs';scene.dataset.phase=phase;
  scene.querySelector('#mq-backlog').textContent=p.waiting.length;scene.querySelector('#mq-done').textContent=p.completed.length;
  scene.querySelector('#queue-waiting').innerHTML=jobs(p.waiting,true);scene.querySelector('#queue-completed').innerHTML=jobs(p.completed,true);
  scene.querySelector('[data-node=worker]>span').textContent=p.working.length?'กำลังประมวลผล':frame.state.consumerUp?'พร้อมประมวลผล':'หยุด · งานยังค้างในคิว';
  scene.querySelector('#queue-working').innerHTML=p.working.map((j,i)=>`<span class="queue-worker-job" data-worker="${i+1}"><small>Worker ${i+1}</small>${jobs([j],true)}</span>`).join('');
  scene.querySelector('#queue-ingress').textContent=p.received;
  transit.innerHTML=p.transit.length?jobs(p.transit,true):'';transit.hidden=!p.transit.length;

  const final=phase==='settled'&&frame.index===frame.total-1;
  scene.classList.toggle('queue-accumulated',backlog&&final);
  scene.querySelector('#queue-balance').textContent=final?`เสร็จ ${p.completed.length} · ยังรอ ${p.waiting.length}`:enqueue?(phase==='transfer'?`กำลังส่ง ${p.transit.length} งาน`:`คิว ${frame.before.jobs.length} → ${p.waiting.length} งาน`):phase==='transfer'?'Worker รับงานจากคิว':phase==='processing'?'กำลังประมวลผล · ยังไม่เสร็จ':`ทำ 1 รอบ · คิว ${frame.before.jobs.length} → ${p.waiting.length}`;
  scene.querySelector('#queue-result').textContent=final&&!backlog?frame.message:final?`เข้า ${p.received} · เสร็จ ${p.completed.length} · ค้าง ${p.waiting.length} งาน`:scene.querySelector('#queue-balance').textContent;
  layout();
 }
 async function phaseWait(target,keyframes,duration){animation=target.animate(keyframes,{duration,easing:'linear'});try{await animation.finished;}catch{return false;}return !disposed;}
 async function startMessages(){
  scene.dataset.playback='running';
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){project('settled');scene.dataset.playback='finished';pause.disabled=true;resolveDone();return;}
  pause.disabled=false;project('transfer');
  if(!queueRoutes(frame).length){project('settled');scene.querySelector('#queue-balance').textContent=frame.message;scene.querySelector('#queue-result').textContent=frame.message;if(!await phaseWait(map,[{transform:'none'},{transform:'none'}],900))return;scene.dataset.playback='finished';pause.disabled=true;resolveDone();return;}
  if(!await phaseWait(transit,[{offsetDistance:'0%'},{offsetDistance:'100%'}],1500))return;
  project('processing');
  if(!await phaseWait(map,[{transform:'translateY(0)'},{transform:'translateY(0)'}],frame.action==='process-jobs'?1300:1000))return;
  project('settled');
  if(!await phaseWait(map,[{transform:'translateY(0)'},{transform:'translateY(0)'}],900))return;
  scene.dataset.playback='finished';pause.disabled=true;resolveDone();
 }

 pause.onclick=()=>{const p=scene.dataset.playback==='running';p?animation?.pause():animation?.play();scene.dataset.playback=p?'paused':'running';setWorkloadIcon(pause,p?'play':'pause',p?'เล่นภาพต่อ':'พักภาพ');pause.setAttribute('aria-pressed',String(p));};
 cleanup=()=>{disposed=true;animation?.cancel();observer.disconnect();resolveDone();};if(play)startMessages();return done;
}
