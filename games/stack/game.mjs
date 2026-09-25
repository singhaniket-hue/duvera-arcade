import {Stack} from './engine.mjs';
import {setupGame} from '../../assets/mini-game.js';
const ui=setupGame('stack','Stack'), game=new Stack();
const $=s=>document.querySelector(s),canvas=$('canvas'),ctx=canvas.getContext('2d');
let best=ui.read('best'),previousBest=best,offcuts=[],last=0,camera=0,viewHeight=520;
$('#best').textContent=best;
// Exposes the engine for focused deterministic edge-case tests; no debug URL or input shortcut.
window.stackGame=game;
function overlay(title,message,button){$('#headline').textContent=title;$('#message').textContent=message;$('#action').textContent=button;$('#overlay').hidden=false;}
function start(){game.start();previousBest=best;offcuts=[];camera=0;$('#score').textContent=0;$('#overlay').hidden=true;$('#pause').disabled=false;$('#drop').disabled=false;$('#reaction').textContent='Find the centre.';ui.expression('idle');ui.react('start');}
function pause(){if(game.status!=='playing')return;game.pause();window.CreatorAudio?.stop();$('#drop').disabled=true;overlay('Paused','Resume to drop the next block.','Resume');}
function resume(){game.resume();last=performance.now();$('#overlay').hidden=true;$('#drop').disabled=false;}
function drop(){const result=game.drop();if(!result)return;
  if(result.offcut)offcuts.push({...result.offcut,y:0,velocity:0,angle:0});
  if(result.kind==='miss'){
    $('#pause').disabled=true;$('#drop').disabled=true;ui.expression('lose');
    $('#reaction').textContent='One more try?';
    overlay(game.score>previousBest?'A new personal best!':'Tower missed.',`${game.score} blocks · best perfect streak ${game.bestStreak}`,'Try again');
    ui.react(game.score>previousBest?'win':'lose');return;
  }
  $('#score').textContent=game.score;
  if(game.score>best){best=game.score;$('#best').textContent=best;if(!ui.write('best',best))$('#storage-note').hidden=false;}
  $('#reaction').textContent=result.kind==='perfect'?`Perfect! ×${game.streak}`:'Keep it balanced.';
  ui.expression(game.streak>=3?'streak':'idle');
  if(game.score%10===0||game.streak===3)ui.react('milestone');
}
$('#action').onclick=()=>game.status==='paused'?resume():start();
$('#drop').onclick=drop;canvas.addEventListener('pointerdown',e=>{e.preventDefault();drop();});
$('#pause').onclick=pause;
document.addEventListener('keydown',e=>{
  if(e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.code==='Space'&&!e.target.closest('button,a,input')){e.preventDefault();if(game.status==='playing')drop();else if(game.status==='paused')resume();else start();}
  if(e.code==='KeyP'){e.preventDefault();if(game.status==='paused')resume();else pause();}
  if(e.code==='KeyM'&&window.CreatorAudio)$('#voice').click();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
window.addEventListener('pagehide',pause);
const colours=()=>[getComputedStyle(document.documentElement).getPropertyValue('--teal').trim(),getComputedStyle(document.documentElement).getPropertyValue('--coral').trim(),getComputedStyle(document.documentElement).getPropertyValue('--gold').trim()];
const palette=colours();
function resize(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);viewHeight=360*rect.height/Math.max(rect.width,1);}
new ResizeObserver(resize).observe(canvas);resize();
function block(b,yOffset=0,angle=0){const y=viewHeight-28-b.level*22+camera+yOffset;ctx.save();ctx.translate(b.x+b.width/2,y+10);ctx.rotate(angle);ctx.fillStyle=palette[b.level%palette.length];ctx.strokeStyle='#173e38';ctx.lineWidth=1.5;ctx.fillRect(-b.width/2,-10,b.width,20);ctx.strokeRect(-b.width/2,-10,b.width,20);ctx.fillStyle='#ffffff45';ctx.fillRect(-b.width/2+2,-8,Math.max(0,b.width-4),4);ctx.restore();}
function frame(now){const dt=Math.min((now-last)/1000||0,.05);last=now;game.step(dt);
  if(game.status==='playing'||game.status==='over'){
    offcuts.forEach(o=>{o.velocity+=650*dt;o.y+=o.velocity*dt;o.angle+=dt*(o.x<180?-1:1);});offcuts=offcuts.filter(o=>o.y<viewHeight+120);
  }
  camera+=(Math.max(0,(game.score+2)*22-viewHeight*.62)-camera)*Math.min(1,dt*8);
  ctx.setTransform(canvas.width/360,0,0,canvas.width/360,0,0);ctx.clearRect(0,0,360,viewHeight);
  ctx.strokeStyle='#173e3818';ctx.setLineDash([3,7]);ctx.beginPath();ctx.moveTo(180,0);ctx.lineTo(180,viewHeight);ctx.stroke();ctx.setLineDash([]);
  game.blocks.forEach(b=>block(b));if(game.status!=='over')block(game.moving);
  offcuts.forEach(o=>block(o,o.y,o.angle));requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
