// Historical 2010 reference, kept separate from the later 2020 illustration.
export const latencyOptions=[
 [.5,'L1 cache · 0.5 ns'],[5,'Branch mispredict · 5 ns'],[7,'L2 cache · 7 ns'],
 [100,'Memory / Mutex · 100 ns'],[10000,'Zippy 1K bytes · 10 µs'],[20000,'ส่ง 2K bytes / 1 Gbps · 20 µs'],
 [250000,'อ่าน memory 1 MB · 250 µs'],[500000,'Datacenter ไป–กลับ · 500 µs'],
 [10000000,'Disk seek / อ่าน network 1 MB · 10 ms'],[30000000,'อ่าน disk 1 MB · 30 ms'],[150000000,'California–Netherlands ไป–กลับ · 150 ms'],
];
export const latencyReference=[
 {id:'l1',label:'อ่าน L1 cache',detail:'หน่วยความจำแคชใกล้แกนประมวลผล',ns:.5,time:'0.5 ns'},
 {id:'branch',label:'Branch mispredict',detail:'CPU คาดเดาเส้นทางคำสั่งผิด',ns:5,time:'5 ns'},
 {id:'l2',label:'อ่าน L2 cache',detail:'แคชอีกระดับก่อนเข้าหน่วยความจำหลัก',ns:7,time:'7 ns'},
 {id:'mutex',label:'Mutex lock/unlock',detail:'ล็อก/ปลดล็อกเพื่อควบคุมการเข้าถึงร่วมกัน',ns:100,time:'100 ns'},
 {id:'memory',label:'อ่านหน่วยความจำหลัก',detail:'Main memory reference',ns:100,time:'100 ns'},
 {id:'compress',label:'บีบอัด 1K bytes ด้วย Zippy',detail:'ลดขนาดข้อมูลด้วยอัลกอริทึมบีบอัดแบบรวดเร็ว',ns:10000,time:'10,000 ns = 10 µs'},
 {id:'send',label:'ส่ง 2K bytes ผ่านเครือข่าย 1 Gbps',detail:'อ้างอิงการส่งข้อมูลขนาดเล็ก ไม่ใช่เวลาไป–กลับ',ns:20000,time:'20,000 ns = 20 µs'},
 {id:'memory-read',label:'อ่าน 1 MB ต่อเนื่องจาก memory',detail:'Sequential read: อ่านข้อมูลตามลำดับ',ns:250000,time:'250,000 ns = 250 µs'},
 {id:'datacenter',label:'ไป–กลับใน datacenter เดียวกัน',detail:'Round trip: ส่งคำขอและรอการตอบกลับ',ns:500000,time:'500,000 ns = 500 µs'},
 {id:'disk-seek',label:'Disk seek',detail:'เลื่อนหัวอ่าน HDD ไปยังตำแหน่งข้อมูล ไม่ใช่การอ่านต่อเนื่อง',ns:10000000,time:'10,000,000 ns = 10 ms'},
 {id:'network-read',label:'อ่าน 1 MB ต่อเนื่องจาก network',detail:'เวลารวมสำหรับข้อมูล 1 MB ไม่ใช่ latency ของ packet เดียว',ns:10000000,time:'10,000,000 ns = 10 ms'},
 {id:'disk-read',label:'อ่าน 1 MB ต่อเนื่องจาก disk',detail:'Sequential disk read',ns:30000000,time:'30,000,000 ns = 30 ms'},
 {id:'intercontinental',label:'California → Netherlands → California',detail:'ส่ง packet ไป–กลับข้ามทวีป',ns:150000000,time:'150,000,000 ns = 150 ms'},
];

