function validateCoverImage(value){
  if(value===''||value==null)return '';
  if(typeof value!=='string')throw new Error('Invalid cover image.');
  const match=value.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if(!match||value.length>411000)throw new Error('Choose a PNG, JPEG or WebP image no larger than 300 KB.');
  const bytes=Buffer.from(match[2],'base64');
  const valid=match[1]==='png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):
    match[1]==='jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:
      bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
  if(!valid||bytes.length>307200)throw new Error('Invalid cover image.');
  return value;
}
module.exports={validateCoverImage};
