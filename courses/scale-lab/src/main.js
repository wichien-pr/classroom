import './database-scaling.css';
import {mountTierPresentation} from './data-tier-presentation.js';
let tierPresentation=null;
import {dataTierInitial,evaluateDataTier} from './database-scaling.js';
import {dataTierControls,dataTierDiagram,dataTierNotes,tierStatus} from './database-scaling-view.js';
import './logging.css';
import {loggingInitial,inspectLogs,inspectMetrics,pipelineStep} from './logging.js';
import {loggingControls,loggingDiagram,loggingNotes,pipelineLabel} from './logging-view.js';
import './message-queue.css';
import {queueInitial,queueAction} from './message-queue.js';
import {queueControls,queueDiagram,queueNotes} from './message-queue-view.js';
import './stateless-web.css';
import {webInitial,webRequest} from './stateless-web.js';
import {webControls,webDiagram,webNotes,webSteps} from './stateless-web-view.js';
import './style.css';
import './theme.css';
import './read-more.css';
import './completion-footer.css';
import './web-presentation.css';
import {webScene,bindWebPlayback,stopWebPlayback} from './web-presentation.js';
import {webPreset} from './stateless-web.js';
import {createWebFlow} from './web-flow.js';
let webTopic=0,webResult=null,webPlay=false,webAnimation,webEpoch=0;
const webFlow=createWebFlow({
 show:frame=>{webResult=frame;webPlay=true;renderState();return webAnimation;},
 record:async(action,retry)=>{
  if(participation){
   if(!retry)await participationOperation('record','stateless-web',action);
   else if(participation.status==='save-error')await participationOperation('retry');
   if(participation.status!=='saved')throw Error('บันทึกไม่ได้ · ลองบันทึกกิจกรรมอีกครั้งที่ส่วนสถานะ แล้วกดทดลองเพื่อทำต่อ');
  }else{localEligibility.record('stateless-web',action);renderProgress();}
 }
});
function cancelWebFlow(){webEpoch++;webFlow.cancel();stopWebPlayback();}
function prepareWebTopic(index){cancelWebFlow();webTopic=index;webResult=null;webPlay=false;state.webLab=webPreset(index).state;renderState();}
async function runWeb(replay=false){
 if(webFlow.busy||quizBlocked()||pendingLesson!==null)return;
 const epoch=webEpoch,focus=$('#web-run');
 try{const pending=replay?webFlow.replay():webFlow.run(webTopic);renderWebControls();await pending;}
 catch(error){if(epoch===webEpoch)$('#web-result').textContent=error.message;}
 finally{if(epoch===webEpoch){renderWebControls();if(focus?.isConnected&&!focus.disabled&&document.activeElement===document.body)focus.focus({preventScroll:true});}}
}
function renderWebControls(){
 const button=$('#web-run');if(!button)return;
 const busy=webFlow.busy,blocked=quizBlocked()||pendingLesson!==null;button.disabled=busy||blocked;button.setAttribute('aria-busy',String(busy||participation?.status==='saving'));
 setWorkloadIcon(button,participation?.status==='saving'?'saving':'play',participation?.status==='saving'?'กำลังบันทึก':busy?'กำลังทดลอง':'ทดลอง');
 const replay=$('#web-replay');if(replay){replay.disabled=busy||blocked||!webFlow.completed;replay.onclick=()=>runWeb(true);}
 button.onclick=()=>runWeb();
}
import './logging-presentation.css';
import {loggingScene,bindLoggingPlayback,stopLoggingPlayback} from './logging-presentation.js';
import {createLoggingStory as createLoggingFlow,loggingStageFrames,loggingPages,storyStages} from './logging-story.js';
const loggingSnapshots=loggingStageFrames();
const loggingPreset=()=>loggingInitial();
let loggingTopic=0,loggingResult=null,loggingPlay=false,loggingAnimation,loggingEpoch=0;
const loggingFlow=createLoggingFlow({
 show:frame=>{loggingResult=frame;loggingPlay=true;renderState();return loggingAnimation;},
 record:async(action,retry)=>{
  if(participation){
   if(!retry)await participationOperation('record','logging-operations',action);
   else if(participation.status==='save-error')await participationOperation('retry');
   if(participation.status!=='saved')throw Error('บันทึกไม่ได้ · ลองบันทึกกิจกรรมอีกครั้งที่ส่วนสถานะ แล้วกดทดลองเพื่อทำต่อ');
  }else{localEligibility.record('logging-operations',action);renderProgress();}
 }
});
function cancelLoggingFlow(){loggingEpoch++;loggingFlow.cancel();stopLoggingPlayback();}
function prepareLoggingTopic(){selectLoggingEvidence(0);}
async function selectLoggingEvidence(index,play=false){
  if(index<0||index>=loggingPages.length)return;
  cancelLoggingFlow();loggingTopic=index;const epoch=loggingEpoch;
  if(!play){loggingResult=null;loggingPlay=false;renderState();return;}
  // Projection-only playback: all phases on this page, never the following page.
  for(const stage of loggingPages[index].stages){
   loggingResult=structuredClone(loggingSnapshots[stage]);loggingPlay=true;renderState();
   await loggingAnimation;if(epoch!==loggingEpoch)return;
  }
 }
