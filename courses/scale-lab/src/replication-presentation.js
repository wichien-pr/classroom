import {dbName} from './replication.js';
import {setWorkloadIcon} from './workload-view.js';
export const replicationLabels={write:'เขียน order', 'read-replica':'อ่าน Replica / fallback','read-primary':'อ่าน Primary',sync:'ส่งสำเนา 1 รอบ',promote:'ประเมิน / Promote'};
export const replicationTopics=[
 ['เขียนแล้วสำเนายังตามไม่ทัน','write read-replica','กดทดลอง · เขียน order → อ่าน Replica · การเขียนสำเร็จไม่ได้ส่งสำเนาทันที'],
 ['อ่าน Primary แล้วส่งสำเนา','read-primary sync read-replica','เตรียม Primary v2 / สำเนา v1 · อ่าน Primary → ส่งสำเนา 1 รอบ → อ่าน Replica'],
 ['Replica หนึ่งเครื่องล่ม','read-replica','Replica 1 ล่ม · กดทดลองเพื่อดูการอ่านจาก Replica 2 ที่ยังพร้อม'],
 ['ไม่มี Replica พร้อมอ่าน','read-replica','Replica ทั้งสองล่ม · กดทดลองเพื่อดู fallback ไป Primary'],
 ['Primary ล่ม ไม่เขียนหรือส่งสำเนา','write sync read-replica','Primary ล่ม แต่สำเนายังพร้อม · กดทดลอง · เขียน → ส่งสำเนา → อ่าน Replica'],
 ['ยังไม่ยืนยัน fencing','promote','Primary ล่ม / Replica 1 ขาด 1 ขั้นเขียน · ยังไม่ยืนยันกัน writer เดิมกลับมาเขียน กดทดลองประเมิน Promote'],
 ['Fence แล้ว ยังไม่ยอมรับข้อมูลสูญเสีย','promote','ยืนยัน fencing เป็นเงื่อนไขจำลองแล้ว แต่ยังไม่ยอมรับ 1 ขั้นเขียนที่ขาด · กดทดลองประเมิน Promote'],
 ['Promote พร้อมยอมรับความสูญเสีย','promote write read-primary read-replica sync','เตรียม fencing และยอมรับข้อมูลสูญเสียแล้ว · กดทดลอง · Promote → เขียน → อ่าน Primary → อ่าน Replica → ส่งสำเนา → อ่าน Replica อีกครั้ง'],
];
// Projection of an actual action's pre-state, not another model invocation.
export function replicationRoutes(before,action){
 const w=before.writer;
 if(action==='promote')return [];
 if(action==='sync')return before.up[w]?before.versions.flatMap((v,i)=>i!==w&&before.up[i]&&(v!==before.versions[w]||before.histories[i]!==before.histories[w])?[[`db-${w}`,`db-${i}`]]:[]):[];
 let target=w;
 if(action==='read-replica'){const replicas=[1,2].filter(i=>i!==w&&before.up[i]);if(replicas.length)target=replicas[before.cursor%replicas.length];}
 return before.up[target]?[['web',`db-${target}`]]:[];
}
export function replicationScene(s,result){
 const routes=result?.routes||[];
 return `<figure class="replication-scene" data-playback="idle" aria-label="Web ส่งคำสั่งไป Primary หรือ Replica ตามผลแบบจำลอง">
 <p class="replication-premise">Client รับ IP จาก DNS → HTTP ผ่าน LB → Web tier<br>ภาพเคลื่อนไหวด้านล่างแสดงเฉพาะคำสั่ง DB / การส่งสำเนาที่แบบจำลองทำจริง</p>
 <div class="replication-map"><svg class="replication-wires" aria-hidden="true">${routes.map(([from,to],i)=>`<path class="replication-wire" data-from="${from}" data-to="${to}"/><circle class="replication-particle" data-route="${i}" r="4" cx="0" cy="0"/>`).join('')}</svg>
 <div class="replication-node replication-web" data-node="web"><strong>Web tier</strong><span>เขียน → Primary · อ่าน → สำเนาที่พร้อม</span></div>
 <div class="replication-pool">${s.versions.map((v,i)=>{const different=s.histories[i]!==s.histories[s.writer],lag=s.versions[s.writer]-v;return `<div class="replication-node ${!s.up[i]?'replication-offline':!different&&lag===0?'replication-ready':''}" data-node="db-${i}" data-db="${i}"><strong>${dbName(i)}</strong><span>${i===s.writer?'บทบาท: Primary · อ่าน / เขียน':i===0&&s.writer!==0?'fenced · ห้ามรับงาน':'บทบาท: Replica · อ่าน'}</span><span>${s.up[i]?'พร้อมให้บริการ':'ล่ม · ไม่รับงาน'} · version ${v}</span><span>${different?'คนละสายข้อมูล · ต้อง reconcile':lag>0?`ล้าหลัง ${lag} ขั้นเขียน`:lag<0?'มี version เดิมมากกว่า · ต้องตรวจข้อมูล':'ข้อมูลตรงกับ writer'}</span></div>`;}).join('')}</div></div>
 <div class="workload-actions"><div class="replication-experiments"></div><div class="workload-playback replication-playback"><button type="button" id="replication-replay" ${result?'':'disabled'}></button><button type="button" id="replication-pause" disabled aria-pressed="false"></button></div><div class="workload-feedback"><p id="replication-stage" role="status"></p><p id="replication-result" role="status">${result?.message||'ยังไม่ได้ทดลอง · กดทดลองเพื่อดูครบทุกขั้น'}</p></div></div>
 <figcaption>version คือขั้นเขียน ไม่ใช่เวลา · ส่งสำเนาในขั้น sync ของการทดลองเท่านั้น ไม่ใช่ synchronous delivery หรือ automatic failover · สูญเสียตอน Promote ${s.lost} ขั้นเขียน</figcaption></figure>`;
}
let cleanup=()=>{};
export function stopReplicationPlayback(){cleanup();cleanup=()=>{};}
export function bindReplicationPlayback(main,play=false){
 stopReplicationPlayback();const scene=main.querySelector('.replication-scene');if(!scene)return;
 const map=scene.querySelector('.replication-map'),svg=scene.querySelector('svg'),replay=scene.querySelector('#replication-replay'),pause=scene.querySelector('#replication-pause');
 setWorkloadIcon(replay,'replay','เล่นภาพซ้ำ');setWorkloadIcon(pause,'pause','พักภาพ');
 let resolveDone;const done=new Promise(resolve=>resolveDone=resolve);
 const media=matchMedia('(prefers-reduced-motion: reduce)');let animations=[];
 function layout(){
  const base=map.getBoundingClientRect(),mobile=base.width<440;svg.setAttribute('viewBox',`0 0 ${base.width} ${base.height}`);
  const rect=id=>{const r=map.querySelector(`[data-node="${id}"]`).getBoundingClientRect();return {x:r.x-base.x,y:r.y-base.y,w:r.width,h:r.height};};
  [...svg.querySelectorAll('path')].forEach((wire,i)=>{
   const a=rect(wire.dataset.from),b=rect(wire.dataset.to),sync=wire.dataset.from!=='web';
   const path=mobile?`M ${sync?a.x:a.x+a.w} ${a.y+a.h/2} H ${sync?8:base.width-8} V ${b.y+b.h/2} H ${sync?b.x:b.x+b.w}`:sync?`M ${a.x+a.w/2} ${a.y+a.h} V ${base.height-10-i*10} H ${b.x+b.w/2} V ${b.y+b.h}`:`M ${a.x+a.w/2} ${a.y+a.h} V ${(a.y+a.h+b.y)/2} H ${b.x+b.w/2} V ${b.y}`;
   wire.setAttribute('d',path);svg.querySelector(`[data-route="${i}"]`).style.offsetPath=`path('${path}')`;
  });
 }
 const observer=new ResizeObserver(layout);observer.observe(map);layout();
 function settle(){resolveDone();scene.dataset.playback='finished';pause.disabled=true;setWorkloadIcon(pause,'pause','พักภาพ');pause.setAttribute('aria-pressed','false');}
 function start(){
  animations.forEach(a=>a.cancel());animations=[];setWorkloadIcon(pause,'pause','พักภาพ');pause.setAttribute('aria-pressed','false');
  if(media.matches){settle();return;}
  scene.dataset.playback='running';pause.disabled=false;
  animations=[...svg.querySelectorAll('circle')].map(p=>p.animate([{offsetDistance:'0%',opacity:1},{offsetDistance:'100%',opacity:1}],{duration:2000,fill:'forwards',easing:'linear'}));
  if(!animations.length)animations=[map.animate([{opacity:1},{opacity:1}],{duration:900})];
  const current=animations;Promise.all(current.map(a=>a.finished)).then(()=>{if(animations===current)settle();}).catch(()=>{});
 }
 replay.onclick=start;pause.onclick=()=>{const pausing=scene.dataset.playback==='running';animations.forEach(a=>pausing?a.pause():a.play());scene.dataset.playback=pausing?'paused':'running';setWorkloadIcon(pause,pausing?'play':'pause',pausing?'เล่นภาพต่อ':'พักภาพ');pause.setAttribute('aria-pressed',String(pausing));};
 const reduce=()=>{if(media.matches&&scene.dataset.playback!=='idle'){animations.forEach(a=>a.cancel());settle();}};media.addEventListener('change',reduce);
 cleanup=()=>{resolveDone();animations.forEach(a=>a.cancel());animations=[];observer.disconnect();media.removeEventListener('change',reduce);};if(play)start();return done;
}
