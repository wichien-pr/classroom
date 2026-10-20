// A serial, manual-clock teaching model. Never claims real latency or atomic writes.
export const cacheInitial=()=>({db:100,cache:null,reads:0,hits:0,misses:0,now:0,ttl:3,expires:null,up:true,path:'ready'});
export function cacheAction(s,action,value){
 let message='',meaningful=false;
 switch(action){
 case 'read-cache':
  meaningful=true;
  if(!s.up){s.reads++;s.path='bypass';message=`BYPASS · cache ล่ม อ่าน DB ${s.db} โดยตรง — DB ต้องรับโหลดเพิ่ม ไม่เติม cache`;break;}
  if(s.cache!==null){s.hits++;s.path='hit';message=`HIT · ราคาที่คืน ${s.cache} / DB ${s.db}${s.cache!==s.db?' · STALE: สำเนาเก่า':' · ค่าปัจจุบัน'} — ไม่อ่าน DB เพิ่ม`;}
  else{s.reads++;s.misses++;s.cache=s.db;s.expires=s.now+s.ttl;s.path='miss';message=`MISS · ราคาที่คืน ${s.cache} / DB ${s.db} — app โหลด DB แล้วเติม cache`;}
  break;
 case 'update':if(!Number.isSafeInteger(value)||value<1||value>1000000){message='กรุณากรอกราคา 1–1000000 เป็นจำนวนเต็ม';break;}if(value===s.db){message='ราคาไม่เปลี่ยน — ไม่มี write ใหม่';break;}s.db=value;meaningful=true;s.path='write';message=`DB ราคาใหม่ ${s.db} — cache ไม่เปลี่ยนอัตโนมัติ`;break;
 case 'invalidate':if(s.cache===null){message='cache ว่างอยู่แล้ว — ไม่มีสำเนาให้ลบ';break;}s.cache=null;s.expires=null;s.path='invalidate';meaningful=true;message='INVALIDATE · ลบสำเนา cache แล้ว การอ่านถัดไปจะ miss';break;
 case 'outage':s.up=false;s.cache=null;s.expires=null;s.path='down';message='cache ล่ม · สำเนาใน memory หาย แต่ DB ยังอยู่';break;
 case 'restart':s.up=true;s.cache=null;s.expires=null;s.path='ready';message='cache เริ่มใหม่แบบ cold · ไม่กู้ข้อมูลจาก cache';break;
 case 'tick':s.now++;if(s.expires!==null&&s.now>=s.expires){s.cache=null;s.expires=null;}s.path='clock';message=`เวลาจำลอง ${s.now} · ${s.cache===null?'ไม่มีสำเนาที่ใช้ได้':'สำเนายังไม่หมดอายุ'} — ไม่ใช่เวลาจริง`;break;
 }
 return {message,meaningful};
}
