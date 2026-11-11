import sharp from 'sharp';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const out='docs/qa/demo/nang-page-2026-10-23';
const sources=[
 ['nang-blue-moon-17','blue-moon-17.png','16U9iuZuwTWXw8hqGqcqp9OKhnR_m0QK3','Blue Moon','1lh0lRA5dLEqNnIlJsADanj0GthLQPMQf',23],
 ['nang-blue-moon-14','blue-moon-14.png','10WSAdJ87KpzjGLr0bucHaoH068Djl-LK','Blue Moon','1lh0lRA5dLEqNnIlJsADanj0GthLQPMQf',23],
 ['nang-blue-moon-18','blue-moon-18.png','1fa3OhAg0JPyWzSSSSM-0ES4jSYs8GGKm','Blue Moon','1lh0lRA5dLEqNnIlJsADanj0GthLQPMQf',23],
 ['nang-yellow-7','yellow-submarine-7.png','1kHzZ4ZVumwAMysYOBQfwMY8GVKPqMY32','Yellow Submarine','1ExyqVrGs1azUqoX_gHyh15lxSYQw4kVC',20],
 ['nang-yellow-4','yellow-submarine-4.png','1n7W30NIgqEVugF11hczm4jKtxUp7e6Bk','Yellow Submarine','1ExyqVrGs1azUqoX_gHyh15lxSYQw4kVC',20,'nang-2026-10-22'],
 ['nang-pale-4','pale-blue-eyes-4.png','105G-i5K0nP5eQNhxrSLNcm7c5qciiwiM','Pale Blue Eyes','1U5oDedfTCielLny0PnMpzQfshimsYhAz',21,'nang-2026-10-22'],
 ['bare-han-ground-26','bare-han-ground-26.jpg','1Z4vuWjXfnmulrXzy9cfMm_raSCjlehN-','Bare Hàn Ground','1qX1rKDTZSbS0c_KdGh3tbSk_gf8lugnb',16],
];
const mp='public/dev-client-media/manifest.json',m=JSON.parse(readFileSync(mp));
writeFileSync(out+'/manifest-before.json',readFileSync(mp),{flag:'wx'});
const evidence=[];
for(const [key,file,driveFileId,room,folderId,row,dir='nang-page-2026-10-23'] of sources){
 if(m.photos[key]) throw Error('Existing key '+key);
 const source=`.local-media/client-photos/${dir}/${file}`,bytes=readFileSync(source),meta=await sharp(bytes).metadata();
 const sha256=createHash('sha256').update(bytes).digest('hex'),variants=[];
 mkdirSync(`public/dev-client-media/${key}`,{recursive:true});
 for(const width of [480,800,1200,1600])for(const format of ['avif','webp','jpeg']){
  const src=`/dev-client-media/${key}/${width}.${format==='jpeg'?'jpg':format}`;
  if(existsSync('public'+src))throw Error('Existing '+src);
  const {data,info}=await sharp(bytes).rotate().resize({width,withoutEnlargement:true}).toColourspace('srgb').toFormat(format,{quality:format==='avif'?55:82}).toBuffer({resolveWithObject:true});
  writeFileSync('public'+src,data,{flag:'wx'});variants.push({src,type:`image/${format}`,width:info.width,height:info.height,bytes:data.length});
 }
 const entry={driveFileId,sha256,width:meta.width,height:meta.height,variants,source,folderId,room,workbookCell:`D${row}`,approval:'Owner request 2026-10-23; local demo only; original inspected, no people'};
 m.photos[key]=entry;evidence.push({key,...entry});
}
writeFileSync(mp,JSON.stringify(m,null,2)+'\n');
writeFileSync(out+'/sources.json',JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
console.log(evidence.map(({key,sha256})=>({key,sha256})));
