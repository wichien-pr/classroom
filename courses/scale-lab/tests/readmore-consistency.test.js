import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {replicationNotes} from '../src/replication-view.js';
import {dataTierNotes} from '../src/database-scaling-view.js';
import {databaseNotes} from '../src/database.js';
import {loggingNotes} from '../src/logging-view.js';
import {scalingNotes} from '../src/scaling.js';
import {balanceNotes} from '../src/balance.js';
import {cacheNotes} from '../src/cache-view.js';
import {cdnNotes} from '../src/cdn-view.js';
import {webNotes} from '../src/stateless-web-view.js';
import {dataCentersNotes} from '../src/data-centers-view.js';
import {queueNotes} from '../src/message-queue-view.js';
test('LAB10 stopping the producer does not cancel accepted jobs in the available queue',()=>{
 const text=queueNotes();
 assert.match(text,/หยุด Producer คือหยุดส่งงานใหม่ ไม่ใช่ยกเลิกงานที่รับเข้าคิวแล้ว/);
 assert.match(text,/เมื่อคิวยังพร้อม Worker จึงทำงานเดิมต่อได้/);
 assert.match(text,/คิวพร้อมตลอดและเก็บสถานะในหน่วยความจำ/);
 assert.match(text,/การรับเข้าคิวไม่ใช่คำรับรองว่างานสำเร็จ/);
});
test('LAB10 buffering does not add processing capacity',()=>{
 const text=queueNotes();
 assert.match(text,/คิวช่วยพักงานและแยกจังหวะรับงานจากการประมวลผล แต่ไม่ได้เพิ่มกำลังประมวลผลของ Worker/);
 assert.match(text,/งานเข้าเร็วกว่างานออกต่อเนื่อง backlog และเวลารอจะเพิ่มขึ้น/);
});
test('LAB10 FIFO completion order is scoped to the single-worker scene',()=>{
 const text=queueNotes();
 assert.match(text,/ฉากนี้รับงานตามลำดับ FIFO และมี Worker เดียวทำทีละงาน จึงเสร็จตามลำดับ #1–#3/);
 assert.match(text,/ระบบจริงที่มีหลาย workers หรือ retry อาจเสร็จไม่ตรงลำดับรับงาน แม้รับจากคิวแบบ FIFO/);
 assert.match(text,/ไม่มีการแก้ไขไฟล์ภาพหรือจำลอง broker crash, ack, retry และ persistence/);
 assert.match(text,/ไม่ได้พิสูจน์การกู้คืนหลังเครื่องล่มหรือรับประกัน exactly-once/);
});
test('LAB09 improvement requires additional provisioned resources and distribution',()=>{
 const text=dataCentersNotes();
 assert.match(text,/เตรียมบริการและกำลังรองรับเพิ่มที่ West.*กระจายคำขอ/);
 assert.match(text,/ไม่ใช่ DNS เพิ่มกำลังให้ระบบเอง/);
 assert.match(text,/ไม่ใช่ benchmark ที่ใช้ทรัพยากรรวมเท่ากัน/);
});
test('LAB09 distinguishes exact simulated distribution from real DNS answers and reuse',()=>{
 const text=dataCentersNotes();
 assert.match(text,/ตัวจำลองแบ่งคำขอเป็น 60 \/ 40 ตายตัว/);
 assert.match(text,/GeoDNS จริงเลือกคำตอบ DNS ไม่ได้เลือกปลายทางให้ทุก HTTP request/);
 assert.match(text,/DNS cache ของ resolver และ client รวมถึงการใช้ connection เดิมซ้ำ.*สัดส่วนคำขอจริง.*ไม่ตรง/);
});
test('LAB09 normal-load capacity does not guarantee failover spare capacity',()=>{
 const text=dataCentersNotes();
 assert.match(text,/รับโหลดปกติที่แบ่งกันได้ ไม่ได้แปลว่าศูนย์ที่เหลือจะรับโหลดทั้งหมดได้เมื่ออีกศูนย์ล่ม/);
 assert.match(text,/ต้องประเมินกำลังสำรองสำหรับ failover แยกต่างหาก/);
 assert.match(text,/ไม่มีการทดสอบ outage หรือกำลังสำรองสำหรับ failover ในการเปรียบเทียบนี้/);
});
test('LAB08 removes the requested introductory block and its wrapper',()=>{
 const text=webNotes();
 for(const removed of ['Stateless Web ≠ ไม่มีสถานะ','Cookie บอกว่าจะค้น session ใด','สิ่งที่เปลี่ยนคือที่เก็บ session','ไม่ใช่ส่งสำเนา session จาก A ไป B','id="web-comparison"'])assert(!text.includes(removed),`removed introductory content remains: ${removed}`);
 assert.equal((text.match(/<section>/g)||[]).length,1);
 assert.match(text,/<section><h2>เมื่อ B หา session ไม่พบ<\/h2>/);
});
const webSupplement=()=>webNotes();
test('LAB08 missing local session on B does not delete the session on A or log out automatically',()=>{
 const text=webSupplement();
 assert.match(text,/B หา local session ไม่พบ ไม่ได้ลบ session ที่ A และไม่ได้ทำให้ผู้ใช้ logout อัตโนมัติ/);
 assert.match(text,/คำขอที่ไป B จึงยืนยันผู้ใช้ไม่ได้จากข้อมูลในเครื่อง B/);
});
test('LAB08 externalizing session does not prove the whole application is stateless',()=>{
 const text=webSupplement();
 assert.match(text,/ตัวอย่างนี้แยกเฉพาะ session ออกจาก Web ไม่ได้พิสูจน์ว่า state ทั้งหมดของแอปเป็น stateless/);
 assert.match(text,/state อื่นที่ผูกกับเครื่อง เช่น ไฟล์อัปโหลดหรืองานที่กำลังประมวลผล ต้องออกแบบแยกต่างหาก/);
});
test('LAB08 shared session enables alternate web handling without guaranteeing HA',()=>{
 const text=webSupplement();
 assert.match(text,/Shared session ช่วยให้ Web อีกเครื่องรับคำขอแทนได้เมื่อเข้าถึง session เดียวกัน แต่ไม่ได้ทำให้ระบบมี HA อัตโนมัติ/);
 assert.match(text,/shared store เองต้องออกแบบ availability และ recovery/);
 assert.match(text,/ไม่ได้ทดลอง store outage หรือ Sticky/);
});
test('LAB07 HIT means a usable cached copy, not the latest origin version',()=>{
 const text=cdnNotes();
 assert.match(text,/HIT หมายถึงมีสำเนาที่ใช้ตอบได้ ไม่ได้ยืนยันว่าเป็นรุ่นล่าสุดที่ origin/);
 assert.match(text,/ยังตอบ v1 ได้แม้ origin เปลี่ยนเป็น v2 แล้ว/);
});
test('LAB07 invalidation removes the CDN copy without pushing a new version or clearing browser cache',()=>{
 const text=cdnNotes();
 assert.match(text,/Invalidate ลบสำเนาที่ CDN ไม่ได้ส่ง v2 ให้ผู้ใช้ทันที/);
 assert.match(text,/คำขอถัดไปจึงโหลด v2 จาก origin แล้วเก็บสำเนาใหม่/);
 assert.match(text,/การ invalidate ที่ CDN ไม่ได้หมายความว่า cache ใน browser ถูกล้างด้วย/);
});
test('LAB07 connects LAB06 application data caching to CDN file delivery within these two labs',()=>{
 const text=cdnNotes();
 assert.match(text,/ในสอง LAB นี้ LAB06 ใช้ cache ข้อมูลของแอปเพื่อลดการอ่าน DB ส่วน LAB07 ใช้ CDN ส่งไฟล์เพื่อลดงานที่ origin/);
});
test('LAB06 separates API TTL seconds from the abstract scene clock',()=>{
 const text=cacheNotes();
 assert.match(text,/ตัวอย่าง pseudocode API.*3,600 วินาที.*แยกจากฉากทดลอง/s);
 assert.match(text,/ในตัวทดลอง TTL = 3 หน่วย/);
 assert.match(text,/หน่วยนี้ไม่ใช่วินาทีจริง/);
});
test('LAB06 explains expiration without proactive refresh or DB synchronization',()=>{
 const text=cacheNotes();
 assert.match(text,/หมดอายุ.*สำเนาเดิมใช้ตอบไม่ได้/);
 assert.match(text,/ไม่ใช่การ refresh หรือ sync จาก DB อัตโนมัติ/);
 assert.match(text,/เมื่อ cache พร้อม การอ่านครั้งถัดไปจึงเป็น MISS.*อ่าน DB.*เติม cache ใหม่/);
});
test('LAB06 distinguishes available-cache MISS from unavailable-cache BYPASS',()=>{
 const text=cacheNotes();
 assert.match(text,/MISS — cache พร้อม แต่ไม่มีสำเนาที่ใช้ได้/);
 assert.match(text,/BYPASS — cache ไม่พร้อม.*แอปอ่าน DB โดยตรง.*ไม่เติม cache จนกว่า cache จะพร้อม/);
});
test('LAB04 explains round-robin request counts without equating CPU or duration',()=>{
 const text=balanceNotes();
 assert.match(text,/round-robin.*วนส่งคำขอ.*A→B→A→B/);
 assert.match(text,/จำนวน request เท่ากัน.*ไม่ได้แปลว่า.*CPU.*เวลา.*เท่ากัน/);
});
test('LAB04 explains no destination when the healthy pool is empty',()=>{
 assert.match(balanceNotes(),/ไม่มีเครื่องพร้อมใน pool.*ไม่มีปลายทางให้ส่งคำขอ.*แม้ LB ยังทำงานอยู่/);
});
test('LAB04 describes four independent prepared states rather than automatic transitions',()=>{
 const text=balanceNotes();
 assert.match(text,/ทั้ง 4 หัวข้อ.*เตรียมสถานะแยกกัน.*A และ B พร้อม.*B พร้อมเครื่องเดียว.*ไม่มีเครื่องพร้อม.*B และ C พร้อม/);
 assert.match(text,/ไม่ใช่เหตุการณ์เครื่องล่มต่อเนื่องหรือ autoscaling อัตโนมัติ/);
});
test('LAB03 relates scaling suitability and final overload to accessible capacity',()=>{
 const text=scalingNotes();
 for(const re of [/ทรัพยากร.*เพิ่มได้.*workload.*ข้อกำหนด/,/หัวข้อสุดท้าย.*Load balancer.*ไม่ได้สร้างกำลัง/,/รวมเฉพาะเครื่องที่พร้อมและมีเส้นทางรับงาน/,/โหลด.*เกินกำลังรวม.*overload/])assert.match(text,re);
 assert.doesNotMatch(text,/เหมาะเมื่อ traffic ยังต่ำ/);
});
test('LAB05 distinguishes replica readiness from data freshness',()=>{
 assert.match(replicationNotes(),/Replica ที่พร้อม \(healthy\) หมายถึงรับงานได้ ไม่ได้แปลว่าข้อมูลตาม Primary ทันแล้ว/);
});
test('LAB05 defines fencing as an assumed protection against competing writers',()=>{
 const text=replicationNotes();
 for(const re of [/Fencing คือกัน writer เดิมไม่ให้รับงานเขียนเมื่อกลับมา.*writer สองตัว.*ประวัติข้อมูลแยกจากกัน/,/ฉากสมมติว่าตรวจยืนยัน fencing แล้ว ไม่ได้แยกเครื่องหรือปิดกั้นงานเขียนในโครงสร้างพื้นฐานจริง/])assert.match(text,re);
});
test('LAB05 bounds primary reads by successful local writes, availability and load',()=>{
 const text=replicationNotes();
 for(const re of [/ในฉากนี้ การอ่าน Primary ช่วยให้เห็นข้อมูลที่เขียนสำเร็จบน Primary ตัวนั้น/,/หาก Primary ล่มก็อ่านจากเครื่องนั้นไม่ได้/,/การส่งงานอ่านกลับไปที่ Primary อาจเพิ่มโหลดจนรับไม่ไหว/])assert.match(text,re);
 assert.doesNotMatch(text,/หากต้องอ่านข้อมูลที่เพิ่งเขียน ให้เลือกอ่าน Primary ที่รับการเขียนนั้น/);
});
test('LAB05 reading follows topic-driven replication rather than removed controls',()=>{
 const text=replicationNotes();
 assert.match(text,/หัวข้อ 1.*หัวข้อ 2/);assert.match(text,/หัวข้อ 3–5/);assert.match(text,/หัวข้อ 6/);assert.match(text,/กดทดลอง.*ลำดับ/);assert.doesNotMatch(text,/กด sync|ลองปิดเครื่อง/);
});
test('LAB12 scale-up keeps the same data on one machine rather than adding a copy',()=>{
 assert.match(dataTierNotes(),/Scale Up ยังเก็บข้อมูลทั้งหมดบนเครื่องเดิม ไม่ได้เพิ่มเครื่องสำรองหรือสำเนาข้อมูล/);
});
test('LAB12 balanced routing is explained by the prepared per-user request sample',()=>{
 assert.match(dataTierNotes(),/ชุดตัวอย่างเรียก user 0–15 คนละหนึ่งครั้ง โดยนับทุกคำขอเป็นภาระ 1 หน่วย/);
});
test('LAB12 real request cost can differ even at equal request counts',()=>{
 assert.match(dataTierNotes(),/แม้จำนวนคำขอเท่ากัน งานจริงแต่ละคำขออาจใช้ CPU, I\/O หรือเวลาต่างกัน/);
});
test('LAB12 reading distinguishes its two mounted pages from further study',()=>{
 const text=dataTierNotes();
 for(const re of [/สองหน้า/,/16 คำขอ.*8.*32/,/เครื่องไม่พร้อม/,/4 คำขอ.*8/,/ต่อยอด.*Hotspot/,/ไม่ได้ทดลอง.*resharding/])assert.match(text,re);
 assert.doesNotMatch(text,/ตัวเลือกความพร้อม|ค่า ready/);
});
test('LAB02 reading explains architecture presets without claiming database benchmarks',()=>{
 const text=databaseNotes();
 for(const re of [/Web 3.*Data 1/,/ทรัพยากรร่วม 3/,/Web 4.*DB.*ไม่พร้อม/,/orders.*SQL.*session.*key-value/,/Document.*Graph.*Wide-column.*ความรู้เสริม/,/ไม่ใช่ผลวัด latency/])assert.match(text,re);
});
test('LAB02 database selection starts with workload requirements and product testing',()=>{
 const text=databaseNotes();
 for(const re of [/access pattern.*key.*ความสัมพันธ์.*query/,/transaction.*consistency/,/durability.*availability/,/latency.*throughput.*ต้นทุน/,/ทดสอบ.*ผลิตภัณฑ์จริง.*workload/,/SQL ก็รองรับ JSON และข้อมูลจำนวนมากได้/,/NoSQL ไม่ได้เร็วกว่า SQL โดยอัตโนมัติ/])assert.match(text,re);
 assert.doesNotMatch(text,/<li>ต้องการ latency ต่ำมาก|serialize \/ deserialize|<li>ต้องเก็บข้อมูลปริมาณมหาศาล/);
});
test('LAB01 reading separates the mounted experiment from extensions',()=>{
 const text=source('single-server-layout.js');
 assert.match(text,/หลักการเสริม.*ไม่ได้ทดลอง.*แย่งทรัพยากร/);
});
test('LAB03 reading separates the mounted experiment from extensions',()=>{
 const text=source('scaling.js');
 assert.match(text,/เพดาน 4.*ไม่ใช่ตัวเลือก.*หัวข้อ/);
});
test('LAB04 reading separates the mounted experiment from extensions',()=>{
 const text=source('balance.js');
 assert.match(text,/กดทดลองเพื่อส่ง request/);assert.doesNotMatch(text,/ปุ่มส่ง request/);
});
test('LAB06 reading separates the mounted experiment from extensions',()=>{
 const text=source('cache-view.js');
 assert.match(text,/สิ่งที่เห็นในฉาก/);assert.match(text,/ต่อยอด.*พื้นที่เต็ม/);assert.match(text,/TTL = 3/);
});
test('LAB07 reading separates the mounted experiment from extensions',()=>{
 const text=source('cdn-view.js');
 assert.match(text,/สิ่งที่เห็นในฉาก.*MISS.*HIT/);assert.match(text,/ต่อยอด.*CDN ล่ม/);
});
test('LAB08 reading separates the mounted experiment from extensions',()=>{
 const text=source('stateless-web-view.js');
 assert.match(text,/หาก.*store ล่ม.*ระบบรูปแบบนี้/);assert.match(text,/ไม่ได้ทดลอง store outage หรือ Sticky/);
});
test('LAB09 reading separates the mounted experiment from extensions',()=>{
 const text=source('data-centers-view.js');
 assert.match(text,/100.*60.*60.*40/);assert.match(text,/สิ่งที่เห็นในฉาก/);
});
test('LAB10 reading separates the mounted experiment from extensions',()=>{
 const text=source('message-queue-view.js');
 assert.doesNotMatch(text,/รองรับ 1–4 เครื่อง/);assert.match(text,/เพดานภายใน.*ไม่ได้ทดลองคิวเต็ม/);
});
const source=name=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8');
test('LAB11 explains why mean latency cannot describe slow individual requests',()=>{
 const text=loggingNotes();
 assert.match(text,/ค่าเฉลี่ยอาจซ่อนคำขอบางรายการที่ช้ากว่าคำขออื่นมาก/);
 assert.match(text,/กดพักแล้วเทียบเวลาตอบกลับรายคำขอใน Logs กับค่าเฉลี่ยของวินาทีเดียวกัน/);
 assert.match(text,/ฉากนี้ไม่ได้แสดง p95/);
});
test('LAB11 reading describes the live simulated batch rather than obsolete telemetry',()=>{
 const text=loggingNotes();
 for(const pattern of [/GET \/orders/,/HTTP 200/,/HTTP 500/,/1 วินาทีจำลอง/,/20 จุด/,/ผลรวม.*จำนวนคำขอ/,/ไม่ใช่ p95/,/พัก.*Logs.*Metrics/,/ไม่.*สาเหตุ/,/ไม่.*Pipeline/,/ต่อยอด/]) assert.match(text,pattern);
 assert.doesNotMatch(text,/DB_TIMEOUT|900 ms|ข้อมูลคงที่/);
 assert.doesNotMatch(source('lessons.js'),/อ่านเรื่อง Logs และ Metrics แยกในเนื้อหา/);
});
