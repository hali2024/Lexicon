const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parsePronunciations}=require('../pronunciation');

test('maps Dictionary API Australian audio to the US pronunciation slot',()=>{
  const result=parsePronunciations([{phonetics:[
    {text:'/həˈləʊ/',audio:'https://api.dictionaryapi.dev/media/pronunciations/en/hello-au.mp3'},
    {text:'/həˈləʊ/',audio:'https://api.dictionaryapi.dev/media/pronunciations/en/hello-uk.mp3'}
  ]}]);
  assert.equal(result.audioUS,'https://api.dictionaryapi.dev/media/pronunciations/en/hello-au.mp3');
  assert.equal(result.audioUK,'https://api.dictionaryapi.dev/media/pronunciations/en/hello-uk.mp3');
});