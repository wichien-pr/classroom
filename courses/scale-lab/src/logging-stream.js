// Presentation-only experiment; never calls scoring or service APIs.
export function loggingStreamSample(second){
 const phase=(second-1)%8,rate=[3,4,6,8,7,5,4,3][phase];
 const logs=Array.from({length:rate},(_,i)=>({second,id:`req-${second}-${i+1}`,path:'/orders',status:phase>=2&&phase<=4&&i<2?500:200,ms:80+phase*25+i*15}));
 return {second,logs,rate,latency:Math.round(logs.reduce((sum,l)=>sum+l.ms,0)/rate),errors:Math.round(logs.filter(l=>l.status===500).length/rate*100)};
}
const metrics=[['rate','Request rate','req/s',10],['latency','Latency เฉลี่ย','ms',400],['errors','Error rate · HTTP 500','%',100]];
export function loggingStreamScene(){return `<section class="logging-scene logging-stream" data-second="0" aria-label="Logs และ Metrics จำลอง">
 <p class="logging-demo">DEMO · ข้อมูลจำลอง ไม่ใช่ระบบ monitoring จริง · ไม่เพิ่มคะแนน</p>
 <h4>Logs บอกรายละเอียด · Metrics สรุปภาพรวม</h4>
 <p>Log แต่ละรายการบอกคำขอ สถานะ และเวลาตอบกลับ ส่วน Metrics รวมคำขอในช่วงเวลาเดียวกันเพื่อดูแนวโน้ม ไม่ใช่หลักฐานยืนยันต้นเหตุ</p>
 <div class="logging-stream-controls"><button type="button" id="logging-stream-toggle" aria-pressed="false">เริ่มจำลอง</button><p id="logging-stream-status" role="status">พร้อมเริ่ม · กดพักเพื่ออ่านรายละเอียด</p></div>
 <p>บริการจำลอง GET /orders · ทุก 1 วินาทีจำลองสร้างคำขอชุดใหม่ · กราฟสรุปแต่ละชุด ไม่ใช่ค่าจากเครื่องนี้</p>
 <div class="logging-stream-charts">${metrics.map(([key,label,unit,max])=>`<figure data-stream-metric="${key}"><figcaption>${label}</figcaption><output>— ${unit}</output><p class="logging-stream-scale">แกน Y: 0–${max} ${unit}</p><svg viewBox="0 0 300 100" role="img" aria-label="${label} · ยังไม่มีข้อมูล"><path d="M 4 4 V 96 H 296"/><polyline points=""/></svg></figure>`).join('')}</div>
 <p class="logging-stream-window">แกน X: เวลาเก่า → ใหม่ · สูงสุด 20 วินาทีล่าสุด · แต่ละจุดรวมช่วง 1 วินาที</p>
 <h4>Logs · คำขอทั้งหมดของวินาทีล่าสุด</h4><p class="logging-stream-time">ยังไม่มีคำขอ</p><ol class="logging-stream-feed"><li>เริ่มจำลองเพื่อดูเหตุการณ์</li></ol>
 <p>เทียบ HTTP 500 ใน Logs กับ Error rate ของวินาทีเดียวกัน · เส้นขึ้นลงเป็นรูปแบบที่กำหนดไว้เพื่อสอน ไม่ได้พิสูจน์ว่าโหลดสูงเป็นสาเหตุของ error และไม่เกี่ยวกับผล Pipeline ในข้อก่อน</p>
 </section>`;}

let cleanup=()=>{};
export function stopLoggingStream(){cleanup();cleanup=()=>{};}
export function bindLoggingStream(main){
 stopLoggingStream();
 const scene=main.querySelector('.logging-stream');if(!scene)return;
 const toggle=scene.querySelector('#logging-stream-toggle'),status=scene.querySelector('#logging-stream-status');
 let timer=null,second=0,history=[];
 function tick(){
  const sample=loggingStreamSample(++second);history.push(sample);history=history.slice(-20);
  scene.dataset.second=String(second);
  for(const [key,label,unit,max] of metrics){
   const chart=scene.querySelector(`[data-stream-metric=${key}]`);
   chart.querySelector('output').textContent=`${sample[key]} ${unit}`;
   chart.querySelector('polyline').setAttribute('points',history.map((s,i)=>`${4+i*292/19},${96-s[key]/max*88}`).join(' '));
   chart.querySelector('svg').setAttribute('aria-label',`${label} วินาที ${second}: ${sample[key]} ${unit}`);
  }
  scene.querySelector('.logging-stream-time').textContent=`วินาทีจำลอง ${second} · ${sample.rate} คำขอ · HTTP 500 ${sample.logs.filter(l=>l.status===500).length} คำขอ`;
  // Only generated numeric values and fixed identifiers enter this markup.
  scene.querySelector('.logging-stream-feed').innerHTML=sample.logs.map(l=>`<li data-status="${l.status}"><strong>${l.status===500?'ERROR':'INFO'} · HTTP ${l.status}</strong><code>t=${l.second}s · ${l.id}<br>GET ${l.path} · ${l.ms} ms</code></li>`).join('');
 }
 toggle.onclick=()=>{
  if(timer!==null){clearInterval(timer);timer=null;toggle.textContent='เล่นต่อ';status.textContent='พักอยู่ · Logs และ Metrics หยุดที่ช่วงเดียวกัน';}
  else {if(second===0)tick();timer=setInterval(tick,1000);toggle.textContent='พัก';status.textContent='กำลังจำลอง · อัปเดตทุก 1 วินาที';}
  toggle.setAttribute('aria-pressed',String(timer!==null));
 };
 cleanup=()=>{clearInterval(timer);timer=null;toggle.onclick=null;};
}
