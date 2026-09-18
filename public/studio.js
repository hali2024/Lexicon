/* Dashboard reads the same records as the practice and account views. */
function goToStudio(){closeAllLayers();showHome();window.scrollTo({top:0,behavior:'smooth'});}
function selectStudioTab(tab){
  for(const name of ['ai','csv']){
    document.getElementById(name+'Pane').classList.toggle('hidden',name!==tab);
    document.getElementById(name+'Tab').setAttribute('aria-selected',String(name===tab));
  }
}
function newStudioCollection(){selectStudioTab('ai');document.getElementById('aiWordsInput').focus();}
async function readCSVFile(input){
  const file=input.files?.[0],status=document.getElementById('csvStatus');
  if(!file)return;
  if(file.size>500000){status.textContent='Choose a CSV smaller than 500 KB.';input.value='';return;}
  try{document.getElementById('csvInput').value=await file.text();status.textContent=file.name+' · Ready to import.';}catch{status.textContent='Unable to read this file. Please try again.';}
  input.value='';
}
function openCabinetSearch(){goToStudio();const input=document.getElementById('librarySearch');input.classList.remove('hidden');input.focus();}
function dashboardSummary(stats,now=new Date()){
  const activity={...stats.daily};
  for(const [day,words] of Object.entries(stats.dailyWordPractice||{}))activity[day]=Math.max(Number(activity[day])||0,Object.values(words).reduce((a,b)=>a+(Number(b)||0),0));
  let streak=0,cursor=new Date(now);cursor.setHours(12,0,0,0);
  if(!(activity[dateKey(cursor)]>0))cursor.setDate(cursor.getDate()-1);
  while(activity[dateKey(cursor)]>0){streak++;cursor.setDate(cursor.getDate()-1);}
  // Encounters include unanswered questions; only submitted answers count here.
  const attempts=Number(stats.questionCount)||0;
  const mistakes=Number(stats.mistakes)||0;
  return {activity,streak,learned:new Set(stats.learnedWords||[]).size,accuracy:attempts?Math.round(Math.max(0,attempts-mistakes)/attempts*100):null};
}
function renderDashboard(){
  const target=document.getElementById('dashboardLibraries');if(!target)return;
  const query=(document.getElementById('librarySearch').value||'').trim().toLowerCase();
  const libraries=getCabinet().filter(lib=>!query||String(lib.name).toLowerCase().includes(query)||lib.words.some(w=>w.word.toLowerCase().includes(query))).sort((a,b)=>new Date(b.updatedAt||0)-new Date(a.updatedAt||0));
  target.replaceChildren();
  for(const [index,lib] of libraries.slice(0,3).entries()){
    const button=document.createElement('button');button.className='volumeRow';button.onclick=()=>openCabinetLibrary(lib.id);
    const cover=document.createElement('span');cover.className='miniCover cover'+index;cover.textContent=['L','A','C'][index];cover.setAttribute('aria-hidden','true');
    const copy=document.createElement('span');copy.className='volumeCopy';
    const title=document.createElement('strong');title.textContent=lib.name;
    const detail=document.createElement('small');const date=new Date(lib.updatedAt||lib.createdAt);detail.textContent=lib.words.length+' words · '+(Number.isNaN(date.getTime())?'Ready to study':'Updated '+date.toLocaleDateString('en-US',{month:'short',day:'numeric'}));
    copy.append(title,detail);const arrow=document.createElement('span');arrow.textContent='↗';button.append(cover,copy,arrow);target.append(button);
  }
  if(!libraries.length){const empty=document.createElement('div');empty.className='dashboardEmpty';empty.innerHTML=query?'No matching collections.':'<span>❧</span><strong>Your next chapter starts here.</strong><p>Generate a collection or import your favorite words.<br>Save it to find it on this shelf.</p>';target.append(empty);}
  const summary=dashboardSummary(globalStats);
  document.getElementById('dashboardStats').innerHTML=[[summary.learned,'Words learned'],[summary.streak,'Day streak'],[summary.accuracy===null?'—':summary.accuracy+'%','Practice accuracy']].map(([value,label])=>'<div><strong>'+value+'</strong><span>'+label+'</span></div>').join('');
  const heatmap=document.getElementById('dashboardHeatmap');heatmap.replaceChildren();
  const start=new Date();start.setHours(12,0,0,0);start.setDate(start.getDate()-83);
  for(let i=0;i<84;i++){const day=new Date(start);day.setDate(start.getDate()+i);const key=dateKey(day),count=Number(summary.activity[key])||0;const cell=document.createElement('span');cell.className='activityCell';cell.dataset.level=count===0?'0':String(Math.min(4,Math.ceil(count/3)));cell.title=key+' · '+count+' study activities';cell.setAttribute('aria-label',cell.title);heatmap.append(cell);}
  document.getElementById('studioDate').textContent=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
}
