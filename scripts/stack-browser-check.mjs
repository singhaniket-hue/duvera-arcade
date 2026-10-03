import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const port=5100+Math.floor(Math.random()*100),base=process.env.TEST_BASE_URL||`http://127.0.0.1:${port}/`;
const server=process.env.TEST_BASE_URL?null:spawn(process.execPath,['scripts/serve.mjs','--port',String(port)],{stdio:['ignore','pipe','inherit']});
if(server)await new Promise(r=>server.stdout.once('data',r));
const browser=await chromium.launch(),shots=process.env.SCREENSHOT_DIR||'output/playwright/stack';await mkdir(shots,{recursive:true});
let checks=0;const check=(name,value)=>{assert.ok(value,name);checks++;console.log('PASS '+name);};
try {
 for(const [name,width,height,touch] of [['desktop',1280,900,false],['portrait',320,568,true],['landscape',568,320,true]]){
  const c=await browser.newContext({viewport:{width,height},hasTouch:touch});const p=await c.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.url());});p.on('requestfailed',r=>{if(r.failure()?.errorText!=='net::ERR_ABORTED')errors.push(r.url());});
  await p.addInitScript(()=>{window.reactions=[];addEventListener('creator-reaction',e=>reactions.push(e.detail));});
  await p.goto(base+'creators/moosher/');await p.locator('[href*="game=stack"]').click();const f=await (await p.waitForSelector('#game-frame')).contentFrame();await f.waitForFunction(()=>window.stackGame);
  check(name+' title',await f.locator('h1').textContent()==='Moosh Stack');check(name+' no autoplay',await f.evaluate(()=>reactions.length===0));
  check(name+' fits viewport',await f.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight));
  check(name+' visible controls',await f.locator('#action').isVisible());
  if(touch)await f.locator('#action').tap();else {await f.locator('canvas').focus();await p.keyboard.press('Space');}
  check(name+' starts',await f.evaluate(()=>stackGame.status==='playing'));
  // Freeze the moving block at alignment until the actual user input; deterministic precision fixture.
  await f.evaluate(()=>{stackGame.moving.x=90;stackGame.direction=0;});
  if(touch)await f.locator('canvas').tap();else await p.keyboard.press('Space');
  check(name+' real input places perfect block',await f.evaluate(()=>stackGame.score===1&&stackGame.streak===1));
  await p.waitForTimeout(250);await f.evaluate(()=>{stackGame.moving.x=100;stackGame.direction=0;});
  await f.locator('#drop').click();check(name+' overhang trimmed',await f.evaluate(()=>stackGame.score===2&&stackGame.moving.width===170));
  await f.locator('#pause').click();const x=await f.evaluate(()=>stackGame.moving.x);await p.waitForTimeout(200);check(name+' pause freezes',await f.evaluate(x=>stackGame.status==='paused'&&stackGame.moving.x===x,x));
  await f.locator('#action').click();check(name+' resumes',await f.evaluate(()=>stackGame.status==='playing'));
  await f.evaluate(()=>{stackGame.cooldown=0;stackGame.moving.x=360-stackGame.moving.width;stackGame.direction=0;stackGame.blocks.at(-1).x=0;});await f.locator('#drop').click();check(name+' miss ends run',await f.evaluate(()=>stackGame.status==='over'));
  await f.locator('#action').click();check(name+' instant retry',await f.evaluate(()=>stackGame.score===0&&stackGame.status==='playing'));
  await f.evaluate(()=>{for(let i=0;i<59;i++){stackGame.cooldown=0;stackGame.moving.x=stackGame.blocks.at(-1).x;stackGame.drop();}stackGame.cooldown=0;stackGame.moving.x=stackGame.blocks.at(-1).x;stackGame.direction=0;});
  await f.locator('#drop').click();
  await p.setViewportSize({width:height,height:width});await p.waitForTimeout(100);check(name+' resize preserves tower',await f.evaluate(()=>stackGame.score===60&&document.documentElement.scrollWidth<=innerWidth));
  await p.setViewportSize({width,height});await p.waitForTimeout(650);await p.screenshot({path:shots+'/'+name+'.png',fullPage:true});
  await p.reload();const f2=await (await p.waitForSelector('#game-frame')).contentFrame();await f2.waitForFunction(()=>window.stackGame);
  check(name+' best survives reload and isolated',await f2.evaluate(()=>localStorage.getItem('duvera.moosher.stack.best')==='60'&&localStorage.getItem('duvera.default.stack.best')===null));
  await f2.locator('#voice').click();await p.reload();const f3=await (await p.waitForSelector('#game-frame')).contentFrame();await f3.waitForFunction(()=>window.stackGame);check(name+' voice preference persists',await f3.locator('#voice').textContent()==='Voice off');
  check(name+' no browser/network errors',errors.length===0);await c.close();
 }
 const c=await browser.newContext();await c.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('Storage denied');}});});const p=await c.newPage();await p.goto(base+'games/stack/?creator=moosher');await p.locator('#action').click();await p.evaluate(()=>{stackGame.direction=0;stackGame.moving.x=90;});await p.locator('#drop').click();check('blocked localStorage still playable with honest notice',await p.locator('#score').textContent()==='1'&&await p.locator('#storage-note').isVisible());
 // Visibility handler fixture; mobile emulation does not certify OS background behavior.
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{get:()=>true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});check('visibility hides pause run',await p.evaluate(()=>stackGame.status==='paused'));await c.close();
 console.log(`${checks} Stack browser checks passed.`);
} finally {await browser.close();server?.kill();}
