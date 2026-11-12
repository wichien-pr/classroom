import {loggingTopics} from './logging-presentation.js';
import {queueTopics} from './queue-presentation.js';
import {dcTopics} from './dc-presentation.js';
import {webTopics} from './web-presentation.js';
import {cdnTopics} from './cdn-presentation.js';
import {cacheTopics} from './cache-presentation.js';
import {replicationTopics} from './replication-presentation.js';
import {setWorkloadIcon} from './workload-view.js';
// Course-owned presentation layer. Navigation never calls simulator actions.
// LAB02 explicitly prepares fixed scenarios; other labs retain their inputs.
export const lessonTopics={
 workload:[
  ['แยกทรัพยากร Web และ Data','estimate'],
  ['ทรัพยากรร่วมในเครื่องเดียว','estimate'],
  ['Web เพิ่ม แต่ Database ล่ม','estimate'],
  ['เลือกฐานข้อมูลตามงาน','estimate'],
 ],
 stock:[
  ['โหลดเกินกำลังเริ่มต้น','scale-power scale-servers scale-traffic order'],
  ['Scale up เครื่องเดิม','scale-power scale-traffic order'],
  ['หลายเครื่อง แต่ยังต่อเครื่องเดิม','scale-down scale-servers scale-balanced order'],
  ['กระจายไปเครื่องที่พร้อม','order'],
  ['โหลดเกินกำลังรวม','order'],
 ],
 balance:[
  ['Round-robin ระหว่างสองเครื่อง','up-a up-b up-c route'],
  ['เครื่องแรกหยุดรับงาน','up-a up-b route'],
  ['เมื่อไม่มีเครื่องพร้อม','up-a up-b up-c route'],
  ['เพิ่มเครื่องเข้ารับงาน','up-a up-b up-c route'],
 ],
 replica:replicationTopics,
 cache:cacheTopics,
 cdn:cdnTopics,
 'stateless-web':webTopics,
 'data-centers':dcTopics,
 'message-queue':queueTopics,
 'logging-operations':loggingTopics,
 'database-scaling':[
  ['ภาระเกินกำลังเครื่องเดียว','tier-mode tier-power evaluate-data-tier'],
  ['เพิ่มกำลัง ไม่ได้ป้องกันเครื่องล่ม','tier-power tier-up evaluate-data-tier'],
  ['แบ่งข้อมูลด้วย user_id','tier-up tier-power tier-mode tier-shards tier-key tier-user evaluate-data-tier'],
  ['แถวเท่ากัน แต่งานกระจุก','tier-traffic evaluate-data-tier'],
  ['Key ที่ทำให้ข้อมูลกระจุก','tier-traffic tier-key evaluate-data-tier'],
  ['เปลี่ยนจำนวน shards ไม่ใช่ย้ายข้อมูล','tier-key tier-shards tier-user evaluate-data-tier'],
 ],
};

// Renderers replace diagram children; move their fresh result nodes without
// altering simulator state. All other lessons retain their original full diagram.
export function refreshLessonTopicResults(main){
 const results=main.querySelector('#lesson-topic-results');if(!results)return;
 const panels=main.querySelector('#architecture .logging-panels');if(!panels)return;
 const sections=[...panels.querySelectorAll(':scope > section')];
 if(sections.length)results.replaceChildren(...sections);
}

