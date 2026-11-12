import {animationTiming} from './animation-timing.js';
import {setWorkloadIcon} from './workload-view.js';
export const cacheLabels={'read-cache':'อ่านสินค้า',update:'เขียนราคา DB',invalidate:'ลบสำเนา',tick:'เวลา +1 หน่วย',outage:'Cache ล่ม',restart:'เริ่ม Cache แบบ cold'};
export const cacheTopics=[
 ['อ่านครั้งแรกและอ่านซ้ำ','read-cache','กดทดลอง · อ่านครั้งแรก MISS → เติมสำเนา → อ่านซ้ำ HIT โดยไม่อ่าน DB เพิ่ม'],
 ['ต้นทางเปลี่ยน แต่สำเนายังเก่า','read-cache update','กดทดลอง · เติมสำเนาราคา 100 → เขียน DB เป็น 150 → อ่านได้สำเนาเก่า'],
 ['ลบสำเนาแล้วโหลดใหม่','read-cache update invalidate','กดทดลอง · เติมสำเนา → เปลี่ยนราคา → พบสำเนาเก่า → Invalidate → อ่านราคาใหม่'],
 ['เวลาและอายุสำเนา','read-cache update tick','กดทดลอง · เติมสำเนา → เปลี่ยนราคา → เดินเวลาจำลอง 3 หน่วย → อ่านใหม่เมื่อ TTL หมด'],
 ['Cache ล่มและกลับมาใหม่','read-cache outage restart','กดทดลอง · เติมสำเนา → Cache ล่ม → อ่าน DB สำรอง → เริ่ม Cache ใหม่ → เติมสำเนาอีกครั้ง'],
];
export function cacheRoutes(frame){
 if(!frame)return [];
 const {action,before}=frame;
 if(action==='update')return [['web','db','เขียน DB · สำเนาไม่เปลี่ยน']];
 if(action==='invalidate')return [['web','cache','ลบสำเนา']];
 if(action!=='read-cache')return [];
 if(!before.up)return [['web','db','BYPASS · อ่าน DB โดยตรง'],['db','web','คืนข้อมูลจาก DB · ไม่เติม cache']];
 const check=['web','cache','ตรวจ key product:price'];
 if(before.cache!==null)return [check,['cache','web','HIT · คืนสำเนา ไม่อ่าน DB']];
 return [check,['web','db','MISS · Application อ่าน DB'],['db','web','DB คืนข้อมูลให้ Application'],['web','cache','Application เติมสำเนา · TTL 3 หน่วย']];
}
export function cacheScene(s,result){
 const routes=cacheRoutes(result);
 return `<figure class="cache-scene" data-playback="idle" aria-label="Application ตรวจ cache และอ่าน DB เมื่อจำเป็น">
 <p class="cache-premise">Client ขอราคาผ่าน Web / Application · Application เป็นผู้ตรวจและเติม Cache<br>DB reads ${s.reads} · HIT ${s.hits} / MISS ${s.misses} · เวลาจำลอง ${s.now} / TTL ${s.ttl}</p>
 <div class="cache-map"><svg class="cache-wires" aria-hidden="true">${routes.map(([from,to],i)=>`<path class="cache-wire" data-from="${from}" data-to="${to}"/><circle class="cache-particle" data-route="${i}" r="4" cx="0" cy="0"/>`).join('')}</svg>
 <div class="cache-node cache-web" data-node="web"><strong>Web / Application</strong><span>ตรวจ key · โหลด DB · เติมสำเนา · ตอบ Client</span></div>
 <div class="cache-pool"><div class="cache-node ${!s.up?'cache-offline':s.cache!==null&&s.cache===s.db?'cache-ready':''}" data-node="cache"><strong>Cache ${s.up?'':'ล่ม'}</strong><span>ราคา ${s.cache??'ว่าง'}${s.cache!==null&&s.cache!==s.db?' · STALE สำเนาเก่า':''}</span><span>หมดอายุที่ ${s.expires??'—'} · ${s.up?'พร้อมให้บริการ':'ไม่รับงาน'}</span></div><div class="cache-node cache-ready" data-node="db"><strong>Database</strong><span>ราคาปัจจุบัน ${s.db}</span><span>ข้อมูลหลัก · ไม่เปลี่ยน cache อัตโนมัติ</span></div></div></div>
 <div class="workload-actions"><div class="cache-experiments"></div><div class="workload-playback cache-playback"><button type="button" id="cache-replay" disabled></button><button type="button" id="cache-pause" disabled aria-pressed="false"></button></div><div class="workload-feedback"><p id="cache-stage" role="status"></p><p id="cache-route" role="status"></p><p id="cache-result" role="status">${result?.message||'ยังไม่ได้ทดลอง · กดทดลองเพื่อดูครบทุกขั้น'}</p></div></div>
 <figcaption>TTL เดินเฉพาะขั้นเวลา +1 หน่วย ไม่ใช่เวลาจริง · ภาพแสดงผลของการทำงานทีละคำสั่ง ไม่จำลอง concurrency หรือ eviction</figcaption></figure>`;
}
let cleanup=()=>{};
export function stopCachePlayback(){cleanup();cleanup=()=>{};}
export function bindCachePlayback(main,play=false,frame=null){
 stopCachePlayback();const scene=main.querySelector('.cache-scene');if(!scene)return;
 const map=scene.querySelector('.cache-map'),svg=scene.querySelector('svg'),pause=scene.querySelector('#cache-pause');
 setWorkloadIcon(scene.querySelector('#cache-replay'),'replay','เล่นภาพซ้ำ');setWorkloadIcon(pause,'pause','พักภาพ');
 const routes=cacheRoutes(frame),media=matchMedia('(prefers-reduced-motion: reduce)');let resolveDone,animation,disposed=false,index=0;
 const done=new Promise(resolve=>resolveDone=resolve);
 function layout(){
  const base=map.getBoundingClientRect(),mobile=base.width<440;svg.setAttribute('viewBox',`0 0 ${base.width} ${base.height}`);
  const rect=id=>{const r=map.querySelector(`[data-node="${id}"]`).getBoundingClientRect();return {x:r.x-base.x,y:r.y-base.y,w:r.width,h:r.height};};
  [...svg.querySelectorAll('path')].forEach((wire,i)=>{
   const a=rect(wire.dataset.from),b=rect(wire.dataset.to),reverse=wire.dataset.from!=='web';
   const path=mobile?`M ${a.x+(reverse?0:a.w)} ${a.y+a.h/2} H ${reverse?8:base.width-8} V ${b.y+b.h/2} H ${b.x+(reverse?0:b.w)}`:`M ${a.x+a.w/2+(reverse?-8:8)} ${reverse?a.y:a.y+a.h} V ${rect('web').y+rect('web').h+24+(reverse?8:0)} H ${b.x+b.w/2+(reverse?-8:8)} V ${reverse?b.y+b.h:b.y}`;
   wire.setAttribute('d',path);svg.querySelector(`[data-route="${i}"]`).style.offsetPath=`path('${path}')`;
  });
 }
 const observer=new ResizeObserver(layout);observer.observe(map);layout();
 function settle(){scene.dataset.playback='finished';pause.disabled=true;resolveDone();}
 async function start(){
  scene.dataset.playback='running';pause.disabled=media.matches;
  if(media.matches){scene.querySelector('#cache-route').textContent=routes.map(r=>r[2]).join(' → ');settle();return;}
  for(index=0;index<Math.max(1,routes.length);index++){
   if(disposed)return;
   scene.querySelector('#cache-route').textContent=routes.length?`${index+1} / ${routes.length} · ${routes[index][2]}`:cacheLabels[frame?.action]||'';
   const particle=svg.querySelector(`[data-route="${index}"]`);
   animation=particle?particle.animate([{offsetDistance:'0%',opacity:1},{offsetDistance:'100%',opacity:1}],{duration:animationTiming.lab06.routeMs,fill:'none',easing:'linear'}):map.animate([{opacity:1},{opacity:1}],{duration:900});
   try{await animation.finished;}catch{return;}
  }
  if(!disposed)settle();
 }
 pause.onclick=()=>{const pausing=scene.dataset.playback==='running';if(animation)pausing?animation.pause():animation.play();scene.dataset.playback=pausing?'paused':'running';setWorkloadIcon(pause,pausing?'play':'pause',pausing?'เล่นภาพต่อ':'พักภาพ');pause.setAttribute('aria-pressed',String(pausing));};
 cleanup=()=>{disposed=true;animation?.cancel();observer.disconnect();resolveDone();};if(play)start();return done;
}
