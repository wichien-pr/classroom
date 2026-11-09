import {setWorkloadIcon} from './workload-view.js';
export const webTopics=[
 ['Session อยู่คนละเครื่อง','web-request','กดทดลอง · Stateful เก็บ session A ที่ Web 1 แต่ส่งคำขอไป Web 2'],
 ['Sticky กลับเครื่องเดิม','web-request','กดทดลอง · Stateful เปิด Sticky ให้คำขอกลับ Web 1 ที่มี session A'],
 ['Shared store ใช้สถานะร่วมกัน','web-request','กดทดลอง · Stateless ใช้ shared store ปิด Sticky แล้วส่งไป Web 2 เปรียบเทียบกับหัวข้อแรก'],
 ['Web ล่ม แต่สถานะยังอยู่','web-request','กดทดลอง · ใช้ shared store โดย Web 1 ล่ม แต่ Web 2 ยังอ่าน session A ได้'],
 ['เพิ่ม Web เข้าสู่ pool','web-request','กดทดลอง · Web 1 ยังล่ม เพิ่ม Web 3 ที่พร้อมเข้าสู่ pool แล้วส่งไป Web 3 เพื่อใช้ session เดียวกัน'],
 ['Shared store ล่ม','web-request','กดทดลอง · ส่งไป Web 3 ที่พร้อม แต่ shared store ล่ม เปรียบเทียบกับตอน Web 1 ล่ม'],
 ['ไม่มี Web พร้อมรับงาน','web-request','กดทดลอง · ปิด Web ทุกเครื่อง แต่ shared store ยังพร้อม ดูว่าไปไม่ถึง store เมื่อไม่มี Web รับคำขอ'],
];
export function webRoutes(frame){
 if(!frame)return [];
 const s=frame.state,r=s.last,routes=[['client','lb','Client ส่ง cookie ให้ Load balancer']];
 if(r.server<0)return routes;
 routes.push(['lb','web',`LB ส่งไป Web ${r.server+1}`]);
 if(s.mode==='shared'&&s.storeUp)routes.push(['web','store','Web อ่าน session A จาก shared store'],['store','web','ส่ง session A กลับให้ Web']);
 routes.push(['web','lb',`Web คืนผล ${r.code}`],['lb','client',`ผู้ใช้ได้รับผล ${r.code}`]);
 return routes;
}
export function webScene(s,frame,topic){
 const selected=s.last?.server??(topic===6?-1:topic===1?0:topic>=4?2:1),routes=webRoutes(frame);
 const descriptions={OK:'ตรวจ session A สำเร็จและตอบโปรไฟล์',NO_SESSION:'ไม่พบ session A ที่เครื่องนี้ routing ไม่ได้ย้ายสถานะให้',STORE_UNAVAILABLE:'อ่าน shared session store ไม่ได้ แม้ web พร้อม',NO_WEB:'ยังไปไม่ถึง store เพราะไม่มี web รับงาน'};
 const result=s.last?`${s.last.code} · ${selected<0?'ไม่มี Web พร้อม':'Web '+(selected+1)} · ${descriptions[s.last.code]}`:'ยังไม่ได้ทดลอง · กดทดลองเพื่อส่งหนึ่งคำขอ';
 return `<figure class="web-scene" data-playback="idle" aria-label="เส้นทางคำขอโปรไฟล์และ session">
 <p class="web-premise">${s.mode==='local'?'Stateful · session A อยู่ Web 1':'Stateless · session A อยู่ shared store'} · Sticky ${topic===1?'เปิด':'ปิด'}<br>คำขอ ${s.requests} · Store reads ที่พยายาม ${s.storeReads}</p>
 <div class="web-status-pool">${s.up.map((up,i)=>`<div class="web-status ${!up&&(i===0||topic===6)?'web-offline':up?'web-ready':''}"><strong>Web ${i+1}</strong><span>${up?'พร้อมใน pool':i===0||topic===6?'ล่ม · ไม่รับงาน':'ยังไม่อยู่ใน pool'}</span><span>${s.mode==='local'?(i===0?'มี session A':'ไม่มี session A'):'ไม่เก็บ session ข้ามคำขอ'}</span></div>`).join('')}</div>
 <div class="web-map"><svg class="web-wires" aria-hidden="true">${routes.map(([from,to],i)=>`<path class="web-wire" data-from="${from}" data-to="${to}"/><circle class="web-particle" data-route="${i}" r="4" cx="0" cy="0"/>`).join('')}</svg>
 <div class="web-node" data-node="client"><strong>Client A</strong><span>cookie ระบุ session</span><span>มี session ที่ถูกต้องแล้ว</span></div>
 <div class="web-node" data-node="lb"><strong>Load balancer</strong><span>${topic===1?'Sticky → Web 1':selected<0?'ไม่มีปลายทางพร้อม':`เลือก Web ${selected+1}`}</span><span>รู้ health แล้ว</span></div>
 <div class="web-node ${selected<0?'web-offline':'web-ready'}" data-node="web"><strong>${selected<0?'ไม่มี Web พร้อม':'Web '+(selected+1)}</strong><span>${selected<0?'ไม่ส่งต่อไป store':s.mode==='shared'?'ตรวจ session ที่ shared store':selected===0?'มี session A':'ไม่มี session A'}</span><span>${selected<0?'ไม่มีเครื่องรับคำขอ':'เครื่องรับคำขอ'}</span></div>
 <div class="web-node ${s.storeUp?'':'web-offline'}" data-node="store"><strong>Shared store</strong><span>${s.storeUp?'พร้อม':'ล่ม · อ่านไม่ได้'}</span><span>${s.mode==='shared'?'เก็บ session A':'ไม่ได้ใช้ในโหมด Stateful'}</span></div></div>
 <div class="workload-actions"><div class="web-experiments"></div><div class="workload-playback"><button type="button" id="web-replay" disabled></button><button type="button" id="web-pause" disabled aria-pressed="false"></button></div><div class="workload-feedback"><p id="web-route" role="status"></p><p id="web-result" role="status">${result}</p></div></div>
 <figcaption>ภาพเป็นเส้นทางของผลจำลอง ไม่ใช่เวลา network · Replay / Pause ไม่ส่งคำขอใหม่ · เปลี่ยนหัวข้อเริ่มเงื่อนไขใหม่ ไม่ใช่การย้าย session จริง · ไม่จำลอง session expiry หรือ replication</figcaption></figure>`;
}
let cleanup=()=>{};
export function stopWebPlayback(){cleanup();cleanup=()=>{};}
export function bindWebPlayback(main,play=false,frame=null){
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
   if(disposed)return;scene.querySelector('#web-route').textContent=`${i+1} / ${routes.length} · ${routes[i][2]}`;
   const particle=svg.querySelector(`[data-route="${i}"]`);
   animation=particle.animate([{offsetDistance:'0%',opacity:1},{offsetDistance:'100%',opacity:1}],{duration:2000,fill:'none',easing:'linear'});
   try{await animation.finished;}catch{return;}
  }
  if(!disposed)settle();
 }
 pause.onclick=()=>{const pausing=scene.dataset.playback==='running';if(animation)pausing?animation.pause():animation.play();scene.dataset.playback=pausing?'paused':'running';setWorkloadIcon(pause,pausing?'play':'pause',pausing?'เล่นภาพต่อ':'พักภาพ');pause.setAttribute('aria-pressed',String(pausing));};
 cleanup=()=>{disposed=true;animation?.cancel();observer.disconnect();resolveDone();};if(play)start();return done;
}
