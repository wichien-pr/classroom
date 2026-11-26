'use strict';
const $ = s => document.querySelector(s);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels = {draft:'ร่าง',submitted:'รอ CTO ตรวจ',changes_requested:'ต้องแก้ไข',approved:'CTO อนุมัติแล้ว'};
let state, busy=false, retry=null, selectedStep=null, foregroundRevision=0;
const initialStep=steps=>(steps.find(s=>s.unlocked && s.state!=='approved') || steps.at(-1)).step;
function stepNav(steps,selected){
 return `<nav class="step-path" aria-label="เส้นทางโปรเจกต์"><p class="eyebrow">PROJECT PATH · 7 STEPS</p>${steps.map(s=>`<button data-nav-step="${s.step}" data-locked="${!s.unlocked}" ${s.unlocked?'':'disabled aria-disabled="true"'} ${s.step===selected?'aria-current="step"':''}><span class="step-number">${s.state==='approved'?'✓':s.step}</span><span><strong>Step ${s.step} · ${esc(s.title)}</strong><small>${!s.unlocked?'ล็อก · รอขั้นก่อนหน้าอนุมัติ':s.state==='draft'?'ขั้นปัจจุบัน · ร่าง':labels[s.state]}</small></span></button>`).join('')}</nav><label class="mobile-path">เลือกขั้นตอน<select data-step-select aria-label="เลือกขั้นตอน">${steps.map(s=>`<option value="${s.step}" ${s.step===selected?'selected':''} ${s.unlocked?'':'disabled'}>Step ${s.step} · ${s.unlocked?labels[s.state]:'ล็อก'} · ${esc(s.title)}</option>`).join('')}</select></label>`;
}
function status(text){ $('#status').textContent=text; }
function lock(value){ busy=value; document.querySelectorAll('button, select').forEach(b=>{ b.disabled=value || b.dataset.locked==='true'; }); }
async function request(path='/api/cto-project', payload=null, signal=undefined){
 const response=await fetch(path,{signal,method:payload?'POST':'GET',headers:payload?{'Content-Type':'application/json','X-CSRF-Token':state.csrf_token}:{},body:payload?JSON.stringify(payload):undefined});
 if(!response.ok) throw new Error(`${response.status}: ${((await response.json().catch(()=>null))?.error)||'request_failed'}`);
 return response.json();
}
async function run(task){
 if(busy)return;
 foregroundRevision++;
 lock(true);status('กำลังติดต่อเซิร์ฟเวอร์…');$('#retry').hidden=true;
 try { await task();retry=null;status('บันทึก/โหลดสถานะจากเซิร์ฟเวอร์แล้ว'); }
 catch(error){ retry=task;$('#retry').hidden=false;status(`ไม่สำเร็จ (${error.message}) — ข้อความยังอยู่ ลองคำขอเดิมอีกครั้ง; ถ้า 409 ให้โหลดสถานะล่าสุด`); }
 finally{lock(false);}
}
const list=items=>`<ul>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
function stepCard(s){
 const editable=s.unlocked && ['draft','changes_requested'].includes(s.state);
 return `<article data-step="${s.step}" data-state="${s.state}" class="${s.unlocked?'':'locked'}"><span class="badge">STEP ${s.step} · ${esc(s.weeks)} · ${labels[s.state]}${s.unlocked?'':' · ล็อก'}</span><h2>${esc(s.title)}</h2><p>${esc(s.tasks)}</p><p><strong>สิ่งที่ต้องส่ง:</strong> ${esc(s.deliverables)}</p><p><strong>AI / Agent:</strong> ${esc(s.ai)}</p>${s.feedback?`<p class="feedback"><strong>Feedback CTO:</strong> ${esc(s.feedback)}</p>`:''}<label>หลักฐาน / Evidence<textarea data-field="evidence" maxlength="3000" ${editable?'':'disabled'}>${esc(s.evidence)}</textarea></label><label>AI usage & reflection<textarea data-field="reflection" maxlength="3000" ${editable?'':'disabled'}>${esc(s.reflection)}</textarea></label>${editable?'<div class="tools"><button data-action="save">บันทึกร่าง</button><button class="primary" data-action="submit">ส่งตรวจ</button></div>':''}</article>`;
}
function render(previous=null, previousStep=selectedStep){
 $('#review').hidden=!state.reviewer;
 if(!state.project){$('#workspace').innerHTML='<button class="primary" id="start">เริ่มโปรเจกต์</button>';return;}
 const p=state.project, approved=state.steps.filter(s=>s.state==='approved').length;
 selectedStep ??= initialStep(state.steps);
 const html=`<div class="step-layout">${stepNav(state.steps,selectedStep)}<section class="step-detail" tabindex="0" aria-label="รายละเอียดขั้นตอน"><details class="project"><summary>โจทย์ที่ได้รับ · ${esc(p.title)} · อนุมัติ ${approved}/7</summary><span class="eyebrow">${esc(p.kind)} · DIFFICULTY ${p.difficulty}/5</span><h2 id="project-title">${esc(p.title)}</h2><h3>Requirements</h3>${list(p.requirements)}<h3>Acceptance examples</h3>${list(p.examples)}<details><summary>ขอบเขตและเกณฑ์คุณภาพ</summary>${list(p.nonfunctional)}</details><p><strong>CTO อนุมัติ ${approved}/7 ขั้น${approved===7?' · โปรเจกต์ผ่านการตรวจครบแล้ว':''}</strong></p><progress value="${approved}" max="7" aria-label="ขั้นตอนที่ CTO อนุมัติ"></progress></details>${stepCard(state.steps.find(s=>s.step===selectedStep))}<details class="rubric"><summary>ประวัติหลักฐานและการตรวจ (${state.history.length})</summary>${state.history.map(h=>`<section><h3>Step ${h.step} · ${esc(h.action)} · actor #${h.actor}</h3><p>${esc(new Date(h.created*1000).toLocaleString('th-TH'))}</p><pre>${esc(h.evidence)}</pre><pre>${esc(h.reflection)}</pre><pre>${esc(h.feedback)}</pre></section>`).join('')}</details></section></div>`;
 if(!previous){$('#workspace').innerHTML=html;return;}
 // Only changed regions are replaced; the scroll container and unaffected controls stay mounted.
 const fresh=document.createElement('template');fresh.innerHTML=html;
 const detail=$('#workspace .step-detail'), scroll=detail.scrollTop;
 const replace=(selector)=>{
  const old=$(`#workspace ${selector}`), next=fresh.content.querySelector(selector);
  if(old.matches('details'))next.open=old.open;
  const opens=[...old.querySelectorAll('details')].map(d=>d.open);
  next.querySelectorAll('details').forEach((d,i)=>d.open=opens[i] || false);
  if(old.outerHTML===next.outerHTML)return;
  const focused=document.activeElement===old;
  old.replaceWith(next);if(focused)next.focus({preventScroll:true});
 };
 state.steps.forEach(s=>replace(`[data-nav-step="${s.step}"]`));
 const select=$('#workspace [data-step-select]'), nextSelect=fresh.content.querySelector('[data-step-select]');
 if(select.innerHTML!==nextSelect.innerHTML)select.innerHTML=nextSelect.innerHTML;
 if(JSON.stringify(previous.project)!==JSON.stringify(state.project))replace('.project');
 else if(previous.steps.filter(s=>s.state==='approved').length!==approved){
  for(const selector of ['.project > summary','.project > p > strong'])$(`#workspace ${selector}`).textContent=fresh.content.querySelector(selector).textContent;
  $('#workspace .project > progress').value=approved;
 }
 if(previousStep!==selectedStep || JSON.stringify(previous.steps.find(s=>s.step===selectedStep))!==JSON.stringify(state.steps.find(s=>s.step===selectedStep)))replace('[data-step]');
 if(JSON.stringify(previous.history)!==JSON.stringify(state.history)){
  // Server history is append-only. Keep existing entries and the disclosure focus/selection.
  if(JSON.stringify(previous.history)===JSON.stringify(state.history.slice(0,previous.history.length))){
   $('#workspace .rubric > summary').textContent=fresh.content.querySelector('.rubric > summary').textContent;
   [...fresh.content.querySelectorAll('.rubric > section')].slice(previous.history.length).forEach(entry=>$('#workspace .rubric').append(entry));
  }else replace('.rubric');
 }
 detail.scrollTop=previousStep===selectedStep?scroll:0;
}
async function load(){
 const previous=state;
 state=await request();
 if(previous?.steps?.some(s=>s.state==='submitted' && state.steps.find(next=>next.step===s.step)?.state==='approved'))selectedStep=initialStep(state.steps);
 render();
}
// Background reads must not enter run(): its foreground lock and render interrupt reading.
let pollInFlight=false, pollFailures=0, pollAfter=0;
async function poll(){
 if(pollInFlight || Date.now()<pollAfter || busy || retry || $('#workspace').hidden || !state?.steps?.some(s=>s.state==='submitted'))return;
 pollInFlight=true;
 const revision=foregroundRevision;
 try {
  const next=await request('/api/cto-project',null,AbortSignal.timeout(10000));
  if(revision!==foregroundRevision || busy || $('#workspace').hidden)return;
  if(pollFailures)status('อัปเดตสถานะจากเซิร์ฟเวอร์แล้ว');
  pollFailures=0;pollAfter=0;
  const previous=state;
  state=next;
  if(JSON.stringify([previous.project,previous.steps,previous.history,previous.reviewer])===JSON.stringify([next.project,next.steps,next.history,next.reviewer]))return;
  const previousStep=selectedStep;
  if(previous.steps.some(s=>s.step===selectedStep && s.state==='submitted' && next.steps.find(n=>n.step===s.step)?.state==='approved'))selectedStep=initialStep(next.steps);
  render(previous,previousStep);
 } catch {
  if(revision!==foregroundRevision || busy || $('#workspace').hidden)return;
  if(!pollFailures)status('ตรวจสถานะอัตโนมัติไม่ได้ชั่วคราว — จะลองใหม่อัตโนมัติ หรือกดโหลดสถานะล่าสุด');
  pollFailures++;pollAfter=Date.now()+Math.min(30000,4000*2**Math.min(pollFailures-1,3));
 }
 finally {pollInFlight=false;}
}
setInterval(poll,2000);
let reviewProjects=[], reviewUser=null, reviewStep=null;
const reviewDrafts=new Map();
function renderDashboard(){
 $('#workspace').hidden=true;$('#dashboard').hidden=false;
 const p=reviewProjects.find(p=>p.user_id===reviewUser) || reviewProjects[0];
 if(!p){$('#dashboard').innerHTML='<button data-back>กลับโปรเจกต์ของฉัน</button><p>ยังไม่มีโปรเจกต์ให้ตรวจ</p>';return;}
 reviewUser=p.user_id;reviewStep ??= initialStep(p.steps);
 const s=p.steps.find(s=>s.step===reviewStep), key=`${p.user_id}-${s.step}`;
 $('#dashboard').innerHTML=`<div class="review-toolbar"><button data-back>กลับโปรเจกต์ของฉัน</button><label>โปรเจกต์ที่ตรวจ<select data-review-user>${reviewProjects.map(p=>`<option value="${p.user_id}" ${p.user_id===reviewUser?'selected':''}>${esc(p.name)} · #${p.user_id} · ${esc(p.project.title)}</option>`).join('')}</select></label></div><div class="step-layout">${stepNav(p.steps,reviewStep)}<section class="step-detail" tabindex="0" aria-label="รายละเอียดการตรวจ"><p class="review-identity">${esc(p.name)} · #${p.user_id} · ${esc(p.project.title)}</p><p>ตรวจหลักฐานจริงก่อนอนุมัติ — ไม่ใช่ automated test · ${p.steps.filter(s=>s.state==='approved').length}/7 approved</p><article data-review="${key}" data-version="${s.version}"><h2>Step ${s.step} · ${esc(s.title)}</h2><span class="badge">${labels[s.state]}</span><h3>หลักฐาน / Evidence</h3><pre>${esc(s.evidence)}</pre><h3>AI usage & reflection</h3><pre>${esc(s.reflection)}</pre><p class="feedback">${esc(s.feedback)}</p>${s.state==='submitted'?`<label>Feedback CTO<textarea maxlength="3000">${esc(reviewDrafts.get(key) || '')}</textarea></label><div class="tools"><button data-decision="changes_requested">ขอแก้ไข</button><button data-decision="approved">Pass</button></div>`:''}</article></section></div>`;
}
async function dashboard(){
 let cursor=null, projects=[];
 do {const page=await request('/api/cto-project/review'+(cursor?`?after=${cursor}`:''));projects.push(...page.projects);cursor=page.next;} while(cursor!==null);
 reviewProjects=projects;renderDashboard();
}
$('#dashboard').addEventListener('input',e=>{
 const card=e.target.closest('[data-review]');if(card && e.target.matches('textarea'))reviewDrafts.set(card.dataset.review,e.target.value);
});
$('#dashboard').addEventListener('change',e=>{
 if(busy)return;
 if(e.target.matches('[data-review-user]')){reviewUser=Number(e.target.value);reviewStep=null;renderDashboard();$('#dashboard [data-review-user]').focus();}
 if(e.target.matches('[data-step-select]')){reviewStep=Number(e.target.value);renderDashboard();$('#dashboard [data-step-select]').focus();}
});
$('#workspace').addEventListener('change',e=>{
 if(e.target.matches('[data-step-select]') && !busy){const step=Number(e.target.value);if(state.steps.find(s=>s.step===step)?.unlocked){selectedStep=step;render();$('[data-step-select]').focus();}}
});
// Keep navigation drafts in this tab only; explicit reload replaces them with server state.
$('#workspace').addEventListener('input',e=>{
 const field=e.target.dataset.field, card=e.target.closest('[data-step]');
 if(field && card && !e.target.disabled) state.steps.find(s=>s.step===Number(card.dataset.step))[field]=e.target.value;
});
$('#workspace').addEventListener('click',e=>{
 const button=e.target.closest('button');if(!button||busy)return;
 if(button.id==='start'){run(async()=>{state=await request('/api/cto-project',{action:'start'});render();});return;}
 if(button.dataset.navStep){const step=Number(button.dataset.navStep);if(state.steps.find(s=>s.step===step)?.unlocked){selectedStep=step;render();$(`[data-nav-step="${step}"]`).focus();}return;}
 if(!button.dataset.action)return;
 const card=button.closest('[data-step]'),step=Number(card.dataset.step),s=state.steps[step-1];
 const payload={action:button.dataset.action,step,version:s.version,request_id:crypto.randomUUID(),evidence:card.querySelector('[data-field="evidence"]').value,reflection:card.querySelector('[data-field="reflection"]').value};
 run(async()=>{state=await request('/api/cto-project',payload);render();});
});
$('#dashboard').addEventListener('click',e=>{
 const button=e.target.closest('button');if(!button||busy)return;
 if(button.hasAttribute('data-back')){$('#dashboard').hidden=true;$('#workspace').hidden=false;$('#review').focus();return;}
 if(button.dataset.navStep){reviewStep=Number(button.dataset.navStep);renderDashboard();$(`#dashboard [data-nav-step="${reviewStep}"]`).focus();return;}
 if(!button.dataset.decision)return;
 const card=button.closest('[data-review]'),[uid,step]=card.dataset.review.split('-').map(Number);
 const payload={action:button.dataset.decision,step,version:Number(card.dataset.version),request_id:crypto.randomUUID(),feedback:card.querySelector('textarea').value};
 run(async()=>{const reviewed=await request(`/api/cto-project/review/${uid}`,payload);reviewDrafts.delete(`${uid}-${step}`);if(payload.action==='approved')reviewStep=initialStep(reviewed.steps);await dashboard();});
});
$('#retry').onclick=()=>retry&&run(retry);
$('#reload').onclick=()=>{if(!busy && confirm('โหลดข้อมูลที่บันทึกแล้วแทนข้อความที่ยังไม่ได้บันทึก?'))run(load);};
$('#review').onclick=()=>run(dashboard);
run(load);
