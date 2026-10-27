import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lessons} from '../src/lessons.js';

test('LAB05 replaces storage with a new Tips identity as the final active lesson', () => {
 const tips = lessons[4];
 assert.equal(tips.id,'estimate-tips');
 assert.equal(tips.model,'rounding');
 assert.match(tips.title,/Tips/);
 assert.match(tips.intro,/กระบวนการ/);
 assert.deepEqual(tips.fields.map(f => f.value),[99987,9.1,100000,10]);
 assert.equal(lessons.at(-1).id,'estimate-tips');
 assert.equal(lessons.some(l => l.id==='estimate-storage'),false);
 const manifest=JSON.parse(readFileSync(new URL('../course.json',import.meta.url)));
 assert.deepEqual(manifest.lessons,lessons.map(l=>l.id));
 assert.deepEqual(manifest.participation['estimate-tips'],{'estimate-tips':['calculate'],'check-your-thinking':['quiz-answer-a','quiz-answer-b']});
 assert.equal(manifest.participation['estimate-storage'],undefined);
 const bank=JSON.parse(readFileSync(new URL('../assessment.json',import.meta.url)));
 const question=bank.questions.find(q=>q.lesson_id==='estimate-tips');
 assert.equal(question?.id,'estimate-tips-review');
 assert.equal(bank.questions.some(q=>q.lesson_id==='estimate-storage'),false);
});

const reference=await import('../src/tips-reference.js').catch(()=>({}));
test('Tips presents all four source principles and practice topics without invented units',()=>{
 assert.equal(typeof reference.renderTipsReference,'function','missing Tips reference');
 const html=reference.renderTipsReference();
 for(const text of ['การปัดเลขและประมาณค่า','99,987 ÷ 9.1','100,000 ÷ 10','เขียนสมมติฐาน','ระบุหน่วย','5 KB','5 MB','ฝึกโจทย์ที่พบบ่อย','QPS','Peak QPS','พื้นที่จัดเก็บ','Cache','จำนวน server','ไม่มีหน่วย','LAB04']) assert.ok(html.includes(text),text);
 assert.equal((html.match(/data-tip=/g)||[]).length,4);
 assert.doesNotMatch(html,/dashboard_|clipboard|\.png/);
});

test('LAB04 forward reference points to Tips rather than the retired storage experiment',async()=>{
 const {renderTrafficReference}=await import('../src/traffic-reference.js');
 const html=renderTrafficReference();
 assert.match(html,/LAB05.*Tips/);
 assert.doesNotMatch(html,/ทดลองเปลี่ยนขนาดสื่อ ระยะเก็บและจำนวนสำเนาต่อได้ใน LAB05/);
});
