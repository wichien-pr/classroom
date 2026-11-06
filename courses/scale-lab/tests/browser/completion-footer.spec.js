import {test,expect} from '@playwright/test';
import {lessons} from '../../src/lessons.js';

test('standalone requires experiment and either answer, never auto-completes, persists eligibility',async({page})=>{
 await page.goto('/');
 await page.locator('[data-answer="0"]').click();
 await expect(page.locator('#complete-lesson')).toBeDisabled();
 await page.locator('#step').click();
 await expect(page.locator('#complete-lesson')).toBeEnabled();
 await expect(page.locator('#progress')).toContainText('0 / 12');
 await page.reload();
 await expect(page.locator('#complete-lesson')).toBeEnabled();
 await page.locator('#complete-lesson').focus();await page.keyboard.press('Enter');
 await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 await expect(page.locator('[aria-current="page"]')).toHaveAttribute('data-lesson','1');
 await page.reload();await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 await page.locator('[data-lesson="2"]').click();
 await page.locator('[data-answer="1"]').click();
 await expect(page.locator('#complete-lesson')).toBeDisabled();
 await expect(page.locator('#progress')).toContainText('1 / 12');
});

test('completion footer is readable with comfortable controls at desktop and phone widths',async({page})=>{
 await page.goto('/');
 for(const width of [1280,390,320]){
  await page.setViewportSize({width,height:800});
  const metrics=await page.locator('#complete-lesson').evaluate(b=>({height:b.getBoundingClientRect().height,font:parseFloat(getComputedStyle(b).fontSize)}));
  expect(metrics.height).toBeGreaterThanOrEqual(48);expect(metrics.font).toBeGreaterThanOrEqual(16);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});

test('existing standalone completions survive without guessed new eligibility',async({page})=>{
 await page.addInitScript(()=>{if(!localStorage.getItem('seeded-footer')){localStorage.setItem('scale-lab-progress-v2',JSON.stringify({version:2,completed:['session','flow']}));localStorage.setItem('seeded-footer','1');}});
 await page.goto('/');await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 await page.locator('[data-lesson="2"]').click();await expect(page.locator('#complete-lesson')).toBeDisabled();
 await page.locator('#estimate').click();await page.locator('[data-answer="1"]').click();await page.locator('#complete-lesson').click();await page.reload();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('scale-lab-progress-v2')).completed)).toEqual(['session','flow','workload']);
 await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
});

test('all lessons have one gated completion footer and no next-lesson control',async({page})=>{
 await page.goto('/');
 for(const lesson of lessons){
  await page.locator(`[data-lesson="${lesson.id}"]`).click();
  await expect(page.locator('footer .lesson-completion')).toHaveCount(1);
  await expect(page.locator('.lesson-completion')).toHaveCount(1);
  await expect(page.locator('#next')).toHaveCount(0);
  await expect(page.locator('#complete-lesson')).toBeDisabled();
  await expect(page.locator('#completion-status')).toContainText('ยังขาด:');
 }
});
