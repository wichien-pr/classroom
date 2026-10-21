import {lessonLayouts} from './lesson-layout-data.js';
// Move existing nodes, not copies: listeners, control IDs and scoring stay intact.
export function mountLessonLayout(main,kind){
 const config=lessonLayouts[kind];if(!config)return;
 const find=s=>main.querySelector(s),teaching=find('.teaching'),intro=teaching.firstElementChild,lab=find('.lab'),quiz=find('.quiz');
 main.classList.add('sequence-lesson');intro.classList.add('lesson-intro');intro.querySelector('h2').textContent=config.title;intro.querySelector('p:not(.eyebrow)').textContent=config.intro;
 const comparison=document.createElement('section');comparison.className='lesson-comparison';
 comparison.innerHTML='<h2>เห็นความต่าง ก่อนลงมือ</h2><figure class="lesson-compare-card"><figcaption>'+config.title+'</figcaption><div class="lesson-card-pair">'+config.cards.map(([title,text])=>`<div><strong>${title}</strong><p>${text}</p></div>`).join('')+'</div></figure>';
 const steps=intro.querySelector('.experiment');steps.querySelector('p').outerHTML='<ol class="lesson-steps">'+config.steps.map(s=>`<li>${s}</li>`).join('')+'</ol><p class="lesson-step-note">'+config.note+' · การตั้งค่าและรีเซ็ตไม่เพิ่มคะแนนหรือเปลี่ยนประวัติเดิม</p>';lab.querySelector('.panel-title').after(steps);
 const details=document.createElement('details');details.id='lesson-details';details.innerHTML='<summary>อ่านเพิ่มเติม · หลักการและข้อจำกัดของแบบจำลอง</summary>';
 for(const section of [...teaching.children])if(section!==intro&&section!==quiz){section.classList.add('lesson-notes');details.append(section);}
 find('.learning-grid').replaceChildren(intro,comparison,lab,details,quiz);
 const controls=find('.controls');
 for(const [name,ids] of config.groups){const group=document.createElement('fieldset');group.className='lesson-control-group';const legend=document.createElement('legend');legend.textContent=name;group.append(legend);for(const id of ids){const control=find('#'+id);group.append(control.closest('label')||control);}controls.append(group);}
 // Existing supplementary fieldsets remain visible; only the reading notes collapse.
 for(const fieldset of controls.querySelectorAll(':scope > fieldset'))fieldset.classList.add('lesson-control-group');
 const actions=[...controls.querySelectorAll(':scope > button')];
 const submit=document.createElement('div');submit.className='lesson-submit';submit.setAttribute('role','group');submit.setAttribute('aria-label','ลงมือทดลอง');submit.append(...actions);controls.append(submit);
 const extra=controls.querySelector('.cache-extras')||controls.querySelector('#promote')?.closest('fieldset');if(extra){extra.classList.add('lesson-extra-controls');controls.append(extra);}
 for(const label of controls.querySelectorAll('label:has(input[type=checkbox])'))label.classList.add('check');
 const scoring=document.createElement('details');scoring.className='lesson-score-help';scoring.innerHTML='<summary>คะแนนและเงื่อนไขการเรียนจบ</summary>';scoring.append(find('.participation small'));find('.participation').append(scoring);
}
