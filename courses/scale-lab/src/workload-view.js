import {setFlowIcon} from './flow-view.js';
export function setWorkloadIcon(button,name,label){setFlowIcon(button,name,label);button.classList.remove('flow-icon-button');button.classList.add('workload-icon-button');}
import {evaluateDatabase,databaseEngines} from './database.js';

const server='<svg viewBox="0 0 96 80" aria-hidden="true"><rect x="15" y="5" width="66" height="60" rx="6"/><path d="M15 25h66M15 45h66M28 15h26M28 35h26M28 55h26M35 73h26"/><circle cx="68" cy="15" r="2"/><circle cx="68" cy="35" r="2"/><circle cx="68" cy="55" r="2"/></svg>';
const disk='<svg viewBox="0 0 96 80" aria-hidden="true"><path d="M18 18v42c0 17 60 17 60 0V18M18 39c0 17 60 17 60 0"/><ellipse cx="48" cy="18" rx="30" ry="12"/></svg>';
const meter=(name,n)=>`<div class="workload-resource" data-resource="${name}"><span>ทรัพยากร <b>${n}</b> หน่วย</span><div class="workload-units" aria-hidden="true">${Array.from({length:4},(_,i)=>`<i class="${i<n?'allocated':''}"></i>`).join('')}</div></div>`;
export function workloadDiagram(config,hasResult=false){
 const r=evaluateDatabase(config);
 return `<figure class="workload-scene" data-layout="${config.layout}" data-ready="${r.ready}" data-playback="idle" aria-label="เส้นทางคำขอจากผู้ใช้ผ่าน Web ไป Database">
 <header class="workload-caption"><strong>${r.independent?'สองชั้น · ปรับแยกกัน':'เครื่องเดียว · ใช้ทรัพยากรร่วม'}</strong><span>ภาพอธิบาย · ไม่ใช่เวลาจริง</span></header>
 <div class="workload-system"><svg class="workload-connectors" aria-hidden="true">${['http','query'].map(route=>`<path class="workload-wire" data-route="${route}"/><circle class="workload-travel" data-route="${route}" r="4" cx="0" cy="0"/>`).join('')}</svg>
 <div class="workload-client"><svg viewBox="0 0 96 80" aria-hidden="true"><rect x="8" y="8" width="80" height="50" rx="5"/><path d="M8 22h80M35 70h26M48 58v12M20 15h2m5 0h2m5 0h2M28 34l-7 6 7 6m40-12 7 6-7 6"/></svg><strong>ผู้ใช้</strong><span>Browser / Mobile</span></div>
 <div class="workload-link workload-http"><span>HTTP</span><small>${r.ready?'← คำตอบ':'ไม่ได้ข้อมูล'}</small></div>
 <div class="workload-hosts db-hosts ${r.independent?'split':'single'}" data-layout="${config.layout}">
 <section class="workload-machine db-tier" data-tier="web">${server}<strong>Web</strong><span>รับและประมวลผล</span>${meter('web',r.web)}</section>
 <div class="workload-link workload-query"><span>อ่าน / เขียน</span><small>${r.ready?'← ข้อมูล':'× DB ไม่พร้อม'}</small></div>
 <section class="workload-machine db-tier ${r.ready?'':'unavailable'}" data-tier="data">${disk}<strong>Database</strong><span>${databaseEngines[config.engine]}</span>${meter('data',r.data)}<b class="workload-health">${r.ready?'● พร้อม':'× ไม่พร้อม'}</b></section>
 </div></div>
 <div class="workload-actions"><div class="workload-playback"><button type="button" id="workload-replay" ${hasResult?'':'disabled'}>↻ เล่นภาพซ้ำ</button><button type="button" id="workload-pause" disabled aria-pressed="false">พักภาพ</button></div><div class="workload-feedback"><p id="workload-result" role="status">${hasResult?(!r.ready?'อ่านข้อมูลไม่ได้ · Web ยังทำงาน แต่ DB ไม่พร้อม':r.independent?`Web ${r.web} / Data ${r.data} · เพิ่มทรัพยากรแยกกันได้`:`Web และ Data ใช้ทรัพยากร ${r.web} หน่วยร่วมกัน`)+(r.fit?' · เหมาะเป็นจุดเริ่มต้น':' · ทบทวนตัวเลือก ไม่ใช่ว่าทำไม่ได้'):'กดทดลองเพื่อดูเส้นทางคำขอของสถานการณ์นี้'}</p>
 </div></div>
 </figure>`;
}

