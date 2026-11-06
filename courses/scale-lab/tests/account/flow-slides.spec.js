import {test,expect} from '@playwright/test';
// Observe server-confirmed scores; the learner-facing numeric panel is removed.
test.beforeEach(async({page})=>{
 page.on('response',async response=>{
  if(response.url().endsWith('/api/courses/scale-lab/participation') && response.ok()){
   try {page.confirmedParticipationScore=(await response.json()).score;} catch {}
  }
 });
});
for(const theme of ['dark','light'])for(const width of [1280,390,320])test(`compiled guided topics: ${theme} ${width}, pending save never animates a new topic`,async({page})=>{
 const events=[],writes=[],errors=[];let release,hold=false;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/courses/scale-lab/progress',r=>{
  if(r.request().method()==='POST')writes.push(r.request().postDataJSON());
  return r.fulfill({json:{completed:[],total:12,csrf_token:'test'}});
 });
 await page.route('**/api/courses/scale-lab/participation',async r=>{
  if(r.request().method()==='POST'){events.push(r.request().postDataJSON());if(hold)await new Promise(resolve=>release=resolve);}
  return r.fulfill({json:{score:events.length?1:0,csrf_token:'test'}});
 });
 await page.setViewportSize({width,height:width===1280?800:568});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 await expect.poll(()=>page.confirmedParticipationScore).toBe(Number('0'));
 for(let i=0;i<3;i++)await page.locator('#flow-slide-next').click();for(let i=0;i<3;i++)await page.locator('#flow-slide-back').click();
 expect(events).toEqual([]);expect(writes).toEqual([]);
 hold=true;await page.locator('#step').click();await expect.poll(()=>events.length).toBe(1);await expect(page.locator('#step')).toBeDisabled();await expect(page.locator('#step')).toHaveAccessibleName('กำลังบันทึก');await expect(page.locator('#step svg')).toHaveAttribute('data-icon','saving');
 await page.locator('#flow-slide-next').click();await expect(page.locator('#flow-slide-title')).toBeFocused();release();hold=false;
 await expect(page.locator('#step')).toBeEnabled();await expect(page.locator('#flow-slide-title')).toBeFocused();
 await expect(page.locator('#flow-result')).toHaveText('ยังไม่ได้ทดลอง');await expect(page.locator('#flow-scene')).toHaveAttribute('data-stage','ready');
 for(let topic=0;topic<4;topic++){
  await page.locator('#reset').click();for(let i=0;i<topic;i++)await page.locator('#flow-slide-next').click();
  const before=events.length;await page.locator('#step').focus();await page.keyboard.press('Enter');await expect(page.locator('#step')).toBeEnabled();
  await expect.poll(()=>events.length).toBe(before+1);await expect(page.locator('#step')).toBeFocused();
  expect(events.at(-1)).toMatchObject({lesson_id:'flow',simulation_id:'flow',action:'step'});
  await page.locator('#flow-pause').click();await page.locator('#flow-replay').click();expect(events).toHaveLength(before+1);
  await expect(page.locator('#flow-result')).toContainText(['DNS','GET','HTML','JSON'][topic]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await expect.poll(()=>page.confirmedParticipationScore).toBe(Number('1'));await expect(page.locator('#progress')).toContainText('0 / 12');expect(writes).toEqual([]);expect(errors).toEqual([]);
});
