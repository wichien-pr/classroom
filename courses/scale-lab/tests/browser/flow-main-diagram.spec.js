import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

for(const theme of ['dark','light'])for(const width of [1280,390,320])test(`full live diagram precedes request action ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.goto('/');
 await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 const diagram=page.locator('#flow-topic #architecture');
 await expect(diagram).toBeVisible();
 expect(await diagram.evaluate(e=>!e.closest('details')&&!!(e.compareDocumentPosition(document.querySelector('#step'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 await expect(page.locator('#architecture')).toHaveCount(1);
 await expect(page.locator('.flow-full-view')).not.toHaveAttribute('open','');
 const original=await diagram.elementHandle();
 for(const stage of ['dns-query','dns-return','http-request','process','http-response','display']){
  await page.locator('#step').click();
  await expect(diagram.locator('svg')).toHaveAttribute('data-stage',stage);
  if(stage!=='display')await expect(diagram.locator(stage==='process'?'[data-host="single"]':`[data-edge="${stage}"]`)).toHaveClass(/active/);
 }
 await page.locator('#flow-slide-next').click();await page.locator('#flow-slide-back').click();
 expect(await original.evaluate(e=>e===document.querySelector('#architecture'))).toBe(true);
 await expect(diagram.locator('svg')).toHaveAttribute('data-stage','display');
 await page.locator('#flow-client').selectOption('mobile');await page.locator('#step').click();
 await expect(diagram.locator('[data-node="mobile"]')).toContainText('Mobile app');
 await expect(diagram.locator('svg')).toHaveAttribute('data-stage','dns-query');
 const d=await diagram.boundingBox(),a=await page.locator('#step').boundingBox();
 expect(d.y+d.height).toBeLessThanOrEqual(a.y);expect(a.y-d.y-d.height).toBeLessThan(210);
 expect(await diagram.locator('svg text').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize)*e.getScreenCTM().a)).toBeGreaterThanOrEqual(12);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const dir='../../evidence/flow-main-diagram';await mkdir(dir,{recursive:true});
 await diagram.evaluate(e=>e.scrollIntoView({block:'start'}));
 await page.screenshot({path:`${dir}/${theme}-${width}-diagram.png`});
 await page.locator('#step').scrollIntoViewIfNeeded();await page.screenshot({path:`${dir}/${theme}-${width}-action.png`});
});
