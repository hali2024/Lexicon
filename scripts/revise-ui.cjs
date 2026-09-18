const fs=require('node:fs');
const path='public/index.html';
let s=fs.readFileSync(path,'utf8').replace(/\r\n/g,'\n');
function replace(a,b){if(!s.includes(a))throw new Error('Missing '+a.slice(0,90));s=s.replace(a,b);}
replace(s.match(/    <nav class="homeTools"[\s\S]*?<\/nav>/)[0],'');
replace('const items=list.map(a=>','const items=list.slice(1).map(a=>');
s=s.replaceAll('  recordWordEncounter(id);','');
replace('function recordQuestion(){','function recordQuestion(){\n  recordWordEncounter(state.current.id);');
replace('ws.practised=(ws.practised||0)+1;','ws.practised=(ws.practised||0)+1;\n  ws.answered=(ws.answered||0)+1;');
replace('    learnedWords:[],','    statsVersion:2,\n    dailyAnswers:{},\n    dailySpelledWords:{},\n    learnedWords:[],');
replace('  saveGlobalStatsOnly();\n}\n\nfunction recordLearnedWord',`  if(!globalStats.dailyAnswers)globalStats.dailyAnswers={};
  if(!globalStats.dailyAnswers[day])globalStats.dailyAnswers[day]={};
  globalStats.dailyAnswers[day][wordKey]=(globalStats.dailyAnswers[day][wordKey]||0)+1;
  saveGlobalStatsOnly();
}

function recordLearnedWord`);
replace('  const wordKey=normalizeWordKey(state?.words?.[id]?.word);\n  if(!wordKey)return;\n  if(!Array.isArray(globalStats.spelledWords))',`  const wordKey=normalizeWordKey(state?.words?.[id]?.word);
  if(!wordKey)return;
  if(!globalStats.dailySpelledWords)globalStats.dailySpelledWords={};
  const day=todayKey();
  if(!globalStats.dailySpelledWords[day])globalStats.dailySpelledWords[day]=[];
  if(!globalStats.dailySpelledWords[day].includes(wordKey))globalStats.dailySpelledWords[day].push(wordKey);
  if(!Array.isArray(globalStats.spelledWords))`);
