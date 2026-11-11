import {dataTierInitial,evaluateDataTier} from './database-scaling.js';
// Keep the six original teaching outcomes as phase metadata, not learner pages.
const sourceTopics=[
 {title:'ภาระเกินกำลังเครื่องเดียว',situation:'16 แถวและ 16 คำขอรวมที่เครื่องเดียว · กำลัง 8 หน่วย',configs:[{}],result:'ภาระ 16 เกินกำลัง 8 · ยังไม่จำลองการทิ้งงานหรือเวลารอ'},
 {title:'Scale Up · ยังรวมงานที่เครื่องเดียว',situation:'16 แถวและ 16 คำขอยังอยู่เครื่องเดียว · เพิ่มกำลังเป็น 32 หน่วย',configs:[{power:4},{power:4,up:false}],result:'ประเด็น availability ต้องออกแบบ replication และ failover แยกต่างหาก · Sharding ไม่ได้ทำให้มีสำเนาหรือสลับเครื่องเอง'},
 {title:'แบ่งแถวด้วย user_id',situation:'4 shards · user_id % 4 · คำขอกระจายเท่ากัน',configs:[{mode:'horizontal'}],result:'4 แถว / 4 คำขอต่อ shard · schema เดียวกัน แต่คนละแถว ไม่ใช่สำเนา'},
 {title:'แถวเท่ากัน ≠ โหลดเท่ากัน',situation:'user 4 ถูกเรียก 13 ครั้ง · user 0, 1, 2 อย่างละ 1 ครั้ง',configs:[{mode:'horizontal',traffic:'hotspot'}],result:'แถวเท่ากัน แต่ Shard 0 รับ 14 คำขอ เกินกำลัง 8 · key เดียวยังไปเครื่องเดียว'},
 {title:'Key เดียวทำให้กระจุก',situation:'ทุกแถวใช้ประเทศเดียวกัน · key = 0 · คำขอกระจายตาม user',configs:[{mode:'horizontal',key:'country'}],result:'ทั้ง 16 แถวและ 16 คำขอกระจุกที่ Shard 0 · มีหลายเครื่องก็ไม่ช่วยเมื่อ key ไม่กระจาย'},
 {title:'เปลี่ยนสูตร ≠ ย้ายข้อมูล',situation:'เปรียบเทียบ user_id % 4 เดิม กับแผน user_id % 8',configs:[{mode:'horizontal',shards:8}],result:'8 แถวเปลี่ยนปลายทางในแผน · ต้องวางแผน migration และ routing ให้ตรงกัน'},
];
export const tierPages=[
 {title:'เครื่องเดียวเป็นคอขวด · Scale Up ช่วยแค่ไหน',sourceTopics:[0,1]},
 {title:'Sharding · แบ่งข้อมูล กระจายภาระงาน',sourceTopics:[2]},
 {title:'Resharding · เปลี่ยน routing ≠ ย้ายข้อมูล',sourceTopics:[5]},
].map(page=>({...page,configs:page.sourceTopics.flatMap(i=>sourceTopics[i].configs)}));
// Presentation has its own generation; canceled saves may finish, never continue.
export function createTierFlow({show,record}){
 let generation=0,busy=false,attempt=null,paused=false,wake=()=>{};
 const resume=()=>{paused=false;wake();};
 const ready=async token=>{while(paused&&token===generation)await new Promise(r=>wake=r);return token===generation;};
 return {
  get busy(){return busy;},
  cancel(){generation++;busy=false;attempt=null;resume();},
  setPaused(value){if(value)paused=true;else resume();},
  async play(index){
   const token=++generation;
   for(const frame of tierFrames(index)){if(!await ready(token))return;await show(frame);if(token!==generation)return;}
  },
  async run(index){
   if(busy)return;busy=true;const token=++generation;
   if(!attempt||attempt.index!==index)attempt={index,frames:tierFrames(index),phase:0,pending:false};
   const current=attempt;
   try{while(current.phase<current.frames.length){
    if(!await ready(token))return;
    const retry=current.pending;
    if(!retry){current.pending=true;await show(structuredClone(current.frames[current.phase]),true);}
    if(token!==generation)return;
    await record('evaluate-data-tier',retry);
    if(token!==generation)return;
    current.pending=false;current.phase++;
   }attempt=null;}finally{if(token===generation)busy=false;}
  }
 };
}
export function tierFrames(index){
 const page=tierPages[index];if(!page)throw Error('Unknown database page');
 let phase=0;
 return page.sourceTopics.flatMap(sourceTopic=>sourceTopics[sourceTopic].configs.map(preset=>{
  const original=sourceTopics[sourceTopic],config={...dataTierInitial(),...preset};
  const caption=sourceTopic===1?(config.up?'เพิ่มกำลังเป็น 32':'ประเด็นรอง: เครื่องล่ม ≠ ภาระเกินกำลัง'):original.title;
  const takeaway=sourceTopic===1?(config.up?'กำลัง 32 รับภาระ 16 ได้ · ยังเครื่องเดียว มีเพดานฮาร์ดแวร์และค่าใช้จ่าย (ไม่ได้คำนวณในแบบจำลอง)':original.result):original.result;
  return {index,phase:phase++,sourceTopic,caption,situation:original.situation,takeaway,config,result:evaluateDataTier(config)};
 }));
}
