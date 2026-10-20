import {test,expect} from '@playwright/test';
test('correct answer is not a manual mark; server criteria explain missing work',async({page})=>{
 let posts=0;
 await page.route('**/api/courses/scale-lab/progress',r=>{
  if(r.request().method()==='POST') posts++;
  return r.fulfill({json:{completed:[],total:11,csrf_token:'token',criteria:{flow:{manual:false,simulation:false,thinking:true}}}});
 });
 await page.route('**/api/courses/scale-lab/participation',r=>r.fulfill({json:{score:1,csrf_token:'token'}}));
 await page.goto('/');
 await page.locator('[data-answer="1"]').click();
 await expect(page.locator('#feedback')).toContainText('ถูกต้อง');
 await page.waitForTimeout(200);
 expect(posts).toBe(0);
 await expect(page.locator('.participation')).toContainText('ครบ 3 เงื่อนไข');
 await expect(page.locator('#completion-status')).toContainText('กดเรียนจบ');
 await expect(page.locator('#completion-status')).toContainText('ทดลองหลัก');
 await expect(page.locator('#complete-lesson')).toBeEnabled();
});


test('manual first updates qualification after simulation and wrong quiz without reload',async({page})=>{
 const criteria={manual:false,simulation:false,thinking:false};
 await page.route('**/api/courses/scale-lab/progress',r=>{
  if(r.request().method()==='POST') criteria.manual=true;
  return r.fulfill({json:{completed:Object.values(criteria).every(Boolean)?['flow']:[],total:11,csrf_token:'token',criteria:{flow:criteria}}});
 });
 await page.route('**/api/courses/scale-lab/participation',r=>{
  if(r.request().method()==='POST') criteria[r.request().postDataJSON().simulation_id==='check-your-thinking'?'thinking':'simulation']=true;
  return r.fulfill({json:{score:0,csrf_token:'token'}});
 });
 await page.goto('/');
 await page.locator('#complete-lesson').click();
 await expect(page.locator('#progress')).toContainText('0 / 11');
 await page.locator('[data-action="step"]').click();
 await page.locator('[data-answer="0"]').click();
 await expect(page.locator('#progress')).toContainText('1 / 11');
});
