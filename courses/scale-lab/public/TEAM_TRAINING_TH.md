# จากระบบเครื่องเดียวสู่ระบบที่รองรับการเติบโต
## คู่มือสอนทีมพัฒนา: System Design ที่เชื่อมกับการเขียนโค้ดและการดูแล Production

เอกสารนี้เรียบเรียงจากบท **Scale From Zero To Millions Of Users** ของ ByteByteGo ที่บันทึกไว้ในโฟลเดอร์นี้ โดยบทต้นฉบับพาระบบจาก single server ไปสู่ load balancer, replication, cache, CDN, stateless web tier, multiple data centers, queue และ sharding.[1]

นี่ไม่ใช่คำแปลทีละย่อหน้า แต่เป็นบทเรียนภาษาไทยพร้อมกรณีศึกษาและแบบฝึกหัดสำหรับทีมพัฒนา ส่วนคำแนะนำเชิง production ตัวอย่างระบบ แบบฝึกหัด และเกณฑ์ประเมิน เป็นเนื้อหาเสริมของผู้เรียบเรียง ไม่ใช่ข้อความหรือผลทดสอบจาก ByteByteGo ไม่ได้เปิดอ่านเอกสารภายนอกที่อยู่ในรายการอ้างอิงท้ายบท และไม่ได้ตรวจภาพต้นฉบับด้วยสายตา แผนภาพตัวอักษรในเอกสารนี้เขียนขึ้นใหม่จากเนื้อหาที่อ่าน

---

## 1. เป้าหมายและวิธีใช้เอกสาร

### เมื่อเรียนจบ ทีมควรทำได้

- ไล่เส้นทาง request และระบุว่าข้อมูลสำคัญถูกเก็บไว้ที่ใด
- แยกปัญหา latency, throughput, availability และ correctness ออกจากกัน
- ใช้ข้อมูลวัดจริงเลือกการปรับปรุง แทนการเพิ่มเครื่องมือเพราะเห็นใน architecture diagram
- ออกแบบ API, database access, cache และ background job ให้รับมือการทำงานซ้ำและความล้มเหลว
- อธิบาย trade-off และระบุวิธีทดสอบก่อนนำขึ้น production

### พื้นฐานที่ควรมี

เข้าใจ HTTP API, SQL เบื้องต้น, transaction, การรัน application และการอ่าน log หากยังไม่เคย deploy ให้ผู้สอนสาธิต request ตั้งแต่ browser จนถึง database ก่อน

### รูปแบบการสอนที่แนะนำ

แบ่งเป็น 4 ครั้ง โดยปรับระยะเวลาตามพื้นฐานของทีม:

| ครั้ง | หัวข้อ | ผลงานของผู้เรียน |
|---|---|---|
| 1 | Request flow, workload, database และ bottleneck | แผนภาพระบบเริ่มต้นและรายการ metrics |
| 2 | Load balancing, stateless, replication, cache, CDN | แผนภาพที่อธิบาย failure และ stale data ได้ |
| 3 | Queue, observability, deployment, multi-region, sharding | แผนรับมือ failure และเหตุผลว่าอะไรยังไม่ควรเพิ่ม |
| 4 | Workshop ออกแบบและทดสอบ | Architecture decision และแผนทดสอบพร้อม acceptance criteria |

**วิธีสอน:** เปิดด้วยอาการเสีย → ให้ทีมเสนอสมมติฐาน → เลือก metric ตรวจสอบ → จึงอธิบายเครื่องมือ → ปิดด้วยข้อเสียและ failure test

---

## 2. กรณีศึกษาที่ใช้ตลอดบท: ระบบสั่งซื้อสินค้า

เราใช้ระบบสมมติที่มีความสามารถดังนี้:

- ลูกค้าเปิดดูสินค้าและรูปภาพ
- ลูกค้า login และจัดการตะกร้า
- ลูกค้าสร้างคำสั่งซื้อและตัดสต็อก
- ระบบสร้างใบยืนยันและส่งอีเมลภายหลัง
- เจ้าหน้าที่เปิดดูสถานะคำสั่งซื้อ

ไม่รวม payment gateway จริงใน workshop เพื่อไม่ให้ความซับซ้อนด้านการชำระเงินบดบังบทเรียนหลัก หากระบบจริงมีการจ่ายเงิน ต้องออกแบบสถานะ payment, webhook, reconciliation และ idempotency เพิ่ม

### ข้อตกลงด้านความถูกต้อง

1. ห้ามขายสินค้าจน stock ติดลบ
2. การ retry คำขอสั่งซื้อเดิมต้องไม่สร้าง order ใหม่โดยไม่ตั้งใจ
3. ลูกค้าต้องไม่เห็นข้อมูล order ของผู้อื่น
4. อีเมลล่าช้าได้ตามเงื่อนไขธุรกิจ แต่ order ที่ตอบรับแล้วต้องมีหลักฐานถาวรตาม durability ที่ระบบรับรอง
5. ราคาบนหน้ารายการอาจคลาดเคลื่อนช่วงสั้นได้ถ้าธุรกิจยอมรับ แต่ต้องตรวจราคาและ stock อีกครั้งตอนสั่งซื้อ

**คำถามเปิด:** ถ้าเพิ่ม server แล้วรับคำสั่งซื้อได้เร็วขึ้น แต่ stock ติดลบ ระบบถือว่าดีขึ้นหรือไม่?

**แนวตอบ:** ดีขึ้นด้าน capacity แต่ผิดด้าน correctness จึงยังไม่ผ่านความต้องการ

---

## 3. บทเรียนที่ 1 — เข้าใจ request ก่อนเพิ่มเครื่อง

ต้นฉบับเริ่มด้วย web application และ database บนเครื่องเดียว แล้วแยก web tier ออกจาก data tier เพื่อให้ขยายทรัพยากรได้แยกกัน.[1]

```text
Browser / Mobile
   | resolve hostname ผ่าน DNS (อาจมีผลที่ cache ไว้)
   | HTTPS request
   v
Application
   | SQL query / transaction
   v
Database
   |
   +---- response กลับทาง application
```

### สิ่งที่ต้องเข้าใจ

