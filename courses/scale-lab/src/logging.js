// Fixed synthetic evidence; no real telemetry, filesystem or network access.
export const loggingInitial=(testsPass=false)=>({testsPass,stage:'ready',logs:null,logScope:null,metrics:null});
export function pipelineStep(s){
 if(s.stage==='blocked'||s.stage==='deployed')return {meaningful:false,message:'Pipeline สิ้นสุดแล้ว · เปลี่ยนรุ่นโค้ดหรือเริ่มการทดลองใหม่'};
 if(s.stage==='ready'){s.stage='built';return {meaningful:true,message:'Build ผ่าน · ยังไม่ deploy ต้องตรวจ tests ก่อน'};}
 if(s.stage==='built'){s.stage=s.testsPass?'tested':'blocked';return {meaningful:true,message:s.testsPass?'Tests ผ่าน · พร้อมเดินขั้น deploy จำลอง':'Tests ไม่ผ่าน · หยุดก่อน deploy เพื่อแก้ไขและตรวจใหม่'};}
 if(s.stage==='tested'){s.stage='deployed';return {meaningful:true,message:'Deploy จำลองสำเร็จ · tests ผ่านไม่รับประกันว่าไม่มีข้อผิดพลาด ต้องติดตามหลังปล่อยรุ่น'};}
 throw Error('สถานะ pipeline ไม่ถูกต้อง');
}
const metrics={
 host:{window:'ค่าเฉลี่ยช่วง 5 นาที · Web 1',rows:[['CPU','30%'],['Memory','55%'],['Disk I/O','20 MB/s']],caution:'ค่าของ Web 1 ไม่ได้ยืนยันว่าฐานข้อมูลหรือ workers ปกติ ต้องเทียบ baseline ของระบบ'},
 tier:{window:'ช่วง 5 นาทีเดียวกัน · รวมแต่ละชั้นบริการ',rows:[['Database query p95','900 ms'],['Cache hit ratio','65%'],['Queue backlog ณ สิ้นช่วง','24 งาน']],caution:'p95 คือ 95% ของคำขอที่วัดใช้เวลาไม่เกินค่านี้ ควรตรวจ query และ logs เพิ่ม ไม่ใช่สรุปสาเหตุจากค่าสูงเพียงค่าเดียว'},
 business:{window:'วันจำลอง D · retention ของกลุ่มผู้ใช้วัน D−7',rows:[['Daily active users','1,200 คน'],['กลับมาใช้ในวัน D จากกลุ่ม D−7','40%'],['Revenue ของวัน D','24,000 บาท']],caution:'ต้องกำหนดช่วงเวลาและกลุ่มผู้ใช้ให้ชัดก่อนเปรียบเทียบ ตัวเลขธุรกิจไม่ใช่หลักฐานยืนยันสาเหตุทางเทคนิคโดยลำพัง'}
};
export function inspectMetrics(group){
 if(!Object.hasOwn(metrics,group))throw Error('กลุ่ม metrics ไม่ถูกต้อง');
 return {group,...structuredClone(metrics[group])};
}
const logs=[
 {time:'10:00:01',service:'web-1',level:'info',message:'GET /catalog → 200'},
 {time:'10:00:02',service:'web-2',level:'error',message:'DB_TIMEOUT · อ่านคำสั่งซื้อไม่ทันเวลาที่กำหนด'},
 {time:'10:00:03',service:'worker-1',level:'error',message:'PHOTO_JOB_FAILED · ประมวลผลภาพไม่สำเร็จ'},
 {time:'10:00:04',service:'web-1',level:'info',message:'GET /health → 200'}
];
export function inspectLogs(scope,level){
 if(!['all','web-1','web-2','worker-1'].includes(scope)||!['all','error'].includes(level))throw Error('ขอบเขตการค้นหาไม่ถูกต้อง');
 return logs.filter(x=>(scope==='all'||x.service===scope)&&(level==='all'||x.level===level)).map(x=>({...x}));
}
