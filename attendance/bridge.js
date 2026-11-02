/* No separate login, learners, staff, school or class database. */
let integration=null;
const host=()=>parent.AnalyserAttendance;
ctx=function(){return `<div class="ctx"><b>${esc(D.school)} · ${esc(R.className)} · ${esc(R.name)}</b><div class="chips">${R.terms.map(t=>`<button class="chip ${t.n===D.t?'on':''}" data-act="term" data-n="${t.n}">Term ${t.n}</button>`).join('')}</div></div>`};
setView=function(){const t=TM();return `<div class="card"><h3>Attendance settings · Term ${t.n}</h3><p>School, class, year and learner details come from the analyser. Term week 1 starts on a Monday. Set the exact last school day to avoid counting unused days in the final week.</p><div class="grid2"><div><label>Week 1 starts (Monday)</label><input type="date" id="f-start" value="${t.start}"></div><div><label>Term weeks (1–30)</label><input type="number" id="f-weeks" min="1" max="30" value="${t.weeks}"></div><div><label>Last school day</label><input type="date" id="f-end" value="${t.end||''}"></div></div><p><button class="btn" data-act="merged-settings">Save attendance settings</button><button class="btn red" data-act="clrterm">Clear this term's marks</button></p><p>Report-card format and holiday counting are selected under Report Cards. Weekly and yearly summaries keep the original recorded-session calculations.</p></div>`};
const originalSaveMarks=saveMarks;
saveMarks=function(rows){rows=rows.map(r=>({...r,register_id:R.id}));originalSaveMarks(rows);host().changed()};
const oldWr=wr;wr=function(fn){return oldWr(fn).then(r=>{host().changed();return r})};
loadHols=async function(){HOLS=await q(SB.from('holidays').select('*').eq('school_id',CURS).order('hdate'))};
loadRegister=async function(id,keep){
 const data=await host().open();integration=data;
 R={id:data.register.id,name:data.scope.year,className:data.scope.cls,students:data.scope.learners.map(l=>({...l,...(l.profile||{}),social:l.needs||'',repeater:l.rep||''})),terms:data.terms.sort((a,b)=>a.n-b.n).map(t=>({id:t.id,n:t.n,start:t.start_date||'',end:t.end_date||'',weeks:t.weeks,data:{}}))};
 for(const m of data.marks){const t=R.terms.find(t=>t.id===m.term_id);if(t)(t.data[m.week]??={})[m.learner_id]=m.codes}
 sortStu();HOLS=data.holidays;if(!keep)cw=1;lastSync=Date.now();
};
const blocked=new Set(['newlrn','edit','savelrn','dellrn','del','add','impl','newreg','delreg','addterm','delterm','admin','logout','chpw','saveset','exp','showcreate','showlogin','retry','install']);
async function mergedClick(e){
 const b=e.target.closest('[data-act]'),a=b?.dataset.act;
 if(blocked.has(a))return host().returnLearners();
 if(a==='v'&&!['dash','week','sum','year','hol','set'].includes(b.dataset.v))return;
 const mutating=e.target.closest('td.c')||['col','clr','clrterm','addwk','rmwk','loadug','addhol','savehol','delhol','merged-settings'].includes(a);
 if(mutating&&!integration.scope.write)return toast('You are not assigned to mark this class.');
 if(['merged-settings','clrterm','addwk','rmwk','delhol'].includes(a)&&!integration.scope.manage)return toast('Only the class teacher or school leadership can change attendance settings.');
 if(a==='merged-settings'){
  const t=TM(),raw=$('#f-start').value,start=mon(raw),weeks=Number($('#f-weeks').value),end=$('#f-end').value;
  if(!start||weeks<1||weeks>30||!Number.isInteger(weeks))return toast('Enter the start date and 1–30 weeks.');
  const last=new Date(start+'T00:00:00');last.setDate(last.getDate()+weeks*7-3);
  if(!end||end<start||end>iso(last))return toast('Choose the last school day within these term weeks.');
  if(start!==raw&&!await ask('Week 1 will start on Monday '+start+'. Continue?'))return;
  if(weeks<t.weeks&&Object.keys(t.data).some(w=>+w>weeks))return toast('Clear marks in later weeks before reducing the calendar.');
  await wr(()=>q(SB.from('terms').update({start_date:start,end_date:end,weeks}).eq('id',t.id)));
  Object.assign(t,{start,end,weeks});cw=Math.min(cw,weeks);toast('Attendance settings saved');return render();
 }
 if(a==='term')host().selectTerm(Number(b.dataset.n));
 if(a==='v'&&b.dataset.v==='set'&&!integration.scope.manage)return toast('Only the class teacher or school leadership can change settings.');
 if(a==='addwk'||a==='rmwk')return toast('Change the term weeks and last school day in Attendance settings.');
 await onClick(e);
}
(async()=>{try{
 if(parent===window||!host())throw Error('Open Attendance from inside the analyser.');
 const s=host().scope();
 SB={from:t=>host().from(t)};ME={...s.me,role:s.manage?'headteacher':'teacher',school_name:s.school.name,classes:[]};
 CURS=s.school.id;SCHOOLS=[s.school];D.t=s.term;
 await loadRegister();REGS=[{id:R.id,class_name:R.className,name:R.name,school_id:CURS}];render();
}catch(e){$('#main').textContent='Attendance could not load: '+(e.message||e)+'. Run attendance-install.sql in the analyser database, then reload.'}})();
// CSV companions use the same datasets as the retained PDF summaries.
const originalRender=render;
render=function(){originalRender();if(!R)return;
 for(const [act,fn,name] of [['pdfs',()=>sumData(TM()),'Term-summary'],['pdfy',yearData,'Yearly-summary']]){
  const pdfButton=document.querySelector('[data-act="'+act+'"]');if(!pdfButton)continue;
  const b=document.createElement('button');b.className='btn alt';b.textContent='Export Excel (CSV)';b.onclick=()=>{const d=fn();saveFile(name+'-'+fname(R.className)+'-'+R.name+'.csv','\uFEFF'+toCSV([d.head,...d.body.map(r=>r.a),d.foot]),'text/csv')};pdfButton.after(b);
 }
 const holidayButton=document.querySelector('[data-act="pdfhol"]');if(holidayButton){const b=document.createElement('button');b.className='btn alt';b.textContent='Export Excel (CSV)';b.onclick=()=>saveFile('Holidays-'+yearNum()+'.csv','\uFEFF'+toCSV([['Date','Holiday','Class'],...holRows(holYear||yearNum()).map(r=>[r.date,r.name,r.where||''])]),'text/csv');holidayButton.after(b)}
};