- DNS ใช้ค้นหาปลายทาง ไม่ได้ประมวลผล business logic และไม่จำเป็นต้องถูกเรียกใหม่ทุก request
- HTTPS มี TLS เพื่อปกป้องข้อมูลระหว่างทาง
- Application ตรวจ authentication, authorization, input และกฎธุรกิจ
- Database เก็บข้อมูลและบังคับข้อจำกัด เช่น unique constraint และ transaction
- Response ที่ช้าอาจเกิดจาก network, application, query, lock หรือบริการภายนอก ไม่ใช่ CPU อย่างเดียว

### ทำไมเริ่มจากระบบง่ายจึงสมเหตุสมผล

เครื่องเดียวหรือ deployment ที่เรียบง่ายช่วยให้พัฒนา debug และ deploy ได้ง่ายกว่า แต่ต้องรับรู้ว่าความเสียหายของเครื่องอาจกระทบทุกส่วน และ application กับ database แย่ง CPU, RAM และ I/O กัน

การแยก database เป็นอีกเครื่องทำให้ปรับขนาดแยกได้ แต่เพิ่ม network latency, connection handling และการดูแลความปลอดภัย จึงไม่ใช่การเร่งระบบทุกกรณี

### สิ่งที่ developer ต้องทำตั้งแต่ต้น

- แยก configuration และ secret ออกจาก source code
- ตั้ง connection pool และ timeout ให้มีขอบเขต
- ทำ schema migration แบบมีการควบคุม
- เก็บ log ที่ระบุ request ได้ โดยไม่บันทึกรหัสผ่าน token หรือข้อมูลส่วนบุคคลเกินจำเป็น
- สำรองข้อมูลและทดลอง restore

**ตรวจความเข้าใจ:** Database timeout ต่างจาก query ไม่พบข้อมูลอย่างไร และ API ควรตอบเหมือนกันหรือไม่?

**แนวตอบ:** Timeout แปลว่ายังไม่ได้ข้อสรุป ส่วน not found คืออ่านสำเร็จแต่ไม่พบข้อมูล การเปลี่ยน timeout ให้เป็น not found ทำให้ client เข้าใจผิดและอาจดำเนินธุรกิจผิด

---

## 4. บทเรียนที่ 2 — วัด workload ไม่ใช่นับผู้ใช้เพียงอย่างเดียว

### คำศัพท์ที่ต้องแยกให้ชัด

| คำ | ความหมาย | ตัวอย่างคำถาม |
|---|---|---|
| Latency | เวลาที่ใช้ต่อ request | Checkout ช้าตรงขั้นตอนไหน? |
| Throughput | จำนวนงานที่ระบบทำเสร็จต่อหน่วยเวลา | รับคำสั่งซื้อสำเร็จได้มากแค่ไหน? |
| Concurrency | งานที่กำลังค้างอยู่พร้อมกัน | มี request รอ database กี่งาน? |
| Availability | ความพร้อมใช้งานตามนิยามที่ตกลง | ผู้ใช้ทำรายการสำคัญสำเร็จหรือไม่? |
| Correctness | ผลลัพธ์เป็นไปตามกฎธุรกิจ | Stock ติดลบหรือเกิด order ซ้ำหรือไม่? |
| Durability | ข้อมูลที่ยืนยันแล้วคงอยู่ได้ตามสัญญาระบบ | Restart หรือ failover แล้ว order ยังอยู่หรือไม่? |

p95 latency คือ percentile ที่ request ประมาณ 95% มีเวลาไม่เกินค่านั้น ต้องระบุ endpoint, ช่วงเวลา และประชากรของข้อมูลด้วย อย่าใช้ค่าเฉลี่ยอย่างเดียว เพราะกลุ่มผู้ใช้ที่ช้ามากอาจถูกซ่อนไว้

### จำนวนผู้ใช้ไม่ใช่เกณฑ์บังคับเปลี่ยน architecture

ผู้ใช้ที่ลงทะเบียนจำนวนมากแต่ใช้งานน้อย อาจสร้างโหลดต่ำกว่าระบบเล็กที่มี burst รุนแรง ต้องรู้:

- Request rate เฉลี่ยและช่วง peak
- สัดส่วน read/write และ endpoint ที่ใช้งานมาก
- ขนาด payload และ data growth
- ระยะเวลาของ query และ transaction
- ปริมาณ connection, lock wait และบริการภายนอกที่ต้องรอ
- รูปแบบ hotspot เช่นทุกคนเปิดสินค้าชิ้นเดียวกัน

สูตรสำหรับตั้งสมมติฐาน ไม่ใช่ผล benchmark:

```text
Average RPS = จำนวน requests ในช่วงเวลาที่วัด / จำนวนวินาทีในช่วงนั้น

สำหรับระบบที่อยู่ในภาวะคงตัวโดยประมาณ:
Average in-flight requests ≈ Throughput × Average response time

DB connections ที่อาจเปิดจาก app ≈ จำนวน app instances × pool limit ต่อ instance
```

สูตร connection เป็นเพียงประมาณการของเพดานฝั่ง app ต้องนับ worker, admin, migration และบริการอื่นด้วย รวมถึงตรวจว่า pool เปิดล่วงหน้าหรือเปิดตามใช้งาน

**กิจกรรม:** ให้ทีมเลือก endpoint จริงของตนและระบุว่า metric ใดช่วยแยก CPU bottleneck ออกจาก database lock โดยยังไม่เลือกเครื่องมือแก้ปัญหา

---

## 5. บทเรียนที่ 3 — เลือก database จากข้อมูลและข้อกำหนด

ต้นฉบับเปรียบเทียบ relational database กับ NoSQL และเสนอ relational database เป็นจุดเริ่มต้นที่เหมาะกับหลายระบบ.[1]

สำหรับระบบตัวอย่าง เริ่มด้วย relational database ได้อย่างสมเหตุสมผล เพราะ order, order item และ stock มีความสัมพันธ์และต้องการ transaction

### อย่าเลือกจากคำโฆษณา

