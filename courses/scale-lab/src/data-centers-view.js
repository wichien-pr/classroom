import {evaluateDataCenters} from './data-centers.js';

export const dataCentersLayout={
 title:'หลายศูนย์ข้อมูล ต้องพร้อมทั้งเส้นทางและข้อมูล',
 intro:'GeoDNS เลือก IP ของศูนย์ข้อมูลตามตำแหน่งโดยประมาณ ผู้ใช้จึงติดต่อ US-East หรือ US-West โดยตรง เมื่อศูนย์หนึ่งล่ม ต้องเปลี่ยนเส้นทางไปศูนย์ที่พร้อม พร้อมตรวจข้อมูลและกำลังสำรอง ไม่ใช่แค่เปลี่ยน DNS',
 cards:[['ปกติ · สองศูนย์รับงาน','US-East รับ x% ส่วน US-West รับ (100 − x)% ตามกลุ่มผู้ใช้ แต่ละศูนย์มี Web servers, Database และ Cache'],['ศูนย์หนึ่งล่ม · ใช้อีกศูนย์','ตั้งเป้าให้ศูนย์ที่พร้อมรับ 100% หลัง client ได้ปลายทางใหม่ ต้องมีข้อมูลที่จำเป็นและ capacity เพียงพอ']],
 steps:[
  'คงสัดส่วน US-East ที่ 60 และทั้งสองศูนย์พร้อม แล้วกดส่งคำขอ 100 ราย ดู traffic 60% / 40%',
  'ปิด US-West พร้อม แล้วกดส่งคำขอ ดูว่าผู้ใช้ 40 รายยังไปศูนย์ที่ล่ม',
  'เปิดเปลี่ยนเส้นทางเมื่อศูนย์ล่ม แต่ปิดผู้ใช้ได้รับ DNS ใหม่ แล้วส่งคำขอ ดูว่าคำตอบเดิมยังพาไป US-West',
  'เปิดผู้ใช้ได้รับ DNS ใหม่ แล้วส่งคำขอ ดู US-East รับ 100% โดย US-West ยังปิดอยู่',
  'ปิดสำเนาข้อมูลข้ามศูนย์พร้อม แล้วส่งคำขอ ดูว่ากลุ่มที่ย้ายมายังขาดข้อมูล จากนั้นเปิดสำเนาข้อมูลกลับ',
  'ลดกำลัง US-East เป็น 60 แล้วส่งคำขอ ดูโหลดเกินกำลัง 40 จากนั้นคืนกำลังเป็น 100',
  'ปิดรุ่นบริการตรงกัน แล้วส่งคำขอ อ่านคำเตือนเรื่องการทดสอบ/deploy จากนั้นกดเริ่มการทดลองใหม่เพื่อคืนทุกค่า'
 ],
 groups:[['เส้นทางและศูนย์ที่พร้อม',['dc-share','dc-east-up','dc-west-up','dc-redirect','dc-fresh-dns']],['ข้อมูลและกำลังสำรอง',['dc-synced','dc-east-capacity','dc-west-capacity','dc-same-release']]],
 note:'คำขอ 100 รายเป็นกลุ่มสมมติ ไม่ใช่ RPS หรือ benchmark เฉพาะปุ่มส่งคำขอที่บันทึกการทดลอง'
};

export function dataCentersControls(){return `
 <label>สัดส่วนผู้ใช้เดิมไป US-East (%)<input id="dc-share" type="number" min="0" max="100" step="1" value="60"></label>
 <label><input id="dc-east-up" type="checkbox" checked> US-East พร้อม</label>
 <label><input id="dc-west-up" type="checkbox" checked> US-West พร้อม</label>
 <label><input id="dc-redirect" type="checkbox"> เปลี่ยนเส้นทางเมื่อศูนย์ล่ม</label>
 <label><input id="dc-fresh-dns" type="checkbox" checked> ผู้ใช้ได้รับ DNS ใหม่</label>
 <label><input id="dc-synced" type="checkbox" checked> สำเนาข้อมูลข้ามศูนย์พร้อม</label>
 <label>กำลัง US-East (คำขอต่อกลุ่ม)<input id="dc-east-capacity" type="number" min="0" max="100" step="1" value="100"></label>
 <label>กำลัง US-West (คำขอต่อกลุ่ม)<input id="dc-west-capacity" type="number" min="0" max="100" step="1" value="100"></label>
 <label><input id="dc-same-release" type="checkbox" checked> รุ่นบริการตรงกัน</label>
 <button type="button" id="dc-request" data-action="dc-request">ส่งคำขอ 100 ราย</button>`;}

