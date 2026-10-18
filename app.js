/* Analyser: multi-school version (Supabase). Edit config.js with your project details. */
const CFG=window.ATTEND_CONFIG||{};
let SB=null,ME=null,SCHOOLS=[],CURS=null,REGS=[],R=null,STAFF=[],OV=null,view='dash',cw=1,dip=null,editId=null,goTop=false,bootedFor=null,idleT=null,lastSync=0;
const flow={contact:''};
const D={t:1,get school(){const s=SCHOOLS.find(x=>x.id===CURS);return s?s.name:''}};
const Y=()=>R;
const TM=()=>R&&(R.terms.find(t=>t.n===D.t)||R.terms[0]);
const isAdmin=()=>!!ME&&ME.role==='admin';
const isHead=()=>!!ME&&ME.role==='headteacher';
const canCreate=()=>isAdmin()||isHead();
const canManage=()=>!!ME&&!!R&&(isAdmin()||isHead()||(ME.role==='classteacher'&&(ME.classes||[]).includes(R.id)));
const ROLE_LABEL={admin:'Administrator',headteacher:'Head teacher',classteacher:'Class teacher',teacher:'Teacher'};
let HOLS=[],REGS_ALL=[],STAFF_CLASSES=[];

const WORDS=['ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN','ELEVEN','TWELVE'];
const ORDER=['.','P','A','S','H'],DAYS=['MON','TUE','WED','THU','FRI'];
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const fmt=d=>d?d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'—';
const Ws=t=>Array.from({length:t.weeks},(_,i)=>i+1);
const wd=(t,n,d)=>{if(!t.start)return null;const x=new Date(t.start+'T00:00:00');x.setDate(x.getDate()+7*(n-1)+d);return x};
const code=(t,n,id)=>(t.data[n]&&t.data[n][id])||'..........';
const setCode=(t,n,id,v)=>{t.data[n]=t.data[n]||{};t.data[n][id]=v};
const hasData=(t,n)=>Y().students.some(s=>/[PASH]/.test(code(t,n,s.id)));
const recW=t=>Ws(t).filter(n=>hasData(t,n));
const cnt=(s,ch)=>[...s].filter(x=>x===ch).length;
const ratio=(a,b)=>b?a/b*100:null;
const st=s=>{const P=cnt(s,'P'),A=cnt(s,'A'),S=cnt(s,'S'),H=cnt(s,'H'),den=P+A+S;return{P,A,S,H,den,pp:ratio(P,den),pa:ratio(A,den),d:P/2,hd:H/2}};
const pc=x=>x==null?'–':(Math.round(x*10)/10)+'%';
const wword=n=>WORDS[n-1]||n;
function mon(s){if(!s)return'';const d=new Date(s+'T00:00:00');d.setDate(d.getDate()-((d.getDay()+6)%7));
 const p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())}
function toast(m){const t=$('#toast');t.textContent=m;t.className='show';clearTimeout(t._t);t._t=setTimeout(()=>t.className='',2600)}
function ask(msg){return new Promise(r=>{const m=document.createElement('div');m.className='modal';
 m.innerHTML=`<div class="mb"><p>${esc(msg)}</p><div class="row"><button class="btn red" id="y">Yes</button><button class="btn alt" id="n">Cancel</button></div></div>`;
 document.body.appendChild(m);m.querySelector('#y').onclick=()=>{m.remove();r(true)};m.querySelector('#n').onclick=()=>{m.remove();r(false)}})}
function saveFile(name,data,type){const b=data instanceof Blob?data:new Blob([data],{type});const a=document.createElement('a');
 a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
const fname=s=>s.replace(/[^A-Za-z0-9-]+/g,'-');
const F=[['name','Full name','text'],['gender','Gender','sel',['','Male','Female']],['dob','Date of birth','date'],['lin','Learner Identification Number (LIN)','text'],['nationality','Nationality','text'],['religion','Religion','text'],
 ['orphan','Orphan status','sel',['','Not an orphan','Single orphan - father died','Single orphan - mother died','Double orphan']],['repeater','Repeater','sel',['','No','Yes']],['social','Social needs','text'],
 ['father',"Father's name",'text'],['father_tel',"Father's contact",'tel'],['mother',"Mother's name",'text'],['mother_tel',"Mother's contact",'tel'],['address',"Parents' address",'text']];
const norm=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
const ALIAS={};F.forEach(([k,l])=>{ALIAS[norm(l)]=k;ALIAS[norm(k)]=k});
Object.assign(ALIAS,{learnername:'name',sex:'gender',lin:'lin',orphan:'orphan',fathername:'father',fathersname:'father',fathercontact:'father_tel',fatherphone:'father_tel',mothername:'mother',mothersname:'mother',mothercontact:'mother_tel',motherphone:'mother_tel',parentsaddress:'address',socialneed:'social'});
function age(dob){if(!dob)return'';const b=new Date(dob+'T00:00:00'),n=new Date();let a=n.getFullYear()-b.getFullYear();const m=n.getMonth()-b.getMonth();if(m<0||(m===0&&n.getDate()<b.getDate()))a--;return a>=0&&a<100?a:''}
function toISO(v){v=String(v).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(v))return v;const m=v.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);return m?m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'):''}
const toCSV=rows=>rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
function parseCSV(t){const rows=[];let r=[],c='',q=false;t=t.replace(/^\ufeff/,'');
 for(let i=0;i<t.length;i++){const ch=t[i];if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++}else q=false}else c+=ch}
  else if(ch==='"')q=true;else if(ch===','){r.push(c);c=''}
  else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&t[i+1]==='\n')i++;r.push(c);c='';if(r.some(x=>x.trim()))rows.push(r);r=[]}else c+=ch}
 r.push(c);if(r.some(x=>x.trim()))rows.push(r);return rows}


/* ---------- calculations ---------- */
function weekTotals(t,n){return Y().students.reduce((a,s)=>{const x=st(code(t,n,s.id));a.P+=x.P;a.A+=x.A;a.S+=x.S;a.H+=x.H;return a},{P:0,A:0,S:0,H:0})}
function weekPct(t,n){const w=weekTotals(t,n);return ratio(w.P,w.P+w.A+w.S)}
function overall(s,t){const rec=recW(t);let P=0,A=0,S=0;rec.forEach(n=>{const x=st(code(t,n,s.id));P+=x.P;A+=x.A;S+=x.S});
 return{P,A,S,days:P/2,pct:ratio(P,P+A+S),rec:rec.length}}
function yr(s){let P=0,A=0,S=0,wks=0;const per=Y().terms.map(t=>{const o=overall(s,t);P+=o.P;A+=o.A;S+=o.S;wks+=o.rec;return o});
 return{P,A,S,wks,per,days:P/2,pct:ratio(P,P+A+S)}}
function termPct(t){let P=0,D=0;recW(t).forEach(n=>{const w=weekTotals(t,n);P+=w.P;D+=w.P+w.A+w.S});return ratio(P,D)}
function sumData(t){const S=Y().students,W=Ws(t);
 return{head:['No','Name',...W.map(n=>'W'+n),'Total days','Absent (sessions)','Sick (sessions)','Presence %'],
 body:S.map((s,r)=>{const o=overall(s,t);return{a:[r+1,s.name,...W.map(n=>hasData(t,n)?st(code(t,n,s.id)).d:'–'),o.days,o.A,o.S,o.rec?pc(o.pct):'–'],low:o.pct!=null&&o.pct<75}}),
 foot:['','Class presence %',...W.map(n=>hasData(t,n)?pc(weekPct(t,n)):'–'),'','','','']}}
function yearData(){const y=Y(),S=y.students;let P=0,D=0;
 y.terms.forEach(t=>recW(t).forEach(n=>{const w=weekTotals(t,n);P+=w.P;D+=w.P+w.A+w.S}));
 return{head:['No','Name',...y.terms.flatMap(t=>['Term '+t.n+' days','Term '+t.n+' %']),'Year days','Absent','Sick','Year %'],
 body:S.map((s,i)=>{const z=yr(s);return{a:[i+1,s.name,...z.per.flatMap(o=>[o.rec?o.days:'–',o.rec?pc(o.pct):'–']),z.days,z.A,z.S,z.wks?pc(z.pct):'–'],low:z.pct!=null&&z.pct<75}}),
 foot:['','Class',...y.terms.flatMap(t=>{const p=termPct(t);return['',p===null?'–':pc(p)]}),'','','',D?pc(P/D*100):'–']}}
const weekArr=(t,n)=>Y().students.map((s,r)=>{const c=code(t,n,s.id),x=st(c);return[r+1,s.name,...[...c].map(ch=>ch==='.'?'':ch),x.P,x.A,x.S,x.hd,pc(x.pp),pc(x.pa),x.d]});

/* ---------- views ---------- */
const empty='<div class="card">No learners yet. Open <b>Learners</b> and paste your class list (any number).</div>';
function dtable(d){return`<div class="wrap"><table><thead><tr>${d.head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${d.body.map(r=>`<tr>${r.a.map((v,i)=>`<td class="${i===1?'nm':''}${r.low&&i===r.a.length-1?' low':''}">${esc(v)}</td>`).join('')}</tr>`).join('')}<tr class="tot">${d.foot.map((v,i)=>`<td${i===1?' style="text-align:left"':''}>${esc(v)}</td>`).join('')}</tr></tbody></table></div>`}
const title=()=>(D.school||'Weekly attendance report').toUpperCase()+' — '+(Y().className?Y().className.toUpperCase()+' — ':'')+Y().name;
function dashView(){
 const S=Y().students;if(!S.length)return empty;const t=TM(),rec=recW(t);
 let P=0,A=0,Sk=0;rec.forEach(n=>{const w=weekTotals(t,n);P+=w.P;A+=w.A;Sk+=w.S});const tot=(P+A+Sk)||1;
 const rank=S.map(s=>({n:s.name,...overall(s,t)})).filter(r=>r.pct!=null).sort((a,b)=>a.pct-b.pct);
 const li=a=>a.map(r=>`<div class="lst"><span class="n">${esc(r.n)}</span><span class="t"><i style="width:${r.pct}%"></i></span><b>${pc(r.pct)}</b></div>`).join('')||'<p>No data yet.</p>';
 return`<div class="kpis"><div class="kpi"><b>${S.length}</b><span>Learners</span></div><div class="kpi"><b>${rec.length}/${t.weeks}</b><span>Weeks recorded</span></div>
 <div class="kpi"><b>${(P+A+Sk)?pc(P/tot*100):'–'}</b><span>Presence, Term ${t.n}</span></div><div class="kpi"><b>${(P+A+Sk)?pc(A/tot*100):'–'}</b><span>Absence</span></div>
 <div class="kpi"><b>${Sk/2}</b><span>Sick days</span></div><div class="kpi"><b>${termHolDays(t)}</b><span>Holiday days</span></div></div>
 <div class="card"><h3 style="margin-top:0">Weekly presence %, Term ${t.n} (tap a bar to open that week)</h3><div class="bars">${
 Ws(t).map(n=>{const h=hasData(t,n);return`<div class="bar ${h?'':'no'}" data-act="wk" data-n="${n}">${h?Math.round(weekPct(t,n)):''}<i style="height:${h?weekPct(t,n)*.85:2}%"></i>${n}</div>`}).join('')}</div></div>
 <div class="grid2"><div class="card"><h3 style="margin-top:0">Needs attention (lowest 5)</h3>${li(rank.slice(0,5))}</div>
 <div class="card"><h3 style="margin-top:0">Best attendance (top 5)</h3>${li(rank.slice(-5).reverse())}</div></div>`}

