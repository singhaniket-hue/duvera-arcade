import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {wav} from './check-submissions.mjs';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5399/',key=process.env.SUBMISSION_TEST_KEY,shots=process.env.SCREENSHOT_DIR||'output/playwright/submissions';
if(!key)throw Error('SUBMISSION_TEST_KEY is required.');
await mkdir(shots,{recursive:true});const browser=await chromium.launch();let checks=0;const errors=[];const check=(name,ok)=>{assert.ok(ok,name);console.log('PASS '+name);checks++;};
try{
 for(const [name,width,height]of [['desktop',1280,900],['portrait',320,568],['landscape',740,360]]){
  const visitor=await browser.newContext({viewport:{width,height},hasTouch:name!=='desktop'}),owner=await browser.newContext({viewport:{width,height},hasTouch:name!=='desktop'});const p=await visitor.newPage(),q=await owner.newPage();for(const page of[p,q])page.on('pageerror',e=>errors.push(e.message));
  await p.goto(base+'creators/moosher/submit-audio.html');await p.locator('#audio-file').setInputFiles({name:'candidate.wav',mimeType:'audio/wav',buffer:Buffer.from(wav(1,width))});await p.waitForFunction(()=>document.querySelector('#file-detail').textContent.includes('seconds'));
  check(name+' preview never autoplays',await p.locator('audio').evaluate(a=>a.paused));
  await p.locator('[name=title]').fill('<img src=x onerror=alert(1)> '+name);await p.locator('[name=source]').fill('https://www.youtube.com/watch?v=LnAsPIae94Q');await p.locator('[name=start]').fill('1');await p.locator('[name=end]').fill('2');await p.locator('[name=consent]').check();await p.screenshot({path:shots+'/'+name+'-submit.png',fullPage:true});
  check(name+' no horizontal overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.locator('#send-clip').click();await p.waitForFunction(()=>document.querySelector('#submission-status').textContent.includes('Reference:'));check(name+' successful private upload',await p.locator('#submission-status').innerText().then(t=>t.includes('not published')));
  await q.goto(base+'creators/moosher/review-submissions.html');await q.locator('#review-key').fill('wrong');await q.locator('button[type=submit]').click();await q.waitForFunction(()=>document.querySelector('#inbox-status').dataset.error==='true');check(name+' wrong owner key denied',await q.locator('#inbox').isHidden());
  await q.locator('#review-key').fill(key);await q.locator('button[type=submit]').click();await q.locator('.inbox-card').first().waitFor();const card=q.locator('.inbox-card').filter({hasText:'<img src=x onerror=alert(1)> '+name});check(name+' untrusted title rendered as text',await card.locator('h2').innerText().then(t=>t.startsWith('<img'))&&await card.locator('img').count()===0);
  await card.getByRole('button',{name:'Load preview',exact:true}).click();await card.locator('audio').waitFor({state:'visible'});await card.locator('audio').evaluate(a=>a.play());await q.waitForTimeout(80);check(name+' owner can play uploaded audio',await card.locator('audio').evaluate(a=>!a.paused&&a.readyState>=2));
  await card.getByRole('button',{name:'Approve candidate',exact:true}).click();await q.waitForFunction(()=>document.querySelector('.badge')?.textContent.includes('Approved'));check(name+' approval explicitly stays unpublished',await card.locator('.badge').innerText().then(t=>t.includes('not published')));
  const download=q.waitForEvent('download');await card.getByRole('button',{name:'Download audio',exact:true}).click();check(name+' owner can download',!!(await download).suggestedFilename().endsWith('.wav'));
  const notes=q.waitForEvent('download');await card.getByRole('button',{name:'Download source notes',exact:true}).click();check(name+' source notes downloadable',(await notes).suggestedFilename().endsWith('-source.json'));
  check(name+' review fits narrow screen',await q.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await q.screenshot({path:shots+'/'+name+'-review.png',fullPage:true});
  check(name+' key absent from browser storage',await q.evaluate(k=>![...Object.values(localStorage),...Object.values(sessionStorage)].some(v=>v.includes(k)),key));
  await q.locator('#lock-inbox').click();check(name+' lock clears private content',await q.locator('.inbox-card').count()===0&&await q.locator('#inbox').isHidden());
  await q.locator('#review-key').fill(key);await q.locator('button[type=submit]').click();await card.waitFor();q.once('dialog',d=>d.accept());await card.getByRole('button',{name:'Reject / delete',exact:true}).click();await card.waitFor({state:'detached'});check(name+' rejected audio removed',await q.locator('.inbox-card').count()===0);
  await q.reload();check(name+' refresh locks inbox',await q.locator('#inbox').isHidden());await visitor.close();await owner.close();
 }
 check('no browser errors',errors.length===0);console.log(`${checks} submission browser checks passed.`);
}finally{await browser.close();}
