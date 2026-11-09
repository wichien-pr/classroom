import {cachePreset,cacheAction} from './cache.js';

export const cacheSequences=[['read-cache','read-cache'],['read-cache','update','read-cache'],['read-cache','update','read-cache','invalidate','read-cache'],['read-cache','update','tick','tick','tick','read-cache'],['read-cache','outage','read-cache','restart','read-cache']];
export function createCacheFlow({record,show}){
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
   if(!attempt||attempt.topic!==topic){attempt={topic,state:cachePreset(topic),index:0,pending:null};frames=[];completed=false;}
   const current=attempt,actions=cacheSequences[topic];
   try{
    while(current.index<actions.length){
     if(token!==generation)return;
     const action=actions[current.index];let retry=!!current.pending;
     if(!current.pending){
      const before=structuredClone(current.state),result=cacheAction(current.state,action,150);
      const frame={action,index:current.index,total:actions.length,state:structuredClone(current.state),message:result.message,before};
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
