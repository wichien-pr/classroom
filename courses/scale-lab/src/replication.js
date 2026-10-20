export const replicationInitial=()=>({versions:[0,0,0],histories:[0,0,0],up:[true,true,true],writer:0,cursor:0,fenced:false,acceptLoss:false,lost:0});
export const dbName=i=>['Primary เดิม','Replica 1','Replica 2'][i];
export function replicationAction(s,action){
 const writer=s.writer;
 if(action==='promote'){
  const lost=Math.max(0,s.versions[0]-s.versions[1]);
  if(writer!==0||s.up[0]||!s.up[1]||!s.fenced||(lost&&!s.acceptLoss))return {meaningful:false,message:'ยัง promote ไม่ได้: ปิด primary เดิม, ให้ Replica 1 พร้อม, ยืนยัน fencing และยอมรับข้อมูลที่อาจสูญเสียก่อน'};
  s.writer=1;s.up[0]=false;s.lost=lost;
  if(lost)s.histories[1]=1;
  return {meaningful:false,message:`Promote Replica 1 เป็น primary ใหม่ · สูญเสีย ${lost} ขั้นเขียนที่ยังไม่ส่ง · primary เดิมถูก fence ไม่เปิดกลับเอง; ต้องกู้/ตรวจข้อมูลและสร้าง replica ทดแทนในระบบจริง`};
 }
 if(['write','read-primary','sync'].includes(action)&&!s.up[writer])return {meaningful:action!=='sync',message:'503 · Primary ไม่พร้อม ไม่มีการเขียนหรือ sync; ต้องประเมินและ promote อย่างมีเงื่อนไข'};
 if(action==='write'){s.versions[writer]++;return {meaningful:true,message:`COMMIT order version ${s.versions[writer]} ที่ ${dbName(writer)}; replica ยังไม่ตามมา`};}
 if(action==='sync'){
  const targets=s.versions.map((v,i)=>i).filter(i=>i!==writer&&s.up[i]&&(s.versions[i]!==s.versions[writer]||s.histories[i]!==s.histories[writer]));
  for(const i of targets){s.versions[i]=s.versions[writer];s.histories[i]=s.histories[writer];}
  return {meaningful:targets.length>0,message:targets.length?'Replication → สำเนาที่พร้อมตามครบในหนึ่งรอบจำลอง ไม่ใช่เวลาจริง':'ไม่มีข้อมูลค้างให้ส่ง · ไม่เพิ่มคะแนน'};
 }
 const replicas=[1,2].filter(i=>i!==writer&&s.up[i]);
 const fallback=action==='read-replica'&&!replicas.length;
 const target=action==='read-primary'||fallback?writer:replicas[s.cursor++%replicas.length];
 if(!s.up[target])return {meaningful:true,message:'503 · ไม่มีฐานข้อมูลพร้อมอ่าน'};
 return {meaningful:true,message:`${fallback?'fallback → ':''}${dbName(target)} อ่าน version ${s.versions[target]}${s.histories[target]!==s.histories[writer]?' · คนละสายข้อมูล: ต้อง reconcile / สร้างสำเนาใหม่':s.versions[target]<s.versions[writer]?' · STALE: ยังไม่เห็น order ล่าสุด':' · ข้อมูลตรงกับ primary'}`};
}
