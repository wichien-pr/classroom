// Rounded teaching reference; deliberately separate from the calculator's calendar.
export const availabilityReference = [
 ['99%', '14.40 นาที', '1.68 ชั่วโมง', '7.31 ชั่วโมง', '3.65 วัน'],
 ['99.99%', '8.64 วินาที', '1.01 นาที', '4.38 นาที', '52.60 นาที'],
 ['99.999%', '864.00 มิลลิวินาที', '6.05 วินาที', '26.30 วินาที', '5.26 นาที'],
 ['99.9999%', '86.40 มิลลิวินาที', '604.80 มิลลิวินาที', '2.63 วินาที', '31.56 วินาที'],
];
const periods = ['ต่อวัน', 'ต่อสัปดาห์', 'ต่อเดือน', 'ต่อปี'];
export function renderAvailabilityReference() {
 return `<section class="availability-reference" aria-label="ตาราง availability และเวลาหยุดที่เทียบเท่า">
  <table aria-describedby="availability-table-note">
   <caption>Availability กับ downtime โดยประมาณ</caption>
   <thead><tr><th scope="col">Availability (%)</th>${periods.map(period => `<th scope="col">Downtime ${period}</th>`).join('')}</tr></thead>
   <tbody>${availabilityReference.map(([percent, ...times]) => `<tr><th scope="row">${percent}</th>${times.map((time, i) => `<td data-label="${periods[i]}">${time}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>
  <p id="availability-table-note">ตัวเลขในตารางเป็นค่าประมาณที่ปัดแล้ว เพื่อเปรียบเทียบลำดับขนาด ไม่ใช่กำหนดการล่ม ค่าเดือนและปีอาจต่างจากเครื่องทดลองด้านล่าง ซึ่งกำหนดปีเป็น 365 วัน และเดือนตัวอย่างเป็น 30 วัน จึงควรใช้ช่วงเวลาเดียวกันเมื่อเปรียบเทียบผล</p>
 </section>`;
}