- SQL ไม่ได้แปลว่า scale ไม่ได้
- NoSQL ไม่ได้แปลว่าเร็วกว่าเสมอ และความสามารถด้าน join/transaction แตกต่างตามผลิตภัณฑ์
- เก็บ JSON ได้ ไม่ได้แปลว่าต้องใช้ document database
- ข้อมูลจำนวนมากอย่างเดียวไม่พอสำหรับเลือก database ต้องรู้ access pattern, consistency และ operational requirements

### ตัวอย่างตัด stock อย่างมีเงื่อนไข

Pseudocode ต่อไปนี้แสดงแนวคิด ไม่ใช่โค้ดพร้อมใช้ทุก database:

```sql
BEGIN;

UPDATE inventory
SET available = available - :qty
WHERE sku = :sku
  AND available >= :qty;

-- ต้องตรวจ affected rows ถ้าไม่สำเร็จให้ rollback
-- ต้อง validate :qty > 0 ก่อน และบังคับ invariant ใน DB ตามที่รองรับ

INSERT INTO orders (...);
INSERT INTO order_items (...);

COMMIT;
```

การอ่าน stock ก่อนแล้วค่อยเขียนโดยไม่มี concurrency control เปิดช่องให้ request หลายตัวเห็น stock เดิมพร้อมกัน สำหรับหลาย SKU ควรวางลำดับการล็อกให้สม่ำเสมอและรับมือ deadlock ด้วย bounded retry ของ transaction ทั้งชุดตามเงื่อนไข

เพิ่ม unique constraint สำหรับ idempotency key ตาม scope ที่กำหนด เช่นต่อ customer พร้อมเก็บ request fingerprint และผลลัพธ์เดิม เพื่อให้ key เดิมที่ payload ต่างกันถูกปฏิเสธ ไม่ใช่คืนผลเดิมแบบผิดบริบท

**ตรวจความเข้าใจ:** Index ช่วยทุก query และไม่มีต้นทุนจริงหรือ?

**แนวตอบ:** ไม่จริง Index ต้องสอดคล้องกับ query และเพิ่มต้นทุน storage กับ write ควรดู execution plan และทดสอบกับการกระจายข้อมูลที่ใกล้จริง

---

## 6. บทเรียนที่ 4 — Scale up, scale out และ load balancer

ต้นฉบับแยก vertical scaling เป็นการเพิ่มทรัพยากรเครื่องเดิม และ horizontal scaling เป็นการเพิ่มเครื่อง พร้อมแนะนำ load balancer เพื่อกระจาย traffic ไปยัง web servers.[1]

| ทางเลือก | ใช้เมื่อ | ต้นทุนหรือข้อจำกัด |
|---|---|---|
| Optimize query/code | พบงานซ้ำ query แพง หรือ algorithm ไม่เหมาะ | ต้องวัดก่อนและตรวจ regression |
| Scale up | คอขวดที่ทรัพยากรเครื่องและยังขยายได้ | มีเพดาน อาจต้องหยุดบางช่วง |
| Scale out app | งานกระจายได้และ instance ไม่ผูก state | เพิ่ม connection และความซับซ้อน |
| ลดงานจาก request path | งานบางอย่างทำภายหลังได้ | ต้องออกแบบ async status และ failure |

```text
Client -> Load Balancer -> App A --+
                        -> App B --+--> Database
```

### Load balancer ทำอะไร และไม่ได้ทำอะไร

ช่วยเลือก backend ตาม routing policy และ health status แต่ไม่ได้รับประกันว่าโหลดจะเท่ากันพอดี หรือทำให้ request ที่กำลังทำอยู่ไม่ล้มเหลวเมื่อ backend ตาย

ต้องออกแบบ:

- Readiness check: instance พร้อมรับ traffic หรือไม่
- Liveness check: process อยู่ในสภาพต้อง restart หรือไม่
- Connection draining: หยุดรับงานใหม่และให้เวลางานเดิมจบระหว่าง deploy
- Timeout ที่สอดคล้องกันระหว่าง client, proxy, app และ downstream
- ความซ้ำซ้อนของ load balancer เอง ไม่ย้าย SPOF ไปอยู่ด้านหน้าแทน
- Capacity หลังเสียหนึ่ง failure domain ไม่ใช่มีหลายเครื่องแต่ทุกเครื่องเต็มอยู่แล้ว

อย่าให้ dependency เสียชั่วคราวทำให้ liveness restart ทุก instance พร้อมกัน และอย่าสมมติว่าการ retry POST ปลอดภัยโดยไม่มี idempotency

**Failure drill:** ปิด App A ระหว่างมี traffic ตรวจ request ที่กำลังทำอยู่ error rate, recovery และว่า App B รับโหลดที่เหลือไหวหรือไม่

---

## 7. บทเรียนที่ 5 — Stateless ไม่ได้แปลว่าไม่มี state

ต้นฉบับเสนอให้ย้าย session ออกจาก web server ไปยัง shared store เพื่อให้ request ไปยัง instance ใดก็ได้.[1]

```text
ไม่เหมาะกับการสลับ instance:
User -> App A [session อยู่ใน memory ของ A เท่านั้น]
     -> App B [ไม่รู้จัก session เดิม]

เหมาะกับการขยาย app:
User -> LB -> App A / App B -> Shared session store
                          -> Database
                          -> Object storage สำหรับไฟล์
```

### ความหมายที่ใช้ในการทำงานจริง

App instance ไม่ควรเป็นแหล่งเดียวของ state ที่ request ถัดไปจำเป็นต้องใช้ ระบบยังมี state แต่ย้ายไปอยู่ในที่ที่ lifecycle ไม่ผูกกับ instance

- Session: shared store พร้อม TTL และแผนเมื่อ store ใช้ไม่ได้
- รูปและไฟล์ upload: object storage หรือ shared durable storage
- Order: database
- Temporary file: ใช้ local disk ได้ถ้าทิ้งแล้วไม่เสียข้อมูลสำคัญ
- In-memory cache: ใช้ได้ถ้าเป็นข้อมูลที่สร้างใหม่ได้และยอมรับความต่างระหว่าง instance

