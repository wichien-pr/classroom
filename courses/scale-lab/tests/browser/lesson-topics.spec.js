import {test,expect} from '@playwright/test';
const inventory=[['workload',4],['stock',4],['balance',4],['replica',5],['cache',5],['cdn',6],['stateless-web',6],['data-centers',7],['message-queue',6],['database-scaling',6]];
for(const [kind,count] of inventory)test(`${kind}: every original experiment topic is freely navigable and controls retain identity`,async({page})=>{
 await page.goto('/');await page.locator(`[data-lesson-kind="${kind}"]`).click();
 await expect(page.locator('#lesson-topic-title')).toContainText(`1 / ${count}`);
 const resultSelector=kind==='workload'?'#workload-result':'#event-log';
 const before=await page.locator(resultSelector).textContent();
 await page.evaluate(()=>window.topicNodes=[...document.querySelectorAll('.controls input,.controls select,.controls button')] );
 for(let i=0;i<count;i++){
  await expect(page.locator('#lesson-topic')).toHaveAttribute('data-topic',String(i));
  await expect(page.locator('#lesson-topic .experiment li:visible')).toHaveCount(1);
  await expect(page.locator('#architecture')).toBeVisible();
  expect(await page.locator('#lesson-topic [data-action]:visible').count()).toBeGreaterThan(0);
  if(kind==='workload')await expect(page.locator('#architecture #estimate')).toBeVisible();
  else expect(await page.evaluate(()=>!!(document.querySelector('#architecture').compareDocumentPosition(document.querySelector('.control-area'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  if(i<count-1)await page.locator('#lesson-topic-next').click();
 }
 await expect(page.locator('#lesson-topic-next')).toBeDisabled();
 for(let i=1;i<count;i++)await page.locator('#lesson-topic-back').click();
 await expect(page.locator('#lesson-topic-back')).toBeDisabled();
 await expect(page.locator(resultSelector)).toHaveText(before);
 await expect(page.locator('#progress')).toContainText('0 /');
 expect(await page.evaluate(()=>window.topicNodes.every(el=>el===document.getElementById(el.id)))).toBe(true);
 if(kind==='workload'){await expect(page.locator('#lesson-topic-settings')).toHaveCount(0);return;}
 await page.locator('#lesson-topic-settings').click();
 expect(await page.evaluate(()=>window.topicNodes.every(el=>el.getClientRects().length>0))).toBe(true);
});

test('moved state cards keep the dark course surface after a real action',async({page})=>{
 await page.goto('/');await page.evaluate(()=>document.documentElement.dataset.theme='dark');await page.locator('[data-lesson-kind="cache"]').click();await page.locator('#read-cache').click();
 expect(await page.locator('#state-view').evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(24, 39, 55)');
});

test('database scaling has an actual initial architecture before evaluation',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson-kind="database-scaling"]').click();
 await expect(page.locator('#architecture')).toContainText('Web servers');
 await expect(page.locator('#architecture')).toContainText('Router');
 await expect(page.locator('#architecture')).toContainText('Database');
 await expect(page.locator('#architecture')).toContainText('ยังไม่ได้ประเมิน');
 await expect(page.locator('#event-log')).toContainText('ยังไม่มีเหตุการณ์');
});

test('logging pages retain cumulative evidence and Back replays the fixed Version',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson-kind="logging-operations"]').click();await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('#logging-run').click();await expect(page.locator('[data-stage=test]')).toHaveAttribute('data-status','failed');
 await page.locator('#lesson-topic-next').click();await expect(page.locator('.logging-scene')).toHaveAttribute('data-playback','finished');
 await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','deployed');
 await page.locator('#lesson-topic-next').click();await expect(page.locator('.logging-scene')).toHaveAttribute('data-playback','finished');
 await expect(page.locator('.logging-event')).toHaveCount(2);await expect(page.locator('.logging-metric-panel')).toHaveCount(3);
 await page.locator('#lesson-topic-back').click();await expect(page.locator('.logging-scene')).toHaveAttribute('data-playback','finished');
 await expect(page.locator('.logging-scene')).toHaveAttribute('data-stage','deployed');await expect(page.locator('.logging-metric')).toHaveCount(0);
});

test('LAB02 prepares a new scenario while retaining the primary action identity',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson-kind="workload"]').click();
 await expect(page.locator('#lesson-topic')).toBeVisible();
 await expect(page.locator('#lesson-topic-title')).toContainText('1 / 4');
 await expect(page.locator('#db-engine')).toBeHidden();
 await page.locator('#estimate').click();
 const result='กดทดลองเพื่อดูเส้นทางคำขอของสถานการณ์นี้';
 await page.evaluate(()=>window.retainedControl=document.querySelector('#estimate'));
 for(let i=0;i<3;i++)await page.locator('#lesson-topic-next').click();
 await expect(page.locator('#db-engine')).toHaveCount(0);
 await expect(page.locator('#lesson-topic-next')).toBeDisabled();
 await expect(page.locator('#workload-result')).toHaveText(result);
 await expect(page.locator('#progress')).toContainText('0 /');
 await page.locator('#lesson-topic-back').click();
 await expect(page.locator('#workload-scenario')).toContainText('Web 4');
 expect(await page.evaluate(()=>window.retainedControl===document.querySelector('#estimate'))).toBe(true);
});
