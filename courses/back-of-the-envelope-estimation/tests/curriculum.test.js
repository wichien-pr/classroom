import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
const content=await import('../src/lessons.js').catch(()=>({}));
test('five source-grounded lessons each have fields, ordered experiment, diagram and explained quiz',()=>{
 assert.equal(content.lessons?.length,5);
 for(const l of content.lessons){assert.ok(l.id.startsWith('estimate-'));assert.ok(l.fields.length);assert.equal(l.steps.length,3);assert.equal(l.answers.length,2);assert.equal(l.answers.filter(a=>a.correct).length,1);for(const a of l.answers)assert.ok(a.reason);assert.equal(l.diagram.length,3);}
});
test('manifest and private bank cover exactly curriculum and 15 action definitions',()=>{
 assert.ok(existsSync(new URL('../course.json',import.meta.url)));
 const manifest=JSON.parse(readFileSync(new URL('../course.json',import.meta.url)));
 assert.deepEqual(manifest.lessons,content.lessons.map(l=>l.id));assert.deepEqual(manifest.completion_requirements,['manual','simulation','thinking']);
 assert.equal(Object.values(manifest.participation).flatMap(x=>Object.values(x).flat()).length,15);
 const bank=JSON.parse(readFileSync(new URL('../assessment.json',import.meta.url)));
 assert.deepEqual([...new Set(bank.questions.map(q=>q.lesson_id))],manifest.lessons);
 assert.equal(existsSync(new URL('../public/assessment.json',import.meta.url)),false);
});
