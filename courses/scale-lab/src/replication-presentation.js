import {animationTiming} from './animation-timing.js';
import {dbName} from './replication.js';
import {setWorkloadIcon} from './workload-view.js';
export const replicationLabels={write:'เขียน order', 'read-replica':'อ่าน Replica / fallback','read-primary':'อ่าน Primary',sync:'ส่งสำเนา 1 รอบ',promote:'ประเมิน / Promote',fence:'หยุดเครื่องเดิมรับงานเขียน','accept-loss':'ยอมรับข้อมูลที่ขาด'};
export const replicationTopics=[
 ['เขียนแล้วสำเนายังตามไม่ทัน','write read-replica','กดทดลอง · เขียน order → อ่าน Replica · การเขียนสำเร็จไม่ได้ส่งสำเนาทันที'],
 ['อ่าน Primary แล้วส่งสำเนา','read-primary sync read-replica','เตรียม Primary v2 / สำเนา v1 · อ่าน Primary → ส่งสำเนา 1 รอบ → อ่าน Replica'],
 ['Replica หนึ่งเครื่องล่ม','read-replica','Replica 1 ล่ม · กดทดลองเพื่อดูการอ่านจาก Replica 2 ที่ยังพร้อม'],
 ['ไม่มี Replica พร้อมอ่าน','read-replica','Replica ทั้งสองล่ม · กดทดลองเพื่อดู fallback ไป Primary'],
 ['Primary ล่ม ไม่เขียนหรือส่งสำเนา','write sync read-replica','Primary ล่ม แต่สำเนายังพร้อม · กดทดลอง · เขียน → ส่งสำเนา → อ่าน Replica'],
 ['Primary ล่ม → เปลี่ยนเครื่องเขียนอย่างมีเงื่อนไข','promote write read-primary read-replica sync','กดทดลอง · หยุดเครื่องเดิมรับงานเขียน → ตรวจและยอมรับข้อมูลที่ขาด → Promote → เปรียบเทียบประวัติ → sync'],
];
// Projection of an actual action's pre-state, not another model invocation.
export function replicationRoutes(before,action){
 const w=before.writer;
 if(['promote','fence','accept-loss'].includes(action))return [];
 if(action==='sync')return before.up[w]?before.versions.flatMap((v,i)=>i!==w&&before.up[i]&&(v!==before.versions[w]||before.histories[i]!==before.histories[w])?[[`db-${w}`,`db-${i}`]]:[]):[];
 let target=w;
 if(action==='read-replica'){const replicas=[1,2].filter(i=>i!==w&&before.up[i]);if(replicas.length)target=replicas[before.cursor%replicas.length];}
 return before.up[target]?[['web',`db-${target}`]]:[];
}
const dataLabel=(s,i)=>`v${s.versions[i]} · สาย ${s.histories[i]}`;
// Read-only projection: never execute an action to obtain presentation data.
export function replicationConsequence(frame){
 const {before,state:s,action}=frame, routes=frame.routes.map(r=>[...r]);
 const outcome=(kind,title,detail,returned=null)=>({kind,title,detail,returned,routes});
 if(action==='fence')return outcome('fenced','หยุดเครื่องเดิมรับงานเขียน', 'Fencing = กันเครื่องเดิมไม่ให้รับงานเขียน แม้กลับมาออนไลน์ · ยังไม่เปลี่ยน Primary');
 if(action==='accept-loss')return outcome('loss-accepted','รับทราบข้อมูลที่ขาดก่อน Promote',frame.message);
 if(action==='promote'){
  const lost=Math.max(0,before.versions[0]-before.versions[1]);
  if(s.writer!==before.writer)return outcome('promoted','Replica 1 → Primary ใหม่',`ยืนยัน fencing · ยอมรับสูญเสีย ${s.lost} ขั้นเขียน · Primary เดิมยังถูก fence`);
  if(!before.fenced)return outcome('fence-blocked','หยุด Promote · ยังไม่กัน writer เดิม','ยังไม่ยืนยัน fencing · ไม่เปลี่ยน Primary ไม่ส่งข้อมูล');
  if(lost&&!before.acceptLoss)return outcome('loss-blocked','หยุด Promote · ยังไม่ยอมรับข้อมูลที่ขาด',`fencing ยืนยันแล้ว · ยังไม่ยอมรับสูญเสีย ${lost} ขั้นเขียน · Primary ไม่เปลี่ยน`);
  return outcome('promote-blocked','หยุด Promote',frame.message);
 }
 if(action==='sync')return !before.up[before.writer]?outcome('sync-blocked','หยุด sync · Primary ล่ม','ไม่มีต้นทางส่งสำเนา · version และสายข้อมูลไม่เปลี่ยน'):routes.length?outcome('sync','ส่งสำเนาเฉพาะขั้น sync','Replica รับ version และสายข้อมูลจาก Primary'):outcome('sync-noop','ไม่มีข้อมูลค้างให้ส่ง','ไม่ส่งข้อมูล · version และสายข้อมูลไม่เปลี่ยน');
 if(action==='write')return before.up[before.writer]?outcome('write','เขียนที่ Primary ใหม่เท่านั้น','Replica ยังไม่รับขั้นเขียนนี้ · ต้อง sync แยก'):outcome('writer-down','503 · เขียนไม่ได้','Primary ล่ม · ไม่มี COMMIT · ข้อมูลทุกเครื่องยังเท่าเดิม');
 const target=Number(routes[0]?.[1]?.split('-')[1]);
 if(action.startsWith('read')&&Number.isInteger(target)){
  routes.push([`db-${target}`,'web']);
  const divergent=s.histories[target]!==s.histories[s.writer],stale=s.versions[target]<s.versions[s.writer],fallback=action==='read-replica'&&target===s.writer;
  const kind=divergent?'read-divergent':stale?'read-stale':fallback?'fallback':'read-current';
  return outcome(kind,`${fallback?'fallback · ':''}Web tier รับจาก ${dbName(target)}`,divergent?'version เท่ากันไม่ได้แปลว่าข้อมูลตรง · คนละสายข้อมูล ต้อง reconcile':stale?`อ่านได้ แต่ยังขาด ${s.versions[s.writer]-s.versions[target]} ขั้นเขียนของ Primary`:fallback?'Replica ทั้งสองล่ม · อ่าน Primary แทน ไม่ใช่ Promote':'version และสายข้อมูลตรงกับ Primary',dataLabel(s,target));
 }
 return outcome('read-blocked','503 · อ่านไม่ได้','ไม่มีฐานข้อมูลพร้อมอ่าน · ไม่มีผลอ่านกลับ');
}
// Model stage indices remain untouched; only the learner's reading sequence is grouped.
export const replicationRecoveryBeat=frame=>!frame||frame.index===0?0:frame.index<5?1:2;
function recoveryScene(s,frame){
 const beat=replicationRecoveryBeat(frame),v=frame?replicationConsequence(frame):null;
 const routes=v?.routes||[],before=frame?.before||s;
 const loss=s.writer===0?Math.max(0,s.versions[0]-s.versions[1]):s.lost;
 const sentences=['Primary เดิมล่ม จึงรับงานเขียนต่อไม่ได้',`หยุดเครื่องเดิมไม่ให้เขียน และยอมรับว่าขาด ${loss} งานเขียนก่อนเปลี่ยน Primary`,'Primary ใหม่รับงานเขียน แล้วส่งข้อมูลให้ Replica ตามทัน'];
 const status=(state,i)=>i===0?(state.fenced?'หยุดรับงานเขียนแล้ว':'ล่ม · เขียนไม่ได้'):state.writer===0?(i===1?`ขาด ${loss} งานเขียน`:'ยังมีข้อมูลเดิม'):i===state.writer?(state.versions[i]>1?'รับงานเขียนใหม่แล้ว':'พร้อมรับงานเขียน'):state.histories[i]!==state.histories[state.writer]?'ข้อมูลยังไม่ตรง':state.versions[i]!==state.versions[state.writer]?'ยังรอข้อมูลใหม่':'รับข้อมูลจาก Primary ใหม่แล้ว';
 const result=!frame?'กด Play เพื่อดูการเปลี่ยน Primary':frame.index===0?'ยังเปลี่ยน Primary ไม่ได้':frame.index===1?'หยุดเครื่องเดิมไม่ให้รับงานเขียน แม้กลับมาออนไลน์':frame.index===2?`ยังเปลี่ยนไม่ได้ · ต้องยอมรับ ${loss} งานเขียนที่ขาด`:frame.index===3?`ยอมรับการสูญเสีย ${loss} งานเขียนก่อนเปลี่ยน`:frame.index===4?'Replica 1 เปลี่ยนเป็น Primary ใหม่':frame.index===5?'Primary ใหม่รับงานเขียนแล้ว':frame.index===6?'อ่านข้อมูลจาก Primary ใหม่ได้':frame.index===7?'Replica ยังมีข้อมูลเดิม · ต้องส่งข้อมูลใหม่':frame.index===8?'ส่งข้อมูลจาก Primary ใหม่ให้ Replica แล้ว':'เขียนต่อได้ · Replica ตามทันแล้ว';
 return `<figure class="replication-scene" data-recovery="true" data-learner-beat="${beat}" data-model-stage="${frame?.index??-1}" data-guard-stage="${beat<2}" data-consequences="true" data-consequence-kind="${v?.kind||'idle'}" data-lag-action="${frame?.action||'idle'}" data-playback="idle" aria-label="การเปลี่ยน Primary ในสามช่วง">
 <header class="replication-recovery-heading"><span data-recovery-stage>${beat+1} / 3 · ${['เครื่องเดิมล่ม','เตรียมก่อนเปลี่ยน','เขียนต่อและส่งสำเนา'][beat]}</span><p>${sentences[beat]}</p></header>
 <div class="replication-map"><svg class="replication-wires" aria-hidden="true">${routes.map(([from,to],i)=>`<path class="replication-wire" data-from="${from}" data-to="${to}"/><g class="replication-particle replication-data-token" data-route="${i}"><rect x="-19" y="-14" width="38" height="28" rx="7"/><text text-anchor="middle" y="5">${frame.action==='write'?'เขียน':frame.action==='sync'?'ส่ง':'อ่าน'}</text></g>`).join('')}</svg>
 <div class="replication-node replication-web" data-node="web"><strong>Web tier</strong></div>
 <div class="replication-pool">${s.versions.map((_,i)=>`<div class="replication-node ${!s.up[i]?'replication-offline':s.writer===i||s.writer!==0&&s.histories[i]===s.histories[s.writer]&&s.versions[i]===s.versions[s.writer]?'replication-ready':''}" data-node="db-${i}" data-db="${i}"><strong>${i===0?'Primary เดิม':i===s.writer?'Primary ใหม่':'Replica '+i}</strong>${i===1&&s.writer===1?'<span>จาก Replica 1</span>':''}<span data-copy="${i}" data-before="${status(before,i)}" data-final="${status(s,i)}">${status(s,i)}</span></div>`).join('')}</div></div>
 <div class="workload-actions"><div class="replication-experiments"></div><div class="workload-playback replication-playback"><button type="button" id="replication-replay" ${frame?'':'disabled'}></button><button type="button" id="replication-pause" disabled aria-pressed="false"></button></div><div class="workload-feedback"><p id="replication-stage" role="status"></p><p id="replication-result" role="status">${result}</p></div></div>
 <figcaption>ไม่สลับอัตโนมัติ${s.writer===0?'':` · สูญเสีย ${loss} งานเขียนแล้ว`} · ส่งสำเนาเมื่อสั่งเท่านั้น · ไม่กู้ข้อมูลที่สูญเสีย</figcaption></figure>`;
}
export function replicationScene(s,result,topic=result?.topic){
 if(topic===5)return recoveryScene(s,result);
 const consequence=topic>0&&result?replicationConsequence(result):null;
 const routes=consequence?.routes||result?.routes||[],lag=topic===0;
 const target=result?.action==='read-replica'?Number(routes[0]?.[1]?.split('-')[1]):null;
 const latest=s.versions[s.writer],returned=target===null?null:s.versions[target];

 return `<figure class="replication-scene" data-playback="idle" data-recovery="${topic===5}" data-guard-stage="${topic===5&&(!result||result.index<5)}" data-consequences="${topic>0}" data-consequence-kind="${consequence?.kind||'idle'}" data-lag="${lag}" data-lag-action="${result?.action||'idle'}" data-lag-return-version="${returned??''}" aria-label="Web ส่งคำสั่งไป Primary หรือ Replica ตามผลแบบจำลอง">

 <p class="replication-premise" ${topic===5?'hidden':''}>Client รับ IP จาก DNS → HTTP ผ่าน LB → Web tier<br>ภาพเคลื่อนไหวด้านล่างแสดงเฉพาะคำสั่ง DB / การส่งสำเนาที่แบบจำลองทำจริง</p>
 <div class="replication-map"><svg class="replication-wires" aria-hidden="true">${routes.map(([from,to],i)=>`<path class="replication-wire" data-from="${from}" data-to="${to}"/>${(lag&&(result.action==='write'||to==='web'))||(consequence&&(result.action==='write'||result.action==='sync'||to==='web'))?`<g class="replication-particle replication-data-token" data-route="${i}"><rect x="-19" y="-14" width="38" height="28" rx="7"/><text text-anchor="middle" y="5">v${consequence?s.versions[to==='web'?Number(from.split('-')[1]):s.writer]:to==='web'?returned:latest}</text></g>`:`<circle class="replication-particle" data-route="${i}" r="4" cx="0" cy="0"/>`}`).join('')}</svg>
 <div class="replication-node replication-web" data-node="web"><strong>Web tier</strong><span>เขียน → Primary · อ่าน → ${lag?'Replica':'สำเนาที่พร้อม'}</span></div>
 <div class="replication-pool">${s.versions.map((v,i)=>{const different=s.histories[i]!==s.histories[s.writer],lag=s.versions[s.writer]-v;return `<div class="replication-node ${!s.up[i]?'replication-offline':!different&&lag===0?'replication-ready':''}" data-node="db-${i}" data-db="${i}"><strong>${topic===0&&i===0?'Primary':dbName(i)}</strong><span>${topic===5&&i===0&&s.fenced?'fenced · ห้ามรับงานเขียน':i===s.writer?'บทบาท: Primary · อ่าน / เขียน':i===0&&s.writer!==0?'fenced · ห้ามรับงาน':'บทบาท: Replica · อ่าน'}</span><span>${s.up[i]?'พร้อมให้บริการ':'ล่ม · ไม่รับงาน'} · ${topic>0?`<b data-copy="${i}" data-before="${dataLabel(result?.before||s,i)}" data-final="${dataLabel(s,i)}">${dataLabel(s,i)}</b>`:topic===0?`<b data-lag-version="${i}" data-final="${v}" data-before="${result?.before?.versions[i]??v}">version ${v}</b>`:`version ${v}`}</span><span>${different?'คนละสายข้อมูล · ต้อง reconcile':lag>0?`ล้าหลัง ${lag} ขั้นเขียน`:lag<0?'มี version เดิมมากกว่า · ต้องตรวจข้อมูล':'ข้อมูลตรงกับ writer'}</span></div>`;}).join('')}</div></div>
 <div class="workload-actions"><div class="replication-experiments"></div><div class="workload-playback replication-playback"><button type="button" id="replication-replay" ${result?'':'disabled'}></button><button type="button" id="replication-pause" disabled aria-pressed="false"></button></div><div class="workload-feedback"><p id="replication-stage" role="status"></p><p id="replication-result" role="status">${topic===5&&result?replicationConsequence(result).title:result?.message||'ยังไม่ได้ทดลอง · กดทดลองเพื่อดูครบทุกขั้น'}</p></div></div>
 <figcaption>${topic===5?'การเปลี่ยน Primary และ sync เป็นขั้นจำลองที่สั่งชัดเจน · ไม่สลับเครื่องอัตโนมัติ และไม่รับประกันข้อมูลครบ':`version คือขั้นเขียน ไม่ใช่เวลา · ส่งสำเนาในขั้น sync ของการทดลองเท่านั้น ไม่ใช่ synchronous delivery หรือ automatic failover · สูญเสียตอน Promote ${s.lost} ขั้นเขียน`}</figcaption></figure>`;
}
let cleanup=()=>{};
export function stopReplicationPlayback(){cleanup();cleanup=()=>{};}
export function bindReplicationPlayback(main,play=false,{onPause=()=>{},isPaused=()=>false}={}){
 stopReplicationPlayback();const scene=main.querySelector('.replication-scene');if(!scene)return;
 const map=scene.querySelector('.replication-map'),svg=scene.querySelector('svg'),replay=scene.querySelector('#replication-replay'),pause=scene.querySelector('#replication-pause');
 setWorkloadIcon(replay,'replay','เล่นภาพซ้ำ');setWorkloadIcon(pause,'pause','พักภาพ');
 let resolveDone;const done=new Promise(resolve=>resolveDone=resolve);
 const media=matchMedia('(prefers-reduced-motion: reduce)');let animations=[];
 const lag=scene.dataset.lag==='true',isWrite=scene.dataset.lagAction==='write';
 // Snapshot metadata belongs to the retained scene, never an optional panel.
 const consequence=scene.querySelector('[data-consequence]'),hasConsequence=scene.dataset.consequences==='true';
 function commitConsequence(){if(!hasConsequence)return;result.textContent=finalMessage;if(consequence)consequence.dataset.phase='settled';scene.dataset.consequencePhase='settled';scene.querySelectorAll('[data-copy]').forEach(el=>el.textContent=el.dataset.final);}
 const result=scene.querySelector('#replication-result'),finalMessage=result.textContent;
 function phase(value){if(lag)scene.dataset.lagPhase=value;}
 function commit(){scene.querySelectorAll('[data-lag-version]').forEach(el=>el.textContent=`version ${el.dataset.final}`);phase(isWrite?'written':'returned');result.textContent=finalMessage;}

 function layout(){
  const base=map.getBoundingClientRect(),mobile=base.width<440;svg.setAttribute('viewBox',`0 0 ${base.width} ${base.height}`);
  const rect=id=>{const r=map.querySelector(`[data-node="${id}"]`).getBoundingClientRect();return {x:r.x-base.x,y:r.y-base.y,w:r.width,h:r.height};};
  [...svg.querySelectorAll('path')].forEach((wire,i)=>{
   const a=rect(wire.dataset.from),b=rect(wire.dataset.to),returning=wire.dataset.to==='web',sync=wire.dataset.from!=='web'&&!returning;
   const path=mobile?`M ${sync?a.x:a.x+a.w} ${a.y+a.h/2} H ${sync?8:base.width-8} V ${b.y+b.h/2} H ${sync?b.x:b.x+b.w}`:sync?`M ${a.x+a.w/2} ${a.y+a.h} V ${base.height-10-i*10} H ${b.x+b.w/2} V ${b.y+b.h}`:`M ${a.x+a.w/2} ${a.y+a.h} V ${(a.y+a.h+b.y)/2} H ${b.x+b.w/2} V ${b.y}`;
   const returnPath=mobile?`M ${a.x} ${a.y+a.h/2} H 8 V ${b.y+b.h/2} H ${b.x}`:`M ${a.x+a.w/2+12} ${a.y} V ${(b.y+b.h+a.y)/2-10} H ${b.x+b.w/2+12} V ${b.y+b.h}`;
   wire.setAttribute('d',returning?returnPath:path);svg.querySelector(`[data-route="${i}"]`).style.offsetPath=`path('${returning?returnPath:path}')`;
  });
 }
 const observer=new ResizeObserver(layout);observer.observe(map);layout();
 function settle(){if(hasConsequence&&scene.dataset.consequenceKind!=='idle')commitConsequence();if(lag&&scene.dataset.lagAction!=='idle')commit();resolveDone();scene.dataset.playback='finished';pause.disabled=true;setWorkloadIcon(pause,'pause','พักภาพ');pause.setAttribute('aria-pressed','false');}
 function start(){
  animations.forEach(a=>a.cancel());animations=[];setWorkloadIcon(pause,'pause','พักภาพ');pause.setAttribute('aria-pressed','false');
  if(media.matches){settle();return;}
  scene.dataset.playback='running';pause.disabled=false;
  if(lag){
   phase(isWrite?'writing':'reading');
   result.textContent=isWrite?'กำลังเขียนข้อมูลใหม่ → Primary':'กำลังอ่านจาก Replica · ยังไม่ได้รับผลกลับ';
   if(isWrite)scene.querySelectorAll('[data-lag-version]').forEach(el=>el.textContent=`version ${el.dataset.before}`);
  }
  if(hasConsequence){
   if(consequence)consequence.dataset.phase='active';scene.dataset.consequencePhase='active';scene.querySelectorAll('[data-copy]').forEach(el=>el.textContent=scene.dataset.recovery==='true'&&!svg.querySelector('[data-route]')?el.dataset.final:el.dataset.before);
   if(svg.querySelector('[data-route]'))result.textContent=scene.dataset.consequenceKind==='sync'?'กำลังส่งสำเนา · ยังไม่ครบเส้นทาง':scene.dataset.consequenceKind==='write'?'กำลังเขียน → Primary · ยังไม่ครบเส้นทาง':'กำลังอ่าน · ยังไม่มีผลกลับถึง Web tier';
  }
  const particles=[...svg.querySelectorAll('[data-route]')];
  animations=particles.map((p,i)=>p.animate([{offsetDistance:'0%',opacity:1},{offsetDistance:'100%',opacity:1}],{duration:animationTiming.lab05.routeMs,delay:(lag||hasConsequence)?i*animationTiming.lab05.routeMs:0,fill:(lag||hasConsequence)?'none':'forwards',easing:'linear'}));
  if(lag&&animations.length){
   const routes=animations.slice();
   routes[0].finished.then(()=>{if(!animations.includes(routes[0]))return;if(isWrite)commit();else{phase('returning');result.textContent='Replica ส่งข้อมูลเก่า v'+scene.dataset.lagReturnVersion+' กลับไป Web tier';}}).catch(()=>{});
   const last=routes.at(-1);
   last.finished.then(()=>{if(animations.includes(last))commit();}).catch(()=>{});
   animations.push(map.animate([{transform:'translateY(0)'},{transform:'translateY(0)'}],{duration:animationTiming.lab05.lagHoldMs,delay:routes.length*animationTiming.lab05.routeMs}));
  }
  if(hasConsequence){
   const routes=animations.slice(),delay=routes.length*animationTiming.lab05.routeMs;
   if(routes.length)routes.at(-1).finished.then(()=>{if(animations.includes(routes.at(-1)))commitConsequence();}).catch(()=>{});
   animations.push((consequence||map).animate([{transform:consequence?'translateY(8px)':'translateY(0)'},{transform:'translateY(0)'}],{duration:scene.dataset.guardStage==='true'?animationTiming.lab05.recoveryGuardMs:animationTiming.lab05.lagHoldMs,delay,easing:'ease-out'}));
  }
  if(!animations.length)animations=[map.animate([{opacity:1},{opacity:1}],{duration:900})];
  const current=animations;Promise.all(current.map(a=>a.finished)).then(()=>{if(animations===current)settle();}).catch(()=>{});
 }
 replay.onclick=start;pause.onclick=()=>{const pausing=!isPaused();onPause(pausing);animations.forEach(a=>pausing?a.pause():a.play());scene.dataset.playback=pausing?'paused':'running';setWorkloadIcon(pause,pausing?'play':'pause',pausing?'เล่นภาพต่อ':'พักภาพ');pause.setAttribute('aria-pressed',String(pausing));};
 const reduce=()=>{if(media.matches&&scene.dataset.playback!=='idle'){animations.forEach(a=>a.cancel());settle();}};media.addEventListener('change',reduce);
 cleanup=()=>{resolveDone();animations.forEach(a=>a.cancel());animations=[];observer.disconnect();media.removeEventListener('change',reduce);};if(play)start();return done;
}
