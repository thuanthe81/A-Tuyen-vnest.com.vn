import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
export { Page, sleep, sharp } from '../../brand-collection/scripts/lib.mjs';
let child;
export async function launch() {
 child = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--remote-debugging-port=9334',`--user-data-dir=${mkdtempSync(join(tmpdir(),'vnest-review-'))}`,'--no-first-run','--no-default-browser-check','about:blank'], {stdio:'ignore'});
 for(let i=0;i<60;i++){try{return await (await fetch('http://127.0.0.1:9334/json/version')).json()}catch{await new Promise(r=>setTimeout(r,250))}}
 throw Error('Browser unavailable');
}
export function quit(){child?.kill()}
