// Public visitor audit complements the gameplay suites without changing game state fixtures.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const port=5100+Math.floor(Math.random()*300);
const base=(process.env.TEST_BASE_URL||`http://127.0.0.1:${port}/`).replace(/\/?$/,'/');
const server=process.env.TEST_BASE_URL?null:spawn(process.execPath,['scripts/serve.mjs','--port',String(port),'--host','127.0.0.1'],{stdio:['ignore','pipe','inherit'],windowsHide:true});
if(server)await new Promise(resolve=>server.stdout.once('data',resolve));
const shots=path.resolve(process.env.SCREENSHOT_DIR||'output/playwright/visitor-copy');await mkdir(shots,{recursive:true});
const browser=await chromium.launch();let passed=0;
function check(name,ok){assert.ok(ok,name);passed++;console.log('PASS '+name);}
const ids=['clumsy-bird','2048','hextris','stack','four','dash','smash','draw','quiz'];
const names=['Moosh Flap','Moosh 2048','Moosh Spin','Moosh Stack','Moosh Four','Moosh Dash','Moosh Smash','Moosh Draw','Moosh Quiz Party'];
const unfinished=/lorem ipsum|coming soon|under construction|\[needs (?:number|source)\]|Still to source/i;
try{
 for(const size of [{width:1440,height:1000},{width:320,height:568},{width:667,height:375}]){
  const context=await browser.newContext({viewport:size,hasTouch:size.width<1000,isMobile:size.width<1000});const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});page.on('requestfailed',r=>{if(r.failure()?.errorText!=='net::ERR_ABORTED')errors.push(r.failure()?.errorText+' '+r.url());});
  const suffix=`${size.width}x${size.height}`;
  async function ready(label){
   await page.waitForLoadState('networkidle');
   check(label+' has no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   check(label+' has finished visible copy',!unfinished.test(await page.locator('body').innerText())&&await page.locator('[placeholder]').count()===0);
   check(label+' artwork loads',await page.locator('img').evaluateAll(xs=>xs.filter(x=>x.getBoundingClientRect().width>0).every(x=>x.complete&&x.naturalWidth>0)));
  }
  await page.goto(base+'creators/moosher/');await ready('Creator home '+suffix);check('Nine creator game cards',await page.locator('.creator-card').count()===9);await page.screenshot({path:path.join(shots,'home-'+suffix+'.png'),fullPage:true});
  for(const [i,id]of ids.entries()){
   await page.goto(base+'creators/moosher/');await page.locator(`.creator-card[href*="game=${id}"]`).click();await page.waitForSelector('#game-frame');
   const frame=await(await page.$('#game-frame')).contentFrame();await frame.waitForLoadState('networkidle');
   check(id+' shell title '+suffix,(await page.locator('#game-title').innerText())===names[i]);
   check(id+' frame visible '+suffix,await page.locator('#game-frame').isVisible());
   check(id+' frame copy complete '+suffix,!unfinished.test(await frame.locator('body').innerText()));
   await page.reload();await page.waitForSelector('#game-frame');check(id+' hard refresh '+suffix,(await page.locator('#game-title').innerText())===names[i]);
  }
  for(const [route,label]of [['index.html?creator=default','Generic home'],['creators/moosher/sounds.html','Sound settings'],['creators/moosher/submit-audio.html','Clip submission'],['creators/moosher/review-submissions.html','Private inbox'],['credits.html','Credits'],['play.html?game=missing','Unknown game']]){
   await page.goto(base+route);await ready(label+' '+suffix);
   if(label==='Generic home')check('Nine generic game cards',await page.locator('.game-card').count()===9);
   if(label==='Sound settings'){check('Four reviewed clips',await page.locator('.clip').count()===4);await page.locator('#voice-volume').fill('0');await page.locator('#mute-voices').check();await page.reload();check('Sound choices persist',await page.locator('#voice-volume').inputValue()==='0'&&await page.locator('#mute-voices').isChecked());}
   if(label==='Clip submission'){check('Retention text is accurate',(await page.locator('body').innerText()).includes('even if downloaded'));check('Upload source is required',await page.locator('input[name=source]').getAttribute('required')!==null);}
   if(label==='Private inbox')check('Private inbox stays locked',await page.locator('#login-panel').isVisible()&&!await page.locator('#inbox').isVisible());
   if(['Clip submission','Sound settings'].includes(label))await page.screenshot({path:path.join(shots,label.toLowerCase().replaceAll(' ','-')+'-'+suffix+'.png'),fullPage:true});
  }
  if(size.width===1440){
   for(const id of ids){await page.goto(base+'games/'+id+'/?creator=moosher');await page.waitForLoadState('networkidle');check(id+' direct route loads',await page.title()===names[ids.indexOf(id)]|| (await page.title()).startsWith(names[ids.indexOf(id)]));await page.reload();await page.waitForLoadState('networkidle');check(id+' direct route refreshes',!unfinished.test(await page.locator('body').innerText()));}
   const missing=await context.request.get(base+'no-such-visitor-page');check('Unknown path returns 404',missing.status()===404);
   // The development file server uses a plain 404; Pages serves the custom document.
   const notFound=server?await context.request.get(base+'404.html'):missing;check('Custom 404 offers an exit',(await notFound.text()).includes('Back to the arcade'));
  }
  check('No browser errors or failed assets '+suffix,errors.length===0);await context.close();
 }
 console.log(`${passed} visitor checks passed.`);
}finally{await browser.close();server?.kill();}
