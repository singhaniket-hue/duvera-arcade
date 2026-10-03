import assert from 'node:assert/strict';
import {chooseMove} from '../games/four/rules.mjs';
import {mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5277/',endpoint=process.env.ROOM_ENDPOINT||'http://127.0.0.1:8787';
const server=process.env.TEST_BASE_URL?null:spawn(process.execPath,['scripts/serve.mjs','--port','5277'],{stdio:['ignore','pipe','inherit']});if(server)await new Promise(r=>server.stdout.once('data',r));
const browser=await chromium.launch(),shots=process.env.SCREENSHOT_DIR||'output/playwright/four';await mkdir(shots,{recursive:true});let checks=0;
const check=(name,ok)=>{assert.ok(ok,name);console.log('PASS '+name);checks++;};
async function context(opts={}){const c=await browser.newContext(opts);if(!process.env.TEST_BASE_URL)await c.route('**/assets/room-config.js',r=>r.fulfill({contentType:'text/javascript',body:`window.ArcadeRooms={endpoint:${JSON.stringify(endpoint)}};`}));await c.addInitScript(()=>{const Native=WebSocket;window.WebSocket=class extends Native{constructor(...a){super(...a);window.testSocket=this;}};});return c;}
const errors=[];function monitor(p){p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&!r.url().includes('/rooms/'))errors.push(r.url());});}
const state=p=>p.evaluate(()=>fourSnapshot());
const settled=(p,count)=>p.waitForFunction(n=>fourSnapshot().board.filter(Boolean).length===n,count);
try{
 for(const [name,width,height,touch]of [['desktop',1280,900,false],['portrait',320,568,true],['landscape',568,320,true]]){
  const c=await context({viewport:{width,height},hasTouch:touch}),p=await c.newPage();monitor(p);await p.goto(base+'creators/moosher/');await p.locator('[href*="game=four"]').click();const f=await (await p.waitForSelector('#game-frame')).contentFrame();await f.waitForFunction(()=>window.fourSnapshot);
  check(name+' title',await f.locator('h1').textContent()==='Moosh Four');await f.locator('#solo').click();
  if(touch)await f.locator('#columns button').nth(3).tap();else{await f.locator('#status').click();await p.keyboard.press('4');}
  await f.waitForFunction(()=>fourSnapshot().board.filter(Boolean).length===2);check(name+' user and normal bot make legal moves',(await f.evaluate(()=>fourSnapshot().board)).filter(Boolean).length===2);
  check(name+' distinct token shapes',await f.locator('.p1').count()===1&&await f.locator('.p2').count()===1);
  await f.locator('#pause').click();check(name+' paused controls disabled',await f.locator('#columns button:enabled').count()===0);await f.locator('#pause').click();
  await f.locator('#difficulty').selectOption('easy');check(name+' difficulty change starts clean board',await f.evaluate(()=>fourSnapshot().board.every(x=>!x)));
  await f.locator('#columns button').nth(2).click();await f.waitForFunction(()=>fourSnapshot().board.filter(Boolean).length===2);
  check(name+' no horizontal overflow',await f.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  check(name+' board and input fit viewport',await f.evaluate(()=>{const b=document.querySelector('#columns').getBoundingClientRect();return b.bottom<=innerHeight&&b.left>=0&&b.right<=innerWidth;}));
  await p.screenshot({path:shots+'/'+name+'.png',fullPage:true});
  await p.locator('#creator-voice').click();await p.reload();const refreshed=await (await p.waitForSelector('#game-frame')).contentFrame();await refreshed.waitForFunction(()=>window.fourSnapshot);check(name+' voice mute survives refresh',await refreshed.evaluate(()=>CreatorAudio.settings().muted));await refreshed.locator('#solo').click();await refreshed.locator('#columns button').nth(3).click();await refreshed.waitForFunction(()=>fourSnapshot().board.filter(Boolean).length===2);await p.setViewportSize({width:height,height:width});check(name+' resize retains board',await refreshed.evaluate(()=>fourSnapshot().board.filter(Boolean).length===2));await c.close();
 }
 const soloContext=await context(),soloPage=await soloContext.newPage();monitor(soloPage);await soloPage.goto(base+'games/four/?creator=moosher');await soloPage.locator('#difficulty').selectOption('easy');await soloPage.locator('#solo').click();
 for(let turn=0;turn<22;turn++){const s=await state(soloPage);if(s.ended)break;const col=chooseMove(s.board,1,'normal');await soloPage.locator('#columns button').nth(col).click();await soloPage.waitForFunction(()=>fourSnapshot().ended||fourSnapshot().turn===1);}
 check('complete solo game reaches terminal result',!!(await state(soloPage)).ended);await soloPage.locator('#solo').click();check('solo retry clears terminal board',(await state(soloPage)).board.every(x=>!x));await soloContext.close();
 if(process.env.SOLO_ONLY!=='1'){
 const a=await context(),b=await context(),third=await context();const p=await a.newPage(),q=await b.newPage(),z=await third.newPage();[p,q,z].forEach(monitor);
 await p.goto(base+'games/four/?creator=moosher');await p.locator('#create').click();await p.waitForFunction(()=>fourSnapshot().state?.seat===1);const invite=await p.locator('#invite').inputValue();await q.goto(invite);await q.waitForFunction(()=>fourSnapshot().state?.seat===2);
 check('independent seats',await p.evaluate(()=>fourSnapshot().state.seat===1)&&await q.evaluate(()=>fourSnapshot().state.seat===2));
 await z.goto(invite);await z.waitForFunction(()=>document.querySelector('#notice').textContent.includes('two players'));check('third player rejected',true);
 const ownToken=await p.evaluate(()=>Object.values(localStorage).find(v=>v.length===72));check('seat tokens absent from opponent snapshots',!JSON.stringify((await state(q)).state).includes(ownToken));
 await p.waitForFunction(()=>fourSnapshot().state.seats[1]?.connected);await p.locator('#ready').click();await q.waitForFunction(()=>fourSnapshot().state.seats[0].ready);await q.locator('#ready').click();await p.waitForFunction(()=>fourSnapshot().state.status==='playing');await q.waitForFunction(()=>fourSnapshot().state.status==='playing');
 check('ready starts server match',true);
 await q.evaluate(()=>testSocket.send(JSON.stringify({type:'move',column:1,revision:fourSnapshot().state.revision})));await q.waitForFunction(()=>document.querySelector('#notice').textContent.includes('turn'));check('out-of-turn rejected',(await state(p)).board.every(x=>!x));
 const initialRevision=(await state(p)).state.revision;await Promise.all([p.evaluate(revision=>{const m=JSON.stringify({type:'move',column:0,revision});testSocket.send(m);testSocket.send(m);},initialRevision),q.evaluate(revision=>testSocket.send(JSON.stringify({type:'move',column:1,revision})),initialRevision)]);await settled(p,1);await settled(q,1);check('simultaneous and duplicate input applies one legal move',(await state(p)).board.filter(Boolean).length===1);
 await q.evaluate(()=>testSocket.send(JSON.stringify({type:'move',column:7,revision:fourSnapshot().state.revision})));await q.waitForFunction(()=>document.querySelector('#notice').textContent.includes('open column'));check('invalid column rejected',(await state(q)).board.filter(Boolean).length===1);
 await q.reload();await q.waitForFunction(()=>fourSnapshot().state?.seat===2);check('refresh reconnects same seat and board',(await state(q)).board.filter(Boolean).length===1);
 await q.evaluate(()=>testSocket.close());await p.waitForFunction(()=>fourSnapshot().state.seats[1].connected===false);check('disconnect explained',await p.locator('#connection').textContent().then(s=>s.includes('disconnected')));
 await p.locator('#claim').click();await p.waitForFunction(()=>document.querySelector('#notice').textContent.includes('reconnect window'));check('premature timeout claim rejected',(await state(p)).state.status==='playing');
 await q.locator('#reconnect').click();await p.waitForFunction(()=>fourSnapshot().state.seats[1].connected);check('reconnect resumes seat',true);
 // Actual seven legal moves create a vertical win; both real clients alternate.
 for(const [page,column,count] of [[q,1,2],[p,0,3],[q,1,4],[p,0,5],[q,1,6],[p,0,7]]){await page.waitForFunction(()=>fourSnapshot().turn===fourSnapshot().state.seat);await page.locator('#columns button').nth(column).click();await settled(p,count);await settled(q,count);}
 check('server declares win on both clients',(await state(p)).state.winner===1&&(await state(q)).state.winner===1);check('winning pieces highlighted',await p.locator('.winning').count()===4);
 await p.screenshot({path:shots+'/online-win.png'});await p.locator('#rematch').click();await q.waitForFunction(()=>fourSnapshot().state.seats[0].rematch);await q.locator('#rematch').click();await p.waitForFunction(()=>fourSnapshot().state.match===2);check('rematch resets and alternates first player',(await state(p)).board.every(x=>!x)&&(await state(p)).turn===2);
 await p.locator('#leave').click();await q.waitForFunction(()=>fourSnapshot().state.status==='closed');check('host leave closes room with explanation',true);
 await a.close();await b.close();await third.close();
 }else console.log('ONLINE NOT TESTED in this run: SOLO_ONLY=1; run the full suite against the intended Worker to verify rooms.');
 const blocked=await context();await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('blocked');}}));const bp=await blocked.newPage();monitor(bp);await bp.goto(base+'games/four/?creator=moosher');await bp.locator('#solo').click();await bp.locator('#columns button').nth(3).click();await settled(bp,2);check('solo works without storage',true);await bp.evaluate(()=>{Object.defineProperty(document,'hidden',{get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});check('hidden solo pauses',await bp.evaluate(()=>fourSnapshot().paused));await blocked.close();
 check('no JavaScript or static asset errors',errors.length===0);console.log(`${checks} Four browser checks passed.`);
}finally{await browser.close();server?.kill();}
