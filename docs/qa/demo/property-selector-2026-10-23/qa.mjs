import {Page,launch,quit,sleep} from './browser.mjs';
import {writeFileSync} from 'node:fs';
const out=new URL('.',import.meta.url).pathname.replaceAll('%20',' '),results=[];
const ids=['the-nang-suites','bare-chic','bare-hyphen','bare-da-kao','bare-han','pepper-house',''];
async function click(p,js){const c=await p.eval(`(()=>{const e=${js};if(!e)throw Error('Missing target');e.scrollIntoView({block:'nearest',behavior:'instant'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await sleep(150);await p.click(c.x,c.y);await sleep(250);}
await launch();
for(const [w,h] of [[1440,900],[768,900],[390,844],[1440,500]])for(const mode of ['hero','sticky']){
 const p=await Page.open(),mobile=w<768;await p.viewport(w,h,1,mobile);await p.goto('http://localhost:3400/dev/demo');
 if(mode==='sticky'){await p.eval(`document.querySelector('section[aria-labelledby="demo-title"] form').scrollIntoView({block:'center',behavior:'instant'})`);await sleep(250);await p.eval(`scrollTo(0,document.querySelector('section[aria-labelledby="demo-title"]').getBoundingClientRect().bottom+scrollY+120)`);await sleep(400);}
 const scope=mode==='hero'?`document.querySelector('section[aria-labelledby="demo-title"]')`:`[...document.querySelectorAll('div.fixed')].find(e=>!e.inert&&e.className.includes('top-0'))`;
 const trigger=mobile?`[...${scope}.querySelectorAll('button[aria-haspopup=dialog]')].find(b=>b.getClientRects().length)`:`${scope}.querySelector('[data-field="property"]')`;
 const panel=mobile?`document.querySelector('dialog[open]')`:`[...document.querySelectorAll('div[role=dialog]')].find(d=>d.getClientRects().length&&d.querySelector('input[type=radio]'))`;
 async function open(){await click(p,trigger);if(mobile)await click(p,`${panel}.querySelector('[data-section="property"]')`);await sleep(250);}
 await open();
 const inventory=await p.eval(`[...${panel}.querySelectorAll('input[type=radio]')].map(i=>({id:i.value,text:i.closest('label').innerText}))`);
 if(inventory.length!==7||!ids.every(id=>inventory.some(i=>i.id===id)))throw Error(JSON.stringify(inventory));
 const geometry=await p.eval(`(()=>{const d=${panel},r=d.getBoundingClientRect();return{fits:r.top>=0&&r.left>=0&&r.bottom<=innerHeight+1&&r.right<=innerWidth+1,overflow:document.documentElement.scrollWidth>innerWidth,scrollable:d.scrollHeight>d.clientHeight}})()`);if(!geometry.fits||geometry.overflow)throw Error(JSON.stringify(geometry));
 await p.shot(out+`${w}x${h}-${mode}-dropdown.png`);
 // Scroll to the last choice, verify it really receives pointer hits, then keyboard selection.
 await p.eval(`${panel}.querySelector('input[value="pepper-house"]').closest('label').scrollIntoView({block:'nearest',behavior:'instant'})`);await sleep(250);
 const reachable=await p.eval(`(()=>{const l=${panel}.querySelector('input[value="pepper-house"]').closest('label'),r=l.getBoundingClientRect();return l.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})()`);if(!reachable)throw Error('Last property unreachable');
 await p.shot(out+`${w}x${h}-${mode}-dropdown-bottom.png`);
 await p.eval(`${panel}.querySelector('input[value=""]').focus()`);await p.key('ArrowDown',{vk:40});
 const keyboard=await p.eval(`${panel}.querySelector('input:checked')?.value`);if(keyboard!=='bare-chic')throw Error('Radio keyboard failed '+keyboard);
 await p.key('Escape',{vk:27});await sleep(250);
 if(!mobile){const focus=await p.eval(`document.activeElement?.getAttribute('data-field')`);if(focus!=='property')throw Error('Escape focus '+focus);}
 const choices=[];
 for(const id of ids){
  await open();await click(p,`${panel}.querySelector('input[value="${id}"]').closest('label')`);
  if(!mobile){await click(p,`${scope}.querySelector('[data-field~="checkIn"]')`);}
  const dates=await p.eval(`!![...document.querySelectorAll('[data-date]')].find(e=>e.getClientRects().length)`);if(!dates)throw Error('Dates not available after '+id);
  await p.key('Escape',{vk:27});await sleep(200);
  await open();const selected=await p.eval(`${panel}.querySelector('input:checked')?.value`);if(selected!==id)throw Error('Selection lost '+id+' '+selected);
  await p.key('Escape',{vk:27});await sleep(200);choices.push({id,datesOpened:true,selectionPersisted:true});
 }
 results.push({w,h,mode,inventory,geometry,lastChoiceReachable:reachable,keyboard,choices});writeFileSync(out+'results.json',JSON.stringify(results,null,2));console.log('PASS',w,h,mode);await p.close();
}
const p=await Page.open();await p.goto('http://localhost:3400/dev/stays/the-nang-suites');const title=await p.eval(`document.querySelector('h1')?.textContent`);if(title!=='The Nắng Suites')throw Error(title);await p.close();console.log('Nắng detail route PASS');quit();
