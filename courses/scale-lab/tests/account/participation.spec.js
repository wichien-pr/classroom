import {test,expect} from '@playwright/test';

test('wrong quiz answer earns one separately identified point without completing lesson',async({page})=>{
 const events=[],completions=[];
 await page.route('**/api/courses/scale-lab/progress',r=>{
  if(r.request().method()==='POST') completions.push(r.request().postDataJSON());
  return r.fulfill({json:{completed:[],total:12,csrf_token:'test'}});
 });
 await page.route('**/api/courses/scale-lab/participation',r=>{
  if(r.request().method()==='POST') events.push(r.request().postDataJSON());
  return r.fulfill({json:{score:new Set(events.map(e=>[e.lesson_id,e.simulation_id,e.action].join('/'))).size,csrf_token:'test'}});
 });
 await page.goto('/');await expect(page.locator('#participation-score')).toHaveText('0');
 await page.locator('[data-answer="0"]').click();
 await expect(page.locator('#participation-score')).toHaveText('1');
 expect(events[0]).toMatchObject({lesson_id:'flow',simulation_id:'check-your-thinking',action:'quiz-answer-a'});
 expect(completions).toEqual([]);
 await expect(page.locator('#feedback')).toContainText('ยังไม่ถูก');
 await expect(page.locator('.participation')).toContainText('แต่ละปุ่มครั้งแรก');
});

test('all lessons award each distinct button once including reset and navigation',async({page})=>{
 const {lessons}=await import('../../src/lessons.js');
 const events=[],completed=[];
 await page.route('**/api/courses/scale-lab/progress',r=>{
  if(r.request().method()==='POST') completed.push(r.request().postDataJSON().lesson_id);
  return r.fulfill({json:{completed,total:12,csrf_token:'test'}});
 });
 await page.route('**/api/courses/scale-lab/participation',r=>{
  if(r.request().method()==='POST') events.push(r.request().postDataJSON());
  return r.fulfill({json:{score:new Set(events.map(e=>[e.lesson_id,e.simulation_id,e.action].join('/'))).size,csrf_token:'test'}});
 });
 await page.goto('/');await expect(page.locator('#participation-score')).toHaveText('0');
 for(const l of lessons){
  await page.locator(`[data-lesson="${l.id}"]`).click();
  const before=events.length, beforeScore=new Set(events.map(e=>[e.lesson_id,e.simulation_id,e.action].join('/'))).size;
  for(const [choice,count] of [[0,1],[0,1],[1,2],[1,2],[0,2]]){
   await page.locator(`[data-answer="${choice}"]`).click();
   await expect(page.locator('#participation-score')).toHaveText(String(beforeScore+count));
  }
  expect(events.slice(before).map(e=>[e.lesson_id,e.simulation_id,e.action])).toEqual([0,0,1,1,0].map(a=>[l.kind,'check-your-thinking',a===0?'quiz-answer-a':'quiz-answer-b']));
 }
 expect(completed).toEqual([]); // Quiz correctness is never an explicit manual mark.
 expect(new Set(events.map(e=>e.event_id)).size).toBe(lessons.length*5);
 await page.locator('[data-lesson="1"]').click();await page.locator('#reset').click();
 await expect(page.locator('[data-answer="0"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#feedback')).toContainText('ยังไม่ถูก');
 await page.locator('[data-answer="0"]').click();
 await expect(page.locator('#participation-score')).toHaveText(String(lessons.length*2));
 expect(events).toHaveLength(lessons.length*5+1);
});

test('quiz load and lost-response retry lock choices across progress renders and navigation',async({page})=>{
 let loadFail=true,drop=true,release;const events=[],completed=[],seen=new Set();
 await page.route('**/api/courses/scale-lab/progress',r=>{
  if(r.request().method()==='POST') completed.push(r.request().postDataJSON().lesson_id);
  return r.fulfill({json:{completed,total:12,csrf_token:'test'}});
 });
 await page.route('**/api/courses/scale-lab/participation',async r=>{
  if(loadFail){loadFail=false;return r.fulfill({status:503});}
  if(r.request().method()==='POST'){
   const event=r.request().postDataJSON();events.push(event);seen.add([event.lesson_id,event.simulation_id,event.action].join('/'));
   if(drop){drop=false;return r.abort();}
   if(events.length===2) await new Promise(resolve=>{release=resolve;});
  }
  return r.fulfill({json:{score:seen.size,csrf_token:'test'}});
 });
 await page.goto('/');await expect(page.locator('#participation-status')).toContainText('โหลดคะแนนไม่ได้');
 await expect(page.locator('[data-answer="0"]')).toBeDisabled();
 await page.locator('#retry-participation').click();await expect(page.locator('#participation-score')).toHaveText('0');
 await page.locator('[data-answer="1"]').click();
 await expect(page.locator('#participation-status')).toContainText('บันทึกไม่ได้');
   await expect(page.locator('#complete-lesson')).toHaveText('ทำเครื่องหมายว่าเรียนจบ');
 await expect(page.locator('[data-answer="0"]')).toBeDisabled();
 await page.locator('[data-lesson="2"]').click();await page.locator('#complete-lesson').click();
 await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 await expect(page.locator('[data-answer="1"]')).toBeDisabled();
 // Even synthetic direct handler calls cannot replace the captured pending selection.
 await page.locator('[data-answer="0"]').evaluate(b=>b.onclick());
 await expect(page.locator('[data-answer="0"]')).toHaveAttribute('aria-pressed','false');
 await page.locator('#retry-participation').click();
 await expect(page.locator('#participation-status')).toContainText('กำลังบันทึก');
 await expect(page.locator('#participation-score')).toHaveText('0');
 await expect(page.locator('[data-answer="0"]')).toBeDisabled();
 await expect.poll(()=>events.length).toBe(2);release();
 await expect(page.locator('#participation-score')).toHaveText('1');
 expect(events[1]).toEqual(events[0]);expect(events[0]).toMatchObject({lesson_id:'flow',simulation_id:'check-your-thinking',action:'quiz-answer-b'});
 await page.locator('[data-lesson="1"]').click();await page.locator('[data-answer="1"]').click();
 await expect(page.locator('#participation-score')).toHaveText('1');
 expect(events).toHaveLength(3);expect(events[2].event_id).not.toBe(events[0].event_id);
 expect(completed).toEqual(['workload']);
 await page.reload();await expect(page.locator('#participation-score')).toHaveText('1');
});

