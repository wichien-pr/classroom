export function cacheControls(){return `<label>ราคาใหม่ใน DB<input id="price" type="number" value="150" min="1" max="1000000" step="1"></label><button id="read-cache" data-action="read-cache">อ่านสินค้า</button><button id="update" data-action="update">เขียนราคา DB</button><button id="invalidate" data-action="invalidate">Invalidate cache</button><fieldset class="cache-extras"><legend>ทดลองเสริม · ไม่เพิ่มคะแนน</legend><button id="cache-tick">เวลา +1 หน่วย</button><button id="cache-outage">ทำ cache ล่ม</button><button id="cache-restart">เริ่ม cache ใหม่</button></fieldset>`;}
export function cacheDiagram(s){return `<figure id="cache-diagram" class="cache-diagram" aria-label="เส้นทาง cache-aside: app ตรวจ cache เมื่อ hit ตอบกลับ เมื่อ miss อ่าน DB แล้วเติม cache"><figcaption>หนึ่งคำขอ · สองเส้นทางอ่าน</figcaption><div class="cache-box">Client <small>ขอราคาสินค้า</small></div><div class="cache-link">↓ request · ↑ response</div><div class="cache-box">Web / Application <small>เป็นผู้เรียก get → โหลด DB → set</small></div><div class="cache-link">↓ ตรวจ key: product:price</div><div class="cache-box ${s.path==='hit'?'cache-selected':''}">Cache tier <strong>${s.up?(s.cache??'ว่าง'):'ไม่พร้อม'}</strong><small>สำเนาชั่วคราว · หมดอายุที่ ${s.expires??'—'}</small></div><div class="cache-paths"><div class="cache-path ${s.path==='hit'?'cache-selected':''}"><b>HIT ↥</b><p>คืนสำเนาให้ app → client<br>ไม่อ่าน DB</p></div><div class="cache-path ${['miss','bypass'].includes(s.path)?'cache-selected':''}"><b>${s.up?'MISS ↓':'BYPASS ↓'}</b><p>app อ่าน DB → ${s.up?'เติม cache → ':''}ตอบ client</p></div></div><div class="cache-box">Database <strong>${s.db}</strong><small>ข้อมูลหลักถาวร · write ที่นี่ไม่ได้แก้ cache อัตโนมัติ</small></div><p>ลูกศรคือการเรียกและคืนค่า ไม่ใช่การส่ง request ผ่าน cache ไป DB โดยตรง</p></figure>`;}
export function cacheNotes(){return `<section id="cache-notes" class="cache-notes">
<h2>ข้อมูลที่ใช้บ่อย งานที่ใช้เวลานาน ไม่ต้องทำซ้ำทุกครั้ง</h2>
<p><b>Cache คือที่พักข้อมูลชั่วคราว</b> เก็บข้อมูลที่เรียกบ่อยหรือผลคำนวณไว้ใช้ซ้ำ เช่น รายละเอียดสินค้า ช่วยลดงานของฐานข้อมูล (DB) แต่ข้อมูลอาจเก่าหรือหายได้ จึงไม่ใช้แทนฐานข้อมูลหลัก</p>
<h3>อ่านข้อมูลอย่างไร?</h3>
<ol><li><b>HIT — เจอใน cache:</b> ใช้ข้อมูลนั้นตอบกลับ ไม่ต้องอ่าน DB ซ้ำ</li><li><b>MISS — ไม่เจอ:</b> แอปอ่าน DB เก็บสำเนาลง cache แล้วตอบกลับ</li></ol>
<p>แบบที่แอปเติม cache เองเรียก <b>cache-aside</b> ส่วน <b>read-through</b> ให้ชั้น cache หรือ loader โหลดให้ ไม่ใช่ว่า Memcached จะอ่าน DB ให้เอง</p>
<pre aria-label="ตัวอย่าง pseudocode cache API">cache.set('product:price', 100, ttl=3600)
cache.get('product:price')</pre>
<p>ตัวอย่างจำลอง: เก็บราคา 100 พร้อมอายุ 3,600 วินาที แล้วอ่านด้วย key เดิม รูปแบบคำสั่งจริงขึ้นกับไลบรารี</p>
<h3>อะไรควรอยู่ใน cache?</h3>
<ul><li><b>เหมาะ:</b> ข้อมูลอ่านบ่อย แก้ไม่บ่อย และสร้างใหม่ได้</li><li><b>อย่าฝากไว้ที่เดียว:</b> คำสั่งซื้อหรือข้อมูลสำคัญ เพราะข้อมูลใน memory อาจหายเมื่อ restart</li><li><b>ก่อนยืนยันการขาย:</b> ตรวจราคาและสต็อกจากแหล่งข้อมูลหลักตามกติกาธุรกิจ ไม่เชื่อสำเนาเก่าอย่างเดียว</li></ul>
<h3>TTL: เก็บไว้นานแค่ไหน?</h3>
<p><b>TTL คืออายุของสำเนา</b> สั้นไปต้องอ่าน DB บ่อย ยาวไปอาจเห็นข้อมูลเก่านานขึ้น แม้ไม่ตั้งวันหมดอายุ ข้อมูลก็ยังถูกลบหรือหายได้</p>
<p>ในตัวทดลอง TTL = 3 หน่วย กด <b>เวลา +1 หน่วย</b> เพื่อเดินเวลา การอ่าน HIT ไม่ต่ออายุ และหน่วยนี้ไม่ใช่วินาทีจริง</p>
<h3>แก้ DB แล้ว cache ยังเก่าได้</h3>
<p>ลองเปลี่ยนราคาใน DB แล้วอ่านอีกครั้ง: อาจได้ราคาเก่าจาก cache กด <b>Invalidate</b> เพื่อลบสำเนา การอ่านครั้งถัดไปจึงโหลดราคาใหม่</p>
<p>TTL และ invalidation ช่วยจัดการข้อมูลเก่า แต่ไม่รับประกันความสดทันที เช่น คำขอที่อ่านค่าเก่าไว้อาจเติมกลับหลังลบ cache แล้ว ตัวทดลองนี้ทำทีละขั้น ไม่จำลองคำขอพร้อมกัน</p>
<h3>พื้นที่เต็ม เลือกเอาอะไรออก?</h3>
<div class="cache-policy"><article><b>LRU</b><p>เอารายการที่ไม่ได้ใช้นานที่สุดออก</p></article><article><b>LFU</b><p>เอารายการที่ใช้น้อยครั้งที่สุดออก</p></article><article><b>FIFO</b><p>เอารายการที่เข้ามาก่อนออก</p></article></div>
<p><b>Expiration</b> คือหมดอายุ ส่วน <b>eviction</b> คือเอาออกเพื่อคืนพื้นที่ ควรเผื่อ memory และเลือกนโยบายให้เหมาะกับการใช้งาน ตัวทดลองนี้มีสินค้าเดียว จึงไม่จำลองการแย่งพื้นที่</p>
<h3>ถ้า cache ล่มล่ะ?</h3>
<figure class="cache-failure"><figcaption>เตรียมทางสำรอง ไม่ให้ cache เป็นจุดล้มจุดเดียว</figcaption><div>Web A · Web B · Web C</div><div aria-hidden="true">↓ ↓ ↓</div><div class="cache-box">Cache เดียวล่ม → ทุก web ได้รับผลกระทบ</div><div aria-hidden="true">↓</div><div>จำกัดเวลารอและโหลด → อ่าน DB สำรอง</div></figure>
<ul><li><b>ในตัวทดลอง:</b> เมื่อ cache ล่ม แอปอ่าน DB โดยตรง จำนวน DB reads จึงเพิ่ม เมื่อเริ่ม cache ใหม่ต้องเติมข้อมูลใหม่</li><li><b>ในระบบจริง:</b> ต้องให้ DB รับโหลดสำรองไหว จำกัดเวลารอและคำขอพร้อมกัน ป้องกันคำขอจำนวนมากแห่เติม cache พร้อมกัน (cache stampede)</li><li><b>หลายเครื่องช่วยลดความเสี่ยง:</b> แต่ต้องแยกจุดเสี่ยง ตรวจสุขภาพ และออกแบบการสลับใช้งาน ไม่ใช่เพิ่มเครื่องแล้วปลอดภัยทันที</li></ul>
<p><b>จำง่าย ๆ:</b> ใช้ cache ลดงานซ้ำ แต่เก็บข้อมูลหลักใน DB วางแผนข้อมูลเก่าและทางสำรองเสมอ แล้ววัดผลจริง—cache ไม่ได้ทำให้ทุกงานเร็วขึ้น ตัวทดลองไม่ใช่การวัดความเร็วหรือทดสอบโหลดจริง</p>
</section>`;}