Sticky session อาจใช้ได้ในบางกรณี แต่ไม่ใช่คำตอบของ durability หรือ failover ส่วน JWT ไม่ได้แก้ทุกเรื่อง เพราะยังต้องคิดเรื่อง revocation, expiration, key rotation และข้อมูลสิทธิ์ที่เปลี่ยนภายหลัง

**Acceptance test:** Login ผ่าน App A แล้วเรียก endpoint ผ่าน App B ต้องยังทำงานตามนโยบาย session และปิด App A แล้วไฟล์ที่ upload สำเร็จต้องไม่หาย

---

## 8. บทเรียนที่ 6 — Replication เพิ่มทางเลือก แต่เพิ่มเรื่อง consistency

ต้นฉบับเสนอ primary/replica เพื่อกระจาย read และรองรับการเปลี่ยนฐานข้อมูลหลักเมื่อมีปัญหา โดยเตือนว่าข้อมูล replica อาจยังตามไม่ทัน.[1]

```text
Write ------------------> Primary
                              |
                              | replication
                              v
Read ที่ยอมรับความเก่าได้ -> Replica
```

### ประเด็นที่ต้องสอนให้แม่น

- Primary โดยทั่วไปอ่านได้ด้วย ไม่ใช่เขียนได้อย่างเดียว
- Read replica ช่วยแบ่ง read load ไม่ได้ทำให้ single-primary write capacity เพิ่มโดยอัตโนมัติ
- Async replication มี lag และ failover อาจสูญเสีย write ล่าสุดที่ยังไม่ถึง replica
- Synchronous replication มี trade-off ด้าน latency และ availability ขึ้นกับการตั้งค่า
- Replication ไม่ใช่ backup เพราะการลบผิดหรือข้อมูลเสียอาจถูกส่งต่อไป replica
- Failover ต้องมีการเลือก primary และป้องกัน old primary กลับมารับ write จนเกิด split brain

### ตัวอย่าง read-after-write

ลูกค้าสร้าง order บน primary แล้วหน้า order ไปอ่าน replica ที่ยังตามไม่ทัน ผลคือดูเหมือน order หาย

แนวทางเลือกตามความต้องการ:

- อ่านข้อมูลสำคัญหลัง write จาก primary
- คืน representation ที่บันทึกสำเร็จใน response เพื่อลดการอ่านซ้ำทันที
- ใช้กลไกรอ replication position หากระบบรองรับและยอมรับ latency ได้
- สำหรับหน้าที่ไม่ critical อาจแสดงสถานะรอพร้อม retry แบบมีขอบเขต

การ pin อ่าน primary ชั่วระยะเวลาหนึ่งเป็น heuristic ไม่ใช่หลักประกัน หาก lag ยาวกว่าระยะเวลาที่ pin

### RPO และ RTO

- **RPO:** ยอมสูญเสียข้อมูลย้อนหลังได้มากเพียงใด
- **RTO:** ยอมให้ใช้เวลากู้บริการกลับมานานเพียงใด

ต้องกำหนดจากธุรกิจและทดสอบจริง การมี replica อย่างเดียวไม่ใช่หลักฐานว่าบรรลุ RPO/RTO

**Failure drill:** บันทึก order ระหว่างจำลอง replication lag และ failover แล้วตรวจทั้งสิ่งที่ client ได้รับกับข้อมูลหลัง recovery ไม่ตรวจแค่ process กลับมารัน

---

## 9. บทเรียนที่ 7 — Cache ลดงานซ้ำ แต่สร้างสำเนาข้อมูลที่อาจเก่า

ต้นฉบับแนะนำ cache เพื่อลด database load และอภิปราย TTL, consistency, eviction และ SPOF.[1]

### รูปแบบ cache-aside

```text
GET product
  -> App ตรวจ cache
       -> Hit: คืนข้อมูล
       -> Miss: App อ่าน DB -> เติม cache -> คืนข้อมูล
```

ใช้คำว่า **cache-aside** เมื่อ application เป็นคนอ่าน database และเติม cache เอง ส่วน **read-through** โดยทั่วไปหมายถึง cache abstraction เป็นผู้โหลดข้อมูลต้นทางให้ผู้เรียก ต้นฉบับใช้คำ read-through กับ flow ที่ app เป็นผู้จัดการ จึงควรสอนให้แยกจากผู้รับผิดชอบการโหลดข้อมูล

### เลือกสิ่งที่จะ cache

เหมาะกับ product description หรือผลคำนวณที่ใช้ซ้ำและยอมรับความเก่าได้ ไม่ควรใช้ stock ใน cache เป็นหลักฐานเดียวในการยืนยันการขาย

กำหนดให้ชัด:

1. Source of truth คืออะไร
2. Cache key มี tenant/user/locale/permission scope ที่จำเป็นหรือไม่
3. ยอมรับข้อมูลเก่านานเท่าไร
4. เมื่อ update จะ invalidate หรือ update cache อย่างไร
5. เมื่อ cache ล่ม database รับ traffic ที่ทะลุลงมาไหวหรือไม่

### Failure ที่ควรทดลอง

| ปัญหา | ผลกระทบ | แนวทางรับมือ |
|---|---|---|
| Cache stampede | Key หมดอายุแล้วหลาย request อ่าน DB พร้อมกัน | Request coalescing, TTL jitter, จำกัด concurrency |
| Hot key | Request กระจุกที่ key เดียว | Local cache ที่ยอม stale ได้ หรือกระจาย read ตามความสามารถระบบ |
| Cache outage | โหลดไหลลง DB จนล่มตาม | Bounded fallback, load shedding, จำกัดงาน |
| Stale refill race | Reader เติมค่าเก่าหลัง writer invalidate | Versioning หรือ coordination ตาม consistency ที่ต้องการ |
| Key scope ผิด | ข้อมูลข้าม user/tenant | ตรวจ key design และทำ isolation test |

TTL ไม่รับประกันว่าข้อมูลจะสดตลอดช่วงที่ยังไม่หมดอายุ และแม้ไม่มี TTL ข้อมูลอาจถูก evict ได้ตามนโยบายและข้อจำกัด memory

