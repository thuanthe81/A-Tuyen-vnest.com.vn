import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const source='.local-media/client-photos/nang-2026-10-22/green-river-3.png';
const bytes=readFileSync(source),meta=await sharp(bytes).metadata();
const sha256=createHash('sha256').update(bytes).digest('hex');
const folder='public/dev-client-media/the-nang-suites';mkdirSync(folder,{recursive:true});
const variants=[];
for(const width of [480,800,1200,1600])for(const format of ['avif','webp','jpeg']){
 const ext=format==='jpeg'?'jpg':format,path=`${folder}/${width}.${ext}`;
 if(existsSync(path))throw Error('Refusing to overwrite '+path);
 const {data,info}=await sharp(bytes).rotate().resize({width,withoutEnlargement:true}).toColourspace('srgb').toFormat(format,{quality:format==='avif'?55:82}).toBuffer({resolveWithObject:true});
 writeFileSync(path,data,{flag:'wx'});variants.push({src:`/dev-client-media/the-nang-suites/${width}.${ext}`,type:`image/${format}`,width:info.width,height:info.height,bytes:data.length});
}
const path='public/dev-client-media/manifest.json',manifest=JSON.parse(readFileSync(path));
if(manifest.photos['the-nang-suites'])throw Error('Nang manifest already exists');
writeFileSync('.local-media/client-photos/nang-2026-10-22/manifest-before.json',readFileSync(path),{flag:'wx'});
manifest.photos['the-nang-suites']={driveFileId:'135fYrwL4yxt7jR0K0eSre400uuh_Ufro',sha256,width:meta.width,height:meta.height,variants,source,folderId:'136jviLxLQlOcGXv1Y00dXETGBaXe2Lf2',room:'Green River',file:'3.png',approval:'Owner confirmation in Codex, 2026-10-22; local CEO demo',set:'CEO-2026-10-22'};
writeFileSync(path,JSON.stringify(manifest,null,2)+'\n');console.log({sha256,width:meta.width,height:meta.height,variants});
