import {test,expect} from '@playwright/test';
test('visible manual completion persists without claiming quiz success',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 const complete=page.getByRole('button',{name:'ทำเครื่องหมายว่าเรียนจบ',exact:true});
 await expect(complete).toBeVisible();
 await complete.scrollIntoViewIfNeeded();
 await expect(complete).toBeInViewport();
 expect(await complete.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(23, 107, 91)');
 await complete.click();
 await expect(page.getByRole('button',{name:'✓ เรียนจบแล้ว',exact:true})).toBeDisabled();
 await expect(page.locator('#feedback')).toHaveText('เลือกคำตอบเพื่อดูเหตุผล — ตอบใหม่ได้เสมอ');
 await expect(page.locator('#progress')).toHaveText('1 / 12 บทเรียนจบ');
 await page.locator('[data-lesson="2"]').click();
 await expect(complete).toBeEnabled();
 await page.reload();
 await expect(page.getByRole('button',{name:'✓ เรียนจบแล้ว',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('scale-lab-progress-v2')))).toEqual({version:2,completed:['flow']});
});
