// Presentation only: retain flow/step and quiz identities and existing event handlers.
export function mountSingleServerLayout(main) {
 const find=selector=>main.querySelector(selector);
 main.classList.add('flow-lesson');
 const grid=find('.learning-grid'),intro=find('.teaching').firstElementChild,lab=find('.lab'),quiz=find('.quiz');
 intro.classList.add('flow-intro');
 intro.querySelector('h2').textContent='เครื่องเดียว รับคำขอจากสองแบบ';
 intro.querySelector('p:not(.eyebrow)').textContent='เริ่มด้วย Web / Application, Database และ Cache ใน server เครื่องเดียว ส่วน DNS อยู่ภายนอกและทำหน้าที่คืน IP ให้ client จากนั้น client ส่ง HTTP ไปยัง server โดยตรง ไม่ผ่าน DNS';
 const comparison=document.createElement('section');
 comparison.className='flow-compare-section';
 comparison.innerHTML=`<h2>เส้นทางเดียวกัน รูปแบบคำตอบต่างกัน</h2><figure id="flow-comparison" class="flow-comparison"><figcaption>Browser และ Mobile app ติดต่อ server เดียวกัน</figcaption><div class="flow-client-pair"><div>Browser<small>ถาม DNS → รับ IP → ส่ง HTTP<br>รับ HTML / JavaScript เพื่อแสดงหน้าเว็บ</small></div><div>Mobile app<small>ถาม DNS → รับ IP → ส่ง HTTP<br>รับ JSON แล้วนำข้อมูลไปแสดงในแอป</small></div></div><p>ทั้งสองแบบรับคำตอบจาก server โดยตรง · Browser ก็รับ JSON ได้ ไม่ได้จำกัดตามชนิดอุปกรณ์</p></figure>`;
 const steps=intro.querySelector('.experiment');
 steps.querySelector('p').outerHTML=`<ol class="flow-steps"><li>เลือก <strong>Browser</strong> ในแหล่งคำขอ แล้วกด <strong>เดิน request 1 ขั้น</strong> สองครั้ง สังเกต DNS รับคำถามและคืน IP ให้ client</li><li>กด <strong>เดิน request 1 ขั้น</strong> จนถึงขั้น 4 ดู HTTP ไปยัง server โดยตรง แล้วประมวลผลในเครื่องเดียว</li><li>กด <strong>เดิน request 1 ขั้น</strong> จนถึงขั้น 6 ดูคำตอบและการแสดงผล · ถ้าเลือก Browser จะได้รับ HTML</li><li>เปลี่ยนเป็น <strong>Mobile app</strong> ซึ่งเริ่มขั้นใหม่ แล้วกดเดินจนครบ เปรียบเทียบคำตอบ JSON กับ HTML</li></ol><p class="flow-step-note">เปลี่ยนแหล่งคำขอหรือเริ่มการทดลองใหม่ไม่เพิ่มคะแนนและไม่ลบคะแนนเดิม เมื่อครบทุกขั้น กดเดินต่อจะไม่เกิดเหตุการณ์เพิ่ม</p>`;
 lab.querySelector('.panel-title').after(steps);
 // A topic is a complete work surface: instruction, focused route, controls
 // and live feedback. Move existing nodes; navigation never calls act().
 const titles=['ค้นหา IP ก่อนส่งคำขอ','ส่งคำขอเข้าเครื่องเดียว','รับคำตอบและแสดงหน้าเว็บ','เปลี่ยนเป็นแอป แล้วเทียบคำตอบ'];
 const topic=document.createElement('section');topic.id='flow-topic';topic.setAttribute('aria-labelledby','flow-slide-title');
 steps.replaceWith(topic);topic.append(steps);
 const maps=[['Client → DNS → Client','ถามชื่อโดเมน แล้วรับ IP กลับ · HTTP ยังไม่ผ่าน DNS'],['Client → Web / Application','ส่ง HTTP ตรงไปยัง server · Database และ Cache อยู่ในเครื่องเดียวกัน'],['Server → Browser','ส่ง HTML กลับโดยตรง แล้วแสดงหน้าเว็บ'],['Server → Mobile app','ส่ง JSON กลับโดยตรง แล้วแอปนำข้อมูลไปแสดง']];
 const visual=document.createElement('div');visual.className='flow-topic-visual';
 visual.innerHTML=maps.map(([route,note])=>`<div class="flow-topic-map"><strong>${route}</strong><span>${note}</span></div>`).join('');
 const workspace=document.createElement('div');workspace.className='flow-topic-workspace';
 const controlsArea=find('.control-area'),observation=find('.observation'),stateView=find('#state-view');
 controlsArea.querySelector('h3').textContent='ลงมือทดลอง';observation.querySelector('h3').textContent='ผลจากการกดล่าสุด';
 workspace.append(find('#architecture'),controlsArea,observation,stateView);topic.append(visual,workspace);
 const full=document.createElement('details');full.className='flow-full-view';full.innerHTML='<summary>ดูบันทึกเหตุการณ์</summary>';
 full.append(find('.event-area'));topic.after(full);
 const items=[...steps.querySelectorAll('.flow-steps > li')];
 const heading=document.createElement('h3');heading.id='flow-slide-title';heading.tabIndex=-1;
 steps.querySelector('.flow-steps').before(heading);
 const navigation=document.createElement('nav');navigation.className='flow-slide-nav';navigation.setAttribute('aria-label','สไลด์การทดลอง');
 navigation.innerHTML='<button type="button" id="flow-slide-back" aria-controls="flow-slide-instructions"><span aria-hidden="true">←</span> ย้อนกลับ · Back</button><button type="button" id="flow-slide-next" aria-controls="flow-slide-instructions">ถัดไป · Next <span aria-hidden="true">→</span></button>';
 steps.querySelector('.flow-steps').id='flow-slide-instructions';
 topic.append(navigation);
 const note=steps.querySelector('.flow-step-note');
 note.textContent='ข้ามด้วย Next ได้ · ไม่เพิ่มคะแนนหรือทำให้เรียนจบ · สถานะเดิมยังอยู่';
 topic.append(note);
 const caveat=document.createElement('p');caveat.className='flow-step-note';caveat.textContent='หากข้ามหัวข้อ ให้กดเดินจากขั้นเดิมจนถึงช่วงที่ต้องการสังเกต เปลี่ยนแหล่งคำขอจะเริ่มที่ขั้น 0 โดยไม่ลบคะแนน เมื่อครบ 6 ขั้น กดต่อจะไม่มีเหตุการณ์เพิ่ม';full.append(caveat);
 navigation.querySelectorAll('button').forEach(button=>button.setAttribute('aria-controls','flow-topic'));
 let slide=0;
 const back=navigation.querySelector('#flow-slide-back'),next=navigation.querySelector('#flow-slide-next');
 function showSlide(focus=false){
  items.forEach((item,index)=>{item.value=index+1;item.hidden=index!==slide;});
  heading.textContent=`${slide+1} / ${items.length} · ${titles[slide]}`;
  topic.dataset.topic=String(slide);
  visual.querySelectorAll('.flow-topic-map').forEach((map,index)=>map.hidden=index!==slide);
  if(slide>=2){
   const mobile=find('#flow-client').value==='mobile',map=visual.children[slide];
   map.querySelector('strong').textContent=mobile?'Server → Mobile app':'Server → Browser';
   map.querySelector('span').textContent=mobile?'คำตอบ JSON ส่งกลับโดยตรง · แอปนำข้อมูลไปแสดง':'คำตอบ HTML ส่งกลับโดยตรง · Browser แสดงหน้าเว็บ';
  }
  back.disabled=slide===0;next.disabled=slide===items.length-1;
  if(focus){heading.focus({preventScroll:true});topic.scrollIntoView({block:'start',behavior:'instant'});}
 }
 back.onclick=()=>{if(slide>0){slide--;showSlide(true);}};
 next.onclick=()=>{if(slide<items.length-1){slide++;showSlide(true);}};
 find('#flow-client').addEventListener('change',()=>showSlide());
 showSlide();
 const details=document.createElement('details');details.id='flow-details';
 details.innerHTML=`<summary>อ่านเพิ่มเติม · การทำงานและข้อจำกัดของแบบจำลอง</summary><p>ฝั่ง server ใช้ Java/Python/Go/Rust หรืออื่นๆ จัดการ logic และข้อมูล แต่ไม่ได้บังคับว่าทุก request ต้องอ่านทั้ง Database และ Cache เริ่มเครื่องเดียวดูแลง่าย แต่ส่วนต่างๆ แย่งทรัพยากรและล้มร่วมกันได้</p><p>ตัวอย่างเปิดข้อมูลผู้ใช้ 12 ผ่าน api.example.test และ IP สำหรับเอกสาร 192.0.2.10 ไม่ส่ง network จริง จำลองการถาม DNS ใหม่; cache DNS และการใช้ connection เดิมช่วยให้ไม่ต้องค้นหาใหม่ทุกครั้ง งานจริงควรใช้ HTTPS แบบจำลองนี้ไม่ใช่ผล benchmark</p>`;
 grid.replaceChildren(intro,comparison,lab,details,quiz);
 const controls=find('.controls'),label=controls.querySelector('label'),button=find('#step');
 const group=document.createElement('fieldset');group.className='flow-control-group';group.innerHTML='<legend>แหล่งคำขอ</legend>';label.firstChild.textContent='เปลี่ยนแล้วเริ่มที่ขั้น 0 · ไม่เพิ่มคะแนน';group.append(label);
 const submit=document.createElement('div');submit.className='flow-submit';submit.append(button);submit.insertAdjacentHTML('beforeend','<span>ขั้นเดิมยังอยู่ · กดต่อเพื่อดูผลด้านล่าง</span>');controls.replaceChildren(group,submit);
 const scoring=document.createElement('details');scoring.className='flow-score-help';scoring.innerHTML='<summary>คะแนนและเงื่อนไขการเรียนจบ</summary>';scoring.append(find('.participation small'));find('.participation').append(scoring);
}
