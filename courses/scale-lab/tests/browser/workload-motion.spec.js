import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
test('model result drives the illustration; playback never runs another experiment',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson-kind="workload"]').click();
 await expect(page.locator('.workload-playback #estimate')).toBeVisible();
 await expect(page.locator('#workload-replay')).toBeDisabled();
 await page.locator('#estimate').focus();await page.keyboard.press('Enter');await expect(page.locator('#estimate')).toBeFocused();
 await expect(page.locator('.workload-scene')).toHaveAttribute('data-playback','running');
 await expect(page.locator('[data-resource="web"]')).toContainText('3');await expect(page.locator('[data-resource="data"]')).toContainText('1');
 const result=await page.locator('#workload-result').textContent();
 await page.locator('#workload-pause').click();await expect(page.locator('.workload-scene')).toHaveAttribute('data-playback','paused');
 await page.locator('#workload-replay').click();await expect(page.locator('.workload-scene')).toHaveAttribute('data-playback','running');
 expect(await page.locator('#workload-result').textContent()).toBe(result);
 await page.locator('#lesson-topic-next').click();await expect(page.locator('.workload-scene')).toHaveAttribute('data-playback','idle');
 await expect(page.locator('#workload-result')).toContainText('กดทดลอง');
 await page.locator('#estimate').click();await expect(page.locator('.workload-scene')).toHaveAttribute('data-layout','single');await expect(page.locator('[data-resource="data"]')).toContainText('3');
 await page.locator('#lesson-topic-next').click();await page.locator('#estimate').click();await expect(page.locator('.workload-scene')).toHaveAttribute('data-ready','false');await expect(page.locator('#workload-result')).toContainText('อ่านข้อมูลไม่ได้');
 await expect(page.locator('.workload-travel[data-route=query]')).toHaveCSS('animation-name','workload-blocked-flight');
 await expect(page.locator('.workload-scene')).toHaveAttribute('data-playback','finished',{timeout:7000});

 await page.locator('#reset').click();await expect(page.locator('#workload-replay')).toBeDisabled();
 await page.locator('[data-lesson-kind=flow]').click();await expect(page.locator('.workload-scene')).toHaveCount(0);
});
for(const width of [1280,390,320])for(const theme of ['light','dark'])test(`visual ${width} ${theme}`,async({page})=>{
 await page.setViewportSize({width,height:width===1280?800:568});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-lesson-kind="workload"]').click();
 await page.locator('#estimate').click();await page.locator('#workload-pause').click();
 await page.locator('.workload-scene').evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-80));
 const out='../../evidence/lab02-presets-motion';await mkdir(out,{recursive:true});await page.screenshot({path:`${out}/${theme}-${width}.png`});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const sizes=await page.locator('.workload-playback button').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));expect(sizes.every(h=>h>=48)).toBe(true);
 await page.locator('#lesson-topic-next').click();await page.locator('#lesson-topic-next').click();await page.locator('#estimate').click();await expect(page.locator('#workload-result')).toContainText('อ่านข้อมูลไม่ได้');
 await page.locator('.workload-scene').evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-80));await page.screenshot({path:`${out}/${theme}-${width}-outage.png`});
 await page.locator('#estimate').evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-180));await page.screenshot({path:`${out}/${theme}-${width}-action.png`});
});
test('reduced motion settles immediately and replay is purely visual',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.locator('[data-lesson-kind="workload"]').click();await page.locator('#estimate').click();await expect(page.locator('.workload-scene')).toHaveAttribute('data-playback','finished');
 await page.locator('#workload-replay').focus();await page.keyboard.press('Enter');await expect(page.locator('.workload-scene')).toHaveAttribute('data-playback','finished');await expect(page.locator('#workload-pause')).toBeDisabled();
});
