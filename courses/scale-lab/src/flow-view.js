import {flowView} from './single-server.js';
const icon='<svg viewBox="0 0 80 60" aria-hidden="true"><rect x="10" y="5" width="60" height="40" rx="5"/><path d="M25 55h30M40 45v10M18 17h44M18 28h25"/></svg>';
export function flowDiagram(client){
 const v=flowView(0,client);
 return `<figure id="flow-scene" data-stage="ready" data-playback="idle" aria-label="Client ค้นหา IP จาก DNS แล้วส่ง HTTP ตรงไปยัง server">
 <div class="flow-map">
 <svg class="flow-connectors" aria-hidden="true">${[['dns-query','client','dns'],['dns-return','dns','client'],['http-request','client','web'],['http-response','web','client']].map(([stage,from,to])=>`<path class="flow-wire" data-stage="${stage}" data-from="${from}" data-to="${to}"/><circle class="flow-travel" data-stage="${stage}" r="4" cx="0" cy="0"/>`).join('')}</svg>
 <div class="flow-network"><section class="flow-machine" data-node="client">${icon}<strong>${v.client}</strong><span>${v.format} → แสดงผล</span></section>
 <div class="flow-dns-route"><span data-stage="dns-query">① ถาม DNS →</span><span data-stage="dns-return">② ← คืน IP</span></div>
 <section class="flow-machine" data-node="dns">${icon}<strong>DNS</strong><span>บริการภายนอก</span></section></div>
 <div class="flow-http-routes"><span data-stage="http-request">③ ${v.client} → Server<br>HTTP GET /users/12</span><span data-stage="http-response">④ Server → ${v.client}<br>HTTP 200 · ${v.format}</span></div>
 <section class="flow-server" data-node="server"><strong>หนึ่งเครื่อง · 192.0.2.10</strong><div class="flow-machine">${icon}<strong>Web / Application</strong><span>Java / Python / Go / Rust หรืออื่นๆ</span></div><div class="flow-storage"><span>Database</span><span>Cache</span></div></section>
 </div><figcaption id="flow-frame">เส้นทางตัวอย่าง · ยังไม่ได้ทดลอง</figcaption></figure>`;
}
// Update only the button contents, never its identity or keyboard focus.
export function setFlowIcon(button,name,label){
 const paths={back:'<path d="m15 5-7 7 7 7"/>',next:'<path d="m9 5 7 7-7 7"/>',reset:'<path d="M3 11a9 9 0 1 1 2.6 7.4M3 4v7h7"/>',play:'<path d="m8 5 11 7-11 7Z" fill="currentColor" stroke="none"/>',replay:'<path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/>',pause:'<path d="M8 5v14M16 5v14"/>',saving:'<path d="M5 3h14M5 21h14M7 3v4l10 10v4M17 3v4L7 17v4"/>'};
 button.classList.add('flow-icon-button');
 button.setAttribute('aria-label',label);button.title=label;
 if(button.querySelector('svg')?.dataset.icon!==name)button.innerHTML=`<svg data-icon="${name}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
}
let cleanup=()=>{};
export function stopFlowPlayback(){cleanup();cleanup=()=>{};}
// Only projects the already-computed original model frames. No act/POST callback.
export function bindFlowPlayback(main,result,play=false){
 stopFlowPlayback();const scene=main.querySelector('#flow-scene');if(!scene)return;
 const pause=main.querySelector('#flow-pause'),replay=main.querySelector('#flow-replay');
 let timer,index=0,disposed=false,generation=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 // Actual CSS-pixel anchors: labels never shrink with a viewBox. Route corridors
 // stay outside node text; HTTP connects only client and Web, never DNS/storage.
 const map=scene.querySelector('.flow-map'),svg=scene.querySelector('.flow-connectors');
 function layout(){
  const origin=map.getBoundingClientRect();
  const box=selector=>{const r=scene.querySelector(selector).getBoundingClientRect();return {x:r.left-origin.left,y:r.top-origin.top,w:r.width,h:r.height};};
  const c=box('[data-node=client]'),d=box('[data-node=dns]'),w=box('.flow-server .flow-machine');
  const stacked=d.y>c.y+c.h;
  svg.setAttribute('viewBox',`0 0 ${origin.width} ${origin.height}`);
  // Paired, non-crossing lanes. DNS never participates in the HTTP route.
  // Reverse paths have their own ports so the travelling dot conveys direction.
  const routes=stacked?{
   'dns-query':`M ${c.x+c.w-20} ${c.y+c.h} V ${d.y}`,
   'dns-return':`M ${d.x+d.w-44} ${d.y} V ${c.y+c.h}`,
   'http-request':`M ${c.x} ${c.y+c.h-20} H 24 V ${w.y+56} H ${w.x}`,
   'http-response':`M ${w.x} ${w.y+80} H 8 V ${c.y+c.h-44} H ${c.x}`,
  }:{
   'dns-query':`M ${c.x+c.w} ${c.y+40} H ${d.x}`,
   'dns-return':`M ${d.x} ${d.y+88} H ${c.x+c.w}`,
   'http-request':`M ${c.x+c.w} ${c.y+c.h-20} H ${c.x+c.w+24} V ${w.y+80} H ${w.x}`,
   'http-response':`M ${w.x} ${w.y+56} H ${c.x+c.w+48} V ${c.y+c.h-44} H ${c.x+c.w}`,
  };
  for(const [stage,path] of Object.entries(routes)){
   svg.querySelector(`.flow-wire[data-stage="${stage}"]`).setAttribute('d',path);
   // Use the identical directed path in SVG CSS pixels; resize preserves phase.
   svg.querySelector(`.flow-travel[data-stage="${stage}"]`).style.offsetPath=`path('${path}')`;
  }
 }
 const resize=new ResizeObserver(layout);resize.observe(map);layout();
 function show(frame){
  scene.dataset.stage=frame.view.stage;
  scene.querySelectorAll('.active').forEach(e=>e.classList.remove('active'));
  scene.querySelectorAll(`[data-stage="${frame.view.stage}"]`).forEach(e=>e.classList.add('active'));
  const node=frame.step===1?'dns':frame.step===4?'server':frame.step===2||frame.step===6?'client':null;
  if(node)scene.querySelector(`[data-node="${node}"]`).classList.add('active');
  scene.querySelector('#flow-frame').textContent=frame.view.message;
 }
 function finish(){clearTimeout(timer);show(result.frames.at(-1));scene.dataset.playback='finished';pause.disabled=true;setFlowIcon(pause,'pause','พักภาพ');pause.setAttribute('aria-pressed','false');}
 function advance(){if(disposed)return;if(index===result.frames.length){finish();return;}show(result.frames[index++]);const animation=scene.querySelector('.flow-travel.active')?.getAnimations()[0];if(animation){const current=generation;animation.currentTime=0;animation.finished.then(()=>{if(!disposed&&current===generation&&scene.dataset.playback==='running')advance();}).catch(()=>{});}else timer=setTimeout(advance,1100);}
 function start(){if(!result)return;generation++;clearTimeout(timer);index=0;setFlowIcon(pause,'pause','พักภาพ');pause.setAttribute('aria-pressed','false');if(reduced.matches){finish();return;}scene.dataset.playback='running';pause.disabled=false;advance();scene.querySelectorAll('.flow-travel').forEach(dot=>dot.getAnimations().forEach(animation=>{animation.currentTime=0;}));}
 setFlowIcon(replay,'replay','เล่นภาพซ้ำ');setFlowIcon(pause,'pause','พักภาพ');
 replay.disabled=!result;pause.disabled=true;
 replay.onclick=start;
 pause.onclick=()=>{if(scene.dataset.playback==='running'){clearTimeout(timer);scene.dataset.playback='paused';setFlowIcon(pause,'play','เล่นภาพต่อ');pause.setAttribute('aria-pressed','true');}else{scene.dataset.playback='running';setFlowIcon(pause,'pause','พักภาพ');pause.setAttribute('aria-pressed','false');if(!scene.querySelector('.flow-travel.active')?.getAnimations().length)timer=setTimeout(advance,1100);}};
 const motion=()=>{if(result&&scene.dataset.playback!=='idle')finish();};reduced.addEventListener('change',motion);
 cleanup=()=>{disposed=true;clearTimeout(timer);resize.disconnect();scene.dataset.playback='idle';reduced.removeEventListener('change',motion);};
 if(play)start();
}
