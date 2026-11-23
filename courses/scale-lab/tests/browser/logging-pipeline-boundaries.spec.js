import {test,expect} from '@playwright/test';
// Compiled account-mode client with intercepted APIs; not backend persistence QA.
async function setup(page,handler){
 const posts=[],progress=[];
 await page.route('**/api/qa/progress',async r=>{if(r.request().method()==='POST')progress.push(r.request().postDataJSON());await r.fulfill({json:{completed:[],total:12,criteria:{},csrf_token:'qa'}});});
 await page.route('**/api/qa/participation',async r=>{if(r.request().method()==='POST'){posts.push(r.request().postDataJSON());if(await handler?.(r,posts))return;}await r.fulfill({json:{score:posts.length?1:0,csrf_token:'qa'}});});
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.locator('[data-lesson="11"]').click();await expect(page.locator('#logging-run')).toBeEnabled();return {posts,progress};
}
for(const candidate of ['broken','fixed'])for(let boundary=0;boundary<(candidate==='fixed'?3:2);boundary++){
 test(`${candidate} save ${boundary}: exact retry, only pipeline, unscored setup/replay`,async({page})=>{
 let failed=false;const {posts,progress}=await setup(page,async(r,p)=>{if(!failed&&p.length===boundary+1){failed=true;await r.abort();return true;}});
 await page.locator('#logging-candidate').selectOption(candidate);expect(posts).toEqual([]);await page.locator('#logging-run').click();await expect(page.locator('#retry-participation')).toBeVisible();expect(posts).toHaveLength(boundary+1);
 await page.locator('#retry-participation').click();await expect(page.locator('#logging-run')).toBeEnabled();expect(posts[boundary+1]).toEqual(posts[boundary]);await page.locator('#logging-run').click();await expect(page.locator('#logging-replay')).toBeEnabled();
 expect(posts).toHaveLength((candidate==='fixed'?3:2)+1);expect(posts.every(p=>p.action==='run-pipeline'&&p.lesson_id==='logging-operations'&&p.simulation_id==='logging-operations')).toBe(true);
 const count=posts.length;await page.locator('#logging-replay').click();await expect(page.locator('#logging-run')).toBeEnabled();expect(posts).toHaveLength(count);expect(progress).toEqual([]);
 });
 test(`${candidate} held save ${boundary}: reset cancels all continuation`,async({page})=>{
 let release;const gate=new Promise(r=>release=r);const {posts,progress}=await setup(page,async(r,p)=>{if(p.length===boundary+1)await gate;return false;});
 await page.locator('#logging-candidate').selectOption(candidate);await page.locator('#logging-run').click();await expect.poll(()=>posts.length).toBe(boundary+1);await page.locator('#reset').click();release();await expect(page.locator('#logging-run')).toBeEnabled();await page.waitForTimeout(200);expect(posts).toHaveLength(boundary+1);expect(posts.every(p=>p.action==='run-pipeline')).toBe(true);expect(progress).toEqual([]);await expect(page.locator('#logging-result')).toHaveText('ยังไม่ได้ทดลอง');await expect(page.locator('#logging-replay')).toBeDisabled();
 });
}
