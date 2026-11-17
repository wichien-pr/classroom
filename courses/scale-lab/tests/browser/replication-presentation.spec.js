import {test,expect} from '@playwright/test';
test('one experiment runs all six complete model scenarios',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.locator('[data-lesson="5"]').click();
 const results=['STALE','ข้อมูลตรง','Replica 2','fallback','STALE','เขียนต่อได้ · Replica ตามทันแล้ว'];
 for(let i=0;i<6;i++){
  await expect(page.locator('.replication-experiments button')).toHaveCount(1);
  await expect(page.locator('#replication-replay')).toBeDisabled();
  await page.locator('#replication-run').click();await expect(page.locator('#replication-run')).toBeEnabled();
  await expect(page.locator('#replication-result')).toContainText(results[i]);
  if(i===5)await expect(page.locator('#replication-stage')).toBeEmpty();
  else await expect(page.locator('#replication-stage')).toContainText('ครบ');
  if(i<5)await page.locator('#lesson-topic-next').click();
 }
 await expect(page.locator('[data-db="0"]')).toContainText('หยุดรับงานเขียนแล้ว');
 await page.locator('[data-answer="0"]').click();await expect(page.locator('#complete-lesson')).toBeEnabled();
 await page.locator('#reset').click();await expect(page.locator('#replication-result')).toContainText('ยังไม่ได้ทดลอง');
});
test('sequential animation pauses execution and full replay uses captured stages',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson="5"]').click();await page.locator('#lesson-topic-next').click();
 await page.locator('#replication-run').click();await expect(page.locator('#replication-run')).toBeDisabled();
 await expect(page.locator('#replication-stage')).toContainText('1 / 3');
 await page.locator('#replication-pause').click();await page.waitForTimeout(2700);
 await expect(page.locator('#replication-stage')).toContainText('1 / 3');await expect(page.locator('[data-db="1"]')).toContainText('v1 · สาย 0');
 await page.locator('#replication-pause').click();await expect(page.locator('#replication-run')).toBeEnabled({timeout:20000});
 await page.locator('#replication-replay').click();await expect(page.locator('#replication-stage')).toContainText('1 / 3');await expect(page.locator('[data-db="1"]')).toContainText('v1 · สาย 0');
 await page.locator('#lesson-topic-next').click();await page.waitForTimeout(2800);await expect(page.locator('#replication-result')).toContainText('ยังไม่ได้ทดลอง');
});
