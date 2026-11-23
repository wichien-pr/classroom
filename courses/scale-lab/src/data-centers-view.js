import {evaluateDataCenters} from './data-centers.js';

export const dataCentersLayout={
 title:'ร้านเดียวกัน เปิดบริการสองพื้นที่',
 intro:'ร้านออนไลน์รับคำขออ่านรายการสินค้า 100 ราย หากมีบริการที่ East แห่งเดียว งานทั้งหมดจะไปรวมที่นั่น ลองเทียบกับการเตรียมบริการและข้อมูลไว้ที่ East กับ West แล้วจัดผู้ใช้แต่ละกลุ่มไปคนละศูนย์',
 cards:[['Data center คืออะไร','สถานที่รันบริการของเรา แต่ละแห่งมีเครื่องบริการและข้อมูลที่ต้องเตรียม ไม่ใช่แค่เพิ่มชื่อปลายทาง'],['เปรียบเทียบให้ยุติธรรม','ใช้คำขอชุดเดิม 100 ราย แต่ละศูนย์รองรับ 60 คำขอต่อกลุ่ม เปลี่ยนเฉพาะการวางบริการและการจัดเส้นทาง']],
 steps:['กดทดลองครั้งเดียว แล้วเปรียบเทียบโหลด / กำลังรองรับของแบบรวมที่ East กับแบบแบ่งสองศูนย์'],
 groups:[],
 note:'หนึ่งการเปรียบเทียบ · ตัวเลขสมมติ ไม่ใช่ RPS หรือ benchmark'
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

export function dataCentersNotes(){return `<div id="dc-details" class="dc-notes">
<p>GeoDNS เลือก IP จากตำแหน่งโดยประมาณของผู้ใช้หรือ resolver จากนั้น client ติดต่อบริการโดยตรง ไม่ส่ง HTTP ผ่าน DNS ศูนย์ที่ใกล้ทางภูมิศาสตร์ไม่ได้รับประกันว่าจะเร็วที่สุด ต้องวัด latency จริง สัดส่วน 60 / 40 ในภาพเป็นนโยบายสมมติ ไม่ใช่ผลวัดหรือ round-robin ของ DNS</p>
<p>การทดลองนี้เปรียบเทียบสองแบบที่เตรียมไว้แล้ว ข้อมูลรายการสินค้าที่ต้องใช้พร้อมในศูนย์ที่รับงาน ไม่ได้จำลองการคัดลอกข้อมูล การเพิ่ม Data center ไม่ได้ sync ข้อมูลเอง ต้องวางแผน replication และความล่าช้า รวมถึงการ deploy บริการที่เข้ากันได้</p>
<p>หลายศูนย์ไม่ได้รับประกัน failover ถ้าศูนย์หนึ่งล่ม ยังต้องตรวจ health, routing policy, DNS cache และ connection เดิม รวมทั้งข้อมูลและกำลังของศูนย์ที่รับแทน ไม่มีการทดสอบ outage ในการเปรียบเทียบนี้</p>
<p>แบบจำลองประเมินการจัดเส้นทางและโหลดต่อกลุ่ม ไม่ได้ส่ง network request หรือยืนยันผลตอบกลับ ไม่วัด latency, throughput หรือเวลาที่ใช้ sync ข้อมูล การไม่เกินกำลังจึงไม่ใช่หลักฐานว่าทุกคำขอสำเร็จ</p></div>`;}
