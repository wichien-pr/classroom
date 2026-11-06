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
 replica:[
  ['เขียนแล้วสำเนายังตามไม่ทัน','write read-replica'],
  ['เทียบ Primary แล้วเดิน replication','read-primary sync read-replica'],
  ['Replica ล่มและเส้นทางสำรอง','db-up-1 db-up-2 read-replica'],
  ['Primary ล่ม ต้องหยุดเขียน','db-up-0 db-up-1 db-up-2 sync write'],
  ['เงื่อนไขก่อน Promote','db-up-0 db-up-1 db-up-2 fenced accept-loss promote write read-primary'],
 ],
 cache:[
  ['อ่านครั้งแรกและอ่านซ้ำ','read-cache'],
  ['ต้นทางเปลี่ยน แต่สำเนายังเก่า','price update read-cache'],
  ['ลบสำเนาแล้วโหลดใหม่','invalidate read-cache'],
  ['เวลาและอายุสำเนา','cache-tick read-cache'],
  ['Cache ล่มและกลับมาใหม่','cache-outage cache-restart read-cache'],
 ],
 cdn:[
  ['MISS แล้ว HIT','decision'],
  ['เปลี่ยน Origin ไม่ได้เปลี่ยนสำเนาทันที','cdn-publish decision'],
  ['สำเนาหมดอายุตาม TTL','cdn-ttl cdn-tick decision'],
  ['Invalidate key ปัจจุบัน','cdn-publish cdn-invalidate decision'],
  ['URL รุ่นใหม่และ cache key','cdn-query cdn-publish cdn-version decision'],
  ['CDN ล่มกับทางสำรอง','cdn-up cdn-origin-up cdn-fallback decision'],
 ],
 'stateless-web':[
  ['Session อยู่คนละเครื่อง','web-mode web-target web-request'],
  ['Sticky กลับเครื่องเดิม','web-sticky web-target web-request'],
  ['Shared store ใช้สถานะร่วมกัน','web-mode web-sticky web-target web-request'],
  ['Web ล่ม แต่สถานะยังอยู่','web-up-0 web-up-1 web-target web-request'],
  ['เพิ่ม Web เข้าสู่ pool','web-up-2 web-target web-request'],
  ['Shared store ล่ม','web-store web-target web-request'],
 ],
 'data-centers':[
  ['แบ่งผู้ใช้ระหว่างสองศูนย์','dc-share dc-east-up dc-west-up dc-request'],
  ['ศูนย์หนึ่งล่ม','dc-west-up dc-request'],
  ['เปลี่ยนเส้นทาง แต่ DNS ยังเก่า','dc-redirect dc-fresh-dns dc-request'],
  ['ผู้ใช้ได้รับปลายทางใหม่','dc-fresh-dns dc-request'],
  ['ข้อมูลต้องพร้อมที่ปลายทาง','dc-synced dc-request'],
  ['ตรวจความจุศูนย์สำรอง','dc-east-capacity dc-west-capacity dc-request'],
  ['รุ่นบริการต้องสอดคล้อง','dc-same-release dc-request'],
 ],
 'message-queue':[
  ['ส่งเข้าคิว ยังไม่ใช่งานสำเร็จ','mq-type enqueue-jobs'],
  ['Worker หยุด แต่ยังรับงานได้','mq-consumer enqueue-jobs process-jobs'],
  ['Producer หยุด แต่งานเก่ายังเดินต่อ','mq-consumer mq-producer process-jobs'],
  ['งานเข้าเร็วกว่างานออก','mq-producer mq-type enqueue-jobs process-jobs'],
  ['เพิ่ม Workers ลดงานค้าง','mq-workers process-jobs'],
  ['ระบายคิวและเริ่มใหม่','mq-workers process-jobs'],
 ],
 'logging-operations':[
  ['Logs เครื่องเดียวบอกอะไร','log-scope log-level inspect-logs'],
  ['ค้นเหตุการณ์ข้ามบริการ','log-scope log-level inspect-logs'],
  ['Metrics สามระดับ','metric-group inspect-metrics'],
  ['Tests ไม่ผ่าน ต้องหยุด deploy','code-version run-pipeline'],
  ['รุ่นที่ผ่าน Build → Test → Deploy','code-version run-pipeline'],
  ['Pipeline จบแล้วไม่มีขั้นใหม่','code-version run-pipeline'],
 ],
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
 const items=[...steps.querySelectorAll('ol > li')];
 if(items.length!==topics.length)throw new Error(`Topic/instruction mismatch: ${kind}`);
 main.classList.add('topic-lesson');
 const topic=document.createElement('section');topic.id='lesson-topic';topic.dataset.kind=kind;topic.setAttribute('aria-labelledby','lesson-topic-title');
 steps.replaceWith(topic);topic.append(steps);
 const heading=document.createElement('h3');heading.id='lesson-topic-title';heading.tabIndex=-1;steps.prepend(heading);
 const controls=find('.control-area'),observation=find('.observation');
 controls.querySelector('h3').textContent='ลงมือทดลอง';if(observation)observation.querySelector('h3').textContent='ผลจากการกดล่าสุด · คงอยู่เมื่อเปลี่ยนหัวข้อ';
 topic.append(find('#architecture'),controls,...(observation?[observation]:[]),find('#state-view'));
 if(kind==='logging-operations'){
  const results=document.createElement('div');results.id='lesson-topic-results';observation.after(results);
 }
 const more=document.createElement('button');more.type='button';more.id='lesson-topic-settings';more.setAttribute('aria-expanded','false');controls.append(more);
 const navigation=document.createElement('nav');navigation.className='lesson-topic-nav';navigation.setAttribute('aria-label','หัวข้อการทดลอง');
 navigation.innerHTML='<button type="button" id="lesson-topic-back" aria-controls="lesson-topic">← ย้อนกลับ · Back</button><button type="button" id="lesson-topic-next" aria-controls="lesson-topic">ถัดไป · Next →</button>';
 topic.append(navigation);
 if(!['workload','stock'].includes(kind)){
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
  const instructions=[
   'กดทดลอง ดูว่า Web 3 หน่วย และ Data 1 หน่วย แยกทรัพยากรกัน',
   'กดทดลอง เปรียบเทียบกับหัวข้อก่อน: Web และ Data ใช้ 3 หน่วยร่วมกันในเครื่องเดียว',
   'กดทดลอง แม้เพิ่ม Web เป็น 4 หน่วย ก็ยังอ่านข้อมูลไม่ได้เมื่อ Database ล่ม',
   'กดทดลอง 3 ครั้ง: คำสั่งซื้อ / SQL → Session / SQL → Session / Key-value แล้วเปรียบเทียบเหตุผล',
  ];
  items.forEach((item,i)=>item.textContent=instructions[i]);
  more.remove();
  controls.querySelectorAll('label,fieldset').forEach(node=>node.remove());
  const scenario=document.createElement('p');scenario.id='workload-scenario';scenario.setAttribute('aria-label','สถานการณ์ที่กำหนด');controls.append(scenario);
  setWorkloadIcon(find('#estimate'),'play','ทดลอง');
  controls.querySelector('h3').textContent='สถานการณ์ของหัวข้อนี้';

 }
 if(kind==='stock'){
  setWorkloadIcon(find('#lesson-topic-back'),'back','ย้อนกลับ');setWorkloadIcon(find('#lesson-topic-next'),'next','ถัดไป');setWorkloadIcon(find('#reset'),'reset','เริ่มการทดลองใหม่');
  navigation.firstElementChild.after(heading);topic.prepend(navigation);
  const action=find('#order');setWorkloadIcon(action,'play','ทดลอง');topic.append(action);
  controls.remove();observation?.remove();find('#state-view').remove();find('.event-area')?.remove();more.remove();
 }
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
  if(['workload','stock'].includes(kind))onWorkloadTopic(index);
  if(focus){heading.focus({preventScroll:true});topic.scrollIntoView({block:'start',behavior:'instant'});}
 }
 find('#lesson-topic-back').onclick=()=>{if(index>0){index--;expanded=false;show(true);}};
 find('#lesson-topic-next').onclick=()=>{if(index<topics.length-1){index++;expanded=false;show(true);}};
 more.onclick=()=>{expanded=!expanded;show();};
 show();
}
