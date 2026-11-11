import { Page, sleep, launch, quit } from '../takeover-2026-10-22/browser.mjs';
import { writeFileSync } from 'node:fs';
const out = new URL('.',import.meta.url).pathname.replaceAll('%20',' ');
const results=[];
await launch();
for(const w of [1440,390,768]){
 const p=await Page.open(); await p.viewport(w,900,1,w<1000); await p.goto('http://localhost:3400/dev/demo');
 for(const [i,name] of ['all','bare','the-nang','pepper-house'].entries()){
  await p.eval(`document.querySelectorAll('[role=radio]')[${i}].click()`);await sleep(350);
  await p.eval(`document.querySelector('[aria-labelledby="bc-b-title"]').scrollIntoView({block:'start',behavior:'instant'});scrollBy(0,-80)`); await sleep(350);
  const r=await p.eval(`({label:document.querySelector('[role=radio][aria-checked=true]').getAttribute('aria-label'),count:document.querySelector('[aria-labelledby="bc-b-result"]')?.children.length,overflow:document.documentElement.scrollWidth>innerWidth,logos:[...document.images].filter(i=>i.src.includes('official-logos')&&i.getClientRects().length).map(i=>({src:i.src,loaded:i.complete&&i.naturalWidth>0,w:i.width,h:i.height,naturalW:i.naturalWidth,naturalH:i.naturalHeight})),result:document.getElementById('bc-b-result').innerText})`);
  await p.eval(`document.fonts.ready`);
  await p.shot(out+`${w}-${name}.png`); results.push({w,name,...r});
  for(const city of ['ho-chi-minh','da-nang']){
   await p.eval(`document.querySelectorAll('[role=radio]')[${i}].click()`);await sleep(200);
   // Native select also drives the shared model at desktop widths.
   await p.eval(`(()=>{const s=[...document.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.value==='${city}'));if(!s)throw Error('city absent: ${city}');s.value='${city}';s.dispatchEvent(new Event('change',{bubbles:true}))})()`);
   await sleep(200);results.push({w,name,city,...await p.eval(`({result:document.getElementById('bc-b-result').innerText,selected:document.querySelector('[role=radio][aria-checked=true]').getAttribute('aria-label'),overflow:document.documentElement.scrollWidth>innerWidth})`)});
  }
  await p.eval(`(()=>{const s=[...document.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.value==='ho-chi-minh'));s.value='';s.dispatchEvent(new Event('change',{bubbles:true}))})()`);await sleep(200);
 }
 await p.close();
}
writeFileSync(out+'brands.json',JSON.stringify(results,null,2));console.log(results);quit();
