import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

for(const theme of ['light','dark'])for(const width of [1280,390,320])test(`Scale lesson menu readable ${theme} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:800});await page.goto('/');
 await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
 const buttons=page.locator('.sidebar nav button[data-lesson]');
 await expect(buttons).toHaveCount(12);
 for(let i=0;i<12;i++){
  const button=buttons.nth(i);
  for(const selected of [false,true]){
   if(selected){await button.click();await expect(button).toHaveAttribute('aria-current','page');}
   else {await buttons.nth((i+1)%12).click();await expect(button).not.toHaveAttribute('aria-current','page');}
   const metrics=await button.evaluate(el=>{
    const label=el.children[1],num=el.querySelector('.nav-num'),s=getComputedStyle(label),n=getComputedStyle(num);
    return {label:label.textContent,size:parseFloat(s.fontSize),line:parseFloat(s.lineHeight),number:parseFloat(n.fontSize),clipped:el.scrollWidth>el.clientWidth||label.scrollWidth>label.clientWidth,top:Math.abs(label.getBoundingClientRect().top-num.getBoundingClientRect().top)};
   });
   expect(metrics.size,JSON.stringify(metrics)).toBe(16);expect(metrics.number).toBe(16);
   expect(metrics.line).toBeGreaterThanOrEqual(24);expect(metrics.line).toBeLessThanOrEqual(25.6);
   expect(metrics.clipped,metrics.label).toBe(false);expect(metrics.top).toBeLessThanOrEqual(3);
  }
 }
 await buttons.nth(4).click();await buttons.nth(4).hover();await page.waitForTimeout(180);
 expect(await buttons.nth(4).evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(18, 87, 71)');
 await buttons.nth(3).hover();await page.waitForTimeout(180);
 expect(await buttons.nth(3).evaluate(e=>getComputedStyle(e).backgroundColor)).toBe(theme==='dark'?'rgb(38, 51, 71)':'rgb(238, 242, 248)');
 await page.keyboard.press('Tab');await buttons.nth(4).focus();
 expect(await buttons.nth(4).evaluate(e=>getComputedStyle(e).outlineStyle)).toBe('solid');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const scroll=await page.locator(width>700?'.sidebar':'.sidebar nav').evaluate(e=>({height:e.clientHeight,total:e.scrollHeight,overflow:getComputedStyle(e).overflowY}));
 expect(scroll.overflow).toBe('auto');expect(scroll.total).toBeGreaterThan(scroll.height);
 await buttons.last().scrollIntoViewIfNeeded();await expect(buttons.last()).toBeInViewport();
 await buttons.first().click();
 expect(await page.locator('#flow-slide-next').evaluate(e=>getComputedStyle(e).display)).toBe('block');
 expect(await page.locator('#flow-slide-next').evaluate(e=>getComputedStyle(e).fontSize)).toBe('16px');
 await buttons.nth(4).click();
 await page.evaluate(()=>{window.scrollTo(0,0);document.querySelector('.sidebar').scrollTop=0;document.querySelector('.sidebar nav').scrollTop=0;});
 const dir=process.env.MENU_EVIDENCE||'../../evidence/sidebar-readability';await mkdir(dir,{recursive:true});
 await page.screenshot({path:`${dir}/${theme}-${width}.png`});
 await buttons.last().click();await buttons.last().scrollIntoViewIfNeeded();
 await page.screenshot({path:`${dir}/${theme}-${width}-last.png`});
});
