import {Page,launch,quit,sleep} from '../takeover-2026-10-22/browser.mjs';
import {writeFileSync} from 'node:fs';
const out=new URL('.',import.meta.url).pathname.replaceAll('%20',' '), results=[];
await launch();
for(const w of [1440,390,768]){
 const p=await Page.open();await p.viewport(w,900,1,w<1000);await p.goto('http://localhost:3400/dev/demo');await p.eval('document.fonts.ready');
 for(const [index,name] of [[0,'all'],[2,'nang']]){
  await p.eval(`document.querySelectorAll('[role=radio]')[${index}].click();document.querySelector('[aria-labelledby="bc-b-title"]').scrollIntoView({behavior:'instant'});scrollBy(0,-80)`);await sleep(800);
  await p.shot(out+`${w}-${name}.png`);
  const r=await p.eval(`({overflow:document.documentElement.scrollWidth>innerWidth,selected:document.querySelector('[role=radio][aria-checked=true]').getAttribute('aria-label'),nangImages:[...document.images].filter(i=>i.currentSrc.includes('/the-nang-suites/')).map(i=>({loaded:i.complete&&i.naturalWidth>0,src:i.currentSrc})),result:document.getElementById('bc-b-result').innerText})`);
  if(r.overflow||r.nangImages.length!==2||r.nangImages.some(i=>!i.loaded))throw Error(JSON.stringify(r));results.push({w,name,...r});
 }
 for(const [id,name] of [['ve-vnest','about'],['hop-tac','partner']]){
  await p.eval(`(async()=>{const e=document.getElementById('${id}');const y=e.getBoundingClientRect().top+scrollY;for(let s=y;s<y+e.offsetHeight;s+=innerHeight/2){scrollTo(0,s);await new Promise(r=>setTimeout(r,80))}e.scrollIntoView({behavior:'instant'});})()`);await sleep(700);
  const clip=await p.eval(`(()=>{const r=document.getElementById('${id}').getBoundingClientRect();return{x:0,y:r.y+scrollY,width:innerWidth,height:r.height,scale:1}})()`);
  const shot=await p.send('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true});writeFileSync(out+`${w}-${name}-full.png`,Buffer.from(shot.data,'base64'));
  results.push({w,name,...await p.eval(`({overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.getElementById('${id}').querySelectorAll('img')].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),height:document.getElementById('${id}').offsetHeight})`)});
 }
 await p.close();
}
writeFileSync(out+'capture.json',JSON.stringify(results,null,2));quit();console.log('PASS',results);
