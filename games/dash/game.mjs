import {Dash,GROUND} from './engine.mjs';
import {setupGame} from '../../assets/mini-game.js';
const ui=setupGame('dash','Dash'),game=new Dash(),$=s=>document.querySelector(s),canvas=$('canvas'),ctx=canvas.getContext('2d');
if(self!==top)document.body.classList.add('embedded');
if(ui.theme.tagline)document.querySelector('.eyebrow').textContent=ui.theme.tagline;
let best=ui.read('best'),previousBest=best,last=0,milestone=0;
$('#best').textContent=best;window.dashGame=game;
const faces={};for(const [state,file]of Object.entries(ui.theme.faces||{})){const img=new Image();img.src=ui.profile.assets+file;faces[state]=img;}
const colour=key=>getComputedStyle(document.documentElement).getPropertyValue('--'+key).trim();const palette={teal:colour('teal'),cream:colour('cream'),coral:colour('coral'),gold:colour('gold'),ink:colour('ink'),mint:colour('mint')};
function overlay(title,message,action){$('#headline').textContent=title;$('#message').textContent=message;$('#action').textContent=action;$('#overlay').hidden=false;}
function update(){for(const key of ['score','coins'])$('#'+key).textContent=game[key];if(game.score>best){best=game.score;$('#best').textContent=best;}}
function save(){if(!ui.write('best',best))$('#storage-note').hidden=false;}
function start(){game.start();previousBest=best;milestone=0;last=performance.now();$('#overlay').hidden=true;for(const id of ['pause','jump','duck'])$('#'+id).disabled=false;ui.react('start');update();}
function pause(){if(game.status!=='playing')return;game.pause();save();window.CreatorAudio?.stop();$('#jump').disabled=true;$('#duck').disabled=true;overlay('Taking a breather.','Resume when you’re ready.','Resume');}
function resume(){game.resume();last=performance.now();$('#overlay').hidden=true;$('#jump').disabled=false;$('#duck').disabled=false;}
function finish(){update();save();for(const id of ['pause','jump','duck'])$('#'+id).disabled=true;overlay(game.score>previousBest?'A new personal best!':'One more run?',`${game.score} points · ${game.coins} stars`,'Try again');ui.react(game.score>previousBest?'win':'lose');}
$('#action').onclick=()=>game.status==='paused'?resume():start();$('#pause').onclick=pause;$('#jump').onclick=()=>game.jump();
$('#duck').addEventListener('pointerdown',e=>{e.preventDefault();$('#duck').setPointerCapture(e.pointerId);game.duck(true);});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('#duck').addEventListener(event,()=>game.duck(false));
canvas.addEventListener('pointerdown',e=>{e.preventDefault();game.jump();});
document.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.target.closest('a,input'))return;
 if(['Space','ArrowUp','KeyW'].includes(e.code)&&!e.target.closest('button')){e.preventDefault();if(game.status==='ready'||game.status==='over')start();else game.jump();}
 if(['ArrowDown','KeyS'].includes(e.code)){e.preventDefault();game.duck(true);}
 if(e.code==='KeyP'){e.preventDefault();game.status==='paused'?resume():pause();}
 if(e.code==='KeyM'&&window.CreatorAudio)$('#voice').click();
});
document.addEventListener('keyup',e=>{if(['ArrowDown','KeyS'].includes(e.code))game.duck(false);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',()=>game.duck(false));window.addEventListener('pagehide',pause);
function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=r.width*dpr;canvas.height=r.height*dpr;}
new ResizeObserver(resize).observe(canvas);resize();
function star(x,y,r){ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rad=i%2?r*.45:r;ctx.lineTo(x+Math.cos(a)*rad,y+Math.sin(a)*rad);}ctx.closePath();ctx.fillStyle=palette.gold;ctx.fill();ctx.strokeStyle=palette.ink;ctx.lineWidth=2;ctx.stroke();}
function draw(now){const dt=Math.min((now-last)/1000||0,.1);last=now;const before=game.status;game.step(dt);if(before==='playing'){update();if(game.status==='over')finish();const next=Math.floor(game.score/250);if(next>milestone&&game.status==='playing'){milestone=next;ui.react('milestone');}}
 // Preserve aspect ratio. Portrait uses a taller sky, never a stretched runner.
 const worldWidth=canvas.width/canvas.height<1.2?420:720;const scale=canvas.width/worldWidth,worldHeight=canvas.height/scale,offset=Math.max(0,worldHeight-320);ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,720,worldHeight);
 ctx.fillStyle=palette.mint;ctx.fillRect(0,0,720,worldHeight);ctx.fillStyle=palette.cream;ctx.globalAlpha=.5;
 for(let i=0;i<5;i++){const x=((i*185-game.distance*.12)%930+930)%930-100;ctx.beginPath();ctx.ellipse(x,offset+75+(i%2)*25,60,16,0,0,Math.PI*2);ctx.fill();}
 // In short views scale the full world uniformly into the available height.
 ctx.globalAlpha=1;const fit=Math.min(1,worldHeight/320);ctx.save();ctx.translate(0,offset);if(fit<1){ctx.scale(fit,fit);ctx.translate((720/fit-720)/2,0);}
 ctx.globalAlpha=.18;ctx.fillStyle=palette.teal;ctx.beginPath();ctx.moveTo(0,GROUND);ctx.bezierCurveTo(80,GROUND-110,140,GROUND-80,240,GROUND-20);ctx.bezierCurveTo(370,GROUND-150,480,GROUND-90,720,GROUND-45);ctx.lineTo(720,GROUND);ctx.closePath();ctx.fill();
 ctx.globalAlpha=1;ctx.fillStyle=palette.cream;ctx.fillRect(0,GROUND,720,70);ctx.strokeStyle=palette.ink;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,GROUND);ctx.lineTo(720,GROUND);ctx.stroke();
 ctx.strokeStyle='#173e3830';for(let i=0;i<15;i++){const x=(i*60-game.distance*.6)%900;ctx.beginPath();ctx.moveTo(x,GROUND+23);ctx.lineTo(x+25,GROUND+23);ctx.stroke();}
 for(const o of game.obstacles){ctx.fillStyle=o.type==='crate'?palette.coral:palette.teal;ctx.strokeStyle=palette.ink;ctx.lineWidth=3;ctx.fillRect(o.x,o.y,o.width,o.height);ctx.strokeRect(o.x,o.y,o.width,o.height);ctx.fillStyle=o.type==='crate'?palette.ink:palette.cream;ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText(o.type==='crate'?'JUMP':'DUCK',o.x+o.width/2,o.y+o.height/2+4);if(o.type==='arch'){ctx.strokeStyle=palette.teal;ctx.beginPath();ctx.moveTo(o.x+o.width/2,o.y);ctx.lineTo(o.x+o.width/2,0);ctx.stroke();}}
 for(const c of game.pickups)star(c.x,c.y,12);
 const p=game.player,duck=game.ducking&&game.y===0,cx=p.x+p.width/2,foot=GROUND-game.y,phase=game.status==='playing'&&game.y===0?Math.sin(game.time*18)*9:0;
 ctx.strokeStyle=palette.ink;ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx,foot-18);ctx.lineTo(cx-9-phase,foot);ctx.moveTo(cx+2,foot-18);ctx.lineTo(cx+10+phase,foot);ctx.stroke();
 ctx.fillStyle=game.status==='over'?palette.coral:palette.teal;ctx.beginPath();ctx.roundRect(cx-15,foot-(duck?29:45),30,duck?18:30,8);ctx.fill();
 ctx.strokeStyle=palette.ink;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(cx-13,foot-(duck?23:38));ctx.lineTo(cx-22+phase,foot-(duck?14:26));ctx.moveTo(cx+13,foot-(duck?23:38));ctx.lineTo(cx+23-phase,foot-(duck?15:28));ctx.stroke();
 const face=faces[game.status==='over'?'hit':game.y>0?'jump':'run'];const size=duck?34:46,headY=foot-(duck?50:86);if(face?.complete&&face.naturalWidth)ctx.drawImage(face,cx-size/2,headY,size,size);else{ctx.fillStyle=palette.gold;ctx.beginPath();ctx.arc(cx,headY+size/2,size/2,0,Math.PI*2);ctx.fill();ctx.fillStyle=palette.ink;ctx.fillRect(cx-9,headY+17,5,5);ctx.fillRect(cx+4,headY+17,5,5);}
 if(game.status==='playing'&&game.time<3){ctx.fillStyle=palette.ink;ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.fillText('A little warm-up. Try a jump!',worldWidth/2,110);}
 ctx.restore();requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
