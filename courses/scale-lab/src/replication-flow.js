import {replicationPreset,replicationAction} from './replication.js';
import {replicationRoutes} from './replication-presentation.js';
export const replicationSequences=[['write','read-replica'],['read-primary','sync','read-replica'],['read-replica'],['read-replica'],['write','sync','read-replica'],['promote','fence','promote','accept-loss','promote','write','read-primary','read-replica','sync','read-replica']];
export function createReplicationFlow({record,show}){
 let busy=false,frames=[],generation=0,attempt=null,completed=false,paused=false,waiters=[];
 const resume=()=>{paused=false;waiters.splice(0).forEach(r=>r());};
 const gate=async()=>{while(paused)await new Promise(r=>waiters.push(r));};
 return {
  get paused(){return paused;},pause(value){if(value)paused=true;else resume();},
  get busy(){return busy;},get frames(){return structuredClone(frames);},get completed(){return completed;},
  cancel(){generation++;resume();busy=false;frames=[];attempt=null;completed=false;},
  async replay(){
   if(busy||!completed)return;busy=true;const token=generation;
   try{for(const frame of frames){await gate();if(token!==generation)return;await show(structuredClone(frame));}}
   finally{if(token===generation)busy=false;}
  },
  async run(topic){
   if(busy)return;resume();busy=true;const token=generation;
   if(!attempt||attempt.topic!==topic){attempt={topic,state:replicationPreset(topic),index:0,pending:null};frames=[];completed=false;}
   const current=attempt,actions=replicationSequences[topic];
   try{
    while(current.index<actions.length){
     await gate();if(token!==generation)return;
     const action=actions[current.index];let retry=!!current.pending;
     if(!current.pending){
      const before=structuredClone(current.state);
      // Explicit unscored prerequisite settings; guarded promotion remains the original model operation.
      let result;
      if(action==='fence'){current.state.fenced=true;result={meaningful:false,message:'Fencing · หยุดเครื่องเดิมไม่ให้รับงานเขียน แม้กลับมาออนไลน์'};}
      else if(action==='accept-loss'){current.state.acceptLoss=true;result={meaningful:false,message:`ยอมรับว่าอาจสูญเสีย ${Math.max(0,current.state.versions[0]-current.state.versions[1])} ขั้นเขียน ก่อนเปลี่ยน Primary ในแบบจำลอง`};}
      else result=replicationAction(current.state,action);
      const routes=replicationRoutes(before,action);
      if(topic===0&&action==='read-replica'&&routes.length)routes.push([routes[0][1],'web']);
      const frame={topic,before,action,index:current.index,total:actions.length,state:structuredClone(current.state),message:result.message,routes};
      current.pending={meaningful:result.meaningful};frames.push(frame);await show(structuredClone(frame));
     }
     if(token!==generation)return;
     if(current.pending.meaningful)await record(action,retry);
     if(token!==generation)return;
     current.pending=null;current.index++;
    }
    completed=true;attempt=null;
   }finally{if(token===generation)busy=false;}
  }
 };
}
