// Teaching calendar: 1, 7, 30 and 365 days, matching the calculator.
export const availabilityReference = [
 ['99%', '14.40 นาที', '1.68 ชั่วโมง', '7.20 ชั่วโมง', '3.65 วัน'],
 ['99.99%', '8.64 วินาที', '1.01 นาที', '4.32 นาที', '52.56 นาที'],
 ['99.999%', '864.00 มิลลิวินาที', '6.05 วินาที', '25.92 วินาที', '5.26 นาที'],
 ['99.9999%', '86.40 มิลลิวินาที', '604.80 มิลลิวินาที', '2.59 วินาที', '31.56 วินาที'],
];
const periods = ['ต่อวัน', 'ต่อสัปดาห์', 'ต่อเดือน', 'ต่อปี'];
export function renderAvailabilityReference() {
 return `<section class="availability-reference" aria-label="ตาราง availability และเวลาหยุดที่เทียบเท่า">
  <table aria-describedby="availability-table-note">
   <caption>Availability กับ downtime โดยประมาณ</caption>
   <thead><tr><th scope="col">Availability (%)</th>${periods.map(period => `<th scope="col">Downtime ${period}</th>`).join('')}</tr></thead>
   <tbody>${availabilityReference.map(([percent, ...times]) => `<tr><th scope="row">${percent}</th>${times.map((time, i) => `<td data-label="${periods[i]}">${time}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>
  <p id="availability-table-note">ตารางคำนวณสำหรับบทเรียนนี้: วัน = 24 ชั่วโมง สัปดาห์ = 7 วัน เดือนตัวอย่าง = 30 วัน ปี = 365 วัน ใช้สูตรเดียวกับเครื่องทดลองด้านล่างและปัดเป็นทศนิยม 2 ตำแหน่ง ไม่ใช่กำหนดการล่ม ตารางอ้างอิงเดิมมีค่าปัดต่างกันและไม่ได้ระบุฐานเดือน จึงไม่ใช้เป็นปฏิทินของเครื่องทดลอง</p>
 </section>`;
}
