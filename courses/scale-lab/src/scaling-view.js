import {setWorkloadIcon} from './workload-view.js';
// A projection of the evaluated capacity/routing result, not a request simulator.
export function scalingScene(config,result=null){
 const targets=Array.from({length:config.servers},(_,i)=>i).filter(i=>config.balanced||i===0);
 const wires=[...(config.balanced?[['client','router',true]]:[]),...targets.map(i=>[config.balanced?'router':'client',`server-${i}`,!(i===0&&config.down)])];
 return `<figure class="scaling-scene" data-playback="idle" data-status="${result?.status??'unrun'}" aria-label="กำลังและเส้นทางของ Web tier">
 <p class="scaling-premise">โหลด ${config.traffic} · กำลังต่อเครื่อง ${config.power} หน่วย · ${config.servers} เครื่อง</p>
 <div class="scaling-map"><svg class="scaling-wires" aria-hidden="true">${wires.map(([from,to,healthy])=>`<path class="scaling-wire" data-from="${from}" data-to="${to}"/><circle class="scaling-particle" data-from="${from}" data-to="${to}" data-active="${!!result&&healthy}" r="4" cx="0" cy="0"/>`).join('')}</svg>
 <div class="scaling-node scaling-client" data-node="client"><strong>ผู้ใช้</strong><span>โหลด ${config.traffic} หน่วยสมมติ</span></div>
 ${config.balanced?'<div class="scaling-node scaling-router" data-node="router"><strong>Load balancer</strong><span>พร้อม · รู้ health แล้ว</span></div>':''}
 <div class="scaling-pool">${Array.from({length:config.servers},(_,i)=>`<div class="scaling-node ${i===0&&config.down?'scaling-offline':''}" data-node="server-${i}"><strong>Web ${i+1}</strong><span>กำลัง ${config.power} หน่วย</span><span>${i===0&&config.down?'ล่ม':config.balanced||i===0?'พร้อม · มีเส้นทาง':'พร้อม · ไม่มีเส้นทาง'}</span></div>`).join('')}</div></div>
 <div class="workload-actions"><div class="workload-playback scaling-playback"><button type="button" id="scaling-replay" ${result?'':'disabled'}></button><button type="button" id="scaling-pause" disabled aria-pressed="false"></button></div><div class="workload-feedback"><p id="scaling-result" role="status">${result?`${{ready:'รับโหลดได้ตามสมมติฐาน',overloaded:'โหลดเกินกำลังที่เข้าถึงได้',offline:'เข้าใช้งานไม่ได้ · ไม่มีเครื่องพร้อมบนเส้นทาง'}[result.status]} · โหลด ${config.traffic} / กำลัง ${result.capacity} หน่วย · พร้อม ${result.healthy} เครื่อง แต่รับโหลดได้ ${result.routed} เครื่อง`:'ยังไม่ได้ทดลอง · กดทดลองเพื่อประเมินกำลังและเส้นทาง'}</p><p class="workload-playback-note">จุดเคลื่อนที่แสดงเส้นทางที่พร้อม ไม่ใช่คำขอจริงหรือความเร็ว · เล่นซ้ำไม่เพิ่มคะแนน</p></div></div>
 <figcaption>หน่วยสมมติ ไม่ใช่ benchmark · ไม่จำลองเวลา failover, DB หรือ network${config.balanced?' · LB พร้อมและรู้ health ทันที':' · ต่อ Web 1 โดยตรง'}</figcaption></figure>`;
}
let cleanup=()=>{};
export function stopScalingPlayback(){cleanup();cleanup=()=>{};}
export function bindScalingPlayback(main,play=false){
 stopScalingPlayback();
 const scene=main.querySelector('.scaling-scene');if(!scene)return;
 const map=scene.querySelector('.scaling-map'),svg=scene.querySelector('.scaling-wires');
 const replay=scene.querySelector('#scaling-replay'),pause=scene.querySelector('#scaling-pause');
 setWorkloadIcon(replay,'replay','เล่นภาพซ้ำ');setWorkloadIcon(pause,'pause','พักภาพ');
 const media=matchMedia('(prefers-reduced-motion: reduce)');let animations=[];
 function layout(){
  const base=map.getBoundingClientRect(),mobile=base.width<440;
  svg.setAttribute('viewBox',`0 0 ${base.width} ${base.height}`);
  const rect=id=>{const r=map.querySelector(`[data-node="${id}"]`).getBoundingClientRect();return {x:r.x-base.x,y:r.y-base.y,w:r.width,h:r.height};};
  for(const wire of svg.querySelectorAll('path')){
   const a=rect(wire.dataset.from),b=rect(wire.dataset.to);
   const branch=wire.dataset.to.startsWith('server');
   const path=mobile&&branch?`M ${a.x} ${a.y+a.h/2} H 12 V ${b.y+b.h/2} H ${b.x}`:`M ${a.x+a.w/2} ${a.y+a.h} V ${(a.y+a.h+b.y)/2} H ${b.x+b.w/2} V ${b.y}`;
   wire.setAttribute('d',path);svg.querySelector(`circle[data-to="${wire.dataset.to}"]`).style.offsetPath=`path('${path}')`;
  }
 }
 const observer=new ResizeObserver(layout);observer.observe(map);layout();
 function settle(){scene.dataset.playback='finished';pause.disabled=true;setWorkloadIcon(pause,'pause','พักภาพ');pause.setAttribute('aria-pressed','false');}
 function start(){
  animations.forEach(a=>a.cancel());animations=[];
  setWorkloadIcon(pause,'pause','พักภาพ');pause.setAttribute('aria-pressed','false');
  if(media.matches){settle();return;}
  scene.dataset.playback='running';pause.disabled=false;
  animations=[...svg.querySelectorAll('circle[data-active=true]')].map(p=>p.animate([{offsetDistance:'0%'},{offsetDistance:'100%'}],{duration:3200,fill:'both',easing:'linear'}));
  // Offline still has a finite explanatory pause, not a fabricated route.
  if(!animations.length)animations=[scene.animate([{opacity:1},{opacity:1}],{duration:3200})];
  const current=animations;Promise.all(current.map(a=>a.finished)).then(()=>{if(animations===current)settle();}).catch(()=>{});
 }
 replay.onclick=start;
 pause.onclick=()=>{const pausing=scene.dataset.playback==='running';animations.forEach(a=>pausing?a.pause():a.play());scene.dataset.playback=pausing?'paused':'running';setWorkloadIcon(pause,pausing?'play':'pause',pausing?'เล่นภาพต่อ':'พักภาพ');pause.setAttribute('aria-pressed',String(pausing));};
 const reduce=()=>{if(media.matches&&scene.dataset.playback!=='idle'){animations.forEach(a=>a.cancel());settle();}};media.addEventListener('change',reduce);
 cleanup=()=>{animations.forEach(a=>a.cancel());animations=[];observer.disconnect();media.removeEventListener('change',reduce);};
 if(play)start();
}