**ตรวจความเข้าใจ:** Cache hit rate สูงพอจะบอกว่าระบบดีหรือไม่?

**แนวตอบ:** ไม่พอ ต้องดู latency, miss cost, memory, stale data, DB load และ correctness ด้วย

---

## 10. บทเรียนที่ 8 — CDN สำหรับไฟล์และการจัดการ cache ที่ขอบเครือข่าย

ต้นฉบับใช้ CDN กระจาย static assets และลดการให้บริการไฟล์จาก web servers พร้อมกล่าวถึง expiry และ invalidation.[1]

```text
Browser -> CDN -> Origin/Object storage (เมื่อไม่มีสำเนาที่ใช้ได้)
Browser -> API -> Application -> Database
```

### แนวทางใช้งานในระบบตัวอย่าง

- รูปสินค้าและ static assets ไป object storage และ CDN
- ใช้ filename ที่มี content hash สำหรับไฟล์ build เช่น app.<hash>.js
- ตั้ง Cache-Control ให้สอดคล้องกับชนิดไฟล์และนโยบายธุรกิจ
- HTML ที่ชี้ไป asset รุ่นใหม่ควรมี cache policy ต่างจาก asset ที่ version แล้ว
- อย่า cache response ที่มีข้อมูลส่วนบุคคลแบบ public โดยไม่ออกแบบ cache key และ authorization
- Query-string versioning ใช้ได้ก็ต่อเมื่อ CDN configuration นำ parameter นั้นมารวมใน cache key

CDN edge ที่ถูกเลือกไม่ได้จำเป็นต้องใกล้ที่สุดตามระยะทาง แต่ขึ้นกับ routing และเงื่อนไขของเครือข่าย การ fallback ไป origin ต้องพิจารณา capacity, security และค่าใช้จ่าย ไม่ควรเปิด origin สาธารณะโดยอัตโนมัติเพียงเพื่อให้มี fallback

**กิจกรรม:** แยก cache policy ของรูปสินค้า, JavaScript build, หน้า account และ order API พร้อมเหตุผล

---

## 11. บทเรียนที่ 9 — Queue ย้ายงานออกจาก request path

ต้นฉบับใช้ producer, queue และ worker เพื่อแยกการทำงานและปรับขนาด producer/consumer อย่างอิสระ โดยยกตัวอย่างงานประมวลผลภาพ.[1]

ในระบบตัวอย่างให้สร้าง order แบบ synchronous แต่ส่งอีเมลแบบ asynchronous:

```text
Client -> Order API -> DB transaction
                          | order + outbox event
                          v
                    Outbox publisher -> Queue -> Email worker
```

### เหตุใดไม่ publish หลัง commit ตรง ๆ แล้วจบ

หาก commit order สำเร็จแล้ว process ตายก่อน publish จะมี order แต่ไม่มี job หาก publish ก่อน commit แล้ว transaction ล้มเหลว อาจส่งอีเมลสำหรับ order ที่ไม่มีจริง

**Transactional outbox** เก็บ order และ event ใน transaction เดียวกัน แล้วมี publisher ส่ง event ภายหลัง โดยยังต้องรับมือการ publish ซ้ำ ไม่ได้ทำให้ทุกขั้นเป็น exactly-once

### Delivery semantics ที่ทีมต้องเข้าใจ

- ระบบแบบ at-least-once อาจส่ง message เดิมซ้ำ
- Worker ต้อง idempotent หรือมีวิธี deduplicate ที่สอดคล้องกับ side effect
- ACK หลังจุดที่งานถือว่าสำเร็จตามสัญญาของระบบ
- Retry ต้องมี backoff, jitter และเพดาน
- งานที่ retry ไม่ผ่านต้องมี dead-letter workflow และผู้รับผิดชอบ ไม่ใช่แค่ย้ายไปแล้วลืม
- Monitor oldest-message age และ processing latency ไม่ใช่ queue length อย่างเดียว

Queue durability ขึ้นกับ persistence, replication, acknowledgement และ configuration การอยู่ใน memory ไม่ได้แปลว่าทนต่อการสูญเสียเครื่อง

### ข้อควรระวังสำหรับอีเมลและ external side effect

ถ้าส่งอีเมลสำเร็จแล้ว worker ตายก่อนบันทึกว่าส่งแล้ว retry อาจส่งซ้ำ ถ้าบันทึกว่าส่งแล้วก่อนส่งจริง worker อาจตายและอีเมลหาย จึงต้องใช้ idempotency ของ provider หากมี หรือระบุขอบเขต guarantee/การตรวจทานให้ชัด การมี processed-message table อย่างเดียวไม่ได้ปิดช่องว่างนี้เสมอไป

Queue ยังไม่แก้ overload ที่เกิดอย่างต่อเนื่อง หาก producer สร้างงานเร็วกว่าที่ worker ทำได้ backlog จะโต ต้องมี capacity plan, admission control หรือ backpressure

**Failure drill:** ปิด worker ก่อนทำงาน หลัง side effect และก่อน ACK แล้วตรวจว่ามีงานหายหรือผลซ้ำอย่างไร

---

## 12. บทเรียนที่ 10 — Observability และ automation เริ่มก่อนระบบใหญ่

ต้นฉบับกล่าวถึง centralized logging, metrics และ automation เมื่อระบบขยายตัว.[1] สำหรับการทำงานจริงในคู่มือนี้ แนะนำให้มีพื้นฐานเหล่านี้ตั้งแต่ต้น เพื่อให้มีหลักฐานสำหรับการตัดสินใจ scale

### สิ่งที่ควรติดตาม

| ชั้นระบบ | Metrics ที่ช่วยตัดสินใจ |
|---|---|
| API | Request rate, latency distribution, errors แยก endpoint |
| Application | CPU, memory, saturation, pool wait, in-flight work |
| Database | Query latency, slow query, lock wait, connections, replication lag |
| Cache | Hits/misses, evictions, latency, memory, errors |
| Queue | Publish/consume errors, backlog age, retries, dead letters |
| Business | Order success, duplicate orders, stock invariant violations |

