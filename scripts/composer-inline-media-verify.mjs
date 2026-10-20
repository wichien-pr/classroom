import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
process.env.PLAYWRIGHT_BROWSERS_PATH=new URL('../courses/scale-lab/.browsers',import.meta.url).pathname;
const {chromium}=await import('../courses/scale-lab/node_modules/playwright/index.mjs');
const {expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const evidence=new URL('../evidence/',import.meta.url).pathname;
const qa=JSON.parse(await readFile(evidence+'composer-qa-server.json'));
assert.equal(qa.url,'http://127.0.0.1:8101');
const fixtures=path.join(path.dirname(qa.database),'fixtures');
const browser=await chromium.launch({channel:'chromium'}),page=await browser.newPage({viewport:{width:1440,height:1100}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto(qa.url+'/login');await page.locator('[name=email]').fill('composer-a@example.test');await page.locator('[name=password]').fill('QA-composer-password-2026');await page.locator('form button').click();await page.waitForURL(qa.url+'/');
 await page.goto(qa.url+'/community');await page.evaluate(()=>{window.liveURLs=new Set();const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);URL.createObjectURL=f=>{const u=create(f);liveURLs.add(u);return u};URL.revokeObjectURL=u=>{liveURLs.delete(u);return revoke(u)};});await page.locator('#write-prompt').click();
 await expect(page.locator('#composer-requirements')).toBeVisible();
 await page.locator('#compose-title').fill('Inline QA '+Date.now());await page.locator('#compose-body').fill('ภาพแนบอยู่ใต้ข้อความในพื้นที่เขียนโพสต์');await page.locator('[name=category]').selectOption('general');
 await page.locator('#compose-files').setInputFiles(path.join(fixtures,'qa-image.png'));
 const add=page.getByRole('button',{name:'เพิ่มภาพหรือไฟล์',exact:true});await expect(add).toBeVisible();
 const image=page.locator('#file-preview img');await expect(image).toHaveCount(1);
 let rect=await image.boundingBox();assert.ok(rect.width>=350 && rect.height>=350,'large square inline preview');
 const body=await page.locator('#compose-body').boundingBox();assert.ok(rect.y>=body.y+body.height && rect.y-body.y-body.height<100);
 await expect(image).toHaveJSProperty('complete',true);assert.ok(await image.evaluate(e=>e.naturalWidth>0));await page.screenshot({path:evidence+'composer-inline-single-desktop.png',fullPage:true});
 let picker=page.waitForEvent('filechooser');await add.click();await(await picker).setFiles(path.join(fixtures,'qa-own.gif'));await expect(image).toHaveCount(2);
 await page.locator('#compose-files').setInputFiles(path.join(fixtures,'qa-image.png'));await expect(image).toHaveCount(2);
 await page.locator('#compose-files').setInputFiles(path.join(fixtures,'qa-note.txt'));await expect(page.locator('#file-preview figure')).toHaveCount(3);
 await page.getByRole('button',{name:'นำออก qa-note.txt',exact:true}).click();await expect(page.locator('#file-preview figure')).toHaveCount(2);
 await page.locator('#compose-files').setInputFiles([{name:'a.txt',mimeType:'text/plain',buffer:Buffer.from('a')},{name:'b.txt',mimeType:'text/plain',buffer:Buffer.from('b')}]);await expect(add).toHaveCount(0);await expect(page.locator('#file-preview figure')).toHaveCount(4);
 await page.locator('#compose-files').setInputFiles(path.join(fixtures,'qa-note.txt'));await expect(page.locator('#file-preview figure')).toHaveCount(4);await expect(page.locator('#composer-status')).toContainText('สูงสุด 4');
 await page.getByRole('button',{name:'นำออก a.txt',exact:true}).click();await page.getByRole('button',{name:'นำออก b.txt',exact:true}).click();
 await page.locator('#compose-files').setInputFiles({name:'oversize.txt',mimeType:'text/plain',buffer:Buffer.alloc(5*1024*1024+1,97)});await expect(page.locator('#file-preview figure')).toHaveCount(2);
 assert.equal(await page.evaluate(()=>liveURLs.size),2);for(const control of await page.locator('#file-preview button').all()){const r=await control.boundingBox();assert.ok(r.width>=44&&r.height>=44)}
 await expect.poll(()=>image.evaluateAll(nodes=>nodes.every(e=>e.complete&&e.naturalWidth>0))).toBe(true);
 await page.screenshot({path:evidence+'composer-inline-desktop.png',fullPage:true});
 for(const width of [390,320]){await page.setViewportSize({width,height:844});await page.locator('#composer-submit').scrollIntoViewIfNeeded();const footer=await page.locator('#composer-submit').boundingBox();assert.ok(footer.y>=0 && footer.y+footer.height<=844);assert.ok(await page.locator('#composer-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth));await page.screenshot({path:evidence+`composer-inline-mobile-${width}.png`,fullPage:true});}
 if(process.env.INLINE_STAGE==='new'){console.log('PASS new gallery, append/dedupe/remove, GIF, mobile footer');returnToClose();}else{
 await page.locator('#composer-submit').click();await page.waitForURL('**/community/posts/*');const url=page.url();await page.getByRole('link',{name:'แก้ไขโพสต์',exact:true}).click();await expect(page.locator('#file-preview [data-existing] img')).toHaveCount(2);await page.locator('#file-preview [data-remove]').first().click();await expect(page.locator('#file-preview [data-existing]:visible')).toHaveCount(1);await page.locator('#compose-files').setInputFiles(path.join(fixtures,'qa-note.txt'));page.once('dialog',d=>d.accept());await page.locator('#composer-cancel').click();await page.locator('#write-prompt').click();await expect(page.locator('#file-preview [data-existing]:visible')).toHaveCount(2);await expect(page.locator('#file-preview figure')).toHaveCount(2);await expect(page.locator('[name=remove_attachments]')).toHaveValue('');
 await page.locator('#file-preview [data-remove]').first().click();await page.locator('#composer-submit').click();await page.waitForURL(url);await expect(page.locator('.attachment-grid figure')).toHaveCount(1);
 await page.setViewportSize({width:1440,height:1100});await page.getByRole('link',{name:'แก้ไขโพสต์',exact:true}).click();await expect.poll(()=>page.locator('#file-preview img').evaluateAll(nodes=>nodes.every(e=>e.complete&&e.naturalWidth>0))).toBe(true);await page.screenshot({path:evidence+'composer-inline-edit.png',fullPage:true});
 await page.locator('#compose-files').setInputFiles(path.join(fixtures,'qa-image.png'));await page.getByRole('button',{name:'เพิ่มวิดีโอ',exact:true}).click();await page.locator('[name=video_url]').fill('https://invalid.example/video');await page.locator('#composer-submit').click();await expect(page.locator('#composer-status')).toContainText('กรุณาเลือกไฟล์ใหม่');assert.equal(await page.locator('#compose-files').evaluate(e=>e.files.length),0);await expect(page.locator('#file-preview [data-existing]:visible')).toHaveCount(1);await expect(page.locator('#file-preview figure')).toHaveCount(1);
 assert.deepEqual(errors,[]);console.log('PASS inline gallery: large image/GIF, append, duplicate suppression, document/remove, caps, object URL replacement cleanup, 44px controls, 320/390 footer, retained edit/cancel/save, error draft/reselection');await writeFile(evidence+'composer-inline-browser.json',JSON.stringify({passed:true,errors,qaUrl:qa.url},null,2));
 }
}finally{await browser.close()}
function returnToClose(){}
