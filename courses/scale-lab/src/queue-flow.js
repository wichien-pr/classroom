import {queueInitial,queueAction} from './message-queue.js';
export function queuePreset(topic){
 const s=queueInitial();const count=[0,3,6,0,9][topic];
 s.jobs=Array.from({length:count},(_,i)=>({id:i+1,type:topic===4?'blur':'crop'}));s.nextId=count+1;
 if(topic===1)s.consumerUp=false;if(topic===2)s.producerUp=false;if(topic===4)s.workers=4;return s;
}

export const queueSequences=[['enqueue-jobs'],['enqueue-jobs','process-jobs'],['process-jobs'],['enqueue-jobs','enqueue-jobs','process-jobs','enqueue-jobs'],['process-jobs']];
export function createQueueFlow({record,show}){
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
   if(!attempt||attempt.topic!==topic){attempt={topic,state:queuePreset(topic),index:0,pending:null};frames=[];completed=false;}
   const current=attempt,actions=queueSequences[topic];
   try{
    while(current.index<actions.length){
     if(token!==generation)return;
     const action=actions[current.index];let retry=!!current.pending;
     if(!current.pending){
      const before=structuredClone(current.state),result=queueAction(current.state,action,topic===3?'sharpen':'crop');
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
