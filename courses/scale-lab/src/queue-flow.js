import {queueInitial,queueAction} from './message-queue.js';
export function queuePreset(topic){
 const s=queueInitial();s.consumerUp=false;return s;
}

export const queueSequences=[['enqueue-jobs','process-jobs','process-jobs','process-jobs']];
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
      // Unscored setup: the submitted jobs outlive the submitting service.
      if(current.index===1){current.state.producerUp=false;current.state.consumerUp=true;}
      const before=structuredClone(current.state),result=queueAction(current.state,action,'crop');
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
