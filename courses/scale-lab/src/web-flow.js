import {webInitial,webRequest} from './stateless-web.js';
// Conditions change without requests; each captured request keeps its own save.
export function createWebFlow({record,show}){
 let busy=false,frames=[],generation=0,attempt=null,completed=false,paused=false,resume=null;
 const gate=()=>paused?new Promise(r=>resume=r):Promise.resolve();
 return {
  get busy(){return busy;},get completed(){return completed;},get frames(){return structuredClone(frames);},get paused(){return paused;},
  pause(value){paused=value;if(!value){resume?.();resume=null;}},
  cancel(){generation++;busy=false;frames=[];attempt=null;completed=false;paused=false;resume?.();resume=null;},
  async replay(){if(busy||!completed)return;busy=true;const token=generation;try{for(const frame of frames){await gate();if(token!==generation)return;await show(structuredClone(frame));}}finally{if(token===generation)busy=false;}},
  async run(){
   if(busy)return;busy=true;const token=generation;paused=false;resume?.();resume=null;
   if(!attempt){attempt={index:0,pending:false,state:webInitial()};frames=[];completed=false;}
   const current=attempt;
   try{
    while(current.index<4){
     await gate();if(token!==generation)return;
     const retry=current.pending;
     if(!current.pending){
      const topic=current.index,state=webInitial(topic<2?'local':'shared'),options={target:topic%2,sticky:false};
      state.requests=current.state.requests;state.storeReads=current.state.storeReads;
      const before=structuredClone(state);webRequest(state,options);current.state=state;
      const frame={state:structuredClone(state),before,options,topic,beat:topic<2?1:2,beatTotal:2};
      frame.outcomes=[...frames.map(f=>({...f.state.last,mode:f.state.mode})),{...state.last,mode:state.mode}];
      frames.push(frame);current.pending=true;await show(structuredClone(frame));
     }
     await gate();if(token!==generation)return;
     await record('web-request',retry);
     if(token!==generation)return;
     current.pending=false;current.index++;
    }
    completed=true;attempt=null;
   }finally{if(token===generation)busy=false;}
  }
 };
}
