import {test,expect} from '@playwright/test';
import {lessons} from '../../src/lessons.js';

test('score panel is absent on every lesson while manual completion remains usable',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 for(const lesson of lessons){
  await page.locator(`[data-lesson="${lesson.id}"]`).click();
  await expect(page.locator('.participation,#participation-score')).toHaveCount(0);
  await expect(page.getByText('คะแนนและเงื่อนไขการเรียนจบ',{exact:true})).toHaveCount(0);
  await expect(page.getByText(/Standalone · ไม่บันทึกคะแนนบัญชี/)).toHaveCount(0);
  await expect(page.locator('#participation-status')).toBeHidden();
  await page.locator(lesson.kind==='message-queue'?'#queue-run':lesson.kind==='data-centers'?'#dc-run':lesson.kind==='stateless-web'?'#web-run':lesson.kind==='cdn'?'#cdn-run':lesson.kind==='cache'?'#cache-run':lesson.kind==='replica'?'#replication-run':'[data-action]:visible').first().click();
  if(lesson.kind==='message-queue')await expect(page.locator('#queue-run')).toBeEnabled();
  if(lesson.kind==='data-centers')await expect(page.locator('#dc-run')).toBeEnabled();
  if(lesson.kind==='stateless-web')await expect(page.locator('#web-run')).toBeEnabled();
  if(lesson.kind==='cdn')await expect(page.locator('#cdn-run')).toBeEnabled();
  if(lesson.kind==='cache')await expect(page.locator('#cache-run')).toBeEnabled({timeout:10000});
  if(lesson.kind==='replica')await expect(page.locator('#replication-run')).toBeEnabled({timeout:10000});
  await page.locator('[data-answer="0"]').click();
  await page.locator('#complete-lesson').click();
  await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 }
 await expect(page.locator('#progress')).toContainText(`${lessons.length} / ${lessons.length}`);
 expect(errors).toEqual([]);
});
