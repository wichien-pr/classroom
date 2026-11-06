import {flowStep} from './models.js';
import {flowView} from './single-server.js';
// Entry only prepares a fresh cold lookup. No transition or scoring on navigation.
export function flowPreset(topic){
 return {step:0,client:topic===3?'mobile':'browser',end:[2,3,6,6][topic]??2};
}
// One explicit attempt, made of original meaningful model transitions.
// Frames are evidence for playback, never actions or synthetic progress.
export function runFlowTopic(topic){
 const result={...flowPreset(topic),frames:[]};
 while(result.step<result.end){result.step=flowStep(result.step);result.frames.push({step:result.step,view:flowView(result.step,result.client)});}
 return result;
}
