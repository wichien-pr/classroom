import {animationTiming} from './animation-timing.js';
import {setWorkloadIcon} from './workload-view.js';
import {evaluateDataCenters} from './data-centers.js';
export const dcTopics=[
 ['ร้านเดียวกัน เปิดบริการสองพื้นที่','dc-request','เปรียบเทียบคำขออ่านรายการสินค้า 100 ราย: รวมที่ East กับแบ่ง East 60 / West 40'],
];
export function dcOutcome(frame){
 if(!frame)return 'ยังไม่ได้ทดลอง · กด ▶ เพื่อดูเส้นทาง';
 if(frame.comparison)return 'รวมที่ East: เกินกำลัง 40 คำขอ → แบ่งสองศูนย์: ไม่เกินกำลังทั้งคู่ · เป็นการจัดเส้นทาง ไม่ใช่ยอดคำขอสำเร็จ';
 const r=frame.result;
 if(r.unavailable)return `ยังไปศูนย์ที่ล่ม ${r.unavailable} ราย${frame.state.redirect?' — ผู้ใช้ยังใช้ DNS เดิม':' — ยังไม่ได้เปลี่ยนเส้นทาง'}`;
 if(r.missingData)return `ย้ายไป East แล้ว แต่ขาดข้อมูล ${r.missingData} ราย — ต้องเตรียมสำเนาข้ามศูนย์`;
 if(r.overloaded)return `East รับ ${r.routes[0]} คำขอ แต่รองรับได้ ${frame.state.eastCapacity} — เกินกำลัง ${r.overloaded} คำขอ`;
 if(r.releaseMismatch)return 'รุ่นบริการต่างกัน — ต้องทดสอบว่าใช้งานร่วมกันได้ ไม่ได้แปลว่าทุกคำขอล้มเหลว';
 if(r.moved)return `East ${frame.state.eastShare} → ${r.routes[0]} ราย — ย้ายพ้นศูนย์ที่ล่มแล้ว ข้อมูลและกำลังพร้อมตามสมมติฐาน`;
 return `แบ่งไป East ${r.routes[0]} / West ${r.routes[1]} ราย — ทั้งสองศูนย์พร้อมตามสมมติฐาน`;
}
// Evaluator outputs routing assignments, not individual delivery or DNS transitions.
export function dcRoutes(frame){
 if(!frame)return [];
 return frame.result.routes.flatMap((count,i)=>count?[[`client-${i}`,i?'west':'east',`${count} ราย → US-${i?'West':'East'} · ${frame.state[i?'westUp':'eastUp']?'เส้นทางที่เลือก ไม่ใช่หลักฐานว่าทุกคำขอสำเร็จ':'ปลายทางล่ม ไม่ได้รับบริการ'}`]]:[]);
}
// Capacity is a limit on assigned requests, never a successful-response count.
export function dcCapacity(frame){
 const assigned=frame.result.routes[0],capacity=frame.state.eastCapacity;
 const excess=frame.state.eastUp?Math.max(0,assigned-capacity):0;
 return {assigned,capacity,within:Math.min(assigned,capacity),excess};
}
// Local data inspection only: no replication/response route is modeled.
function dcDataPanel(c,r){
 const missing=r.missingData;
 return `<section class="dc-data-panel" aria-label="ข้อมูลที่ East" data-data-count="${missing}">
 <p class="dc-data-heading">ข้อมูลที่ East <span class="dc-data-arrival">← คำขอมาถึง East</span></p>
 <div class="dc-data-groups"><div class="dc-data-original"><b aria-hidden="true">▤</b><strong>ข้อมูลเดิม ${c.eastShare} ราย</strong><span>มีอยู่ที่ East</span></div>
 <div class="dc-data-missing"><b aria-hidden="true">▧ ×</b><strong>ข้อมูลผู้ใช้ที่ย้ายมา ${missing} ราย</strong><span>ยังไม่มีที่ East</span><em class="dc-data-blocked">⛔ อ่านไม่ได้ · ไม่มีข้อมูล</em></div></div>
 </section>`;
}
function dcCapacityPanel(frame){
 const {assigned,capacity,within,excess}=dcCapacity(frame);
 return `<section class="dc-capacity-panel" data-excess="${excess}" aria-label="กำลังรองรับของ East">
 <p class="dc-capacity-heading">East · ข้อมูลพร้อม <span>คำขอที่ส่งมา ${assigned}</span></p>
 <div class="dc-capacity-groups"><div class="dc-capacity-within"><strong>ภายในกำลัง ${within} / ${capacity} คำขอ</strong><div class="dc-capacity-track" aria-hidden="true"><i style="width:${capacity?within/capacity*100:0}%"></i></div><span>กำลังรองรับ ${capacity} คำขอ</span></div>
 <div class="dc-capacity-excess"><strong>${excess?`เกินกำลัง ${excess} คำขอ`:'ไม่เกินกำลัง'}</strong><span>${excess?'ส่วนที่กำลังรองรับไม่พอ':'มีความจุเพียงพอตามแบบจำลอง'}</span></div></div></section>`;
}
export function dcScene(c,frame){
 const r=frame?.result||evaluateDataCenters(c),routes=dcRoutes(frame);
 return `<figure class="dc-scene" data-playback="idle" aria-label="เส้นทางของคำขออ่าน 100 รายไปยังสองศูนย์ข้อมูล">
 <p class="dc-map-label">ร้านเดียวกัน เปิดบริการสองพื้นที่ <span>คำขออ่านรายการสินค้า 100 ราย</span></p>
 <p>ร้านมีผู้ใช้สองพื้นที่ ถ้ารวมทุกคำขอไว้ที่ East ซึ่งรองรับได้ 60 คำขอต่อกลุ่ม จะเกิดอะไรขึ้นเมื่อเตรียม West แล้วแบ่งงานไป?</p>
 <div class="dc-comparison">${['รวมที่ East','แบ่งสองศูนย์'].map((title,i)=>{const item=frame?.comparison?.[i];return `<section data-dc-case="${i}"><h3>${title}</h3><p>East: <strong>${item?`${item.result.routes[0]} / 60`:'รอทดลอง'}</strong></p><p>West: <strong>${item?`${item.result.routes[1]} / ${i?60:0}`:'รอทดลอง'}</strong></p><p>${item?`เกินกำลัง ${item.result.overloaded} คำขอ`:'โหลด / กำลังรองรับต่อกลุ่ม'}</p></section>`;}).join('')}</div>
 <p>แผนเส้นทางเมื่อแบ่งสองศูนย์ · เตรียมบริการและข้อมูลรายการสินค้าที่จำเป็นไว้แล้วทั้งคู่</p>
 <div class="dc-map"><svg class="dc-wires" aria-hidden="true">${routes.map(([from,to],i)=>`<path class="dc-wire" data-from="${from}" data-to="${to}"/><circle class="dc-particle" data-route="${i}" r="4" cx="0" cy="0"/>`).join('')}</svg>
 ${['east','west'].map((id,i)=>{const up=c[i?'westUp':'eastUp'];return `<div class="dc-node" data-node="client-${i}"><strong>${frame?r.routes[i]:'?'} ราย</strong><span>ผู้ใช้</span></div><div class="dc-node ${up?'dc-ready':'dc-offline'}" data-node="${id}"><strong>US-${i?'West':'East'}</strong><span>${up?([4,5].includes(frame?.topic)?'เครื่องพร้อม':'พร้อม'):'ล่ม'}</span>${c[i?'westCapacity':'eastCapacity']<100?`<span>รับได้ ${c[i?'westCapacity':'eastCapacity']} คำขอ</span>`:''}</div>`;}).join('')}</div>
 ${frame?.topic===4?dcDataPanel(c,r):''}
 ${frame?.topic===5?dcCapacityPanel(frame):''}
 <div class="workload-actions"><div class="dc-experiments"></div><div class="workload-playback"><button type="button" id="dc-replay" disabled></button><button type="button" id="dc-pause" disabled aria-pressed="false"></button></div><div class="workload-feedback"><p id="dc-result" role="status">${dcOutcome(frame)}</p></div></div>
 <figcaption>ภาพแสดงการเลือกเส้นทาง ไม่ใช่การยืนยันว่าคำขอสำเร็จ · สองแบบใช้คำขอชุดเดียวกัน ไม่ใช่ย้ายข้อมูลระหว่างการทดลอง · ตัวเลขสมมติ ไม่ใช่ RPS หรือผลวัดความเร็ว</figcaption>
</figure>`;
}
let cleanup=()=>{};
export function stopDcPlayback(){cleanup();cleanup=()=>{};}
export function bindDcPlayback(main,play=false,frame=null){
 stopDcPlayback();const scene=main.querySelector('.dc-scene');if(!scene)return;
 const map=scene.querySelector('.dc-map'),svg=scene.querySelector('svg'),pause=scene.querySelector('#dc-pause');
 setWorkloadIcon(scene.querySelector('#dc-replay'),'replay','เล่นภาพซ้ำ');setWorkloadIcon(pause,'pause','พักภาพ');
 const routes=dcRoutes(frame),media=matchMedia('(prefers-reduced-motion: reduce)');let resolveDone,animation,disposed=false;
 const done=new Promise(resolve=>resolveDone=resolve);
 function layout(){
  const base=map.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${base.width} ${base.height}`);
  const rect=id=>{const r=map.querySelector(`[data-node="${id}"]`).getBoundingClientRect();return {x:r.x-base.x,y:r.y-base.y,w:r.width,h:r.height};};
  [...svg.querySelectorAll('path')].forEach((wire,i)=>{
   const a=rect(wire.dataset.from),b=rect(wire.dataset.to),horizontal=Math.abs(a.x-b.x)>2;let path;
   if(horizontal){const ax=a.x+a.w,bx=b.x;path=`M ${ax} ${a.y+a.h/2} H ${(ax+bx)/2} V ${b.y+b.h/2} H ${bx}`;}
   else{const ay=a.y+a.h,by=b.y;path=`M ${a.x+a.w/2} ${ay} V ${(ay+by)/2} H ${b.x+b.w/2} V ${by}`;}
   wire.setAttribute('d',path);svg.querySelector(`[data-route="${i}"]`).style.offsetPath=`path('${path}')`;
  });
 }
 const observer=new ResizeObserver(layout);observer.observe(map);layout();
 function settle(){scene.dataset.playback='finished';pause.disabled=true;resolveDone();}
 const dataPanel=scene.querySelector('.dc-data-panel'),capacityPanel=scene.querySelector('.dc-capacity-panel');
 async function dataStage(stage,target,keyframes=[{transform:'translateY(6px)'},{transform:'translateY(0px)'}]){
  scene.dataset.stage=stage;
  animation=target.animate(keyframes,{duration:1400,fill:'none',easing:'ease-out'});
  try{await animation.finished;return !disposed;}catch{return false;}
 }
 async function start(){
  scene.dataset.playback='running';scene.dataset.stage='route';pause.disabled=media.matches;
  if(media.matches){scene.dataset.stage=dataPanel?'blocked':capacityPanel?'capacity-excess':'route';settle();return;}
  for(let i=0;i<routes.length;i++){
   if(disposed)return;
   const particle=svg.querySelector(`[data-route="${i}"]`);
   animation=particle.animate([{offsetDistance:'0%',opacity:1},{offsetDistance:'100%',opacity:1}],{duration:animationTiming.lab09.routeMs,fill:'none',easing:'linear'});
   try{await animation.finished;}catch{return;}
  }
  if(dataPanel&&!disposed){
   if(!await dataStage('data-check',dataPanel.querySelector('.dc-data-groups')))return;
   if(!await dataStage('blocked',dataPanel.querySelector('.dc-data-blocked')))return;
  }
  if(capacityPanel&&!disposed){
   if(!await dataStage('capacity-fill',capacityPanel.querySelector('.dc-capacity-track i'),[{transform:'scaleX(0)'},{transform:'scaleX(1)'}]))return;
   if(!await dataStage('capacity-excess',capacityPanel.querySelector('.dc-capacity-excess')))return;
  }
  if(!disposed)settle();
 }
 pause.onclick=()=>{const pausing=scene.dataset.playback==='running';if(animation)pausing?animation.pause():animation.play();scene.dataset.playback=pausing?'paused':'running';setWorkloadIcon(pause,pausing?'play':'pause',pausing?'เล่นภาพต่อ':'พักภาพ');pause.setAttribute('aria-pressed',String(pausing));};
 cleanup=()=>{disposed=true;animation?.cancel();observer.disconnect();resolveDone();};if(play)start();return done;
}
