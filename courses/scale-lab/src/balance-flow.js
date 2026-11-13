import {balancePreset,routeBalance} from './balance.js';
export const BALANCE_BATCH_SIZE=6;
// Each original route is awaited and captured once; presentation never reroutes.
export function createBalanceFlow({record,show}){
 let busy=false,frames=[],generation=0,attempt=null,completed=false,paused=false,release;
 const gate=async token=>{while(paused&&token===generation)await new Promise(resolve=>release=resolve);};
 return {
  get busy(){return busy;},get paused(){return paused;},get completed(){return completed;},get frames(){return structuredClone(frames);},
  pause(value){paused=value;if(!paused){release?.();release=null;}},
  cancel(){generation++;paused=false;release?.();release=null;busy=false;frames=[];attempt=null;completed=false;},
  async replay(){
   if(busy||!completed)return;busy=true;const token=generation;
   try{for(const frame of frames){await gate(token);if(token!==generation)return;await show(structuredClone(frame));}await gate(token);}
   finally{if(token===generation){busy=false;paused=false;release?.();release=null;}}
  },
  async run(topic){
   if(busy)return;busy=true;const token=generation;
   if(!attempt||attempt.topic!==topic){attempt={topic,state:balancePreset(topic),index:0,pending:false};frames=[];completed=false;}
   const current=attempt;
   try{
    while(current.index<BALANCE_BATCH_SIZE){
     await gate(token);if(token!==generation)return;
     const retry=current.pending;
     if(!current.pending){
      const target=routeBalance(current.state,current.state.up);
      const frame={target,index:current.index,total:BALANCE_BATCH_SIZE,targets:[...frames.map(f=>f.target),target],state:structuredClone(current.state)};
      current.pending=true;frames.push(frame);await show(structuredClone(frame));
     }
     if(token!==generation)return;
     await record('route',retry);
     await gate(token);if(token!==generation)return;
     current.pending=false;current.index++;
    }
    completed=true;attempt=null;
   }finally{if(token===generation){busy=false;paused=false;release?.();release=null;}}
  }
 };
}
