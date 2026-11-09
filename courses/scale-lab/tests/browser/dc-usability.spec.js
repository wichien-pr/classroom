import {test,expect} from '@playwright/test';
for(const width of [1280,390,320])for(const theme of ['light','dark'])test(`one premise and outcome without technical details ${width} ${theme}`,async({page})=>{
 await page.setViewportSize({width,height:600});await page.goto('/');await page.locator('[data-lesson="9"]').click();await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.emulateMedia({reducedMotion:'reduce'});
 for(let i=0;i<6;i++){
  await expect(page.locator('.dc-details, #dc-route')).toHaveCount(0);await expect(page.locator('#dc-result')).toContainText('ยังไม่ได้ทดลอง');
  await page.locator('#dc-run').click();await expect(page.locator('#dc-run')).toBeEnabled();
  expect(await page.locator('#lesson-topic').evaluate(e=>e.innerText.length)).toBeLessThan(500);
  const geometry=await page.locator('.dc-scene').evaluate(e=>{const b=e.querySelector('#dc-run').getBoundingClientRect(),r=e.querySelector('#dc-result').getBoundingClientRect(),map=e.querySelector('.dc-map').getBoundingClientRect();return {gap:r.top-b.bottom,mapHeight:map.height,resultSize:parseFloat(getComputedStyle(e.querySelector('#dc-result')).fontSize)};});
  expect(geometry.gap).toBeLessThan(30);expect(geometry.mapHeight).toBeLessThan(250);expect(geometry.resultSize).toBeGreaterThanOrEqual(16);
  await expect(page.locator('.dc-details, #dc-route')).toHaveCount(0);
  await expect(page.getByText('เหตุผลและรายละเอียดทางเทคนิค',{exact:true})).toHaveCount(0);
  await page.locator('#dc-replay').click();await expect(page.locator('.dc-scene')).toHaveAttribute('data-playback','finished');await expect(page.locator('#dc-pause')).toBeDisabled();
  await expect(page.locator('.dc-scene figcaption')).toBeVisible();
  if(i<5)await page.locator('#lesson-topic-next').click();
 }
});
