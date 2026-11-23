import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../src/lessons.js';
import {loggingLayout,loggingNotes} from '../src/logging-view.js';
import {loggingScene} from '../src/logging-presentation.js';
import {loggingInitial} from '../src/logging.js';
test('single candidate experiment presents independent evidence and retains quiz identity',()=>{
 const lesson=lessons.find(x=>x.kind==='logging-operations');
 assert.match(lesson.try,/ครั้งเดียว/);
 assert.equal(loggingLayout.title,'ก่อนปล่อย · Build / Test / Deploy');
 assert.doesNotMatch(loggingLayout.intro,/จากนั้นอ่าน logs|ตรวจVersion|Versionที่/);
 assert.doesNotMatch(loggingScene(loggingInitial()),/Logs|Metrics|logging-evidence|logging-metrics|ตรวจVersion|Versionที่/);
 assert.match(loggingScene(loggingInitial()),/logging-candidate/);
 assert.match(loggingNotes(),/Service Tier/);assert.match(loggingNotes(),/Business/);
 assert.equal(lesson.answers[0],'ได้ เพราะ CPU เป็นตัวแทนสุขภาพของทุกส่วนในระบบ');
 assert.equal(lesson.answers[1],'ไม่ได้ ต้องพิจารณา logs ตัวชี้วัดระดับบริการ และตัวชี้วัดธุรกิจร่วมกัน');
});