test('completed flow and empty worker are not new actions',async({page})=>{
 let score=0; const seen=new Set();
 await page.route('**/api/courses/scale-lab/progress',r=>r.fulfill({json:{completed:[],total:12,csrf_token:'test'}}));
 await page.route('**/api/courses/scale-lab/participation',r=>{
   if(r.request().method()==='POST'){const e=r.request().postDataJSON();seen.add([e.lesson_id,e.simulation_id,e.action].join('/'));score=seen.size;}
   return r.fulfill({json:{score,csrf_token:'test'}});
 });
 await page.goto('/');
 for(let i=1;i<=6;i++){await page.locator('#step').click();await expect(page.locator('#participation-score')).toHaveText('1');}
 await page.locator('#step').click();
 await page.waitForTimeout(100); expect(score).toBe(1);
 await page.locator('[data-lesson="9"]').click();
 await page.locator('#failure').selectOption('ok');await page.locator('#work').click();
 await expect(page.locator('#participation-score')).toHaveText('2');
 await page.locator('#work').click(); await page.waitForTimeout(100);expect(score).toBe(2);
});

test('invalid input never earns score',async({page})=>{
 let posts=0;
 await page.route('**/api/courses/scale-lab/progress',r=>r.fulfill({json:{completed:[],total:12,csrf_token:'test'}}));
 await page.route('**/api/courses/scale-lab/participation',r=>{
   if(r.request().method()==='POST') posts++;
   return r.fulfill({json:{score:posts,csrf_token:'test'}});
 });
 await page.goto('/');await page.locator('[data-lesson="3"]').click();
 await page.locator('#key').fill('');await page.locator('#order').click();
 await expect(page.locator('#outcome')).toContainText('INVALID');
 await page.waitForTimeout(100);expect(posts).toBe(0);
 await page.locator('[data-lesson="2"]').click();
 await page.locator('#web-size').fill('0');await page.locator('#estimate').click();
 await page.waitForTimeout(100);expect(posts).toBe(0);
});

test('load retry and delayed save show honest status and block duplicate actions',async({page})=>{
 let fail=true,release,posts=0;
 await page.route('**/api/courses/scale-lab/progress',r=>r.fulfill({json:{completed:[],total:12,csrf_token:'test'}}));
 await page.route('**/api/courses/scale-lab/participation',async r=>{
   if(fail){fail=false;return r.fulfill({status:503,body:'unavailable'});}
   if(r.request().method()==='POST'){posts++;await new Promise(resolve=>{release=resolve;});return r.fulfill({json:{score:1,csrf_token:'test'}});}
   return r.fulfill({json:{score:0,csrf_token:'test'}});
 });
 await page.goto('/');await expect(page.locator('#participation-status')).toContainText('โหลดคะแนนไม่ได้');
 await expect(page.locator('#step')).toBeDisabled();await page.locator('#retry-participation').click();
 await expect(page.locator('#participation-score')).toHaveText('0');await page.locator('#step').click();
 await expect(page.locator('#participation-status')).toContainText('กำลังบันทึก');
 await expect(page.locator('#participation-score')).toHaveText('0');await expect(page.locator('#step')).toBeDisabled();
 await page.locator('[data-lesson="2"]').click();await expect(page.locator('#estimate')).toBeDisabled();
 release();await expect(page.locator('#participation-score')).toHaveText('1');expect(posts).toBe(1);
});

test('simulation click saves only confirmed score; lost response retry keeps ID through navigation',async({page})=>{
 let score=0, fail=true; const events=[];
 await page.route('**/api/courses/scale-lab/progress',r=>r.fulfill({json:{completed:[],total:12,csrf_token:'test'}}));
 await page.route('**/api/courses/scale-lab/participation',async r=>{
   if(r.request().method()==='POST'){
     events.push(r.request().postDataJSON());
     if(fail){fail=false;await r.abort();return;}
     score++;
   }
   await r.fulfill({json:{score,csrf_token:'test'}});
 });
 await page.goto('/');
 await expect(page.locator('#participation-score')).toHaveText('0');
 await page.locator('#step').click();
 await expect(page.locator('#participation-status')).toContainText('บันทึกไม่ได้');
 await expect(page.locator('#participation-score')).toHaveText('0');
 await page.locator('[data-lesson="2"]').click();
 await page.locator('#retry-participation').click();
 await expect(page.locator('#participation-score')).toHaveText('1');
 expect(events[0]).toEqual(events[1]); expect(events[1].lesson_id).toBe('flow');
 await page.locator('#reset').click();
 await expect(page.locator('#participation-score')).toHaveText('1');
 expect(events).toHaveLength(2);
});
