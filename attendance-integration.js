const ATT_PROFILE=[['nationality','Nationality'],['religion','Religion'],['orphan','Orphan status'],['father',"Father’s name"],['father_tel',"Father’s contact"],['mother',"Mother’s name"],['mother_tel',"Mother’s contact"],['address',"Parents’ address"]];
/* AttendApp uses the analyser's authenticated session, school, class and learners. */
const ATT={data:null,key:'',error:'',loading:false};
const attKey=()=>[ctx.sch,ctx.year,ctx.cls].join('|');
function attOpen(){tab=14;render()}
function vAttendance(){return `<div class="card"><h2>Attendance</h2>${rcBar()}<p>Learner names and details are managed in <button class="btn s" onclick="tab=1;render()">Class register</button>. Accounts and class assignments use analyser Administration.</p>${(FULL()||ISCT(ctx.cls))?`<label class="btn s" style="display:inline-block">Import old AttendApp backup<input type="file" accept=".json,application/json" style="display:none" onchange="if(this.files[0])attImportFile(this.files[0])"></label>`:''}</div><iframe title="Attendance dashboard and registers" src="attendance/index.html" style="width:100%;height:80vh;min-height:620px;border:0" id="attendanceFrame"></iframe>`}
async function attRows(table,filters){let out=[];for(let offset=0;;offset+=1000){let q=SB.from(table).select('*');for(const [k,v]of Object.entries(filters))q=q.eq(k,v);const r=await q.order('id').range(offset,offset+999);if(r.error)throw r.error;out.push(...r.data);if(r.data.length<1000)return out}}
async function attRead(){
 const key=attKey(),scope={school_id:ctx.sch,year:String(ctx.year),class_name:ctx.cls};
 const regs=await attRows('attendance_registers',scope),register=regs[0];
 const terms=register?await attRows('attendance_terms',{register_id:register.id}):[];
 const marks=register?await attRows('attendance_marks',{register_id:register.id}):[];
 const holidays=await attRows('attendance_holidays',{school_id:ctx.sch});
 return{key,register,terms,marks,holidays};
}
async function attLoadReport(){const key=attKey();ATT.error='';try{const data=await attRead();if(key===attKey()){ATT.data=data;ATT.key=key}}catch(e){ATT.data=null;ATT.key='';ATT.error=e.message||String(e)}}
function attReport(id){
 if(ATT.key!==attKey()||!ATT.data)return '—';
 const term=ATT.data.terms.find(t=>t.n===Number(String(ctx.term).replace(/\D/g,'')));
 const r=attendanceResult(term,ATT.data.marks.filter(m=>m.term_id===term?.id),ATT.data.holidays,id,!!RCS.cls.attHolidays);
 if(!r||!r.total)return '—';
 return RCS.cls.attFormat==='percent'?r.percentage.toFixed(1)+'%':r.days+' / '+r.total;
}
function attReportControls(){return `<h3>Attendance from the class register</h3><div class="g"><div><label>Report-card attendance format</label><select onchange="rcS('attFormat',this.value)"><option value="days" ${RCS.cls.attFormat!=='percent'?'selected':''}>Days attended / overall school days</option><option value="percent" ${RCS.cls.attFormat==='percent'?'selected':''}>Percentage present</option></select></div><div><label>Include holidays in total school days?</label><select onchange="rcS('attHolidays',this.value==='yes')"><option value="no" ${!RCS.cls.attHolidays?'selected':''}>No — exclude holidays</option><option value="yes" ${RCS.cls.attHolidays?'selected':''}>Yes — include holidays</option></select></div></div><p>Attendance is fetched automatically. Each present morning or afternoon counts as half a day. The total covers all Monday–Friday sessions between the configured term dates. Unmarked sessions add no present time. Including holidays increases the total; it does not mark a learner present. <button class="btn s" onclick="attOpen()">Open Attendance</button><button class="btn s" onclick="attLoadReport().then(render)">Refresh attendance</button></p>${ATT.error?`<p style="color:var(--bad)">Attendance unavailable: ${esc(ATT.error)}. Run attendance-install.sql before using this module.</p>`:!ATT.data?.register?'<p>Set the term calendar in Attendance settings to populate this field.</p>':''}`}
window.AnalyserAttendance={
 scope(){if(!ME||NEEDLOGIN||NEEDJOIN)throw Error('Sign in to the analyser first.');return{school:CS(),year:String(ctx.year),cls:ctx.cls,term:Number(String(ctx.term).replace(/\D/g,''))||1,me:ME,learners:LI(),manage:FULL()||ISCT(ctx.cls),write:FULL()||TEACH.some(t=>t.class_name===ctx.cls)}},
 async open(){
  const s=this.scope(),key=attKey();if(!s.school.id||!s.year||!s.cls)throw Error('Select a school, year and class in the analyser.');
  let data=await attRead();if(key!==attKey())throw Error('The selected class changed. Open Attendance again.');
  if(!data.register){if(!s.write)throw Error('This class has no attendance calendar. Ask its class teacher to open Attendance.');
   const r=await SB.from('attendance_registers').upsert({school_id:s.school.id,year:s.year,class_name:s.cls},{onConflict:'school_id,year,class_name'}).select().single();if(r.error)throw r.error;data.register=r.data;
  }
  const missing=[1,2,3].filter(n=>!data.terms.some(t=>t.n===n));
  if(missing.length&&s.write){const r=await SB.from('attendance_terms').upsert(missing.map(n=>({register_id:data.register.id,n,weeks:12})),{onConflict:'register_id,n',ignoreDuplicates:true});if(r.error)throw r.error;data=await attRead()}
  if(key!==attKey())throw Error('The selected class changed. Open Attendance again.');return{...data,scope:s};
 },
 from(table){const map={terms:'attendance_terms',marks:'attendance_marks',holidays:'attendance_holidays',registers:'attendance_registers'};if(!map[table])throw Error('Manage shared records in the analyser.');return SB.from(map[table])},
 changed(){ATT.key='';},
 selectTerm(n){ctx.term='Term '+n;},
 returnLearners(){tab=1;render()}
};
const attOldRefresh=refresh;refresh=async function(){if(tab===14)return;return attOldRefresh()};
const attOldPreview=rcPreview;rcPreview=async function(id){const key=attKey();await attLoadReport();if(key!==attKey())return;if(ATT.error)return alert('Cannot fetch attendance: '+ATT.error);return attOldPreview(id)};
const attOldPrint=rcPrint;rcPrint=async function(...args){const key=attKey();await attLoadReport();if(key!==attKey())return;if(ATT.error)return alert('Cannot fetch attendance: '+ATT.error);return attOldPrint(...args)};
let ATT_IMPORT=null;
async function attImportFile(file){try{
 if(!(FULL()||ISCT(ctx.cls)))throw Error('Only the class teacher or school leadership can import.');
 const b=JSON.parse(await file.text());if(!['registers','terms','learners','marks'].every(k=>Array.isArray(b[k])))throw Error('Choose an AttendApp full JSON backup.');
 ATT_IMPORT={backup:b,key:attKey(),register:null};
 mdlg.innerHTML=`<div class="b"><h2>Import old AttendApp attendance</h2><p>Destination: ${esc(CS().name)} · ${esc(ctx.cls)} · ${esc(ctx.year)}. This imports attendance into an empty class calendar. Existing analyser learners and accounts stay in use.</p><label>Choose the source school / class / year</label><select id="att-source"><option value="">Select source register</option>${b.registers.map(r=>`<option value="${esc(r.id)}">${esc((b.schools||[]).find(s=>s.id===r.school_id)?.name||r.school_id)} · ${esc(r.class_name)} · ${esc(r.name)}</option>`).join('')}</select><button class="btn" onclick="attImportMap(document.getElementById('att-source').value)">Review learner matching</button><button class="btn s" onclick="mdlg.style.display='none'">Cancel</button></div>`;mdlg.style.display='flex';
 }catch(e){alert(e.message||e)}}
