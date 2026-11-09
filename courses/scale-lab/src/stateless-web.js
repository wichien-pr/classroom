// Deterministic scenario: A already has a cookie for one valid session.
export const webInitial=(mode='local')=>({mode,up:[true,true,false],storeUp:true,storeReads:0,requests:0,last:null});
// Independent teaching conditions; preparation never sends a request.
export function webPreset(topic){
 const state=webInitial(topic<2?'local':'shared');
 if(topic>=3)state.up[0]=false;
 if(topic>=4)state.up[2]=true;
 if(topic===5)state.storeUp=false;
 if(topic===6)state.up=[false,false,false];
 return {state,options:{target:topic>=4?2:1,sticky:topic===1}};
}
export function webRequest(s,{target=1,sticky=false}={}){
 let server=sticky?0:target;
 // Model assumes health detection completed, then first healthy fallback.
 if(!s.up[server])server=s.up.findIndex(Boolean);
 let code='NO_WEB';
 if(server>=0){
  if(s.mode==='shared') {s.storeReads++;code=s.storeUp?'OK':'STORE_UNAVAILABLE';}
  else code=server===0?'OK':'NO_SESSION';
 }
 s.requests++;
 return s.last={server,code};
}