export function dataCentersMessage(r){return `ปลายทางล่ม ${r.unavailable} ราย · ขาดข้อมูลข้ามศูนย์ ${r.missingData} ราย · เกินกำลัง ${r.overloaded} คำขอ · ${r.releaseMismatch?'รุ่นบริการต่างกัน ต้องทดสอบ compatibility ก่อนสรุปว่าใช้งานได้':'รุ่นบริการตรงกัน แต่ยังต้องทดสอบทุกศูนย์'} · ตัวเลขความเสี่ยงอาจซ้อนกัน ห้ามนำมาบวกเป็นจำนวนผู้ใช้ที่ล้มเหลว`;}

export function dataCentersDiagram(c){
 const r=evaluateDataCenters(c);
 return `<figure id="dc-diagram" class="dc-diagram" aria-label="ผู้ใช้ถาม GeoDNS รับ IP แล้วส่ง HTTP ไป US-East หรือ US-West โดยตรง">
 <div class="dc-dns"><strong>① Client ถาม GeoDNS ⇄ รับ IP</strong><p>${c.freshDNS?'ใช้คำตอบ DNS ใหม่ตามนโยบายที่ตั้ง':'ใช้คำตอบเดิม ก่อนเปลี่ยนเส้นทาง'}</p></div>
 <p class="dc-path">② Client ส่ง HTTP ↓ ไป Load balancer ของศูนย์ปลายทาง<br>Response ↑ กลับ client · ไม่ผ่าน DNS</p>
 <div class="dc-sites">${['US-East','US-West'].map((name,i)=>{
 const up=i===0?c.eastUp:c.westUp,cap=i===0?c.eastCapacity:c.westCapacity;
 return `<section id="dc-${i===0?'east':'west'}" class="dc-site ${up?'':'dc-offline'}"><h3>${name}</h3><strong class="dc-share">${r.routes[i]}% traffic</strong><p>${up?'พร้อม':'ล่ม · ส่งมาที่นี่ไม่ได้รับบริการ'} · กำลัง ${cap}</p><div class="dc-tier">Load balancer</div><span class="dc-path">↓ HTTP ↑</span><div class="dc-tier">Web servers</div><span class="dc-path">↓ อ่านข้อมูล ↑</span><div class="dc-data"><div>Database</div><div>Cache</div></div></section>`;}).join('')}</div>
 <p class="dc-copy">สำเนาข้ามศูนย์: ${c.synced?'สมมติว่าข้อมูลที่จำเป็นพร้อมแล้ว':'ยังไม่พร้อม · เปลี่ยนเส้นทางไม่ได้ทำสำเนาให้'}</p>
 <figcaption>ภาพสถานการณ์ที่ทดลองล่าสุด · CDN ส่งไฟล์ static แยกจากเส้นทางข้อมูลนี้ ไม่ได้ทดแทนฐานข้อมูลข้ามศูนย์</figcaption></figure>`;
}