function attImportMap(id){const x=ATT_IMPORT;if(!x||x.key!==attKey())return alert('The destination changed. Start the import again.');
 const source=x.backup.registers.find(r=>r.id===id);if(!source)return alert('Choose a source register.');x.register=source;
 const learners=x.backup.learners.filter(l=>l.register_id===id),dest=LI();x.learners=learners;
 mdlg.innerHTML=`<div class="b" style="max-height:90vh;overflow:auto"><h2>Review attendance import</h2><p>From ${esc(source.class_name)} · ${esc(source.name)} to ${esc(CS().name)} · ${esc(ctx.cls)} · ${esc(ctx.year)}. Review every match. Skipped learners are not imported. No new learners or accounts are created.</p><table><tr><th>Old AttendApp learner</th><th>Analyser learner</th></tr>${learners.map((l,i)=>{
 const byLIN=l.lin?dest.filter(d=>d.lin&&d.lin===l.lin):[],byName=dest.filter(d=>d.name.trim().toLowerCase()===l.name.trim().toLowerCase()),match=byLIN.length===1?byLIN[0]:byName.length===1?byName[0]:null;
 return `<tr><td>${esc(l.name)} (${esc(l.lin||'no LIN')})</td><td><select id="aim-${i}"><option value="">Skip this learner</option>${dest.map(d=>`<option value="${esc(d.id)}" ${match?.id===d.id?'selected':''}>${esc(d.name)} · ${esc(d.lin||'no LIN')}</option>`).join('')}</select></td></tr>`}).join('')}</table><p>Only an empty destination calendar can be imported. Holidays are added when their dates do not already exist. Keep the old AttendApp backup.</p><button class="btn" id="att-import-run" onclick="attImportRun()">Import reviewed attendance</button><button class="btn s" onclick="mdlg.style.display='none'">Cancel</button><p id="att-import-status"></p></div>`;
}
async function attImportRun(){const x=ATT_IMPORT,status=document.getElementById('att-import-status'),button=document.getElementById('att-import-run');
 try{if(!x||x.key!==attKey())throw Error('Destination changed. Start again.');button.disabled=true;
 const mappings=x.learners.map((l,i)=>({old:l.id,id:document.getElementById('aim-'+i).value})).filter(m=>m.id);
 if(!mappings.length)throw Error('Match at least one learner.');if(new Set(mappings.map(m=>m.id)).size!==mappings.length)throw Error('Two old learners cannot map to the same analyser learner.');
 const sourceTerms=x.backup.terms.filter(t=>t.register_id===x.register.id);
 for(const t of sourceTerms){if(![1,2,3].includes(t.n)||!Number.isInteger(t.weeks)||t.weeks<1||t.weeks>30)throw Error('The source calendar contains invalid term settings.');}
 const data=await AnalyserAttendance.open();if(data.marks.length)throw Error('The destination already has attendance. Import stopped to protect it.');
 let count=0;status.textContent='Importing…';const calendars=[],rows=[];
 for(const old of sourceTerms){const t=data.terms.find(t=>t.n===old.n);if(!t)throw Error('Destination term missing.');
  let end=null;if(old.start_date){const d=new Date(old.start_date+'T00:00:00');d.setDate(d.getDate()+old.weeks*7-3);end=iso(d)}
  calendars.push({id:t.id,start_date:old.start_date||null,end_date:end,weeks:old.weeks});
  rows.push(...x.backup.marks.filter(m=>m.term_id===old.id).flatMap(m=>{const dest=mappings.find(v=>v.old===m.learner_id);return dest?[{term_id:t.id,week:m.week,learner_id:dest.id,codes:m.codes}]:[]}));
 }
 const holidays=(x.backup.holidays||[]).filter(h=>h.school_id===x.register.school_id).map(h=>({hdate:h.hdate,name:h.name}));
 const result=await SB.rpc('attendance_import',{p_register:data.register.id,p_terms:calendars,p_marks:rows,p_holidays:holidays});if(result.error)throw result.error;count=result.data;
 ATT.key='';ATT_IMPORT=null;mdlg.style.display='none';attOpen();alert('Imported '+count+' weekly learner records. Check term dates in Attendance settings.');
 }catch(e){status.textContent='Import stopped: '+(e.message||e)+'. The attendance import is transactional: a database error rolls back imported marks and calendars. Retain the source backup.';button.disabled=false;}}
