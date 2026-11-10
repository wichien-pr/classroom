// Formative interpretation of unchanged synthetic evidence, never scoring.
export function loggingDecision(phase,choice,state){
 if(!state)return 'ค้นหรืออ่านหลักฐานก่อนเลือกข้อสรุป';
 if(phase===0){
  if(choice==='web-2'&&state.logs?.some(l=>l.service==='web-2'&&l.message.includes('DB_TIMEOUT')))return 'ตรงกับอาการ: Web 2 บันทึก DB_TIMEOUT ขณะอ่านคำสั่งซื้อ · ตรวจ query และช่วงเวลาต่อ ยังไม่ใช่ข้อพิสูจน์ว่า Database เป็นต้นเหตุ';
  if(choice==='worker-1')return 'เหตุการณ์นี้เป็นงานภาพล้มเหลว ไม่ใช่การอ่านคำสั่งซื้อ · ลองเลือกเหตุการณ์ที่ข้อความตรงกับอาการ';
  return 'ยังยืนยันต้นเหตุไม่ได้จาก error เดียว · Log บอกว่าเกิดอะไรขึ้น ไม่ได้บอกสาเหตุทั้งหมด';
 }
 if(phase===1){
  if(choice==='proof')return 'ยังสรุปสาเหตุหรือขนาดผลกระทบไม่ได้ · ไม่มี baseline (ค่าปกติสำหรับเทียบ) หรือข้อมูลก่อน–หลังเหตุการณ์';
  return {host:'Web 1 ใช้ CPU 30% แต่ปัญหาอยู่ใน log ของ Web 2 · ค่าเครื่องเดียวใช้ยืนยันทั้งระบบไม่ได้ ลองดู Service Tier',tier:'query p95 900 ms หมายถึง 95% ของ query ที่วัดใช้เวลาไม่เกิน 900 ms · ตรวจ query และ logs ในช่วงเดียวกันต่อ ไม่ใช่หลักฐานต้นเหตุ',business:'รายได้วัน D และผู้ใช้กลุ่ม D−7 มีคนละขอบเขตกับค่า 5 นาที · ต้องมีข้อมูลช่วงที่เทียบกันได้ก่อนประเมินผลกระทบ'}[state.metrics?.group]||'อ่าน metrics ก่อน';
 }
 if(choice==='safe')return 'Tests ผ่านไม่รับประกันว่าไม่มีบั๊ก และ Build ผ่านอย่างเดียวก็ยังปล่อยไม่ได้ · ผลนี้ไม่ได้แก้ logs หรือ metrics';
 return state.stage==='blocked'?'หยุด Version นี้ไว้ · เลือก Version แก้ไขแล้วตรวจใหม่ จากนั้นยังต้องติดตามหลังปล่อย Version ':'หลัง deploy จำลอง ต้องติดตาม logs และ metrics อีกครั้ง · แบบฝึกนี้ไม่ได้วัดผลหลังแก้ไข';
}
const button=(key,label,selected)=>`<button type="button" data-logging-choice="${key}" aria-pressed="${selected===key}">${label}</button>`;
export function loggingChoices(topic){
 if(topic===0)return '<p class="logging-mission">โจทย์: มีรายงานว่าอ่านคำสั่งซื้อไม่สำเร็จ · ค้น Error แล้วเลือกเหตุการณ์ที่ควรตรวจต่อ</p>';
 return `<fieldset class="logging-choices"><legend>${topic<=3?'เลือกหลักฐานที่จะใช้ตรวจต่อ':'เลือก Version ที่จะตรวจ · ผล tests เป็นเงื่อนไขตัวอย่าง'}</legend>${topic<=3?button(1,'Web 1 · ทรัพยากรเครื่อง',topic)+button(2,'Database / Cache / คิว',topic)+button(3,'ผู้ใช้ / รายได้',topic):button(4,' Version เดิม · tests ไม่ผ่าน',topic)+button(5,' Version แก้ไข · tests ผ่าน',topic)}</fieldset>`;
}
export function loggingQuestions(topic){
 const options=topic===0?[['web-2','Web 2 · คำสั่งซื้อ'],['worker-1','Worker 1 · งานภาพ'],['root','สรุปว่า Database เป็นต้นเหตุ']]:topic<=3?[['investigate','ใช้กำหนดสิ่งที่ต้องตรวจต่อ'],['proof','ยืนยันสาเหตุและผลกระทบได้แล้ว']]:[['follow','ตรวจใหม่ / ติดตามหลังปล่อย Version '],['safe','ผ่านแล้ว แปลว่าไม่มีบั๊ก']];
 return `<section class="logging-decision"><h4>${topic===0?'เหตุการณ์ไหนตรงกับอาการ?':topic<=3?'หลักฐานนี้ใช้ตัดสินใจได้แค่ไหน?':'ขั้นต่อไปควรทำอะไร?'}</h4><div>${options.map(([id,text])=>`<button type="button" data-logging-decision="${id}">${text}</button>`).join('')}</div><p id="logging-decision-feedback" role="status">ลองเลือกข้อสรุป · เปลี่ยนคำตอบได้ ไม่ใช้ตัดสินการเรียนจบ</p></section>`;
}
