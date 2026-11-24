import {animationTiming} from './animation-timing.js';
import {setWorkloadIcon} from './workload-view.js';
export const loggingTopics=[['ก่อนปล่อย · Build / Test / Deploy','run-pipeline','เลือก Version แล้วกดทดลองครั้งเดียว · เล่นซ้ำไม่บันทึกกิจกรรม'],['ดู Logs และ Metrics เคลื่อนไหว','','ข้อมูลจำลอง · ไม่บันทึกกิจกรรม']];
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function pipeline(stage){return ['build','test','deploy'].map((key,i)=>{const failed=stage==='blocked'&&i===1,passed=['built','tested','deployed'].indexOf(stage)>=i||stage==='blocked'&&i===0;return `<section class="logging-stage" data-stage="${key}" data-status="${failed?'failed':passed?'passed':'waiting'}"><strong>${['Build','Test','Deploy'][i]}</strong><span>${failed?'✕ ไม่ผ่าน':passed?'✓ ผ่านแล้ว':key==='deploy'?'🔒 รอ tests ผ่าน':'รอตรวจ'}</span></section>`;}).join('');}
export function loggingScene(s,f){
 const key=f?.key||'idle',stage=f?.before.stage||'ready';
 return `<figure class="logging-scene" data-playback="idle" data-stage="${key}" aria-label="ก่อนปล่อย · Build / Test / Deploy"><p class="logging-demo">DEMO · ไม่รัน Build / Test / Deploy จริง</p>
 <label class="logging-setup">Version ที่จะตรวจ · ตั้งค่าไม่บันทึกกิจกรรม<select id="logging-candidate"><option value="broken">v.1 · tests ไม่ผ่าน</option><option value="fixed">v.2 · tests ผ่าน</option></select></label>
 <div class="logging-progress"><strong>${f?esc(f.title):'กดทดลองเพื่อตรวจ Version ก่อนปล่อย'}</strong></div>
 <div class="logging-map"><div class="logging-code"><strong>${s.testsPass?'v.2':'v.1'}</strong><span>Automation · ตรวจเงื่อนไขก่อนปล่อย</span></div><div class="logging-stages">${pipeline(stage)}</div>
 <svg class="logging-wires" aria-hidden="true"><path/></svg><div class="logging-transit" hidden></div></div>
 <div class="workload-actions"><div class="logging-experiments"></div><button id="logging-pause" type="button" disabled></button><button id="logging-replay" type="button" disabled></button><div class="workload-feedback"><p id="logging-result" role="status">${f?esc(f.message):'ยังไม่ได้ทดลอง'}</p></div></div>
 <figcaption>Test ไม่ผ่านต้องหยุด Deploy · ผ่านแล้วจึงปล่อยได้ตามนโยบายตัวอย่าง ไม่รับประกันว่า production จะไม่มีปัญหา</figcaption></figure>`;
}
let cleanup=()=>{};
export function stopLoggingPlayback(){cleanup();cleanup=()=>{};}
export function bindLoggingPlayback(main,play=false,frame=null){
 stopLoggingPlayback();const scene=main.querySelector('.logging-scene');if(!scene)return;
 const map=scene.querySelector('.logging-map'),pause=scene.querySelector('#logging-pause'),token=scene.querySelector('.logging-transit'),svg=scene.querySelector('svg'),path=svg.querySelector('path');
 setWorkloadIcon(scene.querySelector('#logging-replay'),'replay','เล่นภาพซ้ำ');setWorkloadIcon(pause,'pause','พักภาพ');
 let animation,disposed=false,resolveDone,route=null;const done=new Promise(r=>resolveDone=r);
 const layout=()=>{if(!route)return;const base=map.getBoundingClientRect(),a=route[0].getBoundingClientRect(),b=route[1].getBoundingClientRect(),t=token.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${base.width} ${base.height}`);const horizontal=b.left>=a.right;const d=horizontal?`M ${a.right-base.x+t.width/2} ${a.y+a.height/2-base.y} L ${b.left-base.x-t.width/2} ${b.y+b.height/2-base.y}`:`M ${a.x+a.width/2-base.x} ${a.bottom-base.y+t.height/2} L ${b.x+b.width/2-base.x} ${b.top-base.y-t.height/2}`;path.setAttribute('d',d);token.style.offsetPath=`path('${d}')`;};
 const observer=new ResizeObserver(layout);observer.observe(map);
 async function wait(target,frames,duration){animation=target.animate(frames,{duration,easing:'linear',fill:'forwards'});try{await animation.finished;}catch{return false;}animation.cancel();return !disposed;}
 function settle(){token.hidden=true;scene.dataset.phase='settled';const stages=scene.querySelector('.logging-stages');if(stages)stages.innerHTML=pipeline(frame.state.stage);}
 async function start(){
  scene.dataset.playback='running';pause.disabled=false;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){settle();await new Promise(r=>setTimeout(r,30));if(!disposed)finish();return;}
  if(['blocked','tested','deployed'].includes(frame.key)){const nodes=scene.querySelectorAll('.logging-stage'),i=frame.key==='deployed'?1:0;route=[nodes[i],nodes[i+1]];token.textContent=frame.state.testsPass?'v.2':'v.1';}
  if(route){token.hidden=false;layout();scene.dataset.phase='transfer';if(!await wait(token,[{offsetDistance:'0%'},{offsetDistance:'100%'}],animationTiming.lab11.routeMs))return;}
  settle();scene.dataset.phase='reveal';const target=map;
  if(!await wait(target,[{transform:'translateY(8px)'},{transform:'translateY(0)'}],1500))return;
  scene.dataset.phase='settled';finish();
 }
 function finish(){scene.dataset.playback='finished';pause.disabled=true;resolveDone();}
 pause.onclick=()=>{const p=scene.dataset.playback==='running';p?animation?.pause():animation?.play();scene.dataset.playback=p?'paused':'running';pause.setAttribute('aria-pressed',String(p));setWorkloadIcon(pause,p?'play':'pause',p?'เล่นภาพต่อ':'พักภาพ');};
 cleanup=()=>{disposed=true;animation?.cancel();observer.disconnect();resolveDone();};if(play)start();return done;
}
