import {Page,launch,quit,sleep} from './browser.mjs';
import {writeFileSync} from 'node:fs';
const out=new URL('.',import.meta.url).pathname.replaceAll('%20',' '),results=[];
const D=`[...document.querySelectorAll('div[role=dialog],dialog[open]')].find(e=>e.getClientRects().length&&e.querySelector('[data-date]'))`;
async function click(p,js){const r=await p.eval(`(()=>{const e=${js};if(!e)throw Error('Missing target');e.scrollIntoView({block:'nearest',behavior:'instant'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await sleep(150);await p.click(r.x,r.y);await sleep(250);}
async function bounds(p,mobile){return p.eval(`(()=>{const d=${D};if(!d)throw Error('No calendar');const r=d.getBoundingClientRect();const days=[...d.querySelectorAll('[data-date]')].filter(b=>!b.disabled);const visible=days.filter(b=>{const q=b.getBoundingClientRect();let lo=Math.max(0,r.top),hi=Math.min(innerHeight,r.bottom);for(let a=b.parentElement;a&&a!==d;a=a.parentElement){if(['auto','scroll','hidden','clip'].includes(getComputedStyle(a).overflowY)){const c=a.getBoundingClientRect();lo=Math.max(lo,c.top);hi=Math.min(hi,c.bottom)}}return q.top>=lo&&q.bottom<=hi});return{rect:{x:r.x,y:r.y,right:r.right,bottom:r.bottom},fits:r.top>=-1&&r.left>=-1&&r.bottom<=innerHeight+1&&r.right<=innerWidth+1,overflow:document.documentElement.scrollWidth>innerWidth,visibleDates:visible.length,hitTargets:visible.every(b=>{const q=b.getBoundingClientRect();return b.contains(document.elementFromPoint(q.x+q.width/2,q.y+q.height/2))}),scrollable:d.scrollHeight>d.clientHeight,mobile:${mobile}}})()`);}
await launch();
for(const [w,h] of [[1440,900],[768,900],[390,844],[1440,1400],[1440,500]])for(const mode of ['hero','sticky']){
 const mobile=w<768,p=await Page.open();await p.viewport(w,h,1,mobile);await p.goto('http://localhost:3400/dev/demo');await p.eval('document.fonts.ready');
 if(mode==='sticky'){await p.eval(`document.querySelector('section[aria-labelledby="demo-title"] form').scrollIntoView({block:'center',behavior:'instant'})`);await sleep(250);await p.eval(`scrollTo(0,document.querySelector('section[aria-labelledby="demo-title"]').getBoundingClientRect().bottom+scrollY+120)`);await sleep(500);}
 const scope=mode==='hero'?`document.querySelector('section[aria-labelledby="demo-title"]')`:`[...document.querySelectorAll('div.fixed')].find(e=>!e.inert&&e.className.includes('top-0')&&e.querySelector('form[role=search]'))`;
 const trigger=mobile?`[...${scope}.querySelectorAll('button[aria-haspopup=dialog]')].find(b=>b.getClientRects().length)`:`${scope}.querySelector('[data-field~="checkIn"]')`;
 await click(p,trigger);await sleep(350);const opened=await bounds(p,mobile);if(!opened.fits||opened.overflow||!opened.hitTargets||!opened.visibleDates)throw Error(JSON.stringify({w,h,mode,opened}));
 await p.shot(out+`${w}x${h}-${mode}-calendar.png`);
 if(!mobile){await click(p,`${D}.querySelector('button[aria-label="Tháng sau"]')`);}else{await p.eval(`(()=>{const b=${D}.querySelectorAll('table')[1];b.scrollIntoView({block:'center',behavior:'instant'})})()`);await sleep(250);}
 const dates=await p.eval(`(()=>{const d=${D},b=[...d.querySelectorAll('[data-date]')].filter(b=>!b.disabled);return [b[${mobile?35:5}].dataset.date,b[${mobile?38:8}].dataset.date]})()`);
 await click(p,`${D}.querySelector('[data-date="${dates[0]}"]')`);
 await click(p,`${D}.querySelector('[data-date="${dates[1]}"]')`);
 if(mobile){await p.key('Escape',{vk:27});await sleep(300);}
 await click(p,trigger);
 const selected=await p.eval(`(()=>{const d=${D};return ['${dates[0]}','${dates[1]}'].every(date=>d.querySelector('[data-date="'+date+'"]')?.getAttribute('aria-pressed')==='true')})()`);
 if(!selected)throw Error('Dates did not persist '+JSON.stringify({w,h,mode,dates}));
 // Keyboard navigation on a date, then Escape; the frozen form restores trigger focus.
 if(!mobile){await p.eval(`${D}.querySelector('[data-date="${dates[0]}"]').focus()`);await p.key('ArrowRight',{vk:39});}
 await p.key('Escape',{vk:27});await sleep(300);
 const closed=await p.eval(`!(${D})`);if(!closed)throw Error('Escape failed');
 await click(p,trigger);
 let outside='not applicable: full-screen native mobile modal';
 if(!mobile){await p.click(5,h-5);await sleep(250);outside=await p.eval(`!(${D})`);if(!outside)throw Error('Outside dismissal failed');}else{await p.key('Escape',{vk:27});}
 results.push({w,h,mode,opened,dates,selectionPersisted:selected,escapeClosed:closed,outside});writeFileSync(out+'results.json',JSON.stringify(results,null,2));console.log('PASS',w,h,mode);await p.close();
}
writeFileSync(out+'results.json',JSON.stringify(results,null,2));console.log('PASS',results);quit();
