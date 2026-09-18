// Daily maps retain the day of learning even when an offline snapshot syncs later.
const REPORT_TIMEZONE=process.env.REPORT_TIMEZONE||'Asia/Shanghai';
const count=value=>Math.min(100000,Math.max(0,Math.floor(Number(value)||0)));
function dailyEventCounts(stats={}){
  const events=new Map();
  function put(day,type,word,value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!count(value))return;
    events.set(JSON.stringify([day,type,word]),count(value));
  }
  for(const [day,words] of Object.entries(stats.dailyAnswers||stats.dailyWordPractice||{}))
    for(const [word,value] of Object.entries(words||{}))put(day,'practice',word,value);
  for(const [day,words] of Object.entries(stats.dailyWordMistakes||{}))
    for(const [word,value] of Object.entries(words||{}))put(day,'mistake',word,value);
  for(const [field,type] of [['dailyWords','learned'],['dailySpelledWords','spelling']])
    for(const [day,words] of Object.entries(stats[field]||{}))
      for(const word of new Set(Array.isArray(words)?words:[]))put(day,type,word,1);
  for(const [day,value] of Object.entries(stats.dailySpellingMastery||{}))put(day,'spelling_mastery',null,value);
  return events;
}
async function recordStudyEvents(client,userId,oldStats,newStats){
  const oldCounts=dailyEventCounts(oldStats),newCounts=dailyEventCounts(newStats);
  for(const [key,value] of newCounts){
    const delta=value-(oldCounts.get(key)||0);if(delta<=0)continue;
    const [day,type,word]=JSON.parse(key);
    await client.query(`INSERT INTO study_events(user_id,event_type,word,created_at)
      SELECT $1,$2,$3,($4::date + TIME '12:00') AT TIME ZONE $5
      FROM generate_series(1,$6::int)`,[userId,type,word,day,REPORT_TIMEZONE,delta]);
  }
}
function summarizeDay(rows,stats,day){
  const counts=new Map();
  for(const row of rows){counts.set(JSON.stringify([day,row.event_type,row.word]),count(row.count));}
  // Older servers skipped the first snapshot. Recover that day's stored counts,
  // taking maxima rather than adding snapshots to their derived events.
  for(const [key,value] of dailyEventCounts(stats)){
    if(JSON.parse(key)[0]===day)counts.set(key,Math.max(counts.get(key)||0,value));
  }
  const result={practiceCount:0,learnedCount:0,spellingCount:0,mistakeCount:0,uniqueWords:0,topPractice:[]};
  const fields={practice:'practiceCount',learned:'learnedCount',spelling:'spellingCount',mistake:'mistakeCount'};
  const words=new Set();
  for(const [key,value] of counts){
    const [,type,word]=JSON.parse(key);if(!fields[type])continue;
    result[fields[type]]+=value;if(word)words.add(word);
    if(type==='practice'&&word)result.topPractice.push({word,count:value});
  }
  result.uniqueWords=words.size;
  result.topPractice.sort((a,b)=>b.count-a.count||a.word.localeCompare(b.word));
  result.topPractice=result.topPractice.slice(0,10);
  return result;
}
module.exports={dailyEventCounts,recordStudyEvents,summarizeDay};
