import {setFlowIcon} from './flow-view.js';
// LAB01-only presentation; preparation is unscored and action identity remains flow/step.
export function mountSingleServerLayout(main,onTopic=()=>{}) {
 const find=selector=>main.querySelector(selector);
 main.classList.add('flow-lesson');
 const grid=find('.learning-grid'),intro=find('.teaching').firstElementChild,lab=find('.lab'),quiz=find('.quiz');
 intro.classList.add('flow-intro');
 intro.querySelector('h2').textContent='เครื่องเดียว รับคำขอจากสองแบบ';
 intro.querySelector('p:not(.eyebrow)').textContent='เริ่มด้วย Web / Application, Database และ Cache ใน server เครื่องเดียว ส่วน DNS อยู่ภายนอกและทำหน้าที่คืน IP ให้ client จากนั้น client ส่ง HTTP ไปยัง server โดยตรง ไม่ผ่าน DNS';
 const comparison=document.createElement('section');comparison.className='flow-compare-section';
 comparison.innerHTML='<h2>เส้นทางเดียวกัน รูปแบบคำตอบต่างกัน</h2><figure id="flow-comparison" class="flow-comparison"><figcaption>Browser และ Mobile app ติดต่อ server เดียวกัน</figcaption><div class="flow-client-pair"><div>Browser<small>ถาม DNS → รับ IP → ส่ง HTTP<br>รับ HTML / JavaScript เพื่อแสดงหน้าเว็บ</small></div><div>Mobile app<small>ถาม DNS → รับ IP → ส่ง HTTP<br>รับ JSON แล้วนำข้อมูลไปแสดงในแอป</small></div></div><p>ทั้งสองแบบรับคำตอบจาก server โดยตรง · Browser ก็รับ JSON ได้ ไม่ได้จำกัดตามชนิดอุปกรณ์</p></figure>';
 const steps=intro.querySelector('.experiment');steps.remove();
 const topic=document.createElement('section');topic.id='flow-topic';topic.setAttribute('aria-labelledby','flow-slide-title');
 topic.innerHTML='<nav class="flow-slide-nav" aria-label="หัวข้อการทดลอง"><button type="button" id="flow-slide-back" aria-controls="flow-topic">« Back</button><h3 id="flow-slide-title" tabindex="-1"></h3><button type="button" id="flow-slide-next" aria-controls="flow-topic">Next »</button></nav><p id="flow-instruction"></p><p id="flow-scenario" aria-label="สถานการณ์ที่กำหนด"></p>';
 lab.querySelector('.panel-title').after(topic);topic.append(find('#architecture'));
 const actions=document.createElement('div');actions.className='flow-actions';
 const controls=document.createElement('div');controls.className='flow-player-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label','ทดลองและควบคุมภาพ');
 const button=find('#step');setFlowIcon(button,'play','ทดลอง');controls.append(button);
 controls.insertAdjacentHTML('beforeend','<div class="flow-playback"><button type="button" id="flow-replay" disabled>↻ เล่นภาพซ้ำ</button><button type="button" id="flow-pause" disabled aria-pressed="false">พักภาพ</button></div>');
 const feedback=document.createElement('div');feedback.className='flow-player-feedback';
 const result=document.createElement('p');result.id='flow-result';result.setAttribute('role','status');feedback.append(result);
 actions.append(controls,feedback);topic.append(actions);
 for(const selector of ['.control-area','.observation','#state-view','.event-area'])find(selector)?.remove();
 const titles=['ค้นหา IP ก่อนส่งคำขอ','ส่งคำขอเข้าเครื่องเดียว','รับคำตอบและแสดงหน้าเว็บ','เปลี่ยนเป็นแอป แล้วเทียบคำตอบ'];
 const instructions=['กดทดลอง ดู DNS คืน IP ให้ Browser ก่อนส่ง HTTP','กดทดลอง ดู Browser ค้นหา IP แล้วส่ง HTTP ตรงไปยัง server','กดทดลอง ดูการประมวลผลและส่ง HTML กลับให้ Browser','กดทดลอง ดู Mobile app รับ JSON แล้วแสดงผล เทียบกับ HTML'];
 const heading=find('#flow-slide-title'),back=find('#flow-slide-back'),next=find('#flow-slide-next');let slide=0;
 setFlowIcon(back,'back','ย้อนกลับ');setFlowIcon(next,'next','ถัดไป');setFlowIcon(find('#reset'),'reset','เริ่มการทดลองใหม่');
 function show(focus=false){
  topic.dataset.topic=String(slide);heading.textContent=`${slide+1} / 4 · ${titles[slide]}`;
  find('#flow-instruction').textContent=instructions[slide];
  find('#flow-scenario').textContent=`${slide===3?'Mobile app · JSON':'Browser · HTML'} · api.example.test/users/12 · เริ่มค้นหา DNS ใหม่ทุกครั้ง`;
  back.disabled=slide===0;next.disabled=slide===3;onTopic(slide);
  if(focus){heading.focus({preventScroll:true});topic.scrollIntoView({block:'start',behavior:'instant'});}
 }
 back.onclick=()=>{if(slide>0){slide--;show(true);}};next.onclick=()=>{if(slide<3){slide++;show(true);}};show();
 const details=document.createElement('details');details.id='flow-details';
 details.innerHTML='<summary>อ่านเพิ่มเติม · การทำงานและข้อจำกัดของแบบจำลอง</summary><p>ฝั่ง server ใช้ Java/Python/Go/Rust หรืออื่นๆ จัดการ logic และข้อมูล แต่ไม่ได้บังคับว่าทุก request ต้องอ่านทั้ง Database และ Cache เริ่มเครื่องเดียวดูแลง่าย แต่ส่วนต่างๆ แย่งทรัพยากรและล้มร่วมกันได้</p><p>ตัวอย่างเปิดข้อมูลผู้ใช้ 12 ผ่าน api.example.test และ IP สำหรับเอกสาร 192.0.2.10 ไม่ส่ง network จริง จำลองการถาม DNS ใหม่; cache DNS และการใช้ connection เดิมช่วยให้ไม่ต้องค้นหาใหม่ทุกครั้ง งานจริงควรใช้ HTTPS แบบจำลองนี้ไม่ใช่ผล benchmark</p>';
 grid.replaceChildren(intro,comparison,lab,details,quiz);

}
