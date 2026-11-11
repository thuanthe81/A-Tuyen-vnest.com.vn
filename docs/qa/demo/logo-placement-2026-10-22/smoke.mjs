import {Page,launch,quit,sleep} from '../takeover-2026-10-22/browser.mjs';
import {writeFileSync} from 'node:fs';
await launch();const results=[];
for(const w of [1440,390]){
 const p=await Page.open();await p.viewport(w,900,1,w<1000);await p.goto('http://localhost:3400/dev/demo');
 await p.eval(`document.querySelector('[role=radio]').focus()`);await p.key('ArrowRight');await sleep(300);
 const r=await p.eval(`({selected:document.querySelector('[role=radio][aria-checked=true]').getAttribute('aria-label'),indexLogos:document.querySelectorAll('[role=radiogroup] img[src*=transparent]').length,stageLogos:document.querySelectorAll('[data-official-logo] img').length,buttons:[...document.querySelectorAll('[role=radio]')].map(b=>{const r=b.getBoundingClientRect();return {w:r.width,h:r.height}}),images:[...document.querySelectorAll('[role=radiogroup] img')].map(i=>({loaded:i.complete&&i.naturalWidth>0,fit:getComputedStyle(i).objectFit,filter:getComputedStyle(i).filter})),overflow:document.documentElement.scrollWidth>innerWidth})`);
 if(!r.selected.startsWith('Bare')||r.indexLogos!==3||r.stageLogos!==0||r.overflow||r.buttons.some(b=>b.w<44||b.h<44)||r.images.some(i=>!i.loaded))throw Error(JSON.stringify(r));
 await p.eval(`document.querySelector('a[href="/dev/stays/bare-chic?view=demo"]').click()`);await sleep(1500);
 r.bareChic=await p.eval(`({url:location.pathname+location.search,title:document.querySelector('h1')?.innerText})`);
 if(r.bareChic.title!=='Bare Chic')throw Error('Navigation failed');results.push({w,...r});await p.close();
}
writeFileSync(new URL('smoke.json',import.meta.url),JSON.stringify(results,null,2));console.log('PASS',results);quit();
