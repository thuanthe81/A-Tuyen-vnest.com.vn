import {Page,launch,quit,sleep} from './browser.mjs';
import {writeFileSync} from 'node:fs';
const out=new URL('.',import.meta.url).pathname.replaceAll('%20',' '), results=[];
const facts=`({overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth&&i.getClientRects().length).map(i=>i.currentSrc),title:document.querySelector('h1')?.innerText})`;
async function scan(p){await p.eval(`(async()=>{for(let y=0;y<document.body.scrollHeight;y+=innerHeight*.8){scrollTo(0,y);await new Promise(r=>setTimeout(r,70))}scrollTo(0,0)})()`);await p.eval(`Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode().catch(()=>null)}))`);await sleep(600);}
async function press(p,selector){const c=await p.eval(`(()=>{const e=${selector};e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await p.click(c.x,c.y);await sleep(500);}
await launch();
for(const w of [1440,390,768]){
 const p=await Page.open(),errors=[];p.on('Runtime.exceptionThrown',e=>errors.push(e.exceptionDetails.text));p.on('Network.responseReceived',e=>{if(e.response.status>=400&&!e.response.url.endsWith('/favicon.ico'))errors.push(e.response.status+' '+e.response.url)});
 await p.viewport(w,w===390?844:900,1,w<1000);await p.goto('http://localhost:3400/dev/demo');await p.eval('document.fonts.ready');await scan(p);
 for(const [index,name] of [[0,'all'],[2,'nang'],[1,'bare'],[3,'pepper']]){
  await p.eval(`document.querySelectorAll('[role=radio]')[${index}].click();document.querySelector('[aria-labelledby="bc-b-title"]').scrollIntoView({behavior:'instant'});scrollBy(0,-80)`);await sleep(800);
  await p.shot(out+`${w}-home-${name}.png`);
  results.push({w,name,...await p.eval(facts)});
 }
 await p.eval(`document.querySelectorAll('[role=radio]')[1].click()`);await sleep(400);
 await p.eval(`[...document.querySelectorAll('h3')].find(e=>e.textContent.includes('Bare Hàn')).closest('li').scrollIntoView({block:'center',behavior:'instant'})`);await sleep(500);await p.shot(out+`${w}-home-bare-han.png`);
 const han=await p.eval(`(()=>{const e=[...document.querySelectorAll('h3')].find(e=>e.textContent.includes('Bare Hàn')).closest('li');return{src:e.querySelector('img')?.currentSrc,loaded:e.querySelector('img')?.naturalWidth>0}})()`);if(!han.loaded||!han.src.includes('bare-han-ground-26'))throw Error(JSON.stringify(han));
 // Reach new page using its real homepage card.
 await p.eval(`document.querySelectorAll('[role=radio]')[2].click()`);await sleep(400);
 await press(p,`document.querySelector('a[href="/dev/stays/the-nang-suites"]')`);await sleep(1000);await scan(p);
 if(await p.eval('location.pathname')!=='/dev/stays/the-nang-suites')throw Error('Navigation failed');
 await p.shot(out+`${w}-nang-page.png`,{full:true});await p.shot(out+`${w}-nang-first-view.png`);
 const f=await p.eval(facts);if(f.overflow||f.broken.length)throw Error(JSON.stringify(f));
 results.push({w,name:'nang-page',...f,han});
 // Real input opens grouped gallery, keyboard Escape restores focus; then room drawer.
 await press(p,`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Xem tất cả 7 ảnh'))`);
 const gallery=await p.eval(`document.querySelector('dialog[open]')?.innerText`);if(!gallery?.includes('Blue Moon')||!gallery.includes('Yellow Submarine'))throw Error('Missing gallery groups');
 await p.key('Escape',{vk:27});await sleep(250);
 await press(p,`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Xem chi tiết phòng'))`);
 const drawer=await p.eval(`document.querySelector('dialog[open]')?.innerText`);if(!drawer?.includes('Blue Moon')||!drawer.includes('The Nắng Suites')||drawer.includes('Bare Chic'))throw Error('Incorrect room drawer');
 await p.shot(out+`${w}-nang-drawer.png`);await p.key('Escape',{vk:27});
 results.push({w,interaction:'gallery and drawer',passed:true,errors});if(errors.length)throw Error(JSON.stringify(errors));await p.close();
}
writeFileSync(out+'capture.json',JSON.stringify(results,null,2));quit();console.log('PASS',results);