function replayLoggingStage(){selectLoggingEvidence(loggingTopic,true);}
async function runLogging(){
 if(loggingFlow.busy||quizBlocked()||pendingLesson!==null)return;
 loggingEpoch++;stopLoggingPlayback();
 const epoch=loggingEpoch,focus=$('#logging-run');
 try{const pending=loggingFlow.run(loggingTopic);renderLoggingControls();await pending;}
 catch(error){if(epoch===loggingEpoch)$('#logging-result').textContent=error.message;}
 finally{if(epoch===loggingEpoch){renderLoggingControls();if(focus?.isConnected&&!focus.disabled&&document.activeElement===document.body)focus.focus({preventScroll:true});}}
}
function renderLoggingControls(){
 const button=$('#logging-run');if(!button)return;
 const busy=loggingFlow.busy,blocked=quizBlocked()||pendingLesson!==null;button.disabled=busy||blocked;button.setAttribute('aria-busy',String(busy||participation?.status==='saving'));
 setWorkloadIcon(button,participation?.status==='saving'?'saving':'play',participation?.status==='saving'?'กำลังบันทึก':busy?'กำลังทดลองขั้นนี้':['change','observe'].includes(storyStages[loggingPages[loggingTopic].stages[0]][0])?'เล่นภาพขั้นนี้ · ไม่บันทึกกิจกรรม':'ทดลองขั้นนี้ · บันทึกกิจกรรม');
  const replay=$('#logging-replay');if(replay){replay.disabled=!loggingResult;replay.onclick=replayLoggingStage;}
  const heading=$('#lesson-topic-title'),topic=$('#lesson-topic');
  heading.textContent=`${loggingTopic+1} / ${loggingPages.length} · ${loggingPages[loggingTopic].title}`;
  topic.dataset.topic=String(loggingTopic);
  const back=$('#lesson-topic-back'),next=$('#lesson-topic-next');
  back.disabled=loggingTopic===0;next.disabled=loggingTopic===loggingPages.length-1;
  back.onclick=()=>selectLoggingEvidence(loggingTopic-1,true);
  next.onclick=()=>selectLoggingEvidence(loggingTopic+1,true);
 button.onclick=()=>runLogging();

}
import './queue-presentation.css';
import {queueScene,bindQueuePlayback,stopQueuePlayback} from './queue-presentation.js';
import {queuePreset,createQueueFlow} from './queue-flow.js';
let queueTopic=0,queueResult=null,queuePlay=false,queueAnimation,queueEpoch=0;
const queueFlow=createQueueFlow({
 show:frame=>{queueResult=frame;queuePlay=true;renderState();return queueAnimation;},
 record:async(action,retry)=>{
  if(participation){
   if(!retry)await participationOperation('record','message-queue',action);
   else if(participation.status==='save-error')await participationOperation('retry');
   if(participation.status!=='saved')throw Error('บันทึกไม่ได้ · ลองบันทึกกิจกรรมอีกครั้งที่ส่วนสถานะ แล้วกดทดลองเพื่อทำต่อ');
  }else{localEligibility.record('message-queue',action);renderProgress();}
 }
});
function cancelQueueFlow(){queueEpoch++;queueFlow.cancel();stopQueuePlayback();}
function prepareQueueTopic(index){cancelQueueFlow();queueTopic=index;queueResult=null;queuePlay=false;state.queueLab=queuePreset(index);renderState();}
async function runQueue(replay=false){
 if(queueFlow.busy||quizBlocked()||pendingLesson!==null)return;
 const epoch=queueEpoch,focus=$('#queue-run');
 try{const pending=replay?queueFlow.replay():queueFlow.run(queueTopic);renderQueueControls();await pending;}
 catch(error){if(epoch===queueEpoch)$('#queue-result').textContent=error.message;}
 finally{if(epoch===queueEpoch){renderQueueControls();if(focus?.isConnected&&!focus.disabled&&document.activeElement===document.body)focus.focus({preventScroll:true});}}
}
function renderQueueControls(){
 const button=$('#queue-run');if(!button)return;
 const busy=queueFlow.busy,blocked=quizBlocked()||pendingLesson!==null;button.disabled=busy||blocked;button.setAttribute('aria-busy',String(busy||participation?.status==='saving'));
 setWorkloadIcon(button,participation?.status==='saving'?'saving':'play',participation?.status==='saving'?'กำลังบันทึก':busy?'กำลังทดลอง':'ทดลอง');
 const replay=$('#queue-replay');if(replay){replay.disabled=busy||blocked||!queueFlow.completed;replay.onclick=()=>runQueue(true);}
 button.onclick=()=>runQueue();
}
import './dc-presentation.css';
import {dcScene,bindDcPlayback,stopDcPlayback} from './dc-presentation.js';
import {dcPreset} from './dc-flow.js';
import {createDcFlow} from './dc-flow.js';
let dcTopic=0,dcResult=null,dcPlay=false,dcAnimation,dcEpoch=0;
const dcFlow=createDcFlow({
 show:frame=>{dcResult=frame;dcPlay=true;renderState();return dcAnimation;},
 record:async(action,retry)=>{
  if(participation){
   if(!retry)await participationOperation('record','data-centers',action);
   else if(participation.status==='save-error')await participationOperation('retry');
   if(participation.status!=='saved')throw Error('บันทึกไม่ได้ · ลองบันทึกกิจกรรมอีกครั้งที่ส่วนสถานะ แล้วกดทดลองเพื่อทำต่อ');
  }else{localEligibility.record('data-centers',action);renderProgress();}
 }
});
function cancelDcFlow(){dcEpoch++;dcFlow.cancel();stopDcPlayback();}
function prepareDcTopic(index){cancelDcFlow();dcTopic=index;dcResult=null;dcPlay=false;state.dataCenters=dcPreset(index);renderState();}
async function runDc(replay=false){
 if(dcFlow.busy||quizBlocked()||pendingLesson!==null)return;
 const epoch=dcEpoch,focus=$('#dc-run');
 try{const pending=replay?dcFlow.replay():dcFlow.run(dcTopic);renderDcControls();await pending;}
 catch(error){if(epoch===dcEpoch)$('#dc-result').textContent=error.message;}
 finally{if(epoch===dcEpoch){renderDcControls();if(focus?.isConnected&&!focus.disabled&&document.activeElement===document.body)focus.focus({preventScroll:true});}}
}
function renderDcControls(){
 const button=$('#dc-run');if(!button)return;
 const busy=dcFlow.busy,blocked=quizBlocked()||pendingLesson!==null;button.disabled=busy||blocked;button.setAttribute('aria-busy',String(busy||participation?.status==='saving'));
 setWorkloadIcon(button,participation?.status==='saving'?'saving':'play',participation?.status==='saving'?'กำลังบันทึก':busy?'กำลังทดลอง':'ทดลอง');
 const replay=$('#dc-replay');if(replay){replay.disabled=busy||blocked||!dcFlow.completed;replay.onclick=()=>runDc(true);}
 button.onclick=()=>runDc();
}
import './cdn.css';
import './cdn-presentation.css';
import {cdnScene,bindCdnPlayback,stopCdnPlayback,cdnLabels} from './cdn-presentation.js';
import {cdnPreset} from './cdn.js';
import {createCdnFlow} from './cdn-flow.js';
let cdnTopic=0,cdnResult=null,cdnPlay=false,cdnAnimation,cdnEpoch=0,cdnMode='';
const cdnFlow=createCdnFlow({
 show:frame=>{cdnResult=frame;cdnPlay=true;renderState();return cdnAnimation;},
 record:async(action,retry)=>{
  if(participation){
   if(!retry)await participationOperation('record','cdn',action);
   else if(participation.status==='save-error')await participationOperation('retry');
   if(participation.status!=='saved')throw Error('บันทึกไม่ได้ · ลองบันทึกกิจกรรมอีกครั้งที่ส่วนสถานะ แล้วกดทดลองเพื่อทำต่อ');
  }else{localEligibility.record('cdn',action);renderProgress();}
 }
});
function cancelCdnFlow(){cdnEpoch++;cdnFlow.cancel();cdnMode='';stopCdnPlayback();}
function prepareCdnTopic(index){cancelCdnFlow();cdnTopic=index;cdnResult=null;cdnPlay=false;state.cdnLab=cdnPreset(index);renderState();}
async function runCdn(replay=false){
 if(cdnFlow.busy||quizBlocked()||pendingLesson!==null)return;
 const epoch=cdnEpoch,focus=$('#cdn-run');cdnMode=replay?'เล่นภาพซ้ำ':'ทดลอง';
 try{const pending=replay?cdnFlow.replay():cdnFlow.run(cdnTopic);renderCdnControls();await pending;}
 catch(error){if(epoch===cdnEpoch)$('#cdn-result').textContent=error.message;}
 finally{if(epoch===cdnEpoch){cdnMode='';renderCdnControls();if(focus?.isConnected&&!focus.disabled&&document.activeElement===document.body)focus.focus({preventScroll:true});}}
}
function renderCdnControls(){
 const button=$('#cdn-run');if(!button)return;
 const busy=cdnFlow.busy,blocked=quizBlocked()||pendingLesson!==null;button.disabled=busy||blocked;button.setAttribute('aria-busy',String(busy||participation?.status==='saving'));
 setWorkloadIcon(button,participation?.status==='saving'?'saving':'play',participation?.status==='saving'?'กำลังบันทึก':busy?'กำลังทดลอง':'ทดลอง');
 const replay=$('#cdn-replay');if(replay){replay.disabled=busy||blocked||!cdnFlow.completed;replay.onclick=()=>runCdn(true);}
 const stage=$('#cdn-stage');if(stage)stage.textContent=cdnResult?`${cdnMode|| (cdnFlow.completed?'ครบทุกขั้น':'หยุดรอ')} · ${cdnResult.index+1} / ${cdnResult.total} · ${cdnLabels[cdnResult.action]}`:'';
 button.onclick=()=>runCdn();
}


import {cdnInitial,cdnAction} from './cdn.js';
import {cdnControls,cdnDiagram,cdnNotes} from './cdn-view.js';
import './cache.css';
import './cache-presentation.css';
import {cacheScene,bindCachePlayback,stopCachePlayback,cacheLabels} from './cache-presentation.js';
import {cachePreset} from './cache.js';
import {createCacheFlow} from './cache-flow.js';
let cacheTopic=0,cacheResult=null,cachePlay=false,cacheAnimation,cacheEpoch=0,cacheMode='';
const cacheFlow=createCacheFlow({
 show:frame=>{cacheResult=frame;cachePlay=true;renderState();return cacheAnimation;},
 record:async(action,retry)=>{
  if(participation){
   if(!retry)await participationOperation('record','cache',action);
   else if(participation.status==='save-error')await participationOperation('retry');
   if(participation.status!=='saved')throw Error('บันทึกไม่ได้ · ลองบันทึกกิจกรรมอีกครั้งที่ส่วนสถานะ แล้วกดทดลองเพื่อทำต่อ');
  }else{localEligibility.record('cache',action);renderProgress();}
 }
});
function cancelCacheFlow(){cacheEpoch++;cacheFlow.cancel();cacheMode='';stopCachePlayback();}
function prepareCacheTopic(index){cancelCacheFlow();cacheTopic=index;cacheResult=null;cachePlay=false;state.cacheLab=cachePreset(index);renderState();}
async function runCache(replay=false){
 if(cacheFlow.busy||quizBlocked()||pendingLesson!==null)return;
 const epoch=cacheEpoch,focus=$('#cache-run');cacheMode=replay?'เล่นภาพซ้ำ':'ทดลอง';
 try{const pending=replay?cacheFlow.replay():cacheFlow.run(cacheTopic);renderCacheControls();await pending;}
 catch(error){if(epoch===cacheEpoch)$('#cache-result').textContent=error.message;}
 finally{if(epoch===cacheEpoch){cacheMode='';renderCacheControls();if(focus?.isConnected&&!focus.disabled&&document.activeElement===document.body)focus.focus({preventScroll:true});}}
}
function renderCacheControls(){
 const button=$('#cache-run');if(!button)return;
 const busy=cacheFlow.busy,blocked=quizBlocked()||pendingLesson!==null;button.disabled=busy||blocked;button.setAttribute('aria-busy',String(busy||participation?.status==='saving'));
 setWorkloadIcon(button,participation?.status==='saving'?'saving':'play',participation?.status==='saving'?'กำลังบันทึก':busy?'กำลังทดลอง':'ทดลอง');
 const replay=$('#cache-replay');if(replay){replay.disabled=busy||blocked||!cacheFlow.completed;replay.onclick=()=>runCache(true);}
 const stage=$('#cache-stage');if(stage)stage.textContent=cacheResult?`${cacheMode|| (cacheFlow.completed?'ครบทุกขั้น':'หยุดรอ')} · ${cacheResult.index+1} / ${cacheResult.total} · ${cacheLabels[cacheResult.action]}`:'';
 button.onclick=()=>runCache();
}