- **Logs:** เหตุการณ์และรายละเอียดที่ช่วยวิเคราะห์
- **Metrics:** แนวโน้มและการแจ้งเตือน
- **Traces:** เส้นทางและเวลาของ request ที่ข้ามหลาย component

ใช้ correlation/request ID ให้ค้น request ต่อเนื่องได้ ระวัง user ID หรือ order ID เป็น metric label เพราะ cardinality สูงได้ ควรเก็บรายละเอียดแบบนั้นใน log/trace ตามนโยบายข้อมูล

### Deployment เป็นส่วนหนึ่งของ architecture

- CI ตรวจ tests และคุณภาพก่อน deploy
- ใช้ migration แบบ expand-contract เมื่อ schema เก่าและใหม่ต้องอยู่ร่วมกัน
- ตรวจ backward compatibility ของ API และ message schema
- มี rollback plan และรู้ว่าการย้อน app ไม่ได้ย้อนข้อมูลหรือ schema ให้อัตโนมัติ
- กำหนด alert จากอาการที่กระทบผู้ใช้ พร้อม runbook และ owner

**คำถาม:** CPU ปกติแต่ checkout ช้า เกิดอะไรได้บ้าง?

**แนวตอบ:** รอ connection pool, lock, network หรือ downstream การเพิ่ม CPU อาจไม่ช่วย ต้องตรวจ trace และ wait metrics

---

## 13. บทเรียนที่ 11 — Multi-region เพิ่มความทนทาน แต่ไม่ใช่ขั้นบังคับ

ต้นฉบับกล่าวถึง GeoDNS, data synchronization และการ deploy/test ข้าม data centers.[1]

ก่อนออกแบบหลาย region ให้แยก **multiple instances**, **multiple availability zones** และ **multiple regions** ออกจากกัน เพราะป้องกัน failure คนละระดับ

### คำถามก่อนเพิ่ม region

- ต้องลด latency ให้ผู้ใช้พื้นที่ใด?
- ต้องรับมือ outage ระดับใด และ RTO/RPO เท่าไร?
- มีข้อกำหนด data residency หรือไม่?
- Region สำรองมี capacity และ dependency ครบหรือไม่?
- ใครเป็น writer และจะป้องกัน split brain อย่างไร?
- จะทำ failback กลับอย่างปลอดภัยอย่างไร?

Active-passive อาจง่ายกว่าการเขียนพร้อมกันหลาย region แต่ก็ต้องซ้อม failover จริง GeoDNS ไม่ได้สลับ client ทุกตัวทันที เพราะ caching และ connection เดิมยังมีผล

Active-active write เพิ่มโจทย์ conflict resolution และ global invariants อย่าง stock หากยังไม่จำเป็น อย่าแลกความถูกต้องและภาระดูแลกับ architecture ที่ซับซ้อนขึ้น

**กิจกรรม:** ให้ทีมบอก failure ที่ multi-AZ แก้ได้ และ failure ที่ต้องมี DR ระดับ region โดยระบุ dependency ที่ยังเป็นจุดร่วม

---

## 14. บทเรียนที่ 12 — Sharding เมื่อมีหลักฐานว่าต้องแบ่งข้อมูล

ต้นฉบับอธิบายการแบ่งข้อมูลเป็น shards และเตือนเรื่อง shard key, resharding, hotspot และ cross-shard join.[1]

```text
Request -> Shard router -> Shard A [ข้อมูลบางส่วน]
                        -> Shard B [ข้อมูลอีกส่วน]
```

### แยกแนวคิดที่มักสับสน

- **Replication:** มีสำเนาของข้อมูลเดียวกัน
- **Sharding:** แบ่งข้อมูลคนละส่วนไปอยู่คนละ shard
- แต่ละ shard อาจมี replication ของตัวเองด้วย

ก่อน shard ให้ตรวจ query/index, transaction length, connection pool, data retention, scale up และ read offloading ตามคอขวดที่พบ วิธีเหล่านี้ไม่ใช่คำตอบทุกกรณี แต่ควรประเมินก่อนรับภาระ sharding

### เลือก shard key จาก access pattern

| ตัวเลือก | ประโยชน์ | ความเสี่ยง |
|---|---|---|
| customer_id | Order ของลูกค้าเดียวกันอยู่ใกล้กัน | รายงานข้ามลูกค้าต้องรวมหลาย shard |
| tenant_id | แบ่งขอบเขต tenant ได้ชัด | Tenant ใหญ่อาจเป็น hot shard |
| order_id | Point lookup ของ order ชัดเจน | รายการ order ของลูกค้าอาจต้องกระจาย query |

อย่าดูแค่จำนวน rows ที่กระจายเท่ากัน ต้องดู bytes, request load และต้นทุน query ด้วย Key เดียวที่ร้อนมากไม่หายไปเพียงเพราะใช้ consistent hashing

ตัวอย่าง modulo เหมาะกับอธิบาย routing แต่เมื่อจำนวน shards เปลี่ยน mapping ของข้อมูลจำนวนมากอาจเปลี่ยน ต้องออกแบบ migration, routing metadata และความถูกต้องระหว่างย้าย ไม่เปลี่ยนสูตรอย่างเดียว

Cross-shard transaction, uniqueness, pagination และ analytics ต้องมีทางออกก่อนขึ้น production ส่วน denormalization ลด join ได้แต่เพิ่มงานรักษาความสอดคล้องของข้อมูลสำเนา

**ตรวจความเข้าใจ:** มี shard มากขึ้นแปลว่าระบบทนทานขึ้นเสมอหรือไม่?

**แนวตอบ:** ไม่เสมอ หากแต่ละ shard ไม่มี redundancy การเสียหนึ่ง shard ทำให้ข้อมูลส่วนนั้นใช้ไม่ได้ และ query ที่ต้องอ่านหลาย shards อาจได้รับผลกว้างขึ้น

---

## 15. ภาพรวมเป้าหมาย: เลือกใช้เฉพาะส่วนที่มีเหตุผล

