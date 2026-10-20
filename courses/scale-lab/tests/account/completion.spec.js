import {test,expect} from '@playwright/test';
test('manual save pending, failure and retry stay with captured lesson',async({page})=>{
 let fail=true, release; const completed=[],posts=[];
 await page.route('**/api/courses/scale-lab/progress',async route=>{
  if(route.request().method()==='POST'){
   posts.push(route.request().postDataJSON().lesson_id);
   await new Promise(r=>release=r);
   if(fail)return route.fulfill({status:503,json:{error:'unavailable'}});
   completed.push(posts.at(-1));
  }
  await route.fulfill({json:{completed,total:12,csrf_token:'token'}});
 });
 await page.goto('/');
 const button=page.locator('#complete-lesson');
 await expect(button).toBeEnabled();
 await button.evaluate(el=>{el.click();el.click();});
 await expect(button).toBeDisabled();
 await expect(page.locator('#completion-status')).toContainText('กำลังบันทึก');
 await page.locator('[data-lesson="2"]').click();
 await expect(button).toBeDisabled();
 release();
 await expect(page.locator('#progress')).toContainText('0 / 12');
 await expect(button).toHaveText('ทำเครื่องหมายว่าเรียนจบ');
 await page.locator('[data-lesson="1"]').click();
 await expect(page.locator('#completion-status')).toContainText('บันทึกไม่ได้');
 await expect(button).toHaveText('ลองบันทึกอีกครั้ง');
 fail=false; await button.click();
 await expect.poll(()=>posts.length).toBe(2); release();
 await expect(button).toHaveText('✓ เรียนจบแล้ว');
 expect(posts).toEqual(['flow','flow']);
 await page.locator('[data-lesson="2"]').click();
 await expect(button).toHaveText('ทำเครื่องหมายว่าเรียนจบ');
 await page.reload();
 await expect(button).toHaveText('✓ เรียนจบแล้ว');
 await expect(page.locator('#feedback')).not.toContainText('ถูกต้อง');
});

test('load error has retry next to completion, and blocks manual writes',async({page})=>{
 let fail=true;
 await page.route('**/api/courses/scale-lab/progress',route=>route.fulfill(fail?{status:503,json:{}}:{json:{completed:[],total:12,csrf_token:'token'}}));
 await page.goto('/');
 await expect(page.locator('#complete-lesson')).toBeDisabled();
 await expect(page.locator('#completion-status')).toContainText('โหลดความคืบหน้าไม่ได้');
 fail=false;await page.locator('#retry-completion-load').click();
 await expect(page.locator('#complete-lesson')).toBeEnabled();
});