import {cacheInitial,cacheAction} from './cache.js';
import {cacheControls,cacheDiagram,cacheNotes} from './cache-view.js';
import {LOCAL_PROGRESS_KEY,readLocalProgress,encodeLocalProgress,mergeLocalProgress} from './local-progress.js';
import './single-server.css';
import './database.css';
import './scaling.css';
import './scaling-view.css';
import {scalingPreset} from './scaling-presets.js';
import {scalingScene,bindScalingPlayback,stopScalingPlayback} from './scaling-view.js';
let scalingTopic=0,scalingResult=null,scalingPlay=false;
function prepareScalingTopic(index){scalingTopic=index;scalingResult=null;scalingPlay=false;state.scaling=scalingPreset(index);renderState();}
import './balance.css';
import './balance-view.css';
import {balanceScene,bindBalancePlayback,stopBalancePlayback} from './balance-view.js';
import {balancePreset} from './balance.js';
let balanceTopic=0,balanceResult=undefined,balancePlay=false;
function prepareBalanceTopic(index){balanceTopic=index;balanceResult=undefined;balancePlay=false;state.balance=balancePreset(index);renderState();}
import './replication.css';
import './replication-presentation.css';
import {replicationScene,replicationRoutes,bindReplicationPlayback,stopReplicationPlayback} from './replication-presentation.js';
import {createReplicationFlow} from './replication-flow.js';
import {replicationLabels} from './replication-presentation.js';
let replicationTopic=0,replicationResult=null,replicationPlay=false,replicationAnimation,replicationEpoch=0,replicationMode='';
const replicationFlow=createReplicationFlow({
 show:frame=>{replicationResult=frame;replicationPlay=true;renderState();return replicationAnimation;},
 record:async(action,retry)=>{
  if(participation){
   if(!retry)await participationOperation('record','replica',action);
   else if(participation.status==='save-error')await participationOperation('retry');
   if(participation.status!=='saved')throw Error('บันทึกไม่ได้ · ลองบันทึกกิจกรรมอีกครั้งที่ส่วนสถานะ แล้วกดทดลองเพื่อทำต่อ');
  }else{localEligibility.record('replica',action);renderProgress();}
 }
});
function cancelReplicationFlow(){replicationEpoch++;replicationFlow.cancel();replicationMode='';stopReplicationPlayback();}
function prepareReplicationTopic(index){cancelReplicationFlow();replicationTopic=index;replicationResult=null;replicationPlay=false;state.replication=replicationPreset(index);renderState();}
async function runReplication(replay=false){
 if(replicationFlow.busy||quizBlocked()||pendingLesson!==null)return;
 const epoch=replicationEpoch,focus=$('#replication-run');replicationMode=replay?'เล่นภาพซ้ำ':'ทดลอง';
 try{const pending=replay?replicationFlow.replay():replicationFlow.run(replicationTopic);renderReplicationControls();await pending;}
 catch(error){if(epoch===replicationEpoch)$('#replication-result').textContent=error.message;}
 finally{if(epoch===replicationEpoch){replicationMode='';renderReplicationControls();if(focus?.isConnected&&!focus.disabled&&document.activeElement===document.body)focus.focus({preventScroll:true});}}
}
function renderReplicationControls(){
 const button=$('#replication-run');if(!button)return;
 const busy=replicationFlow.busy,blocked=quizBlocked()||pendingLesson!==null;button.disabled=busy||blocked;button.setAttribute('aria-busy',String(busy||participation?.status==='saving'));
 setWorkloadIcon(button,participation?.status==='saving'?'saving':'play',participation?.status==='saving'?'กำลังบันทึก':busy?'กำลังทดลอง':'ทดลอง');
 const replay=$('#replication-replay');if(replay){replay.disabled=busy||blocked||!replicationFlow.completed;replay.onclick=()=>runReplication(true);}
 const stage=$('#replication-stage');if(stage)stage.textContent=replicationResult?`${replicationMode|| (replicationFlow.completed?'ครบทุกขั้น':'หยุดรอ')} · ${replicationResult.index+1} / ${replicationResult.total} · ${replicationLabels[replicationResult.action]}`:'';
 button.onclick=()=>runReplication();
}
import {replicationInitial,replicationPreset,replicationAction,dbName} from './replication.js';
import {replicationControls,replicationDiagram,replicationNotes} from './replication-view.js';
import {balanceInitial,balanceControls,balanceDiagram,balanceNotes,routeBalance} from './balance.js';
import {scalingInitial,scalingControls,scalingNotes,evaluateScaling} from './scaling.js';
import {databaseInitial,databaseControls,databaseDiagram,databaseNotes,evaluateDatabase} from './database.js';
import {createParticipation} from './participation.js';
const participation = import.meta.env.VITE_CLASSROOM_PROGRESS_URL
  ? createParticipation(import.meta.env.VITE_CLASSROOM_PROGRESS_URL.replace(/\/progress$/, '/participation')) : null;
import {createAccountProgress} from './progress.js';
import {classroomLink} from './integration.js';
import './terms.css';
import {installTermHints} from './terms.js';
installTermHints(document.querySelector('#app'));
import * as m from './models.js';
import {flowView} from './single-server.js';
import {flowPreset,runFlowTopic} from './flow-presets.js';
import {flowDiagram,bindFlowPlayback,stopFlowPlayback,setFlowIcon} from './flow-view.js';

let flowTopic=0,flowResult=null,flowPlay=false;
function prepareFlowTopic(topic){
 flowTopic=topic;flowResult=null;flowPlay=false;
 const preset=flowPreset(topic);state.step=preset.step;state.client=preset.client;events=[];
 renderState();
}
import {mountSingleServerLayout} from './single-server-layout.js';
import './single-server-layout.css';
import './flow-view.css';
import {mountLessonLayout} from './lesson-layout.js';
import {mountLessonTopics,refreshLessonTopicResults} from './lesson-topics.js';
import './lesson-topics.css';
import './lesson-layout.css';
import './workload-view.css';
import {workloadDiagram,bindWorkloadPlayback,setWorkloadIcon,stopWorkloadPlayback} from './workload-view.js';
import {workloadPreset} from './workload-presets.js';
let workloadPlay=false,workloadTopic=0,workloadRun=0,workloadHasResult=false;
function prepareWorkloadTopic(index){
 workloadTopic=index;workloadRun=0;workloadHasResult=false;workloadPlay=false;
 state.database=workloadPreset(index).config;
 message='สถานการณ์กำหนดไว้แล้ว · กดทดลองเพื่อดูผล';
 renderState();
}
import {lessons} from './lessons.js';
import {dataCentersInitial,evaluateDataCenters} from './data-centers.js';
import {dataCentersControls,dataCentersDiagram,dataCentersNotes,dataCentersMessage} from './data-centers-view.js';
import './data-centers.css';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const account = import.meta.env.VITE_CLASSROOM_PROGRESS_URL
  ? createAccountProgress(import.meta.env.VITE_CLASSROOM_PROGRESS_URL) : null;
