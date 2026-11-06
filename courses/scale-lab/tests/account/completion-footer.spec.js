import {test,expect} from '@playwright/test';

test('server requirements gate completion; participation pending/error and refresh fail closed',async({page})=>{
 const criteria={manual:false,simulation:false,thinking:false};let progressPosts=0,failLoad=false,failSave=false,failParticipation=false,release;
 await page.route('**/api/courses/scale-lab/progress',async r=>{
  if(r.request().method()==='POST'){
   progressPosts++;if(failSave)return r.fulfill({status:503});
   await new Promise(resolve=>release=resolve);criteria.manual=true;
  }
  if(failLoad)return r.fulfill({status:503});
  return r.fulfill({json:{completed:Object.values(criteria).every(Boolean)?['flow']:[],total:12,csrf_token:'token',criteria:{flow:criteria}}});
 });
 await page.route('**/api/courses/scale-lab/participation',r=>{
  if(r.request().method()==='POST'){
   if(failParticipation)return r.fulfill({status:503});
   criteria[r.request().postDataJSON().simulation_id==='check-your-thinking'?'thinking':'simulation']=true;
  }
  return r.fulfill({json:{score:0,csrf_token:'token'}});
 });
 await page.goto('/');await expect(page.locator('#step')).toBeEnabled();
 await expect(page.locator('#complete-lesson')).toBeDisabled();
 await page.locator('[data-answer="0"]').click();await expect(page.locator('#step')).toBeEnabled();
 await expect(page.locator('#complete-lesson')).toBeDisabled();
 failLoad=true;await page.locator('#step').click();await expect(page.locator('#retry-completion-load')).toBeVisible();
 await expect(page.locator('#complete-lesson')).toBeDisabled();failLoad=false;
 await page.locator('#retry-completion-load').click();await expect(page.locator('#complete-lesson')).toBeEnabled();
 failParticipation=true;await page.locator('#step').click();await expect(page.locator('#retry-participation')).toBeVisible();
 await expect(page.locator('#complete-lesson')).toBeDisabled();await expect(page.locator('#completion-status')).toContainText('บันทึกไม่ได้');failParticipation=false;
 await page.locator('#retry-completion-load').click();await expect(page.locator('#complete-lesson')).toBeEnabled();
 expect(progressPosts).toBe(0);
 failSave=true;await page.locator('#complete-lesson').click();await expect(page.locator('#complete-lesson')).toHaveText('ลองบันทึกอีกครั้ง');
 failSave=false;await page.locator('#complete-lesson').click();await expect.poll(()=>Boolean(release)).toBe(true);
 await expect(page.locator('#complete-lesson')).toBeDisabled();expect(progressPosts).toBe(2);
 release();await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 await page.reload();await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
});

test('missing server criteria cannot enable completion and old confirmed completion stays completed',async({page})=>{
 await page.route('**/api/courses/scale-lab/progress',r=>r.fulfill({json:{completed:['flow'],total:12,csrf_token:'token'}}));
 await page.route('**/api/courses/scale-lab/participation',r=>r.fulfill({json:{score:0,csrf_token:'token'}}));
 await page.goto('/');await expect(page.locator('#complete-lesson')).toHaveText('✓ เรียนจบแล้ว');
 await page.locator('[data-lesson="2"]').click();await expect(page.locator('#complete-lesson')).toBeDisabled();
});
