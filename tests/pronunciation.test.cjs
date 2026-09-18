const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parsePronunciations,registerPronunciationRoutes}=require('../pronunciation');

test('maps Dictionary API Australian audio to the US pronunciation slot',()=>{
  const result=parsePronunciations([{phonetics:[
    {text:'/həˈləʊ/',audio:'https://api.dictionaryapi.dev/media/pronunciations/en/hello-au.mp3'},
    {text:'/həˈləʊ/',audio:'https://api.dictionaryapi.dev/media/pronunciations/en/hello-uk.mp3'}
  ]}]);
  assert.equal(result.audioUS,'https://api.dictionaryapi.dev/media/pronunciations/en/hello-au.mp3');
  assert.equal(result.audioUK,'https://api.dictionaryapi.dev/media/pronunciations/en/hello-uk.mp3');
});

test('serves natural TTS audio through the pronunciation proxy',async()=>{
  const routes=new Map();
  registerPronunciationRoutes({get:(path,handler)=>routes.set(path,handler)});
  const originalFetch=global.fetch;
  let requestedUrl='';
  global.fetch=async url=>{
    requestedUrl=url;
    return {ok:true,headers:{get:()=> 'audio/mpeg'},arrayBuffer:async()=>Buffer.from('mp3')};
  };
  const response={statusCode:200,headers:{},set(values){Object.assign(this.headers,values);return this;},send(value){this.body=value;return this;},end(){return this;}};
  try{
    await routes.get('/api/pronunciation/tts')({query:{word:'test-natural-voice',accent:'US'}},response);
    assert.match(requestedUrl,/translate\.google\.com\/translate_tts/);
    assert.equal(response.headers['Content-Type'],'audio/mpeg');
    assert.equal(response.body.toString(),'mp3');
  }finally{global.fetch=originalFetch;}
});