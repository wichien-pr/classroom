import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const evidence=resolve(process.env.QA_EVIDENCE||'test-results/lab05-current');
mkdirSync(evidence,{recursive:true});
async function belowDiagram(scene){
 await expect(scene.locator('.replication-scene-caption,.replication-scene-caveat')).toHaveCount(0);
 await expect(scene.locator('#replication-result')).toHaveCount(1);
 await expect(scene.locator('.workload-feedback #replication-result[role="status"]')).toBeVisible();
 await expect(scene.locator('figcaption')).toContainText('ไม่สลับอัตโนมัติ');
 expect(await scene.evaluate(el=>{const box=s=>el.querySelector(s).getBoundingClientRect();return box('#replication-result').top>=box('.replication-map').bottom&&box('figcaption').top>=box('.workload-actions').bottom;})).toBe(true);
}
for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`${theme} ${width} three-beat recovery`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:900});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-lesson="5"]').click();
 for(let i=0;i<5;i++){await expect(page.locator('.replication-consequence')).toHaveCount(0);await page.locator('#lesson-topic-next').click();}
 const scene=page.locator('.replication-scene');await belowDiagram(scene);
 await page.emulateMedia({reducedMotion:'reduce'});
 for(let i=0;i<5;i++)await page.locator('#lesson-topic-back').click();
 for(let i=0;i<5;i++){
  await page.locator('#replication-run').click();await expect(page.locator('#replication-run')).toBeEnabled();
  await expect(scene.locator('.replication-consequence,.replication-guards')).toHaveCount(0);
  await expect(page.locator('#replication-result')).toContainText(['STALE','ข้อมูลตรง','STALE','fallback','STALE'][i]);
  await page.locator('#replication-replay').click();await expect(page.locator('#replication-run')).toBeEnabled();await page.locator('#lesson-topic-next').click();
 }
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.locator('#replication-run').focus();await page.keyboard.press('Enter');
 for(let i=0;i<10;i++){
  await expect(scene).toHaveAttribute('data-model-stage',String(i),{timeout:14000});await expect(scene).toHaveAttribute('data-learner-beat',String(i===0?0:i<5?1:2));
  await expect(scene.locator('.replication-consequence,.replication-guards')).toHaveCount(0);await expect(page.locator('#replication-stage')).toBeEmpty();
  await belowDiagram(scene);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(i===3||i===8){await page.locator('#replication-pause').click();await expect(scene).toHaveAttribute('data-playback','paused');
   if(i===8){const token=scene.locator('[data-route="0"]');const sample=()=>token.evaluate(async el=>{const a=el.getAnimations()[0];await a.ready;return {time:a.currentTime,duration:a.effect.getTiming().duration};});const before=await sample();await page.waitForTimeout(120);expect(await sample()).toEqual(before);expect(before.duration).toBe(2000);await expect(scene.locator('[data-copy="2"]')).toHaveText('ข้อมูลยังไม่ตรง');}
   await scene.screenshot({path:`${evidence}/${theme}-${width}-stage${i}.png`});await page.locator('#replication-pause').click();
  }
 }
 await expect(page.locator('#replication-run')).toBeEnabled({timeout:12000});await expect(scene.locator('[data-copy="2"]')).toHaveText('รับข้อมูลจาก Primary ใหม่แล้ว');await expect(scene.locator('[data-db="1"] strong')).toHaveText('Primary ใหม่');await expect(page.locator('#replication-result')).toHaveText('เขียนต่อได้ · Replica ตามทันแล้ว');await expect(scene.locator('figcaption')).toContainText('สูญเสีย 1 งานเขียนแล้ว');
 expect(await scene.locator('[data-copy]').evaluateAll(els=>els.every(el=>parseFloat(getComputedStyle(el).fontSize)>=14))).toBe(true);
 await scene.screenshot({path:`${evidence}/${theme}-${width}-final.png`});
 await page.locator('#replication-replay').click();await expect(scene).toHaveAttribute('data-model-stage','0');await page.locator('#lesson-topic-back').click();await page.waitForTimeout(300);await expect(scene).toHaveAttribute('data-recovery','false');
 await page.locator('#lesson-topic-next').click();await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#replication-run').click();await expect(page.locator('#replication-run')).toBeEnabled();await expect(scene).toHaveAttribute('data-model-stage','9');await page.locator('#replication-replay').click();await expect(page.locator('#replication-run')).toBeEnabled();await expect(scene).toHaveAttribute('data-model-stage','9');expect(errors).toEqual([]);
});
