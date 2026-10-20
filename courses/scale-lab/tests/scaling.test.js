import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
test('LAB 03 assessment keeps IDs and teaches scale up/out',()=>{
 const bank=JSON.parse(readFileSync(new URL('../assessment.json',import.meta.url),'utf8'));
 const q=bank.questions.filter(q=>q.lesson_id==='stock');
 assert.deepEqual(q.map(q=>q.id),['stock-5','stock-6']);
 assert.match(q[0].prompt,/Vertical scaling/);assert.match(q[1].prompt,/Horizontal scaling/);
});
test('outage needs a healthy routed spare; overload and limits are explicit',async()=>{
 const {evaluateScaling,scalingInitial}=await import('../src/scaling.js');
 const base=scalingInitial();
 assert.equal(evaluateScaling({...base,power:4,down:true}).capacity,0);
 assert.equal(evaluateScaling({...base,servers:4,down:true}).capacity,0);
 assert.equal(evaluateScaling({...base,servers:4,down:true,balanced:true}).capacity,3);
 assert.equal(evaluateScaling({...base,servers:1,down:true,balanced:true}).status,'offline');
 assert.equal(evaluateScaling(base).status,'overloaded');
 assert.equal(evaluateScaling({...base,power:3}).status,'ready');
 for(const patch of [{power:5},{servers:0},{traffic:-1},{traffic:1.5},{balanced:'yes'},{down:1},{power:NaN}]) assert.throws(()=>evaluateScaling({...base,...patch}));
});
test('scale up changes power, scale out needs routing to use the pool',async()=>{
 assert.ok(existsSync(new URL('../src/scaling.js',import.meta.url)), 'scaling model must exist');
 const {evaluateScaling,scalingInitial}=await import('../src/scaling.js');
 const base=scalingInitial();
 assert.equal(evaluateScaling(base).capacity,1);
 assert.equal(evaluateScaling({...base,power:4}).capacity,4);
 assert.equal(evaluateScaling({...base,servers:4}).capacity,1);
 assert.equal(evaluateScaling({...base,servers:4,balanced:true}).capacity,4);
});
