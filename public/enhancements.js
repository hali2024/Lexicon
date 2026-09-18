/* Shared UI helpers; loading a library never changes learning statistics. */
function studiedWordKeys(stats){
  const words=new Set([...(stats.learnedWords||[]),...(stats.spelledWords||[])]);
  for(const [word,record] of Object.entries(stats.wordStats||{})){
    if(Number(record.answered)>0||Number(record.mistakes)>0)words.add(word);
  }
  return words;
}
function recentActivityDays(stats,now=new Date()){
  const activity=dashboardSummary(stats,now).activity;
  return Array.from({length:14},(_,i)=>{
    const day=new Date(now);day.setHours(12,0,0,0);day.setDate(day.getDate()-13+i);
    const key=dateKey(day);return [key,Number(activity[key])||0];
  });
}
async function readCoverImage(file){
  if(!file)return '';
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>300*1024){
    throw new Error(LANG==='zh'?'请选择不超过 300 KB 的 PNG、JPEG 或 WebP 图片。':'Choose a PNG, JPEG or WebP image no larger than 300 KB.');
  }
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();reader.onerror=()=>reject(new Error(LANG==='zh'?'无法读取图片。':'Unable to read image.'));
    reader.onload=()=>resolve(reader.result);reader.readAsDataURL(file);
  });
}
async function updateRecommendedCover(id,input){
  try{
    if(!input.files?.[0])return;
    const coverImage=await readCoverImage(input.files[0]);
    await apiJSON('/api/admin/recommended-libraries/'+encodeURIComponent(id)+'/cover',{
      method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({coverImage})
    });
    await loadRecommendedLibraries();
  }catch(error){showToast(error.message);}finally{input.value='';}
}
const pronunciationRequests=new Map();
function hydratePronunciations(){
  document.querySelectorAll('[data-phonetic-word]').forEach(el=>{
    const word=el.dataset.phoneticWord;
    if(el.dataset.loaded)return;
    el.dataset.loaded='true';
    const known=state?.words?.find(w=>w.word===word);
    if(known?.phoneticUK&&known?.phoneticUS)return;
    if(!pronunciationRequests.has(word)){
      pronunciationRequests.set(word,fetch('/api/pronunciation?word='+encodeURIComponent(word))
        .then(r=>r.ok?r.json():null).catch(()=>null));
    }
    pronunciationRequests.get(word).then(data=>{
      if(!data||!el.isConnected)return;
      for(const accent of ['UK','US'])if(data['phonetic'+accent]&&known)known['phonetic'+accent]=data['phonetic'+accent];
      el.textContent=['UK','US'].map(a=>(LANG==='zh'?(a==='UK'?'英':'美'):a)+' '+(known?.['phonetic'+a]||data['phonetic'+a]||(LANG==='zh'?'暂缺':'unavailable'))).join(' · ');
    });
  });
  document.querySelectorAll('.word,.wordPill').forEach(el=>{
    if(el.dataset.speaks)return;
    el.dataset.speaks='true';el.tabIndex=0;el.setAttribute('role','button');
    el.setAttribute('aria-label',(LANG==='zh'?'播放发音：':'Play pronunciation: ')+el.textContent);
    const play=()=>speak(el.textContent.trim());
    el.addEventListener('click',play);
    el.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();play();}});
  });
}
function bootWhiteCat(){
  const script=document.createElement('script');
  script.src='https://cdn.jsdelivr.net/npm/live2d-widget@3.1.4/lib/L2Dwidget.min.js';
  script.onload=()=>{
    if(!window.L2Dwidget)return;
    window.L2Dwidget.init({
      model:{jsonPath:'https://cdn.jsdelivr.net/npm/live2d-widget-model-tororo@1.0.5/assets/tororo.model.json'},
      display:{position:'right',width:96,height:104,hOffset:0,vOffset:0},
      mobile:{show:true,scale:0.85},react:{opacityDefault:1,opacityOnHover:1},
      dialog:{enable:false}
    });
  };
  document.body.append(script);
}
document.addEventListener('DOMContentLoaded',()=>{
  const observer=new MutationObserver(hydratePronunciations);
  observer.observe(document.getElementById('stage'),{childList:true,subtree:true});
  observer.observe(document.getElementById('cabinetContent'),{childList:true,subtree:true});
  hydratePronunciations();bootWhiteCat();
});