function weekView(){
 const S=Y().students,t=TM(),n=Math.min(cw,t.weeks);cw=n;
 const chips=`<div class="chips noprint"><button class="chip" data-act="prev">◀</button>${Ws(t).map(i=>`<button class="chip ${i===n?'on':''} ${hasData(t,i)?'dot':''}" data-act="wk" data-n="${i}">Week ${i}</button>`).join('')}<button class="chip" data-act="next">▶</button><button class="chip" data-act="addwk">＋ Add Week ${t.weeks+1}</button></div>`;
 const ws=`<div class="row noprint mgonly" style="margin-bottom:10px"><label style="margin:0">Term ${t.n}, Week 1 starts (Monday):</label><input type="date" id="f-ws" value="${t.start}" style="width:auto"></div>`;
 if(!S.length)return chips+ws+empty;
 const w=weekTotals(t,n),den=w.P+w.A+w.S;
 const rows=S.map((s,r)=>{const c=code(t,n,s.id),x=st(c);
  return`<tr><td>${r+1}</td><td class="nm">${esc(s.name)}</td>${[...c].map((ch,i)=>`<td class="c ${ch}" data-s="${s.id}" data-i="${i}">${ch==='.'?'':ch}</td>`).join('')}<td>${x.P}</td><td>${x.A}</td><td>${x.S}</td><td>${x.hd}</td><td>${pc(x.pp)}</td><td>${pc(x.pa)}</td><td>${x.d}</td></tr>`}).join('');
 const days=DAYS.map((d,i)=>`<th colspan="2">${d}<br><small>${fmt(wd(t,n,i)).slice(0,6)}</small>${holSmall(t,n,i)}</th>`).join('');
 const sess=DAYS.map((d,i)=>`<th class="s" data-act="col" data-i="${i*2}" title="Tap once: everyone present. Double-tap: holiday for everyone.">M</th><th class="s" data-act="col" data-i="${i*2+1}" title="Tap once: everyone present. Double-tap: holiday for everyone.">A</th>`).join('');
 return chips+ws+`<div class="card sheet"><h2>${esc(title())}</h2>
 <div class="sub">WEEKLY ATTENDANCE REPORT — TERM ${t.n} — WEEK ${wword(n)}</div>
 <div class="dates"><span>FROM ${fmt(wd(t,n,0))}</span><span>TO ${fmt(wd(t,n,4))}</span><span>| Overall presence ${pc(ratio(w.P,den))}</span><span>Absence ${pc(ratio(w.A,den))}</span><span>Learners ${S.length}</span><span>Holidays ${weekHolDays(t,n)} day(s)</span></div>
 <div class="wrap"><table><thead><tr><th rowspan="2">NO</th><th rowspan="2">NAME</th>${days}<th colspan="4">TOTAL</th><th colspan="2">PERCENTAGE</th><th>TOTAL</th></tr>
 <tr>${sess}<th>PRESENCE</th><th>ABSENCE</th><th>SICK</th><th>HOLIDAY</th><th>P</th><th>A</th><th>PRESENT DAYS</th></tr></thead>
 <tbody>${rows}<tr class="tot"><td colspan="12" style="text-align:right">CLASS TOTAL</td><td>${w.P}</td><td>${w.A}</td><td>${w.S}</td><td>${w.H/2}</td><td>${pc(ratio(w.P,den))}</td><td>${pc(ratio(w.A,den))}</td><td>${w.P/2}</td></tr></tbody></table></div>
 <div class="legend"><span style="background:var(--P)">P = Present</span><span style="background:var(--A)">A = Absent</span><span style="background:var(--S)">S = Sick</span><span style="background:var(--H)">H = Holiday</span><span class="noprint">Tap a cell to change it. Tap an M or A header once = whole class present; double-tap = holiday for the whole class. Percentages ignore holidays: a learner who attended every non-holiday session has 100%.</span></div>
 <div class="row noprint"><button class="btn" data-act="pdfw">⬇ Download PDF</button><button class="btn alt" data-act="csv">Export CSV</button><button class="btn alt" data-act="clr">Clear this week</button><button class="btn alt" data-act="rmwk">− Remove last week</button></div></div>`}

function sumView(){const t=TM();if(!Y().students.length)return empty;
 return`<div class="card sheet"><h2>${esc(title())}</h2><div class="sub">TERM ${t.n} SUMMARY — PRESENT DAYS PER WEEK</div>${dtable(sumData(t))}
 <div class="legend"><span class="low">Red = below 75%</span><span>Presence % = sessions present ÷ sessions marked present, absent or sick. Holidays are never counted against a learner.</span></div>
 <div class="row noprint"><button class="btn" data-act="pdfs">⬇ Download PDF</button></div></div>`}
function yearView(){if(!Y().students.length)return empty;
 return`<div class="card sheet"><h2>${esc(title())}</h2><div class="sub">YEARLY SUMMARY — ${Y().terms.length} TERM(S)</div>${dtable(yearData())}
 <div class="legend"><span class="low">Red = below 75%</span><span>Year % = sessions present ÷ sessions marked present, absent or sick (holidays not counted)</span></div>
 <div class="row noprint"><button class="btn" data-act="pdfy">⬇ Download PDF</button></div></div>`}

function learnView(){const y=Y(),S=y.students;
 if(editId!==null){const s=editId==='new'?{nationality:'Ugandan'}:(S.find(x=>x.id===editId)||{});
  const fld=([k,l,ty,o])=>`<div><label>${l}</label>${ty==='sel'?`<select id="p-${k}">${o.map(v=>`<option value="${esc(v)}" ${s[k]===v?'selected':''}>${esc(v)}</option>`).join('')}</select>`:`<input id="p-${k}" type="${ty}" value="${esc(s[k]||'')}" ${k==='religion'?'list="rels"':''}>`}${k==='dob'?`<span class="hint" id="p-age">${s.dob?'Age: '+age(s.dob)+' years':''}</span>`:''}</div>`;
  return`<div class="card"><h3 style="margin-top:0">${editId==='new'?'Add learner':'Learner profile'}</h3>
  <p class="hint">School: <b>${esc(D.school||'(set in Settings)')}</b> &nbsp;·&nbsp; Class: <b>${esc(y.className||'(set in Settings)')}</b> &nbsp;·&nbsp; Year: <b>${esc(y.name)}</b></p>
  <datalist id="rels"><option>Catholic</option><option>Anglican</option><option>Pentecostal</option><option>Muslim</option><option>Seventh-day Adventist</option><option>Other</option></datalist>
  <div class="grid2">${F.map(fld).join('')}</div>
  <p><button class="btn" data-act="savelrn">Save learner</button> <button class="btn alt" data-act="cancellrn">Cancel</button> ${editId==='new'?'':'<button class="btn red" data-act="dellrn">Delete learner</button>'}</p></div>`}
 const g=x=>S.filter(s=>s.gender===x).length;
 return`<div class="card"><h3 style="margin-top:0">Learners in ${esc(y.name)}${y.className?' — '+esc(y.className):''} (${S.length})</h3>
 <p class="hint">Boys ${g('Male')} · Girls ${g('Female')} · Repeaters ${S.filter(s=>s.repeater==='Yes').length} · Orphans ${S.filter(s=>s.orphan&&s.orphan!=='Not an orphan').length}</p>
 <div class="row"><button class="btn" data-act="newlrn">＋ Add learner with details</button><button class="btn alt" data-act="impl">Import from CSV</button><button class="btn alt" data-act="tpl">CSV template</button><button class="btn alt" data-act="expl">Export CSV</button><button class="btn alt" data-act="pdfl">Profiles PDF</button></div>
 <details class="mgonly" style="margin:10px 0"><summary><b>Quick add: names only</b></summary><textarea id="f-names" rows="5" style="margin-top:8px" placeholder="One name per line"></textarea><p><button class="btn" data-act="add">Add names</button></p></details>
 <input id="f-q" placeholder="Search by name or LIN…" style="margin:8px 0">
 <div class="wrap"><table><thead><tr><th>No</th><th>Name</th><th>Gender</th><th>Age</th><th>LIN</th><th>Father's contact</th><th>Mother's contact</th><th></th></tr></thead><tbody>${S.map((s,i)=>`<tr data-q="${esc((s.name+' '+(s.lin||'')).toLowerCase())}"><td>${i+1}</td><td class="nm">${esc(s.name)}</td><td>${esc(s.gender||'')}</td><td>${age(s.dob)}</td><td>${esc(s.lin||'')}</td><td>${esc(s.father_tel||'')}</td><td>${esc(s.mother_tel||'')}</td><td style="white-space:nowrap"><button class="btn alt" data-act="edit" data-i="${i}">Edit</button> <button class="btn red" data-act="del" data-i="${i}">Delete</button></td></tr>`).join('')||'<tr><td colspan="8">No learners yet.</td></tr>'}</tbody></table></div>
 <p class="hint">Edit opens the full profile (date of birth, age, parents, contacts, address, LIN and more). Deleting a learner also removes their attendance for every term of this year. Age is worked out from the date of birth.</p></div>`}

