import {evaluateDatabase,databaseEngines} from './database.js';

const server='<svg viewBox="0 0 96 80" aria-hidden="true"><rect x="15" y="5" width="66" height="60" rx="6"/><path d="M15 25h66M15 45h66M28 15h26M28 35h26M28 55h26M35 73h26"/><circle cx="68" cy="15" r="2"/><circle cx="68" cy="35" r="2"/><circle cx="68" cy="55" r="2"/></svg>';
const disk='<svg viewBox="0 0 96 80" aria-hidden="true"><path d="M18 18v42c0 17 60 17 60 0V18M18 39c0 17 60 17 60 0"/><ellipse cx="48" cy="18" rx="30" ry="12"/></svg>';
const meter=(name,n)=>`<div class="workload-resource" data-resource="${name}"><span>ทรัพยากร <b>${n}</b> หน่วย</span><div class="workload-units" aria-hidden="true">${Array.from({length:4},(_,i)=>`<i class="${i<n?'allocated':''}"></i>`).join('')}</div></div>`;
export function workloadDiagram(config,hasResult=false){
 const r=evaluateDatabase(config);
 return `<figure class="workload-scene" data-layout="${config.layout}" data-ready="${r.ready}" data-playback="idle" aria-label="เส้นทางคำขอจากผู้ใช้ผ่าน Web ไป Database">
 <header class="workload-caption"><strong>${r.independent?'สองชั้น · ปรับแยกกัน':'เครื่องเดียว · ใช้ทรัพยากรร่วม'}</strong><span>ภาพอธิบาย · ไม่ใช่เวลาจริง</span></header>
 <div class="workload-system">
 <div class="workload-client"><svg viewBox="0 0 96 80" aria-hidden="true"><rect x="8" y="8" width="80" height="50" rx="5"/><path d="M8 22h80M35 70h26M48 58v12M20 15h2m5 0h2m5 0h2M28 34l-7 6 7 6m40-12 7 6-7 6"/></svg><strong>ผู้ใช้</strong><span>Browser / Mobile</span></div>
 <div class="workload-link workload-http"><span>HTTP</span><div class="workload-track"><i></i></div><small>${r.ready?'← คำตอบ':'ไม่ได้ข้อมูล'}</small></div>
 <div class="workload-hosts db-hosts ${r.independent?'split':'single'}" data-layout="${config.layout}">
 <section class="workload-machine db-tier" data-tier="web">${server}<strong>Web</strong><span>รับและประมวลผล</span>${meter('web',r.web)}</section>
 <div class="workload-link workload-query"><span>อ่าน / เขียน</span><div class="workload-track"><i></i></div><small>${r.ready?'← ข้อมูล':'× DB ไม่พร้อม'}</small></div>
 <section class="workload-machine db-tier ${r.ready?'':'unavailable'}" data-tier="data">${disk}<strong>Database</strong><span>${databaseEngines[config.engine]}</span>${meter('data',r.data)}<b class="workload-health">${r.ready?'● พร้อม':'× ไม่พร้อม'}</b></section>
 </div></div>
 <figcaption id="workload-result" role="status">${hasResult?(!r.ready?'อ่านข้อมูลไม่ได้ · Web ยังทำงาน แต่ DB ไม่พร้อม':r.independent?`Web ${r.web} / Data ${r.data} · เพิ่มทรัพยากรแยกกันได้`:`Web และ Data ใช้ทรัพยากร ${r.web} หน่วยร่วมกัน`)+(r.fit?' · เหมาะเป็นจุดเริ่มต้น':' · ทบทวนตัวเลือก ไม่ใช่ว่าทำไม่ได้'):'กดทดลองเพื่อดูเส้นทางคำขอของสถานการณ์นี้'}</figcaption>
 <div class="workload-playback"><button type="button" id="workload-replay" ${hasResult?'':'disabled'}>↻ เล่นภาพซ้ำ</button><button type="button" id="workload-pause" disabled aria-pressed="false">พักภาพ</button><span>เล่นภาพซ้ำไม่เพิ่มคะแนน</span></div>
 </figure>`;
}

// Visual playback owns no simulator action, event or participation callback.
export function bindWorkloadPlayback(main,play=false){
 const scene=main.querySelector('.workload-scene');if(!scene)return;
 const replay=scene.querySelector('#workload-replay'),pause=scene.querySelector('#workload-pause');
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function settle(){scene.dataset.playback='finished';pause.disabled=true;pause.textContent='พักภาพ';pause.setAttribute('aria-pressed','false');}
 function start(){
  scene.dataset.playback='idle';void scene.offsetWidth;
  if(reduced()){settle();return;}
  scene.dataset.playback='running';pause.disabled=false;pause.textContent='พักภาพ';pause.setAttribute('aria-pressed','false');
 }
 function stop(){if(scene.dataset.playback!=='running')return;scene.dataset.playback='paused';pause.textContent='เล่นภาพต่อ';pause.setAttribute('aria-pressed','true');}
 replay.onclick=start;
 pause.onclick=()=>{if(scene.dataset.playback==='running')stop();else{scene.dataset.playback='running';pause.textContent='พักภาพ';pause.setAttribute('aria-pressed','false');}};
 scene.addEventListener('animationend',e=>{if(['workload-query-flight','workload-blocked-flight'].includes(e.animationName))settle();});
 // Replaced on every render; no global listeners or timers survive remount.
 for(const id of ['lesson-topic-next','lesson-topic-back'])main.querySelector('#'+id)?.addEventListener('click',stop,{signal:playbackSignal(main)});
 if(play)start();
}
const playbackControllers=new WeakMap();
function playbackSignal(main){
 // Share one signal across the two navigation buttons for the current scene.
 const scene=main.querySelector('.workload-scene');let record=playbackControllers.get(main);
 if(record?.scene!==scene){record?.controller.abort();record={scene,controller:new AbortController()};playbackControllers.set(main,record);}
 return record.controller.signal;
}
