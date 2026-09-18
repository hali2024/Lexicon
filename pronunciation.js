// Dictionary entries expose regional audio filenames alongside their IPA text.
const cache=new Map();
const ttsCache=new Map();
function parsePronunciations(entries){
  const result={phoneticUK:'',phoneticUS:'',audioUK:'',audioUS:''};
  for(const entry of Array.isArray(entries)?entries:[]){
    for(const p of entry.phonetics||[]){
      const url=String(p.audio||'');
      const accent=/(?:-|_)(?:us|au)(?:[_.-]|$)/i.test(url)?'US':/(?:-|_)(?:uk|gb)(?:[_.-]|$)/i.test(url)?'UK':null;
      if(!accent)continue;
      if(p.text&&!result['phonetic'+accent])result['phonetic'+accent]=String(p.text);
      if(/^https:\/\/api\.dictionaryapi\.dev\//.test(url))result['audio'+accent]=url;
    }
  }
  return result;
}
async function lookupPronunciation(word,fetcher=fetch){
  const key=word.toLowerCase(),cached=cache.get(key);
  if(cached&&cached.expires>Date.now())return cached.value;
  const response=await fetcher('https://api.dictionaryapi.dev/api/v2/entries/en/'+encodeURIComponent(key),{signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error('Dictionary unavailable');
  const result=parsePronunciations(await response.json());
  if(cache.size>=1000)cache.delete(cache.keys().next().value);
  cache.set(key,{value:result,expires:Date.now()+86400000});
  return result;
}
function registerPronunciationRoutes(app){
  function validate(req,res){
    const word=String(req.query.word||'').trim();
    if(!/^[A-Za-z][A-Za-z '’-]{0,99}$/.test(word)){res.status(400).json({error:'Enter a valid English word.'});return null;}
    return word;
  }
  app.get('/api/pronunciation',async(req,res)=>{
    const word=validate(req,res);if(!word)return;
    try{res.set('Cache-Control','public, max-age=86400').json(await lookupPronunciation(word));}
    catch{res.status(502).json({error:'Pronunciation temporarily unavailable.'});}
  });
  app.get('/api/pronunciation/tts',async(req,res)=>{
    const word=validate(req,res);if(!word)return;
    const accent=req.query.accent==='UK'?'UK':'US';
    const key=accent+':'+word.toLowerCase();
    try{
      let buffer=ttsCache.get(key);
      if(!buffer){
        const voice=accent==='UK'?'en-GB':'en-US';
        const url='https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl='+voice+'&q='+encodeURIComponent(word);
        const audio=await fetch(url,{signal:AbortSignal.timeout(6000),headers:{'User-Agent':'Mozilla/5.0'}});
        if(!audio.ok)throw new Error('TTS unavailable');
        buffer=Buffer.from(await audio.arrayBuffer());
        if(!buffer.length||buffer.length>2000000)throw new Error('TTS audio too large');
        if(ttsCache.size>=1000)ttsCache.delete(ttsCache.keys().next().value);
        ttsCache.set(key,buffer);
      }
      res.set({'Content-Type':'audio/mpeg','Cache-Control':'public, max-age=86400'}).send(buffer);
    }catch{res.status(502).end();}
  });
  app.get('/api/pronunciation/audio',async(req,res)=>{
    const word=validate(req,res);if(!word)return;
    const accent=req.query.accent==='UK'?'UK':'US';
    try{
      const data=await lookupPronunciation(word);
      if(!data['audio'+accent])return res.status(404).end();
      const audio=await fetch(data['audio'+accent],{signal:AbortSignal.timeout(8000)});
      if(!audio.ok)throw new Error('Audio unavailable');
      const buffer=Buffer.from(await audio.arrayBuffer());
      if(buffer.length>2000000)throw new Error('Audio too large');
      res.set({'Content-Type':audio.headers.get('content-type')||'audio/mpeg','Cache-Control':'public, max-age=86400'}).send(buffer);
    }catch{res.status(502).end();}
  });
}
module.exports={parsePronunciations,lookupPronunciation,registerPronunciationRoutes};
