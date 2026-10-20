import {test,expect} from '@playwright/test';
// Quiz now depends on both services. Keep this suite focused on progress failures.
test.beforeEach(async({page})=>{
 let score=0;
 await page.route('**/api/courses/scale-lab/participation',r=>{
  if(r.request().method()==='POST') score++;
  return r.fulfill({json:{score,csrf_token:'token'}});
 });
});
test('account load ignores legacy local state; manual saves stable ID without navigation race',async({page})=>{
  const completed=[];
  await page.addInitScript(()=>localStorage.setItem('scale-lab-progress','[1,2,3]'));
  await page.route('**/api/courses/scale-lab/progress',async route=>{
    if(route.request().method()==='POST') {
      expect(route.request().postDataJSON()).toEqual({lesson_id:'flow',manual:true});
      expect(route.request().headers()['x-csrf-token']).toBe('token');
      await new Promise(r=>setTimeout(r,150)); completed.push('flow');
    }
    await route.fulfill({json:{completed,total:12,csrf_token:'token'}});
  });
  await page.goto('/');
  await expect(page.locator('#progress-status')).toContainText('บัญชี');
  await expect(page.locator('#progress')).toContainText('0 / 12');
  await page.locator('#complete-lesson').click();
  await page.locator('[data-lesson="2"]').click();
  await expect(page.locator('#progress')).toContainText('1 / 12');
  await expect(page.locator('[data-lesson="1"] .done')).toHaveText('✓');
  await expect(page.locator('[data-lesson="2"] .done')).toHaveText('');
  await page.reload();
  await expect(page.locator('#progress')).toContainText('1 / 12');
  expect(await page.evaluate(()=>localStorage.getItem('scale-lab-progress'))).toBe('[1,2,3]');
});

test('load/save failures are visible, block premature completion and support retry',async({page})=>{
  let failLoad=true,failSave=true;
  await page.route('**/api/courses/scale-lab/progress',async route=>{
    const post=route.request().method()==='POST';
    if((post&&failSave)||(!post&&failLoad)) return route.fulfill({status:503,json:{error:'unavailable'}});
    await route.fulfill({json:{completed:post?['flow']:[],total:12,csrf_token:'token'}});
  });
  await page.goto('/');
  await expect(page.locator('#progress-status')).toContainText('โหลดความคืบหน้าไม่ได้');
  await expect(page.locator('[data-answer="1"]')).toBeDisabled();
  failLoad=false;
  await page.locator('#retry-progress').click();
  await expect(page.locator('[data-answer="1"]')).toBeEnabled();
  await page.locator('#complete-lesson').click();
  await expect(page.locator('#progress-status')).toContainText('บันทึกไม่ได้');
  await expect(page.locator('#progress')).toContainText('0 / 12');
  failSave=false;
  await page.locator('#complete-lesson').click();
  await expect(page.locator('#progress')).toContainText('1 / 12');
  await expect(page.locator('#progress-status')).toContainText('บัญชีแล้ว');
  await expect(page.locator('#participation-score')).toHaveText('0'); // Manual marking does not award participation.
});
