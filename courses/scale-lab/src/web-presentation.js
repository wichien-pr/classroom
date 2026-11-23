import {animationTiming} from './animation-timing.js';
import {setWorkloadIcon} from './workload-view.js';
export const webTopics=[['เปลี่ยน Web แล้ว ยังเป็นคนเดิมไหม?', 'web-request', 'กดทดลองครั้งเดียว · เมย์เปิดโปรไฟล์ผ่าน Web A แล้ว Web B เทียบ session ในเครื่องกับ shared store']];
const webName=server=>`Web ${server===0?'A':'B'}`;
export function webRoutes(frame){
 if(!frame)return [];
 const s=frame.state,name=webName(s.last.server);
 const routes=[['client','web',`เมย์ส่ง cookie เดิม · Load balancer เลือก ${name}`]];
 if(s.mode==='shared')routes.push(['web','store',`${name} ใช้รหัสใน cookie ค้น session`],['store','web',`Shared store คืน session ของเมย์ให้ ${name}`]);
 routes.push(['web','client',s.last.code==='OK'?'รู้ว่าเป็นเมย์ → แสดงโปรไฟล์':'ไม่พบ session ที่ Web B → ขอให้เข้าสู่ระบบ']);
 return routes;
}
export function webScene(s,frame){
 const topic=frame?.topic??-1,shared=s.mode==='shared',outcomes=frame?.outcomes??[];
 const result=frame?(s.last.code==='OK'?`${webName(s.last.server)} รู้ว่าเป็นเมย์ · เปิดโปรไฟล์ได้`:'Web B ไม่พบ session · ผู้ใช้ถูกขอให้เข้าสู่ระบบอีกครั้ง'):'ยังไม่ได้ทดลอง · ดูผู้ใช้คนเดิมเปิดหน้าเดิมผ่าน Web คนละเครื่อง';
 const routes=webRoutes(frame);
 return `<figure class="web-scene" data-playback="idle" data-condition="${topic}" aria-label="เปรียบเทียบการเปิดโปรไฟล์ของเมย์">
 <p class="web-beat">${topic<0?'การทดลองเดียว · สองแบบการเก็บ session':`แบบ ${shared?2:1}/2 · ${shared?'เก็บ session ไว้ส่วนกลาง':'เก็บ session ใน Web A'}`}</p>
 <p class="web-premise">เมย์เข้าสู่ระบบแล้ว · เปิดโปรไฟล์สองครั้งด้วย cookie เดิม<br>Load balancer ส่งครั้งแรกไป Web A และครั้งถัดไป Web B</p>
 <div class="web-comparison-grid">${['local','shared'].map((mode,i)=>`<section class="web-comparison-case ${topic>=0&&s.mode===mode?'is-current':''}" aria-label="${mode==='local'?'Session ในเครื่อง':'Session ส่วนกลาง'}">
 <h4>${i+1}. ${mode==='local'?'จำผู้ใช้ไว้ใน Web A':'ให้ Web อ่านสถานะส่วนกลาง'}</h4>
 <p>${mode==='local'?'Stateful · Web B ไม่มี session นี้':'Stateless Web · ทั้งคู่ใช้ shared store'}</p>
 <ol>${[0,1].map(server=>{const r=outcomes.find(o=>o.mode===mode&&o.server===server);return `<li data-request-result="${r?.code??'waiting'}"><span>ครั้งที่ ${server+1} → ${webName(server)}</span><strong class="${r?.code==='NO_SESSION'?'web-needs-login':''}">${!r?'รอดูผล':r.code==='OK'?'สวัสดี คุณเมย์':'กรุณาเข้าสู่ระบบ'}</strong></li>`;}).join('')}</ol></section>`).join('')}</div>
 <div class="web-map"><svg class="web-wires" aria-hidden="true">${routes.map(([from,to],i)=>`<path class="web-wire" data-from="${from}" data-to="${to}"/><circle class="web-particle" data-route="${i}" r="4" cx="0" cy="0"/>`).join('')}</svg>
 <div class="web-node" data-node="client"><strong>เมย์ · หน้าโปรไฟล์</strong><span>Cookie = รหัสอ้างอิง session</span></div>
 <div class="web-node" data-node="web"><strong>${topic<0?'Web A → Web B':webName(s.last.server)}</strong><span>${topic<0?'LB เปลี่ยนปลายทาง':shared?'ค้น session ที่ส่วนกลาง':s.last.server===0?'พบ session ในเครื่อง':'ไม่พบ session ในเครื่อง'}</span></div>
 ${shared?'<div class="web-node" data-node="store"><strong>Shared session store</strong><span>รหัส session → ผู้ใช้เมย์</span></div>':''}</div>
 <div class="workload-actions"><div class="web-experiments"></div><div class="workload-playback"><button type="button" id="web-replay" disabled></button><button type="button" id="web-pause" disabled aria-pressed="false"></button></div><div class="workload-feedback"><p id="web-route" role="status"></p><p id="web-result" role="status">${result}</p></div></div>
 <figcaption>สองระบบตัวอย่างเตรียม session ไว้หลัง login แล้ว ไม่ได้คัดลอก session ระหว่าง Web · ภาพจำลอง ไม่ใช่เวลา network · เล่นภาพซ้ำไม่ส่งคำขอใหม่</figcaption></figure>`;
}
let cleanup=()=>{};
export function stopWebPlayback(){cleanup();cleanup=()=>{};}
export function bindWebPlayback(main,play=false,frame=null,onPause=()=>{}){
 stopWebPlayback();const scene=main.querySelector('.web-scene');if(!scene)return;
 const map=scene.querySelector('.web-map'),svg=scene.querySelector('svg'),pause=scene.querySelector('#web-pause');
 setWorkloadIcon(scene.querySelector('#web-replay'),'replay','เล่นภาพซ้ำ');setWorkloadIcon(pause,'pause','พักภาพ');
 const routes=webRoutes(frame),media=matchMedia('(prefers-reduced-motion: reduce)');let resolveDone,animation,disposed=false;
 const done=new Promise(resolve=>resolveDone=resolve);
 function layout(){
  const base=map.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${base.width} ${base.height}`);
  const rect=id=>{const r=map.querySelector(`[data-node="${id}"]`).getBoundingClientRect();return {x:r.x-base.x,y:r.y-base.y,w:r.width,h:r.height};};
  [...svg.querySelectorAll('path')].forEach((wire,i)=>{
   const a=rect(wire.dataset.from),b=rect(wire.dataset.to),horizontal=Math.abs(a.x-b.x)>2,reverse=horizontal?b.x<a.x:b.y<a.y,offset=reverse?10:-10;let path;
   if(horizontal){const ax=a.x+(reverse?0:a.w),bx=b.x+(reverse?b.w:0);path=`M ${ax} ${a.y+a.h/2+offset} H ${(ax+bx)/2} V ${b.y+b.h/2+offset} H ${bx}`;}
   else{const ay=a.y+(reverse?0:a.h),by=b.y+(reverse?b.h:0);path=`M ${a.x+a.w/2+offset} ${ay} V ${(ay+by)/2} H ${b.x+b.w/2+offset} V ${by}`;}
   wire.setAttribute('d',path);svg.querySelector(`[data-route="${i}"]`).style.offsetPath=`path('${path}')`;
  });
 }
 const observer=new ResizeObserver(layout);observer.observe(map);layout();
 function settle(){scene.dataset.playback='finished';pause.disabled=true;resolveDone();}
 async function start(){
  scene.dataset.playback='running';pause.disabled=media.matches;
  if(media.matches){scene.querySelector('#web-route').textContent=routes.map(r=>r[2]).join(' → ');settle();return;}
  for(let i=0;i<routes.length;i++){
   if(disposed)return;scene.querySelector('#web-route').textContent=routes[i][2];
   const particle=svg.querySelector(`[data-route="${i}"]`);
   animation=particle.animate([{offsetDistance:'0%',opacity:1},{offsetDistance:'100%',opacity:1}],{duration:animationTiming.lab08.routeMs,fill:'none',easing:'linear'});
   try{await animation.finished;}catch{return;}
  }
  if(!disposed)settle();
 }
 pause.onclick=()=>{const pausing=scene.dataset.playback==='running';onPause(pausing);if(animation)pausing?animation.pause():animation.play();scene.dataset.playback=pausing?'paused':'running';setWorkloadIcon(pause,pausing?'play':'pause',pausing?'เล่นภาพต่อ':'พักภาพ');pause.setAttribute('aria-pressed',String(pausing));};
 cleanup=()=>{disposed=true;animation?.cancel();observer.disconnect();resolveDone();};if(play)start();return done;
}