function infoView(){const y=Y(),S=y.students,d=x=>x?fmt(new Date(x+'T00:00:00')):'';
 const cols=['No','Name','Gender','Date of birth','Age','LIN','Nationality','Religion','Orphan status','Repeater','Social needs',"Father's name","Father's contact","Mother's name","Mother's contact","Parents' address",''];
 return`<div class="card sheet"><h2>LEARNER BASIC INFORMATION</h2>
 <div class="sub">School: ${esc(D.school||'(set in Settings)')} &nbsp;·&nbsp; Class: ${esc(y.className||'(set in Settings)')} &nbsp;·&nbsp; Year: ${esc(y.name)} &nbsp;·&nbsp; ${S.length} learner(s)</div>
 <div class="row noprint" style="margin-bottom:10px"><button class="btn" data-act="newlrn">＋ Add learner</button><button class="btn alt" data-act="pdfl">⬇ Download PDF</button><button class="btn alt" data-act="expl">Export CSV</button><input id="f-q" placeholder="Search by name or LIN…" style="flex:1;min-width:180px"></div>
 <div class="wrap"><table><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${S.map((s,i)=>`<tr data-q="${esc((s.name+' '+(s.lin||'')).toLowerCase())}"><td>${i+1}</td><td class="nm">${esc(s.name)}</td><td>${esc(s.gender||'')}</td><td>${d(s.dob)}</td><td>${age(s.dob)}</td><td>${esc(s.lin||'')}</td><td>${esc(s.nationality||'')}</td><td>${esc(s.religion||'')}</td><td>${esc(s.orphan||'')}</td><td>${esc(s.repeater||'')}</td><td>${esc(s.social||'')}</td><td>${esc(s.father||'')}</td><td>${esc(s.father_tel||'')}</td><td>${esc(s.mother||'')}</td><td>${esc(s.mother_tel||'')}</td><td>${esc(s.address||'')}</td><td class="noprint"><button class="btn alt" data-act="edit" data-i="${i}">Edit</button></td></tr>`).join('')||'<tr><td colspan="17">No learners yet. Tap Add learner.</td></tr>'}</tbody></table></div>
 <p class="hint">Age is worked out from the date of birth. Tap Edit to change any detail.</p></div>`}

