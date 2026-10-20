import test from 'node:test';
import assert from 'node:assert/strict';
import * as r from '../src/replication.js';
test('promotion cannot confuse equal version numbers from different histories',()=>{
 const s=r.replicationInitial();r.replicationAction(s,'write');s.up[1]=false;r.replicationAction(s,'sync');
 s.up[0]=false;s.up[1]=true;s.fenced=true;s.acceptLoss=true;r.replicationAction(s,'promote');r.replicationAction(s,'write');
 assert.match(r.replicationAction(s,'read-replica').message,/คนละสายข้อมูล/);
 assert.equal(r.replicationAction(s,'sync').meaningful,true);
 assert.doesNotMatch(r.replicationAction(s,'read-replica').message,/คนละสายข้อมูล/);
});
test('manual promotion requires failed writer, healthy candidate, fencing and explicit loss acceptance',()=>{
 const s=r.replicationInitial();r.replicationAction(s,'write');
 assert.equal(r.replicationAction(s,'promote').meaningful,false);assert.equal(s.writer,0);
 s.up[0]=false;r.replicationAction(s,'promote');assert.equal(s.writer,0);
 s.fenced=true;r.replicationAction(s,'promote');assert.equal(s.writer,0);
 s.acceptLoss=true;s.up[1]=false;r.replicationAction(s,'promote');assert.equal(s.writer,0);
 s.up[1]=true;assert.match(r.replicationAction(s,'promote').message,/สูญเสีย 1/);assert.equal(s.writer,1);
 assert.equal(s.lost,1);assert.equal(s.up[0],false);
 r.replicationAction(s,'write');assert.deepEqual(s.versions,[1,1,0]);
 r.replicationAction(s,'sync');assert.deepEqual(s.versions,[1,1,1]);
 const before=structuredClone(s);r.replicationAction(s,'promote');assert.deepEqual(s,before);
 const caught=r.replicationInitial();r.replicationAction(caught,'write');r.replicationAction(caught,'sync');caught.up[0]=false;caught.fenced=true;
 r.replicationAction(caught,'promote');assert.equal(caught.writer,1);assert.equal(caught.lost,0);
});
test('failed replicas route reads to a healthy copy then primary; offline writes cannot mutate',()=>{
 const s=r.replicationInitial();s.up[1]=false;
 assert.match(r.replicationAction(s,'read-replica').message,/Replica 2/);
 s.up[2]=false;
 assert.match(r.replicationAction(s,'read-replica').message,/fallback.*Primary/);
 s.up[0]=false;const before=structuredClone(s.versions);
 assert.match(r.replicationAction(s,'write').message,/503/);
 assert.deepEqual(s.versions,before);
 assert.match(r.replicationAction(s,'read-primary').message,/503/);
 assert.match(r.replicationAction(s,'read-replica').message,/503/);
 assert.equal(r.replicationAction(s,'sync').meaningful,false);
});
test('writes stay on primary, replica reads lag until a meaningful manual sync',()=>{
 const s=r.replicationInitial();
 assert.equal(r.replicationAction(s,'sync').meaningful,false);
 r.replicationAction(s,'write');
 assert.deepEqual(s.versions,[1,0,0]);
 assert.match(r.replicationAction(s,'read-replica').message,/STALE/);
 assert.match(r.replicationAction(s,'read-primary').message,/version 1/);
 assert.equal(r.replicationAction(s,'sync').meaningful,true);
 assert.deepEqual(s.versions,[1,1,1]);
 assert.equal(r.replicationAction(s,'sync').meaningful,false);
 assert.doesNotMatch(r.replicationAction(s,'read-replica').message,/STALE/);
});