```text
                         +--> CDN --> Object storage
Users --> DNS -----------+
                         +--> Load balancer
                                  |
                          +-------+-------+
                          |               |
                        App A           App B
                          |               |
                          +-------+-------+
                                  |
                     +------------+-------------+
                     |            |             |
                Session store   Cache      DB Primary
                                               |
                                               +--> Read replica
                                               |
                                        Outbox publisher
                                               |
                                             Queue
                                               |
                                            Workers

Logs / Metrics / Traces ครอบคลุมทุกชั้น
CI/CD / Backups / Restore drills / Security เป็นงานข้ามชั้น
```

นี่คือภาพแนวคิด ไม่ใช่ deployment specification และไม่ได้แสดง network boundaries หรือ redundancy ของทุก component อย่าตีความว่าทุกระบบต้องมีทุกกล่องตั้งแต่วันแรก หรือว่ามีกล่องเหล่านี้แล้วรองรับผู้ใช้ระดับใดได้ทันที

**หลักคิด:** ให้ architecture โตตาม bottleneck, failure requirement และความสามารถดูแลของทีม ไม่จำเป็นต้องเปลี่ยนเป็น microservices เพื่อ scale เสมอไป

---

## 16. Decision table สำหรับใช้ใน design review

| อาการ | หลักฐานที่ควรเก็บ | ทางเลือกแรกที่ควรประเมิน | อย่ารีบสรุปว่า |
|---|---|---|---|
| หน้าสินค้าช้า | Query plan, trace, cacheability | Index/query optimization, cache | ต้องเปลี่ยน database |
| รูปโหลดช้า | Asset size, origin latency, cache headers | Resize/compress, CDN | ต้องเพิ่ม app instances |
| เพิ่ม app แล้ว DB ล่ม | Connections, pool wait, DB saturation | Pool budget, limit concurrency | App น้อยเกินไป |
| เขียนแล้วเหมือนข้อมูลหาย | Read routing, replication lag | Primary read สำหรับ critical flow | Data ถูกลบจริงแน่นอน |
| Deploy แล้ว login หลุด | Session location และ config | Shared session และ key consistency | Load balancer เสีย |
| อีเมลทำให้ API ช้า | Trace ของ external call | Async job + reliable handoff | Queue จะทำให้ไม่มีงานซ้ำ |
| DB write เต็ม | Lock, I/O, transaction cost, write rate | Optimize/scale up แล้วประเมิน partitioning | Replica แก้ write bottleneck |
| Region outage | Dependency map และ recovery drill | DR strategy ตาม RTO/RPO | DNS อย่างเดียวเพียงพอ |

---

## 17. Workshop — ออกแบบจากข้อกำหนด ไม่ใช่จากรายชื่อเครื่องมือ

### โจทย์

ออกแบบระบบสั่งซื้อสินค้าตามกรณีศึกษา โดยมีเงื่อนไข:

- ปริมาณอ่านสินค้ามากกว่าการสั่งซื้อ
- อาจมี burst จากแคมเปญ
- App instance ต้องถูกเปลี่ยนหรือหยุดระหว่าง deploy ได้
- Stock ห้ามติดลบและคำขอเดิมที่ retry ต้องไม่สร้าง order ซ้ำ
- อีเมลทำภายหลังได้ และต้องตรวจสอบสถานะงานได้

ผู้สอนและทีมต้องตกลงตัวเลข peak load, latency target, stale-data tolerance, RTO และ RPO ก่อนทำ benchmark ตัวเลขเหล่านี้เป็นสมมติฐานของ workshop ไม่ใช่ capacity ที่เอกสารนี้รับรอง

### งานที่ต้องส่ง

1. Context diagram และ request flow สำหรับอ่านสินค้าและสร้าง order
2. รายการ state พร้อม source of truth และ durability requirement
3. ตาราง failure modes ของ app, DB, cache, queue และ worker
4. Architecture decision อย่างน้อยสำหรับ database, session และ async handoff
5. แผนทดสอบพร้อม expected result และเกณฑ์ผ่าน
6. สิ่งที่ยังไม่ทำ พร้อมเหตุผลและ trigger ที่จะกลับมาพิจารณา

### Test matrix

| การทดสอบ | สิ่งที่ต้องตรวจ |
|---|---|
| ส่งคำสั่งซื้อพร้อมกันจนเกิน stock | Stock ไม่ติดลบ จำนวนขายไม่เกินของที่มี |
| ส่ง idempotency key เดิมซ้ำ | ได้ order เดิม ไม่เกิด business side effect ซ้ำ |
| ใช้ key เดิมแต่เปลี่ยน payload | ปฏิเสธตาม contract ไม่ยอมเปลี่ยนความหมายเงียบ ๆ |
| ปิด app ระหว่าง request | Client รับมือ unknown outcome และ retry ได้อย่างถูกต้อง |
| สลับ app หลัง login | Session และ authorization ยังถูกต้อง |
| ทำ cache ให้ใช้ไม่ได้ | ไม่ปล่อย DB overload แบบไร้ขอบเขต มี error/degradation ที่ตกลง |
| จำลอง replica lag | Critical read ไม่แสดงผลผิดตาม consistency requirement |
| ปิด publisher หลัง publish ก่อน mark sent | Event ซ้ำไม่ทำให้ state ภายในเสีย |
| ปิด worker ก่อน ACK | Retry เป็นไปตาม semantics และตรวจ external effect ซ้ำได้ |
| Restore database จาก backup | ข้อมูลกู้ได้และวัดเวลาจริงเทียบ RTO/RPO |
| Deploy app ที่ใช้ schema รุ่นใหม่ | รุ่นเก่าและใหม่อยู่ร่วมกันตาม migration plan |

### วิธีทำ load test ให้ผลมีความหมาย

- Seed data ให้มีขนาดและ distribution ใกล้ workload เป้าหมาย
- ใช้สัดส่วน endpoint, read/write และ payload ตามสมมติฐานที่ประกาศ
- แยก cold-cache, warm-cache, burst และ steady-state
- ตรวจว่าเครื่องสร้าง load ไม่ใช่คอขวด
- เก็บ latency distribution, errors และ business invariants พร้อมกัน
- เปลี่ยนตัวแปรทีละอย่างเพื่ออธิบายสาเหตุได้
- รายงาน configuration, ระยะเวลาทดสอบ และข้อจำกัด ไม่สรุปว่า “รองรับล้าน user” จาก RPS อย่างเดียว

