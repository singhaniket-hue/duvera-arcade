import {BlastGame,COLS,ROWS,FUSE} from './engine.mjs';
import {setupGame} from '../../assets/mini-game.js';
const ui=setupGame('blast','Blast'),$=s=>document.querySelector(s),canvas=$('canvas'),ctx=canvas.getContext('2d');
const overlay=$('#overlay'),action=$('#action'),mode=$('#mode'),pause=$('#pause'),keys=new Set(),touch=new Map();
let game=new BlastGame(),last=0,wins=ui.read('wins'),processed=false,particles=[],flash=0;
window.blastGame=game;
if(window.self!==window.top){document.body.classList.add('embedded');$('.scorebar').append(pause);}
$('#wins').textContent=wins;
const faces=['focus','surprise','laugh','smile'].map(name=>{const img=new Image();if(ui.profile)img.src=ui.profile.assets+'emote-'+name+'.png';return img;});
const colors=['#76ddbf','#f3cb65','#ea967f','#b2a0e2'];
function clearInput(){keys.clear();touch.clear();}
function showOverlay(title,message,label){$('#headline').textContent=title;$('#message').textContent=message;action.textContent=label;overlay.hidden=false;$('#options').hidden=game.status==='paused';$('#start-hint').hidden=game.status!=='ready';}
function start(){clearInput();if(game.status==='paused'){game.pause();overlay.hidden=true;pause.textContent='Ⅱ';pause.setAttribute('aria-label','Pause game');canvas.focus();return;}
 game=new BlastGame({mode:mode.value});window.blastGame=game;game.start();processed=false;particles=[];overlay.hidden=true;pause.disabled=false;$('#bomb').disabled=false;ui.expression('idle');$('#keyboard-help').innerHTML=game.mode==='duo'?'P1: WASD + Space<br>P2: arrows + Enter<br>P to pause · M for voice':'Move: arrows / WASD<br>Bomb: Space · Pause: P<br>Voice: M';canvas.focus();}
function togglePause(){if(!['playing','paused'].includes(game.status))return;if(game.status==='paused'){start();return;}game.pause();clearInput();window.CreatorAudio?.stop();showOverlay('Take a breather.','The arena is paused. Your fuse timers are frozen.','Back to the arena');pause.textContent='▶';pause.setAttribute('aria-label','Resume game');}
action.onclick=start;pause.onclick=togglePause;
function finish(){if(processed)return;processed=true;clearInput();pause.disabled=true;$('#bomb').disabled=true;const win=game.result===0,second=game.result===1&&game.mode==='duo';
 if(win&&game.mode==='solo'){wins++;$('#wins').textContent=wins;if(!ui.write('wins',wins))$('#storage-note').hidden=false;}
 ui.expression(win||second?'win':'lose');ui.react(win||second?'win':'lose');
 const title=game.mode==='solo'?(win?'You own the arena.':game.actors[0].alive?'Time’s up.':'Caught in the blast.'):(game.result===null?'No winner this round.':game.result<2?'Player '+(game.result+1)+' takes it!':'The bots take this one.');
 showOverlay(title,game.time>=180?'The three-minute limit is up. Try another arena.':win||second?'Good timing. Better escape routes. Ready for another?':'Every bomb has a way out—until it doesn’t. Try a different route.','Play again ↗');}
