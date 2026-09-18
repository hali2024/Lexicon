const fs=require('node:fs');
let s=fs.readFileSync('server.js','utf8').replace(/\r\n/g,'\n');
s=s.replace("const app = express();", "const { recordStudyEvents } = require('./study-events');\nconst { validateCoverImage } = require('./covers');\nconst { registerPronunciationRoutes } = require('./pronunciation');\nconst app = express();\nregisterPronunciationRoutes(app);");
s=s.replace("express.json({ limit: '500kb' })","express.json({ limit: '10mb' })");
const start=s.indexOf('async function recordStudyEvents('),end=s.indexOf('// ============================================================\n// DAILY RANKING',start);
s=s.slice(0,start)+s.slice(end);
// Lock the user before reading the snapshot: serializes simultaneous first saves too.
s=s.replace('      const previous =\n        await client.query(',"      await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[req.session.userId]);\n      const previous =\n        await client.query(");
s=s.replace('        words,\n\n        createdAt:',"        words,\n        coverImage:validateCoverImage(req.body.coverImage),\n\n        createdAt:");
const marker='// Admin: publish a new volume.';
s=s.replace(marker,`app.put('/api/admin/recommended-libraries/:id/cover',requireAdmin,async(req,res)=>{
  if(!requireDB(res))return;
  let coverImage;
  try{coverImage=validateCoverImage(req.body.coverImage);}catch(error){return res.status(400).json({error:error.message});}
  try{
    const libraries=await getRecommendedLibraries();
    const library=libraries.find(x=>String(x.id)===req.params.id);
    if(!library)return res.status(404).json({error:'Library not found.'});
    library.coverImage=coverImage;library.updatedAt=new Date().toISOString();
    await saveRecommendedLibraries(libraries);res.json({library});
  }catch{res.status(500).json({error:'Unable to save cover image.'});}
});

`+marker);
s=s.replace('    const incomingWords =',"    try{validateCoverImage(req.body.coverImage);}catch(error){return res.status(400).json({error:error.message});}\n    const incomingWords =");
s=s.replaceAll('"phonetic": "IPA pronunciation",','"phonetic": "IPA pronunciation",\n      "phoneticUK": "British English IPA pronunciation",\n      "phoneticUS": "American English IPA pronunciation",');
s=s.replaceAll('The "phonetic" field is REQUIRED','The "phoneticUK" and "phoneticUS" fields must contain their respective regional IPA transcriptions. The "phonetic" field is REQUIRED');
s=s.replace('        phonetic:\n',"        phoneticUK:String(item?.phoneticUK||'').trim(),\n        phoneticUS:String(item?.phoneticUS||'').trim(),\n        phonetic:\n");
s=s.replace('    phonetic:\n',"    phoneticUK:String(word.phoneticUK||word.phonetic_uk||'').trim(),\n    phoneticUS:String(word.phoneticUS||word.phonetic_us||'').trim(),\n    phonetic:\n");
// The previous replacement must only apply to the recommended-word cleaner.
s=s.replace("        phoneticUK:String(word.phoneticUK||word.phonetic_uk||'').trim(),\n    phoneticUS:String(word.phoneticUS||word.phonetic_us||'').trim(),\n    phonetic:\n",'        phonetic:\n');
fs.writeFileSync('server.js',s);
s=fs.readFileSync('daily-report.js','utf8').replace(/\r\n/g,'\n');
s=s.replace("const crypto = require('crypto');","const crypto = require('crypto');\nconst {summarizeDay}=require('./study-events');");
s=s.replace("process.env.REPORT_TIMEZONE || 'Asia/Tokyo'","process.env.REPORT_TIMEZONE || 'Asia/Shanghai'");
const a=s.indexOf('  let practiceCount = 0;',s.indexOf('async function getStats(')),b=s.indexOf('\n}\n\nasync function claimReport',a);
s=s.slice(0,a)+`  const snapshot=await pool.query('SELECT global_stats FROM user_data WHERE user_id=$1',[userId]);
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:REPORT_TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(startTime));
  const part=type=>parts.find(p=>p.type===type).value;
  const day=part('year')+'-'+part('month')+'-'+part('day');
  return summarizeDay(result.rows,snapshot.rows[0]?.global_stats||{},day);`+s.slice(b);
fs.writeFileSync('daily-report.js',s);
