const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {validateGeneration,selectTopicWords,alignVocabulary}=require('../vocabulary');
const html=fs.readFileSync('public/index.html','utf8');
const app=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
function readFunction(name){
  const start=html.indexOf('function '+name+'(');
  assert.ok(start>=0,name);
  const end=html.indexOf('\nfunction ',start+1);
  return html.slice(start,end);
}
const context=vm.createContext({showToast:()=>{}});
for(const name of ['normalizeWordKey','normalizeWordRecord','parseCSV','dateKey'])vm.runInContext(readFunction(name),context);
vm.runInContext(fs.readFileSync('public/studio.js','utf8'),context);
test('all inline and external application scripts parse',()=>{
  for(const source of app)new vm.Script(source);
  new vm.Script(fs.readFileSync('public/studio.js','utf8'));
});
test('CSV preserves quoted commas, escaped quotes, line breaks and camelCase part of speech',()=>{
  const result=context.parseCSV('\uFEFFword,partOfSpeech,definition,example1\r\ncurious,adjective,"eager, to learn","She said ""why"".\nThen read."');
  assert.equal(result.length,1);assert.equal(result[0].partOfSpeech,'adjective');
  assert.equal(result[0].definition,'eager, to learn');assert.equal(result[0].examples[0],'She said "why".\nThen read.');
});
test('CSV removes case-insensitive duplicates and rejects incomplete quoted fields',()=>{
  assert.equal(context.parseCSV('word,definition\nSeek,look for\nseek,search').length,1);
  assert.equal(context.parseCSV('word,definition\nseek,"look').length,0);
  assert.equal(context.parseCSV('seek,look for,Seek knowledge.')[0].example,'Seek knowledge.');
});
test('dashboard counts consecutive days, includes yesterday and ignores gaps',()=>{
  const now=new Date(2026,8,18,12);
  const stats={daily:{'2026-09-16':3,'2026-09-17':2},learnedWords:['a','a','b'],questionCount:4,mistakes:1,wordStats:{a:{practised:5,mistakes:1}}};
  const summary=context.dashboardSummary(stats,now);
  assert.equal(summary.streak,2);assert.equal(summary.learned,2);assert.equal(summary.accuracy,75);
  assert.equal(context.dashboardSummary({...stats,daily:{'2026-09-16':1}},now).streak,0);
  assert.equal(context.dashboardSummary({},now).accuracy,null);
});
test('review-only practice appears in activity without inventing learned words',()=>{
  const result=context.dashboardSummary({dailyWordPractice:{'2026-09-18':{seek:2}}},new Date(2026,8,18,12));
  assert.equal(result.streak,1);assert.equal(result.learned,0);assert.equal(result.activity['2026-09-18'],2);
});
test('generation validates topic filters and legacy exact word requests',()=>{
  assert.equal(validateGeneration({prompt:'Ecology',count:20,difficulty:'B1-B2',goal:'academic'}).count,20);
  assert.deepEqual(validateGeneration({words:[' seek ']}),{words:['seek']});
  for(const body of [{},{words:['a','A']},{words:[{}]},{prompt:'x',count:999},{prompt:'x',difficulty:'invalid'},null])assert.throws(()=>validateGeneration(body));
});
test('reordered AI entries retain their own definitions instead of being relabeled',()=>{
  const entries=[{word:'find',definition:'discover'},{word:'seek',definition:'look for'}];
  assert.equal(alignVocabulary(entries,['seek','find'])[0].definition,'look for');
  assert.throws(()=>alignVocabulary(entries,['seek','become']),/do not match/);
});
test('topic selection passes filters and checks duplicate/incomplete AI output',async()=>{
  const old=process.env.DEEPSEEK_API_KEY;process.env.DEEPSEEK_API_KEY='test-only';
  try{
    const options=validateGeneration({prompt:'Literature'});
    const words=Array.from({length:10},(_,i)=>'word'+i);
    const fetcher=async(url,init)=>{assert.equal(JSON.parse(JSON.parse(init.body).messages[1].content).prompt,'Literature');return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({words})}}]})};};
    assert.deepEqual(await selectTopicWords(options,fetcher),words);
    await assert.rejects(()=>selectTopicWords(options,async()=>({ok:true,json:async()=>({choices:[{message:{content:'{"words":["same","same"]}'}}]})})),/duplicate/);
  }finally{if(old===undefined)delete process.env.DEEPSEEK_API_KEY;else process.env.DEEPSEEK_API_KEY=old;}
});