// Visual playback owns no simulator action, event or participation callback.
let cleanupWorkload=()=>{};
export function stopWorkloadPlayback(){cleanupWorkload();cleanupWorkload=()=>{};}
export function bindWorkloadPlayback(main,play=false){
 stopWorkloadPlayback();
 const scene=main.querySelector('.workload-scene');if(!scene)return;
 const replay=scene.querySelector('#workload-replay'),pause=scene.querySelector('#workload-pause');
 setWorkloadIcon(replay,'replay','เล่นภาพซ้ำ');setWorkloadIcon(pause,'pause','พักภาพ');
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 const reduced=()=>media.matches;
 const map=scene.querySelector('.workload-system'),svg=scene.querySelector('.workload-connectors');
 function layout(){
  const origin=map.getBoundingClientRect();
  const box=s=>{const r=scene.querySelector(s).getBoundingClientRect();return {x:r.x-origin.x,y:r.y-origin.y,w:r.width,h:r.height};};
  const c=box('.workload-client'),w=box('[data-tier=web]'),d=box('[data-tier=data]');
  const route=(a,b)=>{
   if(b.y>=a.y+a.h){const x=a.x+a.w/2,end=b.x+b.w/2,y=(a.y+a.h+b.y)/2;return `M ${x} ${a.y+a.h} V ${y} H ${end} V ${b.y}`;}
   const y=a.y+a.h/2,end=b.y+b.h/2,x=(a.x+a.w+b.x)/2;return `M ${a.x+a.w} ${y} H ${x} V ${end} H ${b.x}`;
  };
  svg.setAttribute('viewBox',`0 0 ${origin.width} ${origin.height}`);
  for(const [name,path] of Object.entries({http:route(c,w),query:route(w,d)})){
   svg.querySelector(`.workload-wire[data-route=${name}]`).setAttribute('d',path);
   svg.querySelector(`.workload-travel[data-route=${name}]`).style.offsetPath=`path('${path}')`;
  }
 }
 const resize=new ResizeObserver(layout);resize.observe(map);layout();
 const motion=()=>{if(media.matches&&scene.dataset.playback!=='idle')settle();};media.addEventListener('change',motion);
 cleanupWorkload=()=>{resize.disconnect();media.removeEventListener('change',motion);scene.dataset.playback='idle';};
 function settle(){scene.dataset.playback='finished';pause.disabled=true;setWorkloadIcon(pause,'pause','พักภาพ');pause.setAttribute('aria-pressed','false');}
 function start(){
  scene.dataset.playback='idle';void scene.offsetWidth;
  if(reduced()){settle();return;}
  scene.dataset.playback='running';pause.disabled=false;setWorkloadIcon(pause,'pause','พักภาพ');pause.setAttribute('aria-pressed','false');
 }
 function stop(){if(scene.dataset.playback!=='running')return;scene.dataset.playback='paused';setWorkloadIcon(pause,'play','เล่นภาพต่อ');pause.setAttribute('aria-pressed','true');}
 replay.onclick=start;
 pause.onclick=()=>{if(scene.dataset.playback==='running')stop();else{scene.dataset.playback='running';setWorkloadIcon(pause,'pause','พักภาพ');pause.setAttribute('aria-pressed','false');}};
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
