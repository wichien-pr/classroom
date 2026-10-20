// Supplementary shopping examples. Recommendations are starting points, not benchmarks.
export const databaseCases={
 orders:{title:'คำสั่งซื้อ: เชื่อม customers / orders / items',engine:'sql',reason:'Relational เก็บข้อมูลเป็น tables และ rows ใช้ SQL JOIN เชื่อมลูกค้ากับคำสั่งซื้อ เหมาะเป็นจุดเริ่มต้นเมื่อข้อมูลมีความสัมพันธ์',caveat:'ต้องออกแบบ schema, indexes และ transaction ให้ตรงกฎธุรกิจ ไม่ใช่เพียงเลือก SQL แล้วข้อมูลจะถูกต้องเอง'},
 session:{title:'Session: อ่านค่าจาก session ID',engine:'key-value',reason:'Key-value เหมาะให้เริ่มพิจารณาเมื่อรู้ key และต้องการอ่านหรือเขียน value โดยไม่ต้อง JOIN หลายตาราง',caveat:'ต้องตรวจ latency, TTL และ durability ของผลิตภัณฑ์จริง NoSQL ไม่ได้รับประกันว่าจะเร็วกว่า SQL เสมอ'},
 catalog:{title:'สินค้า: บันทึก JSON ที่มีคุณสมบัติต่างกัน',engine:'document',reason:'Document store จัดข้อมูลเป็นเอกสาร เหมาะให้ลองกับรายละเอียดสินค้าที่มีโครงสร้างแตกต่างและอ่านคืนเป็น document',caveat:'ต้องตรวจ validation และรูปแบบ query; relational บางระบบก็เก็บ JSON ได้ การใช้ JSON ไม่ได้บังคับว่าต้องเลือก NoSQL'},
 connections:{title:'สินค้า: สำรวจความสัมพันธ์หลายทอด',engine:'graph',reason:'Graph store เน้น nodes และ edges ช่วยให้เริ่มสำรวจเส้นทางความสัมพันธ์ เช่น ลูกค้า–สินค้า–หมวดหมู่',caveat:'ต้องตรวจ query และความลึกที่ต้องเดินจริง ไม่ใช่ทุกความสัมพันธ์จะต้องใช้ graph; SQL JOIN ยังเป็นตัวเลือก'},
 events:{title:'กิจกรรมร้าน: อ่านตาม customer และช่วงเวลา',engine:'column',reason:'Wide-column store เป็นจุดเริ่มต้นให้พิจารณาข้อมูลจำนวนมากที่ออกแบบ partition key และ query pattern ไว้ชัดเจน เช่น Cassandra / HBase',caveat:'ต้องวาง partition และหลีกเลี่ยง hotspot; wide-column ในบริบทนี้ไม่ใช่คำเดียวกับ columnar analytics และข้อมูลมากไม่ได้บังคับให้ใช้ NoSQL'}
};
export const databaseEngines={sql:'Relational / SQL', 'key-value':'NoSQL · Key-value',document:'NoSQL · Document',graph:'NoSQL · Graph',column:'NoSQL · Wide-column'};
export const databaseInitial=()=>({layout:'split',web:1,data:1,available:true,scenario:'orders',engine:'sql'});
export function databaseControls(){
 return `<label>การวางระบบ<select id="db-layout"><option value="split">แยก Web tier / Data tier</option><option value="single">เครื่องเดียว · ทรัพยากรร่วม</option></select></label>
 <label>ทรัพยากร Web tier (หน่วยสมมติ)<input id="web-size" type="number" min="1" max="4" step="1" value="1"></label>
 <label>ทรัพยากร Data tier (ใช้เมื่อแยกชั้น)<input id="data-size" type="number" min="1" max="4" step="1" value="1"></label>
 <label class="check"><input id="db-available" type="checkbox" checked> Database พร้อมใช้งาน</label>
 <label>โจทย์ร้านค้า<select id="db-scenario">${Object.entries(databaseCases).map(([k,v])=>`<option value="${k}">${v.title}</option>`).join('')}</select></label>
 <label>ฐานข้อมูลที่จะลอง<select id="db-engine">${Object.entries(databaseEngines).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>
 <button type="button" id="estimate" data-action="estimate">ทดลองสถาปัตยกรรมและตัวเลือก DB</button>`;
}
export function databaseDiagram(config){
 const r=evaluateDatabase(config);
 return `<figure class="database-diagram" aria-label="Client ถาม DNS รับ IP แล้วเรียก Web tier; Web tier ติดต่อ Data tier">
 <div class="db-client"><strong>Browser / Mobile app</strong><span>www.example.test / api.example.test</span></div>
 <div class="db-arrow">↓ ถามชื่อ · DNS ภายนอก · คืน IP ↑</div>
 <p class="db-note">เมื่อได้ IP: client ส่งคำขอตรงไป Web tier<br>DNS ไม่ส่งต่อ HTTP และ client ไม่เชื่อม DB โดยตรง</p>
 <div class="db-arrow">↓ HTTP request · response ↑</div>
 <div class="db-hosts ${r.independent?'split':'single'}" data-layout="${config.layout}">
 <div class="db-tier" data-tier="web"><small>${r.independent?'เครื่อง Web':'ส่วน Web ในเครื่องเดียว'}</small><strong>Web tier</strong><span>รับ traffic / application logic</span><b>ทรัพยากร ${r.web} หน่วย</b></div>
 <div class="db-arrow">↓ read / write / update<br>↑ return data</div>
 <div class="db-tier ${r.ready?'':'unavailable'}" data-tier="data"><small>${r.independent?'เครื่อง Database':'ส่วน DB ในเครื่องเดียว'}</small><strong>Data tier</strong><span>${databaseEngines[config.engine]}</span><b>ทรัพยากร ${r.data} หน่วย · ${r.ready?'พร้อม':'ไม่พร้อม'}</b></div>
 </div><figcaption>${r.independent?'แยกเครื่อง: ปรับทรัพยากรแต่ละชั้นได้อิสระ':'กรอบเดียว: Web / Database ใช้ทรัพยากรของเครื่องร่วมกัน'}<br>ภาพแนวคิด ไม่ใช่ topology ที่ deploy จริง; ไม่มี replication หรือ failover อัตโนมัติ</figcaption></figure>`;
}
export function databaseNotes(){return `<section class="database-notes"><h2>เลือกจากข้อมูล ไม่ใช่กระแส</h2><p>SQL: tables / rows / JOIN เช่น MySQL, Oracle, PostgreSQL<br>NoSQL: Key-value (เช่น DynamoDB), Document (เช่น CouchDB), Graph (เช่น Neo4j), Wide-column (เช่น Cassandra, HBase) ผลิตภัณฑ์บางตัวรองรับหลายรูปแบบ</p><h3>เมื่อใดควรสำรวจ NoSQL?</h3><ul><li>ต้องการ latency ต่ำมาก</li><li>ข้อมูลไม่เป็นโครงสร้าง หรือไม่ต้องเชื่อมความสัมพันธ์แบบตาราง</li><li>เน้น serialize / deserialize เช่น JSON, XML, YAML</li><li>ต้องเก็บข้อมูลปริมาณมหาศาล</li></ul><p>ทั้งหมดเป็นเหตุให้พิจารณา ไม่ใช่กฎว่าต้องย้าย: SQL ก็รองรับ JSON และข้อมูลจำนวนมากได้ ส่วน NoSQL บางผลิตภัณฑ์มี JOIN หรือ query ความสัมพันธ์ ต้องตรวจความสามารถจริง</p><h3>ตัวอย่างเสริม: JOIN ของร้านค้า</h3><pre>customers: id=12, name=Somchai\norders: id=101, customer_id=12\nJOIN → order 101 ของ Somchai</pre><p>ตัวอย่างจำลองการเชื่อมตาราง ไม่ได้รัน SQL จริง ไม่ให้เขียน query หรือเชื่อมฐานข้อมูลบัญชีผู้เรียน</p><p>หน้าที่ทีมพัฒนา: วัด access pattern และ latency เป้าหมาย ตรวจ consistency / transaction, indexes, backup และทดสอบกู้คืนก่อนเลือกใช้จริง</p></section>`;}
// Units are abstract resource allocations, not server counts, replicas or measured capacity.
export function evaluateDatabase({layout,web,data,available,scenario,engine}) {
 if(!['single','split'].includes(layout) || ![web,data].every(n=>Number.isInteger(n)&&n>=1&&n<=4) || typeof available!=='boolean') throw Error('กรุณากำหนดทรัพยากร 1–4 หน่วย');
 if(!Object.hasOwn(databaseCases,scenario)||!Object.hasOwn(databaseEngines,engine)) throw Error('กรุณาเลือกโจทย์และฐานข้อมูลที่รองรับ');
 const independent=layout==='split', c=databaseCases[scenario];
 return {web,data:independent?data:web,independent,ready:available,fit:c.engine===engine,reason:c.reason,caveat:c.caveat};
}
