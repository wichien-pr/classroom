import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createQueueFlow,queuePreset} from '../src/queue-flow.js';
import {queueScene,queueBacklogSnapshot,queueRoutes} from '../src/queue-presentation.js';
test('every topic projects real message boxes, never circular traffic',async()=>{
 for(let topic=0;topic<5;topic++){
  const frames=[];await createQueueFlow({record:async()=>{},show:async f=>frames.push(f)}).run(topic);
  assert.match(queueScene(queuePreset(topic),null,topic),/queue-transit/);
  for(const f of frames){
   assert.doesNotMatch(queueScene(f.state,f,topic),/<circle/);
   const p=queueBacklogSnapshot(f,'transfer'),a=queueBacklogSnapshot(f,'processing'),s=queueBacklogSnapshot(f,'settled');
   const ids=[...p.waiting,...p.completed,...p.transit].map(j=>j.id);
   assert.equal(new Set(ids).size,ids.length);
   assert.deepEqual([...ids].sort((a,b)=>a-b),[...f.state.jobs,...f.state.completed].map(j=>j.id).sort((a,b)=>a-b));
   assert.equal(!!p.transit.length,!!queueRoutes(f).length);
   assert.deepEqual(a.completed,f.before.completed);
   assert.deepEqual(s.completed,f.state.completed);assert.deepEqual(s.waiting,f.state.jobs);
   if(f.action==='process-jobs')assert.equal(a.working.length,f.state.completed.length-f.before.completed.length);
  }
 }
});
