import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cdnInitial,cdnAction} from '../src/cdn.js';
import {createCdnFlow} from '../src/cdn-flow.js';
import * as view from '../src/cdn-presentation.js';
test('versioned URL and ignored-query response labels still project underlying model truth',()=>{
 const state=cdnInitial();cdnAction(state,'request');cdnAction(state,'publish');cdnAction(state,'version');
 let before=structuredClone(state);cdnAction(state,'request');
 assert.equal(view.cdnTokenLabel({before,state},'client','edge'),'GET ?v=2');assert.equal(view.cdnTokenLabel({before,state},'edge','client'),'v2');
 state.includeQuery=false;before=structuredClone(state);cdnAction(state,'request');
 assert.equal(view.cdnTokenLabel({before,state},'edge','client'),'v1');
});
test('CDN moving labels distinguish requested URL from actual returned version in every topic',async()=>{
 assert.equal(typeof view.cdnTokenLabel,'function');
 for(let topic=0;topic<view.cdnTopics.length;topic++){
  const frames=[];await createCdnFlow({show:async f=>frames.push(f),record:async()=>{}}).run(topic);
  for(const frame of frames){
   for(const [from,to] of view.cdnRoutes(frame)){
    const request=from==='client'||from==='edge'&&to==='origin';
    const expected=request?`GET${frame.before.urlVersion===null?'':` ?v=${frame.before.urlVersion}`}`:`v${frame.state.delivered}`;
    assert.equal(view.cdnTokenLabel(frame,from,to),expected);
   }
   const html=view.cdnScene(frame.state,frame);
   assert.doesNotMatch(html,/<circle class="cdn-particle"/);
   if(frame.state.path==='hit'&&frame.state.delivered!==frame.state.origin&&frame.action==='request')assert.equal(view.cdnTokenLabel(frame,'edge','client'),'v1');
  }
 }
});
