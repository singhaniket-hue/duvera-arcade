import {setupGame} from '../../assets/mini-game.js';
import {PartyClient} from '../../assets/party-client.mjs';
const ui=setupGame('draw','Draw'),$=s=>document.querySelector(s),canvas=$('#canvas'),ctx=canvas.getContext('2d');
const colors=['#173e38','#e34c4c','#e9b826','#25844b','#2478ce','#a753c6','#ffffff'];
let state=null,drawing=[],color=colors[0],stroke=null,batch=[],seq=0,revealed=false,lastPhase='',lastRound='',timerOffset=0;
const notice=s=>$('#notice').textContent=s;
const client=new PartyClient('draw',render,ink,notice);if(self!==top)$('main').classList.add('embedded');
const avatars=ui.theme.avatars||[];for(let i=0;i<6;i++){const o=document.createElement('option');o.value=i;o.textContent=['Focus','Surprise','Smile','Win','Sad','Laugh'][i];$('#avatar').append(o);}
for(const [i,c]of colors.entries()){const b=document.createElement('button');b.style.background=c;b.setAttribute('aria-label',['Ink','Red','Yellow','Green','Blue','Purple','White'][i]);b.setAttribute('aria-pressed',String(i===0));b.onclick=()=>{color=c;for(const x of $('#palette').children)x.setAttribute('aria-pressed',String(x===b));};$('#palette').append(b);}
function repaint(){ctx.fillStyle='white';ctx.fillRect(0,0,800,600);for(const s of drawing){ctx.strokeStyle=s.color;ctx.fillStyle=s.color;ctx.lineWidth=s.size;ctx.lineCap='round';ctx.lineJoin='round';if(s.points.length===1){ctx.beginPath();ctx.arc(s.points[0][0]*800,s.points[0][1]*600,s.size/2,0,Math.PI*2);ctx.fill();}else{ctx.beginPath();s.points.forEach(([x,y],i)=>i?ctx.lineTo(x*800,y*600):ctx.moveTo(x*800,y*600));ctx.stroke();}}}
function ink(m){if(m.canvasVersion!==state?.canvasVersion)return;let s=drawing.find(x=>x.id===m.stroke);if(!s){s={id:m.stroke,color:m.color,size:m.size,seq:0,points:[]};drawing.push(s);}if(m.seq<s.seq)return;if(m.seq!==s.seq){client.sync();return;}s.seq++;s.points.push(...m.points);repaint();}
function canDraw(){return state?.phase==='drawing'&&state.you===state.drawer&&client.socket?.readyState===1;}
function secret(){const available=state?.you===state?.drawer&&['choose','drawing'].includes(state?.phase);$('#secret').hidden=!available||($('#streamer').checked&&!revealed);$('#reveal-secret').hidden=!available||!$('#streamer').checked;$('#stream-controls').hidden=!available;}
function render(s){
 if(state?.canvasVersion!==s.canvasVersion){stroke=null;batch=[];drawing=[];}state=s;$('#room').dataset.active=String(!['lobby','finished'].includes(s.phase));document.querySelector('.tools').hidden=s.you!==s.drawer||s.phase!=='drawing';timerOffset=s.serverNow-Date.now();$('#timer').textContent=s.deadline?Math.max(0,Math.ceil((s.deadline-s.serverNow)/1000))+'s':'';if(s.drawing)drawing=structuredClone(s.drawing);repaint();$('#room').hidden=false;$('#lobby').hidden=true;
 $('#host-tools').hidden=s.host!==s.you;$('#start').disabled=!['lobby','finished','paused'].includes(s.phase);$('#start').textContent=s.phase==='paused'?'Resume match':s.phase==='finished'?'Rematch':'Start match';$('#skip').disabled=!['choose','drawing','reveal'].includes(s.phase);$('#lock').textContent=s.locked?'Unlock room':'Lock room';$('#pack').disabled=!['lobby','finished'].includes(s.phase);$('#save-pack').disabled=$('#pack').disabled;
 $('#phase').textContent=({lobby:'Gather your friends',choose:'Choose a word',drawing:'Draw & guess',reveal:'Round result',paused:'Waiting for players',finished:'Final scores'})[s.phase];$('#round').textContent=s.round?'Turn '+s.round+' / '+s.total+' · '+(s.players.find(p=>p.id===s.drawer)?.name||'Player')+' drawing':'Need 3–8 connected players.';
 $('#word').textContent=s.word||'Choose one of these words';$('#choices').replaceChildren();for(const [i,word]of(s.choices||[]).entries()){const b=document.createElement('button');b.textContent=word;b.onclick=()=>client.send('choose',{choice:i});$('#choices').append(b);}
 $('#hint').textContent=s.reveal?'The word was '+s.reveal+'. '+(s.reason||''):s.hint||'';secret();
 $('#guess').disabled=s.phase!=='drawing'||s.you===s.drawer||s.solved.includes(s.you);$('#send').disabled=$('#guess').disabled;for(const b of document.querySelectorAll('.tools button,.tools select'))b.disabled=!canDraw();
 $('#players').replaceChildren();for(const p of [...s.players].sort((a,b)=>b.score-a.score)){const li=document.createElement('li');if(avatars[p.avatar]){const img=document.createElement('img');img.src=ui.profile.assets+avatars[p.avatar];img.alt='';li.append(img);}const name=document.createElement('span');name.textContent=p.name+(p.id===s.host?' (host)':'')+(!p.connected?' · offline':'');const score=document.createElement('strong');score.textContent=p.score;li.append(name,score);if(s.host===s.you&&p.id!==s.you){const b=document.createElement('button');b.textContent='Kick';b.setAttribute('aria-label','Kick '+p.name);b.onclick=()=>client.send('kick',{player:p.id});li.append(b);}$('#players').append(li);}
 $('#feed').replaceChildren();for(const item of s.feed){const p=document.createElement('p');p.textContent=item.text;$('#feed').append(p);}$('#feed').scrollTop=$('#feed').scrollHeight;
 if(s.roundId!==lastRound&&s.phase==='choose'){ui.react('start');lastRound=s.roundId;}if(s.phase==='finished'&&lastPhase!=='finished'){ui.expression('win');ui.react('win');}else if(s.phase==='reveal'&&lastPhase!=='reveal'){ui.expression(s.solved.length?'win':'lose');ui.react(s.solved.length?'milestone':'lose');}lastPhase=s.phase;
}
function point(e){const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))];}
function flush(){if(!stroke||!batch.length)return;const points=batch.splice(0,32);client.send('stroke',{stroke:stroke.id,seq:seq++,points,color:stroke.color,size:stroke.size});}
canvas.onpointerdown=e=>{if(!canDraw())return;e.preventDefault();canvas.setPointerCapture(e.pointerId);stroke={id:crypto.randomUUID(),color,size:Number($('#size').value)};seq=0;batch=[point(e)];flush();};
canvas.onpointermove=e=>{if(!stroke)return;e.preventDefault();batch.push(point(e));if(batch.length>=32)flush();};
function end(){while(batch.length&&stroke)flush();stroke=null;}
canvas.onpointerup=end;canvas.onpointercancel=end;setInterval(()=>{if(batch.length)flush();},80);
$('#eraser').onclick=()=>{color='#ffffff';notice('Eraser selected. Choose a colour to draw again.');};$('#undo').onclick=()=>{end();client.send('undo');};$('#clear').onclick=()=>{end();client.send('clear');};
$('#guess-form').onsubmit=e=>{e.preventDefault();if($('#guess').value.trim())client.send('guess',{text:$('#guess').value});$('#guess').value='';};
async function enter(create){$('#create').disabled=$('#join').disabled=true;try{$('#invite').value=await client.enter(create,$('#name').value,Number($('#avatar').value));ui.react('start');}catch(e){notice(e.message);}finally{$('#create').disabled=$('#join').disabled=false;}}
$('#create').onclick=()=>enter(true);$('#join').onclick=()=>enter(false);$('#join').hidden=!client.room;
$('#start').onclick=()=>client.send('start');$('#skip').onclick=()=>client.send('skip');$('#lock').onclick=()=>client.send('lock');$('#reconnect').onclick=()=>client.connect();$('#leave').onclick=()=>{client.leave();$('#room').hidden=true;$('#lobby').hidden=false;const u=new URL(location.href);u.searchParams.delete('room');history.replaceState(null,'',u);client.room=null;$('#join').hidden=true;};
$('#save-pack').onclick=()=>{const pack=$('#pack').value,words=$('#custom').value.split('\n').filter(x=>x.trim()).map(line=>{const [word,...aliases]=line.split('|');return {word:word.trim(),aliases:aliases.map(s=>s.trim())};});client.send('pack',{pack,words});};
$('#pack').onchange=()=>{if($('#pack').value!=='custom')client.send('pack',{pack:$('#pack').value});};
$('#copy').onclick=async()=>{try{await navigator.clipboard.writeText($('#invite').value);notice('Invite copied. Share privately.');}catch{$('#invite').select();notice('Copy the selected invite link.');}};
$('#streamer').checked=ui.read('streamer')===1;$('#streamer').onchange=()=>{ui.write('streamer',Number($('#streamer').checked));revealed=false;secret();};let revealTimer;$('#reveal-secret').onclick=()=>{revealed=true;secret();clearTimeout(revealTimer);revealTimer=setTimeout(()=>{revealed=false;secret();},5000);};
document.addEventListener('visibilitychange',()=>{end();revealed=false;secret();if(document.hidden)window.CreatorAudio?.stop();else client.sync();});window.addEventListener('blur',()=>{revealed=false;secret();});
client.onDisconnect=()=>{stroke=null;batch=[];$('#guess').disabled=$('#send').disabled=true;};
setInterval(()=>{$('#timer').textContent=state?.deadline?Math.max(0,Math.ceil((state.deadline-Date.now()-timerOffset)/1000))+'s':'';},250);
$('#availability').textContent=client.endpoint?'Invite only. No accounts.':'Local implementation: rooms require the local Worker. Public hosting is not enabled.';
window.drawSnapshot=()=>state?structuredClone(state):null;repaint();
// A saved token reconnects without asking for another seat; fresh invites ask for a nickname first.
if(client.room){let saved=false;try{saved=!!localStorage.getItem(client.key());}catch{}if(saved)enter(false);}
