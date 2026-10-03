import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5388/';
const server=process.env.TEST_BASE_URL?null:spawn(process.execPath,['scripts/serve.mjs','--port','5388'],{stdio:['ignore','pipe','inherit']});if(server)await new Promise(r=>server.stdout.once('data',r));
const browser=await chromium.launch(),shots=process.env.SCREENSHOT_DIR||'output/playwright/dash';await mkdir(shots,{recursive:true});let checks=0;const errors=[];
const check=(name,ok)=>{assert.ok(ok,name);console.log('PASS '+name);checks++;};
try{
 for(const [name,width,height,touch]of [['desktop',1280,900,false],['portrait',320,568,true],['landscape',568,320,true]]){
  const c=await browser.newContext({viewport:{width,height},hasTouch:touch});await c.addInitScript(()=>{window.reactions=[];addEventListener('creator-reaction',e=>reactions.push(e.detail));});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.url());});p.on('requestfailed',r=>{if(r.failure()?.errorText!=='net::ERR_ABORTED')errors.push(r.url());});
  await p.goto(base+'creators/moosher/');await p.locator('[href*="game=dash"]').click();const f=await (await p.waitForSelector('#game-frame')).contentFrame();await f.waitForFunction(()=>window.dashGame);
  check(name+' title',await f.locator('h1').textContent()==='Moosh Dash');check(name+' no autoplay',await f.evaluate(()=>reactions.length===0));
  if(touch)await f.locator('#action').tap();else{await f.locator('canvas').focus();await p.keyboard.press('Space');}
  check(name+' starts with grace',await f.evaluate(()=>dashGame.status==='playing'&&dashGame.obstacles.length===0));
  if(touch)await f.locator('#jump').tap();else await p.keyboard.press('ArrowUp');await f.waitForFunction(()=>dashGame.y>10);check(name+' jump works',true);await f.waitForFunction(()=>dashGame.y===0);
  const duck=await f.locator('#duck').boundingBox();if(touch){const cd=await c.newCDPSession(p);await cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:duck.x+duck.width/2,y:duck.y+duck.height/2}]});check(name+' held touch ducks',await f.evaluate(()=>dashGame.ducking));await cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cd.detach();}else{await p.keyboard.down('ArrowDown');check(name+' held key ducks',await f.evaluate(()=>dashGame.ducking));await p.keyboard.up('ArrowDown');}
  check(name+' release stands up',await f.evaluate(()=>!dashGame.ducking));
  // Precise encounter fixtures keep browser controls real while making collision tests repeatable.
  await f.evaluate(()=>{dashGame.obstacles=[];dashGame.pickups=[{x:125,y:252,radius:9}];});await f.waitForFunction(()=>dashGame.coins===1);check(name+' collectible scores',await f.evaluate(()=>dashGame.score>=25));
  await f.locator('#pause').click();const before=await f.evaluate(()=>dashGame.distance);await p.waitForTimeout(120);check(name+' pause freezes',await f.evaluate(x=>dashGame.distance===x,before));await f.locator('#action').click();
  await f.evaluate(()=>{dashGame.time=Math.max(dashGame.time,4);dashGame.obstacles=[{x:300,y:228,width:38,height:42,type:'crate'},{x:800,y:165,width:54,height:55,type:'arch'}];});
  check(name+' controls and canvas fit',await f.evaluate(()=>{const r=document.querySelector('.run-controls').getBoundingClientRect();return r.bottom<=innerHeight&&document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight;}));
  await p.screenshot({path:shots+'/'+name+'.png',fullPage:true});await p.setViewportSize({width:height,height:width});check(name+' resize keeps run',await f.evaluate(()=>dashGame.status==='playing'&&dashGame.coins===1));await p.setViewportSize({width,height});
  await f.evaluate(()=>{dashGame.obstacles=[{x:122,y:228,width:38,height:42,type:'crate'}];dashGame.y=0;dashGame.vy=0;});await f.waitForFunction(()=>dashGame.status==='over');check(name+' hit ends run',await f.locator('#action').textContent()==='Try again');
  const best=await f.locator('#best').textContent();check(name+' creator best isolated',await f.evaluate(()=>Number(localStorage.getItem('duvera.moosher.dash.best'))>0&&localStorage.getItem('duvera.default.dash.best')===null));
  await f.locator('#action').click();check(name+' retry clears stars',await f.evaluate(()=>dashGame.coins===0&&dashGame.status==='playing'));await p.locator('#creator-voice').click();await p.reload();const again=await (await p.waitForSelector('#game-frame')).contentFrame();await again.waitForFunction(()=>window.dashGame);check(name+' best and mute survive hard refresh',await again.locator('#best').textContent()===best&&await again.evaluate(()=>CreatorAudio.settings().muted));
  await c.close();
 }
 const c=await browser.newContext();await c.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('storage denied');}}));const p=await c.newPage();await p.goto(base+'games/dash/?creator=moosher');await p.locator('#action').click();await p.waitForFunction(()=>dashGame.score>0);await p.evaluate(()=>{Object.defineProperty(document,'hidden',{get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});check('hidden run pauses safely with storage blocked',await p.evaluate(()=>dashGame.status==='paused')&&await p.locator('#storage-note').isVisible());await c.close();
 check('no script errors or failed requests',errors.length===0);console.log(`${checks} Dash browser checks passed.`);
}finally{await browser.close();server?.kill();}