export function renderLatencyReference(){
 return `<section class="latency-reference" aria-label="ตารางและหลักคิดเรื่อง latency">
  <div class="latency-units"><h2>อ่านหน่วยเวลาให้ตรงกัน</h2><dl>
   <div><dt>ns · nanosecond</dt><dd>นาโนวินาที<br>1 ns = 10⁻⁹ วินาที</dd></div>
   <div><dt>µs · microsecond</dt><dd>ไมโครวินาที<br>1 µs = 10⁻⁶ วินาที = 1,000 ns</dd></div>
   <div><dt>ms · millisecond</dt><dd>มิลลิวินาที<br>1 ms = 10⁻³ วินาที = 1,000 µs = 1,000,000 ns</dd></div>
  </dl></div>
  <table aria-describedby="latency-table-note"><caption>เวลาอ้างอิงของงานคอมพิวเตอร์ · ชุดปี 2010</caption>
   <thead><tr><th scope="col">งานที่ทำ</th><th scope="col">เวลาอ้างอิง</th></tr></thead>
   <tbody>${latencyReference.map(r=>`<tr data-ns="${r.ns}"><th scope="row">${r.label}<small>${r.detail}</small></th><td>${r.time}</td></tr>`).join('')}</tbody>
  </table>
  <p id="latency-table-note">ใช้ดูว่างานใดเร็วหรือช้าต่างกันกี่เท่า ไม่ใช่เวลารับประกันของทุกเครื่อง การเข้าถึงข้อมูลหนึ่งตำแหน่ง การอ่าน 1 MB และการไป–กลับของเครือข่ายเป็นคนละงาน ต้องดูขนาดข้อมูลและเงื่อนไขควบคู่กับตัวเลข</p>
  <section class="latency-insights" aria-label="หลักคิดจากการเปรียบเทียบ"><h2>นำตัวเลขไปใช้คิดเรื่องระบบอย่างไร</h2><ol>
   <li><strong>Memory เร็วกว่า disk ในตัวอย่างนี้</strong> — ลดการอ่าน disk ที่ไม่จำเป็นด้วยข้อมูลในหน่วยความจำ แต่ต้องคำนึงถึงพื้นที่และความสดของข้อมูล</li>
   <li><strong>หลีกเลี่ยง disk seek ที่ไม่จำเป็น</strong> — การอ่าน HDD ตามลำดับช่วยลดการเลื่อนหัวอ่าน ส่วน SSD ไม่มีหัวอ่านแบบนี้ แต่ยังมีต้นทุน I/O</li>
   <li><strong>การบีบอัดแบบง่ายใช้เวลาไม่มากในตัวอย่าง</strong> — Zippy 1K bytes ใช้ 10 µs ในชุดปี 2010 ไม่ได้แปลว่าทุกอัลกอริทึมหรือทุกขนาดข้อมูลใช้เวลาเท่ากัน</li>
   <li><strong>พิจารณาบีบอัดก่อนส่งผ่านอินเทอร์เน็ต</strong> — ใช้เมื่อเวลาส่งที่ประหยัดได้มากกว่าเวลาบีบอัดและคลายข้อมูล ต้องวัดกับข้อมูลจริง</li>
   <li><strong>ระยะทางระหว่าง datacenter มีผล</strong> — การไป–กลับข้ามทวีปอาจใช้เวลามากกว่างานในเครื่องหลายลำดับขนาด ลดจำนวนรอบสื่อสารเมื่อทำได้</li>
  </ol></section>
  <details class="latency-era"><summary>ทำไมตัวเลขต่างยุคจึงไม่เหมือนกัน</summary><p>ตัวอย่างภาพปี 2020 แสดง L1 cache ประมาณ 1 ns, บีบอัด 1 KB ด้วย Zippy ประมาณ 2 µs และ disk seek ประมาณ 2 ms ต่างจากชุดปี 2010 ที่เป็น 0.5 ns, 10 µs และ 10 ms ตามลำดับ ตัวเลขเหล่านี้สะท้อนสมมติฐานของแต่ละยุค ไม่ใช่ผลทดสอบ hardware เดียวกัน และไม่ใช่ benchmark ปัจจุบัน เครื่องทดลองในบทนี้ไม่ได้นำค่าปี 2020 มาปนกับชุดปี 2010</p></details>
 </section>`;
}
