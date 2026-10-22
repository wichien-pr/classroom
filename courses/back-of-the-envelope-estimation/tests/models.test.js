import test from 'node:test';
import assert from 'node:assert/strict';
const model=await import('../src/models.js').catch(()=>({}));
test('units distinguish decimal MB, binary MiB and bits',()=>{
 assert.equal(typeof model.units,'function');
 assert.equal(model.units({amount:1,power:20}).bytes,1048576);
 assert.equal(model.units({amount:1,power:20}).bits,8388608);
 assert.equal(model.units({amount:1,power:20}).mb,1.048576);
 assert.throws(()=>model.units({amount:-1,power:20}));
});

test('latency keeps historical ns units and serial comparison',()=>{assert.equal(typeof model.latency,'function');const r=model.latency({first:100,second:150000000,count:10});assert.equal(r.ratio,1500000);assert.equal(r.totalMs,1500);assert.throws(()=>model.latency({first:0,second:1,count:1}));});

test('availability 365 day year and exact endpoints',()=>{assert.equal(typeof model.availability,'function');assert.ok(Math.abs(model.availability({percent:99.99,days:365}).seconds-3153.6)<1e-6);assert.equal(model.availability({percent:100,days:365}).seconds,0);assert.equal(model.availability({percent:0,days:1}).seconds,86400);assert.throws(()=>model.availability({percent:101,days:365}));});

test('traffic example uses DAU then posts/day then seconds, peak is assumed',()=>{assert.equal(typeof model.traffic,'function');const r=model.traffic({mau:300e6,daily:50,posts:2,peak:2});assert.equal(r.dau,150e6);assert.equal(r.perDay,300e6);assert.ok(Math.abs(r.qps-3472.222222)<0.001);assert.equal(r.peak,r.qps*2);assert.throws(()=>model.traffic({mau:1,daily:101,posts:2,peak:2}));});

test('media storage 30 TB/day 54.75 PB/5years; overhead explicit',()=>{assert.equal(typeof model.storage,'function');const x={posts:300e6,media:10,mb:1,years:5,copies:1,overhead:0};assert.equal(model.storage(x).dailyTB,30);assert.equal(model.storage(x).logicalPB,54.75);assert.equal(model.storage({...x,copies:3,overhead:20}).physicalPB,197.1);assert.throws(()=>model.storage({...x,copies:1.5}));});

test('rounding compares estimate with exact baseline without hiding error',()=>{assert.equal(typeof model.rounding,'function');const r=model.rounding({numerator:99987,denominator:9.1,roughN:100000,roughD:10});assert.equal(r.estimate,10000);assert.ok(r.errorPercent<0);assert.throws(()=>model.rounding({numerator:1,denominator:0,roughN:1,roughD:1}));});
