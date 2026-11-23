import {loggingInitial,pipelineStep} from './logging.js';
export const loggingPages=[{title:'ก่อนปล่อย · Build / Test / Deploy'}];
export const loggingStageFrames=(fixed=false)=>[...stageFrames(fixed)];
function* stageFrames(fixed=false){
 const state=loggingInitial(fixed);let index=0;
 const steps=[['build','Build · เตรียม Version','Build ผ่านยังไม่พอ ต้องตรวจ tests'],[fixed?'tested':'blocked',fixed?'Tests ผ่าน':'Tests ไม่ผ่าน · ห้ามปล่อย',fixed?'ผ่านเฉพาะเงื่อนไขตัวอย่าง ไม่รับประกัน production':'Deploy ถูกบล็อก ต้องแก้ไขก่อนปล่อย'],...(fixed?[['deployed','Deploy จำลอง','นโยบายตัวอย่างอนุญาตให้ปล่อย ไม่ใช่ CI ทุกระบบ']]:[])];
 for(const [key,title,message] of steps){
 const before=structuredClone(state);let action;
 if(pipelineStep(state).meaningful)action='run-pipeline';
 yield {key,title,message,action,index:index++,total:steps.length,before,state:structuredClone(state)};
 }
}
export function createLoggingStory({record,show}){
 let busy=false,frames=[],generation=0,attempt=null,completed=false;
 return {
 get busy(){return busy;},get frames(){return structuredClone(frames);},get completed(){return completed;},
 cancel(){generation++;busy=false;frames=[];attempt=null;completed=false;},
 async replay(){if(busy||!completed)return;busy=true;const token=generation;try{for(const f of structuredClone(frames)){await show(f);if(token!==generation)return;}}finally{if(token===generation)busy=false;}},
 async run(index=0,fixed=false){
 if(busy||index!==0)return;busy=true;const token=generation;
 if(!attempt){attempt={source:stageFrames(fixed),frame:null,pending:false};frames=[];completed=false;}
 const current=attempt;
 try{while(true){
 if(!current.pending){const next=current.source.next();if(next.done)break;current.frame=next.value;}
 const frame=current.frame,retry=current.pending;
 if(!retry){current.pending=true;frames.push(structuredClone(frame));await show(structuredClone(frame));}
 if(token!==generation)return;
 await record(frame.action,retry);if(token!==generation)return;
 current.pending=false;
 }completed=true;attempt=null;}finally{if(token===generation)busy=false;}
 }
 };
}
