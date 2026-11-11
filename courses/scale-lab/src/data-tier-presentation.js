import {tierPages,tierFrames,createTierFlow} from './data-tier-flow.js';
import {tierStatus} from './database-scaling-view.js';
import {setWorkloadIcon} from './workload-view.js';
import './data-tier-presentation.css';
import {singleTierScene} from './data-tier-single.js';
import './data-tier-single.css';
import {shardingScene,shardSteps} from './data-tier-sharding.js';
import './data-tier-sharding.css';

const chips=ids=>ids.map(id=>`<span class="tier-row">${id}</span>`).join('')||'—';
export function tierScene(frame){
 const {config:c,result:r,index,phase}=frame,page=tierPages[index];
 const requests=c.traffic==='hotspot'?[...Array(13).fill(4),0,1,2]:Array.from({length:16},(_,i)=>i);
 const single=index===0;
 if(single)return singleTierScene(frame);
 if(index===1)return shardingScene(frame);
 const route=id=>c.mode==='vertical'?0:c.key==='country'?0:id%c.shards;
 return `<figure class="tier-scene" data-playback="idle" data-phase="ready" aria-label="Database capacity และแผน routing"><p class="tier-premise">${frame.situation}</p>${single?`<p class="tier-concentration">${r.rows.flat().length} แถว · ${r.total} คำขอ → Database เดียว</p>`:''}<p class="tier-phase">${page.configs.length>1?`ช่วง ${phase+1} / ${page.configs.length} · `:''}${frame.caption} · ${c.up?'เครื่องพร้อม':'เครื่องไม่พร้อม · ไม่มี failover'} · กำลัง ${r.capacity} หน่วย / เครื่อง</p><p class="tier-routing">${c.mode==='vertical'?'user 7 → Database':`${c.key==='user'?'user 7':'key 0'} % ${c.shards} → Shard ${r.target}`} · เป็นสูตรเลือกปลายทาง ไม่ยืนยันว่ามีข้อมูล</p><div class="tier-map">${r.rows.map((ids,i)=>{
 const keys=[...new Set(requests.filter(id=>route(id)===i))];
 return `<div class="tier-lane" data-shard="${i}"><div class="tier-source"><strong>คำขอ</strong><span>${keys.length>4?`u${keys[0]}–u${keys.at(-1)}`:keys.length?keys.map(id=>`u${id}${requests.filter(x=>x===id).length>1?' ×'+requests.filter(x=>x===id).length:''}`).join(' · '):'ไม่มี'}</span></div><div class="tier-route" aria-hidden="true"><svg><path/></svg><span class="tier-token" hidden title="${keys.map(id=>'user '+id).join(', ')}">u${keys[0]??'—'}${keys.length>1?'…':''}<br>${r.loads[i]} req</span></div><section class="tier-node" data-down="${!c.up}" data-target="${i===r.target}"><h4>${c.mode==='vertical'?'Database':'Shard '+i}</h4><div class="tier-rows" aria-label="แถวในแผน">${chips(ids)}</div><p class="tier-row-count">${ids.length} ${single?'แถวรวมที่เครื่องนี้':'แถวในแผน'}</p>${single?`<p class="tier-resource-label">ภาระที่ส่งมา ${r.loads[i]} หน่วย</p><div class="tier-demand" aria-label="ภาระ ${r.loads[i]} หน่วย">${Array.from({length:r.loads[i]},(_,j)=>`<i data-demand="${j}"></i>`).join('')}</div><p class="tier-resource-label">กำลังเครื่อง ${r.capacity} หน่วย · ${c.up?'พร้อม':'ไม่พร้อม'}</p>`:''}<div class="tier-capacity" aria-label="กำลัง ${r.capacity} หน่วย">${Array.from({length:r.capacity},(_,j)=>`<i data-unit="${j}"></i>`).join('')}</div><p class="tier-load" data-load="${r.loads[i]}">ภาระ — / ${r.capacity}</p><div class="tier-excess" hidden>เกินกำลัง ${Math.max(0,r.loads[i]-r.capacity)} หน่วย</div>${!c.up?'<strong class="tier-unavailable">ไม่พร้อม · ไม่ส่งคำขอสำเร็จ</strong>':''}</section></div>`;
 }).join('')}</div>${frame.sourceTopic===5?`<section class="tier-migration"><h4>ข้อมูลเดิมยังอยู่ที่ % 4 · ไม่ได้เคลื่อนย้าย</h4><div class="tier-original">${Array.from({length:4},(_,i)=>`<p>Shard ${i}: ${chips(Array.from({length:16},(_,id)=>id).filter(id=>id%4===i))}</p>`).join('')}</div><p class="tier-move-count">เปลี่ยนปลายทางในแผน ${r.moves.length} / 16 แถว</p><div class="tier-moves">${r.moves.map(m=>`<span>u${m.id}: ${m.from} → ${m.to}</span>`).join('')}</div></section>`:''}${single?'<aside class="tier-bridge"><strong>ทำไมต้อง Sharding?</strong><p>Scale Up ยังมีเพดานฮาร์ดแวร์และค่าใช้จ่าย → แบ่งข้อมูลและภาระงานไปหลายเครื่อง</p><span>หน้าถัดไป: แบ่งด้วย user_id ไม่ใช่สำเนาสำรอง · เพดานและราคาไม่ได้คำนวณในแบบจำลอง</span></aside>':''}<div class="tier-toolbar"><div class="tier-actions"></div><p id="tier-result" role="status">ยังไม่ได้ทดลอง · ภาพแสดงเงื่อนไข</p></div><figcaption>16 คำขอ / รอบ · 1 คำขอใช้กำลัง 1 หน่วย · กำลัง = 8 × ตัวคูณ เป็นสมมติฐาน ไม่ใช่ benchmark, latency, migration หรือการรับประกัน availability</figcaption></figure>`;
}

