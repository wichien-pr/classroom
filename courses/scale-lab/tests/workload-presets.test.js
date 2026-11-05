import {test} from 'node:test';
import assert from 'node:assert/strict';
import {workloadPreset} from '../src/workload-presets.js';
import {evaluateDatabase} from '../src/database.js';
test('fixed topic presets project the original model including SQL/NoSQL contrast',()=>{
 const expected=[[0,0,3,1,true,true,true],[1,0,3,3,false,true,true],[2,0,4,1,true,false,true],[3,0,3,1,true,true,true],[3,1,3,1,true,true,false],[3,2,3,1,true,true,true]];
 for(const [topic,run,web,data,independent,ready,fit] of expected){
  const p=workloadPreset(topic,run),r=evaluateDatabase(p.config);
  assert.deepEqual([r.web,r.data,r.independent,r.ready,r.fit],[web,data,independent,ready,fit]);assert.ok(p.label);
 }
 assert.deepEqual(workloadPreset(3,3),workloadPreset(3,0));
});
