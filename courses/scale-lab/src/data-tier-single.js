// Independent snapshots for comparison; never commits or records model actions.
import {tierFrames} from './data-tier-flow.js';
export function singleTierScene(){
 const frames=tierFrames(0);
 return `<figure class="tier-scene tier-single" data-playback="idle" data-phase="ready" aria-label="เครื่องเดียวรับงานทั้งหมด">
 <h4 class="tier-story-title">เทียบ 3 สถานการณ์ · ข้อมูลยังอยู่เครื่องเดียว</h4>
 <div class="tier-comparisons">${frames.map(({config:c,result:r,phase})=>`<section class="tier-comparison" data-comparison="${phase}" aria-label="ช่วง ${phase+1}">
 <h4 class="tier-phase">ช่วง ${phase+1} · ${phase===0?'งานเกินกำลัง':phase===1?'Scale Up เครื่องเดิม':'เครื่องไม่พร้อม'}</h4>
 <div class="tier-lane" data-shard="0">
 <div class="tier-source"><strong>${r.total}</strong><span>คำขอ / รอบ</span></div>
 <div class="tier-route" aria-hidden="true"><svg><path/></svg><span class="tier-token" hidden>${r.total} คำขอ</span></div>
 <section class="tier-node" data-down="${!c.up}"><h4>Database เดียว</h4><p class="tier-data-stack">▤ &nbsp; ข้อมูลทั้งหมด ${r.rows.flat().length} แถว</p>
 <div class="tier-meter"><div><span>งานที่เข้ามา</span><b>${r.total}</b></div><div class="tier-meter-track"><div class="tier-demand" style="width:${r.total/32*100}%" aria-label="ภาระ ${r.total} หน่วย">${Array.from({length:r.total},(_,i)=>`<i data-demand="${i}"></i>`).join('')}</div></div></div>
 <div class="tier-meter"><div><span>กำลังเครื่อง</span><b>${r.capacity}</b></div><div class="tier-meter-track"><div class="tier-capacity" style="width:${r.capacity/32*100}%" aria-label="กำลัง ${r.capacity} หน่วย">${Array.from({length:r.capacity},(_,i)=>`<i data-unit="${i}"></i>`).join('')}</div></div></div>
 <p class="tier-load" data-load="${r.total}">${c.up?(r.total>r.capacity?'งานมากกว่ากำลังเครื่อง':'กำลังพอสำหรับงานรอบนี้'):'เครื่องไม่พร้อม ≠ กำลังไม่พอ'}</p><div class="tier-excess" hidden>เกินกำลัง ${Math.max(0,r.total-r.capacity)} หน่วย</div>
 </section></div>
 ${!c.up?'<p class="tier-availability">ประเด็นรอง: ต้องมี replication และ failover · Sharding ไม่ได้สำรองข้อมูลให้</p>':'<p class="tier-comparison-note">'+(phase===0?'16 คำขอ > กำลัง 8':'งานเท่าเดิม · กำลังเพิ่มเป็น 32')+'</p>'}
 </section>`).join('')}</div>
 <div class="tier-toolbar"><div class="tier-actions"></div><p id="tier-result" role="status">กดทดลอง · ดูทั้ง 3 ส่วนพร้อมกัน</p></div>
 </figure>`;
}
