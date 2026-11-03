import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
test('lesson metadata no longer advertises an empty scaffold',()=>{
 assert.doesNotMatch(readFileSync(new URL('../index.html',import.meta.url),'utf8'),/รอเอกสารต้นฉบับ|ยังไม่มีบทเรียน|ยังไม่เปิดเรียน/);
});
test('LAB01 owns qualification and private source-grounded assessment',()=>{
 const m=JSON.parse(readFileSync(new URL('../course.json',import.meta.url)));
 assert.deepEqual(m.lessons,['framework-scope']);
 assert.deepEqual(m.completion_requirements,['manual','simulation','thinking']);
 assert.deepEqual(m.participation['framework-scope']['framework-scope'],['review-scope']);
 const bank=JSON.parse(readFileSync(new URL('../assessment.json',import.meta.url)));
 assert.ok(bank.questions.length>=3);
 assert.ok(bank.questions.every(q=>q.lesson_id==='framework-scope'));
});
test('LAB01 uses customer wording throughout lesson copy and private assessment',()=>{
 const paths=['../src/main.js','../src/lessons.js','../src/scope.js','../assessment.json'];
 for(const path of paths){
  const text=readFileSync(new URL(path,import.meta.url),'utf8');
  assert.ok(!text.includes('ผู้สัมภาษณ์'),`${path} must use ลูกค้า instead`);
 }
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.ok(main.includes('ลูกค้า / สถานะข้อมูล'));
 const bank=JSON.parse(readFileSync(new URL('../assessment.json',import.meta.url)));
 assert.equal(bank.questions.find(q=>q.id==='framework-assumptions').prompt,'ถ้าลูกค้าให้กำหนดสมมติฐานเอง ควรทำอย่างไร?');
});
test('scope exercise distinguishes guessed architecture from clarified requirements',async()=>{
 assert.ok(existsSync(new URL('../src/scope.js',import.meta.url)),'scope decision model exists');
 const {evaluateScope}=await import('../src/scope.js');
 assert.equal(evaluateScope({features:false,order:false,scale:false}).ready,false);
 assert.equal(evaluateScope({features:true,order:true,scale:true}).ready,false);
 assert.equal(evaluateScope({platform:true,features:true,order:true,friends:true,scale:true,media:true}).ready,true);
});