export function mountTierPresentation(main,{record,blocked,commit}){
 const find=s=>main.querySelector(s),lab=find('.lab'),architecture=find('#architecture');
 main.classList.add('topic-lesson');
 const topic=document.createElement('section');topic.id='lesson-topic';topic.dataset.kind='database-scaling';
 topic.innerHTML='<nav class="lesson-topic-nav" aria-label="หัวข้อการทดลอง"><button id="lesson-topic-back"></button><h3 id="lesson-topic-title" tabindex="-1"></h3><button id="lesson-topic-next"></button></nav>';
 lab.querySelector('.experiment')?.remove();lab.append(topic);topic.append(architecture);
 for(const selector of ['.control-area','.observation','#state-view','.event-area'])find(selector)?.remove();
 const actions=document.createElement('div');actions.className='tier-controls';
 actions.innerHTML='<button id="tier-run"></button><button id="tier-replay"></button><button id="tier-pause" disabled></button>';
 const [run,replay,pause]=actions.children;
 for(const [node,icon,label] of [[run,'play','ทดลองหน้านี้'],[replay,'replay','เล่นภาพซ้ำ'],[pause,'pause','พักภาพ'],[find('#lesson-topic-back'),'back','ย้อนกลับ'],[find('#lesson-topic-next'),'next','ถัดไป'],[find('#reset'),'reset','เริ่มการทดลองใหม่']])setWorkloadIcon(node,icon,label);
 let index=0,generation=0,animations=[],paused=false,disposed=false,cancelWait=()=>{},lastFrame=null;
 const stop=()=>{cancelWait();animations.forEach(a=>a.cancel());animations=[];paused=false;};
 const flow=createTierFlow({show:async(frame,actual)=>{if(actual)commit(frame);return show(frame,true);},record});
 function update(){if(disposed)return;run.disabled=blocked()||flow.busy;setWorkloadIcon(run,'play',flow.busy?'กำลังทดลอง':'ทดลองหน้านี้');replay.disabled=flow.busy;if(index===0&&find('.tier-scene')?.dataset.phase==='settled'&&!flow.busy&&!paused){pause.disabled=true;find('.tier-scene').dataset.playback='finished';}}
 function render(frame){
  stop();lastFrame=frame;architecture.innerHTML=tierScene(frame);find('.tier-actions').append(actions);
  const heading=find('#lesson-topic-title');heading.textContent=`${index+1} / ${tierPages.length} · ${tierPages[index].title}`;
  topic.dataset.topic=String(index);find('#lesson-topic-back').disabled=index===0;find('#lesson-topic-next').disabled=index===tierPages.length-1;
  pause.disabled=true;setWorkloadIcon(pause,'pause','พักภาพ');pause.setAttribute('aria-pressed','false');update();
 }
 async function wait(specs,duration){
  animations=specs.map(([el,frames])=>el.animate(frames,{duration,easing:'linear',fill:'forwards'}));
  if(paused)animations.forEach(a=>a.pause());
  let cancel;const canceled=new Promise(r=>cancel=r);cancelWait=()=>cancel(false);
  const result=await Promise.race([Promise.all(animations.map(a=>a.finished)).then(()=>true).catch(()=>false),canceled]);
  return result;
 }
 async function showComparison(frame,play){
  // The flow still commits/saves each original evaluation in order. Only the
  // first presentation callback plays the independent three-snapshot view.
  if(frame.phase>0){lastFrame=frame;return;}
  render(frame);if(!play)return;
  const epoch=generation,scene=find('.tier-scene'),frames=tierFrames(0);
  scene.dataset.playback='running';scene.dataset.phase='routing';pause.disabled=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const specs=[];
  scene.querySelectorAll('.tier-comparison').forEach((section,i)=>{
   const {config:c}=frames[i],node=section.querySelector('.tier-node');
   if(!c.up){specs.push([node,[{transform:'translateY(-5px)'},{transform:'translateY(0)'}]]);return;}
   const gap=section.querySelector('.tier-route'),token=section.querySelector('.tier-token'),svg=gap.querySelector('svg');
   if(reduced)return;token.hidden=false;
   const b=gap.getBoundingClientRect(),t=token.getBoundingClientRect();
   const d=`M ${b.width/2} ${t.height/2} L ${b.width/2} ${b.height-t.height/2}`;
   svg.setAttribute('viewBox',`0 0 ${b.width} ${b.height}`);svg.querySelector('path').setAttribute('d',d);token.style.offsetPath=`path('${d}')`;
   specs.push([token,[{offsetDistance:'0%'},{offsetDistance:'100%'}]]);
  });
  if(!reduced&&(!await wait(specs,1500)||epoch!==generation))return;
  scene.querySelectorAll('.tier-comparison').forEach((section,i)=>{
   const {result:r,config:c}=frames[i];
   section.querySelectorAll('[data-demand]').forEach((unit,j)=>unit.dataset.excess=String(c.up&&j>=r.capacity));
   section.querySelector('.tier-excess').hidden=!c.up||r.total<=r.capacity;
   section.querySelector('.tier-token').hidden=true;
  });
  find('#tier-result').textContent='งานเท่าเดิม · Scale Up เพิ่มกำลัง แต่ยังเป็นเครื่องเดียว';
  scene.dataset.phase='capacity';animations.forEach(a=>a.cancel());animations=[];
  if(!reduced&&(!await wait([...scene.querySelectorAll('.tier-capacity')].map(el=>[el,[{transform:'translateY(4px)'},{transform:'translateY(0)'}]]),900)||epoch!==generation))return;
  scene.dataset.phase='settled';scene.dataset.playback='finished';pause.disabled=!flow.busy;
 }
 async function showSharding(frame,play){
  render(frame);if(!play)return;
  const epoch=generation,scene=find('.tier-scene'),r=frame.result;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lanes=[...scene.querySelectorAll('.tier-lane')];
  scene.dataset.playback='running';scene.dataset.phase='placement';pause.disabled=false;
  const travel=async(groups,placement)=>{
   const specs=[];
   animations.forEach(a=>a.cancel());animations=[];
   lanes.forEach((lane,i)=>{
    const token=lane.querySelector('.tier-token'),ids=groups[i];token.hidden=!ids.length;
    if(!ids.length)return;
    token.textContent=placement?`${ids.length} แถว`:ids.every(id=>id===ids[0])?`u${ids[0]}${ids.length>1?' ×'+ids.length:''}`:ids.map(id=>'u'+id).join(' ');
    token.dataset.kind=placement?'rows':'request';
    const gap=lane.querySelector('.tier-route'),b=gap.getBoundingClientRect(),t=token.getBoundingClientRect();
    const d=`M ${t.width/2} ${b.height/2} L ${b.width-t.width/2} ${b.height/2}`;
    const svg=gap.querySelector('svg');svg.setAttribute('viewBox',`0 0 ${b.width} ${b.height}`);svg.querySelector('path').setAttribute('d',d);token.style.offsetPath=`path('${d}')`;
    specs.push([token,[{offsetDistance:'0%'},{offsetDistance:'100%'}]]);
   });
   if(!reduced&&(!await wait(specs,placement?1200:1000)||epoch!==generation))return false;
   lanes.forEach(l=>l.querySelector('.tier-token').hidden=true);return epoch===generation;
  };
  if(!await travel(r.rows,true))return;
  scene.dataset.phase='requests';
  for(const [round,step] of shardSteps(frame).entries()){
   scene.querySelector('.shard-stage').textContent=`2 · ส่งคำขอ ${round*4+1}–${round*4+4} / ${r.total}`;
   if(!await travel(step.requests,false))return;
   lanes.forEach((lane,i)=>{
    lane.querySelector('.tier-load').textContent=`ภาระ ${step.loads[i]} / ${r.capacity}`;
    lane.querySelectorAll('.tier-capacity i').forEach((unit,j)=>unit.dataset.filled=String(j<step.loads[i]));
    const excess=lane.querySelector('.tier-excess');excess.hidden=step.loads[i]<=r.capacity;excess.textContent=`เกินกำลัง ${Math.max(0,step.loads[i]-r.capacity)} หน่วย`;
   });
  }
  scene.dataset.phase='capacity';scene.querySelector('.shard-stage').textContent=`3 · รวม ${r.total} คำขอ · ดูภาระแต่ละเครื่อง`;
  find('#tier-result').textContent=frame.takeaway;
  if(!reduced&&(!await wait([[scene.querySelector('.shard-stage'),[{transform:'translateY(3px)'},{transform:'translateY(0)'}]]],1600)||epoch!==generation))return;
  scene.dataset.phase='settled';const last=frame.phase===tierPages[frame.index].configs.length-1;scene.dataset.playback=last?'finished':'running';pause.disabled=last;
 }
 async function show(frame,play){
  if(frame.index===1)return showSharding(frame,play);
  if(frame.index===0)return showComparison(frame,play);
  render(frame);const epoch=generation,scene=find('.tier-scene'),r=frame.result,c=frame.config;
  if(!play)return;
  scene.dataset.playback='running';pause.disabled=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const settle=()=>{scene.querySelectorAll('.tier-node').forEach((node,i)=>{
   if(frame.index!==0)node.querySelector('.tier-load').textContent=`ภาระ ${r.loads[i]} / ${r.capacity}`;
   node.querySelectorAll('[data-unit]').forEach((unit,j)=>unit.dataset.filled=String(j<Math.min(r.loads[i],r.capacity)));
   node.querySelectorAll('[data-demand]').forEach((unit,j)=>unit.dataset.excess=String(c.up&&j>=r.capacity));
   node.querySelector('.tier-excess').hidden=r.loads[i]<=r.capacity;
  });scene.querySelectorAll('.tier-token').forEach(t=>t.hidden=true);
  find('#tier-result').textContent=frame.index===0?(c.up?(r.total>r.capacity?`งาน ${r.total} > กำลัง ${r.capacity} · เครื่องเดียวรับไม่ไหว`:`งานเท่าเดิม · เพิ่มกำลังเป็น ${r.capacity} แล้วรับไหว`):'เครื่องไม่พร้อม · ต้องออกแบบ replication และ failover แยกต่างหาก'):`${tierStatus(r.status)} · ${frame.takeaway}`;};
  if(!reduced&&c.up){
   const specs=[];scene.dataset.phase='routing';
   for(const lane of scene.querySelectorAll('.tier-lane')){
    const i=Number(lane.dataset.shard);if(!r.loads[i])continue;
    const gap=lane.querySelector('.tier-route'),token=lane.querySelector('.tier-token'),svg=gap.querySelector('svg');token.hidden=false;
    const box=gap.getBoundingClientRect(),t=token.getBoundingClientRect(),vertical=frame.index===0&&getComputedStyle(lane).gridTemplateColumns.split(' ').length===1;
    const d=vertical?`M ${box.width/2} ${t.height/2} L ${box.width/2} ${box.height-t.height/2}`:`M ${t.width/2} ${box.height/2} L ${box.width-t.width/2} ${box.height/2}`;
    svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);svg.querySelector('path').setAttribute('d',d);token.style.offsetPath=`path('${d}')`;
    specs.push([token,[{offsetDistance:'0%'},{offsetDistance:'100%'}]]);
   }
   if(!await wait(specs,1500)||epoch!==generation)return;
  }
  settle();scene.dataset.phase=c.up?'capacity':'unavailable';
  if(!reduced){
   const specs=[...scene.querySelectorAll(c.up?'.tier-capacity':'.tier-node')].map(el=>[el,c.up?(frame.index===0?[{transform:'none'},{transform:'none'}]:[{transform:'scaleX(0)',transformOrigin:'left'},{transform:'scaleX(1)',transformOrigin:'left'}]):[{transform:'translateY(-5px)'},{transform:'translateY(0)'}]]);
   if(!await wait(specs,c.up?(frame.index===0?2200:900):1500)||epoch!==generation)return;
  }
  const last=frame.phase===tierPages[frame.index].configs.length-1;
  scene.dataset.phase='settled';scene.dataset.playback=last?'finished':'running';pause.disabled=last;
 }
 async function select(next,play=true){
  if(next<0||next>=tierPages.length)return;
  generation++;flow.cancel();stop();index=next;
  if(play)await flow.play(index);else render(tierFrames(index)[0]);
 }
 run.onclick=async()=>{
  if(blocked()||flow.busy)return;
  generation++;stop();const epoch=generation;
  try{const pending=flow.run(index);update();await pending;}catch(error){if(epoch===generation)find('#tier-result').textContent=error.message;}
  finally{if(epoch===generation){update();if(document.activeElement===document.body&&!run.disabled)run.focus({preventScroll:true});}}
 };
 replay.onclick=()=>{if(!flow.busy)select(index,true);};
 pause.onclick=()=>{paused=!paused;flow.setPaused(paused);animations.forEach(a=>paused?a.pause():a.play());find('.tier-scene').dataset.playback=paused?'paused':'running';setWorkloadIcon(pause,paused?'play':'pause',paused?'เล่นภาพต่อ':'พักภาพ');pause.setAttribute('aria-pressed',String(paused));};
 find('#lesson-topic-back').onclick=()=>select(index-1);
 find('#lesson-topic-next').onclick=()=>select(index+1);
 select(0,false);
 return {update,dispose(){disposed=true;generation++;flow.cancel();stop();},get frame(){return lastFrame;}};
}
