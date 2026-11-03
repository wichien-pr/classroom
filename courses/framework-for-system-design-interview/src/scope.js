// Teaching decision exercise, not an architecture evaluator.
export function evaluateScope(known) {
 const missing = ['platform','features','order','friends','scale','media'].filter(key=>known[key]!==true);
 return {ready:missing.length===0,missing};
}
export const questions = [
 {id:'platform',question:'ใช้บน mobile, web หรือทั้งสอง?',answer:'ทั้ง mobile และ web',why:'กำหนดช่องทางใช้งานก่อนออกแบบส่วนติดต่อ'},
 {id:'features',question:'ฟีเจอร์หลักที่ต้องสร้างคืออะไร?',answer:'สร้างโพสต์ และอ่าน news feed ของเพื่อน',why:'ยืนยันงานหลัก ไม่เพิ่ม chat หรือระบบแนะนำเอง'},
 {id:'order',question:'เรียง feed ตามเวลาหรือตามน้ำหนักความสำคัญ?',answer:'ตกลงให้เรียงใหม่ไปเก่า (reverse chronological order)',why:'การจัดอันดับด้วยน้ำหนักเป็นอีกขอบเขตหนึ่ง ไม่ใช่ข้อกำหนดของตัวอย่างนี้'},
 {id:'friends',question:'ผู้ใช้มีเพื่อนได้กี่คน?',answer:'สูงสุด 5,000 คนต่อผู้ใช้',why:'ขอบเขตความสัมพันธ์มีผลต่อการออกแบบ feed'},
 {id:'scale',question:'มีผู้ใช้ที่ใช้งานรายวันเท่าไร?',answer:'10 ล้าน DAU (daily active users)',why:'DAU คือผู้ใช้รายวัน ไม่ใช่จำนวน request ต่อวินาที ยังต้องถามพฤติกรรมการใช้งานก่อนประมาณ traffic'},
 {id:'media',question:'โพสต์มีแค่ข้อความหรือรวมสื่อ?',answer:'รองรับสื่อ รวมภาพและวิดีโอ',why:'อย่าออกแบบโดยสมมติว่ามีเพียงข้อความ'},
 {id:'growth',question:'คาดว่าจะเติบโตใน 3 เดือน, 6 เดือน และ 1 ปีอย่างไร?',answer:'ยังไม่มีตัวเลขในโจทย์ฝึกนี้ · จดเป็นคำถามค้าง ไม่เติมตัวเลขเป็นข้อเท็จจริง',why:'ถ้าลูกค้าให้กำหนดเอง ให้เขียนสมมติฐานและยืนยันร่วมกัน'},
 {id:'stack',question:'มี technology stack หรือบริการเดิมใดใช้ต่อได้?',answer:'ยังไม่ระบุ · ถามทีมก่อนเลือกเทคโนโลยี',why:'บริการเดิมอาจลดความซับซ้อน ไม่จำเป็นต้องสร้างทุกส่วนใหม่'}
];
