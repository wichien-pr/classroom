// Deterministic batch of 100 read requests, not measured throughput or a DNS implementation.
export const dataCentersInitial=()=>({eastShare:60,eastUp:true,westUp:true,redirect:false,freshDNS:true,synced:true,sameRelease:true,eastCapacity:100,westCapacity:100});
export function evaluateDataCenters(c){
 for(const key of ['eastShare','eastCapacity','westCapacity'])if(!Number.isInteger(c[key])||c[key]<0||c[key]>100)throw Error('กรุณากรอกจำนวนเต็ม 0–100');
 for(const key of ['eastUp','westUp','redirect','freshDNS','synced','sameRelease'])if(typeof c[key]!=='boolean')throw Error('กรุณาเลือกสถานการณ์ที่รองรับ');
 const original=[c.eastShare,100-c.eastShare],routes=[...original],up=[c.eastUp,c.westUp];
 if(c.redirect&&c.freshDNS&&up[0]!==up[1]){routes[up[0]?0:1]=100;routes[up[0]?1:0]=0;}
 const unavailable=routes.reduce((n,count,i)=>n+(up[i]?0:count),0);
 const moved=Math.abs(routes[0]-original[0]);
 const missingData=c.synced?0:moved;
 const capacities=[c.eastCapacity,c.westCapacity];
 const overloaded=routes.reduce((n,count,i)=>n+(up[i]?Math.max(0,count-capacities[i]):0),0);
 // These risks overlap: never add them up as a count of failed requests.
 return {routes,unavailable,moved,missingData,overloaded,releaseMismatch:!c.sameRelease};
}
