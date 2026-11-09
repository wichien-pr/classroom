import {test,expect} from '@playwright/test';
test('one experiment runs all eight complete model scenarios',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.locator('[data-lesson="5"]').click();
 const results=['STALE','ข้อมูลตรง','Replica 2','fallback','STALE','ยัง promote ไม่ได้','ยัง promote ไม่ได้','ข้อมูลตรง'];
 for(let i=0;i<8;i++){
  await expect(page.locator('.replication-experiments button')).toHaveCount(1);
  await expect(page.locator('#replication-replay')).toBeDisabled();
  await page.locator('#replication-run').click();await expect(page.locator('#replication-run')).toBeEnabled();
  await expect(page.locator('#replication-result')).toContainText(results[i]);
  await expect(page.locator('#replication-stage')).toContainText('ครบ');
  if(i<7)await page.locator('#lesson-topic-next').click();
 }
 await expect(page.locator('[data-db="0"]')).toContainText('fenced');
 await page.locator('[data-answer="0"]').click();await expect(page.locator('#complete-lesson')).toBeEnabled();
 await page.locator('#reset').click();await expect(page.locator('#replication-result')).toContainText('ยังไม่ได้ทดลอง');
});
test('sequential animation pauses execution and full replay uses captured stages',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson="5"]').click();await page.locator('#lesson-topic-next').click();
 await page.locator('#replication-run').click();await expect(page.locator('#replication-run')).toBeDisabled();
 await expect(page.locator('#replication-stage')).toContainText('1 / 3');
 await page.locator('#replication-pause').click();await page.waitForTimeout(2700);
 await expect(page.locator('#replication-stage')).toContainText('1 / 3');await expect(page.locator('[data-db="1"]')).toContainText('version 1');
 await page.locator('#replication-pause').click();await expect(page.locator('#replication-run')).toBeEnabled({timeout:12000});
 await page.locator('#replication-replay').click();await expect(page.locator('#replication-stage')).toContainText('1 / 3');await expect(page.locator('[data-db="1"]')).toContainText('version 1');
 await page.locator('#lesson-topic-next').click();await page.waitForTimeout(2800);await expect(page.locator('#replication-result')).toContainText('ยังไม่ได้ทดลอง');
});
