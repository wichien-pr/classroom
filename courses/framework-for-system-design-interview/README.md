# A Framework For System Design Interviews

## LAB01 — ทำความเข้าใจโจทย์และกำหนดขอบเขต

**Deploy LAB01 แล้วบน Docker HTTPS: https://localhost/courses/framework-for-system-design-interview/**
Source ที่ deploy อยู่ใน canonical `/Users/prommeesee/projects/classroom`; เก็บบัญชี/progress/uploads เดิมครบ ดู [deployment verification](../../docs/framework-lab01-deployment.md) สำหรับหลักฐาน rollout; การเผยแพร่ Git แยกจาก deployment

บทแรกฝึกถามข้อกำหนดก่อนออกแบบ ด้วยตัวอย่าง News feed: mobile + web, สร้างโพสต์/อ่าน feed เพื่อน, เรียงใหม่ไปเก่า, เพื่อน 5,000 คน, 10 ล้าน DAU, ภาพและวิดีโอ ถามเพิ่มเรื่องการเติบโต 3/6/12 เดือนและบริการเดิมโดยไม่เติมคำตอบที่เอกสารไม่ได้ให้

- Lesson/simulation: `framework-scope`; action หลัก: `review-scope`
- Thinking: original `answers[0]` = `quiz-answer-a` (ไม่ถูก), `answers[1]` = `quiz-answer-b` (ถูก); สุ่มเฉพาะลำดับแสดง
- Account qualification: manual + ตรวจขอบเขต + ตอบหนึ่งตัวเลือก ไม่ต้องตอบถูกเพื่อบันทึก participation
- Standalone: localStorage ของคลาสนี้เท่านั้น ไม่ sync เข้าบัญชี; ปุ่ม manual หรือคำตอบถูกบันทึก local completion ตาม Lab pattern
- ถาม/เขียนสมมติฐาน/reset ไม่ให้คะแนน; ตรวจขอบเขตก่อนรู้ครบเป็นการฝึกที่มีความหมาย ไม่ใช่ข้อสอบ
- Notebook, revealed answers และ quiz selection อยู่ในหน่วยความจำของหน้า ไม่ใช่ข้อมูลที่ sync เข้าบัญชี
- Private assessment 4 ข้ออยู่ `assessment.json` นอก dist/public ไม่มี backend branch ของคลาสนี้
- `progress.js`, `participation.js`, `integration.js` และ completion status rendering ใช้ generic patterns ของ Estimate Lab แบบ course-owned ไม่ import ข้ามคลาส

## ตรวจสอบจาก course directory

```sh
export PATH=/usr/local/bin:$PATH
npm ci
npm test
npm run build
npm run test:e2e
# Integrated build LAST, only in this isolated worktree:
VITE_CLASSROOM_URL=/ VITE_CLASSROOM_PROGRESS_URL=/api/courses/framework-for-system-design-interview/progress npm run build -- --base /courses/framework-for-system-design-interview/
```

`test:e2e` ตรวจ compiled standalone dist และสร้าง integrated output ชั่วคราวเพื่อทดสอบ frontend API failure/hold/retry contract ไม่ใช่ backend persistence

## Disposable authenticated QA

จาก root: `appworks/.venv/bin/python scripts/framework-lab01-qa.py` สร้างฐานข้อมูลทิ้งได้ใต้ Hermes scratch และสมาชิก QA สองคน จากนั้นจาก course directory รัน `node tests/real-account.mjs` ใช้ URL จาก `evidence/framework-lab01/server.json` ไม่ใช้พอร์ตจริง ไม่ส่งอีเมล และไม่ impersonate สมาชิกจริง

หยุดเฉพาะ QA PID แล้วเริ่มด้วย `--resume` และรัน `node tests/restart-account.mjs` เพื่อตรวจ persistence ทั้งสองบัญชี ตัว runner แรกต้องใช้ DB ใหม่ (เพราะตรวจเริ่มต้นไม่มีคะแนน)

Backend: จาก `appworks/` รัน `.venv/bin/python -m pytest -q` หลังมี build ของคลาสอื่นใน isolated tree แล้ว ไม่ rebuild live dist

Source coverage, TDD evidence, actual results และข้อจำกัดอยู่ [verification](../../docs/framework-lab01-verification.md)
