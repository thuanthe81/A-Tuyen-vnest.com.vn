import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
const root='public/dev-fixtures/brand-collection/official-logos/';
const report=[];
for(const [name,bg,fg] of [['bare-boutique-stays',[242,242,242],[35,31,32]],['pepper-house',[255,255,255],[0,0,0]],['the-nang-suites',[255,255,255],[188,138,42]]]){
 const {data,info}=await sharp(root+name+'.png').raw().toBuffer({resolveWithObject:true});
 const rgba=Buffer.alloc(info.width*info.height*4);let x0=info.width,y0=info.height,x1=0,y1=0;
 const axis=bg.map((v,c)=>v-fg[c]).indexOf(Math.max(...bg.map((v,c)=>v-fg[c])));
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const i=(y*info.width+x)*3,o=(y*info.width+x)*4;
  const a=Math.max(0,Math.min(1,(bg[axis]-data[i+axis])/(bg[axis]-fg[axis])));
  // Recover antialiased edge opacity, without erosion, dilation, or binary thresholding.
  for(let c=0;c<3;c++)rgba[o+c]=a?Math.round(Math.max(0,Math.min(255,(data[i+c]-bg[c]*(1-a))/a))):fg[c];
  rgba[o+3]=Math.round(a*255);
  if(a>.1){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}
 }
 const box={left:Math.max(0,x0-6),top:Math.max(0,y0-6),width:x1-x0+13,height:y1-y0+13};
 await sharp(rgba,{raw:{width:info.width,height:info.height,channels:4}}).extract(box).webp({lossless:true}).toFile(root+name+'-transparent.webp');
 report.push({name,background:bg,foreground:fg,box});
 if(name==='bare-boutique-stays'){
  // Use the original script wordmark alone beside the full brand-name label.
  // The complete transparent lockup above retains the original subtitle and spacing.
  const rows=[];for(let y=box.top;y<y1;y++){let ink=false;for(let x=x0;x<=x1;x++)if(rgba[(y*info.width+x)*4+3]>25){ink=true;break}if(ink)rows.push(y)}
  let end=rows[0];for(const y of rows){if(y-end>30)break;end=y}
  const wordmark={...box,height:end-box.top+7};
  await sharp(rgba,{raw:{width:info.width,height:info.height,channels:4}}).extract(wordmark).webp({lossless:true}).toFile(root+'bare-wordmark-transparent.webp');report.push({name:'bare-wordmark',box:wordmark});
 }
}
writeFileSync('docs/qa/demo/logo-placement-2026-10-22/assets.json',JSON.stringify(report,null,2));console.log(report);