replace('    globalStats={\n      learnedWords:', '    globalStats={\n      statsVersion:2,\n      dailyAnswers:parsed.dailyAnswers||{},\n      dailySpelledWords:parsed.dailySpelledWords||{},\n      learnedWords:');
replace('  touchStudyTime();\n  updateTopNotices();','  updateTopNotices();');
replace("document.addEventListener('visibilitychange',()=>{if(document.hidden)flushStudyTime();else if(state)touchStudyTime();});", "document.addEventListener('visibilitychange',()=>{if(document.hidden){flushStudyTime();studyClockStartedAt=0;if(accountMode==='account')syncAccountDataNow();}});");
replace("      credentials:'include',\n      body:JSON.stringify(payload)","      credentials:'include',\n      keepalive:true,\n      body:JSON.stringify(payload)");
replace('syncTimer=setTimeout(()=>{syncAccountDataNow();},60);','syncTimer=setTimeout(()=>{syncAccountDataNow();},3000);');
replace('<div class="cabinetActions">','<progress class="libraryProgress" max="100" value="${p.percent}" aria-label="${LANG===\'zh\'?\'学习进度\':\'Learning progress\'}">${p.percent}%</progress>\n      <div class="cabinetActions">');
replace('<div class="bookCover"><span>${escapeHTML(lib.name)}</span></div>','<div class="bookCover">${lib.coverImage?`<img src="${escapeHTML(lib.coverImage)}" alt="${escapeHTML(lib.name)}" loading="lazy">`:`<span>${escapeHTML(lib.name)}</span>`}</div>');
replace('onclick="downloadRecommendedLibrary(\'${escapeHTML(lib.id)}\')">${LANG===\'zh\'?\'收入词库\':\'Add to Cabinet\'}', 'onclick="downloadRecommendedLibrary(\'${escapeHTML(lib.id)}\')" ${getCabinet().some(x=>String(x.sourceRecommendedId)===String(lib.id))?\'disabled\':\'\'}>${getCabinet().some(x=>String(x.sourceRecommendedId)===String(lib.id))?(LANG===\'zh\'?\'已添加\':\'Added\'):(LANG===\'zh\'?\'添加到词库\':\'Add to Cabinet\')}');
replace('setCabinet([...cabinet,lib]);renderCabinet();showToast','setCabinet([...cabinet,lib]);renderCabinet();renderRecommendedLibraries();showToast');
replace("const existing=cabinet.find(x=>x.sourceRecommendedId===src.id);","const existing=cabinet.find(x=>String(x.sourceRecommendedId)===String(src.id));");
replace('<input id="recommendedNameInput"','<label class="coverUpload">Cover image (optional)<input id="recommendedCoverInput" type="file" accept="image/png,image/jpeg,image/webp"></label>\n        <input id="recommendedNameInput"');
replace("    const r=await fetch('/api/admin/recommended-libraries',{", "    const coverImage=await readCoverImage(document.getElementById('recommendedCoverInput').files?.[0]);\n    const r=await fetch('/api/admin/recommended-libraries',{");
replace('JSON.stringify({name,description,words})','JSON.stringify({name,description,words,coverImage})');
replace("document.getElementById('recommendedNameInput').value='';", "document.getElementById('recommendedCoverInput').value='';document.getElementById('recommendedNameInput').value='';");
replace("${siteStatus.isAdmin?`<button class=\"ghost\"", "${siteStatus.isAdmin?`<label class=\"coverUpload\">${LANG==='zh'?'更换封面':'Change cover'}<input type=\"file\" accept=\"image/png,image/jpeg,image/webp\" onchange=\"updateRecommendedCover('${escapeHTML(lib.id)}',this)\"></label><button class=\"ghost\"");
s=s.replaceAll("const recent=days.slice(-14);", "const recent=recentActivityDays(globalStats);");
s=s.replaceAll("Array.isArray(v)?v.length:0", "Number(v)||0");
s=s.replaceAll('${v.length} words','${v} ${LANG===\'zh\'?\'次练习\':\'answers\'}').replaceAll('Math.max(5,Math.round(v.length/max*108))','(v?Math.max(5,Math.round(v/max*108)):2)');
replace('const wordsEncountered=new Set(Object.keys(globalStats.wordStats||{})).size;','const wordsEncountered=studiedWordKeys(globalStats).size;');
s=s.replaceAll('allWords=new Set(Object.keys(globalStats.wordStats||{}))','allWords=studiedWordKeys(globalStats)');
replace('你的学习轨迹与词汇掌握情况。','查看学习记录和词汇掌握情况。');
s=s.replace(/^  <div class="progressLists">.*$/m,'  </div>`;');
s=s.replace(/^  <div class="rankingSection"><div class="rankingTitle">\$\{LANG==='zh'\?'最.*\r?\n/gm,'');
s=s.replace(/^  <div class="rankingSection"><div class="rankingTitle">\$\{LANG==='zh'\?'年鉴'.*\r?\n/gm,'');
s=s.replaceAll('你的完整学习档案：统计、活动、年鉴与今日排行。','查看学习统计、近期活动和今日排行。').replaceAll('Your complete learning record: statistics, activity, the almanac, and today’s ranking.','Your learning statistics, recent activity, and today’s ranking.');
s=s.replaceAll('研习','学习').replaceAll('留待日后学习的词书。','管理已保存的词书。').replaceAll('陈列经遴选的主题词书。','选择感兴趣的推荐词书。').replaceAll("wordsEncountered:'遇见词汇'","wordsEncountered:'已练习单词'").replaceAll("wordsEncountered:'Words Encountered'","wordsEncountered:'Words Practised'");
// Keep accent fields through imports, edits, and account synchronization.
replace("phonetic:String(w?.phonetic||w?.ipa||'').trim(),", "phonetic:String(w?.phonetic||w?.ipa||'').trim(),\n    phoneticUK:String(w?.phoneticUK||w?.phonetic_uk||'').trim(),\n    phoneticUS:String(w?.phoneticUS||w?.phonetic_us||'').trim(),");
replace("phonetic:ph>=0?(r[ph]||'').trim():'',", "phonetic:ph>=0?(r[ph]||'').trim():'',\n      phoneticUK:idx('phonetic_uk')>=0?r[idx('phonetic_uk')]:'',\n      phoneticUS:idx('phonetic_us')>=0?r[idx('phonetic_us')]:'',");
const speechStart=s.indexOf('function speak('), speechEnd=s.indexOf('/* ---------- recognition',speechStart);
s=s.slice(0,speechStart)+`function speak(text,accent='US'){
  if(!text)return;
  accent=accent==='UK'?'UK':'US';
  const value=String(text).trim(),requestId=++speechRequestId;
  if(speechAudio){speechAudio.pause();speechAudio=null;}
  const fallback=()=>{
    if(requestId!==speechRequestId)return;
    if(!window.speechSynthesis){showToast(LANG==='zh'?'发音暂时不可用，请稍后重试。':'Pronunciation unavailable. Please try again.');return;}
    speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(value);
    utterance.lang=accent==='UK'?'en-GB':'en-US';
    const voice=speechSynthesis.getVoices().find(v=>v.lang.replace('_','-')===utterance.lang);
    if(voice)utterance.voice=voice;
    utterance.onerror=()=>showToast(LANG==='zh'?'发音播放失败，请检查设备语音设置。':'Unable to play pronunciation. Check your device speech settings.');
    speechSynthesis.speak(utterance);
  };
  window.speechSynthesis?.cancel();
  try{
    const audio=new Audio('/api/pronunciation/audio?word='+encodeURIComponent(value)+'&accent='+accent);
    speechAudio=audio;audio.onerror=fallback;
    audio.play().catch(fallback);
  }catch{fallback();}
}
function safeJSString(s){return String(s).replace(/\\\\/g,'\\\\\\\\').replace(/'/g,"\\\\'").replace(/\\r?\\n/g,' ');}
function speakerBtn(word){
  const safe=escapeHTML(JSON.stringify(String(word)));
  return ['UK','US'].map(accent=>\`<button type="button" class="speaker accentSpeaker" title="\${LANG==='zh'?(accent==='UK'?'英式发音':'美式发音'):accent+' pronunciation'}" onclick="event.stopPropagation();speak(\${safe},'\${accent}')">\${LANG==='zh'?(accent==='UK'?'英':'美'):accent} 🔈</button>\`).join('');
}
function phoneticMarkup(w){
  return '<span class="phonetic" data-phonetic-word="'+escapeHTML(w.word)+'">'+['UK','US'].map(a=>(LANG==='zh'?(a==='UK'?'英':'美'):a)+' '+escapeHTML(w['phonetic'+a]||(LANG==='zh'?'暂缺':'unavailable'))).join(' · ')+'</span>';
}

`+s.slice(speechEnd);
replace("<span class=\"phonetic\">${w.phonetic?escapeHTML(w.phonetic):'No phonetic transcription available.'}</span>", '${phoneticMarkup(w)}');
replace("${w.phonetic?`<span class=\"phonetic\">${escapeHTML(w.phonetic)}</span>`:''}", '${phoneticMarkup(w)}');
replace("${w.phonetic||w.cefr?`<div class=\"wordMeta\">", "${true?`<div class=\"wordMeta\">");
s=s.replaceAll('<div class="word">${escapeHTML(w.word)}</div>${speakerBtn(w.word)}','<div class="word">${escapeHTML(w.word)}</div>${speakerBtn(w.word)}${phoneticMarkup(w)}');
// A separate module holds presentation helpers and the restored pet.
replace('<script src="/studio.js"></script>','<script src="/studio.js"></script>\n<script src="/enhancements.js"></script>');
fs.writeFileSync(path,s);
