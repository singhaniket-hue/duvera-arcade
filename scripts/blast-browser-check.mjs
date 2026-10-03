import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const port=5200+Math.floor(Math.random()*100),base=process.env.TEST_BASE_URL||`http://127.0.0.1:${port}/`;
const server=process.env.TEST_BASE_URL?null:spawn(process.execPath,['scripts/serve.mjs','--port',String(port),'--host','127.0.0.1'],{stdio:['ignore','pipe','inherit']});
if(server)await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('Test server exited: '+code)));});
let checks=0;const check=(name,ok)=>{assert.ok(ok,name);checks++;console.log('PASS '+name);};
const browser=await chromium.launch({headless:true});const shots=process.env.SCREENSHOT_DIR||'output/playwright/blast';await mkdir(shots,{recursive:true});
try{
 for(const [name,width,height,touch]of [['desktop',1280,900,false],['phone',320,568,true],['landscape',568,320,true]]){
 const c=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch});const p=await c.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 await p.goto(base+'creators/moosher/');await p.locator('[href*="game=blast"]').click();const f=await(await p.waitForSelector('#game-frame')).contentFrame();await f.waitForFunction(()=>window.blastGame);
 check(name+' creator title',await f.locator('h1').textContent()==='Moosh Blast');
 check(name+' fits screen',await f.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight));
 check(name+' start button inside board',await f.evaluate(()=>{const a=document.querySelector('#action').getBoundingClientRect(),b=document.querySelector('canvas').getBoundingClientRect();return a.top>=b.top&&a.bottom<=b.bottom;}));
 await p.screenshot({path:shots+'/'+name+'-menu.png'});await f.locator('#action').click();
 check(name+' starts with four actors',await f.evaluate(()=>blastGame.status==='playing'&&blastGame.actors.filter(a=>a.alive).length===4));
 if(touch)await f.locator('#bomb').tap();else await p.keyboard.press('Space');
 check(name+' real input plants bomb',await f.evaluate(()=>blastGame.bombs.some(b=>b.owner===0)));
 if(touch){for(let i=0;i<3;i++){await f.locator('[data-dir="1"]').tap();await p.waitForTimeout(180);}}else{await p.keyboard.down('ArrowRight');await p.waitForTimeout(520);await p.keyboard.up('ArrowRight');}
 check(name+' real input moves player away',await f.evaluate(()=>blastGame.actors[0].x>=3));
 await f.locator('#pause').click();const before=await f.evaluate(()=>blastGame.time);await p.waitForTimeout(200);check(name+' pause freezes simulation',await f.evaluate(t=>blastGame.status==='paused'&&blastGame.time===t,before));
 await f.locator('#action').click();check(name+' resume works',await f.evaluate(()=>blastGame.status==='playing'));
 await p.screenshot({path:shots+'/'+name+'-playing.png'});
 // Deterministic game-over fixture: actual engine blast and UI resolution, not a result flag.
 await f.evaluate(()=>{for(const a of blastGame.actors)a.bot=false;blastGame.actors[0].x=1;blastGame.actors[0].y=1;blastGame.bombs=[];blastGame.plant(0);blastGame.bombs[0].at=blastGame.time+.05;});
 await f.waitForFunction(()=>blastGame.status==='over');check(name+' loss and retry screen',await f.locator('#action').isVisible());await f.locator('#action').click();check(name+' retry resets round',await f.evaluate(()=>blastGame.status==='playing'&&blastGame.actors[0].alive&&blastGame.actors[0].capacity===1));
 await f.evaluate(()=>{blastGame.actors.slice(1).forEach(a=>a.alive=false);});await f.waitForFunction(()=>blastGame.status==='over');check(name+' win persisted in scoped storage',await f.evaluate(()=>localStorage.getItem('duvera.moosher.blast.wins')==='1'&&localStorage.getItem('duvera.default.blast.wins')===null));
 await p.reload();const f2=await(await p.waitForSelector('#game-frame')).contentFrame();await f2.waitForFunction(()=>window.blastGame);check(name+' wins survive reload',await f2.locator('#wins').textContent()==='1');
 await p.locator('#creator-voice').click();check(name+' voice mute',await f2.evaluate(()=>CreatorAudio.settings().muted));
 check(name+' no browser errors',errors.length===0);await c.close();
 }
 const c=await browser.newContext({viewport:{width:1280,height:900}}),p=await c.newPage();await p.goto(base+'games/blast/?creator=moosher');await p.locator('#mode').selectOption('duo');await p.locator('#action').click();await p.keyboard.press('KeyD');await p.waitForTimeout(180);await p.keyboard.press('ArrowLeft');await p.keyboard.press('Space');await p.keyboard.press('Enter');
 check('local players use independent movement and bombs',await p.evaluate(()=>blastGame.actors[0].x===2&&blastGame.actors[1].x===10&&blastGame.bombs.some(b=>b.owner===0)&&blastGame.bombs.some(b=>b.owner===1)));await p.screenshot({path:shots+'/duo.png'});
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{get:()=>true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});check('background visibility pauses',await p.evaluate(()=>blastGame.status==='paused'));await c.close();
 const blocked=await browser.newContext();await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('blocked');}});});const b=await blocked.newPage();await b.goto(base+'games/blast/?creator=moosher');await b.locator('#action').click();await b.evaluate(()=>blastGame.actors.slice(1).forEach(a=>a.alive=false));await b.waitForFunction(()=>blastGame.status==='over');check('blocked storage still allows play and reports session-only score',await b.locator('#storage-note').isVisible());await blocked.close();
 const generic=await browser.newPage();await generic.goto(base+'games/blast/?creator=default');check('generic edition works',await generic.locator('h1').textContent()==='Blast'&&!await generic.locator('#voice').isVisible());await generic.locator('#action').click();check('generic gameplay starts',await generic.evaluate(()=>blastGame.status==='playing'));
 console.log(`${checks} Blast browser checks passed.`);
}finally{await browser.close();server?.kill();}
