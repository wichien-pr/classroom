import {test,expect} from '@playwright/test';
import {lessons} from '../../src/lessons.js';

test('score panel is absent on every lesson while manual completion remains usable',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 for(const lesson of lessons){
  await page.locator(`[data-lesson="${lesson.id}"]`).click();
  await expect(page.locator('.participation,#participation-score')).toHaveCount(0);
  await expect(page.getByText('คะแนนและเงื่อนไขการเรียนจบ',{exact:true})).toHaveCount(0);
  await expect(page.getByText(/Standalone · ไม่บันทึกคะแนนบัญชี/)).toHaveCount(0);
  await expect(page.locator('#participation-status')).toBeHidden();
  await page.locator('#complete-lesson').click();
  await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 }
 await expect(page.locator('#progress')).toContainText(`${lessons.length} / ${lessons.length}`);
 expect(errors).toEqual([]);
});