import manifest from '../course.json';
import {createLocalEligibility} from './local-eligibility.js';
const localEligibility=account ? null : createLocalEligibility(manifest.participation,{getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)});
let localHistory=[],progress=[],storageOK=true,pendingLesson=null;
const failedLessons=new Set();
const quizSelections=new Map(); // Per-lesson choices survive simulation reset/navigation, not reload.
// Shuffle presentation once per lesson/page, before first paint. Original indices
// remain semantic choice IDs for correctness, selection and durable award actions.
const quizOrder=new Map(lessons.map(l=>[l.kind,Math.random()<0.5?[1,0]:[0,1]]));
if (!account) { try{const ids=readLocalProgress(localStorage.getItem(LOCAL_PROGRESS_KEY),localStorage.getItem('scale-lab-progress'));localHistory=ids;progress=lessons.filter(l=>ids.includes(l.kind)).map(l=>l.id);localStorage.setItem(LOCAL_PROGRESS_KEY,encodeLocalProgress(ids));}catch{storageOK=false;} }
let selected=1,state,events=[],feedback='',message='พร้อมทดลอง — เปลี่ยนตัวแปร แล้วเดินระบบทีละขั้น';
function initial(){return {dataTier:{config:dataTierInitial(),result:null},loggingLab:loggingInitial(),queueLab:queueInitial(),dataCenters:dataCentersInitial(),webLab:webInitial(),cdnLab:cdnInitial(),cacheLab:cacheInitial(),replication:replicationInitial(),balance:balanceInitial(),scaling:scalingInitial(),database:databaseInitial(),step:0,client:'browser',up:[true,true],cursor:0,shared:false,logged:false,db:100,cache:null,reads:0,primary:0,replica:0,stock:5,orders:{},pending:true,attempts:0,sent:0,done:false,dead:false,receipt:false,active:selected===1?0:-1};}
const button=(id,text)=>`<button type="button" id="${id}" data-action="${id}">${text}</button>`;
const number=(id,label,value,min=0,max=1000000)=>`<label>${label}<input id="${id}" type="number" value="${value}" min="${min}" max="${max}" step="1"></label>`;
function controls(kind){switch(kind){
case 'flow':return button('step','ทดลอง');
case 'workload':return databaseControls();
case 'stock':return scalingControls();
case 'balance':return balanceControls();
case 'replica':return replicationControls();
case 'cache':return cacheControls();
case 'database-scaling':return dataTierControls();
case 'logging-operations':return loggingControls();
case 'message-queue':return queueControls();
case 'stateless-web':return webControls();
case 'shard':return number('customer','Customer ID',7,0)+number('shards','จำนวน shards',3,1,8)+button('shard','Route key');
case 'cdn':return cdnControls();
case 'data-centers':return dataCentersControls();
case 'region':return '<label>Region หลักติดต่อไม่ได้<select id="choice"><option value="dns">สลับ DNS แล้วเปิด writer ทันที</option><option value="fence">Fence writer เดิม ตรวจ lag แล้ว promote</option></select></label>'+button('decision','ทดลองการตัดสินใจ');
}}
function mount(){
tierPresentation?.dispose();tierPresentation=null;
cancelLoggingFlow();
stopFlowPlayback();stopWorkloadPlayback();stopScalingPlayback();stopBalancePlayback();cancelReplicationFlow();cancelCacheFlow();cancelCdnFlow();cancelWebFlow();cancelDcFlow();cancelQueueFlow();
const l=lessons[selected-1];
feedback=quizSelections.has(l.kind) ? (quizSelections.get(l.kind)===1?'ถูกต้อง — ':'ยังไม่ถูก — ')+l.why : '';
$('#app').innerHTML=`${classroomLink(import.meta.env.VITE_CLASSROOM_URL)}<a class="skip" href="#main">ข้ามไปห้องทดลอง</a><div class="layout"><aside class="sidebar"><div class="brand"><span class="brand-mark">S<span>↗</span></span><div>Scale Lab<small>SYSTEM DESIGN / TH</small></div></div><div class="course-label">ORDER SYSTEM · ${lessons.length} LABS</div><nav aria-label="บทเรียน">${lessons.map(x=>`<button data-lesson-kind="${x.kind}" data-lesson="${x.id}" aria-current="${x.id===selected?'page':'false'}"><span class="nav-num">${String(x.id).padStart(2,'0')}</span><span>${x.title}</span><span class="done">${progress.includes(x.id)?'✓':''}</span></button>`).join('')}</nav><div class="sidebar-bottom"><p id="progress-status" role="status"></p><button id="retry-progress" hidden>ลองโหลดอีกครั้ง</button><span id="progress">${progress.length} / ${lessons.length} บทเรียนจบ</span><progress max="${lessons.length}" value="${progress.length}" aria-label="ความคืบหน้าบทเรียน"></progress></div></aside><div class="workspace"><div class="simulation"><span class="dot"></span><strong>EDUCATIONAL SIMULATION</strong><span>โครงสร้างและค่าทั้งหมดเป็นแบบจำลองเพื่อการเรียนรู้ ไม่ใช่ benchmark จริง</span></div><header class="topbar"><span>ห้องทดลอง / ระบบสั่งซื้อสินค้า</span><span class="source-ref">คู่มือต้นฉบับ §${l.chapter}</span></header><main id="main"><div class="lesson-heading"><div><p class="eyebrow">LAB ${String(l.id).padStart(2,'0')} / ${l.en}</p><h1>${l.title}</h1><p class="objective">${l.objective}</p></div><span class="manual-tag">MANUAL STEP</span></div><div id="participation-notice" hidden><p id="participation-status" role="status"></p><button id="retry-participation" hidden>ลองบันทึกคะแนนอีกครั้ง</button></div><div class="learning-grid"><section class="lab" aria-label="ห้องทดลองแบบจำลอง"><div class="panel-title"><h2>ทดลองกับระบบ</h2><button id="reset">เริ่มการทดลองใหม่</button></div><div class="architecture" id="architecture" aria-label="แผนภาพสถาปัตยกรรม"></div><div class="state-grid" id="state-view" aria-label="สถานะแบบจำลอง"></div><div class="control-area"><h3>01 / ตั้งสถานการณ์และลงมือ</h3><div class="controls">${controls(l.kind)}</div></div>${l.kind==='workload'?'':`<div class="observation"><h3>02 / สิ่งที่เกิดขึ้น</h3><p id="outcome" role="status" aria-live="polite"></p></div><div class="event-area"><div class="event-heading"><h3>บันทึกเหตุการณ์</h3><span>เรียงตามขั้น · ไม่ใช่เวลาจริง</span></div><ol id="event-log"></ol></div>`}</section><aside class="teaching" aria-label="คำอธิบายประกอบ"><section><p class="eyebrow">WHY IT WORKS</p><h2>เข้าใจเหตุผล ก่อนเพิ่มเครื่องมือ</h2><p>${l.explain}</p><div class="experiment"><strong>ลองตามนี้</strong><p>${l.try}</p></div></section><section class="quiz"><p class="eyebrow">CHECK YOUR THINKING</p><h2>${l.question}</h2><div class="answers">${quizOrder.get(l.kind).map((choice,i)=>`<button data-answer="${choice}"><span>${i===0?'A':'B'}</span>${l.answers[choice]}</button>`).join('')}</div><p id="feedback" role="status">${feedback||'เลือกคำตอบเพื่อดูเหตุผล — ตอบใหม่ได้เสมอ'}</p></section></aside></div><footer><span>${storageOK?'บันทึกเฉพาะความคืบหน้าใน browser นี้':'บันทึกไม่ได้ — ใช้งานต่อได้ แต่ความคืบหน้าอยู่ในหน่วยความจำ'}</span><section class="lesson-completion" aria-label="สถานะการเรียนบทนี้"><button type="button" id="complete-lesson" aria-describedby="completion-status">ทำเครื่องหมายว่าเรียนจบ</button><p id="completion-status" role="status"></p><button type="button" id="retry-completion-load" hidden>ลองโหลดอีกครั้ง</button></section></footer></main></div></div><dialog id="help-dialog"><div class="dialog-header"><h2 id="dialog-title"></h2><button id="close-dialog" autofocus>ปิด</button></div><div id="dialog-content"></div></dialog>`;
 if(l.kind==='flow'){
  mountSingleServerLayout($('#main'),prepareFlowTopic);
  document.querySelector('.source-ref').textContent='Single-server setup';
 }
 if(l.kind==='stateless-web'){
  document.querySelector('.teaching section').insertAdjacentHTML('afterend',webNotes());
  $('#main').classList.add('web-lesson');
  const grid=$('.learning-grid'),teaching=$('.teaching'),intro=teaching.firstElementChild;
  const comparison=$('#web-comparison').parentElement,extra=comparison.nextElementSibling,quiz=$('.quiz'),lab=$('.lab');
  intro.classList.add('web-intro');comparison.classList.add('web-compare-section');
  const steps=intro.querySelector('.experiment');steps.querySelector('p').outerHTML=webSteps();lab.querySelector('.panel-title').after(steps);
  const details=document.createElement('details');details.id='web-details';
  details.innerHTML='<summary>อ่านเพิ่มเติม · การขยายระบบและข้อจำกัดของแบบจำลอง</summary>';details.append(extra);
  grid.replaceChildren(intro,comparison,lab,details,quiz);

  document.querySelector('.source-ref').textContent='Stateless web tier';
  $('#web-mode').onchange=e=>{state.webLab=webInitial(e.target.value);for(let i=0;i<3;i++)$('#web-up-'+i).checked=state.webLab.up[i];$('#web-store').checked=true;message='เริ่มสถานการณ์ใหม่แล้ว ไม่ใช่การย้าย session จริง';events=[];renderState();};
  for(let i=0;i<3;i++)$('#web-up-'+i).onchange=e=>{state.webLab.up[i]=e.target.checked;renderState();};
  $('#web-store').onchange=e=>{state.webLab.storeUp=e.target.checked;renderState();};
 }
 if(l.kind==='cdn'){
  document.querySelector('.teaching section').insertAdjacentHTML('afterend',cdnNotes());
  document.querySelector('.source-ref').textContent='CDN · ส่งไฟล์ใกล้ผู้ใช้';
  for(const action of ['tick','publish','invalidate','version'])$('#cdn-'+action).onclick=()=>{if(participation&&participation.status!=='saved')return;message=cdnAction(state.cdnLab,action).message;renderState();};
  for(const [id,key] of [['up','up'],['origin-up','originUp'],['fallback','fallback'],['query','includeQuery']])$('#cdn-'+id).onchange=e=>{state.cdnLab[key]=e.target.checked;renderState();};
  $('#cdn-ttl').onchange=e=>{state.cdnLab.ttl=Number(e.target.value);};
 }
 if(l.kind==='cache'){
  document.querySelector('.teaching section').insertAdjacentHTML('afterend',cacheNotes());
  document.querySelector('.source-ref').textContent='Cache · สำเนาชั่วคราว';
  for(const action of ['tick','outage','restart'])$('#cache-'+action).onclick=()=>act(action);
 }
 if(l.kind==='replica'){
  document.querySelector('.teaching section').insertAdjacentHTML('afterend',replicationNotes());
  document.querySelector('.source-ref').textContent='Database replication';
  [0,1,2].forEach(i=>$('#db-up-'+i).onchange=e=>{state.replication.up[i]=e.target.checked;renderState();});
  $('#fenced').onchange=e=>{state.replication.fenced=e.target.checked;};
  $('#accept-loss').onchange=e=>{state.replication.acceptLoss=e.target.checked;};
  $('#promote').onclick=()=>act('promote');
 }
 if(l.kind==='balance'){document.querySelector('.teaching section').insertAdjacentHTML('afterend',balanceNotes());document.querySelector('.source-ref').textContent='Load balancer · กระจายคำขอ';}
 if(l.kind==='stock'){document.querySelector('.teaching section').insertAdjacentHTML('afterend',scalingNotes());document.querySelector('.source-ref').textContent='Scale up / Scale out';}
 if(l.kind==='workload') {
  document.querySelector('.teaching section').insertAdjacentHTML('afterend',databaseNotes());
  document.querySelector('.source-ref').textContent='แยกชั้น · เลือกฐานข้อมูล';

 }
 if(l.kind==='database-scaling'){
  $('.teaching section').insertAdjacentHTML('afterend',dataTierNotes());
  $('#main').classList.add('database-scaling-lesson');
  $('.source-ref').textContent='Database scaling · Sharding';
 }
 if(l.kind==='logging-operations'){
  $('.teaching section').insertAdjacentHTML('afterend',loggingNotes());
  $('#main').classList.add('logging-lesson');
  $('.source-ref').textContent='Logging · Metrics · Automation';
  $('#code-version').onchange=e=>{state.loggingLab.testsPass=e.target.value==='fixed';state.loggingLab.stage='ready';message='เริ่ม pipeline ของรุ่นที่เลือกใหม่ · ไม่ใช่การแก้ระบบจริง';renderState();};
 }
 if(l.kind==='message-queue'){
  $('.teaching section').insertAdjacentHTML('afterend',queueNotes());
  $('#main').classList.add('message-queue-lesson');
  $('.source-ref').textContent='Message queue · งานภาพแบบ asynchronous';
  for(const [id,key] of [['mq-producer','producerUp'],['mq-consumer','consumerUp']])$('#'+id).onchange=e=>{state.queueLab[key]=e.target.checked;renderState();};
  $('#mq-workers').onchange=e=>{state.queueLab.workers=Number(e.target.value);renderState();};
 }
 if(l.kind==='data-centers'){
  document.querySelector('.teaching section').insertAdjacentHTML('afterend',dataCentersNotes());
  $('#main').classList.add('data-centers-lesson');
  document.querySelector('.source-ref').textContent='Data centers · เส้นทางและข้อมูล';
 }
 mountLessonLayout($('#main'),l.kind);
 if(l.kind==='database-scaling')tierPresentation=mountTierPresentation($('#main'),{
  blocked:()=>quizBlocked()||pendingLesson!==null,
  commit:frame=>{state.dataTier={config:structuredClone(frame.config),result:structuredClone(frame.result)};events.push(tierStatus(frame.result.status));},
  record:async(action,retry)=>{
   if(participation){
    if(!retry)await participationOperation('record','database-scaling',action);
    else if(participation.status==='save-error')await participationOperation('retry');
    if(participation.status!=='saved')throw Error('บันทึกไม่ได้ · ลองบันทึกกิจกรรมอีกครั้ง แล้วกดทดลองเพื่อทำต่อ');
   }else{localEligibility.record('database-scaling',action);renderProgress();}
  }
 });
 else mountLessonTopics($('#main'),l.kind,l.kind==='logging-operations'?prepareLoggingTopic:l.kind==='message-queue'?prepareQueueTopic:l.kind==='data-centers'?prepareDcTopic:l.kind==='stateless-web'?prepareWebTopic:l.kind==='cdn'?prepareCdnTopic:l.kind==='cache'?prepareCacheTopic:l.kind==='replica'?prepareReplicationTopic:l.kind==='balance'?prepareBalanceTopic:l.kind==='stock'?prepareScalingTopic:prepareWorkloadTopic);
 document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>navigate(Number(b.dataset.lesson)));
 document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>act(b.dataset.action));
 document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>answer(Number(b.dataset.answer)));
 $('#reset').onclick=()=>{state=initial();events=[];message='พร้อมทดลอง — เริ่มสถานะใหม่แล้ว';mount();$('#reset').focus();};

 $('#close-dialog').onclick=()=>$('#help-dialog').close();

 renderState();
 renderProgress();
 renderParticipation();
 $('#retry-participation').onclick=()=>participationOperation(participation.status==='load-error' ? 'load' : 'retry');
 $('#retry-progress').onclick=loadAccount;
 $('#retry-completion-load').onclick=()=>participation && ['load-error','save-error'].includes(participation.status) ? participationOperation(participation.status==='load-error'?'load':'retry') : loadAccount();
 $('#complete-lesson').onclick=()=>completeLesson(lessons[selected-1]);
}
function navigate(id){selected=id;state=initial();events=[];feedback='';message='พร้อมทดลอง — เปลี่ยนตัวแปร แล้วเดินระบบทีละขั้น';mount();$('#main').setAttribute('tabindex','-1');$('#main').focus({preventScroll:true});}
function renderState(){if(lessons[selected-1].kind==='database-scaling'){tierPresentation?.update();return;}const loggingActions=$('.logging-retained'),loggingFocus=loggingActions?.contains(document.activeElement)?document.activeElement:null;const queueActions=$('.queue-retained'),queueFocus=queueActions?.contains(document.activeElement)?document.activeElement:null;const dcActions=$('.dc-retained'),dcFocus=dcActions?.contains(document.activeElement)?document.activeElement:null;const webActions=$('.web-retained'),webFocus=webActions?.contains(document.activeElement)?document.activeElement:null;const cdnActions=$('.cdn-retained'),cdnFocus=cdnActions?.contains(document.activeElement)?document.activeElement:null;const cacheActions=$('.cache-retained'),cacheFocus=cacheActions?.contains(document.activeElement)?document.activeElement:null;const replicationActions=$('.replication-retained'),replicationFocus=replicationActions?.contains(document.activeElement)?document.activeElement:null;const balanceAction=$('#route'),balanceFocused=balanceAction===document.activeElement;const flowActions=$('.flow-actions'),flowFocus=flowActions?.contains(document.activeElement)?document.activeElement:null;const scalingAction=$('#order'),scalingFocused=scalingAction===document.activeElement;const workloadAction=$('#estimate'),workloadFocused=workloadAction===document.activeElement;const l=lessons[selected-1];$('#architecture').innerHTML=l.kind==='database-scaling'?dataTierDiagram(state.dataTier):l.kind==='logging-operations'?loggingScene(loggingResult?.state||state.loggingLab,loggingResult,loggingTopic):l.kind==='message-queue'?queueScene(queueResult?.state||state.queueLab,queueResult,queueTopic):l.kind==='data-centers'?dcScene(state.dataCenters,dcResult):l.kind==='stateless-web'?webScene(webResult?.state||state.webLab,webResult,webTopic):l.kind==='cdn'?cdnScene(cdnResult?.state||state.cdnLab,cdnResult):l.kind==='cache'?cacheScene(cacheResult?.state||state.cacheLab,cacheResult):l.kind==='replica'?replicationScene(replicationResult?.state||state.replication,replicationResult):l.kind==='balance'?balanceScene(state.balance,balanceResult):l.kind==='stock'?scalingScene(state.scaling,scalingResult):l.kind==='workload'?workloadDiagram(state.database,workloadHasResult):l.kind==='flow'?flowDiagram(state.client):l.nodes.map((n,i)=>`<div class="node ${state.active===i?'active':''}"><span>${String(i+1).padStart(2,'0')}</span><strong>${n}</strong>${state.active===i?'<small>ขั้นล่าสุด</small>':''}</div>${i<l.nodes.length-1?'<span class="arrow" aria-hidden="true">→</span>':''}`).join('');
if(l.kind==='logging-operations'){
 $('.logging-experiments').append(loggingActions);if(loggingFocus)loggingFocus.focus({preventScroll:true});
 loggingAnimation=bindLoggingPlayback($('#main'),loggingPlay,loggingResult);loggingPlay=false;renderLoggingControls();return;
}
if(l.kind==='message-queue'){
 $('.queue-experiments').append(queueActions);if(queueFocus)queueFocus.focus({preventScroll:true});
 queueAnimation=bindQueuePlayback($('#main'),queuePlay,queueResult);queuePlay=false;renderQueueControls();return;
}
if(l.kind==='data-centers'){
 $('.dc-experiments').append(dcActions);if(dcFocus)dcFocus.focus({preventScroll:true});
 dcAnimation=bindDcPlayback($('#main'),dcPlay,dcResult);dcPlay=false;renderDcControls();return;
}
if(l.kind==='stateless-web'){
 $('.web-experiments').append(webActions);if(webFocus)webFocus.focus({preventScroll:true});
 webAnimation=bindWebPlayback($('#main'),webPlay,webResult);webPlay=false;renderWebControls();return;
}
if(l.kind==='cdn'){
 $('.cdn-experiments').append(cdnActions);if(cdnFocus)cdnFocus.focus({preventScroll:true});
 cdnAnimation=bindCdnPlayback($('#main'),cdnPlay,cdnResult);cdnPlay=false;renderCdnControls();return;
}
if(l.kind==='cache'){
 $('.cache-experiments').append(cacheActions);if(cacheFocus)cacheFocus.focus({preventScroll:true});
 cacheAnimation=bindCachePlayback($('#main'),cachePlay,cacheResult);cachePlay=false;renderCacheControls();return;
}
if(l.kind==='replica'){
 $('.replication-experiments').append(replicationActions);if(replicationFocus)replicationFocus.focus({preventScroll:true});
 replicationAnimation=bindReplicationPlayback($('#main'),replicationPlay);replicationPlay=false;renderReplicationControls();return;
}
if(l.kind==='balance'){
 $('.balance-playback').prepend(balanceAction);if(balanceFocused)balanceAction.focus({preventScroll:true});
 bindBalancePlayback($('#main'),balancePlay);balancePlay=false;return;
}
if(l.kind==='stock'){
 $('.scaling-playback').prepend(scalingAction);if(scalingFocused)scalingAction.focus({preventScroll:true});
 bindScalingPlayback($('#main'),scalingPlay);scalingPlay=false;return;
}
if(l.kind==='flow'){
 // Retain bound controls and live feedback across the renderer-owned scene replacement.
 $('#flow-scene').append(flowActions);if(flowFocus)flowFocus.focus({preventScroll:true});
 $('#flow-result').textContent=flowResult ? (flowTopic===0?'DNS คืน IP 192.0.2.10 ให้ Browser · ยังไม่ส่ง HTTP':flowTopic===1?'GET /users/12 → 192.0.2.10 · HTTP ไม่ผ่าน DNS':`200 · ${flowResult.client==='mobile'?'JSON':'HTML'} → John Smith`) : 'ยังไม่ได้ทดลอง';
 bindFlowPlayback($('#main'),flowResult,flowPlay);flowPlay=false;return;
}
let entries=[];
switch(l.kind){case 'flow':{const v=flowView(state.step,state.client);entries=[['ขั้นที่เดินแล้ว',`${state.step} / ${m.FLOW_STEPS}`],['Domain',v.domain],['IP ที่ client ได้รับ',v.ip],['HTTP request',v.request],['HTTP response',v.response]];break;}
case 'database-scaling':entries=[['ผลล่าสุด',state.dataTier.result?tierStatus(state.dataTier.result.status):'ยังไม่ได้ประเมิน']];break;
case 'logging-operations':entries=[['Logs ที่พบ',state.loggingLab.logs?.length??'ยังไม่ได้ค้น'],['Pipeline',pipelineLabel(state.loggingLab.stage)]];break;
case 'message-queue':entries=[['งานรอ',state.queueLab.jobs.length],['งานเสร็จ',state.queueLab.completed.length]];break;
case 'data-centers':{const r=evaluateDataCenters(state.dataCenters);entries=[['ปลายทาง US-East',`${r.routes[0]}%`],['ปลายทาง US-West',`${r.routes[1]}%`],['ส่งไปศูนย์ที่ล่ม',`${r.unavailable} ราย`],['ย้ายศูนย์',`${r.moved} ราย`]];break;}
case 'workload':{const r=evaluateDatabase(state.database);entries=[['ทรัพยากร Web',`Web tier: ${r.web}`],['ทรัพยากร DB',`Data tier: ${r.data}`],['การขยาย',r.independent?'แยกอิสระ':'ทรัพยากรร่วม'],['Database',r.ready?'พร้อม':'ไม่พร้อม']];break;}
case 'cdn':{const s=state.cdnLab;entries=[['เวลา / TTL ใหม่',`${s.now} / ${s.ttl}`],['Origin reads',s.originReads],['Hits / Misses สำเร็จ',`${s.hits} / ${s.misses}`],['รูปที่ได้รับ',s.delivered??'ไม่มี'],['Origin version',s.origin]];break;}
case 'cache':{const s=state.cacheLab;entries=[['DB / source of truth',s.db],['Cache / สำเนา',s.cache??'ว่าง'],['DB reads',s.reads],['Hits / Misses',`${s.hits} / ${s.misses}`],['เวลาจำลอง / TTL',`${s.now} / ${s.ttl}`],['Cache server',s.up?'พร้อม':'ล่ม · fallback ไป DB']];break;}
case 'stock':{const r=evaluateScaling(state.scaling);entries=[['จำนวนเครื่อง',state.scaling.servers],['กำลังต่อเครื่อง',`${state.scaling.power} หน่วย`],['เครื่องที่รับ traffic',r.routed],['กำลังที่เข้าถึงได้',`${r.capacity} หน่วย`]];break;}
case 'replica':entries=[['Writer ปัจจุบัน',dbName(state.replication.writer)],...state.replication.versions.map((v,i)=>[dbName(i),`version ${v}`]),['ขั้นเขียนที่สูญเสียตอน promote',state.replication.lost]];$('#db-up-0').disabled=state.replication.writer!==0;break;
case 'stateless-web':entries=[['คำขอ',state.webLab.requests],['Store reads ที่พยายาม',state.webLab.storeReads]];break;
case 'balance':entries=state.balance.counts.map((n,i)=>['App '+ 'ABC'[i],`รับแล้ว ${n} request`]);break;
default:entries=[['โหมด','กำหนดทีละขั้น'],['ข้อมูล','สมมติฐานของผู้เรียน']];}
$('#state-view').innerHTML=entries.map(([k,v])=>`<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('');if($('#outcome'))$('#outcome').textContent=l.kind==='flow'&&state.step===0?flowView(0,state.client).message:message;if(l.kind==='flow'){$('#state-view').insertAdjacentHTML('beforeend',`<pre id="flow-payload" aria-label="ตัวอย่าง response">${esc(state.step<5?'ยังไม่ได้รับ response':state.client==='mobile'?'{"id": 12, "firstName": "John", "lastName": "Smith"}':'<h1>John Smith</h1>')}</pre>`);}if($('#event-log'))$('#event-log').innerHTML=events.length?events.map((e,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span>${esc(e)}</li>`).join(''):'<li><span>—</span>พร้อมทดลอง ยังไม่มีเหตุการณ์</li>';
refreshLessonTopicResults($('#main'));
if(l.kind==='workload'){
 const preset=workloadPreset(workloadTopic,Math.max(0,workloadRun-1));
 $('#workload-scenario').textContent=preset.label;
 $('.workload-playback').prepend(workloadAction);
 if(workloadFocused)workloadAction.focus({preventScroll:true});
 bindWorkloadPlayback($('#main'),workloadPlay);
}
workloadPlay=false;
}
function val(id){const el=$('#'+id);if(!el.checkValidity()||el.value.trim()==='')throw new Error('กรุณากรอกตัวเลขในช่วงที่กำหนด');return Number(el.value);}
function act(action){if(participation && participation.status!=='saved') return;
const lesson=lessons[selected-1].kind;
let meaningful=!(action==='work' && !state.pending);
try{switch(action){
case 'evaluate-data-tier':{const config={mode:$('#tier-mode').value,power:val('tier-power'),shards:val('tier-shards'),key:$('#tier-key').value,traffic:$('#tier-traffic').value,user:val('tier-user'),up:$('#tier-up').checked};const result=evaluateDataTier(config);state.dataTier={config,result};message=tierStatus(result.status)+' · ผลจำลอง ไม่ได้ย้ายข้อมูลจริง';break;}
case 'inspect-logs':{const s=state.loggingLab;s.logs=inspectLogs($('#log-scope').value,$('#log-level').value);s.logScope=$('#log-scope').selectedOptions[0].textContent;message=`ค้นพบ ${s.logs.length} เหตุการณ์ · การค้นหาไม่ได้แก้ไขบริการ`;break;}
case 'inspect-metrics':state.loggingLab.metrics=inspectMetrics($('#metric-group').value);message='อ่าน metrics แล้ว · เปรียบเทียบช่วงเวลาและบริบทก่อนสรุป';break;
case 'run-pipeline':{const r=pipelineStep(state.loggingLab);message=r.message;meaningful=r.meaningful;break;}
case 'enqueue-jobs':case 'process-jobs':{const r=queueAction(state.queueLab,action,$('#mq-type').value);message=r.message;meaningful=r.meaningful;break;}
case 'web-request':{const r=webRequest(state.webLab,{target:Number($('#web-target').value),sticky:$('#web-sticky').checked});message=`${r.code} · ${r.server<0?'ไม่มี Web พร้อม':'Web '+(r.server+1)} · ${{OK:'ตรวจ session A สำเร็จและตอบโปรไฟล์',NO_SESSION:'ไม่พบ session A ที่เครื่องนี้ routing ไม่ได้ย้ายสถานะให้',STORE_UNAVAILABLE:'อ่าน shared session store ไม่ได้ แม้ web พร้อม',NO_WEB:'ยังไปไม่ถึง store เพราะไม่มี web รับงาน'}[r.code]}`;break;}
case 'dc-request':{
 const c={eastShare:val('dc-share'),eastCapacity:val('dc-east-capacity'),westCapacity:val('dc-west-capacity')};
 for(const [key,id] of [['eastUp','dc-east-up'],['westUp','dc-west-up'],['redirect','dc-redirect'],['freshDNS','dc-fresh-dns'],['synced','dc-synced'],['sameRelease','dc-same-release']])c[key]=$('#'+id).checked;
 const r=evaluateDataCenters(c);state.dataCenters=c;message=dataCentersMessage(r);break;
}
case 'step':flowResult=runFlowTopic(flowTopic);state.step=flowResult.step;state.client=flowResult.client;flowPlay=true;message=flowView(state.step,state.client).message;break;
case 'estimate':{
 const config=workloadPreset(workloadTopic,workloadRun).config;
 const r=evaluateDatabase(config);state.database=config;workloadPlay=true;workloadHasResult=true;workloadRun++;
 message=`${r.ready?'Database พร้อมรับงาน':'อ่านข้อมูลไม่ได้: Database ไม่พร้อม แม้ Web tier ยังทำงาน'} · ${r.independent?'ปรับ Web / Data แยกกันได้':'เครื่องเดียว: ปรับทรัพยากรร่วมกัน'} · ${r.fit?'เหมาะเป็นจุดเริ่มต้น':'ทบทวนตัวเลือก ไม่ใช่ว่าทำไม่ได้'}: ${r.reason} ข้อควรระวัง: ${r.caveat}`;
 break;}
case 'order':{const config=scalingPreset(scalingTopic);const r=evaluateScaling(config);state.scaling=config;scalingResult=r;scalingPlay=true;message=`${{offline:'เข้าใช้งานไม่ได้: ไม่มีเครื่องที่พร้อมบนเส้นทางนี้',overloaded:'โหลดเกินกำลังที่เข้าถึงได้: อาจตอบช้าหรือเชื่อมต่อไม่สำเร็จ',ready:'รับโหลดได้ตามสมมติฐานนี้ ไม่ใช่ผล benchmark'}[r.status]} · โหลด ${config.traffic} / กำลัง ${r.capacity} หน่วย · ${config.balanced?'LB ส่งเฉพาะเครื่องที่พร้อม (สมมติรู้ health แล้ว)':'ต่อเครื่อง 1 โดยตรง เครื่องอื่นไม่รับ traffic'}${config.power===4?' · ถึงเพดานกำลังในแบบจำลองแล้ว':''}`;break;}
case 'route':{const n=routeBalance(state.balance,state.balance.up);balanceResult=n;balancePlay=true;message=n===null?'503 · ไม่มี backend พร้อมรับงาน — ห้าม route ไปเครื่องที่ล้ม':`200 · ส่ง request ไป App ${'ABC'[n]} ตาม round-robin เฉพาะเครื่องพร้อม`;break;}
case 'write':case 'read-primary':case 'read-replica':case 'sync':case 'promote':{const before=structuredClone(state.replication);const result=replicationAction(state.replication,action);message=result.message;meaningful=result.meaningful;replicationResult={message,routes:replicationRoutes(before,action)};replicationPlay=true;break;}
case 'read-cache':case 'update':case 'invalidate':case 'tick':case 'outage':case 'restart':{const result=cacheAction(state.cacheLab,action,action==='update'?val('price'):undefined);message=result.message;meaningful=result.meaningful;break;}
case 'shard':{const id=val('customer'),n=val('shards');message=`customer ${id} % ${n} → Shard ${m.shard(id,n)} (เริ่มนับ 0) — เปลี่ยนจำนวน shard ไม่ได้ย้ายข้อมูลจริง`;state.active=1;break;}
case 'decision':{const kind=lessons[selected-1].kind;if(kind==='cdn'){const r=cdnAction(state.cdnLab,'request');message=r.message;meaningful=r.meaningful;break;}const r=m.decide(kind,$('#choice').value);message=(r.safe?'เหมาะกับโจทย์นี้ · ':'เสี่ยง · ')+({cdn:r.safe?'private/no-store ลดการแชร์ response ส่วนบุคคล แต่ต้องตรวจ policy จริง':'public key ที่ไม่แยก user อาจรั่วข้อมูลข้ามบัญชี',observe:r.safe?'trace และ wait metrics ช่วยแยก lock, pool, network ก่อนเลือกแก้':'CPU ปกติ การเพิ่มเครื่องไม่อธิบายเวลารอ lock หรือ downstream',region:r.safe?'fencing ป้องกัน writer เก่า ต้องตรวจ RPO/RTO และ capacity สำรองด้วย':'DNS cache และ writer เก่าอาจยังทำงาน เกิด split brain ได้'}[kind]);state.active=3;break;}
}if(participation && meaningful) participationOperation('record',lesson,action);
else if(!account && meaningful){localEligibility.record(lesson,action);renderProgress();}
events.push(message);if(events.length>30)events.shift();renderState();}catch(e){message=e.message;renderState();}}
function renderParticipation(){
  // Keep blocking/error feedback accessible without rendering a score panel.
  $('#participation-notice').hidden=!participation || participation.status==='saved';
  $('#participation-status').textContent=participation ? ({loading:'กำลังโหลดคะแนนบัญชี…',saved:'',saving:'กำลังบันทึกคะแนน…','load-error':'โหลดคะแนนไม่ได้ — ลองใหม่ หรือเข้าสู่ระบบอีกครั้ง','save-error':'บันทึกไม่ได้ — ลองอีกครั้งด้วยเหตุการณ์เดิม ก่อนทดลองต่อ'}[participation.status]) : '';
  $('#retry-participation').hidden=!participation || !['load-error','save-error'].includes(participation.status);
  $('#retry-participation').textContent=participation?.status==='load-error'?'ลองโหลดคะแนนอีกครั้ง':'ลองบันทึกคะแนนอีกครั้ง';
  document.querySelectorAll('[data-action]').forEach(b=>b.disabled=!!participation && participation.status!=='saved');
  document.querySelectorAll('[data-replication-label]').forEach(b=>{const saving=participation?.status==='saving';setWorkloadIcon(b,saving?'saving':'play',saving?'กำลังบันทึก':b.dataset.replicationLabel);b.setAttribute('aria-busy',String(saving));b.disabled=!!participation&&participation.status!=='saved';});
  const flowAction=document.querySelector('.flow-lesson #step');
  if(flowAction){const saving=participation?.status==='saving';setFlowIcon(flowAction,saving?'saving':'play',saving?'กำลังบันทึก':'ทดลอง');flowAction.setAttribute('aria-busy',String(saving));}
  const workloadAction=document.querySelector('#lesson-topic[data-kind=workload] #estimate');
  if(workloadAction){const saving=participation?.status==='saving';setWorkloadIcon(workloadAction,saving?'saving':'play',saving?'กำลังบันทึก':'ทดลอง');workloadAction.setAttribute('aria-busy',String(saving));}
  const balanceAction=document.querySelector('#lesson-topic[data-kind=balance] #route');
  if(balanceAction){const saving=participation?.status==='saving';setWorkloadIcon(balanceAction,saving?'saving':'play',saving?'กำลังบันทึก':'ทดลอง');balanceAction.setAttribute('aria-busy',String(saving));}
  const scalingAction=document.querySelector('#lesson-topic[data-kind=stock] #order');
  if(scalingAction){const saving=participation?.status==='saving';setWorkloadIcon(scalingAction,saving?'saving':'play',saving?'กำลังบันทึก':'ทดลอง');scalingAction.setAttribute('aria-busy',String(saving));}
  renderReplicationControls();renderCacheControls();renderCdnControls();renderWebControls();renderDcControls();renderQueueControls();renderLoggingControls();tierPresentation?.update();
  renderProgress();
}
async function participationOperation(operation,...args){
  const replicationFocus=document.activeElement?.dataset.replicationLabel?document.activeElement:null,focusedReplicationTopic=replicationTopic;
  const workloadFocus=document.activeElement?.id==='estimate'&&lessons[selected-1].kind==='workload'?document.activeElement:null;
  const focusedWorkloadTopic=workloadTopic;
  const balanceFocus=document.activeElement?.id==='route'?document.activeElement:null,focusedBalanceTopic=balanceTopic;
  const scalingFocus=document.activeElement?.id==='order'?document.activeElement:null,focusedScalingTopic=scalingTopic;
  const flowFocus=document.activeElement?.id==='step'?document.activeElement:null;
  const focusedTopic=flowTopic;
  const pending=participation[operation](...args); renderParticipation();
  await pending; renderParticipation();
  if(replicationFocus?.isConnected&&!replicationFocus.disabled&&focusedReplicationTopic===replicationTopic&&document.activeElement===document.body)replicationFocus.focus({preventScroll:true});
  if(balanceFocus?.isConnected&&!balanceFocus.disabled&&focusedBalanceTopic===balanceTopic&&document.activeElement===document.body)balanceFocus.focus({preventScroll:true});
  if(scalingFocus?.isConnected&&!scalingFocus.disabled&&focusedScalingTopic===scalingTopic&&document.activeElement===document.body)scalingFocus.focus({preventScroll:true});
  if(workloadFocus?.isConnected && !workloadFocus.disabled && focusedWorkloadTopic===workloadTopic && document.activeElement===document.body)workloadFocus.focus({preventScroll:true});
  if(flowFocus?.isConnected && !flowFocus.disabled && focusedTopic===flowTopic && document.activeElement===document.body)flowFocus.focus({preventScroll:true});
  if(account && operation!=='load' && participation.status==='saved') {
    const refresh=account.refresh();
    await Promise.resolve(); renderProgress();
    try { await refresh; } catch { /* Explicit load retry remains available. */ }
    renderProgress();
  }
}
function quizBlocked(){
  return (!!participation && participation.status!=='saved') || (!!account && ['loading','load-error','saving'].includes(account.status));
}
function renderQuizControls(){
  document.querySelectorAll('[data-answer]').forEach(b=>{
    b.disabled=quizBlocked();
    b.setAttribute('aria-pressed',String(quizSelections.get(lessons[selected-1].kind)===Number(b.dataset.answer)));
  });
}
function renderProgress(){
  renderReplicationControls();renderCacheControls();renderCdnControls();renderWebControls();renderDcControls();renderQueueControls();renderLoggingControls();tierPresentation?.update();
  if(localEligibility && !localEligibility.storageOK)storageOK=false;
  if(account) progress=lessons.filter(l=>account.completed.includes(l.kind)).map(l=>l.id);
  const total=account && account.status!=='loading' && account.status!=='load-error' ? account.total : lessons.length;
  $('#progress').textContent=`${progress.length} / ${total} บทเรียนจบ`;
  $('progress').max=total; $('progress').value=progress.length;
  document.querySelectorAll('[data-lesson]').forEach(b=>b.querySelector('.done').textContent=progress.includes(Number(b.dataset.lesson))?'✓':'');
  $('#progress-status').textContent=account ? ({loading:'กำลังโหลดความคืบหน้าบัญชี…',saved:'บันทึกความคืบหน้าในบัญชีแล้ว',saving:'กำลังบันทึกในบัญชี…','load-error':'โหลดความคืบหน้าไม่ได้ — ลองใหม่ หรือเข้าสู่ระบบอีกครั้ง','save-error':'บันทึกไม่ได้ — กลับบทที่บันทึกไม่สำเร็จแล้วกดลองบันทึกอีกครั้ง หรือเข้าสู่ระบบอีกครั้ง'}[account.status]) : (storageOK?'ความคืบหน้าเฉพาะเบราว์เซอร์นี้':'บันทึกไม่ได้ — ความคืบหน้าอยู่ในหน่วยความจำ');
  $('#retry-progress').hidden=!account || account.status!=='load-error';
  renderQuizControls();
  const criteria=account ? account.criteria?.[lessons[selected-1].kind] : localEligibility.criteria(lessons[selected-1].kind);
  const done=progress.includes(selected);
  const marked=criteria?.manual;
  const missing=criteria ? Object.entries({simulation:'ทดลองหลักอย่างน้อย 1 ครั้ง',thinking:'ตอบ Check your thinking A หรือ B อย่างน้อย 1 ครั้ง (ไม่ต้องถูก)'}).filter(([key])=>!criteria[key]).map(([,label])=>label) : [];
  const blocked=quizBlocked();
  const failed=failedLessons.has(selected);
  $('#complete-lesson').textContent=marked && !done?'✓ กดเรียนจบแล้ว':done?'✓ เรียนจบแล้ว':pendingLesson===selected?'กำลังบันทึก…':failed?'ลองบันทึกอีกครั้ง':'ทำเครื่องหมายว่าเรียนจบ';
  $('#complete-lesson').disabled=done || marked || blocked || pendingLesson!==null || !criteria?.simulation || !criteria?.thinking;
  $('#retry-completion-load').hidden=!account || (account.status!=='load-error' && !['load-error','save-error'].includes(participation?.status));
  $('#retry-completion-load').textContent=participation?.status==='save-error'?'ลองบันทึกกิจกรรมอีกครั้ง':'ลองโหลดอีกครั้ง';
  $('#completion-status').textContent=account && ['loading','load-error'].includes(account.status)
    ? $('#progress-status').textContent
    : participation && participation.status!=='saved' ? $('#participation-status').textContent
    : pendingLesson!==null ? `กำลังบันทึกบท ${pendingLesson} ในบัญชี… โปรดรอสักครู่`
    : failed ? 'บันทึกไม่ได้ — ยังไม่ยืนยันว่าเรียนจบ กดลองบันทึกอีกครั้ง หรือเข้าสู่ระบบอีกครั้ง'
    : !account && !storageOK ? 'บันทึกไม่ได้ — สถานะอยู่ในหน่วยความจำเท่านั้น เมื่อปิดหน้าอาจสูญหาย'
    : done ? (account?'เรียนจบบทนี้แล้ว · บันทึกในบัญชีแล้ว':'เรียนจบบทนี้แล้ว · บันทึกในเบราว์เซอร์นี้')
    : criteria ? (missing.length ? `ยังขาด: ${missing.join(' · ')}` : 'ครบข้อกำหนดแล้ว · กดเพื่อบันทึกว่าเรียนจบ')
    : 'ยังขาด: ทดลองหลักอย่างน้อย 1 ครั้ง · ตอบ Check your thinking A หรือ B อย่างน้อย 1 ครั้ง (ไม่ต้องถูก)';
  if(account) $('footer span').textContent='ความคืบหน้าตามบัญชี · ไม่รวมข้อมูลเดิมในเบราว์เซอร์';
  else if(!storageOK) $('footer span').textContent='บันทึกไม่ได้ — ใช้งานต่อได้ แต่ความคืบหน้าอยู่ในหน่วยความจำ';
}
async function loadAccount(){
  const loading=account.load(); renderProgress();
  try { await loading; } catch { /* Status and retry are rendered below. */ }
  renderProgress();
}
async function answer(a){
  if(quizBlocked()) return;
  const l=lessons[selected-1]; // Capture lesson before any asynchronous save/navigation.
  quizSelections.set(l.kind,a);
  renderQuizControls();
  feedback=(a===1?'ถูกต้อง — ':'ยังไม่ถูก — ')+l.why;
  $('#feedback').textContent=feedback;
  if(participation) participationOperation('record',l.kind,a===0?'quiz-answer-a':'quiz-answer-b','check-your-thinking');
  if(!account){localEligibility.record(l.kind,a===0?'quiz-answer-a':'quiz-answer-b','check-your-thinking');renderProgress();}
}
async function completeLesson(l){
  const criteria=account ? account.criteria?.[l.kind] : localEligibility.criteria(l.kind);
  if(pendingLesson!==null || quizBlocked() || !criteria?.simulation || !criteria?.thinking) return;
  if(!progress.includes(l.id)){
    if(account){
      pendingLesson=l.id; // Synchronous guard covers rapid manual/quiz clicks.
      renderProgress();
      try { await account.complete(l.kind); failedLessons.delete(l.id); }
      catch { failedLessons.add(l.id); } // Only server-confirmed completion is displayed.
      finally { pendingLesson=null; }
    }else{
      progress.push(l.id);
      try{localStorage.setItem(LOCAL_PROGRESS_KEY,encodeLocalProgress(localHistory=mergeLocalProgress(localHistory,lessons.filter(l=>progress.includes(l.id)).map(l=>l.kind))));}catch{storageOK=false;}
    }
  }
  renderProgress();
}
async function help(type){$('#dialog-title').textContent=type==='guide'?'คู่มือสอนทีม — ฉบับเต็ม':'คำศัพท์และวิธีใช้';$('#dialog-content').textContent='กำลังเปิดเอกสาร…';$('#help-dialog').showModal();if(type==='guide'){try{const r=await fetch(import.meta.env.BASE_URL+'TEAM_TRAINING_TH.md');if(!r.ok)throw new Error();const pre=document.createElement('pre');pre.className='source-guide';pre.textContent=await r.text();$('#dialog-content').replaceChildren(pre);}catch{$('#dialog-content').textContent='เปิดคู่มือไม่สำเร็จ กรุณาปิดแล้วลองใหม่ หรือเปิดไฟล์ public/TEAM_TRAINING_TH.md';}}else{$('#dialog-content').innerHTML='<p>เลือกบท → อ่านเป้าหมาย → เปลี่ยนสถานการณ์ → กดเดินระบบ → เปรียบเทียบผล → ตอบคำถาม ในบัญชีต้องกดเรียนจบ ทดลองหลัก และตอบคำถาม A หรือ B (ไม่ต้องถูก) ครบทุกบทจึงนับคลาสสำหรับ Level ทำตามลำดับใดก็ได้ ส่วน Standalone บันทึกในเบราว์เซอร์เมื่อกดเรียนจบหรือตอบถูก การเรียนจบไม่ใช่คะแนนสอบ รีเซ็ตการทดลองไม่ลบความคืบหน้า</p><dl><dt>Source of truth</dt><dd>แหล่งข้อมูลหลักที่ใช้ตัดสินความถูกต้อง</dd><dt>Idempotency</dt><dd>ทำคำขอเดิมซ้ำโดยไม่เพิ่มผลข้างเคียง ต้องตรวจ payload และขอบเขต key</dd><dt>Replication lag</dt><dd>สำเนายังตามการเขียนที่ primary ไม่ทัน</dd><dt>ACK / Redelivery</dt><dd>การยืนยันรับงานสำเร็จ / การส่งงานเดิมให้ประมวลผลอีก</dd><dt>RPO / RTO</dt><dd>ขอบเขตข้อมูลที่ยอมสูญเสีย / เวลากู้บริการที่ยอมรับได้</dd><dt>Backpressure</dt><dd>ควบคุมงานเข้าเมื่อส่วนปลายรับไม่ไหว</dd><dt>ข้อจำกัด</dt><dd>ไม่มี network, DB, payment หรือ email จริง ทุกขั้นทำตามลำดับ ไม่มีการวัด latency หรือ load test เวลารอและ backoff แทนด้วยการกดปุ่ม ไม่จำลอง concurrency, TTL, failover election หรือ resharding migration</dd></dl>';}}
state=initial();mount();
if(account) loadAccount();
if(participation) participationOperation('load');