/* ---------- PDF (built-in writer: no external library, works offline) ---------- */
const HW=[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
const PW=842,PH=595,COL={P:[200,239,211],A:[255,207,207],S:[255,232,176],H:[207,226,255]};
const clean=s=>String(s).replace(/[\u2013\u2014\u2212]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[^\x00-\xff]/g,'?');
const enc=s=>clean(s).replace(/[\\()]/g,'\\$&');
const tw=(s,sz,b)=>{let w=0;for(const ch of clean(s)){const c=ch.charCodeAt(0);w+=c>=32&&c<=126?HW[c-32]:556}return w*sz/1000*(b?1.07:1)};
const rgb=a=>a.map(v=>(v/255).toFixed(3)).join(' ');
function putText(pg,s,x,base,sz,b,c,al,w){const t=tw(s,sz,b);const tx=al==='l'?x:al==='r'?x+w-t:x+(w-t)/2;
 pg.push(`BT /${b?'F2':'F1'} ${sz.toFixed(2)} Tf ${rgb(c||[0,0,0])} rg ${tx.toFixed(2)} ${(PH-base).toFixed(2)} Td (${enc(s)}) Tj ET`)}
function drawCell(pg,x,top,w,h,s,o){const yb=PH-top-h;
 if(o.fill)pg.push(`${rgb(o.fill)} rg ${x.toFixed(2)} ${yb.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
 pg.push(`0.6 G 0.4 w ${x.toFixed(2)} ${yb.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
 let lines=String(s).split('\n');let sz=7.5;const mw=Math.max(...lines.map(l=>tw(l,1,o.b)))||1;if(mw*sz>w-4)sz=Math.max(4.5,(w-4)/mw);
 lines=lines.map(l=>{let t=l;while(t.length>1&&tw(t,sz,o.b)>w-3)t=t.slice(0,-1);return t===l?l:t.slice(0,-1)+'.'});
 lines.forEach((l,k)=>putText(pg,l,x+(o.al==='l'?3:0),top+h/2+(lines.length-1)*sz*.575-k*sz*1.15+sz*.35,sz,o.b,o.c,o.al,w-(o.al==='l'?3:0)))}
function place(rows){const occ=[],out=[];rows.forEach((r,ri)=>{let c=0;r.forEach(cell=>{cell=cell!==null&&typeof cell==='object'?cell:{t:cell};
 while(occ[ri]&&occ[ri][c])c++;const cs=cell.cs||1,rs=cell.rs||1;out.push({...cell,t:String(cell.t),ri,c,cs,rs});
 for(let a=0;a<rs;a++){occ[ri+a]=occ[ri+a]||[];for(let b=0;b<cs;b++)occ[ri+a][c+b]=1}c+=cs})});return out}
function buildPdf(pages){let out='%PDF-1.4\n';const off=[],add=s=>{off.push(out.length);out+=s},n=pages.length;
 add('1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n');
 add(`2 0 obj<</Type/Pages/Count ${n}/Kids[${pages.map((_,i)=>(5+2*i)+' 0 R').join(' ')}]>>endobj\n`);
 add('3 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>endobj\n');
 add('4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold/Encoding/WinAnsiEncoding>>endobj\n');
 pages.forEach((p,i)=>{const c=p.join('\n');
  add(`${5+2*i} 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${PW} ${PH}]/Resources<</Font<</F1 3 0 R/F2 4 0 R>>>>/Contents ${6+2*i} 0 R>>endobj\n`);
  add(`${6+2*i} 0 obj<</Length ${c.length}>>stream\n${c}\nendstream\nendobj\n`)});
 const x=out.length;out+=`xref\n0 ${off.length+1}\n0000000000 65535 f \n`+off.map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+`trailer<</Size ${off.length+1}/Root 1 0 R>>\nstartxref\n${x}\n%%EOF`;
 const u=new Uint8Array(out.length);for(let i=0;i<out.length;i++)u[i]=out.charCodeAt(i)&255;return new Blob([u],{type:'application/pdf'})}
function pdf(fn,sub,head,body,foot,widths){
 const M=24,TW=PW-2*M,RH=15,ncol=place(head).reduce((m,c)=>Math.max(m,c.c+c.cs),0);
 const rel=widths||[1.2,7,...Array(ncol-2).fill(2)],sum=rel.reduce((a,b)=>a+b,0),cw=rel.map(v=>v/sum*TW);
 const cx=i=>M+cw.slice(0,i).reduce((a,b)=>a+b,0),span=(c,cs)=>cw.slice(c,c+cs).reduce((a,b)=>a+b,0);
 const hp=place(head),hh=head.map((_,ri)=>{const L=Math.max(1,...hp.filter(c=>c.ri===ri&&c.rs===1).map(c=>c.t.split('\n').length));return L>=3?32:L===2?24:RH});
 const pages=[];let pg,y;
 const header=()=>{hp.forEach(c=>{const top=y+hh.slice(0,c.ri).reduce((a,b)=>a+b,0),h=hh.slice(c.ri,c.ri+c.rs).reduce((a,b)=>a+b,0);
  drawCell(pg,cx(c.c),top,span(c.c,c.cs),h,c.t,{fill:[75,42,110],c:[255,255,255],b:true})});y+=hh.reduce((a,b)=>a+b,0)};
 const newPage=first=>{pg=[];pages.push(pg);y=M;
  if(first){putText(pg,title(),0,M+10,14,true,[75,42,110],'c',PW);putText(pg,sub,0,M+25,9,false,[0,0,0],'c',PW);y=M+34}
  header()};
 const row=(r,foot)=>{if(y+RH>PH-M)newPage(false);let c=0;
  r.forEach(cell=>{cell=cell!==null&&typeof cell==='object'?cell:{t:cell};const cs=cell.cs||1;
   drawCell(pg,cx(c),y,span(c,cs),RH,String(cell.t),{fill:cell.fill||(foot?[236,226,246]:null),b:cell.b||foot,al:cell.al});c+=cs});y+=RH};
 newPage(true);body.forEach(r=>row(r));row(foot,true);
 saveFile(fn,buildPdf(pages));toast('PDF downloaded')}
function bodyCells(rows,colorFrom,low){return rows.map(r=>r.map((v,i)=>{
 if(colorFrom!=null&&i>=colorFrom&&i<colorFrom+10&&COL[v])return{t:v,fill:COL[v],b:true};
 if(i===1)return{t:v,al:'l'};if(low&&low(r)&&i===r.length-1)return{t:v,fill:[255,207,207],b:true};return v}))}
function pdfWeek(){const t=TM(),n=cw,w=weekTotals(t,n),den=w.P+w.A+w.S;
 const head=[[{t:'NO',rs:2},{t:'NAME',rs:2},...DAYS.map((d,i)=>({t:d+'\n'+fmt(wd(t,n,i)).slice(0,6)+(holName(iso(wd(t,n,i)))?'\n'+holName(iso(wd(t,n,i))):''),cs:2})),{t:'TOTAL',cs:4},{t:'PERCENTAGE',cs:2},'TOTAL'],
  [...DAYS.flatMap(()=>['M','A']),'PRESENCE','ABSENCE','SICK','HOLIDAY','P','A','PRESENT DAYS']];
 const foot=[{t:'CLASS TOTAL',cs:12,al:'r'},w.P,w.A,w.S,w.H/2,pc(ratio(w.P,den)),pc(ratio(w.A,den)),w.P/2];
 pdf(fname(`Attendance-${Y().name}-Term${t.n}-Week${n}`)+'.pdf',`WEEKLY ATTENDANCE REPORT - TERM ${t.n} - WEEK ${wword(n)} - FROM ${fmt(wd(t,n,0))} TO ${fmt(wd(t,n,4))} - Presence ${pc(ratio(w.P,den))}, Absence ${pc(ratio(w.A,den))}`,
  head,bodyCells(weekArr(t,n),2),foot,[1.2,7,...Array(10).fill(1.5),...Array(4).fill(2.6),2.6,2.6,3])}
function pdfData(fn,sub,d){const lowSet=new Set(d.body.filter(r=>r.low).map(r=>r.a));
 pdf(fn,sub,[d.head],bodyCells(d.body.map(r=>r.a),null,r=>lowSet.has(r)),d.foot)}


/* =====================================================================
   Holidays (school calendar)
   ===================================================================== */
const iso=d=>d?d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'):'';
const holName=i=>{const h=HOLS.find(x=>x.hdate===i);return h?h.name:''};
function dayMarkedHol(t,n,d){const S=R.students;return S.length>0&&S.every(s=>{const c=code(t,n,s.id);return c[d*2]==='H'||c[d*2+1]==='H'})}
function holDays(t,recordedOnly){const out=[];Ws(t).forEach(n=>{for(let d=0;d<5;d++){const dt=wd(t,n,d),i=dt?iso(dt):'',nm=i?holName(i):'',mk=dayMarkedHol(t,n,d);
 if(mk||(nm&&(!recordedOnly||hasData(t,n))))out.push({date:i,dt,week:n,day:d,name:nm,marked:mk,term:t.n})}});return out}
const termHolDays=t=>holDays(t,true).length;
const weekHolDays=(t,n)=>holDays(t,true).filter(h=>h.week===n).length;
function holSmall(t,n,d){const dt=wd(t,n,d),nm=dt?holName(iso(dt)):'';return nm?`<br><small class="hn" title="${esc(nm)}">${esc(nm)}</small>`:''}
function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
 return new Date(y,Math.floor((h+l-7*m+114)/31)-1,((h+l-7*m+114)%31)+1)}
/* Built-in calendar of Uganda public holidays. Fixed dates + Easter-based + Eid (Eid depends on moon sighting: confirm). */
function ugHolidays(y){
 const L=[[1,1,"New Year's Day"],[1,26,'NRM Liberation Day'],[2,16,'Archbishop Janani Luwum Day'],[3,8,"International Women's Day"],[5,1,'Labour Day'],[6,3,"Martyrs' Day"],[6,9,"National Heroes' Day"],[10,9,'Independence Day'],[12,25,'Christmas Day'],[12,26,'Boxing Day']].map(([m,d,n])=>({date:iso(new Date(y,m-1,d)),name:n}));
 const e=easter(y),add=k=>{const x=new Date(e);x.setDate(x.getDate()+k);return iso(x)};
 L.push({date:add(-2),name:'Good Friday'},{date:add(1),name:'Easter Monday'});
 try{const f=new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{day:'numeric',month:'numeric'});
  for(let dt=new Date(y,0,1);dt.getFullYear()===y;dt.setDate(dt.getDate()+1)){const p={};f.formatToParts(dt).forEach(x=>p[x.type]=x.value);
   if(p.month==='10'&&p.day==='1')L.push({date:iso(dt),name:'Eid-ul-Fitr'});if(p.month==='12'&&p.day==='10')L.push({date:iso(dt),name:'Eid-ul-Adha'})}}catch(x){}
 return L.sort((a,b)=>a.date.localeCompare(b.date))}
const ugName=i=>{const h=ugHolidays(+i.slice(0,4)).find(x=>x.date===i);return h?h.name:''};
const yearNum=()=>parseInt(R&&R.name)||new Date().getFullYear();
let holYear=null;
const DOW=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function holRows(y){const rows=[],seen=new Set();
 const where=d=>{for(const t of R.terms)for(const n of Ws(t))for(let k=0;k<5;k++){const dt=wd(t,n,k);if(dt&&iso(dt)===d)return `Term ${t.n}, week ${n}`}return ''};
 HOLS.filter(h=>h.hdate.slice(0,4)===String(y)).forEach(h=>{seen.add(h.hdate);rows.push({date:h.hdate,name:h.name,id:h.id,where:where(h.hdate)})});
 R.terms.forEach(t=>holDays(t).forEach(h=>{if(h.marked&&h.date&&!seen.has(h.date)&&h.date.slice(0,4)===String(y)){seen.add(h.date);rows.push({date:h.date,name:'',id:null,where:`Term ${t.n}, week ${h.week}`})}}));
 return rows.sort((a,b)=>a.date.localeCompare(b.date))}
function holView(){const y=holYear||yearNum(),rows=holRows(y),dd=x=>{const d=new Date(x+'T00:00:00');return fmt(d)+' · '+DOW[d.getDay()]};
 return`<div class="card"><h3 style="margin-top:0">Holidays — ${esc(D.school||'school')}</h3>
 <p class="hint">Double-tap an M or A header on the weekly sheet to mark a holiday: the name is filled in from the built-in calendar when the date is a public holiday, otherwise you are asked to type it. Holidays are never counted against a learner’s percentage.</p>
 <div class="row"><label style="margin:0">Year</label><input id="f-hy" type="number" value="${y}" style="width:100px"><button class="btn" data-act="loadug">Load public holidays for ${y}</button><button class="btn alt" data-act="pdfhol">⬇ PDF</button></div>
 <p class="hint">Eid dates depend on the moon sighting: check them and edit the date if needed. School closures such as term breaks can be added below.</p>
 <div class="row"><input id="f-hd" type="date" style="width:auto"><input id="f-hn" placeholder="Holiday name" style="flex:1;min-width:160px"><button class="btn" data-act="addhol">＋ Add holiday</button></div></div>
 <div class="card"><h3 style="margin-top:0">${rows.length} holiday(s) in ${y}</h3><div class="wrap"><table><thead><tr><th>Date</th><th>This class</th><th>Holiday name</th><th></th></tr></thead><tbody>${
 rows.map(r=>`<tr><td class="nm">${dd(r.date)}</td><td>${esc(r.where||'—')}</td><td><input id="hn-${r.date}" value="${esc(r.name)}" placeholder="Type the name"></td><td style="white-space:nowrap"><button class="btn alt" data-act="savehol" data-d="${r.date}">Save</button>${r.id&&canCreate()?` <button class="btn red" data-act="delhol" data-id="${r.id}">Delete</button>`:''}</td></tr>`).join('')||'<tr><td colspan="4">No holidays recorded for this year yet.</td></tr>'}</tbody></table></div></div>`}
async function upsertHol(date,name){const ex=HOLS.find(h=>h.hdate===date);
 if(ex){await wr(()=>q(SB.from('holidays').update({name}).eq('id',ex.id)));ex.name=name}
 else{const r=await wr(()=>q(SB.from('holidays').insert({school_id:CURS,hdate:date,name}).select().single()));HOLS.push(r)}}
async function nameHoliday(t,n,i){const dt=wd(t,n,Math.floor(i/2));if(!dt)return;const d=iso(dt);if(holName(d))return;
 const auto=ugName(d);
 if(auto){await upsertHol(d,auto);toast(auto+' recorded as a holiday');render();return}
 const nm=await askText('What is this holiday called? ('+fmt(dt)+')','');if(nm){await upsertHol(d,nm);render()}}
function askText(msg,def){return new Promise(r=>{const m=document.createElement('div');m.className='modal';
 m.innerHTML=`<div class="mb"><p>${esc(msg)}</p><input id="at-in" value="${esc(def||'')}" style="margin-bottom:10px"><div class="row"><button class="btn" id="at-ok">Save</button><button class="btn alt" id="at-no">Skip</button></div></div>`;
 document.body.appendChild(m);const inp=m.querySelector('#at-in');inp.focus();
 inp.onkeydown=e=>{if(e.key==='Enter')m.querySelector('#at-ok').click()};
 m.querySelector('#at-ok').onclick=()=>{const v=inp.value.trim();m.remove();r(v||null)};m.querySelector('#at-no').onclick=()=>{m.remove();r(null)}})}
function showCode(title,contact,code){const url=location.origin+location.pathname.replace(/index\.html$/,'');
 const msg=`Analyser\nOpen: ${url}\nTap "Create account"\nContact: ${contact}\nCode: ${code}\n(The code works once and expires in 7 days.)`;
 const m=document.createElement('div');m.className='modal';
 m.innerHTML=`<div class="mb"><h3 style="margin-top:0">${esc(title)}</h3><p>Give this to <b>${esc(contact)}</b> privately. It is shown only now.</p><div class="codebox">${esc(code)}</div><div class="row"><button class="btn" id="sc-copy">Copy message</button><button class="btn alt" id="sc-ok">Close</button></div></div>`;
 document.body.appendChild(m);m.querySelector('#sc-ok').onclick=()=>m.remove();
 m.querySelector('#sc-copy').onclick=async()=>{try{await navigator.clipboard.writeText(msg);toast('Copied')}catch(e){toast('Copy not available: write the code down')}}}

/* =====================================================================
   Data layer (Supabase)
   ===================================================================== */
const q=async p=>{const r=await p;if(r.error)throw r.error;return r.data};
const rl=z=>(z.class_name||'Class')+' — '+z.name;
const sortRegs=a=>a.sort((x,y)=>(x.class_name||'').localeCompare(y.class_name||'')||String(y.name).localeCompare(String(x.name)));
const sortStu=()=>R.students.sort((a,b)=>a.name.localeCompare(b.name,undefined,{sensitivity:'base'}));
const rowOf=o=>{const r={};F.forEach(([k])=>{const v=o[k]==null?'':o[k];r[k]=k==='dob'?(v||null):String(v)});return r};
async function fetchAll(mk){let out=[],from=0;for(;;){const d=await q(mk().range(from,from+999));out=out.concat(d);if(d.length<1000)return out;from+=1000}}
async function loadRegs(){REGS=CURS?await q(SB.from('registers').select('*').eq('school_id',CURS)):[];sortRegs(REGS)}
async function loadHols(){HOLS=CURS?await q(SB.from('holidays').select('*').eq('school_id',CURS).order('hdate')):[]}
async function loadRegister(id,keep){
 const reg=REGS.find(r=>r.id===id);if(!reg){R=null;return}
 const [terms,studs]=await Promise.all([q(SB.from('terms').select('*').eq('register_id',id).order('n')),q(SB.from('learners').select('*').eq('register_id',id))]);
 const marks=terms.length?await fetchAll(()=>SB.from('marks').select('term_id,week,learner_id,codes').in('term_id',terms.map(t=>t.id)).order('term_id').order('week').order('learner_id')):[];
 const T=terms.map(t=>({id:t.id,n:t.n,start:t.start_date||'',weeks:t.weeks,data:{}}));
 marks.forEach(m=>{const t=T.find(x=>x.id===m.term_id);if(t)(t.data[m.week]=t.data[m.week]||{})[m.learner_id]=m.codes});
 R={id,name:reg.name,className:reg.class_name||'',students:studs,terms:T};sortStu();
 if(!R.terms.some(t=>t.n===D.t))D.t=R.terms.length?R.terms[0].n:1;
 if(!keep)cw=1;localStorage.setItem('attend.reg',id);lastSync=Date.now()}
async function loadAdmin(){
 STAFF=await q(SB.from('staff').select('id,full_name,contact,role,school_id,active,user_id,created_at').order('full_name'));
 STAFF_CLASSES=await q(SB.from('staff_classes').select('*'));
 REGS_ALL=sortRegs(await q(SB.from('registers').select('*')));
 OV=await q(SB.rpc('admin_overview'))}

let wq=Promise.resolve(),pw=0;
const stat=()=>{const s=$('#savest');if(s)s.textContent=pw?'Saving…':'All changes saved'};
function wr(fn){pw++;stat();const p=wq.then(fn);wq=p.catch(()=>{});return p.then(r=>{pw--;stat();return r},e=>{pw--;stat();throw e})}
function errText(e){const m=(e&&e.message)||'',c=e&&e.code;
 if(/BAD_CONTACT/.test(m))return 'Enter a valid phone number (at least 9 digits) or an email address.';
 if(/LAST_ADMIN/.test(m))return 'There must always be one active administrator.';
 if(/CANNOT_/.test(m))return 'You cannot do that to your own account.';
 if(c==='23505')return 'That already exists (a duplicate name or contact).';
 if(c==='23503')return 'It cannot be deleted while it still has teachers or classes.';
 if(c==='42501'||/row-level security|permission/i.test(m))return 'Your role is not allowed to do that.';
 return 'Could not save: '+(m||'error')}
function onErr(e){console.error(e);toast(errText(e));if(R&&ME)loadRegister(R.id,true).then(render).catch(()=>{})}
function saveMarks(rows){for(let i=0;i<rows.length;i+=500){const c=rows.slice(i,i+500);
 wr(()=>q(SB.from('marks').upsert(c,{onConflict:'term_id,week,learner_id'}))).catch(onErr)}}
function markCol(t,n,i,ch){const S=R.students,all=S.length&&S.every(s=>code(t,n,s.id)[i]===ch),rows=[];
 S.forEach(s=>{const c=[...code(t,n,s.id)];c[i]=all?'.':ch;const v=c.join('');setCode(t,n,s.id,v);rows.push({term_id:t.id,week:n,learner_id:s.id,codes:v})});saveMarks(rows);return !all}
let pend=null;const curKey=i=>R.id+'|'+D.t+'|'+cw+'|'+i;

/* =====================================================================
   Screens
   ===================================================================== */
function authScreen(mode,msg){
 $('#nav').innerHTML='';$('#userbox').innerHTML='';document.body.classList.remove('nomg','nocreate');
 const m=msg?`<p class="amsg">${esc(msg)}</p>`:'',ct=esc(flow.contact||'');
 const H={
 loading:'<p>Loading…</p>',
 login:`<form id="f-login"><label for="l-c">Phone number or email</label><input id="l-c" autocomplete="username" value="${ct}" required><label for="l-pw">Password</label><input id="l-pw" type="password" autocomplete="current-password" required>${m}<button class="btn wide">Sign in</button><p class="alt"><a href="#" data-act="showcreate">First time here? Create your account</a></p><p class="hint">Forgot your password? Ask the administrator for a new code, then choose “Create your account”.</p></form>`,
 create:`<form id="f-create"><p>Use the phone number or email the administrator registered for you, and the code you were given.</p><label for="c-c">Phone number or email</label><input id="c-c" autocomplete="username" value="${ct}" required><label for="c-code">Code from the administrator</label><input id="c-code" autocapitalize="characters" autocomplete="off" maxlength="12" required><label for="c-p1">Choose a password (8+ characters)</label><input id="c-p1" type="password" autocomplete="new-password" minlength="8" required><label for="c-p2">Repeat password</label><input id="c-p2" type="password" autocomplete="new-password" minlength="8" required>${m}<button class="btn wide">Create account</button><p class="alt"><a href="#" data-act="showlogin">Back to sign in</a></p></form>`,
 inactive:'<p>Your account is not active, or you are not registered. Please contact the administrator.</p><button class="btn wide" data-act="logout">Sign out</button>',
 error:`<p class="amsg">Could not load the app.</p><p class="hint">${esc(msg||'')}</p><p class="hint">Check your internet connection. If the project was paused for inactivity, restore it in Supabase.</p><button class="btn wide" data-act="retry">Try again</button><button class="btn wide alt" data-act="logout">Sign out</button>`,
 nosetup:'<p class="amsg">Setup needed</p><p>Open <b>config.js</b> and paste your Supabase Project URL and public key. See README.md.</p>'};
 $('#main').innerHTML=`<div class="card auth"><img class="alogo" src="icon-512.png" alt="Analyser"><h2>Analyser</h2>${H[mode]}</div>`;
 const f=$('#l-c,#c-c');if(f)f.focus()}

function ctx(){
 const sch=isAdmin()?`<label style="margin:0">School <select id="f-school">${SCHOOLS.map(s=>`<option value="${s.id}" ${s.id===CURS?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label>`:`<b>${esc(ME.school_name||'')}</b>`;
 const cl=REGS.length?`<label style="margin:0">Class <select id="f-reg">${REGS.map(z=>`<option value="${z.id}" ${R&&z.id===R.id?'selected':''}>${esc(rl(z))}</option>`).join('')}</select></label>`:'';
 const ch=R?`<div class="chips">${R.terms.map(t=>`<button class="chip ${t.n===D.t?'on':''}" data-act="term" data-n="${t.n}">Term ${t.n}</button>`).join('')}${R.terms.length<3?`<button class="chip mgonly" data-act="addterm">＋ Add Term ${R.terms.length+1}</button>`:''}</div>`:'';
 return`<div class="ctx noprint">${sch}${cl}${ch}</div>`}
function noReg(){
 if(isAdmin()&&!SCHOOLS.length)return '<div class="card">Welcome, administrator. Open <b>Administration</b>, add your first school, then register its people.</div>';
 if(canCreate())return '<div class="card">This school has no class register yet. Open <b>Settings</b> and create one (class and year).</div>';
 return '<div class="card">No class has been assigned to you yet. Please ask the administrator to assign your classes.</div>'}

function setView(){let h='';
 if(R&&canManage()){const t=TM(),last=R.terms[R.terms.length-1];
  h+=`<div class="card"><h3 style="margin-top:0">${esc(R.className||'Class')} — ${esc(R.name)}</h3><div class="grid2">
  <div><label>Class name</label><input id="f-class" value="${esc(R.className)}" placeholder="e.g. Primary 5"></div>
  <div><label>Year</label><input id="f-yn" value="${esc(R.name)}"></div></div>
  ${t?`<h3>Term ${t.n}</h3><div class="grid2"><div><label>Week 1 starts (type or pick a Monday)</label><input id="f-start" type="date" value="${t.start}"></div>
  <div><label>Number of weeks in this term</label><input id="f-weeks" type="number" min="1" max="30" value="${t.weeks}"></div></div>`:''}
  <p><button class="btn" data-act="saveset">Save settings</button> ${t?`<button class="btn alt" data-act="clrterm">Clear Term ${t.n} data</button>`:''} ${R.terms.length>1&&t===last?`<button class="btn red" data-act="delterm">Delete Term ${t.n}</button>`:''}</p>
  <p class="hint">“Clear data” removes all attendance marks in this term but keeps learners and weeks. Terms 2 and 3 are optional; a class has at most 3 terms a year.</p></div>`}
 if(canCreate())h+=`<div class="card"><h3 style="margin-top:0">New class register</h3><div class="grid2">
  <div><label>Class name</label><input id="f-nc" placeholder="e.g. Primary 6"></div><div><label>Year</label><input id="f-ny" value="${new Date().getFullYear()}"></div>
  ${R?`<div><label><input type="checkbox" id="f-copy" checked style="width:auto"> Copy the learners from ${esc(rl({class_name:R.className,name:R.name}))}</label><span class="hint">Brings over names and profiles so you only add or delete changes.</span></div>`:''}</div>
  <p><button class="btn" data-act="newreg">Create register (Term 1)</button> ${R?`<button class="btn red" data-act="delreg">Delete this register</button>`:''}</p>
  ${isHead()?'<p class="hint">After you create a class, ask the administrator to assign teachers to it.</p>':''}</div>`;
 h+=`<div class="card"><h3 style="margin-top:0">My account</h3><p>${esc(ME.full_name||'')} · ${esc(ROLE_LABEL[ME.role]||'')} · ${esc(ME.contact||'')}</p><div class="grid2">
  <div><label>New password (8+ characters)</label><input id="f-pw1" type="password" autocomplete="new-password"></div><div><label>Repeat new password</label><input id="f-pw2" type="password" autocomplete="new-password"></div></div>
  <p><button class="btn" data-act="chpw">Change password</button> <button class="btn alt" data-act="logout">Sign out</button> ${dip?'<button class="btn alt" data-act="install">Install Analyser</button>':''}</p></div>`;
 return h}

function adminView(){
 const ov=OV||[],opts=sel=>SCHOOLS.map(s=>`<option value="${s.id}" ${s.id===sel?'selected':''}>${esc(s.name)}</option>`).join('');
 const roleOpts=sel=>['admin','headteacher','classteacher','teacher'].map(r=>`<option value="${r}" ${r===sel?'selected':''}>${ROLE_LABEL[r]}</option>`).join('');
 const sr=SCHOOLS.map(s=>{const o=ov.find(x=>x.id===s.id)||{};return`<tr><td><input id="sn-${s.id}" value="${esc(s.name)}"></td><td>${o.teachers||0} (${o.activated||0} with accounts)</td><td>${o.classes||0}</td><td>${o.learners||0}</td><td style="white-space:nowrap"><button class="btn alt" data-act="savesch" data-id="${s.id}">Rename</button> <button class="btn red" data-act="delsch" data-id="${s.id}">Delete</button></td></tr>`}).join('')||'<tr><td colspan="5">No schools yet.</td></tr>';
 const status=t=>!t.active?'Deactivated':t.user_id?'Account created':'Waiting: no account yet';
 const tr=STAFF.map(t=>{const me=t.user_id&&t.user_id===ME.uid,mine=STAFF_CLASSES.filter(c=>c.staff_id===t.id).map(c=>c.register_id),regs=REGS_ALL.filter(r=>r.school_id===t.school_id);
  const cls=t.role==='admin'?'All schools':t.role==='headteacher'?'All classes of the school':`<details><summary>${mine.length} class(es)</summary>${regs.map(r=>`<label class="chk"><input type="checkbox" class="cls-${t.id}" value="${r.id}" ${mine.includes(r.id)?'checked':''}> ${esc(rl(r))}</label>`).join('')||'<span class="hint">No classes in this school yet</span>'}</details>`;
  return`<tr><td><input id="tn-${t.id}" value="${esc(t.full_name)}"></td><td><input id="tc-${t.id}" value="${esc(t.contact)}" ${t.user_id?'disabled title="Account already created"':''}></td>
  <td><select id="tr-${t.id}" ${me?'disabled':''}>${roleOpts(t.role)}</select></td><td><select id="ts-${t.id}" ${t.role==='admin'?'disabled':''}>${opts(t.school_id)}</select></td><td>${cls}</td><td>${status(t)}</td>
  <td style="white-space:nowrap"><button class="btn alt" data-act="savestaff" data-id="${t.id}">Save</button> <button class="btn alt" data-act="reissue" data-id="${t.id}" ${me?'disabled':''}>New code</button> <button class="btn alt" data-act="togstaff" data-id="${t.id}" ${me?'disabled':''}>${t.active?'Deactivate':'Reactivate'}</button> <button class="btn red" data-act="delstaff" data-id="${t.id}" ${me?'disabled':''}>Delete</button></td></tr>`}).join('')||'<tr><td colspan="7">Nobody registered yet.</td></tr>';
 return`<div class="card"><h3 style="margin-top:0">Administration</h3><p class="hint">Only administrators can see this page. Nobody can create an account unless you register their phone number or email here and give them their code.</p></div>
 <div class="card"><h3 style="margin-top:0">Schools</h3><div class="row"><input id="f-nsch" placeholder="School name" style="flex:1;min-width:200px"><button class="btn" data-act="addsch">＋ Add school</button></div>
 <div class="wrap"><table><thead><tr><th>School</th><th>People</th><th>Classes</th><th>Learners</th><th></th></tr></thead><tbody>${sr}</tbody></table></div></div>
 <div class="card"><h3 style="margin-top:0">Register a person</h3><div class="grid2">
 <div><label>Full name</label><input id="f-tn"></div><div><label>Contact: phone number or email</label><input id="f-tc" placeholder="e.g. 0772 123 456"></div>
 <div><label>Role</label><select id="f-tr">${roleOpts('teacher')}</select></div><div><label>School (not needed for administrators)</label><select id="f-ts">${opts(CURS)}</select></div></div>
 <p><button class="btn" data-act="addstaff">＋ Register and get code</button></p>
 <p class="hint">Head teacher: all classes of one school. Class teacher: only the classes you assign, and may add learners there. Teacher: only the classes you assign, marks attendance but cannot add learners. After registering, assign classes in the table below.</p></div>
 <div class="card"><h3 style="margin-top:0">Registered people (${STAFF.length})</h3><div class="wrap"><table><thead><tr><th>Name</th><th>Contact</th><th>Role</th><th>School</th><th>Classes</th><th>Status</th><th></th></tr></thead><tbody>${tr}</tbody></table></div>
 <p class="hint">“New code” is for a forgotten password or a lost code: the person’s old login is removed and they create a new password with the new code. Change a role or school with Save, then tick the classes and Save again.</p></div>
 <div class="card"><h3 style="margin-top:0">Backup</h3><p>Download everything (all schools) as one file. It contains children’s personal details: keep it private.</p><button class="btn" data-act="exp">Download backup (JSON)</button></div>`}

function render(){
 if(!ME)return;
 document.body.classList.toggle('nomg',!canManage());document.body.classList.toggle('nocreate',!canCreate());
 const tabs=[['dash','Dashboard'],['week','Weekly sheet'],['sum','Term summary'],['year','Yearly summary'],['hol','Holidays'],['info','Learner basic info'],['learn','Learners'],['set','Settings']];
 if(isAdmin())tabs.push(['admin','Administration']);
 $('#nav').innerHTML=tabs.map(([k,l])=>`<button data-act="v" data-v="${k}" class="${view===k?'on':''}">${l}</button>`).join('');
 $('#userbox').innerHTML=`<span>${esc(ME.full_name||'')} · ${esc(ROLE_LABEL[ME.role]||'')}</span><span id="savest">All changes saved</span><button class="ubtn" data-act="logout">Sign out</button>`;
 const sy=scrollY,sl=$('.wrap')&&$('.wrap').scrollLeft;let body;
 if(view==='admin'&&isAdmin())body=adminView();
 else if(view==='set')body=ctx()+setView();
 else if(!R)body=ctx()+noReg();
 else if(!TM())body=ctx()+'<div class="card">This class has no term yet.'+(canManage()?' Tap “＋ Add Term 1” above.':' Ask your class teacher or head teacher.')+'</div>';
 else body=ctx()+({dash:dashView,week:weekView,sum:sumView,year:yearView,hol:holView,learn:learnView,info:()=>editId!==null?learnView():infoView()}[view]||dashView)();
 $('#main').innerHTML=body;
 if(sl&&$('.wrap'))$('.wrap').scrollLeft=sl;scrollTo(0,goTop?0:sy);goTop=false}

/* =====================================================================
   Sign-in and session
   ===================================================================== */
function clearState(){ME=null;R=null;REGS=[];REGS_ALL=[];SCHOOLS=[];STAFF=[];STAFF_CLASSES=[];HOLS=[];OV=null;CURS=null;bootedFor=null;editId=null;clearTimeout(idleT);
 try{localStorage.removeItem('attend.reg');localStorage.removeItem('attend.school')}catch(e){}}
async function boot(session){
 bootedFor=session.user.id;authScreen('loading');
 try{
  ME=await q(SB.rpc('whoami'));
  if(!ME||!ME.active){ME=null;bootedFor=null;return authScreen('inactive')}
  ME.uid=session.user.id;
  SCHOOLS=await q(SB.from('schools').select('*').order('name'));
  CURS=isAdmin()?((SCHOOLS.find(s=>s.id===localStorage.getItem('attend.school'))||SCHOOLS[0]||{}).id||null):ME.school_id;
  await loadRegs();await loadHols();
  const pick=REGS.find(r=>r.id===localStorage.getItem('attend.reg'))||REGS[0];
  if(pick)await loadRegister(pick.id);else R=null;
  view=isAdmin()&&!SCHOOLS.length?'admin':'dash';if(view==='admin')await loadAdmin();
  resetIdle();render()
 }catch(e){bootedFor=null;ME=null;console.error(e);authScreen('error',e.message||'')}}
function resetIdle(){clearTimeout(idleT);if(!ME)return;idleT=setTimeout(()=>{SB.auth.signOut()},30*60*1000)}
['click','keydown','touchstart','mousemove'].forEach(ev=>addEventListener(ev,resetIdle,{passive:true}));
document.addEventListener('visibilitychange',()=>{if(document.hidden||!ME||!R||editId!==null||pw||view==='admin'||Date.now()-lastSync<30000)return;lastSync=Date.now();loadRegister(R.id,true).then(()=>loadHols()).then(render).catch(()=>{})});

document.addEventListener('submit',async e=>{e.preventDefault();const id=e.target.id;
 try{
  if(id==='f-login'){flow.contact=$('#l-c').value.trim();
   const em=await q(SB.rpc('login_email',{p_contact:flow.contact}));
   const {error}=await SB.auth.signInWithPassword({email:em,password:$('#l-pw').value});
   if(error)authScreen('login','Wrong contact or password. If this is your first time, choose “Create your account”.')}
  else if(id==='f-create'){flow.contact=$('#c-c').value.trim();const code=$('#c-code').value.trim(),p1=$('#c-p1').value,p2=$('#c-p2').value;
   if(p1!==p2)return authScreen('create','The two passwords do not match.');if(p1.length<8)return authScreen('create','Use at least 8 characters for the password.');
   const r=await q(SB.rpc('claim_activation',{p_contact:flow.contact,p_code:code}));
   if(!r||!r.ok)return authScreen('create',r&&r.reason==='locked'?'Too many wrong tries. Wait 15 minutes, or ask the administrator for a new code.':'That contact or code is not valid, or the code has expired. Ask the administrator for a new code.');
   const {data,error}=await SB.auth.signUp({email:r.email,password:p1,options:{data:{ticket:r.ticket}}});
   if(error)return authScreen('create','Could not create the account. If you already have one, sign in instead; otherwise ask the administrator for a new code.');
   if(!data||!data.session)authScreen('create','The account was created but you are not signed in. The administrator must switch “Confirm email” OFF in Supabase (see README), then you can sign in.')}
 }catch(x){console.error(x);authScreen('error',x.message||'')}});

/* =====================================================================
   Actions
   ===================================================================== */
const MG=new Set(['newlrn','savelrn','dellrn','del','add','impl','addwk','rmwk','clr','clrterm','delterm','saveset','addterm','edit']);
const CR=new Set(['newreg','delreg','delhol']);
const ADM=new Set(['addsch','savesch','delsch','addstaff','savestaff','togstaff','delstaff','reissue','exp']);
const NOR=new Set(['v','newreg','chpw','addsch','savesch','delsch','addstaff','savestaff','togstaff','delstaff','reissue','exp','loadug','addhol','savehol','delhol']);
document.addEventListener('click',async e=>{try{await onClick(e)}catch(x){onErr(x)}});
async function onClick(e){
 const td=e.target.closest('td.c');
 if(td&&ME&&R){const t=TM(),id=td.dataset.s,i=+td.dataset.i,a=[...code(t,cw,id)];a[i]=ORDER[(ORDER.indexOf(a[i])+1)%5];const v=a.join('');
  setCode(t,cw,id,v);saveMarks([{term_id:t.id,week:cw,learner_id:id,codes:v}]);return render()}
 const b=e.target.closest('[data-act]');if(!b)return;if(b.tagName==='A')e.preventDefault();
 const a=b.dataset.act,i=+b.dataset.i,id=b.dataset.id;
 if(a==='showcreate'){return authScreen('create')}
 if(a==='showlogin')return authScreen('login');
 if(a==='logout'){await SB.auth.signOut();return}
 if(a==='retry'){const {data}=await SB.auth.getSession();return data.session?boot(data.session):authScreen('login')}
 if(a==='install'){if(dip){dip.prompt();dip=null;render()}return}
 if(!ME)return;
 if(MG.has(a)&&!canManage())return toast('Your role cannot change this class');
 if(CR.has(a)&&!canCreate())return toast('Only the head teacher or administrator can do this');
 if(ADM.has(a)&&!isAdmin())return toast('Administrator only');
 if(!R&&!NOR.has(a))return;
 const t=TM(),y=R;
 if(a==='v'){view=b.dataset.v;editId=null;if(view==='admin')await loadAdmin()}
 else if(a==='wk'){cw=+b.dataset.n;view='week'}
 else if(a==='term'){D.t=+b.dataset.n;cw=1}
 else if(a==='prev'){cw=Math.max(1,cw-1)}else if(a==='next'){cw=Math.min(t.weeks,cw+1)}
 else if(a==='addterm'){const n=y.terms.length+1;if(n>3)return;
  const r=await wr(()=>q(SB.from('terms').insert({register_id:y.id,n,weeks:12}).select().single()));
  y.terms.push({id:r.id,n,start:'',weeks:12,data:{}});D.t=n;cw=1;view='set';toast('Term '+n+' added. Enter its start date and number of weeks, then save.')}
 else if(a==='addwk'){if(t.weeks>=30)return toast('Maximum 30 weeks per term');
  await wr(()=>q(SB.from('terms').update({weeks:t.weeks+1}).eq('id',t.id)));t.weeks++;cw=t.weeks;view='week';toast('Week '+t.weeks+' added')}
 else if(a==='rmwk'){if(t.weeks<=1)return toast('A term needs at least one week');
  if(await ask('Remove Week '+t.weeks+' from Term '+t.n+'? Its attendance marks will be lost.')){
   await wr(()=>q(SB.from('marks').delete().eq('term_id',t.id).eq('week',t.weeks)));await wr(()=>q(SB.from('terms').update({weeks:t.weeks-1}).eq('id',t.id)));
   delete t.data[t.weeks];t.weeks--;cw=Math.min(cw,t.weeks)}}
 else if(a==='col'){const key=curKey(i),wk0=cw;
  if(pend&&pend.key===key){clearTimeout(pend.t);pend=null;const set=markCol(t,wk0,i,'H');render();if(set)nameHoliday(t,wk0,i).catch(onErr);return}
  if(pend){clearTimeout(pend.t);pend.fn();pend=null}
  pend={key,t:setTimeout(()=>{pend=null;markCol(t,wk0,i,'P');render()},300),fn:()=>markCol(t,wk0,i,'P')};return}
 else if(a==='clr'){if(await ask('Clear all marks for Term '+t.n+', Week '+cw+'?')){
  await wr(()=>q(SB.from('marks').delete().eq('term_id',t.id).eq('week',cw)));delete t.data[cw];toast('Week cleared')}}
 else if(a==='clrterm'){if(await ask('Clear ALL attendance marks in Term '+t.n+' of '+y.className+' '+y.name+'? Learners and weeks stay.')){
  await wr(()=>q(SB.from('marks').delete().eq('term_id',t.id)));t.data={};toast('Term '+t.n+' data cleared')}}
 else if(a==='delterm'){if(await ask('Delete Term '+t.n+' and all its attendance?')){
  await wr(()=>q(SB.from('terms').delete().eq('id',t.id)));y.terms=y.terms.filter(x=>x.id!==t.id);D.t=y.terms.length?y.terms[y.terms.length-1].n:1;cw=1}}
 else if(a==='saveset'){const nm=$('#f-yn').value.trim()||y.name,cl=$('#f-class').value.trim();
  await wr(()=>q(SB.from('registers').update({name:nm,class_name:cl}).eq('id',y.id)));
  y.name=nm;y.className=cl;const z=REGS.find(r=>r.id===y.id);z.name=nm;z.class_name=cl;sortRegs(REGS);
  if(t){const raw=$('#f-start').value,m=mon(raw);if(m&&m!==raw)toast("Start date moved to that week's Monday");
   const nw=Math.max(1,Math.min(30,+$('#f-weeks').value||t.weeks));
   if(nw<t.weeks){const lost=Ws(t).filter(n=>n>nw&&hasData(t,n)).length;
    if(lost&&!await ask('Reducing to '+nw+' weeks deletes '+lost+' week(s) that have attendance. Continue?'))return;
    await wr(()=>q(SB.from('marks').delete().eq('term_id',t.id).gt('week',nw)));for(let n=nw+1;n<=30;n++)delete t.data[n]}
   await wr(()=>q(SB.from('terms').update({start_date:m||null,weeks:nw}).eq('id',t.id)));t.start=m;t.weeks=nw}
  toast('Settings saved')}
 else if(a==='newreg'){const cl=$('#f-nc').value.trim(),nm=$('#f-ny').value.trim();if(!cl||!nm)return toast('Enter the class and the year');
  if(!CURS)return toast('No school selected');
  const copy=$('#f-copy')&&$('#f-copy').checked&&R?R.students.slice():[];
  const reg=await wr(()=>q(SB.from('registers').insert({school_id:CURS,name:nm,class_name:cl}).select().single()));
  await wr(()=>q(SB.from('terms').insert({register_id:reg.id,n:1,weeks:12})));
  for(let k=0;k<copy.length;k+=200){const rows=copy.slice(k,k+200).map(s=>({register_id:reg.id,...rowOf(s)}));await wr(()=>q(SB.from('learners').insert(rows)))}
  REGS.push(reg);sortRegs(REGS);await loadRegister(reg.id);view='set';toast('Register created. Set the Term 1 start date.')}
 else if(a==='delreg'){if(await ask('Delete the register '+rl({class_name:y.className,name:y.name})+' with all its terms, learners and attendance? This cannot be undone.')){
  await wr(()=>q(SB.from('registers').delete().eq('id',y.id)));REGS=REGS.filter(r=>r.id!==y.id);localStorage.removeItem('attend.reg');
  if(REGS.length)await loadRegister(REGS[0].id);else R=null;view='dash'}}
 else if(a==='chpw'){const p1=$('#f-pw1').value,p2=$('#f-pw2').value;if(p1!==p2)return toast('The two passwords do not match');if(p1.length<8)return toast('Use at least 8 characters');
  const {error}=await SB.auth.updateUser({password:p1});if(error)return toast(error.message);toast('Password changed');$('#f-pw1').value='';$('#f-pw2').value='';return}
 /* holidays */
 else if(a==='loadug'){const yr=+$('#f-hy').value;if(!yr)return toast('Enter the year');holYear=yr;
  const rows=ugHolidays(yr).filter(h=>!HOLS.some(x=>x.hdate===h.date)).map(h=>({school_id:CURS,hdate:h.date,name:h.name}));
  if(rows.length){const r=await wr(()=>q(SB.from('holidays').insert(rows).select()));HOLS.push(...r)}
  toast(rows.length?rows.length+' public holidays added for '+yr+'. Check the Eid dates.':'Those public holidays are already recorded.')}
 else if(a==='addhol'){const d=$('#f-hd').value,nm=$('#f-hn').value.trim()||ugName($('#f-hd').value)||'Holiday';if(!d)return toast('Pick the date');
  holYear=+d.slice(0,4);await upsertHol(d,nm);toast('Holiday saved')}
 else if(a==='savehol'){const d=b.dataset.d,nm=$('#hn-'+d).value.trim();if(!nm)return toast('Type the holiday name');await upsertHol(d,nm);toast('Saved')}
 else if(a==='delhol'){if(await ask('Delete this holiday record? Attendance marks stay as they are.')){await wr(()=>q(SB.from('holidays').delete().eq('id',id)));HOLS=HOLS.filter(h=>h.id!==id)}}
 else if(a==='pdfhol'){const yr=holYear||yearNum(),rows=holRows(yr),dd=x=>{const d=new Date(x+'T00:00:00');return fmt(d)+' '+DOW[d.getDay()]};
  pdf(fname(`Holidays-${y.className}-${yr}`)+'.pdf',`HOLIDAYS ${yr} - ${rows.length} DAY(S)`,[['No','Date','This class','Holiday']],rows.map((r,k)=>[k+1,dd(r.date),r.where||'-',{t:r.name||'(not named)',al:'l'}]),[{t:'TOTAL HOLIDAYS',cs:3,al:'r'},rows.length],[1,5,4,8]);return}
 /* learners */
 else if(a==='newlrn'){editId='new';goTop=true}
 else if(a==='edit'){editId=y.students[i].id;goTop=true}
 else if(a==='cancellrn'){editId=null;goTop=true}
 else if(a==='savelrn'){const o={};F.forEach(([k])=>o[k]=$('#p-'+k).value.trim());if(!o.name)return toast('Enter the learner name');const row=rowOf(o);
  if(editId==='new'){const r=await wr(()=>q(SB.from('learners').insert({register_id:y.id,...row}).select().single()));y.students.push(r)}
  else{await wr(()=>q(SB.from('learners').update(row).eq('id',editId)));Object.assign(y.students.find(x=>x.id===editId),row)}
  sortStu();editId=null;goTop=true;toast('Learner saved')}
 else if(a==='dellrn'||a==='del'){const s=a==='del'?y.students[i]:y.students.find(x=>x.id===editId);
  if(s&&await ask('Delete '+s.name+' and their attendance for all terms of this register?')){
   await wr(()=>q(SB.from('learners').delete().eq('id',s.id)));y.terms.forEach(tt=>Object.values(tt.data).forEach(w=>delete w[s.id]));y.students=y.students.filter(x=>x.id!==s.id);editId=null;goTop=true}}
 else if(a==='add'){const ns=$('#f-names').value.split('\n').map(x=>x.trim()).filter(Boolean);
  for(let k=0;k<ns.length;k+=200){const rows=ns.slice(k,k+200).map(n=>({register_id:y.id,name:n}));const r=await wr(()=>q(SB.from('learners').insert(rows).select()));y.students.push(...r)}
  sortStu();toast(ns.length+' learner(s) added')}
 else if(a==='tpl'){saveFile('Analyser-learners-template.csv','\ufeff'+toCSV([F.map(f=>f[1])]),'text/csv');return}
 else if(a==='expl'){saveFile(fname(`Learners-${y.className}-${y.name}`)+'.csv','\ufeff'+toCSV([['No','School','Class','Age',...F.map(f=>f[1])],...y.students.map((s,k)=>[k+1,D.school,y.className||'',age(s.dob),...F.map(([key])=>s[key]||'')])]),'text/csv');return}
 else if(a==='impl'){$('#f-lrn').click();return}
 else if(a==='pdfl'){const S=y.students,d=x=>x?fmt(new Date(x+'T00:00:00')):'';
  const head=[['No','Name','Sex','Date of birth','Age','LIN','Nationality','Religion','Orphan status','Repeater','Social needs','Father',"Father's contact",'Mother',"Mother's contact","Parents' address"]];
  const body=S.map((s,k)=>[k+1,{t:s.name,al:'l'},s.gender==='Male'?'M':s.gender==='Female'?'F':'',d(s.dob),age(s.dob),s.lin||'',s.nationality||'',s.religion||'',s.orphan||'',s.repeater||'',s.social||'',s.father||'',s.father_tel||'',s.mother||'',s.mother_tel||'',s.address||'']);
  pdf(fname(`Learner-profiles-${y.className}-${y.name}`)+'.pdf',`LEARNER PROFILES - ${S.length} LEARNERS`,head,body,[{t:'TOTAL LEARNERS',cs:2,al:'r'},S.length],[1,5,1.3,2.8,1.1,3.4,2.4,2.8,3.6,1.8,2.6,3.8,3,3.8,3,5]);return}
 else if(a==='pdfw'){pdfWeek();return}
 else if(a==='pdfs'){pdfData(fname(`Summary-${y.className}-${y.name}-Term${t.n}`)+'.pdf',`TERM ${t.n} SUMMARY - PRESENT DAYS PER WEEK`,sumData(t));return}
 else if(a==='pdfy'){pdfData(fname(`Yearly-Summary-${y.className}-${y.name}`)+'.pdf','YEARLY SUMMARY',yearData());return}
 else if(a==='csv'){const rows=[['No','Name',...DAYS.flatMap(d=>[d+' M',d+' A']),'Presence','Absence','Sick','Holiday days','Present %','Absent %','Present days'],...weekArr(t,cw)];
  saveFile(fname(`Attendance-${y.className}-${y.name}-Term${t.n}-Week${cw}`)+'.csv','\ufeff'+toCSV(rows),'text/csv');return}
 /* administrator only (the database enforces this too) */
 else if(a==='addsch'){const nm=$('#f-nsch').value.trim();if(!nm)return toast('Enter the school name');
  const r=await wr(()=>q(SB.from('schools').insert({name:nm}).select().single()));SCHOOLS.push(r);SCHOOLS.sort((p,s)=>p.name.localeCompare(s.name));
  if(!CURS){CURS=r.id;await loadRegs();await loadHols()}await loadAdmin();toast('School added')}
 else if(a==='savesch'){const nm=$('#sn-'+id).value.trim();if(!nm)return toast('Enter the school name');
  await wr(()=>q(SB.from('schools').update({name:nm}).eq('id',id)));SCHOOLS.find(s=>s.id===id).name=nm;await loadAdmin();toast('School renamed')}
 else if(a==='delsch'){const s=SCHOOLS.find(x=>x.id===id);
  if(await ask('Delete the school '+s.name+'? This only works if it has no people or classes.')){await wr(()=>q(SB.from('schools').delete().eq('id',id)));
   SCHOOLS=SCHOOLS.filter(x=>x.id!==id);if(CURS===id){CURS=SCHOOLS[0]?SCHOOLS[0].id:null;R=null;await loadRegs();await loadHols();if(REGS.length)await loadRegister(REGS[0].id)}await loadAdmin()}}
 else if(a==='addstaff'){const o={p_name:$('#f-tn').value.trim(),p_contact:$('#f-tc').value.trim(),p_role:$('#f-tr').value,p_school:$('#f-ts').value||null};
  if(!o.p_name||!o.p_contact)return toast('Enter the name and the contact');if(o.p_role!=='admin'&&!o.p_school)return toast('Add a school first');
  const r=await wr(()=>q(SB.rpc('admin_register_staff',o)));await loadAdmin();showCode('Account code for '+o.p_name,o.p_contact,r.code)}
 else if(a==='savestaff'){const s=STAFF.find(x=>x.id===id),role=$('#tr-'+id).value,school=role==='admin'?null:$('#ts-'+id).value;
  const o={full_name:$('#tn-'+id).value.trim(),role,school_id:school};if(!s.user_id)o.contact=$('#tc-'+id).value.trim();
  if(!o.full_name)return toast('Enter the name');if(role!=='admin'&&!school)return toast('Choose the school');
  await wr(()=>q(SB.from('staff').update(o).eq('id',id)));
  const boxes=[...document.querySelectorAll('.cls-'+id)];
  if(boxes.length||role==='headteacher'||role==='admin'||s.role!==role){
   await wr(()=>q(SB.from('staff_classes').delete().eq('staff_id',id)));
   if(role==='classteacher'||role==='teacher'){const ids=boxes.filter(x=>x.checked).map(x=>x.value).filter(v=>REGS_ALL.some(r=>r.id===v&&r.school_id===school));
    if(ids.length)await wr(()=>q(SB.from('staff_classes').insert(ids.map(rid=>({staff_id:id,register_id:rid})))))}}
  await loadAdmin();toast('Saved')}
 else if(a==='reissue'){const s=STAFF.find(x=>x.id===id);
  if(await ask('Give '+s.full_name+' a new code? Their current password stops working and they must create a new one.')){
   const r=await wr(()=>q(SB.rpc('admin_reissue_code',{p_staff:id})));await loadAdmin();showCode('New code for '+s.full_name,s.contact,r.code)}}
 else if(a==='togstaff'){const s=STAFF.find(x=>x.id===id);await wr(()=>q(SB.from('staff').update({active:!s.active}).eq('id',id)));await loadAdmin()}
 else if(a==='delstaff'){const s=STAFF.find(x=>x.id===id);
  if(await ask('Delete '+s.full_name+' completely? They lose all access.')){await wr(()=>q(SB.rpc('admin_delete_staff',{p_staff:id})));await loadAdmin()}}
 else if(a==='exp'){const sel={staff:'id,full_name,contact,role,school_id,active,created_at'},tabs=['schools','staff','staff_classes','registers','terms','learners','marks','holidays'],out={exported:new Date().toISOString()};
  for(const n of tabs)out[n]=await fetchAll(()=>SB.from(n).select(sel[n]||'*').order(n==='marks'?'term_id':n==='staff_classes'?'staff_id':n==='holidays'?'hdate':'created_at'));
  saveFile('Analyser-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(out),'application/json');toast('Backup downloaded');return}
 render()}

document.addEventListener('change',async e=>{const t=e.target;
 try{
  if(t.id==='f-school'){CURS=t.value;localStorage.setItem('attend.school',CURS);R=null;await loadRegs();await loadHols();if(REGS.length)await loadRegister(REGS[0].id);editId=null;render()}
  else if(t.id==='f-reg'){await loadRegister(t.value);editId=null;render()}
  else if(t.id==='p-dob'){$('#p-age').textContent=t.value?'Age: '+age(t.value)+' years':''}
  else if(t.id==='f-ws'){if(!canManage())return;const m=mon(t.value),tm=TM();if(m&&m!==t.value)toast("Moved to that week's Monday");
   await wr(()=>q(SB.from('terms').update({start_date:m||null}).eq('id',tm.id)));tm.start=m;render()}
  else if(t.id==='f-lrn'&&t.files[0]){if(!canManage()){t.value='';return}
   const rows=parseCSV(await t.files[0].text()),map=rows[0].map(x=>ALIAS[norm(x)]||null);let n=0;
   if(!map.includes('name')){toast('Could not read that file. Use the CSV template: it needs a "Full name" column.');t.value='';return}
   const list=[];rows.slice(1).forEach(r=>{const o={};map.forEach((k,ci)=>{if(k)o[k]=(r[ci]||'').trim()});if(!o.name)return;
    if(o.dob)o.dob=toISO(o.dob);if(o.gender)o.gender=/^m/i.test(o.gender)?'Male':/^f/i.test(o.gender)?'Female':'';
    if(o.repeater)o.repeater=/^y/i.test(o.repeater)?'Yes':'No';list.push({register_id:R.id,...rowOf(o)})});
   for(let k=0;k<list.length;k+=200){const c=list.slice(k,k+200);const r=await wr(()=>q(SB.from('learners').insert(c).select()));R.students.push(...r);n+=r.length}
   sortStu();t.value='';toast(n+' learner(s) imported');render()}
 }catch(x){onErr(x)}});
document.addEventListener('input',e=>{if(e.target.id==='f-q'){const s=e.target.value.toLowerCase();document.querySelectorAll('tr[data-q]').forEach(r=>r.style.display=r.dataset.q.includes(s)?'':'none')}});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();dip=e;if(ME&&view==='set')render()});
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});

/* =====================================================================
   Start
   ===================================================================== */
(function init(){
 const missing=!CFG.SUPABASE_URL||/YOUR-PROJECT/i.test(CFG.SUPABASE_URL)||!CFG.SUPABASE_ANON_KEY||/YOUR/i.test(CFG.SUPABASE_ANON_KEY);
 if(missing||!window.supabase)return authScreen('nosetup');
 SB=window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 authScreen('loading');
 SB.auth.onAuthStateChange((ev,session)=>{
  if(ev==='SIGNED_OUT'){clearState();authScreen('login');return}
  if(ev==='INITIAL_SESSION'&&!session){authScreen('login');return}
  if(session&&(ev==='SIGNED_IN'||ev==='INITIAL_SESSION')&&bootedFor!==session.user.id)setTimeout(()=>boot(session),0)});
})();
