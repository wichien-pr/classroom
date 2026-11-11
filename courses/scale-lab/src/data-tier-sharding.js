export function shardingScene(frame){
 const {result:r,config:c}=frame;
 return `<figure class="tier-scene tier-sharding" data-playback="idle" data-phase="ready" aria-label="แบ่งข้อมูลและส่งคำขอไปยัง shard"><p class="tier-phase">แบ่งข้อมูล → แบ่งภาระต่อเครื่อง</p>
 <div class="shard-summary"><strong>ภาระต่อเครื่อง 16 → 4</strong><span>คำขอรวมเท่าเดิม · แต่ละเครื่องมีกำลัง 8</span></div>
 <div class="shard-router"><strong>Router · ${c.key==='user'?'user_id':'country key'} % 4</strong><span class="shard-stage">1 · แบ่งข้อมูล 16 แถว</span></div>
 <p class="shard-schema">schema เดียวกัน · คนละแถว · ไม่ใช่สำเนา</p>
 <div class="shard-machines">${r.rows.map((rows,i)=>`<div class="tier-lane" data-shard="${i}"><div class="tier-source"><strong>${c.key==='user'?'user_id':'key'}</strong><span>${c.key==='country'?(i===0?'0':'—'):rows.join(', ')}</span></div><div class="tier-route" aria-hidden="true"><svg><path/></svg><span class="tier-token" hidden></span></div><section class="tier-node"><h4>Shard ${i}</h4><div class="tier-rows">${rows.map(id=>`<span class="tier-row" data-row="${id}">${id}</span>`).join('')||'<span>ไม่มีแถว</span>'}</div><p class="tier-row-count">${rows.length} แถว</p><div class="tier-capacity" aria-label="กำลัง ${r.capacity} หน่วย">${Array.from({length:r.capacity},()=>'<i></i>').join('')}</div><p class="tier-load" data-load="${r.loads[i]}">ภาระ 0 / ${r.capacity}</p><div class="tier-excess" hidden></div></section></div>`).join('')}</div>
 <div class="tier-toolbar"><div class="tier-actions"></div><p id="tier-result" role="status">แบ่งแถวตาม key แล้วส่งคำขอไปเครื่องที่เก็บแถวนั้น</p></div>
 <figcaption>1 คำขอ = 1 หน่วยภาระในแบบจำลอง · ไม่ใช่ latency หรือผลตอบกลับสำเร็จ<br>Sharding ไม่รับประกันโหลดเท่ากันหรือ HA · replication / failover ต้องออกแบบแยก</figcaption></figure>`;
}
// Read-only projection: placement and destinations come from the evaluated rows.
export function shardSteps(frame){
 const requests=frame.config.traffic==='hotspot'?[...Array(13).fill(4),0,1,2]:Array.from({length:frame.result.total},(_,i)=>i);
 const loads=frame.result.loads.map(()=>0);
 return Array.from({length:4},(_,round)=>{
  const routed=loads.map(()=>[]);
  for(const id of requests.slice(round*4,round*4+4)){
   const shard=frame.result.rows.findIndex(rows=>rows.includes(id));
   routed[shard].push(id);loads[shard]++;
  }
  return {requests:routed,loads:[...loads]};
 });
}
