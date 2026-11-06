import {test,expect} from '@playwright/test';
for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`LAB01 navigation icons ${theme} ${width}`,async({page},testInfo)=>{
 const posts=[];page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
 await page.setViewportSize({width,height:800});await page.goto('/');await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 const back=page.locator('#flow-slide-back'),next=page.locator('#flow-slide-next'),reset=page.locator('#reset');
 for(const [button,label,icon] of [[back,'ย้อนกลับ','back'],[next,'ถัดไป','next'],[reset,'เริ่มการทดลองใหม่','reset']]){
  await expect(button).toHaveAccessibleName(label);await expect(button).toHaveAttribute('title',label);
  await expect(button.locator('svg[aria-hidden="true"]')).toHaveAttribute('data-icon',icon);
  expect(await button.innerText()).toBe('');
  const b=await button.boundingBox();expect(b.width).toBe(48);expect(b.height).toBe(48);
 }
 const titles=['ค้นหา IP ก่อนส่งคำขอ','ส่งคำขอเข้าเครื่องเดียว','รับคำตอบและแสดงหน้าเว็บ','เปลี่ยนเป็นแอป แล้วเทียบคำตอบ'];
 for(let i=0;i<4;i++){
  await expect(page.locator('#flow-slide-title')).toHaveText(`${i+1} / 4 · ${titles[i]}`);
  expect(await back.isDisabled()).toBe(i===0);expect(await next.isDisabled()).toBe(i===3);
  const nav=await page.locator('.flow-slide-nav').boundingBox(),title=await page.locator('#flow-slide-title').boundingBox();
  expect(Math.abs(title.x+title.width/2-nav.x-nav.width/2)).toBeLessThan(1);
  if(i<3){await next.focus();await page.keyboard.press('Enter');}
 }
 await back.focus();await page.keyboard.press('Space');await expect(page.locator('#flow-topic')).toHaveAttribute('data-topic','2');
 await page.keyboard.press('Tab');
 for(const button of [back,next,reset]){
  await button.focus();const tip=await button.evaluate(e=>{const s=getComputedStyle(e,'::after'),b=e.getBoundingClientRect();return {visible:s.visibility,left:b.left+parseFloat(s.left),width:parseFloat(s.width)+parseFloat(s.paddingLeft)+parseFloat(s.paddingRight),outline:getComputedStyle(e).outlineStyle};});
  expect(tip.visible).toBe('visible');expect(tip.outline).not.toBe('none');expect(tip.left).toBeGreaterThanOrEqual(0);expect(tip.left+tip.width).toBeLessThanOrEqual(width);
 }
 const resetTip=await reset.evaluate(e=>{const s=getComputedStyle(e,'::after'),b=e.getBoundingClientRect();return {top:b.top+parseFloat(s.top),panelTop:e.closest('.lab').getBoundingClientRect().top};});expect(resetTip.top).toBeGreaterThanOrEqual(resetTip.panelTop);
 await reset.focus();await page.keyboard.press('Enter');await expect(reset).toBeFocused();await expect(page.locator('#flow-slide-title')).toHaveText(`1 / 4 · ${titles[0]}`);await expect(back).toBeDisabled();
 await expect(page.locator('#flow-result')).toHaveText('ยังไม่ได้ทดลอง');expect(posts).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await reset.evaluate(e=>window.scrollBy(0,e.getBoundingClientRect().top-160));await page.screenshot({path:testInfo.outputPath(`navigation-${theme}-${width}.png`)});
 await page.locator('.sidebar button[data-lesson]').nth(2).click();await expect(page.locator('#reset')).toHaveText('เริ่มการทดลองใหม่');await expect(page.locator('#reset svg')).toHaveCount(0);
});
