import {dataCentersInitial,evaluateDataCenters} from './data-centers.js';
// Each topic starts fresh; configuration is never a scored operation.
export function dcPreset(topic){
 if(!Number.isInteger(topic)||topic<0||topic>5)throw Error('Unknown data-center topic');
 const c=dataCentersInitial();
 if(topic>0)c.westUp=false;
 if(topic>=2)c.redirect=true;
 if(topic===2)c.freshDNS=false;
 if(topic===4)c.synced=false;
 if(topic===5)c.eastCapacity=60;
 return c;
}
export function createDcFlow({record,show}){
 let busy=false,frame=null,generation=0,pending=false,completed=false;
 return {
  get busy(){return busy;},get completed(){return completed;},
  cancel(){generation++;busy=false;frame=null;pending=false;completed=false;},
  async replay(){if(busy||!completed)return;busy=true;const token=generation;try{await show(structuredClone(frame));}finally{if(token===generation)busy=false;}},
  async run(topic){
   if(busy)return;busy=true;const token=generation,retry=pending;
   try{
    if(!pending){const state=dcPreset(topic);const result=evaluateDataCenters(state);frame={state,result,topic};completed=false;pending=true;await show(structuredClone(frame));}
    if(token!==generation)return;
    await record('dc-request',retry);
    if(token!==generation)return;
    pending=false;completed=true;
   }finally{if(token===generation)busy=false;}
  }
 };
}
