import {test,expect} from '@playwright/test';
for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`LAB01 icon actions ${theme} ${width}`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width,height:800});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 const step=page.getByRole('button',{name:'ทดลอง',exact:true}),replay=page.getByRole('button',{name:'เล่นภาพซ้ำ',exact:true}),pause=page.getByRole('button',{name:'พักภาพ',exact:true});
 for(const button of [step,replay,pause]){
  await expect(button.locator('svg[aria-hidden="true"]')).toHaveCount(1);
  expect(await button.evaluate(e=>e.childNodes.length>0 && [...e.childNodes].every(n=>n.nodeType!==3||!n.textContent.trim()))).toBe(true);
  const box=await button.boundingBox();expect(box.width).toBeGreaterThanOrEqual(48);expect(box.height).toBeGreaterThanOrEqual(48);
 }
 await expect(replay).toBeDisabled();await expect(pause).toBeDisabled();
 await step.focus();await expect(step).toHaveAttribute('title','ทดลอง');await page.keyboard.press('Enter');await expect(step).toBeFocused();
 await pause.focus();await page.keyboard.press('Space');await expect(page.locator('#flow-pause')).toHaveAccessibleName('เล่นภาพต่อ');await expect(page.locator('#flow-pause')).toBeFocused();await expect(page.locator('#flow-pause svg')).toHaveAttribute('data-icon','play');
 await page.keyboard.press('Space');await expect(pause).toBeFocused();await expect(pause.locator('svg')).toHaveAttribute('data-icon','pause');
 await replay.click();await expect(page.locator('#flow-scene')).toHaveAttribute('data-playback','running');
 await page.emulateMedia({reducedMotion:'reduce'});await expect(pause).toBeDisabled();await expect(page.locator('#flow-scene')).toHaveAttribute('data-playback','finished');
 await page.locator('#flow-slide-next').click();await expect(page.locator('#flow-result')).toHaveText('ยังไม่ได้ทดลอง');await expect(replay).toBeDisabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
