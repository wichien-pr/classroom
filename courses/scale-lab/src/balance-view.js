import {animationTiming} from './animation-timing.js';
import {setWorkloadIcon} from './workload-view.js';
import {BALANCE_BATCH_SIZE} from './balance-flow.js';
// Undefined = unrun; null = model rejected routing; integer = delivered target.
export function balanceScene(state,target,frame){
 const ran=target!==undefined;
 const wires=[['client','router',ran],...[0,1,2].map(i=>['router',`server-${i}`,target===i])];
 return `<figure class="balance-scene" data-playback="idle" data-status="${!ran?'unrun':target===null?'unrouted':'delivered'}" aria-label="Client ติดต่อ Load balancer แล้วส่งไป private server ที่พร้อม">
 <p class="balance-premise">DNS คืน public IP ให้ client แล้ว · HTTP ไม่ผ่าน DNS</p>
 <div class="balance-load"><strong>Incoming load · ${frame?frame.index+1:0} / ${BALANCE_BATCH_SIZE} requests</strong><div class="balance-requests">${Array.from({length:BALANCE_BATCH_SIZE},(_,i)=>`<span data-request="${i}" data-request-state="${i<(frame?.targets.length||0)?frame.targets[i]===null?'failed':'delivered':'waiting'}" data-current="${i===frame?.index}" data-destination="${i<(frame?.targets.length||0)?frame.targets[i]===null?'503':'ABC'[frame.targets[i]]:'waiting'}">R${i+1}<small>${i<(frame?.targets.length||0)?frame.targets[i]===null?'503':'→ '+'ABC'[frame.targets[i]]:'รอส่ง'}</small></span>`).join('')}</div></div>
 <div class="balance-map"><svg class="balance-wires" aria-hidden="true">${wires.map(([from,to,active])=>`<path class="balance-wire" data-from="${from}" data-to="${to}"/><circle class="balance-particle" data-from="${from}" data-to="${to}" data-active="${active}" r="4" cx="0" cy="0"/>`).join('')}</svg>
 <div class="balance-node balance-client" data-node="client"><strong>Browser / Mobile</strong><span>HTTP request ไป LB</span></div>
 <div class="balance-node balance-router" data-node="router"><strong>Load balancer</strong><span>Public IP · 192.0.2.20</span><span>Round-robin · รู้ health แล้ว</span></div>
 <div class="balance-pool">${state.up.map((up,i)=>`<div class="balance-node ${up?'balance-ready':i!==2?'balance-offline':''}" data-node="server-${i}" data-server="${i}"><strong>Server ${i+1} / App ${'ABC'[i]}</strong><span>Private IP · 10.0.0.${i+1}</span><span>${up?'พร้อม · ลงทะเบียนแล้ว':i===2?'ยังไม่ลงทะเบียน':'ล่ม · ไม่รับงาน'}</span><span data-count>รับแล้ว ${state.counts[i]} request</span><div class="balance-count-bar" aria-hidden="true">${Array.from({length:BALANCE_BATCH_SIZE},(_,n)=>`<i data-filled="${n<state.counts[i]}"></i>`).join('')}</div></div>`).join('')}</div></div>
 <div class="workload-actions"><div class="workload-playback balance-playback"><button type="button" id="balance-replay" ${ran?'':'disabled'}></button><button type="button" id="balance-pause" disabled aria-pressed="false"></button></div><div class="workload-feedback"><p id="balance-result" role="status">${!ran?'ยังไม่ได้ทดลอง · กดทดลองเพื่อส่ง 6 คำขอ':target===null?'503 · ไม่มี backend พร้อม · ไม่ส่งคำขอไป server และไม่นับเป็นงานรับแล้ว':`200 · ส่ง request ไป App ${'ABC'[target]} · รวมส่งถึง server ${state.counts.reduce((a,b)=>a+b,0)} request`}</p></div></div>
 <figcaption>สมมติ LB พร้อม รู้ health ทันที และเครื่องมีกำลังพอ · ไม่จำลอง DNS, health-check latency, in-flight requests หรือ DB</figcaption></figure>`;
}
let cleanup=()=>{};
export function stopBalancePlayback(){cleanup();cleanup=()=>{};}
export function bindBalancePlayback(main,play=false,{onPause=()=>{},onSettle=()=>{}}={}){
 stopBalancePlayback();
 const scene=main.querySelector('.balance-scene');if(!scene)return;
 const map=scene.querySelector('.balance-map'),svg=scene.querySelector('.balance-wires');
 const replay=scene.querySelector('#balance-replay'),pause=scene.querySelector('#balance-pause');
 setWorkloadIcon(replay,'replay','เล่นภาพซ้ำ');setWorkloadIcon(pause,'pause','พักภาพ');
 let resolveDone;const done=new Promise(resolve=>resolveDone=resolve);
 const media=matchMedia('(prefers-reduced-motion: reduce)');let animations=[],paused=false;
 function layout(){
  const base=map.getBoundingClientRect(),mobile=base.width<440;
  svg.setAttribute('viewBox',`0 0 ${base.width} ${base.height}`);
  const rect=id=>{const r=map.querySelector(`[data-node="${id}"]`).getBoundingClientRect();return {x:r.x-base.x,y:r.y-base.y,w:r.width,h:r.height};};
  for(const wire of svg.querySelectorAll('path')){
   const a=rect(wire.dataset.from),b=rect(wire.dataset.to),branch=wire.dataset.to.startsWith('server');
   const path=mobile&&branch?`M ${a.x} ${a.y+a.h/2} H 12 V ${b.y+b.h/2} H ${b.x}`:`M ${a.x+a.w/2} ${a.y+a.h} V ${(a.y+a.h+b.y)/2} H ${b.x+b.w/2} V ${b.y}`;
   wire.setAttribute('d',path);svg.querySelector(`circle[data-to="${wire.dataset.to}"]`).style.offsetPath=`path('${path}')`;
  }
 }
 const observer=new ResizeObserver(layout);observer.observe(map);layout();
 // The model already contains this result; reveal it only after the route finishes.
 const currentCard=scene.querySelector('[data-current=true]');
 function requestStage(routing){
  if(!currentCard)return;
  const destination=currentCard.dataset.destination;
  currentCard.dataset.requestState=routing?'routing':destination==='503'?'failed':'delivered';
  currentCard.querySelector('small').textContent=routing?'กำลังส่ง':destination==='503'?'503':`→ ${destination}`;
 }
 function settle(){requestStage(false);resolveDone();scene.dataset.playback='finished';pause.disabled=true;setWorkloadIcon(pause,'pause','พักภาพ');pause.setAttribute('aria-pressed','false');onSettle();}
 function start(){
  animations.forEach(a=>a.cancel());animations=[];
  setWorkloadIcon(pause,'pause','พักภาพ');pause.setAttribute('aria-pressed','false');
  if(media.matches){settle();return;}
  requestStage(true);scene.dataset.playback='running';pause.disabled=false;
  animations=[...svg.querySelectorAll('circle[data-active=true]')].map(p=>p.animate([{offsetDistance:'0%',opacity:1},{offsetDistance:'100%',opacity:1}],{duration:animationTiming.lab04.routeMs,delay:p.dataset.to==='router'?0:animationTiming.lab04.routeMs,fill:'forwards',easing:'linear'}));
  const current=animations;Promise.all(current.map(a=>a.finished)).then(()=>{if(animations===current)settle();}).catch(()=>{});
 }
 replay.onclick=start;
 pause.onclick=()=>{const pausing=!paused;paused=pausing;onPause(pausing);animations.forEach(a=>pausing?a.pause():a.play());scene.dataset.playback=pausing?'paused':'running';setWorkloadIcon(pause,pausing?'play':'pause',pausing?'เล่นภาพต่อ':'พักภาพ');pause.setAttribute('aria-pressed',String(pausing));};
 const reduce=()=>{if(media.matches&&scene.dataset.playback!=='idle'){animations.forEach(a=>a.cancel());settle();}};media.addEventListener('change',reduce);
 cleanup=()=>{resolveDone();animations.forEach(a=>a.cancel());animations=[];observer.disconnect();media.removeEventListener('change',reduce);};
 if(play)start();return done;
}
