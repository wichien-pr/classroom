import {tierPages,tierFrames,createTierFlow} from './data-tier-flow.js';
import {setWorkloadIcon} from './workload-view.js';
import './data-tier-presentation.css';
import {singleTierScene} from './data-tier-single.js';
import './data-tier-single.css';
import {shardingScene,shardSteps} from './data-tier-sharding.js';
import './data-tier-sharding.css';

export function tierScene(frame){
 if(frame.index===0)return singleTierScene(frame);
 if(frame.index===1)return shardingScene(frame);
 throw Error('Unknown database page');
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
  throw Error('Unknown database page');
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
