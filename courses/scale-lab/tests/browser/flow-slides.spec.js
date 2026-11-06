import {test,expect} from '@playwright/test';
test('LAB01 guided navigation prepares independent conditions without stale results',async({page})=>{
 await page.goto('/');
 const next=page.locator('#flow-slide-next'),back=page.locator('#flow-slide-back');
 await expect(back).toBeDisabled();
 for(let i=0;i<3;i++)await next.click();
 await expect(next).toBeDisabled();await expect(page.locator('#flow-scenario')).toContainText('Mobile app');
 await expect(page.locator('#flow-scene')).toHaveAttribute('data-stage','ready');
 await expect(page.locator('#progress')).toContainText('0 /');
 await page.locator('#step').click();await back.click();
 await expect(page.locator('#flow-scenario')).toContainText('Browser');
 await expect(page.locator('#flow-result')).toHaveText('ยังไม่ได้ทดลอง');
 await expect(page.locator('#flow-slide-title')).toBeFocused();await page.keyboard.press('Tab');await expect(next).toBeFocused();
 await expect(page.locator('#flow-scene')).toHaveAttribute('data-playback','idle');
 await page.waitForTimeout(1400);await expect(page.locator('#flow-scene')).toHaveAttribute('data-stage','ready');
 await page.locator('[data-lesson-kind="workload"]').click();await expect(page.locator('#flow-slide-title')).toHaveCount(0);
 await page.locator('[data-lesson-kind="flow"]').click();await expect(page.locator('#flow-slide-title')).toContainText('1 / 4');
});
