import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createQueueFlow} from '../src/queue-flow.js';
import * as view from '../src/queue-presentation.js';
test('backlog snapshots conserve real job IDs through arrivals, worker and completion',async()=>{
 const frames=[];await createQueueFlow({record:async()=>{},show:async f=>frames.push(f)}).run(3);
 assert.equal(typeof view.queueBacklogSnapshot,'function');
 assert.deepEqual(frames.map(f=>[f.before.jobs.length,f.state.jobs.length,f.state.completed.length]),[[0,3,0],[3,6,0],[6,5,1],[5,8,1]]);
 for(const f of frames){const start=view.queueBacklogSnapshot(f,'transfer'),arrived=view.queueBacklogSnapshot(f,'processing'),end=view.queueBacklogSnapshot(f,'settled');
 const changed=f.action==='enqueue-jobs'?f.state.jobs.filter(j=>!f.before.jobs.some(b=>b.id===j.id)):f.state.completed.filter(j=>!f.before.completed.some(b=>b.id===j.id));
 assert.deepEqual(start.transit,changed);assert.deepEqual(start.completed,f.before.completed);
 assert.equal(start.waiting.length+start.transit.length+start.completed.length,f.state.jobs.length+f.state.completed.length);
 assert.deepEqual(end.waiting,f.state.jobs);assert.deepEqual(end.completed,f.state.completed);assert.deepEqual(end.transit,[]);
 if(f.action==='process-jobs'){assert.deepEqual(arrived.working,changed);assert.equal(arrived.completed.length,0);}
 }
 const final=view.queueBacklogSnapshot(frames.at(-1),'settled');assert.equal(final.received,9);assert.equal(final.waiting.length,8);assert.equal(final.completed.length,1);
 assert.match(view.queueScene(frames[0].before,null,3),/queue-backlog-summary/);
});