export function mountLessonTopics(main,kind,onWorkloadTopic=()=>{}){
 const topics=lessonTopics[kind];if(!topics)return;
 const find=s=>main.querySelector(s),lab=find('.lab'),steps=lab.querySelector('.experiment');
 if(kind==='stateless-web'){const item=document.createElement('li');item.textContent=webTopics[6][2];steps.querySelector('ol').append(item);}
 const items=[...steps.querySelectorAll('ol > li')];
 if(items.length!==topics.length)throw new Error(`Topic/instruction mismatch: ${kind}`);
 main.classList.add('topic-lesson');
 const topic=document.createElement('section');topic.id='lesson-topic';topic.dataset.kind=kind;topic.setAttribute('aria-labelledby','lesson-topic-title');
 steps.replaceWith(topic);topic.append(steps);
 const heading=document.createElement('h3');heading.id='lesson-topic-title';heading.tabIndex=-1;steps.prepend(heading);
 const controls=find('.control-area'),observation=find('.observation');
 controls.querySelector('h3').textContent='ลงมือทดลอง';if(observation)observation.querySelector('h3').textContent='ผลจากการกดล่าสุด · คงอยู่เมื่อเปลี่ยนหัวข้อ';
 topic.append(find('#architecture'),controls,...(observation?[observation]:[]),find('#state-view'));

 const more=document.createElement('button');more.type='button';more.id='lesson-topic-settings';more.setAttribute('aria-expanded','false');controls.append(more);
 const navigation=document.createElement('nav');navigation.className='lesson-topic-nav';navigation.setAttribute('aria-label','หัวข้อการทดลอง');
 navigation.innerHTML='<button type="button" id="lesson-topic-back" aria-controls="lesson-topic">← ย้อนกลับ · Back</button><button type="button" id="lesson-topic-next" aria-controls="lesson-topic">ถัดไป · Next →</button>';
 topic.append(navigation);
 if(!['workload','stock','balance','replica','cache','cdn','stateless-web','data-centers','message-queue','logging-operations'].includes(kind)){
 const note=document.createElement('p');note.className='lesson-topic-note';note.textContent='ข้ามด้วย Next ได้ · ไม่เพิ่มคะแนนหรือทำให้เรียนจบ · สถานะเดิมยังอยู่ หากข้ามขั้น ให้ปรับเงื่อนไขหรือทำขั้นก่อนหน้าด้วยตนเอง';topic.append(note);
 const history=document.createElement('details');history.className='lesson-topic-history';history.innerHTML='<summary>บันทึกเหตุการณ์และข้อจำกัด</summary>';history.append(find('.event-area'));
 for(const p of steps.querySelectorAll('.lesson-step-note,.web-step-note'))history.append(p);
 topic.after(history);
 }else steps.querySelectorAll('.lesson-step-note,.web-step-note').forEach(node=>node.remove());
 if(kind==='workload'){
  // Move the existing controls and heading, preserving their listeners and ID.
  setWorkloadIcon(find('#lesson-topic-back'),'back','ย้อนกลับ');
  setWorkloadIcon(find('#lesson-topic-next'),'next','ถัดไป');
  setWorkloadIcon(find('#reset'),'reset','เริ่มการทดลองใหม่');
  navigation.firstElementChild.after(heading);
  topic.prepend(navigation);
  find('#architecture').before(controls);
  // LAB02 keeps its live scenario and controls, not a duplicate instruction strip.
  // The heading has already moved into navigation; remove the whole container.
  steps.remove();
  more.remove();
  controls.querySelectorAll('label,fieldset').forEach(node=>node.remove());
  const scenario=document.createElement('p');scenario.id='workload-scenario';scenario.setAttribute('aria-label','สถานการณ์ที่กำหนด');controls.append(scenario);
  setWorkloadIcon(find('#estimate'),'play','ทดลอง');
  controls.querySelector('h3').textContent='สถานการณ์ของหัวข้อนี้';

 }
 if(kind==='stock'||kind==='balance'){
  setWorkloadIcon(find('#lesson-topic-back'),'back','ย้อนกลับ');setWorkloadIcon(find('#lesson-topic-next'),'next','ถัดไป');setWorkloadIcon(find('#reset'),'reset','เริ่มการทดลองใหม่');
  navigation.firstElementChild.after(heading);topic.prepend(navigation);
  const action=find(kind==='stock'?'#order':'#route');setWorkloadIcon(action,'play','ทดลอง');topic.append(action);
  controls.remove();observation?.remove();find('#state-view').remove();find('.event-area')?.remove();more.remove();
 }
 if(kind==='replica'){
  setWorkloadIcon(find('#lesson-topic-back'),'back','ย้อนกลับ');setWorkloadIcon(find('#lesson-topic-next'),'next','ถัดไป');setWorkloadIcon(find('#reset'),'reset','เริ่มการทดลองใหม่');
  navigation.firstElementChild.after(heading);topic.prepend(navigation);
  const retained=document.createElement('div');retained.className='replication-retained';
  const action=document.createElement('button');action.id='replication-run';action.type='button';action.dataset.replicationLabel='ทดลอง';setWorkloadIcon(action,'play','ทดลอง');retained.append(action);
  topic.append(retained);controls.remove();observation?.remove();find('#state-view').remove();find('.event-area')?.remove();more.remove();
  items.forEach((item,i)=>item.textContent=replicationTopics[i][2]);
 }
 if(kind==='logging-operations'){
  setWorkloadIcon(find('#lesson-topic-back'),'back','ย้อนกลับ');setWorkloadIcon(find('#lesson-topic-next'),'next','ถัดไป');setWorkloadIcon(find('#reset'),'reset','เริ่มการทดลองใหม่');
  navigation.firstElementChild.after(heading);topic.prepend(navigation);
  const retained=document.createElement('div');retained.className='logging-retained';
  const action=document.createElement('button');action.id='logging-run';action.type='button';action.dataset.loggingLabel='ทดลอง';setWorkloadIcon(action,'play','ทดลอง');retained.append(action);
  topic.append(retained);controls.remove();observation?.remove();find('#state-view').remove();find('.event-area')?.remove();more.remove();
  steps.remove();
  heading.textContent=loggingTopics[0][0];
  onWorkloadTopic(0);return;
 }
 if(kind==='message-queue'){
  setWorkloadIcon(find('#lesson-topic-back'),'back','ย้อนกลับ');setWorkloadIcon(find('#lesson-topic-next'),'next','ถัดไป');setWorkloadIcon(find('#reset'),'reset','เริ่มการทดลองใหม่');
  navigation.firstElementChild.after(heading);topic.prepend(navigation);
  const retained=document.createElement('div');retained.className='queue-retained';
  const action=document.createElement('button');action.id='queue-run';action.type='button';action.dataset.queueLabel='ทดลอง';setWorkloadIcon(action,'play','ทดลอง');retained.append(action);
  topic.append(retained);controls.remove();observation?.remove();find('#state-view').remove();find('.event-area')?.remove();more.remove();
  items.forEach((item,i)=>item.textContent=queueTopics[i][2]);
 }
 if(kind==='cache'){
  setWorkloadIcon(find('#lesson-topic-back'),'back','ย้อนกลับ');setWorkloadIcon(find('#lesson-topic-next'),'next','ถัดไป');setWorkloadIcon(find('#reset'),'reset','เริ่มการทดลองใหม่');
  navigation.firstElementChild.after(heading);topic.prepend(navigation);
  const retained=document.createElement('div');retained.className='cache-retained';
  const action=document.createElement('button');action.id='cache-run';action.type='button';action.dataset.cacheLabel='ทดลอง';setWorkloadIcon(action,'play','ทดลอง');retained.append(action);
  topic.append(retained);controls.remove();observation?.remove();find('#state-view').remove();find('.event-area')?.remove();more.remove();
  items.forEach((item,i)=>item.textContent=cacheTopics[i][2]);
 }
 if(kind==='stateless-web'){
  setWorkloadIcon(find('#lesson-topic-back'),'back','ย้อนกลับ');setWorkloadIcon(find('#lesson-topic-next'),'next','ถัดไป');setWorkloadIcon(find('#reset'),'reset','เริ่มการทดลองใหม่');
  navigation.firstElementChild.after(heading);topic.prepend(navigation);
  const retained=document.createElement('div');retained.className='web-retained';
  const action=document.createElement('button');action.id='web-run';action.type='button';action.dataset.webLabel='ทดลอง';setWorkloadIcon(action,'play','ทดลอง');retained.append(action);
  topic.append(retained);controls.remove();observation?.remove();find('#state-view').remove();find('.event-area')?.remove();more.remove();
  items.forEach((item,i)=>item.textContent=webTopics[i][2]);
 }
 if(kind==='data-centers'){
  setWorkloadIcon(find('#lesson-topic-back'),'back','ย้อนกลับ');setWorkloadIcon(find('#lesson-topic-next'),'next','ถัดไป');setWorkloadIcon(find('#reset'),'reset','เริ่มการทดลองใหม่');
  navigation.firstElementChild.after(heading);topic.prepend(navigation);
  const retained=document.createElement('div');retained.className='dc-retained';
  const action=document.createElement('button');action.id='dc-run';action.type='button';action.dataset.dcLabel='ทดลอง';setWorkloadIcon(action,'play','ทดลอง');retained.append(action);
  topic.append(retained);controls.remove();observation?.remove();find('#state-view').remove();find('.event-area')?.remove();more.remove();
  items.forEach((item,i)=>item.textContent=dcTopics[i][2]);
 }
 if(kind==='cdn'){
  setWorkloadIcon(find('#lesson-topic-back'),'back','ย้อนกลับ');setWorkloadIcon(find('#lesson-topic-next'),'next','ถัดไป');setWorkloadIcon(find('#reset'),'reset','เริ่มการทดลองใหม่');
  navigation.firstElementChild.after(heading);topic.prepend(navigation);
  const retained=document.createElement('div');retained.className='cdn-retained';
  const action=document.createElement('button');action.id='cdn-run';action.type='button';action.dataset.cdnLabel='ทดลอง';setWorkloadIcon(action,'play','ทดลอง');retained.append(action);
  topic.append(retained);controls.remove();observation?.remove();find('#state-view').remove();find('.event-area')?.remove();more.remove();
  items.forEach((item,i)=>item.textContent=cdnTopics[i][2]);
 }
 if(kind==='balance'){
  const instructions=['กดทดลองหลายครั้ง ดูคำขอสลับระหว่าง App A และ B · App C ยังไม่ลงทะเบียน','กดทดลอง เมื่อ App A ล่ม คำขอใหม่ไป App B ที่ยังพร้อม','กดทดลอง เมื่อ A และ B ล่ม และ C ยังไม่ลงทะเบียน ดูผล 503 โดยไม่มี server รับคำขอ','กดทดลองหลายครั้ง เมื่อ App C ลงทะเบียนและผ่าน health check แล้ว คำขอสลับไป B และ C แทน A ที่ล่ม'];
  items.forEach((item,i)=>item.textContent=instructions[i]);
 }
 // LAB03–08 retain their live heading, scenario diagram and controls only.
 // Remove after the heading has moved; show() never remounts this container.
 if(['stock','balance','replica','cache','cdn','stateless-web'].includes(kind))steps.remove();
 const leaves=[...controls.querySelectorAll('.controls input,.controls select,.controls button')].map(el=>({el,node:el.closest('label')||el}));
 const containers=[...controls.querySelectorAll('fieldset,.lesson-submit,.web-submit,.web-scenario')];
 let index=0,expanded=false;
 function show(focus=false){
  topic.dataset.topic=String(index);
  heading.textContent=`${index+1} / ${topics.length} · ${topics[index][0]}`;
  items.forEach((item,i)=>{item.hidden=i!==index;item.value=i+1;});
  const visible=new Set(topics[index][1].split(' '));
  leaves.forEach(({el,node})=>node.hidden=!expanded&&!visible.has(el.id));
  containers.forEach(node=>node.hidden=![...node.querySelectorAll('input,select,button')].some(el=>!el.hidden&&!el.closest('label')?.hidden));
  more.textContent=kind==='workload'?(expanded?'ซ่อนการตั้งค่าเพิ่มเติม':'ตั้งค่าเพิ่มเติม'):(expanded?'ซ่อนตัวตั้งค่าอื่น':'ปรับเงื่อนไขอื่น / เตรียมขั้นที่ข้าม');more.setAttribute('aria-expanded',String(expanded));
  find('#lesson-topic-back').disabled=index===0;find('#lesson-topic-next').disabled=index===topics.length-1;
  if(['workload','stock','balance','replica','cache','cdn','stateless-web','data-centers','message-queue','logging-operations'].includes(kind))onWorkloadTopic(index);
  if(focus){heading.focus({preventScroll:true});topic.scrollIntoView({block:'start',behavior:'instant'});}
 }
 find('#lesson-topic-back').onclick=()=>{if(index>0){index--;expanded=false;show(true);}};
 find('#lesson-topic-next').onclick=()=>{if(index<topics.length-1){index++;expanded=false;show(true);}};
 more.onclick=()=>{expanded=!expanded;show();};
 show();
}
