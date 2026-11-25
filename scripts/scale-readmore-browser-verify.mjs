// Compiled standalone reading QA only; no accounts or backend writes.
import {mkdir,mkdtemp,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const localBrowsers=fileURLToPath(new URL('../courses/scale-lab/.browsers',import.meta.url));
if(!process.env.PLAYWRIGHT_BROWSERS_PATH&&existsSync(localBrowsers))process.env.PLAYWRIGHT_BROWSERS_PATH=localBrowsers;
const url=process.env.READMORE_URL;
assert(url,'Set READMORE_URL to the compiled standalone build being verified');
const {chromium,expect}=await import('../courses/scale-lab/node_modules/@playwright/test/index.mjs');
const out=process.env.READMORE_EVIDENCE||await mkdtemp(join(tmpdir(),'scale-readmore-verification-'));
await mkdir(out,{recursive:true});
const required=[/หลักการเสริม/,/Web 3.*Data 1/s,/ไม่ใช่ตัวเลือกให้ปรับ/,/กดทดลองเพื่อส่ง request/,/หัวข้อ 6/,/ต่อยอดในระบบจริง/,/สิ่งที่เห็นในฉาก/,/ไม่ได้ทดลอง store outage หรือ Sticky/,/100 คำขอ.*60.*40/s,/ไม่ได้ทดลองคิวเต็ม/,/GET \/orders.*20 จุด/s,/สองหน้าเปรียบเทียบ/];
const browser=await chromium.launch({channel:'chromium'}),rows=[],errors=[],posts=[],screenshots=[],assetWarnings=[];
try{
 for(const theme of ['light','dark'])for(const width of [1280,390,320]){
  const page=await browser.newPage({viewport:{width,height:900}});
  // The existing standalone snapshot has no favicon; report it separately.
  page.on('console',m=>{if(m.type()==='error'){
   if(m.location().url===new URL('/favicon.ico',url).href&&m.text().includes('404'))assetWarnings.push({url:m.location().url,message:m.text()});
   else errors.push(m.text());
  }});
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(r.method()==='POST')posts.push(r.url());});
  await page.goto(url);await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  const ids=await page.locator('[data-lesson]').evaluateAll(es=>es.map(e=>Number(e.dataset.lesson)));assert.equal(ids.length,12);
  for(const id of ids){
   await page.locator(`[data-lesson="${id}"]`).click();
   const reading=page.locator(id===1?'#flow-details':id===8?'#web-details':'#lesson-details');
   const summary=reading.locator(':scope > summary');await summary.focus();await page.keyboard.press('Enter');await expect(reading).toHaveAttribute('open','');
   // Nested supplementary text is part of the reading, not a separate lesson.
   for(const child of await reading.locator('details').all())if(!await child.evaluate(e=>e.open))await child.locator(':scope > summary').click();
   const text=await reading.innerText();assert.match(text,required[id-1]);
   if(id===4){
    for(const sentence of ['ใช้ round-robin คือวนส่งคำขอไปยังเครื่องที่พร้อม เช่น A→B→A→B เมื่อ A และ B พร้อม','จำนวน request เท่ากันไม่ได้แปลว่าใช้ CPU หรือเวลาทำงานเท่ากัน เพราะแต่ละคำขออาจมีงานหนักเบาต่างกัน','หากไม่มีเครื่องพร้อมใน pool ก็ไม่มีปลายทางให้ส่งคำขอ แม้ LB ยังทำงานอยู่','ทั้ง 4 หัวข้อเตรียมสถานะแยกกัน: A และ B พร้อม, B พร้อมเครื่องเดียว, ไม่มีเครื่องพร้อม และ B และ C พร้อม','ไม่ใช่เหตุการณ์เครื่องล่มต่อเนื่องหรือ autoscaling อัตโนมัติ'])assert(text.includes(sentence),`LAB04 missing: ${sentence}`);
   }
   if(id===5){
    for(const sentence of ['Replica ที่พร้อม (healthy) หมายถึงรับงานได้ ไม่ได้แปลว่าข้อมูลตาม Primary ทันแล้ว','ในฉากนี้ การอ่าน Primary ช่วยให้เห็นข้อมูลที่เขียนสำเร็จบน Primary ตัวนั้น','หาก Primary ล่มก็อ่านจากเครื่องนั้นไม่ได้','การส่งงานอ่านกลับไปที่ Primary อาจเพิ่มโหลดจนรับไม่ไหว','Fencing คือกัน writer เดิมไม่ให้รับงานเขียนเมื่อกลับมา เพื่อไม่ให้มี writer สองตัวรับงานพร้อมกันจนประวัติข้อมูลแยกจากกัน','ฉากสมมติว่าตรวจยืนยัน fencing แล้ว ไม่ได้แยกเครื่องหรือปิดกั้นงานเขียนในโครงสร้างพื้นฐานจริง'])assert(text.includes(sentence),`LAB05 missing: ${sentence}`);
   }
   if(id===6){
    for(const sentence of ['ตัวอย่าง pseudocode API: เก็บราคา 100 พร้อมอายุ 3,600 วินาที','เป็นตัวอย่างแยกจากฉากทดลองที่ใช้ TTL = 3 หน่วยจำลอง','หน่วยนี้ไม่ใช่วินาทีจริง','เมื่อหมดอายุ สำเนาเดิมใช้ตอบไม่ได้','ไม่ใช่การ refresh หรือ sync จาก DB อัตโนมัติ','เมื่อ cache พร้อม การอ่านครั้งถัดไปจึงเป็น MISS ให้แอปอ่าน DB แล้วเติม cache ใหม่','MISS — cache พร้อม แต่ไม่มีสำเนาที่ใช้ได้','BYPASS — cache ไม่พร้อม','แอปอ่าน DB โดยตรงแล้วตอบกลับ ไม่เติม cache จนกว่า cache จะพร้อม'])assert(text.includes(sentence),`LAB06 missing: ${sentence}`);
   }
   if(id===7){
    for(const sentence of ['HIT หมายถึงมีสำเนาที่ใช้ตอบได้ ไม่ได้ยืนยันว่าเป็นรุ่นล่าสุดที่ origin','ยังตอบ v1 ได้แม้ origin เปลี่ยนเป็น v2 แล้ว','Invalidate ลบสำเนาที่ CDN ไม่ได้ส่ง v2 ให้ผู้ใช้ทันที','คำขอถัดไปจึงโหลด v2 จาก origin แล้วเก็บสำเนาใหม่','การ invalidate ที่ CDN ไม่ได้หมายความว่า cache ใน browser ถูกล้างด้วย','ในสอง LAB นี้ LAB06 ใช้ cache ข้อมูลของแอปเพื่อลดการอ่าน DB ส่วน LAB07 ใช้ CDN ส่งไฟล์เพื่อลดงานที่ origin'])assert(text.includes(sentence),`LAB07 missing: ${sentence}`);
   }
   if(id===8){
    for(const sentence of ['B หา local session ไม่พบ ไม่ได้ลบ session ที่ A และไม่ได้ทำให้ผู้ใช้ logout อัตโนมัติ','คำขอที่ไป B จึงยืนยันผู้ใช้ไม่ได้จากข้อมูลในเครื่อง B','ตัวอย่างนี้แยกเฉพาะ session ออกจาก Web ไม่ได้พิสูจน์ว่า state ทั้งหมดของแอปเป็น stateless','state อื่นที่ผูกกับเครื่อง เช่น ไฟล์อัปโหลดหรืองานที่กำลังประมวลผล ต้องออกแบบแยกต่างหาก','Shared session ช่วยให้ Web อีกเครื่องรับคำขอแทนได้เมื่อเข้าถึง session เดียวกัน แต่ไม่ได้ทำให้ระบบมี HA อัตโนมัติ','shared store เองต้องออกแบบ availability และ recovery'])assert(text.includes(sentence),`LAB08 missing: ${sentence}`);
   }
   if(id===9){
    for(const sentence of ['เตรียมบริการและกำลังรองรับเพิ่มที่ West ร่วมกับการกระจายคำขอ','ไม่ใช่ DNS เพิ่มกำลังให้ระบบเอง','ไม่ใช่ benchmark ที่ใช้ทรัพยากรรวมเท่ากัน','ตัวจำลองแบ่งคำขอเป็น 60 / 40 ตายตัว','GeoDNS จริงเลือกคำตอบ DNS ไม่ได้เลือกปลายทางให้ทุก HTTP request','DNS cache ของ resolver และ client รวมถึงการใช้ connection เดิมซ้ำ','สัดส่วนคำขอจริงอาจไม่ตรงกับสัดส่วนในภาพ','รับโหลดปกติที่แบ่งกันได้ ไม่ได้แปลว่าศูนย์ที่เหลือจะรับโหลดทั้งหมดได้เมื่ออีกศูนย์ล่ม','ต้องประเมินกำลังสำรองสำหรับ failover แยกต่างหาก','ไม่มีการทดสอบ outage หรือกำลังสำรองสำหรับ failover ในการเปรียบเทียบนี้'])assert(text.includes(sentence),`LAB09 missing: ${sentence}`);
   }
   if(id===10){
    for(const sentence of ['หยุด Producer คือหยุดส่งงานใหม่ ไม่ใช่ยกเลิกงานที่รับเข้าคิวแล้ว','เมื่อคิวยังพร้อม Worker จึงทำงานเดิมต่อได้','คิวช่วยพักงานและแยกจังหวะรับงานจากการประมวลผล แต่ไม่ได้เพิ่มกำลังประมวลผลของ Worker','งานเข้าเร็วกว่างานออกต่อเนื่อง backlog และเวลารอจะเพิ่มขึ้น','ฉากนี้รับงานตามลำดับ FIFO และมี Worker เดียวทำทีละงาน จึงเสร็จตามลำดับ #1–#3','ระบบจริงที่มีหลาย workers หรือ retry อาจเสร็จไม่ตรงลำดับรับงาน แม้รับจากคิวแบบ FIFO','การรับเข้าคิวไม่ใช่คำรับรองว่างานสำเร็จ','คิวพร้อมตลอดและเก็บสถานะในหน่วยความจำ','ไม่มีการแก้ไขไฟล์ภาพหรือจำลอง broker crash, ack, retry และ persistence','ไม่ได้พิสูจน์การกู้คืนหลังเครื่องล่มหรือรับประกัน exactly-once'])assert(text.includes(sentence),`LAB10 missing: ${sentence}`);
   }
   if(id===11){
    assert.doesNotMatch(text,/DB_TIMEOUT|900 ms|ข้อมูลคงที่/);assert.match(text,/ไม่ใช่ p95/);
    for(const sentence of ['ค่าเฉลี่ยอาจซ่อนคำขอบางรายการที่ช้ากว่าคำขออื่นมาก','กดพักแล้วเทียบเวลาตอบกลับรายคำขอใน Logs กับค่าเฉลี่ยของวินาทีเดียวกัน','ฉากนี้ไม่ได้แสดง p95'])assert(text.includes(sentence),`LAB11 missing: ${sentence}`);
   }
   if(id===12){
    assert.doesNotMatch(text,/ตัวเลือกความพร้อม|ค่า ready/);
    for(const sentence of ['Scale Up ยังเก็บข้อมูลทั้งหมดบนเครื่องเดิม ไม่ได้เพิ่มเครื่องสำรองหรือสำเนาข้อมูล','ชุดตัวอย่างเรียก user 0–15 คนละหนึ่งครั้ง โดยนับทุกคำขอเป็นภาระ 1 หน่วย','แม้จำนวนคำขอเท่ากัน งานจริงแต่ละคำขออาจใช้ CPU, I/O หรือเวลาต่างกัน'])assert(text.includes(sentence),`LAB12 missing: ${sentence}`);
   }
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${id} ${width} ${theme}`);
   const term=reading.locator('.term-trigger').first();assert(await term.count(),`glossary LAB${id}`);
   await term.click();await expect(page.locator('#term-hint')).toBeVisible();
   const glossary=await page.locator('#term-hint').innerText();assert(glossary.length>20);
   await page.keyboard.press('Escape');await expect(page.locator('#term-hint')).toBeHidden();
   rows.push({id,theme,width,summary:await summary.innerText(),text,glossary,open:true,noOverflow:true});
   if((width===320&&[6,8,9,10,11,12].includes(id))||(width===1280&&theme==='light'&&[2,5,6,8,9,10].includes(id))){
    await page.setViewportSize({width,height:3000});await reading.scrollIntoViewIfNeeded();
    const path=`${out}/lab${id}-${theme}-${width}.png`;await reading.screenshot({path});screenshots.push(path);await page.setViewportSize({width,height:900});
   }
   await summary.focus();await page.keyboard.press('Enter');assert.equal(await reading.evaluate(e=>e.open),false);
  }
  // Full-form glossary behavior, not just visibility, remains intact.
  await page.locator('[data-lesson="11"]').click();await page.locator('#lesson-details > summary').click();
  const ci=page.locator('#lesson-details [data-term="ci"]').first();await ci.click();await expect(page.locator('#term-hint')).toContainText('CI (Continuous Integration)');await page.keyboard.press('Escape');
  await page.locator('[data-lesson="12"]').click();await expect(page.locator('#lesson-topic-title')).toContainText('1 / 2');await page.locator('#lesson-topic-next').click();await expect(page.locator('#lesson-topic-title')).toContainText('2 / 2');await expect(page.locator('#lesson-topic-next')).toBeDisabled();
  await page.close();
 }
 assert.equal(new Set(rows.map(x=>x.id)).size,12);assert.equal(rows.length,72);assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);
 const result={url,mode:'compiled standalone, no platform login',coverage:{lessons:new Set(rows.map(x=>x.id)).size,expected:12,mountedReadings:rows.length,themes:['light','dark'],widths:[1280,390,320]},errors,assetWarnings,posts,screenshots,rows};
 await writeFile(out+'/result.json',JSON.stringify(result,null,2));console.log(JSON.stringify({...result,rows:undefined},null,2));
}finally{await browser.close();}
