// Original illustrations and deterministic narration, grounded in Single-server-setup.pdf pp.1–3.
export const stages=['ready','dns-query','dns-return','http-request','process','http-response','display'];
export function flowView(step,mode='browser'){
 const format=mode==='mobile'?'JSON':'HTML';
 const client=mode==='mobile'?'Mobile app':'Browser';
 const messages=[
  `${client} พร้อมเปิดข้อมูลผู้ใช้ 12 ผ่าน api.example.test — กดเดิน request ทีละขั้น`,
  `${client} ถาม DNS ภายนอกว่า api.example.test อยู่ที่ IP ใด (cold lookup)`,
  `DNS คืน IP 192.0.2.10 กลับให้ ${client} — ยังไม่ได้ส่ง HTTP และ DNS ไม่ส่งต่อ HTTP`,
  `${client} ส่ง HTTP GET /users/12 ตรงไปยัง web server ที่ 192.0.2.10`,
  'Web / Application ประมวลผลข้อมูลผู้ใช้ 12 ภายในเครื่องเดียวกับ Database และ Cache — ภาพนี้ไม่บังคับว่าทุก request ต้องอ่านทั้งสองอย่าง',
  `Server ส่ง HTTP response 200 · ${format} กลับไปยัง ${client} โดยตรง ไม่ผ่าน DNS`,
  `${client} รับ ${format} แล้วแสดงผลผู้ใช้ John Smith — request นี้เสร็จแล้ว`,
 ];
 return {stage:stages[step],message:messages[step],format,client,domain:'api.example.test',ip:step>=2?'192.0.2.10':'ยังไม่ได้รับ',request:step>=3?'GET /users/12':'ยังไม่ส่ง',response:step>=5?`200 · ${format}`:'ยังไม่ตอบ'};
}
export function singleServerDiagram(step,mode='browser'){
 const v=flowView(step,mode);
 const active=(s)=>v.stage===s?'active':'';
 return `<figure class="single-server-figure"><svg viewBox="0 0 400 460" role="img" aria-label="Single server: DNS อยู่นอกเครื่อง; Web Application Database Cache อยู่เครื่องเดียวกัน" data-stage="${v.stage}">
 <title>Single-server setup — ${v.message}</title>
 <defs><marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="context-stroke"/></marker></defs>
 <g data-edge="dns-query" class="flow-edge ${active('dns-query')}"><path d="M180 45 H260"/><text x="212" y="33">1</text></g>
 <g data-edge="dns-return" class="flow-edge ${active('dns-return')}"><path d="M260 85 H180"/><text x="212" y="76">2</text></g>
 <g data-edge="http-request" class="flow-edge ${active('http-request')}"><path d="M65 110 V270"/><text x="80" y="155">3 · HTTP request</text><text x="80" y="177">GET /users/12</text></g>
 <g data-edge="http-response" class="flow-edge ${active('http-response')}"><path d="M355 270 V130 H165 V110"/><text x="183" y="220">4 · HTTP response</text><text x="183" y="242">200 · ${v.format}</text></g>
 <g data-node="${mode}" class="flow-node ${[0,2,6].includes(step)?'active':''}"><rect x="20" y="12" width="160" height="98" rx="14"/><text x="100" y="43" text-anchor="middle">${v.client}</text><text x="100" y="69" text-anchor="middle">${mode==='mobile'?'JSON → หน้าจอแอป':'HTML / JavaScript'}</text><text x="100" y="92" text-anchor="middle">ผู้ใช้เปิดโปรไฟล์</text></g>
 <g data-node="dns" class="flow-node ${active('dns-query')}"><rect x="260" y="12" width="120" height="98" rx="14"/><text x="320" y="43" text-anchor="middle">DNS</text><text x="320" y="69" text-anchor="middle">บริการภายนอก</text><text x="320" y="92" text-anchor="middle">ค้นหา IP</text></g>
 <g data-host="single" class="flow-host ${active('process')}"><rect x="20" y="270" width="360" height="175" rx="16"/><text x="200" y="298" text-anchor="middle">หนึ่งเครื่อง · 192.0.2.10</text><g class="flow-node"><rect x="40" y="311" width="320" height="48" rx="8"/><text x="200" y="331" text-anchor="middle">Web / Application</text><text x="200" y="353" text-anchor="middle">Java/Python/Go/Rust หรืออื่นๆ</text><rect x="40" y="379" width="150" height="45" rx="8"/><text x="115" y="408" text-anchor="middle">Database</text><rect x="210" y="379" width="150" height="45" rx="8"/><text x="285" y="408" text-anchor="middle">Cache</text></g></g>
 </svg></figure>`;
}
