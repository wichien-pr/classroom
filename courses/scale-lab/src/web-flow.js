import {webPreset,webRequest} from './stateless-web.js';
export function createWebFlow({record,show}){
 let busy=false,frame=null,generation=0,pending=false,completed=false;
 return {
  get busy(){return busy;},get completed(){return completed;},
  cancel(){generation++;busy=false;frame=null;pending=false;completed=false;},
  async replay(){if(busy||!completed)return;busy=true;const token=generation;try{await show(structuredClone(frame));}finally{if(token===generation)busy=false;}},
  async run(topic){
   if(busy)return;busy=true;const token=generation,retry=pending;
   try{
    if(!pending){const {state,options}=webPreset(topic);const before=structuredClone(state);webRequest(state,options);frame={state,before,options,topic};completed=false;pending=true;await show(structuredClone(frame));}
    if(token!==generation)return;
    await record('web-request',retry);
    if(token!==generation)return;
    pending=false;completed=true;
   }finally{if(token===generation)busy=false;}
  }
 };
}
