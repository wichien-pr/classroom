import test from 'node:test';
import assert from 'node:assert/strict';
import {replicationRoutes,replicationScene,replicationTopics} from '../src/replication-presentation.js';
import * as r from '../src/replication.js';
test('LAB05 presets independently retain lag, routing and explicit promotion gates',()=>{
 assert.equal(typeof r.replicationPreset,'function');
 const presets=Array.from({length:8},(_,i)=>r.replicationPreset(i));
 assert.deepEqual(presets[0].versions,[0,0,0]);
 assert.deepEqual(presets[1].versions,[2,1,1]);
 assert.match(r.replicationAction(presets[2],'read-replica').message,/Replica 2/);
 assert.match(r.replicationAction(presets[3],'read-replica').message,/fallback/);
 assert.match(r.replicationAction(presets[4],'write').message,/503/);
 for(const i of [5,6]){r.replicationAction(presets[i],'promote');assert.equal(presets[i].writer,0);}
 r.replicationAction(presets[7],'promote');assert.equal(presets[7].writer,1);assert.equal(presets[7].lost,1);
 assert.deepEqual(r.replicationPreset(7).versions,[2,1,2]);
 assert.equal(r.replicationPreset(7).writer,0);
});
test('LAB05 route projection is read-only and never invents delivery to failed or fenced nodes',()=>{
 for(let i=0;i<replicationTopics.length;i++)for(const action of replicationTopics[i][1].split(' ')){
  const s=r.replicationPreset(i),before=structuredClone(s),routes=replicationRoutes(s,action);assert.deepEqual(s,before);
  for(const [from,to] of routes){assert.equal(s.up[Number(to.slice(3))],true);if(from!=='web')assert.equal(Number(from.slice(3)),s.writer);}
  if(action==='promote')assert.deepEqual(routes,[]);
 }
 const s=r.replicationPreset(1);assert.deepEqual(replicationRoutes(s,'sync'),[['db-0','db-1'],['db-0','db-2']]);
 r.replicationAction(s,'sync');assert.deepEqual(replicationRoutes(s,'sync'),[]);
 const p=r.replicationPreset(7);r.replicationAction(p,'promote');assert.deepEqual(replicationRoutes(p,'write'),[['web','db-1']]);
 assert.deepEqual(replicationRoutes(p,'sync'),[['db-1','db-2']]);
 assert.match(replicationScene(p,null),/คนละสายข้อมูล/);assert.match(replicationScene(p,null),/fenced/);
});
