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
 steps.querySelector('p').outerHTML=`<ol class="flow-steps"><li>เลือก <strong>Browser</strong> ในแหล่งคำขอ แล้วกด <strong>เดิน request 1 ขั้น</strong> สองครั้ง สังเกต DNS รับคำถามและคืน IP ให้ client</li><li>กด <strong>เดิน request 1 ขั้น</strong> อีกสองครั้ง ดู HTTP ไปยัง server โดยตรง แล้วประมวลผลในเครื่องเดียว</li><li>กด <strong>เดิน request 1 ขั้น</strong> อีกสองครั้ง สังเกตคำตอบ HTML และการแสดงผล ข้อมูลตอบกลับอยู่ใต้แผนภาพ</li><li>เปลี่ยนเป็น <strong>Mobile app</strong> ซึ่งเริ่มขั้นใหม่ แล้วกดเดินจนครบ เปรียบเทียบคำตอบ JSON กับ HTML</li></ol><p class="flow-step-note">เปลี่ยนแหล่งคำขอหรือเริ่มการทดลองใหม่ไม่เพิ่มคะแนนและไม่ลบคะแนนเดิม เมื่อครบทุกขั้น กดเดินต่อจะไม่เกิดเหตุการณ์เพิ่ม</p>`;
 lab.querySelector('.panel-title').after(steps);
 const details=document.createElement('details');details.id='flow-details';
 details.innerHTML=`<summary>อ่านเพิ่มเติม · การทำงานและข้อจำกัดของแบบจำลอง</summary><p>ฝั่ง server ใช้ Java/Python/Go/Rust หรืออื่นๆ จัดการ logic และข้อมูล แต่ไม่ได้บังคับว่าทุก request ต้องอ่านทั้ง Database และ Cache เริ่มเครื่องเดียวดูแลง่าย แต่ส่วนต่างๆ แย่งทรัพยากรและล้มร่วมกันได้</p><p>ตัวอย่างเปิดข้อมูลผู้ใช้ 12 ผ่าน api.example.test และ IP สำหรับเอกสาร 192.0.2.10 ไม่ส่ง network จริง จำลองการถาม DNS ใหม่; cache DNS และการใช้ connection เดิมช่วยให้ไม่ต้องค้นหาใหม่ทุกครั้ง งานจริงควรใช้ HTTPS แบบจำลองนี้ไม่ใช่ผล benchmark</p>`;
 grid.replaceChildren(intro,comparison,lab,details,quiz);
 const controls=find('.controls'),label=controls.querySelector('label'),button=find('#step');
 const group=document.createElement('fieldset');group.className='flow-control-group';group.innerHTML='<legend>แหล่งคำขอ</legend>';group.append(label);
 const submit=document.createElement('div');submit.className='flow-submit';submit.append(button);submit.insertAdjacentHTML('beforeend','<span>กดทีละขั้น แล้วดูเส้นทางและผลที่เกิดขึ้น</span>');controls.replaceChildren(group,submit);
 const scoring=document.createElement('details');scoring.className='flow-score-help';scoring.innerHTML='<summary>คะแนนและเงื่อนไขการเรียนจบ</summary>';scoring.append(find('.participation small'));find('.participation').append(scoring);
}
