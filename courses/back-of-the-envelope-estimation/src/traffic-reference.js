// Fixed worked example, independent of the editable QPS calculator below.
export const trafficAssumptions = [
 ['ผู้ใช้รายเดือน (MAU)', '300 ล้านคน'],
 ['สัดส่วนผู้ใช้รายวัน', '50% ของผู้ใช้รายเดือน'],
 ['ทวีตเฉลี่ยต่อผู้ใช้รายวัน', '2 ทวีต/คน/วัน'],
 ['ทวีตที่มีสื่อ', '10% ของทวีตทั้งหมด'],
 ['ระยะเก็บข้อมูล', '5 ปี'],
];
export const tweetSizes = [
 ['tweet_id', '64 bytes'],
 ['ข้อความ', '140 bytes'],
 ['สื่อต่อทวีตที่มีสื่อ', '1 MB'],
];

export function renderTrafficReference() {
 return `<section class="traffic-reference" aria-label="ตัวอย่างคำนวณ QPS และพื้นที่สื่อ">
  <p class="traffic-example-note">ตัวอย่างคำนวณนี้ใช้ค่าตั้งต้นคงที่ ไม่เปลี่ยนตามเครื่องทดลอง QPS ด้านล่าง ตัวเลขทั้งหมดใช้ฝึกประมาณ ไม่ใช่สถิติจริงของบริการ</p>
  <table class="traffic-assumptions">
   <caption>สมมติฐานของตัวอย่าง</caption>
   <thead><tr><th scope="col">รายการ</th><th scope="col">ค่าที่สมมติ</th></tr></thead>
   <tbody>${trafficAssumptions.map(([label, value]) => `<tr><th scope="row">${label}</th><td data-label="ค่าที่สมมติ">${value}</td></tr>`).join('')}</tbody>
  </table>
  <section class="traffic-worked" aria-labelledby="traffic-qps-title">
   <h2 id="traffic-qps-title">1. ประมาณคำขอต่อวินาที (QPS)</h2>
   <ol>
    <li><strong>ผู้ใช้รายวัน (DAU)</strong><p>300 ล้าน × 50% = 150 ล้านคน</p></li>
    <li><strong>คำขอสร้างทวีตเฉลี่ย</strong><p>150 ล้าน × 2 ÷ 24 ÷ 3,600 ≈ 3,472.22 QPS ≈ 3,500 QPS</p><p>คิดหนึ่งคำขอต่อหนึ่งทวีต: 300 ล้านทวีต/วัน หารด้วย 86,400 วินาที/วัน</p></li>
    <li><strong>ช่วงที่มีคำขอสูง (Peak QPS)</strong><p>2 × QPS เฉลี่ย ≈ 6,944.44 QPS ≈ 7,000 QPS</p><p>ตัวคูณ 2 เป็นสมมติฐานเพิ่มเติม ไม่ใช่ค่าที่พิสูจน์จากจำนวนผู้ใช้</p></li>
   </ol>
  </section>
  <table class="traffic-sizes" aria-describedby="traffic-size-note">
   <caption>ขนาดข้อมูลที่สมมติต่อทวีต</caption>
   <thead><tr><th scope="col">ส่วนของข้อมูล</th><th scope="col">ขนาดตัวอย่าง</th></tr></thead>
   <tbody>${tweetSizes.map(([label, value]) => `<tr><th scope="row">${label}</th><td data-label="ขนาดตัวอย่าง">${value}</td></tr>`).join('')}</tbody>
  </table>
  <p id="traffic-size-note">tweet_id คือรหัสทวีต ขนาด 64 bytes และข้อความ 140 bytes เป็นค่าที่สมมติ ไม่ใช่ข้อกำหนดจริงของ Twitter ขนาด 1 MB ใช้เฉพาะทวีตที่มีสื่อ ไม่ใช่ทุกทวีต</p>
  <section class="traffic-worked" aria-labelledby="traffic-storage-title">
   <h2 id="traffic-storage-title">2. ประมาณพื้นที่เก็บเฉพาะสื่อ</h2>
   <ol>
    <li><strong>สื่อที่เพิ่มในหนึ่งวัน</strong><p>150 ล้าน × 2 × 10% × 1 MB = 30 TB/วัน</p></li>
    <li><strong>สะสมเป็นเวลา 5 ปี</strong><p>30 TB × 365 × 5 = 54.75 PB ≈ 55 PB</p></li>
   </ol>
   <p>ใช้หน่วยฐานสิบ: 1 TB = 1,000,000 MB และ 1 PB = 1,000 TB กำหนดปีละ 365 วัน ปริมาณเขียนคงที่และเก็บครบ 5 ปี โดยยังไม่คิดการลบหรือการเติบโต</p>
   <p>ไม่รวมรหัสทวีต ข้อความ index metadata สำเนาและ backup ในยอดพื้นที่สื่อนี้ อ่านหลักการปัดเลข การเขียนสมมติฐานและหน่วยต่อได้ใน LAB05 · Tips</p>
  </section>
 </section>`;
}
