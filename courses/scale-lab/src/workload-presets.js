// LAB02-only fixed teaching scenarios; allocations are not measured capacity.
export function workloadPreset(topic,run=0){
 const config={layout:'split',web:3,data:1,available:true,scenario:'orders',engine:'sql'};
 let label='แยกชั้น · Web 3 / Data 1 · Database พร้อม · คำสั่งซื้อ / SQL';
 if(topic===1){config.layout='single';label='เครื่องเดียว · Web และ Data ใช้ 3 หน่วยร่วมกัน · Database พร้อม · คำสั่งซื้อ / SQL';}
 if(topic===2){config.web=4;config.available=false;label='แยกชั้น · Web 4 / Data 1 · Database ล่ม · คำสั่งซื้อ / SQL';}
 if(topic===3){
  const frame=run%3;
  if(frame>0)config.scenario='session';
  if(frame===2)config.engine='key-value';
  label=`กรณี ${frame+1}/3 · แยกชั้น Web 3 / Data 1 · Database พร้อม · ${['คำสั่งซื้อที่ต้อง JOIN / SQL','Session ตาม ID / SQL','Session ตาม ID / NoSQL Key-value'][frame]}`;
 }
 return {config,label};
}
