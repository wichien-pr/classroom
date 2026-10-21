// One dictionary for contextual hints. Aliases share the same explanation.
const entries = [
 ['Logging|Centralized logs|Centralized logging','การบันทึกเหตุการณ์และรวบรวมจากหลายบริการเพื่อค้นหาที่ส่วนกลาง','ค้น error ของ Web และ Worker ในหน้ารวม','ไม่บันทึก secrets และไม่ถือว่าไม่มี log เท่ากับไม่มีปัญหา'],
 ['Metrics','ค่าตัวชี้วัดที่สรุปตามช่วงเวลาและขอบเขตที่กำหนด','CPU ระดับเครื่อง หรือ latency ของชั้นฐานข้อมูล','ต้องดูหน่วย ช่วงเวลา และ baseline ก่อนสรุป'],
 ['Automation','การกำหนดขั้นตอนให้เครื่องมือทำงานซ้ำอย่างสม่ำเสมอ','รัน build และ tests เมื่อมีการเปลี่ยนโค้ด','ขั้นตอนอัตโนมัติที่ผิดอาจขยายผลกระทบ ต้องมีเงื่อนไขหยุด'],
 ['Continuous integration|CI','การรวมการเปลี่ยนแปลงโค้ดพร้อมตรวจสอบอัตโนมัติอย่างสม่ำเสมอ','รัน tests ก่อนยอมรับการเปลี่ยนแปลง','CI ไม่เท่ากับ deploy production โดยอัตโนมัติ'],
 ['Data center|Data centers','ศูนย์ข้อมูลที่รวมระบบประมวลผล เครือข่าย และที่เก็บข้อมูล','US-East และ US-West มี Web, Database และ Cache แยกกันในภาพจำลอง','ชื่อ region ไม่ได้บอกจำนวนอาคารจริง ต้องตรวจ failure domains ของบริการที่ใช้'],
 ['Automated deployment','การนำโค้ดและ configuration ไปใช้งานด้วยกระบวนการอัตโนมัติที่ทำซ้ำได้','ปล่อยรุ่นที่ทดสอบแล้วไปแต่ละศูนย์ตามขั้น rollout','อัตโนมัติไม่ได้แปลว่าปลอดภัยเสมอ ต้องตรวจ compatibility และเตรียม rollback'],
 ['Asynchronous','ทำงานต่างจังหวะ โดยต้นทางไม่รอปลายทางทำเสร็จทั้งหมดก่อนดำเนินต่อ','ฐานข้อมูลหลักรับ write แล้วส่งข้อมูลให้ศูนย์สำรองภายหลัง','สำเนาอาจล้าหลังและข้อมูลล่าสุดอาจยังไม่ถึงเมื่อเกิด outage'],
 ['Stateful','เก็บสถานะที่คำขอถัดไปต้องใช้ไว้กับ server เดิม','session ของ A อยู่ที่ Web 1 จึงหาไม่พบเมื่อไป Web 2','Sticky routing ช่วยเลือกเครื่องเดิม แต่ไม่ได้ทำสำเนาสถานะหรือรับประกันว่าเครื่องจะไม่ล่ม'],
 ['Sticky session|Sticky routing|Sticky','นโยบายพยายามส่งคำขอของผู้ใช้เดิมกลับไปยัง server เดิม','คำขอของ A กลับไป Web 1 ที่มี session ของ A','ไม่ใช่การย้ายหรือสำรอง session; เมื่อเครื่องเดิมล่ม เครื่องอื่นอาจไม่มีสถานะนั้น'],
 ['Cookie|Cookies','ข้อมูลขนาดเล็กที่ browser เก็บและส่งไปยังเว็บไซต์ตามเงื่อนไขของ cookie','cookie อาจเก็บ session ID ให้ server ใช้ค้นบริบทผู้ใช้','ไม่ใช่ cookie ทุกตัวมีไว้ยืนยันตัวตน; session cookie ต้องมีการป้องกันและอายุที่เหมาะสม'],
 ['Shared store|Shared data store','ที่เก็บข้อมูลร่วมซึ่ง web หลายเครื่องเข้าถึงได้','Web 1 และ Web 2 อ่าน session A จาก store เดียวกัน','เป็น dependency ร่วมที่อาจล่มหรือเป็นคอขวด ต้องออกแบบ capacity และ recovery'],
 ['Authentication','การตรวจยืนยันว่าผู้ใช้เป็นใคร','ตรวจ session ที่สัมพันธ์กับ cookie ก่อนตอบโปรไฟล์','ต่างจาก authorization ซึ่งตรวจว่าผู้ใช้นั้นมีสิทธิ์ทำอะไร'],
 ['Autoscaling|Auto-scaling','การเพิ่มหรือลดทรัพยากรอัตโนมัติตามนโยบายและสัญญาณโหลด','เพิ่ม web instance เมื่อโหลดเกินเกณฑ์ และลดเมื่อโหลดต่ำ','ไม่เกิดทันทีและไม่แก้คอขวดของ shared store โดยอัตโนมัติ'],
 ['Redis','ระบบเก็บข้อมูลแบบ key-value และโครงสร้างข้อมูลที่ประมวลผลในหน่วยความจำ พร้อมตัวเลือก persistence','เก็บ session ที่ web หลายเครื่องเข้าถึงได้','ความทนทานและ failover ขึ้นกับการตั้งค่า ไม่รับประกันว่าไม่มีข้อมูลสูญหาย'],
 ['Memcached','ระบบ cache แบบ key-value ในหน่วยความจำสำหรับใช้งานร่วมกัน','เก็บข้อมูลที่สร้างใหม่ได้เพื่อลดการอ่าน DB','ข้อมูลอาจถูก evict หรือหายเมื่อ restart ไม่ใช่ที่เก็บถาวร'],
 ['Persistence','การเก็บข้อมูลให้คงอยู่ข้ามการสิ้นสุดของ process หรือการเริ่มระบบใหม่ตามกลไกที่ใช้','บันทึกข้อมูลจาก memory ลง storage','ต้องตรวจจังหวะการบันทึกและ failure ที่รองรับ ไม่ได้แปลว่าข้อมูลจะไม่มีวันหาย'],
 ['Expiry|Expiration','การหมดอายุตามเวลาหรือนโยบายที่กำหนด','session หมดอายุแล้วต้องยืนยันตัวตนใหม่','ต่างจากการที่ store ล่ม และไม่ใช่หลักประกันว่าข้อมูลถูกเก็บครบจนถึงเวลาหมดอายุ'],
 ['Recovery','กระบวนการกู้บริการหรือข้อมูลหลังความผิดพลาด','กู้ session store และตรวจว่าข้อมูลใดสูญหายก่อนเปิดรับงาน','ต้องมีแผนและทดสอบจริง; restart อย่างเดียวไม่ได้กู้ข้อมูลที่สูญไป'],
 ['Health check|Health checks','การตรวจสถานะเพื่อช่วยตัดสินใจว่าส่วนใดพร้อมรับงาน','LB หยุดส่งคำขอใหม่ไปยัง web ที่ตรวจว่าไม่พร้อม','การตรวจมีช่วงเวลาและขอบเขต; ผ่าน check ไม่ได้ยืนยันว่าทุก dependency พร้อม'],
 ['Client','ผู้เรียกใช้บริการ เช่น browser หรือ mobile app','client ส่งคำขอโปรไฟล์พร้อม cookie ไปยัง web','ต้องตรวจข้อมูลและสิทธิ์ฝั่ง server ไม่เชื่อข้อมูลจาก client โดยตรง'],
 ['HTTP','โพรโทคอลสื่อสารแบบคำขอและคำตอบที่ใช้กับเว็บ','client ส่ง GET เพื่อขอโปรไฟล์ แล้ว server ตอบสถานะและข้อมูล','HTTP อย่างเดียวไม่เข้ารหัสการส่งข้อมูล; งานจริงควรใช้ HTTPS'],
 ['Server|Servers|Web server','เครื่องหรือโปรแกรมที่ให้บริการคำขอจาก client','web server รับคำขอและเรียก session store','คำว่า server อาจหมายถึง process หรือเครื่อง ต้องดูขอบเขตและจุดล้มร่วม'],
 ['Benchmark','การทดสอบเพื่อวัดและเปรียบเทียบประสิทธิภาพภายใต้เงื่อนไขที่ระบุ','วัด latency และ throughput ด้วย workload ที่กำหนด','ค่าจำลองเพื่อการเรียนไม่ใช่ผล benchmark ของระบบจริง'],
 ['NoSQL','กลุ่มฐานข้อมูลนอกแบบ relational เช่น key-value, document, graph และ wide-column','รายละเอียดสินค้าอาจเก็บเป็นเอกสารหรือความสัมพันธ์เป็นกราฟตาม query','ไม่ใช่คำรับประกันว่าเร็วกว่า SQL; ความสามารถ JOIN และ transaction ต่างกันตามผลิตภัณฑ์'],
 ['SQL|RDBMS|Relational','ฐานข้อมูลเชิงสัมพันธ์จัดข้อมูลเป็นตารางและแถว; SQL เป็นภาษาสำหรับจัดการและค้นข้อมูล','เชื่อม customers กับ orders ตาม customer_id','ต้องออกแบบ schema และ index; SQL ก็เก็บ JSON ได้ในหลายผลิตภัณฑ์'],
 ['JOIN','การรวมข้อมูลจากหลายตารางตามเงื่อนไขความสัมพันธ์','หาเจ้าของ order โดยเชื่อม orders.customer_id กับ customers.id','ต้นทุนขึ้นกับข้อมูล index และ query plan ไม่ใช่ว่าทุก JOIN จะช้า'],
 ['Web tier','ชั้นที่รับคำขอ web/mobile และประมวลผล application','รับคำขออ่านสินค้าก่อนเรียก database','การเพิ่มทรัพยากร web ไม่ได้เพิ่มทรัพยากร database ตามอัตโนมัติ'],
 ['Data tier','ชั้นที่เก็บและให้บริการข้อมูล','database เก็บลูกค้า สินค้า และคำสั่งซื้อ','แยกเครื่องไม่ได้ทำให้มี backup หรือ failover โดยอัตโนมัติ'],
 ['Key-value','เก็บ value โดยอ้างอิง key','ค้น session ด้วย session ID','ต้องตรวจอายุข้อมูล durability และรูปแบบ query ที่รองรับ'],
 ['Document','เก็บข้อมูลเป็นเอกสารที่มีฟิลด์หรือข้อมูลซ้อนกัน','สินค้ามีคุณสมบัติต่างกันและอ่านเป็น JSON','ไม่ใช่ไม่มี schema; application ยังต้องตรวจรูปแบบและความถูกต้อง'],
 ['Graph','จัดข้อมูลเป็น nodes และ edges สำหรับสำรวจความสัมพันธ์','เดินความสัมพันธ์ลูกค้า–สินค้า–หมวดหมู่','SQL ก็เชื่อมความสัมพันธ์ได้ ต้องเลือกตาม query และวัดผล'],
 ['Wide-column','จัดข้อมูลด้วย partition และกลุ่มคอลัมน์ตามแบบของระบบ','กิจกรรมร้านตาม customer และช่วงเวลาใน Cassandra หรือ HBase','ไม่ใช่ columnar analytics; ต้องระวัง hotspot และออกแบบ key'],
 ['Request|Requests','คำขอที่ client ส่งให้ระบบทำงาน','Browser ส่งคำขออ่านสินค้าหรือสร้าง order','หนึ่งคำขออาจไปต่อหลายบริการ และอาจล้มเหลวระหว่างทาง'],
 ['Response','คำตอบที่ระบบส่งกลับให้ผู้เรียก','API คืนข้อมูล order หลังบันทึกสำเร็จ','ไม่ได้รับคำตอบ ไม่ได้พิสูจน์ว่างานยังไม่ถูกทำ'],
 ['Browser','โปรแกรมเปิดเว็บไซต์','ลูกค้าเปิดหน้าร้านผ่าน Chrome หรือ Safari','ข้อมูลและ cache ใน browser ไม่ใช่ฐานข้อมูลหลักของร้าน'],
 ['DNS|GeoDNS','ระบบแปลงชื่อโดเมนเป็นข้อมูลปลายทาง เช่น IP address; GeoDNS เลือกคำตอบตามตำแหน่งโดยประมาณ','ค้นหาว่า api.example.com ต้องเชื่อมต่อไปที่ใด','คำตอบอาจถูก cache จึงไม่ได้เปลี่ยนปลายทางของทุกคนทันที'],
 ['TLS|HTTPS','TLS ปกป้องข้อมูลระหว่างส่ง; HTTPS คือ HTTP ที่ใช้ TLS','เข้ารหัสข้อมูลคำสั่งซื้อระหว่าง browser กับ server','ไม่ได้แทนการตรวจสิทธิ์ หรือป้องกัน bug ภายใน application'],
 ['Application|App|Apps','โปรแกรมที่ประมวลผลกฎธุรกิจของระบบ','ตรวจสิทธิ์ลูกค้าและสร้างคำสั่งซื้อ','เพิ่ม app ไม่ได้ช่วยเสมอ หาก database เป็นคอขวด'],
 ['Database|DB','ฐานข้อมูลที่จัดเก็บและค้นคืนข้อมูลของระบบ','เก็บ order และ stock ที่ยืนยันแล้ว','ต้องออกแบบ transaction, backup และวิธีกู้คืน ไม่ใช่แค่ติดตั้งฐานข้อมูล'],
 ['Business logic','กฎการทำงานตามความต้องการธุรกิจ','ห้ามขายสินค้ามากกว่า stock ที่เหลือ','ทำงานเร็วแต่ผิดกฎ ยังถือว่าระบบไม่ถูกต้อง'],
 ['Timeout','หมดเวลารอที่กำหนดไว้ โดยยังไม่ได้ผลสำเร็จที่ยืนยันได้','API รอ database นานเกินเวลาที่กำหนด','ต่างจากไม่พบข้อมูล และ retry อาจทำให้เกิดงานซ้ำ'],
 ['Workload','ลักษณะและปริมาณงานที่ระบบต้องรับ','ช่วงแคมเปญมีการอ่านสินค้ามากและมีคำสั่งซื้อพุ่งพร้อมกัน','จำนวนผู้ลงทะเบียนอย่างเดียวบอก workload ไม่ได้'],
 ['Latency','ระยะเวลาที่งานหรือคำขอหนึ่งใช้จนได้ผล','เวลาที่ลูกค้ารอผล checkout','ค่าเฉลี่ยอาจซ่อนคำขอที่ช้ามาก'],
 ['Throughput|RPS','Throughput คืองานที่เสร็จต่อเวลา; RPS คือจำนวน request ต่อวินาที ต้องระบุว่าเป็นฝั่งรับหรือสำเร็จ','เทียบจำนวนคำสั่งซื้อสำเร็จกับคำขอที่ส่งเข้ามา','รับเข้ามาได้มากไม่ได้แปลว่าทำสำเร็จได้เท่ากัน'],
 ['Concurrency','จำนวนงานที่อยู่ระหว่างดำเนินการพร้อมกัน','หลายคำสั่งซื้อกำลังรอ database','งานที่ค้างมากอาจกิน memory และ connection จนเต็ม'],
 ['p95','เวลาที่ประมาณ 95% ของคำขอในกลุ่มที่วัดใช้ไม่เกินค่านี้','วัด p95 เฉพาะ endpoint สร้าง order ในช่วง peak','ต้องระบุช่วงเวลาและกลุ่มข้อมูล ไม่ใช่ค่าเฉลี่ย'],
 ['Endpoint','จุดรับคำขอของ API','POST /orders รับคำขอสร้างคำสั่งซื้อ','แต่ละ endpoint มีต้นทุนและข้อกำหนดไม่เท่ากัน'],
 ['Connection|Connections|Pool','Connection คือช่องทางเชื่อมต่อ; pool คือชุด connection ที่นำกลับมาใช้ซ้ำ','App ยืม connection จาก pool เพื่ออ่าน DB','เพิ่ม app หลายเครื่องอาจเปิด connection รวมเกินที่ DB รับได้'],
 ['Capacity','ความสามารถรองรับงานภายใต้เงื่อนไขที่กำหนด','โหลดที่ระบบยังรักษา latency และ error ตามเป้าหมาย','ต้องทดสอบกับ workload จริง ไม่อนุมานจากจำนวนเครื่องอย่างเดียว'],
 ['Transaction|Atomic transaction','กลุ่มการเปลี่ยนข้อมูลที่ commit หรือยกเลิกเป็นหน่วยเดียวตามขอบเขตฐานข้อมูล','ลด stock และสร้าง order ใน transaction เดียวกัน','ไม่ครอบคลุมอีเมลหรือบริการภายนอกโดยอัตโนมัติ'],
 ['Commit','ยืนยันการเปลี่ยนข้อมูลใน transaction','ยืนยันทั้ง order และการลด stock','การรับประกัน durability ขึ้นกับฐานข้อมูลและการตั้งค่า'],
 ['Idempotency|Idempotency key','ส่งคำขอเดิมซ้ำโดยไม่สร้างผลทางธุรกิจซ้ำ; key ใช้ระบุคำขอเดิม','เน็ตหลุดแล้วส่ง key เดิม ระบบคืน order เดิม','ต้องตรวจ payload และ scope ของลูกค้า ไม่ใช่เชื่อ key อย่างเดียว'],
 ['Payload|Fingerprint','Payload คือข้อมูลที่ส่ง; fingerprint ใช้ตรวจว่าข้อมูลคำขอเปลี่ยนหรือไม่','key เดิมแต่จำนวนสินค้าต่างกันต้องถูกตรวจพบ','ต้องกำหนดว่าจะเปรียบเทียบฟิลด์ใดและจัดรูปแบบอย่างไร'],
 ['Correctness|Business invariant|Global invariants','ความถูกต้องตามกฎที่ระบบต้องรักษาเสมอ','stock ห้ามติดลบแม้มีคำขอพร้อมกัน','throughput สูงไม่ชดเชยการขายเกิน stock'],
 ['Load balancer|LB','ตัวกระจายคำขอไปยัง server ที่เลือกตามนโยบายและสถานะ','เมื่อ A ล่ม ส่งคำขอใหม่ไป B ที่พร้อม','ไม่รับประกันว่างานที่ค้างบน A จะสำเร็จ และ LB เองต้องมี redundancy'],
 ['Backend','ส่วนประมวลผลเบื้องหลังที่รับงานจาก client หรือ proxy','App A และ B รับคำขอจาก load balancer','ความพร้อมของ process ไม่ได้แปลว่า dependency ทุกตัวพร้อม'],
 ['Readiness','การตรวจว่า instance พร้อมรับงานใหม่หรือไม่','ระหว่างเริ่ม app ยังไม่ส่ง traffic จนพร้อม','ต่างจาก liveness ที่ตรวจว่าควร restart process หรือไม่'],
 ['Draining','หยุดส่งงานใหม่และให้เวลางานเก่าทำจนจบ','ถอด App A ออกจาก traffic ก่อน deploy','ต้องมี timeout และรับมือคำขอที่ยังไม่จบ'],
 ['SPOF','Single Point of Failure: จุดเดียวที่เสียแล้วทำให้บริการที่พึ่งมันหยุด','App หลายเครื่องแต่มี DB เดียวที่ไม่มีทางสำรอง','หลายเครื่องใน failure domain เดียวกันอาจเสียพร้อมกัน'],
 ['Redundancy','มีส่วนสำรองเพื่อไม่พึ่งองค์ประกอบเดียว','มี app อีกเครื่องพร้อมรับงานเมื่อเครื่องหนึ่งเสีย','ส่วนสำรองต้องมี capacity และทดสอบสลับใช้งานจริง'],
 ['Stateless','ไม่ฝาก state สำคัญที่คำขอถัดไปต้องใช้ไว้กับ app instance เดียว','คำขอไป A หรือ B ก็อ่าน session จากที่ใช้ร่วมกันได้','ระบบยังมี state เพียงย้ายไปเก็บในแหล่งที่เหมาะสม'],
 ['State|Session|Shared session|Session store','State คือข้อมูลที่ต้องจำ; session ใช้จำบริบทผู้ใช้ระหว่างคำขอ; shared store ให้หลาย app เข้าถึงได้','Login ที่ A แล้ว B อ่าน session เดิมเพื่อรู้จักผู้ใช้','Shared store ก็ล่มได้ และต้องออกแบบอายุ session กับความปลอดภัย'],
 ['Instance','ตัวที่รันอยู่ของ application หรือบริการ','App A และ B เป็น app คนละ instance','local memory หรือ local disk ไม่ได้แชร์กันโดยอัตโนมัติ'],
 ['Durability|Durable storage','ความสามารถคงข้อมูลที่ยืนยันแล้วตามการรับประกันของระบบ','order ที่ยืนยันแล้วอยู่ต่อหลัง restart ตามสัญญาของ storage','ต้องระบุ failure ที่รองรับและทดสอบ restore'],
 ['Primary','ฐานข้อมูลหลักที่รับ write ในรูปแบบ primary/replica','สร้าง order บน primary แล้วอ่านผลล่าสุดจากที่เดียวกัน','primary อ่านได้ด้วย ไม่ได้เขียนได้อย่างเดียว'],
 ['Replica|Replication|Lag','Replica คือสำเนา; replication คือการส่งข้อมูลไปยังสำเนา; lag คือระยะที่สำเนายังตามไม่ทัน','เพิ่งสร้าง order บน primary แต่ replica ยังไม่มี order นั้น','Replication ไม่ใช่ backup เพราะการลบผิดอาจถูกส่งต่อ'],
 ['Failover|Failback','Failover คือเปลี่ยนไปใช้ส่วนสำรอง; failback คือย้ายกลับอย่างมีการควบคุม','เลื่อน replica เป็น primary หลังตรวจความพร้อม','ต้องป้องกัน writer สองฝั่งและตรวจข้อมูลที่อาจตามไม่ทัน'],
 ['Split brain|Fencing|Fence','Split brain คือหลายฝั่งคิดว่าตนเป็นผู้ควบคุม; fencing ตัดสิทธิ์ฝั่งเก่าเพื่อป้องกัน','ป้องกัน primary เก่ากลับมารับ write หลัง promote ตัวใหม่','เพียงติดต่อเครื่องเก่าไม่ได้ ไม่ได้แปลว่ามันหยุดทำงานแล้ว'],
 ['RPO|RTO','RPO คือขอบเขตข้อมูลย้อนหลังที่ยอมสูญเสีย; RTO คือเวลาที่ตั้งเป้ากู้บริการ','กำหนดเป้าหมายก่อนเลือก backup และ DR','มี replica อย่างเดียวไม่พิสูจน์ว่าทำได้ตามเป้าหมาย'],
 ['Cache|Cache-aside|In-memory cache','สำเนาข้อมูลที่ช่วยลดการอ่านหรือคำนวณซ้ำ; cache-aside ให้ app โหลดต้นทางเมื่อไม่มีสำเนา','เก็บรายละเอียดสินค้าเพื่อไม่อ่าน DB ทุกครั้ง','อาจคืนข้อมูลเก่า อย่าใช้ cached stock เป็นหลักฐานเดียวในการขาย'],
 ['Hit|Miss|Hit rate','Hit คือพบข้อมูลที่ใช้ได้ใน cache; miss คือไม่พบ; hit rate คือสัดส่วนที่พบ','อ่านสินค้าครั้งแรก miss แล้วครั้งถัดไป hit','hit ที่คืนข้อมูลผิดยังผิด ต้องวัดความถูกต้องด้วย'],
 ['Stale data|Stale read|Stale|TTL|Invalidate','Stale คือข้อมูลเก่า; TTL คืออายุ cache; invalidate คือทำให้สำเนาเดิมใช้ไม่ได้','แก้ราคาใน DB แล้ว invalidate เพื่ออ่านราคาใหม่','TTL ไม่รับประกันความสด และการอ่านพร้อมเขียนอาจเติมค่าเก่ากลับมา'],
 ['Source of truth','แหล่งข้อมูลหลักที่ใช้ตัดสินความถูกต้อง','DB เป็นแหล่งอ้างอิงราคากับ stock ไม่ใช่ cache','สำเนาที่อ่านเร็วกว่าไม่ได้มีอำนาจยืนยันธุรกิจเสมอ'],
 ['CDN|Origin|Static assets','CDN กระจายการส่งเนื้อหาจากจุดบริการ; origin คือต้นทาง; static assets เช่นรูป CSS และ JS','รูปสินค้าถูก cache ที่ CDN เพื่อลดโหลดต้นทาง','ข้อมูลส่วนบุคคลต้องมี cache policy ที่ป้องกันการแชร์ข้ามผู้ใช้'],
 ['Authorization','การตรวจว่าผู้ใช้มีสิทธิ์ทำสิ่งนั้นหรือไม่','ลูกค้าอ่านได้เฉพาะ order ของตน','login สำเร็จไม่ได้แปลว่ามีสิทธิ์อ่านข้อมูลทุกคน'],
 ['Queue|Message|Message queue','คิวเก็บงานหรือข้อความเพื่อให้ผู้รับประมวลผลภายหลัง','ส่งงานอีเมลหลังสร้าง order โดยไม่ต้องให้ลูกค้ารออีเมล','รับเข้าคิวแล้วไม่ได้แปลว่างานเสร็จหรือไม่มีวันสูญหาย'],
 ['Producer','ผู้สร้างข้อความแล้วส่งเข้าคิว','Web server ส่ง job ตัดภาพให้รอประมวลผล','ส่งสำเร็จไม่ได้แปลว่าภาพเสร็จแล้ว'],
 ['Consumer','ผู้รับข้อความจากคิวไปประมวลผล','Photo worker รับ job ไปทำภาพเบลอ','ต้องออกแบบ ack และงานซ้ำเมื่อใช้ broker จริง'],
 ['Backlog','งานที่รอประมวลผลในคิว','ส่ง 6 งาน ทำเสร็จ 1 เหลืองานรอ 5','ดูเวลารอร่วมกับจำนวน ไม่ใช่ขนาดคิวอย่างเดียว'],
 ['Worker|Publisher','Publisher ส่งงานเข้าคิว ส่วน worker รับไปประมวลผล','publisher ส่ง event ของ order ให้ worker ส่งอีเมล','ทั้งสองฝั่งล่มได้ ต้องออกแบบ acknowledgement และ retry'],
 ['Outbox','บันทึก event พร้อมข้อมูลธุรกิจใน transaction เดียว แล้วค่อยส่งออก','สร้าง order และ outbox event พร้อมกันเพื่อไม่ให้ order มีแต่งานส่งหาย','publisher ยังอาจส่ง event ซ้ำ ต้องรองรับการทำซ้ำ'],
 ['ACK|Acknowledgement','สัญญาณตอบรับ ต้องระบุว่ารับเข้าคิวหรือประมวลผลแล้ว','worker ACK หลังทำงานสำเร็จตามนโยบาย','ACK เร็วไปอาจสูญงาน ส่วนตายก่อน ACK อาจได้รับงานเดิมซ้ำ'],
 ['Side effect','ผลที่งานทำให้ข้อมูลหรือโลกภายนอกเปลี่ยน','ส่งอีเมล ตัด stock หรือเรียกชำระเงิน','retry อาจทำผลเหล่านี้ซ้ำถ้าไม่มี idempotency'],
 ['Retry|Redelivery|Dedup','Retry คือลองใหม่; redelivery คือส่งงานเดิมอีกครั้ง; dedup คือตรวจและระงับผลซ้ำ','worker ตายก่อน ACK แล้วได้รับงานเดิม แต่ใช้ receipt ป้องกันอีเมลซ้ำ','external side effect ต้องมีข้อตกลงกับ provider ไม่ใช่บันทึกว่าเสร็จเองแล้วจบ'],
 ['Dead letter|Dead-letter','พื้นที่แยกงานที่ประมวลผลไม่ผ่านตามเกณฑ์ retry','งานส่งอีเมลที่ผิดซ้ำถูกแยกให้ตรวจสอบ','ต้องมี owner และวิธี replay อย่างปลอดภัย ไม่ใช่ย้ายแล้วลืม'],
 ['Logs|Metrics|Traces|Trace','Logs บันทึกเหตุการณ์; metrics วัดแนวโน้ม; trace แสดงเส้นทางและเวลาของงานข้ามบริการ','ไล่ checkout ว่าช้าตอนรอ DB หรือเรียกบริการภายนอก','อย่าบันทึก secret และข้อมูลส่วนบุคคลเกินจำเป็น'],
 ['Rollback|Migration|Schema|Expand-contract','Schema คือโครงสร้างข้อมูล; migration เปลี่ยนโครงสร้าง; rollback ย้อนรุ่น; expand-contract ช่วยให้รุ่นเก่าใหม่อยู่ร่วมกัน','เพิ่ม field ใหม่ก่อนย้ายโค้ดมาใช้ แล้วจึงเลิก field เก่า','rollback app ไม่ได้ย้อน schema หรือข้อมูลให้อัตโนมัติ'],
 ['Region|AZ|Failure domain','Region คือพื้นที่บริการ; AZ คือโซนแยกภายใน region; failure domain คือขอบเขตที่อาจเสียร่วมกัน','วางส่วนสำรองต่างโซนเพื่อลดการเสียพร้อมกัน','หลาย instance บนจุดร่วมเดียวกันยังเสียพร้อมกันได้'],
 ['Sharding|Shard|Shards','แบ่งข้อมูลเป็นส่วน ๆ กระจายไปหลายฐานข้อมูล','ใช้ customer ID หา shard ที่เก็บ order ของลูกค้า','ต่างจาก replication ที่ทำสำเนาข้อมูลเดียวกัน'],
 ['Routing|Route|Shard router','เลือกปลายทางที่จะส่งคำขอหรือค้นข้อมูล','router ใช้ customer ID หา shard','เปลี่ยน mapping ไม่ได้ทำให้ข้อมูลย้ายตามเอง'],
 ['Hotspot|Access pattern','Access pattern คือรูปแบบการอ่านเขียน; hotspot คือจุดที่รับโหลดกระจุก','สินค้าชิ้นดังถูกอ่านมากกว่าชิ้นอื่น','จำนวน rows กระจายเท่ากันไม่ได้แปลว่าโหลดเท่ากัน'],
 ['Modulo','การหาค่าเศษจากการหาร ใช้สาธิตการเลือก shard','นำ customer ID หารจำนวน shard แล้วใช้เศษเป็นหมายเลขปลายทาง','เปลี่ยนจำนวน shard ทำให้ mapping เปลี่ยน ต้องมีแผนย้ายข้อมูล']
];

