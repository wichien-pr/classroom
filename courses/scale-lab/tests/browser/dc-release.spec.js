import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const out=process.env.LAB09_EVIDENCE||new URL('../../../../evidence/lab09-remove-release-topic/',import.meta.url).pathname;
for(const width of [1280,390,320])for(const theme of ['light','dark'])test(`six topics end at capacity ${width} ${theme}`,async({page})=>{
 await mkdir(out,{recursive:true});await page.setViewportSize({width,height:740});await page.goto('/');await page.locator('[data-lesson="9"]').click();await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.emulateMedia({reducedMotion:'reduce'});
 const absent=async()=>{await expect(page.locator('.dc-release-panel,#dc-release-title')).toHaveCount(0);await expect(page.locator('#lesson-topic')).not.toContainText('ตรวจรุ่นบริการด้วย');await expect(page.locator('#lesson-topic')).not.toContainText('fullName');};
 for(let i=0;i<6;i++){
  await expect(page.locator('#lesson-topic-title')).toContainText(`${i+1} / 6`);await absent();
  if(i<5)await page.locator('#lesson-topic-next').click();
 }
 await expect(page.locator('#lesson-topic-title')).toHaveText('6 / 6 · ศูนย์เดียวรับไหวไหม');await expect(page.locator('#lesson-topic-next')).toBeDisabled();
 await page.locator('#dc-run').click();await expect(page.locator('#dc-run')).toBeEnabled();await expect(page.locator('.dc-capacity-excess')).toContainText('เกินกำลัง 40');await absent();
 await page.locator('#dc-replay').click();await expect(page.locator('#dc-run')).toBeEnabled();await absent();
 await page.locator('#lesson-topic-back').click();await expect(page.locator('#lesson-topic-title')).toContainText('5 / 6');await expect(page.locator('#lesson-topic-next')).toBeEnabled();
 await page.locator('#dc-run').click();await expect(page.locator('#dc-run')).toBeEnabled();await expect(page.locator('.dc-data-blocked')).toBeVisible();
 await page.locator('#lesson-topic-next').click();await expect(page.locator('#lesson-topic-next')).toBeDisabled();await expect(page.locator('#dc-result')).toContainText('ยังไม่ได้ทดลอง');
 await page.locator('#lesson-topic').evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-100));await page.screenshot({path:out+`final-topic-${width}-${theme}.png`});
 await page.locator('#reset').click();await expect(page.locator('#lesson-topic-title')).toContainText('1 / 6');await expect(page.locator('#lesson-topic-back')).toBeDisabled();await expect(page.locator('#lesson-topic-next')).toBeEnabled();await absent();
 await expect(page.locator('.dc-notes')).toContainText('Test and deployment');
});
