import {Page,launch,quit,sleep} from './browser.mjs';
import {writeFileSync} from 'node:fs';
const results=[];await launch();
for(const w of [1440,768,390]){
 const p=await Page.open();await p.viewport(w,900,1,w===390);await p.goto('http://localhost:3400/dev/demo');
 if(w!==390){
  await p.eval(`document.querySelector('section[aria-labelledby="demo-title"] [data-field="checkIn"]').click()`);await sleep(300);
  for(const h of [650,1100]){
   await p.viewport(w,h);await sleep(350);await p.eval('scrollBy(0,80)');await sleep(300);
   const r=await p.eval(`(()=>{const d=[...document.querySelectorAll('div[role=dialog]')].find(e=>e.getClientRects().length),r=d.getBoundingClientRect(),b=d.querySelector('button[aria-label="Tháng sau"]'),q=b.getBoundingClientRect();return{fits:r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth,monthButtonClickable:b.contains(document.elementFromPoint(q.x+q.width/2,q.y+q.height/2))}})()`);
   if(!r.fits||!r.monthButtonClickable)throw Error(JSON.stringify({w,h,...r}));results.push({w,h,resizeAndScroll:r});
  }
  await p.key('Escape',{vk:27});
  await p.eval(`document.querySelector('section[aria-labelledby="demo-title"] [data-field="guests"]').click()`);
 }else{
  await p.eval(`[...document.querySelectorAll('section[aria-labelledby="demo-title"] button[aria-haspopup=dialog]')].find(b=>b.getClientRects().length).click()`);await sleep(250);await p.eval(`document.querySelector('dialog[open] [data-section="guests"]').click()`);
 }
 await sleep(300);await p.eval(`[...document.querySelectorAll('button[aria-label="Thêm một khách"]')].find(b=>b.getClientRects().length).click()`);await sleep(200);
 const guests=await p.eval(`[...document.querySelectorAll('output')].find(b=>b.getClientRects().length)?.textContent`);if(guests!=='3')throw Error('Guest state '+guests);results.push({w,guests});await p.key('Escape',{vk:27});await p.close();
}
writeFileSync(new URL('extra.json',import.meta.url),JSON.stringify(results,null,2));console.log(results);quit();
