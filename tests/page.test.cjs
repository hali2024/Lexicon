const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('public/index.html','utf8');
function page(){
  const dom=new JSDOM(html,{url:'http://localhost:3000',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;
  w.fetch=async()=>({ok:true,json:async()=>({maintenance:{enabled:false},announcements:[]})});
  w.scrollTo=()=>{};w.requestAnimationFrame=()=>0;
  const source=fs.readFileSync('public/studio.js','utf8')+'\n'+[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match=>match[1]).join('\n');
  try{w.eval(source);}catch(error){dom.window.close();throw error;}
  return dom;
}
test('guest page initializes with real empty states and accessible import tabs',()=>{
  const dom=page();try{
    const w=dom.window,d=w.document;
    assert.equal(d.getElementById('homeArea').classList.contains('hidden'),false);
    assert.match(d.getElementById('dashboardLibraries').textContent,/next chapter/);
    assert.equal(d.querySelectorAll('.activityCell').length,84);
    assert.equal(d.documentElement.classList.contains('theme-dark'),true);
    w.selectStudioTab('csv');
    assert.equal(d.getElementById('csvTab').getAttribute('aria-selected'),'true');
    assert.equal(d.getElementById('aiPane').classList.contains('hidden'),true);
    w.selectStudioTab('ai');assert.equal(d.getElementById('csvPane').classList.contains('hidden'),true);
  }finally{dom.window.close();}
});
test('CSV can be saved, searched, studied and returned to the dashboard',()=>{
  const dom=page();try{
    const w=dom.window,d=w.document;
    d.getElementById('csvInput').value='word,definition\nseek,look for\nfind,discover';
    w.loadCSV();w.chooseSaveLibrary(true);
    d.getElementById('libraryNameInput').value='Curiosity';w.confirmLibraryName();w.choosePracticeNow(false);
    assert.match(d.getElementById('dashboardLibraries').textContent,/Curiosity/);
    assert.equal(w.getCabinet()[0].words.length,2);
    w.openCabinetSearch();d.getElementById('librarySearch').value='seek';w.renderDashboard();
    assert.equal(d.querySelectorAll('.volumeRow').length,1);
    w.openCabinetLibrary(w.getCabinet()[0].id);
    assert.equal(d.getElementById('appArea').classList.contains('hidden'),false);
    w.goToStudio();assert.equal(d.getElementById('homeArea').classList.contains('hidden'),false);
    assert.ok(w.getCabinet()[0].progress);
  }finally{dom.window.close();}
});
test('AI topic controls reach the API and failures restore the generate button',async()=>{
  const dom=page();try{
    const w=dom.window,d=w.document;
    d.getElementById('aiWordsInput').value='Ecology';d.getElementById('wordCount').value='20';
    d.getElementById('wordDifficulty').value='B1-B2';d.getElementById('learningGoal').value='academic';
    w.fetch=async(url,init)=>{const body=JSON.parse(init.body);assert.equal(body.prompt,'Ecology');assert.equal(body.count,20);assert.equal(body.difficulty,'B1-B2');assert.equal(body.goal,'academic');return {ok:false,json:async()=>({error:'Test provider unavailable'})};};
    await w.generateWithAI();
    assert.equal(d.getElementById('generateAIButton').disabled,false);
    assert.match(d.getElementById('aiStatus').textContent,/Test provider unavailable/);
  }finally{dom.window.close();}
});