const dictionary = new Map();
for (const [aliases, meaning, example, warning] of entries) {
  const names=aliases.split('|');
  for (const alias of names) dictionary.set(alias.toLowerCase(), {title:names[0],meaning,example,warning});
}
const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const pattern = new RegExp(`(?<![A-Za-z0-9_])(${[...dictionary.keys()].sort((a,b)=>b.length-a.length).map(escapeRegex).join('|')})(?![A-Za-z0-9_])`,'gi');

export function installTermHints(root) {
  const hint=document.createElement('section');
  hint.id='term-hint';
  hint.setAttribute('popover','auto');
  hint.setAttribute('role','dialog');
  hint.setAttribute('aria-labelledby','term-hint-title');
  hint.innerHTML='<div class="term-hint-heading"><h2 id="term-hint-title"></h2><button type="button" aria-label="ปิดคำอธิบายศัพท์">ปิด ×</button></div><dl><dt>ความหมาย</dt><dd id="term-meaning"></dd><dt>ตัวอย่างในระบบ</dt><dd id="term-example"></dd><dt>ข้อควรระวัง</dt><dd id="term-warning"></dd></dl>';
  document.body.append(hint);
  let trigger=null;
  const close=()=>{hint.hidePopover();if(trigger?.isConnected)trigger.focus({preventScroll:true});};
  hint.querySelector('button').onclick=close;
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&hint.matches(':popover-open')){event.preventDefault();close();}});
  hint.addEventListener('toggle',()=>{if(trigger?.isConnected)trigger.setAttribute('aria-expanded',String(hint.matches(':popover-open')));});
  function position(){
    if(!hint.matches(':popover-open')||!trigger?.isConnected)return;
    const r=trigger.getBoundingClientRect(), w=hint.offsetWidth,h=hint.offsetHeight;
    hint.style.left=Math.max(12,Math.min(r.left,innerWidth-w-12))+'px';
    hint.style.top=Math.max(12,Math.min(r.bottom+8,innerHeight-h-12))+'px';
  }
  root.addEventListener('click',event=>{
    const button=event.target.closest('.term-trigger');if(!button)return;
    if(trigger===button&&hint.matches(':popover-open')){close();return;}
    if(trigger?.isConnected)trigger.setAttribute('aria-expanded','false');
    trigger=button;
    const entry=dictionary.get(button.dataset.term);
    hint.querySelector('h2').textContent=entry.title;
    hint.querySelector('#term-meaning').textContent=entry.meaning;
    hint.querySelector('#term-example').textContent=entry.example;
    hint.querySelector('#term-warning').textContent=entry.warning;
    hint.showPopover();trigger.setAttribute('aria-expanded','true');position();hint.querySelector('button').focus({preventScroll:true});
  });
  window.addEventListener('resize',position);
  document.addEventListener('scroll',position,true);
  const observer=new MutationObserver(enrich);
  function enrich(){
    observer.disconnect();
    if(trigger&&!trigger.isConnected){hint.hidePopover();trigger=null;}
    // Only explanatory prose, never navigation, input labels, quizzes or action buttons.
    for(const target of root.querySelectorAll('.dc-diagram p, .dc-dns strong, .dc-tier, .dc-data > div, .objective, .teaching > section > p:not(.eyebrow), .experiment p, .lesson-steps li, .lesson-intro > p:not(.eyebrow), .lesson-card-pair > div, .lesson-notes p, .lesson-notes li, .flow-steps li, .flow-intro > p:not(.eyebrow), #flow-details p, .flow-comparison figcaption, .flow-client-pair > div, .flow-comparison > p, .web-steps li, .web-intro > p:not(.eyebrow), #web-details p, .web-figure .web-box, .web-figure .web-path, #feedback, #outcome')){
      const walker=document.createTreeWalker(target,NodeFilter.SHOW_TEXT);
      const nodes=[];while(walker.nextNode())if(!walker.currentNode.parentElement.closest('button,a,code,pre,input,select,textarea,label'))nodes.push(walker.currentNode);
      const seen=new Set([...target.querySelectorAll('[data-term]')].map(x=>dictionary.get(x.dataset.term)?.title));
      for(const node of nodes){
        const text=node.textContent;pattern.lastIndex=0;let start=0,match;const fragment=document.createDocumentFragment();let changed=false;
        while((match=pattern.exec(text))){const key=match[0].toLowerCase(),entry=dictionary.get(key);if(seen.has(entry.title))continue;seen.add(entry.title);
          fragment.append(document.createTextNode(text.slice(start,match.index)));
          const button=document.createElement('button');button.type='button';button.className='term-trigger';button.dataset.term=key;button.textContent=match[0];button.setAttribute('aria-label','อธิบายคำศัพท์ '+match[0]);button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls',hint.id);button.setAttribute('aria-expanded','false');fragment.append(button);start=match.index+match[0].length;changed=true;
        }
        if(changed){fragment.append(document.createTextNode(text.slice(start)));node.replaceWith(fragment);}
      }
    }
    observer.observe(root,{childList:true,subtree:true,characterData:true});
  }
  enrich();
}
