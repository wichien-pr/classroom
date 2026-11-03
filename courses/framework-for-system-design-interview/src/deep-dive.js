// Supplementary discussion-planning model, not a performance simulator.
export const foundations={scope:'ตกลงเป้าหมายและขอบเขต',blueprint:'มีแบบร่างภาพรวม',feedback:'รับความเห็นจากลูกค้าแล้ว',priority:'มีหัวข้อเบื้องต้นจากความเห็นนั้น'};
export const focuses={feed:'News feed · เส้นทางหลัก',performance:'ประสิทธิภาพ · คอขวดและทรัพยากร',shortener:'URL shortener · แปลงลิงก์',chat:'Chat · ความหน่วงและสถานะ',overview:'ลูกค้าต้องการทบทวนภาพรวม'};
export const topics={publishing:'Feed publishing · กระจายโพสต์',retrieval:'News feed retrieval · อ่าน feed',bottleneck:'คอขวดและประมาณทรัพยากร',hash:'Hash function · แปลง URL ยาวเป็นรหัสสั้น',latency:'ลด latency · เวลารอข้อความ',presence:'สถานะ online / offline',overview:'ทบทวนส่วนประกอบและเส้นทางภาพรวม',ranking:'ลงรายละเอียด EdgeRank โดยยังไม่ได้ตกลง'};
const appropriate={feed:['publishing','retrieval'],performance:['bottleneck'],shortener:['hash'],chat:['latency','presence'],overview:['overview']};
export function reviewDeepDive(settings){
 const missing=Object.keys(foundations).filter(k=>settings[k]!==true);
 const aligned=Boolean(appropriate[settings.focus]?.includes(settings.topic));
 return {missing,aligned,ready:missing.length===0&&aligned,focus:settings.focus,topic:settings.topic};
}