**สถานะของ workshop นี้:** เป็นโจทย์และแผนทดสอบ ยังไม่มี application หรือ benchmark ที่รันจริง เอกสารไม่ได้อ้างผล capacity

---

## 18. คำถามประเมินและแนวเฉลยสำหรับผู้สอน

### 1. ระบบช้า ควรเพิ่ม server ก่อนหรือไม่?
ไม่ควรตัดสินโดยไม่มีข้อมูล ต้องหาคอขวดก่อน หากติด lock หรือ slow query การเพิ่ม app อาจยิ่งเพิ่มโหลด

### 2. Load balancer ทำให้ระบบไม่มี SPOF แล้วหรือไม่?
ไม่ ต้องตรวจ LB, database, session store, cache ที่จำเป็นต่อ correctness, network และ dependency ภายนอก รวมทั้ง shared failure domains

### 3. Stateless server เก็บ cache ใน memory ได้หรือไม่?
ได้ ถ้า cache นั้นทิ้งแล้วสร้างใหม่ได้ และความต่างระหว่าง instance ไม่ทำให้ correctness เสีย

### 4. มี replica แล้วไม่ต้อง backup ใช่หรือไม่?
ไม่จริง Replica อาจรับการลบผิดตามต้นทาง ต้องมี backup, retention และ restore drill แยกต่างหาก

### 5. เพิ่ม read replica แล้ว write เร็วขึ้นเสมอหรือไม่?
ไม่ แม้บางกรณีการย้าย read ออกอาจลด resource contention แต่ไม่ได้เพิ่ม write parallelism ของ primary โดยตัวมันเอง

### 6. ลบ cache หลังเขียน DB แล้วรับประกันว่าไม่มีค่าเก่าหรือไม่?
ไม่ อาจมี concurrent reader อ่านค่าเก่าก่อน commit แล้วกลับมาเติม cache ทีหลัง ต้องเลือก consistency strategy ตาม requirement

### 7. Queue รับ message แล้วแปลว่างานสำเร็จหรือไม่?
ไม่ แปลว่าขั้น publish ผ่านตาม acknowledgement policy ต้องมี job status และติดตาม processing success แยกต่างหาก

### 8. Retry เป็นเรื่องดีเสมอหรือไม่?
ไม่ อาจเพิ่มโหลดระหว่าง outage และทำ side effect ซ้ำ ต้องมี timeout budget, backoff, jitter, retry cap และ idempotency

### 9. Sharding ต่างจาก replication อย่างไร?
Sharding แบ่งข้อมูล ส่วน replication ทำสำเนา สามารถใช้ร่วมกันได้แต่แก้ปัญหาคนละอย่าง

### 10. จำเป็นต้องใช้ microservices เพื่อรองรับผู้ใช้จำนวนมากหรือไม่?
ไม่จำเป็น ต้องดู workload, deployment boundaries และทีม Modular monolith ที่ scale app และ data tier ได้อาจเหมาะกว่า

### เกณฑ์ประเมิน

| ระดับ | พฤติกรรมที่สังเกตได้ |
|---|---|
| ยังไม่เข้าใจ | บอกชื่อเครื่องมือ แต่ระบุปัญหาและ failure ไม่ได้ |
| เข้าใจแนวคิด | อธิบาย request flow และ trade-off ได้ |
| ประยุกต์ได้ | ออกแบบ correctness, failure handling และ test cases ได้ |
| พร้อมรับผิดชอบ production | มี metrics, capacity evidence, rollout/rollback, recovery plan และ owner |

ไม่ให้คะแนนจากจำนวน component ใน diagram ให้คะแนนจากเหตุผล ความถูกต้อง ความสามารถทดสอบ และภาระดูแลที่ทีมรับได้

---

## 19. นำบทเรียนกลับไปใช้กับงานทีม

### Template สำหรับ Architecture Decision Record

```text
หัวข้อ:
บริบทและปัญหา:
หลักฐาน/metrics:
ข้อกำหนด correctness และ availability:
ทางเลือกที่พิจารณา:
สิ่งที่เลือกและเหตุผล:
Trade-offs / failure modes:
วิธีทดสอบและ acceptance criteria:
Rollout / rollback:
Monitoring / alert / owner:
เงื่อนไขที่จะทบทวนการตัดสินใจ:
```

### ตัวอย่าง backlog ที่นำไปปรับใช้ใน Jira ได้

รายการต่อไปนี้เป็นตัวอย่าง ยังไม่ได้สร้าง issue ใน Jira:

- **ทำ request tracing สำหรับ checkout:** ไล่จาก API ถึง DB และ external call ได้ โดยไม่รั่วข้อมูลอ่อนไหว
- **เพิ่ม order idempotency:** ตรวจ key ซ้ำและ payload ต่างกัน พร้อม concurrent integration test
- **ย้าย session ออกจาก app memory:** มี test สลับ instance และกำหนดพฤติกรรมเมื่อ session store ล่ม
- **เพิ่ม transactional outbox:** มี test crash ก่อน/หลัง publish และกำหนด deduplication semantics
- **จัดทำ restore drill:** มีหลักฐานข้อมูลที่กู้ได้ เวลาที่ใช้ และข้อจำกัดเทียบกับ RTO/RPO

### ประโยคสำคัญสำหรับปิดคลาส

> เราไม่ได้เพิ่ม cache, queue หรือ shard เพราะระบบที่ดีต้องมีสิ่งเหล่านี้ เราเพิ่มเมื่อรู้ว่ากำลังแก้ปัญหาอะไร ยอมรับต้นทุนอะไร และมีการทดสอบยืนยันว่าการเปลี่ยนแปลงช่วยจริงโดยไม่ทำให้ข้อมูลผิด

## Sources

[1] file:///Users/prommeesee/Documents/04_Learning/bytebytego/Scale_From_Zero_To_Millions_Of_Users/ByteByteGo%20_%20Technical%20Interview%20Prep.html — ByteByteGo — Scale From Zero To Millions Of Users (local saved HTML)
