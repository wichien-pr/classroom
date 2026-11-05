import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
for(const width of [1280,390,320])for(const theme of ['light','dark'])test(`LAB02 four fixed topics ${width} ${theme}`,async({page})=>{
 await page.setViewportSize({width,height:width===1280?800:568});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-lesson-kind="workload"]').click();
 const out='../../evidence/lab02-presets';await mkdir(out,{recursive:true});
 for(let i=0;i<4;i++){
  await expect(page.locator('#lesson-topic input,#lesson-topic select,#lesson-topic-settings')).toHaveCount(0);
  expect((await page.locator('.experiment li:visible').innerText()).length).toBeLessThan(115);
  await expect(page.locator('#workload-replay')).toBeDisabled();
  await page.locator('#estimate').click();
  await expect(page.locator('#state-view')).toContainText(`Data tier: ${i===1?3:1}`);
  if(i===2)await expect(page.locator('#workload-result')).toContainText('อ่านข้อมูลไม่ได้');
  if(i===3){
   await page.locator('#estimate').click();await expect(page.locator('#workload-result')).toContainText('ทบทวนตัวเลือก');
   await page.locator('#estimate').click();await expect(page.locator('#workload-result')).toContainText('เหมาะเป็นจุดเริ่มต้น');
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const sizes=await page.evaluate(()=>['.experiment li:not([hidden])','#workload-scenario','#workload-result','#lesson-topic-next','#lesson-topic-back'].map(s=>{const e=document.querySelector(s);return {size:parseFloat(getComputedStyle(e).fontSize),height:e.getBoundingClientRect().height};}));
  for(const s of sizes)expect(s.size).toBeGreaterThanOrEqual(16);
  for(const s of sizes.slice(3))expect(s.height).toBeGreaterThanOrEqual(48);
  await page.locator('#lesson-topic').evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:`${out}/${theme}-${width}-${i+1}-top.png`});
  await page.locator('#estimate').evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-100));await page.screenshot({path:`${out}/${theme}-${width}-${i+1}-action.png`});
  if(i<3)await page.locator('#lesson-topic-next').click();
 }
 await expect(page.locator('#progress')).toContainText('0 /');
});
test('LAB02 keeps a brief action and adjacent concise feedback',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson-kind=workload]').click();
 await expect(page.locator('#estimate')).toHaveText('ทดลอง');await page.locator('#estimate').click();
 await expect(page.locator('#workload-result')).toContainText('เหมาะเป็นจุดเริ่มต้น');
 expect((await page.locator('#workload-result').innerText()).length).toBeLessThan(200);
 await expect(page.locator('#outcome,#workload-help')).toHaveCount(0);
});
