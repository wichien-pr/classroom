// Deterministic photo-job model; no timers or network.
export const queueInitial=()=>({producerUp:true,consumerUp:true,workers:1,jobs:[],completed:[],nextId:1});
export function queueAction(s,action,type='crop'){
 if(!Number.isInteger(s.workers)||s.workers<1||s.workers>4)throw Error('จำนวน workers ต้องเป็น 1–4');
 if(!['crop','sharpen','blur'].includes(type))throw Error('ชนิดงานไม่ถูกต้อง');
 if(action==='enqueue-jobs'){
  if(s.jobs.length+3>30)return {meaningful:false,message:'คิวเต็ม · จำกัด 30 งานในแบบจำลอง ไม่รับชุดใหม่'};
  if(!s.producerUp)return {meaningful:false,message:'Producer หยุด · ไม่มีงานใหม่เข้าคิว'};
  for(let i=0;i<3;i++)s.jobs.push({id:s.nextId++,type});
  return {meaningful:true,message:'รับงาน 3 ชิ้นเข้าคิวแล้ว · ยังไม่ใช่ภาพที่ประมวลผลเสร็จ'};
 }
 if(action==='process-jobs'){
  if(!s.consumerUp||!s.jobs.length)return {meaningful:false,message:!s.consumerUp?'Workers หยุด · งานยังรอในคิว':'คิวว่าง · ไม่มีงานให้ทำ'};
  const batch=s.jobs.splice(0,s.workers);s.completed.push(...batch);
  return {meaningful:true,message:`เสร็จ ${batch.length} งานในรอบนี้ · เหลือ ${s.jobs.length} งานรอ`};
 }
 return {meaningful:false,message:'ไม่มีการเปลี่ยนแปลง'};
}
