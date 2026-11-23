import {animationTiming} from './animation-timing.js';
import {setWorkloadIcon} from './workload-view.js';
export const cdnLabels={request:'ขอรูป',publish:'เปลี่ยนรูปที่ Origin',tick:'เวลา +1 หน่วย',invalidate:'ลบสำเนา key ปัจจุบัน',version:'ใช้ URL รุ่นล่าสุด','ignore-query':'ไม่รวม query ใน key',outage:'CDN ล่ม','enable-fallback':'เปิดทางสำรอง','origin-outage':'Origin ล่ม'};
export const cdnTopics=[
 ['ทำไม CDN ยังส่งไฟล์เก่า?','decision','กดทดลอง · MISS รับ v1 → HIT v1 → Origin เปลี่ยนเป็น v2 แต่ยังได้ v1 → Invalidate แล้วรับ v2'],
];
export function cdnRoutes(frame){
 if(!frame||frame.action!=='request')return [];
 const {state:s,before}=frame;
 if(s.path==='fallback')return [['client','origin','FALLBACK · client ขอ Origin โดยตรง'],['origin','client','Origin ส่งรูป · ไม่เติม CDN']];
 if(!before.up)return []; // Failed CDN is not a delivered request.
 const check=['client','edge','ขอรูปจาก CDN · ตรวจ cache key'];
 if(s.path==='failure')return [check];
 if(s.path==='hit')return [check,['edge','client','HIT · ส่งสำเนา ไม่อ่าน Origin']];
 return [check,['edge','origin','MISS · CDN ขอรูปจาก Origin'],['origin','edge','Origin ส่งรูป · CDN เก็บสำเนา'],['edge','client','CDN ส่งรูปให้ผู้ใช้']];
}
export function cdnTokenLabel(frame,from,to){
 const request=from==='client'||from==='edge'&&to==='origin';
 return request?`GET${frame.before.urlVersion===null?'':` ?v=${frame.before.urlVersion}`}`:`v${frame.state.delivered}`;
}
function cdnToken(frame,from,to,i){
 const label=cdnTokenLabel(frame,from,to),width=Math.max(36,label.length*8+16);
 return `<g class="cdn-particle" data-route="${i}" data-width="${width}"><rect x="${-width/2}" y="-12" width="${width}" height="24" rx="6"/><text text-anchor="middle" dominant-baseline="central">${label}</text></g>`;
}
export function cdnScene(s,result){
 const routes=cdnRoutes(result),key='image.png'+(s.includeQuery&&s.urlVersion!==null?'?v='+s.urlVersion:''),entry=s.objects[key],stale=entry&&entry.version!==s.origin;
 return `<figure class="cdn-scene" data-playback="idle" aria-label="ผู้ใช้ CDN และ Origin">
 <p class="cdn-premise">หนึ่งไฟล์ · หนึ่งจุดให้บริการ · Origin reads ${s.originReads} · HIT ${s.hits} / MISS ${s.misses}</p>
 <div class="cdn-map"><svg class="cdn-wires" aria-hidden="true">${routes.map(([from,to],i)=>`<path class="cdn-wire" data-from="${from}" data-to="${to}"/>${cdnToken(result,from,to,i)}`).join('')}</svg>
 <div class="cdn-node" data-node="client"><strong>ผู้ใช้ A / B</strong><span>image.png${s.urlVersion===null?'':'?v='+s.urlVersion}</span><span>ได้รับรูป: ${s.delivered===null?'ยังไม่ได้รับ':`v${s.delivered}`}</span></div>
 <div class="cdn-node ${!s.up?'cdn-offline':entry&&!stale&&s.now<entry.expires?'cdn-ready':''}" data-node="edge"><strong>CDN ${s.up?'':'ล่ม'}</strong><span>key: ${key}</span><span>สำเนา ${entry?`v${entry.version}`:'ว่าง'}${stale?' · ยังเป็นไฟล์เก่า':''}</span></div>
 <div class="cdn-node ${s.originUp?'cdn-ready':'cdn-offline'}" data-node="origin"><strong>Origin ${s.originUp?'':'ล่ม'}</strong><span>รูปปัจจุบัน version ${s.origin}</span><span>Web server หรือที่เก็บไฟล์</span></div></div>
 <div class="workload-actions"><div class="cdn-experiments"></div><div class="workload-playback cdn-playback"><button type="button" id="cdn-replay" disabled></button><button type="button" id="cdn-pause" disabled aria-pressed="false"></button></div><div class="workload-feedback"><p id="cdn-stage" role="status"></p><p id="cdn-route" role="status"></p><p id="cdn-result" role="status">${result?.message||'ยังไม่ได้ทดลอง · กดทดลองเพื่อดูครบทุกขั้น'}</p></div></div>
 <figcaption>จำลองหนึ่งไฟล์ที่จุดให้บริการเดียว · Invalidate ถือว่าสำเร็จแล้ว ไม่จำลองความล่าช้าของการลบทั่วเครือข่าย</figcaption></figure>`;
}
let cleanup=()=>{};
export function stopCdnPlayback(){cleanup();cleanup=()=>{};}
export function bindCdnPlayback(main,play=false,frame=null){
 stopCdnPlayback();const scene=main.querySelector('.cdn-scene');if(!scene)return;
 const map=scene.querySelector('.cdn-map'),svg=scene.querySelector('svg'),pause=scene.querySelector('#cdn-pause');
 setWorkloadIcon(scene.querySelector('#cdn-replay'),'replay','เล่นภาพซ้ำ');setWorkloadIcon(pause,'pause','พักภาพ');
 const routes=cdnRoutes(frame),media=matchMedia('(prefers-reduced-motion: reduce)');let resolveDone,animation,disposed=false,index=0;
 const done=new Promise(resolve=>resolveDone=resolve);
 function layout(){
  const base=map.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${base.width} ${base.height}`);
  const rect=id=>{const r=map.querySelector(`[data-node="${id}"]`).getBoundingClientRect();return {x:r.x-base.x,y:r.y-base.y,w:r.width,h:r.height};};
  const client=rect('client'),edge=rect('edge'),origin=rect('origin'),horizontal=edge.x>client.x+client.w;
  [...svg.querySelectorAll('path')].forEach((wire,i)=>{
   const a=rect(wire.dataset.from),b=rect(wire.dataset.to);
   const fallback=wire.dataset.from!=='edge'&&wire.dataset.to!=='edge';
   const reverse=horizontal?b.x<a.x:b.y<a.y;let path;
   if(horizontal&&fallback){
    // Only direct fallback bypasses the edge. Nest the two short bottom lanes.
    const lane=Math.max(client.y+client.h,edge.y+edge.h,origin.y+origin.h)+(reverse?40:24);
    const ax=a.x+a.w/2+12,bx=b.x+b.w/2-12;
    path=`M ${ax} ${a.y+a.h} V ${lane} H ${bx} V ${b.y+b.h}`;
   }else if(horizontal){
    const ax=a.x+(reverse?0:a.w),bx=b.x+(reverse?b.w:0),lane=(ax+bx)/2,offset=reverse?12:-12;
    path=`M ${ax} ${a.y+a.h/2+offset} H ${lane} V ${b.y+b.h/2+offset} H ${bx}`;
   }else if(fallback){
    const lane=reverse?base.width-24:24;
    path=`M ${a.x+(reverse?a.w:0)} ${a.y+a.h/2} H ${lane} V ${b.y+b.h/2} H ${b.x+(reverse?b.w:0)}`;
   }else{
    const ay=a.y+(reverse?0:a.h),by=b.y+(reverse?b.h:0),lane=(ay+by)/2,offset=reverse?12:-12;
    path=`M ${a.x+a.w/2+offset} ${ay} V ${lane} H ${b.x+b.w/2+offset} V ${by}`;
   }
   wire.setAttribute('d',path);
   const token=svg.querySelector(`[data-route="${i}"]`),length=wire.getTotalLength();
   const inset=(horizontal&&!fallback||!horizontal&&fallback)?Number(token.dataset.width)/2+2:14;
   // Keep the whole badge outside node interiors, including at endpoints.
   const start=wire.getPointAtLength(Math.min(inset,length/2)),end=wire.getPointAtLength(Math.max(length-inset,length/2));
   const samples=Array.from({length:41},(_,n)=>wire.getPointAtLength(inset+(length-2*inset)*n/40));
   token.style.offsetPath=`path('M ${start.x} ${start.y} ${samples.slice(1).map(p=>`L ${p.x} ${p.y}`).join(' ')} L ${end.x} ${end.y}')`;
  });
 }
 const observer=new ResizeObserver(layout);observer.observe(map);layout();
 function settle(){scene.dataset.playback='finished';pause.disabled=true;resolveDone();}
 async function start(){
  scene.dataset.playback='running';pause.disabled=media.matches;
  if(media.matches){scene.querySelector('#cdn-route').textContent=routes.map(r=>r[2]).join(' → ');settle();return;}
  for(index=0;index<Math.max(1,routes.length);index++){
   if(disposed)return;
   scene.querySelector('#cdn-route').textContent=routes.length?`${index+1} / ${routes.length} · ${routes[index][2]}`:cdnLabels[frame?.action]||'';
   const particle=svg.querySelector(`[data-route="${index}"]`);
   animation=particle?particle.animate([{offsetDistance:'0%',opacity:1},{offsetDistance:'100%',opacity:1}],{duration:animationTiming.lab07.routeMs,fill:'none',easing:'linear'}):map.animate([{opacity:1},{opacity:1}],{duration:900});
   try{await animation.finished;}catch{return;}
  }
  if(!disposed)settle();
 }
 pause.onclick=()=>{const pausing=scene.dataset.playback==='running';if(animation)pausing?animation.pause():animation.play();scene.dataset.playback=pausing?'paused':'running';setWorkloadIcon(pause,pausing?'play':'pause',pausing?'เล่นภาพต่อ':'พักภาพ');pause.setAttribute('aria-pressed',String(pausing));};
 cleanup=()=>{disposed=true;animation?.cancel();observer.disconnect();resolveDone();};if(play)start();return done;
}
