import {dataCentersInitial,evaluateDataCenters} from './data-centers.js';
// Two independent deployments, not a failover or data migration timeline.
export function dcPreset(topic=0){
 if(!Number.isInteger(topic)||topic<0||topic>5)throw Error('Unknown data-center topic');
 if(topic===0)return {...dataCentersInitial(),eastCapacity:60,westCapacity:60};
 // Retained model fixtures, not learner-facing topics.
 const c=dataCentersInitial();c.westUp=false;
 if(topic>=2)c.redirect=true;
 if(topic===2)c.freshDNS=false;
 if(topic===4)c.synced=false;
 if(topic===5)c.eastCapacity=60;
 return c;
}
export function createDcFlow({record,show}){
 let busy=false,frame=null,generation=0,pending=false,completed=false,cursor=0,retry=false;
 return {
  get busy(){return busy;},get completed(){return completed;},
  cancel(){generation++;busy=false;frame=null;pending=false;completed=false;cursor=0;retry=false;},
  async replay(){if(busy||!completed)return;busy=true;const token=generation;try{await show(structuredClone(frame));}finally{if(token===generation)busy=false;}},
  async run(topic=0){
   if(busy)return;busy=true;const token=generation;
   try{
    if(!pending){
     const state=dcPreset(topic),single={...state,eastShare:100,westUp:false,westCapacity:0};
     const comparison=[single,state].map(state=>({state,result:evaluateDataCenters(state)}));
     frame={state,result:comparison[1].result,comparison,topic};completed=false;pending=true;cursor=0;retry=false;
     await show(structuredClone(frame));
    }
    while(token===generation&&cursor<frame.comparison.length){
     try{await record('dc-request',retry);}catch(error){if(token===generation)retry=true;throw error;}
     if(token!==generation)return;
     cursor++;retry=false;
    }
    if(token!==generation)return;
    pending=false;completed=true;
   }finally{if(token===generation)busy=false;}
  }
 };
}
