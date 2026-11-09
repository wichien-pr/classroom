import {cdnPreset,cdnAction} from './cdn.js';

export const cdnSequences=[
 ['request','request'],
 ['request','publish','request'],
 ['request','publish','tick','tick','tick','request'],
 ['request','publish','request','invalidate','request'],
 ['request','publish','version','request','ignore-query','request'],
 ['outage','request','enable-fallback','request','origin-outage','request'],
];
function transition(s,action){
 const setup={outage:['up',false],'enable-fallback':['fallback',true],'origin-outage':['originUp',false],'ignore-query':['includeQuery',false]};
 if(setup[action]){const [key,value]=setup[action];s[key]=value;return {meaningful:false,message:{outage:'CDN ล่ม · ยังไม่มีทางสำรอง','enable-fallback':'เปิดทางสำรองจาก client ไป origin','origin-outage':'Origin ล่มด้วย · ทางสำรองใช้ไม่ได้','ignore-query':'ไม่นับ query ใน key · URL รุ่นใหม่กลับใช้ key เดิม'}[action]};}
 return cdnAction(s,action);
}
export function createCdnFlow({record,show}){
 let busy=false,frames=[],generation=0,attempt=null,completed=false;
 return {
  get busy(){return busy;},get frames(){return structuredClone(frames);},get completed(){return completed;},
  cancel(){generation++;busy=false;frames=[];attempt=null;completed=false;},
  async replay(){
   if(busy||!completed)return;busy=true;const token=generation;
   try{for(const frame of frames){if(token!==generation)return;await show(structuredClone(frame));}}
   finally{if(token===generation)busy=false;}
  },
  async run(topic){
   if(busy)return;busy=true;const token=generation;
   if(!attempt||attempt.topic!==topic){attempt={topic,state:cdnPreset(topic),index:0,pending:null};frames=[];completed=false;}
   const current=attempt,actions=cdnSequences[topic];
   try{
    while(current.index<actions.length){
     if(token!==generation)return;
     const action=actions[current.index];let retry=!!current.pending;
     if(!current.pending){
      const before=structuredClone(current.state),result=transition(current.state,action);
      const frame={action,index:current.index,total:actions.length,state:structuredClone(current.state),message:result.message,before};
      current.pending={meaningful:result.meaningful};frames.push(frame);await show(structuredClone(frame));
     }
     if(token!==generation)return;
     if(current.pending.meaningful)await record('decision',retry);
     if(token!==generation)return;
     current.pending=null;current.index++;
    }
    completed=true;attempt=null;
   }finally{if(token===generation)busy=false;}
  }
 };
}
