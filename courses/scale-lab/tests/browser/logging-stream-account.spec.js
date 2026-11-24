import {test,expect} from '@playwright/test';
// Frontend account-contract coverage only; intercepted APIs, no real account.
async function setup(page,hold=false){
 const posts=[],progress=[];let release;const gate=new Promise(r=>release=r);
 await page.route('**/api/qa/progress',async r=>{if(r.request().method()==='POST')progress.push(r.request().postDataJSON());await r.fulfill({json:{completed:[],total:12,criteria:{},csrf_token:'qa'}});});
 await page.route('**/api/qa/participation',async r=>{if(r.request().method()==='POST'){posts.push(r.request().postDataJSON());if(hold)await gate;}await r.fulfill({json:{score:posts.length?1:0,csrf_token:'qa'}});});
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.locator('[data-lesson="11"]').click();await expect(page.locator('#logging-run')).toBeEnabled();return {posts,progress,release};
}
test('stream controls and navigation never submit account awards or completion',async({page})=>{
 const {posts,progress}=await setup(page);
 await page.locator('#lesson-topic-next').click();await page.locator('#logging-stream-toggle').click();await expect.poll(()=>page.locator('.logging-stream').getAttribute('data-second')).toBe('2');
 await page.locator('#logging-stream-toggle').click();await page.locator('#lesson-topic-back').click();await page.locator('#lesson-topic-next').click();await page.locator('#reset').click();
 expect(posts).toEqual([]);expect(progress).toEqual([]);await expect(page.locator('#logging-run')).toBeEnabled();
});
test('leaving a held pipeline save cannot advance or replace the new stream',async({page})=>{
 const {posts,progress,release}=await setup(page,true);
 await page.locator('#logging-candidate').selectOption('fixed');await page.locator('#logging-run').click();await expect.poll(()=>posts.length).toBe(1);
 await page.locator('#lesson-topic-next').click();await page.locator('#logging-stream-toggle').click();release();
 await expect.poll(()=>page.locator('.logging-stream').getAttribute('data-second')).toBe('2');
 expect(posts).toHaveLength(1);expect(posts[0].action).toBe('run-pipeline');expect(progress).toEqual([]);await expect(page.locator('#lesson-topic-title')).toContainText('2 / 2');
});