export function dataCentersNotes(){return `<section class="dc-notes">
 <h2>สามเรื่องที่ต้องเตรียมก่อนใช้หลายศูนย์</h2>
 <h3>1. Traffic redirection · ส่งคำขอไปให้ถูกที่</h3>
 <p>GeoDNS ใช้ตำแหน่งโดยประมาณของผู้ใช้หรือ DNS resolver เพื่อเลือก IP ไม่ได้รับประกันว่าศูนย์ที่ใกล้ทางภูมิศาสตร์จะมี latency ต่ำสุด สัดส่วน x% เป็นผลของกลุ่มผู้ใช้ ไม่ใช่การแบ่งทุก request แบบ round-robin ของ DNS ระบบจริงต้องตรวจ health และกำหนด routing policy ก่อนเปลี่ยนปลายทาง</p>
 <p>DNS cache, TTL และ connection เดิมทำให้การย้ายไม่พร้อมกันทั้งหมด ตัวเลือก DNS ใหม่ในแบบจำลองแทนสองขอบเขต: ทุกคนใช้คำตอบเดิม หรือทุกคนที่ส่งคำขอรอบนี้ได้คำตอบใหม่ ไม่ได้จำลองเวลาหมดอายุหรือการย้าย connection ที่ค้างอยู่</p>
 <h3>2. Data synchronization · ข้อมูลต้องตามไปด้วย</h3>
 <p>ผู้ใช้แต่ละพื้นที่อาจใช้ Database และ Cache คนละชุด เมื่อย้ายศูนย์จึงอาจหา order หรือ session ไม่พบ การทำ replication ข้ามศูนย์ช่วยเตรียมข้อมูล แต่ asynchronous replication อาจล้าหลัง ต้องระบุว่าข้อมูลใดสำคัญ ยอมเก่าได้เท่าไร และมีทางกู้คืนอย่างไร Cache ไม่ใช่ backup และไม่จำเป็นต้องทำสำเนา cache ทุกชิ้นหากสร้างใหม่จากข้อมูลหลักได้</p>
 <p>แบบจำลองนี้ส่งคำขออ่านเท่านั้น สมมติข้อมูลของผู้ใช้เดิมอยู่ในศูนย์เดิมครบ ถ้าสำเนาข้ามศูนย์ไม่พร้อม ผู้ใช้ที่ย้ายจะขาดข้อมูล การเปิดช่องพร้อมเป็นการตั้งสมมติฐาน ไม่ใช่ปุ่มกู้ข้อมูลจากศูนย์ที่ล่มจริง และไม่มีการ promote writer; การป้องกัน split brain เรียนต่อใน LAB 10</p>
 <h3>3. Test and deployment · ทดสอบทุกพื้นที่</h3>
 <p>Automated deployment ช่วยให้โค้ดและ configuration สอดคล้องกันในทุกศูนย์ แต่รุ่นตรงกันไม่ได้พิสูจน์ว่าทำงานได้ ต้องทดสอบจากหลายพื้นที่ ตรวจ dependencies, schema compatibility และซ้อม failover/failback พร้อม rollback plan รุ่นต่างกันอาจเป็นช่วง rolling deployment ที่รองรับกันได้ จึงเป็นคำเตือนให้ตรวจ ไม่ใช่ข้อสรุปว่าทุกคำขอผิด</p>
 <h3>ขอบเขตภาพและตัวทดลอง</h3>
 <p>วาด Load balancer แยกในแต่ละศูนย์เพื่อแยกหน้าที่ DNS ออกจากเส้นทาง HTTP แต่ละศูนย์มี Web, Database และ Cache; shared NoSQL หรือ session store เป็นอีกทางเลือก ไม่ได้พร้อมข้ามศูนย์โดยอัตโนมัติ CDN สำหรับไฟล์ static เป็นอีกเส้นทางหนึ่ง</p>
 <p>กำลังรองรับเป็นจำนวนคำขอในกลุ่มสมมติ ไม่ใช่ผลวัดจริง ศูนย์ที่เหลือต้องรับโหลดเพิ่มได้ ความเสี่ยงข้อมูลไม่ครบและโหลดเกินอาจเกิดกับคำขอเดียวกัน จึงไม่รวมเป็นยอด failure ไม่มี network หรือฐานข้อมูลจริง ไม่จำลอง consensus, write conflicts หรือ replication protocol</p>
 <p>เมื่อระบบโตขึ้น อาจแยกองค์ประกอบให้ขยายอิสระด้วย Message queue แต่เป็นหัวข้อต่อยอด ไม่ใช่สิ่งที่ DNS หรือการเพิ่มศูนย์ข้อมูลทำให้เอง</p>
 </section>`;}
