/* Shared report-card calculation: one present session is half a day.
   The denominator uses the complete configured term, not only marked weeks. */
(function(root){
function attendanceResult(term,marks,holidays,learnerId,includeHolidays){
 if(!term||!term.start_date)return null;
 const holidayDates=new Set(holidays.map(h=>h.hdate));
 const codes=new Map(marks.filter(m=>String(m.learner_id)===String(learnerId)).map(m=>[m.week,m.codes]));
 const closed=new Set();
 // A holiday header marks the session H for the whole class. Individual H also excludes that session.
 for(const m of marks)for(let i=0;i<10;i++)if(m.codes[i]==='H')closed.add(m.week+':'+i);
 let present=0,total=0,unmarked=0;
 for(let w=1;w<=term.weeks;w++)for(let d=0;d<5;d++){
  const date=new Date(term.start_date+'T00:00:00');date.setDate(date.getDate()+(w-1)*7+d);
  const ds=date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
  if(term.end_date&&ds>term.end_date)continue;
  for(let session=0;session<2;session++){
   const i=d*2+session,c=(codes.get(w)||'..........')[i],holiday=holidayDates.has(ds)||closed.has(w+':'+i);
   if(holiday&&!includeHolidays)continue;
   total++;if(c==='P')present++;if(!holiday&&(!c||c==='.'))unmarked++;
  }
 }
 return {days:present/2,total:total/2,percentage:total?present/total*100:null,unmarked};
}
root.attendanceResult=attendanceResult;
if(typeof module!=='undefined')module.exports=attendanceResult;
})(typeof window!=='undefined'?window:globalThis);
