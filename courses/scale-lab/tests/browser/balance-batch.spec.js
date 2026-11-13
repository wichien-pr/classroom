import {test,expect} from '@playwright/test';
const evidence=process.env.BATCH_EVIDENCE||new URL('../../../../evidence/lab04-batch/',import.meta.url).pathname;
for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`six-request batch ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('[data-lesson="4"]').click();
 await expect(page.locator('.balance-load [data-request]')).toHaveCount(6);
 for(const [topic,counts] of [[0,[3,3,0]],[1,[0,6,0]],[2,[0,0,0]],[3,[0,3,3]]]){
  await page.locator('#route').click();
  await expect(page.locator('#route')).toBeDisabled();
  await page.locator('#balance-pause').click();
  await page.locator('.balance-particle[data-active=true]').evaluateAll(async es=>{await Promise.all(es.flatMap(e=>e.getAnimations()).map(a=>a.ready));});
  const before=await page.locator('.balance-particle[data-active=true]').evaluateAll(es=>es.flatMap(e=>e.getAnimations()).map(a=>a.currentTime));
  await page.waitForTimeout(100);
  expect(await page.locator('.balance-particle[data-active=true]').evaluateAll(es=>es.flatMap(e=>e.getAnimations()).map(a=>a.currentTime))).toEqual(before);
  expect(await page.locator('.balance-particle[data-active=true]').evaluateAll(es=>es.flatMap(e=>e.getAnimations()).map(a=>a.effect.getTiming().duration))).toEqual(topic===2?[1200]:[1200,1200]);
  await page.locator('#balance-pause').click();await expect(page.locator('#route')).toBeEnabled({timeout:20000});
  await expect(page.locator('.balance-load')).toContainText('6 / 6');
  for(let i=0;i<3;i++)await expect(page.locator(`[data-server="${i}"] [data-count]`)).toHaveText(`รับแล้ว ${counts[i]} request`);
  if(topic===2)await expect(page.locator('#balance-result')).toContainText('503');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.setViewportSize({width,height:2000});await page.locator('.balance-scene').evaluate(e=>window.scrollTo(0,e.getBoundingClientRect().top+scrollY-110));await page.locator('.balance-scene').screenshot({path:`${evidence}/${theme}-${width}-${topic}.png`});await page.setViewportSize({width,height:1000});
  const text=await page.locator('#balance-result').innerText();await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#balance-replay').click();await expect(page.locator('#route')).toBeEnabled();await expect(page.locator('#balance-result')).toHaveText(text);await page.emulateMedia({reducedMotion:'no-preference'});
  if(topic<3)await page.locator('#lesson-topic-next').click();
 }
 await expect(page.locator('#lesson-topic-next')).toBeDisabled();await page.locator('#reset').click();await expect(page.locator('.balance-load')).toContainText('0 / 6');
});
