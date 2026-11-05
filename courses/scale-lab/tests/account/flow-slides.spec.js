import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

for(const theme of ['dark','light'])for(const width of [1280,390,320])test(`compiled slides: ${theme} ${width}, navigation is unscored`,async({page})=>{
 const events=[],writes=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/courses/scale-lab/progress',r=>{
  if(r.request().method()==='POST')writes.push(r.request().postDataJSON());
  return r.fulfill({json:{completed:[],total:12,csrf_token:'test'}});
 });
 await page.route('**/api/courses/scale-lab/participation',r=>{
  if(r.request().method()==='POST')events.push(r.request().postDataJSON());
  return r.fulfill({json:{score:events.length?1:0,csrf_token:'test'}});
 });
 await page.setViewportSize({width,height:1000});await page.goto('/');
 await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
 await expect(page.locator('#participation-score')).toHaveText('0');
 for(let i=0;i<3;i++)await page.locator('#flow-slide-next').click();
 for(let i=0;i<3;i++)await page.locator('#flow-slide-back').click();
 expect(events).toEqual([]);expect(writes).toEqual([]);
 await expect(page.locator('#progress')).toContainText('0 / 12');
 await page.locator('#flow-slide-next').focus();await page.keyboard.press('Enter');
 await expect(page.locator('#flow-slide-title')).toBeFocused();
 await page.locator('#step').click();await expect(page.locator('#participation-score')).toHaveText('1');
 expect(events).toHaveLength(1);expect(events[0]).toMatchObject({lesson_id:'flow',simulation_id:'flow',action:'step'});
 await page.locator('#flow-slide-next').click();
 await expect(page.locator('#architecture svg')).toHaveAttribute('data-stage','dns-query');
 expect(events).toHaveLength(1);expect(writes).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 for(const id of ['flow-slide-back','flow-slide-next']){
  expect((await page.locator('#'+id).boundingBox()).height).toBeGreaterThanOrEqual(44);
  await expect(page.locator('#'+id)).toHaveCSS('display','block');
 }
 await expect(page.locator('#flow-slide-title')).toHaveCSS('color',theme==='dark'?'rgb(231, 237, 247)':'rgb(37, 52, 49)');
 const dir=process.env.FLOW_SLIDES_EVIDENCE||'../../evidence/flow-topics';await mkdir(dir,{recursive:true});
 // Start a full hands-on sequence, not just an instruction carousel.
 await page.locator('#reset').click();
 for(let topic=0;topic<4;topic++){
  await expect(page.locator('#flow-topic')).toHaveAttribute('data-topic',String(topic));
  if(topic===3)await page.locator('#flow-client').selectOption('mobile');
  for(let click=0;click<(topic===3?6:2);click++){
   await page.locator('#step').click();
   await expect(page.locator('#step')).toBeEnabled();
  }
  await expect(page.locator('#state-view > div').first()).toContainText(`${topic===3?6:(topic+1)*2} / 6`);
  await expect(page.locator('#flow-topic #outcome')).toBeVisible();
  await expect(page.locator('#state-view > div').first().locator('strong')).toHaveCSS('color',theme==='dark'?'rgb(231, 237, 247)':'rgb(37, 52, 49)');
  await expect(page.locator('#flow-topic .flow-topic-map:visible')).toHaveCount(1);
  if(topic>=2)await expect(page.locator('#flow-payload')).toContainText(topic===3?'"id": 12':'<h1>John Smith</h1>');
  await page.locator('#flow-topic').evaluate(el=>el.scrollIntoView({block:'start'}));
  const bounds=await page.locator('#flow-topic').boundingBox();
  const instruction=await page.locator('#flow-slide-title').boundingBox();
  const action=await page.locator('#step').boundingBox();
  const feedback=await page.locator('#outcome').boundingBox();
  // The full working diagram is now primary, above the action. Preserve the
  // previous non-diagram budget; do not shrink text to fit a single viewport.
  const diagram=page.locator('#flow-topic #architecture');await expect(diagram).toBeVisible();
  const picture=await diagram.boundingBox();
  expect(bounds.height-picture.height-12).toBeLessThan(width===320?1200:width===390?1100:850);
  expect(picture.y+picture.height).toBeLessThanOrEqual(action.y);
  expect(await diagram.evaluate(e=>!e.closest('details'))).toBe(true);
  expect(instruction.y).toBeGreaterThanOrEqual(60);
  expect(instruction.y+instruction.height).toBeLessThan(1000);
  expect(feedback.y-action.y-action.height).toBeLessThan(100);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`${dir}/${theme}-${width}-topic-${topic+1}.png`});
  if(topic<3)await page.locator('#flow-slide-next').click();
 }
 await expect(page.locator('#progress')).toContainText('0 / 12');
 expect(writes).toEqual([]);
 expect(errors).toEqual([]);
});
