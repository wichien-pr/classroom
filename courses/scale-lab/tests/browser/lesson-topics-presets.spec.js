import {test,expect} from '@playwright/test';
test('automatic scenarios replace controls and navigation clears stale results without actions',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson-kind=workload]').click();
 await expect(page.locator('#lesson-topic input,#lesson-topic select,#lesson-topic-settings')).toHaveCount(0);
 for(let i=0;i<4;i++){
  await expect(page.locator('#workload-scenario')).toBeVisible();
  await expect(page.locator('#workload-replay')).toBeDisabled();
  await expect(page.locator('#workload-result')).toContainText('กดทดลอง');
  const result=await page.locator('#workload-result').textContent();
  await page.locator('#estimate').click();
  await expect(page.locator('.workload-scene')).toHaveAttribute('data-ready',String(i!==2));
  await expect(page.locator('[data-resource=data]')).toContainText(i===1?'3':'1');
  expect(await page.locator('#workload-result').textContent()).not.toBe(result);
  if(i<3)await page.locator('#lesson-topic-next').click();
 }
 await page.locator('#estimate').click();await expect(page.locator('#workload-scenario')).toContainText('กรณี 2/3');await expect(page.locator('#workload-result')).toContainText('ทบทวนตัวเลือก');
 await page.locator('#estimate').click();await expect(page.locator('#workload-scenario')).toContainText('กรณี 3/3');await expect(page.locator('#workload-result')).toContainText('เหมาะเป็นจุดเริ่มต้น');
 const result=await page.locator('#workload-result').textContent();await page.locator('#workload-replay').click();expect(await page.locator('#workload-result').textContent()).toBe(result);await page.locator('#lesson-topic-back').click();await expect(page.locator('#workload-result')).toContainText('กดทดลอง');
 await expect(page.locator('#workload-replay')).toBeDisabled();await expect(page.locator('.workload-scene')).toHaveAttribute('data-playback','idle');
 await page.locator('#reset').click();await expect(page.locator('#workload-scenario')).toContainText('Web 3');await expect(page.locator('#workload-replay')).toBeDisabled();
});
