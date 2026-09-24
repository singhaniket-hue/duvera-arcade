// Browser integration checks. Rare scoring/end states use explicit fixtures, not a claimed human playthrough.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const port=4800+Math.floor(Math.random()*200);
const base = process.env.TEST_BASE_URL || `http://127.0.0.1:${port}/`;
const server=process.env.TEST_BASE_URL ? null : spawn(process.execPath,['scripts/serve.mjs','--port',String(port),'--host','127.0.0.1'],{stdio:['ignore','pipe','inherit']});
if(server)await new Promise(resolve=>server.stdout.once('data',resolve));
const shots = path.resolve(process.env.SCREENSHOT_DIR || 'output/playwright/desktop');
await mkdir(shots, {recursive:true});
const browser = await chromium.launch();
const context = await browser.newContext({viewport:{width:1440,height:1000}});
// Observe real HTMLAudioElement playback, without replacing playback with a mock.
await context.addInitScript(() => {
  window.testVoices=[];
  const NativeAudio=window.Audio;
  window.Audio=function(...args){const a=new NativeAudio(...args);if(String(args[0]).includes('/media/audio/'))testVoices.push(a);return a;};
});
const page = await context.newPage(), errors=[];
page.on('pageerror', e=>errors.push(e.message));
page.on('response', r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
page.on('requestfailed', r=>{if(r.failure()?.errorText!=='net::ERR_ABORTED')errors.push(`${r.failure()?.errorText} ${r.url()}`);});
let passed=0;
function check(name, result){assert.ok(result,name);console.log('PASS '+name);passed++;}
async function frame(){const f=await (await page.waitForSelector('#game-frame')).contentFrame();await f.waitForLoadState();return f;}
async function home(){await page.goto(base+'creators/moosher/');}
async function open(id){await home();await page.locator(`.creator-card[href*="game=${id}"]`).click();return frame();}
async function shot(name){await page.screenshot({path:path.join(shots,name+'.png'),fullPage:true});}
try {
  await home();await shot('moosher-home');
  check('creator landing artwork loaded',await page.locator('img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)));
  let f=await open('clumsy-bird');
  await f.waitForFunction(()=>window.me&&me.state.isCurrent(me.state.MENU));
  await page.waitForTimeout(1100);await shot('moosh-flap-title');
  check('Flap personalized logo loaded',await f.evaluate(()=>me.loader.getImage('logo').src.includes('flap-logo.png')));
  check('no reaction before interaction',await f.evaluate(()=>testVoices.length===0));
  await page.keyboard.press('Space');
  await f.waitForFunction(()=>me.state.isCurrent(me.state.PLAY)&&testVoices.length>0);
  check('Space starts Flap with real greeting playback',await f.evaluate(()=>!testVoices[0].paused));
  await page.keyboard.down('m');await page.waitForTimeout(100);await page.keyboard.up('m');
  check('M stops active reaction',await f.evaluate(()=>game.data.muted&&testVoices.every(a=>a.paused)));
  await page.keyboard.down('m');await page.waitForTimeout(100);await page.keyboard.up('m');
  await f.waitForFunction(()=>game.data.start);
  const before=await f.evaluate(()=>me.state.current().bird.pos.y);
  await page.keyboard.down('Space');await page.waitForTimeout(80);await page.keyboard.up('Space');
  check('Space flaps upward',await f.evaluate(()=>me.state.current().bird.pos.y)<before);
  await f.waitForFunction(()=>me.game.world.getChildByProp('type','pipe').length>0);
  check('pipes spawn during gameplay',true);
  check('personalized flying sprite loaded',await f.evaluate(()=>me.loader.getImage('clumsy').src.includes('flap-sprite.png')));
  await shot('moosh-flap-playing');
  // Exercise the real score collision and natural ground loss after a controlled hit fixture.
  await f.evaluate(()=>{const hit=me.game.world.getChildByProp('type','hit')[0];me.state.current().bird.onCollision({b:hit});});
  check('passing a pipe increments score',await f.evaluate(()=>game.data.steps===1));
  await f.waitForFunction(()=>me.state.isCurrent(me.state.GAME_OVER),null,{timeout:10000});
  check('loss reaction fires',await f.evaluate(()=>testVoices.some(a=>a.src.endsWith('theek-hai.mp3'))));
  check('first best reaction fires',await f.evaluate(()=>testVoices.some(a=>a.src.endsWith('badhiya.mp3'))));
  check('best score saved separately',await f.evaluate(()=>localStorage.getItem('duvera.moosher.clumsy-bird.topSteps')==='1'&&localStorage.getItem('me.save.topSteps')===null));
  await shot('moosh-flap-gameover');
  await f.locator('canvas').click();await f.waitForFunction(()=>me.state.isCurrent(me.state.MENU));
  await f.locator('canvas').click();await f.waitForFunction(()=>me.state.isCurrent(me.state.PLAY));
  check('mouse retry returns to a new run',true);
  await page.reload();f=await frame();await f.waitForFunction(()=>window.me&&me.state.isCurrent(me.state.MENU));
  check('Flap best survives reload',await f.evaluate(()=>localStorage.getItem('duvera.moosher.clumsy-bird.topSteps')==='1'));

  f=await open('2048');await f.waitForSelector('.tile');
  // Persist a legal near-merge board, then drive its merge through actual keyboard input.
  await f.evaluate(()=>{const cells=Array.from({length:4},()=>Array(4).fill(null));for(let x=0;x<2;x++)cells[x][0]={position:{x,y:0},value:16};localStorage.setItem('duvera.moosher.2048.gameState',JSON.stringify({grid:{size:4,cells},score:0,over:false,won:false,keepPlaying:false}));localStorage.setItem('duvera.2048.bestScore','1234');});
  await page.reload();f=await frame();await f.waitForSelector('.tile-16');await page.keyboard.press('ArrowLeft');
  await f.waitForSelector('.tile-32');
  check('2048 arrows perform a real merge and score',await f.evaluate(()=>JSON.parse(localStorage.getItem('duvera.moosher.2048.gameState')).score===32));
  const saved=await f.evaluate(()=>localStorage.getItem('duvera.moosher.2048.gameState'));
  await shot('moosh-2048');await page.reload();f=await frame();await f.waitForSelector('.tile-32');
  check('2048 resumes exact board and score',await f.evaluate(()=>localStorage.getItem('duvera.moosher.2048.gameState'))===saved);
  check('generic 2048 best untouched',await f.evaluate(()=>localStorage.getItem('duvera.2048.bestScore')==='1234'));
  await page.keyboard.press('r');await page.waitForTimeout(250);
  check('R restarts 2048',await f.evaluate(()=>JSON.parse(localStorage.getItem('duvera.moosher.2048.gameState')).score===0));

  f=await open('hextris');await f.locator('#startBtn').waitFor({state:'visible'});await shot('moosh-spin-title');
  await f.locator('#startBtn').click();await f.waitForFunction(()=>gameState===1);
  check('mouse Play does not rotate Spin',await f.evaluate(()=>MainHex.position===0));
  await page.waitForTimeout(100);await page.keyboard.press('ArrowLeft');
  check('left key rotates Spin',await f.evaluate(()=>MainHex.position===1));
  await page.waitForTimeout(100);await page.keyboard.press('ArrowRight');
  check('right key rotates Spin',await f.evaluate(()=>MainHex.position===0));
  await f.waitForFunction(()=>blocks.length>0,null,{timeout:10000});
  check('Spin falling blocks spawn',true);
  await page.keyboard.press('p');await f.waitForFunction(()=>gameState===-1);
  const pos=await f.evaluate(()=>MainHex.position);await page.keyboard.press('ArrowLeft');
  check('pause blocks keyboard rotation',await f.evaluate(()=>MainHex.position)===pos);
  await page.waitForTimeout(500);await page.keyboard.press('p');await f.waitForFunction(()=>gameState===1);
  // Deterministic matching fixture using the actual Block, consolidation, score and end-state code.
  check('three matching blocks score',await f.evaluate(()=>{MainHex.blocks=Array.from({length:6},()=>[]);MainHex.blocks[0]=[0,1,2].map(i=>new Block(0,colors[0],1,100+i*20,1));const prev=score;consolidateBlocks(MainHex,0,0);return score>prev&&MainHex.blocks[0].every(b=>b.deleted===1);}));
  await shot('moosh-spin-playing');
  await f.evaluate(()=>{MainHex.blocks=Array.from({length:6},()=>[]);MainHex.blocks[0]=Array.from({length:settings.rows+1},(_,i)=>{const b=new Block(0,colors[i%colors.length],1,100+i*20,1);b.checked=0;return b;});});
  await f.waitForFunction(()=>gameState===2,null,{timeout:5000});
  check('Spin reaches game over',true);
  check('Spin scores isolated',await f.evaluate(()=>localStorage.getItem('duvera.hextris.moosher.highscores')!==null&&localStorage.getItem('duvera.hextris.highscores')===null));

  await page.goto(base+'creators/moosher/sounds.html');
  check('four provisional clips and timestamp links',await page.locator('.clip').count()===4&&await page.locator('.clip a[href*="&t="]').count()===4);
  check('review has no autoplay',await page.evaluate(()=>testVoices.length===0));
  await page.locator('.clip button').first().click();
  await page.waitForFunction(()=>testVoices[0]?.readyState>=2);
  check('review preview decodes and plays audio',await page.evaluate(()=>!testVoices[0].paused&&testVoices[0].duration>0));
  await page.locator('#stop-audio').click();check('Stop preview pauses clip',await page.evaluate(()=>testVoices.every(a=>a.paused)));
  await page.locator('[data-clip="hello"]').uncheck();await page.locator('#voice-volume').fill('0');await page.reload();
  check('volume and disabled preference persist',await page.evaluate(()=>CreatorAudio.settings().volume===0&&CreatorAudio.settings().disabled.includes('hello')));
  await page.locator('.clip button').first().click();check('volume zero prevents preview',await page.evaluate(()=>testVoices.length===0));
  await page.locator('#voice-volume').fill('55');await page.locator('#mute-voices').check();
  f=await open('2048');await f.waitForSelector('.tile');
  check('voice off carries across navigation',await f.evaluate(()=>CreatorAudio.settings().muted));
  await page.locator('#creator-voice').click();await page.reload();f=await frame();await f.waitForSelector('.tile');
  check('voice on survives refresh',await f.evaluate(()=>!CreatorAudio.settings().muted));
  await page.keyboard.press('ArrowLeft');
  check('disabled greeting does not play',await f.evaluate(()=>testVoices.length===0));

  await home();await page.getByRole('link',{name:'Duvera Arcade',exact:true}).click();
  await page.locator('.game-card[href*="2048"]').click();f=await frame();await f.waitForSelector('.tile');
  check('generic navigation retains opt-out',await f.evaluate(()=>ArcadeCreator===null)&&await page.title()==='2048 · Duvera Arcade');
  await page.locator('.back-link').click();
  await page.locator('.game-card').first().waitFor({state:'visible'});
  check('generic back navigation retains opt-out',await page.locator('.game-card').count()===4);
  check('no browser errors or failed asset requests',errors.length===0);
  console.log(`${passed} desktop checks passed; no human audio approval implied.`);
} finally {if(errors.length)console.error(errors);await browser.close();server?.kill();}