const wasd={KeyW:0,KeyD:1,KeyS:2,KeyA:3},arrows={ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3};
addEventListener('keydown',e=>{if(e.target.matches('select,input,textarea'))return;
 const control=e.code in wasd||e.code in arrows||['Space','Enter','KeyP','Escape','KeyM'].includes(e.code);if(!control)return;
 if(e.target.tagName==='BUTTON'&&['Space','Enter'].includes(e.code))return;e.preventDefault();
 if(e.code==='KeyM'&&!e.repeat){if(ui.profile)$('#voice').click();return;}
 if(['KeyP','Escape'].includes(e.code)&&!e.repeat){togglePause();return;}
 if(e.code==='Space'&&!e.repeat){if(game.status==='ready'||game.status==='over')start();else if(game.status==='playing')game.plant(0);return;}
 if(e.code==='Enter'&&!e.repeat&&game.mode==='duo'){game.plant(1);return;}
 if(game.status==='playing'){
  keys.add(e.code);
  // A short key tap must move even when keydown and keyup fall between frames.
  if(!e.repeat&&e.code in wasd)game.move(0,wasd[e.code]);
  if(!e.repeat&&e.code in arrows)game.move(game.mode==='duo'?1:0,arrows[e.code]);
 }
});addEventListener('keyup',e=>keys.delete(e.code));
for(const b of document.querySelectorAll('[data-dir]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);touch.set(e.pointerId,Number(b.dataset.dir));game.move(0,Number(b.dataset.dir));});for(const n of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(n,e=>touch.delete(e.pointerId));}
$('#bomb').addEventListener('pointerdown',e=>{e.preventDefault();if(game.status==='playing')game.plant(0);});
$('#bomb').addEventListener('click',e=>{if(e.detail===0&&game.status==='playing')game.plant(0);});
addEventListener('blur',()=>{clearInput();if(game.status==='playing')togglePause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(game.status==='playing')togglePause();}});
function input(){if(game.status!=='playing')return;let one=null,two=null;for(const code of keys){if(code in wasd)one=wasd[code];if(code in arrows){if(game.mode==='duo')two=arrows[code];else one=arrows[code];}}
 for(const dir of touch.values())one=dir;if(one!==null)game.move(0,one);if(two!==null)game.move(1,two);}
function rect(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
const S=64;
function draw(t){ctx.clearRect(0,0,canvas.width,canvas.height);
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const px=x*S,py=y*S,tile=game.grid[y][x];rect(px,py,S,S,0,(x+y)%2?'#233d34':'#284439');
  if(tile===1){rect(px+3,py+6,58,57,8,'#112823');rect(px+3,py+2,58,53,8,'#486858');rect(px+8,py+6,48,6,3,'#65806b');rect(px+9,py+16,46,34,4,'#3c5b4a');ctx.fillStyle='#365240';ctx.fillRect(px+30,py+17,3,32);}
  if(tile===2){rect(px+5,py+8,54,54,6,'#583d2b');rect(px+5,py+3,54,52,6,'#b88752');rect(px+10,py+8,44,41,3,'#8f673f');ctx.strokeStyle='#d6aa6c';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(px+13,py+12);ctx.lineTo(px+50,py+44);ctx.moveTo(px+50,py+12);ctx.lineTo(px+13,py+44);ctx.stroke();ctx.fillStyle='#ebc68a';for(const [dx,dy]of [[10,8],[50,8],[10,47],[50,47]])ctx.fillRect(px+dx,py+dy,3,3);}
 }
 for(const [k,item]of game.items){const x=k%COLS,y=Math.floor(k/COLS);if(game.onFire(x,y))continue;const dy=Math.sin(t*3+x)*2;rect(x*S+13,y*S+14+dy,38,38,9,item==='range'?'#efa07f':item==='bomb'?'#83d5b5':'#efd06e');ctx.fillStyle='#193d30';ctx.font='bold 32px sans-serif';ctx.textAlign='center';ctx.fillText(item==='range'?'✦':item==='bomb'?'+':'»',x*S+32,y*S+44+dy);}
 for(const b of game.bombs){const cx=b.x*S+32,cy=b.y*S+35,progress=Math.max(0,(b.at-game.time)/FUSE),pulse=1+Math.sin(game.time*(progress<.3?35:12))*.05;ctx.save();ctx.translate(cx,cy);ctx.scale(pulse,pulse);ctx.fillStyle='#081913';ctx.beginPath();ctx.ellipse(0,17,24,8,0,0,7);ctx.fill();ctx.fillStyle='#1a2429';ctx.strokeStyle=colors[b.owner];ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,20,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#55696a';ctx.beginPath();ctx.arc(-7,-7,6,0,7);ctx.fill();ctx.strokeStyle='#efc462';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(4,-18);ctx.quadraticCurveTo(3,-30,12,-24);ctx.stroke();ctx.fillStyle='#ffdf78';ctx.beginPath();ctx.arc(12,-24,3+Math.sin(game.time*24)*2,0,7);ctx.fill();ctx.restore();ctx.strokeStyle='#f5cf68';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,25,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);ctx.stroke();}
 for(const f of game.flames){const fade=(f.until-game.time)/.55;ctx.globalAlpha=Math.min(1,fade*2);rect(f.x*S+2,f.y*S+2,60,60,10,'#f07f48');rect(f.x*S+8,f.y*S+8,48,48,12,'#ffd773');rect(f.x*S+22,f.y*S+4,20,56,6,'#fff0b0');rect(f.x*S+4,f.y*S+22,56,20,6,'#fff0b0');ctx.globalAlpha=1;}
 for(const a of game.actors){if(!a.alive)continue;const p=Math.min(1,(game.time-a.movedAt)/.085),cx=(a.fromX+(a.x-a.fromX)*p)*S+32,cy=(a.fromY+(a.y-a.fromY)*p)*S+30;ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(cx,cy+23,22,7,0,0,7);ctx.fill();rect(cx-16,cy-1,32,29,9,colors[a.id]);rect(cx-17,cy+21,13,9,4,'#173529');rect(cx+4,cy+21,13,9,4,'#173529');
  if(faces[a.id].complete&&faces[a.id].naturalWidth)ctx.drawImage(faces[a.id],cx-26,cy-27,52,52);else{rect(cx-20,cy-22,40,33,11,colors[a.id]);rect(cx-14,cy-13,28,16,7,'#17362f');ctx.fillStyle='#fff4d8';ctx.fillRect(cx-9,cy-9,5,7);ctx.fillRect(cx+5,cy-9,5,7);}
  ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff2c9';ctx.fillText(a.bot?'BOT':game.mode==='duo'?'P'+(a.id+1):'YOU',cx,cy-28);
 }
 for(const p of particles){ctx.globalAlpha=Math.max(0,p.life);rect(p.x,p.y,p.size,p.size,2,p.color);}ctx.globalAlpha=1;
 if(flash>0&&!matchMedia('(prefers-reduced-motion: reduce)').matches){ctx.fillStyle=`rgba(255,220,140,${flash*.12})`;ctx.fillRect(0,0,832,704);}
}
function frame(ms){const dt=Math.min(.05,(ms-last)/1000||0);last=ms;input();game.step(dt);
 for(const e of game.events.splice(0)){if(e.type==='start')ui.react('start');if(e.type==='power'&&e.id===0){ui.react('milestone');$('#round-status').textContent=e.item==='range'?'Longer blast. Give it more room.':e.item==='bomb'?'Extra bomb ready.':'A little quicker on your feet.';}
  if(e.type==='blast'){flash=.7;for(let i=0;i<10;i++)particles.push({x:e.x*S+32,y:e.y*S+32,vx:Math.cos(i*2.4)*100,vy:Math.sin(i*2.4)*100,life:.7,size:4+i%3,color:i%2?'#ffc86b':'#e5925e'});}
 }
 if(game.status!=='paused'){flash=Math.max(0,flash-dt*3);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);}
 if(game.status==='over')finish();const a=game.actors[0],seconds=Math.max(0,Math.ceil(180-game.time));$('#timer').textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');$('#alive').textContent=game.actors.filter(a=>a.alive).length+' IN ARENA';$('#capacity').textContent=a.capacity;$('#range').textContent=a.range;draw(ms/1000);requestAnimationFrame(frame);}
requestAnimationFrame(frame);
