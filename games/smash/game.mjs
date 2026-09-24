import {Smash,WIDTH,HEIGHT,PADDLE_Y} from './engine.mjs';
import {setupGame} from '../../assets/mini-game.js';
const ui=setupGame('smash','Smash'),game=new Smash(),$=s=>document.querySelector(s),canvas=$('canvas'),ctx=canvas.getContext('2d');
if(self!==top)document.body.classList.add('embedded');
let unlocked=Math.min(5,Math.max(1,Math.floor(ui.read('unlocked',1)))),last=0,scale=1,offsetX=0,offsetY=0,milestone=0;
window.smashGame=game;
const colour=key=>getComputedStyle(document.documentElement).getPropertyValue('--'+key).trim();const colours=[colour('teal'),colour('coral'),colour('gold')],ink=colour('ink'),cream=colour('cream');
function levels(){const select=$('#select-level');select.replaceChildren();for(let i=1;i<=unlocked;i++){const o=document.createElement('option');o.value=i;o.textContent='Level '+i;select.append(o);}select.value=unlocked;}
levels();
function hud(){$('#restart').disabled=game.status==='menu';for(const id of ['level','score','lives'])$('#'+id).textContent=game[id];$('#launch').disabled=game.status!=='ready';$('#pause').disabled=!['ready','playing'].includes(game.status);$('#power').textContent=[game.time<game.wideUntil?'Wide paddle':'',game.time<game.slowUntil?'Slow ball':''].filter(Boolean).join(' · ');}
function overlay(title,message,action){$('#headline').textContent=title;$('#message').textContent=message;$('#action').textContent=action;$('#overlay').hidden=false;}
function start(level){game.reset(level);milestone=0;last=performance.now();$('#overlay').hidden=true;$('#level-label').hidden=true;$('#reaction').textContent='Ready for a good bounce?';ui.expression('idle');ui.react('start');hud();}
function pause(){if(!['playing','ready'].includes(game.status))return;game.pause();window.CreatorAudio?.stop();overlay('Hold that thought.','Your ball is waiting.','Resume');hud();}
function resume(){game.resume();last=performance.now();$('#overlay').hidden=true;hud();}
function finish(){
 if(game.status==='level'||game.status==='won'){
  unlocked=Math.max(unlocked,Math.min(5,game.level+1));if(!ui.write('unlocked',unlocked))$('#storage-note').hidden=false;levels();
  overlay(game.status==='won'?'All five. Nicely done!':'Level cleared!',`${game.score} points · ${game.lives} lives left`,game.status==='won'?'Play again':'Next level');ui.expression('win');ui.react('win');$('#reaction').textContent='A clean sweep.';
 }else{overlay('One more go?',`${game.score} points · Level ${game.level}`,'Try again');ui.expression('lose');ui.react('lose');$('#reaction').textContent='You had a good run.';}
 hud();
}
$('#action').onclick=()=>{if(game.status==='paused')resume();else if(game.status==='level'){game.next();$('#overlay').hidden=true;milestone=0;ui.expression('idle');hud();}else start(game.status==='menu'?Number($('#select-level').value):game.status==='won'?1:game.level);};
$('#pause').onclick=pause;$('#restart').onclick=()=>start(game.level);$('#launch').onclick=()=>{game.launch();hud();};
function pointer(e){const r=canvas.getBoundingClientRect();game.movePaddle(((e.clientX-r.left)*(canvas.width/r.width)-offsetX)/scale);}
canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);pointer(e);if(game.status==='ready'){game.launch();hud();}});canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||e.buttons)pointer(e);});
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.target.closest('a,input,select'))return;
 if(e.code==='ArrowLeft'||e.code==='ArrowRight'){e.preventDefault();game.direction=e.code==='ArrowLeft'?-1:1;}
 if(e.code==='Space'&&!e.repeat&&!e.target.closest('button')){e.preventDefault();game.launch();hud();}
 if(e.code==='KeyP'&&!e.repeat){e.preventDefault();game.status==='paused'?resume():pause();}
 if(e.code==='KeyM'&&!e.repeat&&window.CreatorAudio)$('#voice').click();
});
document.addEventListener('keyup',e=>{if(['ArrowLeft','ArrowRight'].includes(e.code))game.direction=0;});window.addEventListener('blur',()=>{game.direction=0;});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('pagehide',pause);
function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=r.width*dpr;canvas.height=r.height*dpr;scale=Math.min(canvas.width/WIDTH,canvas.height/HEIGHT);offsetX=(canvas.width-WIDTH*scale)/2;offsetY=(canvas.height-HEIGHT*scale)/2;}
new ResizeObserver(resize).observe(canvas);resize();
function frame(now){const dt=Math.min((now-last)/1000||0,.1);last=now;const before=game.status,lifeBefore=game.lives;game.step(dt);if(before==='playing'&&['over','level','won'].includes(game.status))finish();else if(game.lives<lifeBefore){$('#reaction').textContent=`${game.lives} lives. Try a fresh angle.`;ui.expression('lose');ui.react('lose');}
 if(game.status==='playing'&&Math.floor(game.broken/12)>milestone){milestone=Math.floor(game.broken/12);ui.react('milestone');ui.expression('idle');}
 hud();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.setTransform(scale,0,0,scale,offsetX,offsetY);ctx.fillStyle=cream;ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.strokeRect(1,1,WIDTH-2,HEIGHT-2);
 for(const b of game.bricks){if(!b.hp)continue;ctx.fillStyle=colours[Math.floor(b.y/25)%3];ctx.fillRect(b.x,b.y,b.width,b.height);ctx.strokeStyle=ink;ctx.strokeRect(b.x,b.y,b.width,b.height);if(b.hp>1){ctx.fillStyle=cream;ctx.fillRect(b.x+8,b.y+7,b.width-16,4);}}
 ctx.fillStyle=colours[0];ctx.beginPath();ctx.roundRect(game.paddle-game.paddleWidth/2,PADDLE_Y,game.paddleWidth,12,6);ctx.fill();ctx.strokeStyle=ink;ctx.stroke();
 ctx.fillStyle=colours[1];ctx.beginPath();ctx.arc(game.ball.x,game.ball.y,game.ball.radius,0,Math.PI*2);ctx.fill();ctx.stroke();
 for(const d of game.drops){ctx.fillStyle=colours[2];ctx.fillRect(d.x-10,d.y-10,20,20);ctx.strokeRect(d.x-10,d.y-10,20,20);ctx.fillStyle=ink;ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText({wide:'W',slow:'S',life:'+'}[d.type],d.x,d.y+5);}
 if(game.status==='ready'){ctx.fillStyle=ink;ctx.textAlign='center';ctx.font='bold 16px sans-serif';ctx.fillText('Space / tap to launch',WIDTH/2,HEIGHT-72);}
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
