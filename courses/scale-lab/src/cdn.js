export function cdnInitial(){return {now:0,ttl:3,up:true,originUp:true,fallback:false,origin:1,cache:null,expires:null,objects:{},urlVersion:null,includeQuery:true,originReads:0,hits:0,misses:0,delivered:null,path:'idle'};}
const key=s=>'image.png'+(s.includeQuery&&s.urlVersion!==null?'?v='+s.urlVersion:'');
export function cdnAction(s,action){
 if(action==='tick'){s.now++;return {meaningful:false,message:`เวลา ${s.now} · สำเนาหมดอายุแล้วจะโหลดใหม่เมื่อขอรูป`};}
 if(action==='publish'){s.origin++;return {meaningful:false,message:`Origin เปลี่ยนเป็น version ${s.origin} · สำเนาที่ CDN ยังไม่เปลี่ยน`};}
 if(action==='version'){s.urlVersion=s.origin;return {meaningful:false,message:`เปลี่ยน URL เป็น image.png?v=${s.origin} · ไม่ได้ลบ URL เก่า`};}
 if(action==='invalidate'){delete s.objects[key(s)];s.cache=null;s.expires=null;return {meaningful:false,message:'Invalidate · ลบสำเนาของ key ปัจจุบันแล้ว (จำลองว่าสำเร็จ)'};}
 if(action!=='request')return {meaningful:false,path:s.path,message:'ไม่มีการเปลี่ยนแปลง'};
 const entry=s.objects[key(s)],hit=!!entry&&s.now<entry.expires;
 s.delivered=null;
 if((!s.up&&(!s.fallback||!s.originUp))||(s.up&&!hit&&!s.originUp)){
  s.path='failure';return {meaningful:true,path:s.path,message:'FAILURE · ขอรูปแล้วไม่ได้รับ: '+(!s.up?'CDN ล่ม · ต้องมีทางสำรองและ origin ที่พร้อม':'สำเนาใช้ไม่ได้และ origin ล่ม')};
 }
 if(!s.up){s.originReads++;s.delivered=s.origin;s.path='fallback';return {meaningful:true,path:s.path,message:`FALLBACK · client → origin โดยตรง · ได้รูป version ${s.delivered} · ไม่เติม CDN`};}
 if(hit){s.hits++;s.path='hit';}else{s.originReads++;s.misses++;s.objects[key(s)]={version:s.origin,expires:s.now+s.ttl};s.path='miss';}
 s.cache=s.objects[key(s)].version;s.expires=s.objects[key(s)].expires;s.delivered=s.cache;
 return {meaningful:true,path:s.path,message:`${hit?'HIT':'MISS'}${s.delivered!==s.origin?' · STALE':''} · ได้รูป version ${s.delivered} · ${hit?'CDN → ผู้ใช้ ไม่อ่าน origin':'CDN → origin → เก็บสำเนา → ผู้ใช้'}`};
}
