import {loggingInitial,inspectLogs,inspectMetrics,pipelineStep} from './logging.js';
export const storyStages=[
 ['change','เปลี่ยนโค้ด','CI ตรวจการเปลี่ยนแปลงอัตโนมัติ เพื่อพบปัญหาเร็ว ไม่ใช่สั่ง deploy production ทุกครั้ง'],
 ['build-broken','สร้างชุดโค้ด','Build ผ่าน ยังต้องตรวจ tests ก่อนปล่อย'],
 ['blocked','Tests ไม่ผ่าน · หยุด','ประตู Deploy ปิด  Version นี้ยังปล่อยไม่ได้'],
 ['fix','เปลี่ยนเป็น Version แก้ไข','ตรวจ Version ตัวอย่างใหม่ ผล tests กำหนดไว้ ไม่ได้แก้ logs หรือ metrics'],
 ['build-fixed','Build ใหม่','ทำขั้นตอนซ้ำอัตโนมัติ ลดงานซ้ำของผู้ดูแล'],
 ['tested','Tests ผ่าน · เปิดประตู','ผ่านเงื่อนไขตัวอย่าง ไม่รับประกันว่าไม่มีบั๊ก'],
 ['deployed','ปล่อย Version จำลอง','นโยบายตัวอย่างอนุญาตให้ปล่อยหลัง tests ผ่าน แล้วต้องสังเกตระบบต่อ'],
 ['logs','ติดตามหลังปล่อย · รวม Error','Web 2 และ Worker ส่งเหตุการณ์มารวม ค้นข้ามบริการได้ แต่ไม่รับประกันว่าเก็บครบ'],
 ['host','ดูเครื่องที่วัด','CPU / Memory / Disk I/O ของ Web 1 ไม่ได้ยืนยันว่าทั้งระบบปกติ'],
 ['tier','ดู Service Tier','Database / Cache เป็นภาพรวมกลุ่มบริการ ไม่ใช่ค่าเครื่องเดียว'],
 ['business','ดู Business Metrics','DAU / retention / revenue ต้องเทียบช่วงเวลาและวิธีนับเดียวกัน ไม่เทียบวันกับ 5 นาทีโดยตรง'],
 ['observe','ใช้หลักฐานก่อนแก้ไข','DB_TIMEOUT เป็นจุดเริ่มตรวจ query ไม่ยืนยันคอขวด อย่าเพิ่ม Database capacity โดยไม่มีหลักฐาน'],
];
// Navigation pages group concepts without changing model transitions or action IDs.
export const loggingPages=[[2],[3,4,5,6],[7,8,9,10,11]].map(stages=>({
 stages,title:stages[0]===3?'แก้ไข Code Version → Build → Test → Deploy':stages[0]===7?'Logs → Metrics → ตรวจหลักฐาน':storyStages[stages[0]][1],
}));
// Runs only pure simulation on private state; never records participation.
export function loggingStageFrames(){
 const current={state:loggingInitial(),metrics:{},index:0},frames=[];
 while(current.index<storyStages.length){frames.push(advanceStory(current).frame);current.index++;}
 return frames;
}
function advanceStory(current){
 const [key,title,message]=storyStages[current.index];
 const before=structuredClone(current.state);let action=null;
 if(key==='fix')current.state={...current.state,testsPass:true,stage:'ready'};
 if(['build-broken','blocked','build-fixed','tested','deployed'].includes(key)){if(pipelineStep(current.state).meaningful)action='run-pipeline';}
 if(key==='logs'){current.state.logs=inspectLogs('all','error');current.state.logScope='ทุกบริการ';action='inspect-logs';}
 if(['host','tier','business'].includes(key)){current.state.metrics=inspectMetrics(key);current.metrics[key]=structuredClone(current.state.metrics);action='inspect-metrics';}
 return {action,frame:{key,title,message,index:current.index,total:storyStages.length,before,state:structuredClone(current.state),metrics:structuredClone(current.metrics)}};
}
export function createLoggingStory({record,show}){
 let busy=false,frames=[],generation=0,attempt=null,completed=false;
 return {
  get busy(){return busy;},get frames(){return structuredClone(frames);},get completed(){return completed;},
  cancel(){generation++;busy=false;frames=[];attempt=null;completed=false;},
  async replay(){
   if(busy||!completed)return;busy=true;const token=generation;
   try{for(const frame of structuredClone(frames)){await show(frame);if(token!==generation)return;}}
   finally{if(token===generation)busy=false;}
  },
  async run(index=0){
   if(busy||!Number.isInteger(index)||index<0||index>=loggingPages.length)return;
   busy=true;const token=generation,page=loggingPages[index];
   if(!attempt||attempt.page!==index){
    // Prepare private model prerequisites only: no show, record or shared state writes.
    const prepared={state:loggingInitial(),metrics:{},index:0};
    while(prepared.index<page.stages[0]){advanceStory(prepared);prepared.index++;}
    attempt={...prepared,page:index,pending:null};frames=[];completed=false;
   }
   const current=attempt;
   try{
    while(current.index<=page.stages.at(-1)){
     const retry=!!current.pending;
     if(!current.pending){
      const {frame,action}=advanceStory(current);
      current.pending={action};frames.push(frame);await show(structuredClone(frame));
     }
     if(token!==generation)return;
     if(current.pending.action)await record(current.pending.action,retry);
     if(token!==generation)return;
     current.pending=null;current.index++;
    }
    completed=true;attempt=null;
   }finally{if(token===generation)busy=false;}
  }
 };
}
