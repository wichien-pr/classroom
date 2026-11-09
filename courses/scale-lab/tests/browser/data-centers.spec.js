import {test,expect} from '@playwright/test';
test('LAB09 routes traffic, keeps DNS/data/capacity separate and resets safely',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('[data-lesson="9"]').click();await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('#main h1')).toContainText('Data centers');
 await page.locator('#dc-run').click();await expect(page.locator('[data-node=client-0]')).toContainText('60 ราย');await expect(page.locator('[data-node=client-1]')).toContainText('40 ราย');
 for(const result of ['ล่ม 40','DNS เดิม','60 → 100','ขาดข้อมูล 40','เกินกำลัง 40']){
  await page.locator('#lesson-topic-next').click();await page.locator('#dc-run').click();await expect(page.locator('#dc-result')).toContainText(result);await expect(page.locator('#dc-run')).toBeEnabled();
 }
 await page.locator('#reset').click();await expect(page.locator('#dc-result')).toContainText('ยังไม่ได้ทดลอง');await expect(page.locator('[data-node=west]')).toContainText('พร้อม');
 await page.locator('[data-lesson="10"]').click();await expect(page.locator('#main h1')).toContainText('Message queue');await expect(page.locator('#main')).toHaveClass(/sequence-lesson/);
 await page.locator('[data-lesson="9"]').click();await expect(page.locator('.dc-scene')).toHaveCount(1);expect(errors).toEqual([]);
});
test('LAB09 explains new terms and diagram vocabulary without nesting controls',async({page})=>{
 await page.goto('/');await page.locator('[data-lesson="9"]').click();
 await expect(page.locator('.dc-details, #dc-route')).toHaveCount(0);
 const term=page.locator('.lesson-intro').getByRole('button',{name:'อธิบายคำศัพท์ GeoDNS',exact:true}).first();await term.click();await expect(page.locator('#term-meaning')).not.toBeEmpty();await page.keyboard.press('Escape');await expect(term).toBeFocused();
 await page.locator('#lesson-details summary').click();const deploy=page.locator('#lesson-details').getByRole('button',{name:'อธิบายคำศัพท์ Automated deployment',exact:true});await deploy.click();await expect(page.locator('#term-example')).not.toBeEmpty();await expect(page.locator('#term-warning')).not.toBeEmpty();await page.keyboard.press('Escape');
 await page.locator('#dc-run').click();await expect(page.locator('.lesson-intro .term-trigger')).not.toHaveCount(0);
 await expect(page.locator('label .term-trigger,.answers .term-trigger,button button')).toHaveCount(0);
});
for(const width of [320,390,1440])test(`LAB09 full-width readable lesson ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/');await page.locator('[data-lesson="9"]').click();
 await expect(page.locator('#main')).toHaveClass(/sequence-lesson/);
 await expect(page.locator('.lesson-steps li')).toHaveCount(6);
 const lab=await page.locator('.lab').boundingBox(),quiz=await page.locator('.quiz').boundingBox();expect(quiz.y).toBeGreaterThan(lab.y+lab.height);
 await page.locator('#lesson-details summary').click();await expect(page.locator('#lesson-details')).toContainText('Automated deployment');await expect(page.locator('#lesson-details')).toContainText('asynchronous');
 expect(await page.locator('body').innerText()).not.toMatch(/Data-centers\.pdf|คู่มือต้นฉบับ|หน้า\s*\d/);
 const term=page.locator('.lesson-intro').getByRole('button',{name:'อธิบายคำศัพท์ GeoDNS',exact:true});await term.focus();await page.keyboard.press('Enter');await expect(page.locator('#term-hint')).toBeVisible();expect(await page.locator('#term-hint').evaluate(e=>{const b=e.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth})).toBe(true);await page.keyboard.press('Escape');await expect(term).toBeFocused();
 await expect(page.locator('label .term-trigger,.answers .term-trigger,button button')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.locator('.dc-scene').evaluate(e=>[...e.querySelectorAll('p,strong,span')].every(n=>parseFloat(getComputedStyle(n).fontSize)>=13))).toBe(true);
 await page.locator('#lesson-details summary').click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${process.env.LAB09_EVIDENCE||'../../evidence/lab09-remove-details/'}legacy-layout-${width}.png`,fullPage:true});
 await page.setViewportSize({width,height:1800});await page.locator('.dc-scene').evaluate(el=>scrollTo(0,scrollY+el.getBoundingClientRect().top-140));await page.locator('.dc-scene').screenshot({path:`${process.env.LAB09_EVIDENCE||'../../evidence/lab09-remove-details/'}legacy-diagram-${width}.png`});
});
