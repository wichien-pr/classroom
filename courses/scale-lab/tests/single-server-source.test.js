import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('private flow assessment covers single-host source, not removed DB timeout material',()=>{const bank=JSON.parse(readFileSync(new URL('../assessment.json',import.meta.url)));const q=bank.questions.find(q=>q.id==='flow-2');assert.match(q.prompt,/เครื่องเดียว/);assert.equal(q.answer,'a');assert.match(q.options[0].text,/Database.*Cache/);});
