const entries=[["MB|MiB|bytes|bits", "MB คือหนึ่งล้าน bytes; MiB คือ 1,048,576 bytes; หนึ่ง byte มี 8 bits", "สื่อ 1 MB ไม่เท่ากับ 1 MiB", "ระบุฐานและอย่าสลับ bit/s กับ byte/s"], ["Latency", "เวลาที่งานหนึ่งใช้จนได้ผล", "รอผลโพสต์รูป 150 ms", "ไม่ใช่จำนวนงานต่อวินาทีและค่ากลางไม่แทน tail latency"], ["Availability|Downtime|SLA", "Availability คือสัดส่วนพร้อมใช้งาน; downtime คือเวลาที่ไม่พร้อม; SLA คือข้อตกลงบริการ", "99.99% ในปี 365 วันเทียบเท่าเวลาหยุดประมาณ 52.6 นาที", "ต้องอ่านนิยามการวัดและข้อยกเว้นของสัญญา"], ["QPS|Peak QPS", "จำนวนคำขอต่อวินาที; peak คือช่วงที่รับสูงสุดตามสมมติฐาน", "300 ล้านโพสต์ต่อวันเฉลี่ยประมาณ 3,500 QPS", "ต้องระบุประเภทคำขอและตรวจ peak ด้วยข้อมูลจริง"], ["DAU|MAU", "จำนวนผู้ใช้รายวันและรายเดือนตามนิยาม active ของระบบ", "MAU 300 ล้านกับสัดส่วนรายวัน 50% ให้ DAU 150 ล้าน", "อย่าสับสนจำนวนผู้ใช้กับจำนวน request"], ["Replication|overhead", "Replication คือทำสำเนา; overhead คือพื้นที่เพิ่มนอกข้อมูลหลัก", "สามสำเนาและ overhead 20% ใช้ตัวคูณ 3 × 1.2", "สำเนาไม่ใช่ backup และ overhead จริงขึ้นกับระบบ"], ["benchmark|load test", "การวัดระบบภายใต้เงื่อนไขและงานที่ระบุ", "ทดสอบโพสต์รูปหลายขนาดภายใต้ latency เป้าหมาย", "ผลจากเครื่องหรือ workload อื่นไม่ใช่การรับประกัน"], ["Cache|memory", "Cache เก็บสำเนาที่ใช้บ่อย; memory คือหน่วยความจำทำงาน", "อ่านข้อมูลที่อยู่ใน memory ลดการรอ disk", "ข้อมูลอาจเก่าและพื้นที่มีจำกัด"]];
const dictionary = new Map();
for (const [aliases, meaning, example, warning] of entries) {
  const names=aliases.split('|');
  for (const alias of names) dictionary.set(alias.toLowerCase(), {title:names[0],meaning,example,warning});
}
const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const pattern = new RegExp(`(?<![A-Za-z0-9_])(${[...dictionary.keys()].sort((a,b)=>b.length-a.length).map(escapeRegex).join('|')})(?![A-Za-z0-9_])`,'gi');

export function installTermHints(root) {
  const hint=document.createElement('section');
  hint.id='term-hint';
  hint.setAttribute('popover','auto');
  hint.setAttribute('role','dialog');
  hint.setAttribute('aria-labelledby','term-hint-title');
  hint.innerHTML='<div class="term-hint-heading"><h2 id="term-hint-title"></h2><button type="button" aria-label="ปิดคำอธิบายศัพท์">ปิด ×</button></div><dl><dt>ความหมาย</dt><dd id="term-meaning"></dd><dt>ตัวอย่างในระบบ</dt><dd id="term-example"></dd><dt>ข้อควรระวัง</dt><dd id="term-warning"></dd></dl>';
  document.body.append(hint);
  let trigger=null;
  const close=()=>{hint.hidePopover();if(trigger?.isConnected)trigger.focus({preventScroll:true});};
  hint.querySelector('button').onclick=close;
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&hint.matches(':popover-open')){event.preventDefault();close();}});
  hint.addEventListener('toggle',()=>{if(trigger?.isConnected)trigger.setAttribute('aria-expanded',String(hint.matches(':popover-open')));});
  function position(){
    if(!hint.matches(':popover-open')||!trigger?.isConnected)return;
    const r=trigger.getBoundingClientRect(), w=hint.offsetWidth,h=hint.offsetHeight;
    hint.style.left=Math.max(12,Math.min(r.left,innerWidth-w-12))+'px';
    hint.style.top=Math.max(12,Math.min(r.bottom+8,innerHeight-h-12))+'px';
  }
  root.addEventListener('click',event=>{
    const button=event.target.closest('.term-trigger');if(!button)return;
    if(trigger===button&&hint.matches(':popover-open')){close();return;}
    if(trigger?.isConnected)trigger.setAttribute('aria-expanded','false');
    trigger=button;
    const entry=dictionary.get(button.dataset.term);
    hint.querySelector('h2').textContent=entry.title;
    hint.querySelector('#term-meaning').textContent=entry.meaning;
    hint.querySelector('#term-example').textContent=entry.example;
    hint.querySelector('#term-warning').textContent=entry.warning;
    hint.showPopover();trigger.setAttribute('aria-expanded','true');position();hint.querySelector('button').focus({preventScroll:true});
  });
  window.addEventListener('resize',position);
  document.addEventListener('scroll',position,true);
  const observer=new MutationObserver(enrich);
  function enrich(){
    observer.disconnect();
    if(trigger&&!trigger.isConnected){hint.hidePopover();trigger=null;}
    // Only explanatory prose, never navigation, input labels, quizzes or action buttons.
    for(const target of root.querySelectorAll('.lesson-intro p, .lesson-steps li, .lesson-notes p, .concept p')){
      const walker=document.createTreeWalker(target,NodeFilter.SHOW_TEXT);
      const nodes=[];while(walker.nextNode())if(!walker.currentNode.parentElement.closest('button,a,code,pre,input,select,textarea,label'))nodes.push(walker.currentNode);
      const seen=new Set([...target.querySelectorAll('[data-term]')].map(x=>dictionary.get(x.dataset.term)?.title));
      for(const node of nodes){
        const text=node.textContent;pattern.lastIndex=0;let start=0,match;const fragment=document.createDocumentFragment();let changed=false;
        while((match=pattern.exec(text))){const key=match[0].toLowerCase(),entry=dictionary.get(key);if(seen.has(entry.title))continue;seen.add(entry.title);
          fragment.append(document.createTextNode(text.slice(start,match.index)));
          const button=document.createElement('button');button.type='button';button.className='term-trigger';button.dataset.term=key;button.textContent=match[0];button.setAttribute('aria-label','อธิบายคำศัพท์ '+match[0]);button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls',hint.id);button.setAttribute('aria-expanded','false');fragment.append(button);start=match.index+match[0].length;changed=true;
        }
        if(changed){fragment.append(document.createTextNode(text.slice(start)));node.replaceWith(fragment);}
      }
    }
    observer.observe(root,{childList:true,subtree:true,characterData:true});
  }
  enrich();
}
