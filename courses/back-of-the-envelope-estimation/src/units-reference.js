// LAB01 teaching reference: decimal labels are estimates, not binary identities.
const rows=[
 [10,'1 Thousand · 1 พัน','Kilobyte','KB'],
 [20,'1 Million · 1 ล้าน','Megabyte','MB'],
 [30,'1 Billion · 1 พันล้าน','Gigabyte','GB'],
 [40,'1 Trillion · 1 ล้านล้าน','Terabyte','TB'],
 [50,'1 Quadrillion · 1 พันล้านล้าน','Petabyte','PB'],
];
export function renderUnitsReference(){
 return `<section class="units-reference" aria-label="ตารางกำลังของสอง">
  <table aria-describedby="units-precision">
   <caption>กำลังของสองกับลำดับขนาดข้อมูล</caption>
   <thead><tr><th scope="col">กำลังของสอง<br><small>Power</small></th><th scope="col">ค่าประมาณ<br><small>Approximate value</small></th><th scope="col">ชื่อหน่วย<br><small>Full name</small></th><th scope="col">ชื่อย่อโดยประมาณ<br><small>Short name</small></th></tr></thead>
   <tbody>${rows.map(([power,value,name,symbol])=>`<tr data-power="${power}"><th scope="row" data-label="กำลังของสอง"><span aria-label="2 ยกกำลัง ${power}">2<sup>${power}</sup></span> bytes</th><td data-label="ค่าประมาณ">${value}</td><td data-label="ชื่อหน่วย">${name}</td><td data-label="ชื่อย่อโดยประมาณ">≈ 1 ${symbol}</td></tr>`).join('')}</tbody>
  </table>
  <p id="units-precision"><strong>ประมาณค่า ≠ ค่าเท่ากันพอดี</strong><br>ตารางนี้ใช้ KB–PB ฐานสิบเพื่อจำลำดับขนาด ไม่ใช่ค่าฐานสองที่เท่ากันพอดี: 2¹⁰ bytes = 1,024 bytes = 1 KiB แต่ 1 KB = 1,000 bytes ส่วน 2²⁰, 2³⁰, 2⁴⁰ และ 2⁵⁰ bytes เท่ากับ 1 MiB, 1 GiB, 1 TiB และ 1 PiB ตามลำดับ ทดลองเปรียบเทียบค่าที่แน่นอนด้วยเครื่องคิดเลขด้านล่าง</p>
 </section>`;
}
