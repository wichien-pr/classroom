import {loggingInitial,inspectLogs,inspectMetrics,pipelineStep} from './logging.js';
export function loggingPreset(topic){const s=loggingInitial(topic>=5);if(topic===6)s.stage='deployed';return s;}
export const loggingSequences=[['inspect-logs'],['inspect-metrics'],['inspect-metrics'],['inspect-metrics'],['run-pipeline','run-pipeline'],['run-pipeline','run-pipeline','run-pipeline'],['run-pipeline']];
export function createLoggingFlow({record,show}){
 let busy=false,frames=[],generation=0,attempt=null,completed=false;
 return {
  get busy(){return busy;},get frames(){return structuredClone(frames);},get completed(){return completed;},
  cancel(){generation++;busy=false;frames=[];attempt=null;completed=false;},
  async replay(){if(busy||!completed)return;busy=true;const token=generation;try{for(const f of frames){if(token!==generation)return;await show(structuredClone(f));}}finally{if(token===generation)busy=false;}},
  async run(topic){
   if(busy)return;busy=true;const token=generation;
   if(!attempt||attempt.topic!==topic){attempt={topic,state:loggingPreset(topic),index:0,pending:null};frames=[];completed=false;}
   const current=attempt,actions=loggingSequences[topic];
   try{while(current.index<actions.length){
    if(token!==generation)return;
    const action=actions[current.index],retry=!!current.pending;
    if(!current.pending){
     const before=structuredClone(current.state),s=current.state;let result={meaningful:true};
     if(action==='inspect-logs'){s.logs=inspectLogs('all','error');s.logScope='ทุกบริการ';result.message=`พบ ${s.logs.length} errors · ยังไม่ได้แก้ไขบริการ`;}
     else if(action==='inspect-metrics'){s.metrics=inspectMetrics(['host','tier','business'][topic-1]);result.message=['ค่าเครื่องเดียว ไม่ยืนยันว่าบริการอื่นปกติ','ดูทั้ง query, cache และคิว · ยังระบุสาเหตุไม่ได้','ดูช่วงเวลาและกลุ่มผู้ใช้ ก่อนเปรียบเทียบ'][topic-1];}
     else result=pipelineStep(s);
     const frame={action,topic,index:current.index,total:actions.length,before,state:structuredClone(s),message:result.message};
     current.pending={meaningful:result.meaningful};frames.push(frame);await show(structuredClone(frame));
    }
    if(token!==generation)return;
    if(current.pending.meaningful)await record(action,retry);
    if(token!==generation)return;current.pending=null;current.index++;
   }completed=true;attempt=null;}finally{if(token===generation)busy=false;}
  }
 };
}
