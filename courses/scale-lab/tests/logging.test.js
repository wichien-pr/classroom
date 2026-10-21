import {test} from 'node:test';
import assert from 'node:assert/strict';
const model=await import('../src/logging.js').catch(()=>({}));
test('pipeline blocks deploy after failed tests and terminal steps are unscored no-ops',()=>{
 assert.equal(typeof model.pipelineStep,'function');
 const failed=model.loggingInitial();
 assert.equal(model.pipelineStep(failed).meaningful,true);assert.equal(failed.stage,'built');
 assert.equal(model.pipelineStep(failed).meaningful,true);assert.equal(failed.stage,'blocked');
 const snapshot=structuredClone(failed);assert.equal(model.pipelineStep(failed).meaningful,false);assert.deepEqual(failed,snapshot);
 const ok=model.loggingInitial(true);for(let i=0;i<3;i++)assert.equal(model.pipelineStep(ok).meaningful,true);
 assert.equal(ok.stage,'deployed');assert.equal(model.pipelineStep(ok).meaningful,false);
 assert.equal(model.loggingInitial().stage,'ready');
});
test('metrics distinguish host, aggregate tier and business evidence with explicit measurement windows',()=>{
 assert.equal(typeof model.inspectMetrics,'function');
 for(const group of ['host','tier','business']){const r=model.inspectMetrics(group);assert.equal(r.group,group);assert.equal(r.rows.length,3);assert.ok(r.window);assert.ok(r.caution);}
 assert.throws(()=>model.inspectMetrics('unknown'));
});
test('central logs reveal errors on other services without claiming automatic repair',()=>{
 assert.equal(typeof model.inspectLogs,'function');
 const local=model.inspectLogs('web-1','error');assert.deepEqual(local,[]);
 const central=model.inspectLogs('all','error');assert.equal(central.length,2);
 assert.deepEqual(central.map(x=>x.service),['web-2','worker-1']);
 assert.equal(model.inspectLogs('all','all').length,4);
 assert.throws(()=>model.inspectLogs('<script>','error'));
 central[0].message='changed';assert.notEqual(model.inspectLogs('all','error')[0].message,'changed');
});
