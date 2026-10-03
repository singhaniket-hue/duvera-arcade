import {emptyBoard,move,result,chooseMove} from './rules.mjs';
import {setupGame} from '../../assets/mini-game.js';
const ui=setupGame('four','Four'),$=s=>document.querySelector(s),endpoint=window.ArcadeRooms?.endpoint;
if(window.self!==window.top)document.body.classList.add('embedded');
let mode='menu',board=emptyBoard(),turn=1,ended=null,paused=false,botTimer=null,selected=3,socket=null,state=null,seat=1,token=null,room=new URLSearchParams(location.search).get('room'),connecting=false,epoch=0,announced=null;
const buttons=[];
for(let c=0;c<7;c++){const b=document.createElement('button');b.textContent='↓ '+(c+1);b.setAttribute('aria-label','Drop in column '+(c+1));b.onclick=()=>play(c);$('#columns').append(b);buttons.push(b);}
const cells=[];for(let i=0;i<42;i++){const cell=document.createElement('div');cell.className='cell';cell.onclick=()=>play(i%7);cell.setAttribute('role','img');$('#board').append(cell);cells.push(cell);}
const notice=message=>$('#notice').textContent=message;
function render(){
 const winner=mode==='online'?state?.winner:ended?.winner,winning=mode==='online'?state?.winning:ended?.cells;
 cells.forEach((cell,i)=>{const value=board[i];cell.className='cell'+(value?' p'+value:'')+(winning?.includes(i)?' winning':'');cell.replaceChildren();cell.setAttribute('aria-label',`Row ${Math.floor(i/7)+1}, column ${i%7+1}: ${value?'player '+value:'empty'}`);if(value){const file=ui.theme.tokens?.[value-1];if(file&&ui.profile){const img=document.createElement('img');img.src=ui.profile.assets+file;img.alt='';cell.append(img);}const symbol=document.createElement('span');symbol.className='symbol';symbol.textContent=value===1?'●':'★';cell.append(symbol);}});
 const can=mode==='solo'?!ended&&!paused&&turn===1:mode==='online'&&state?.status==='playing'&&turn===seat&&socket?.readyState===1&&state.seats[2-seat]?.connected;
 buttons.forEach((b,c)=>{b.disabled=!can||!!board[c];b.classList.toggle('selected',c===selected);});
 $('#pause').hidden=mode!=='solo'||!!ended;$('#pause').textContent=paused?'Resume':'Pause';
 $('#difficulty-label').hidden=mode==='online';$('#solo').textContent=mode==='solo'?'Restart solo':'Play solo';$('#solo').hidden=mode==='online';$('#create').hidden=mode==='online';
 $('#create').disabled=!endpoint;$('#create').textContent=endpoint?'Invite a friend':'Online coming later';
 $('#copy').hidden=mode!=='online';$('#invite').hidden=mode!=='online';$('#leave').hidden=mode!=='online';
 $('#ready').hidden=mode!=='online'||state?.status!=='waiting';$('#ready').disabled=!!state?.seats[seat-1]?.ready;
 $('#rematch').hidden=mode!=='online'||state?.status!=='over';$('#rematch').disabled=!!state?.seats[seat-1]?.rematch;
 $('#claim').hidden=mode!=='online'||state?.status!=='playing'||!!state?.seats[2-seat]?.connected;
 if(mode==='solo')$('#status').textContent=paused?'Paused — ready when you are.':ended?ended.draw?'A draw. Well matched!':winner===1?'Four! You win.':'The bot wins. Try again?':turn===1?'Your turn · ●':'Bot is thinking · ★';
 if(mode==='online'){
  $('#status').textContent=!state?'Connecting…':state.status==='closed'?'Room closed.':state.status==='waiting'?'Both players press Ready.':state.status==='over'?winner===0?'A draw!':winner===seat?'Four! You win.':'Opponent wins.':turn===seat?'Your turn · '+(seat===1?'●':'★'):'Opponent’s turn';
  const other=state?.seats[2-seat];$('#connection').textContent=socket?.readyState!==1?'Disconnected. Reconnect to keep your seat.':!other?'Waiting for your friend…':!other.connected?'Opponent disconnected. Their seat is reserved for reconnect. After 60 seconds you can claim a timeout win, or leave.':`You are ${seat===1?'● circle':'★ star'} · Friend connected`;
 }
}
function reactEnd(){ui.expression(ended?.winner===1?'win':'lose');ui.react(ended?.winner===1?'win':'lose');}
function scheduleBot(){clearTimeout(botTimer);if(mode!=='solo'||paused||ended||turn!==2)return;botTimer=setTimeout(()=>{if(mode!=='solo'||paused||ended||turn!==2)return;const col=chooseMove(board,2,$('#difficulty').value);board=move(board,col,2);ended=result(board);turn=1;if(ended)reactEnd();render();},280);}
function solo(){epoch++;socket?.close();socket=null;state=null;room=null;token=null;history.replaceState(null,'',location.pathname+location.search.replace(/([?&])room=[^&]*&?/,'$1').replace(/[?&]$/,''));mode='solo';board=emptyBoard();turn=1;ended=null;paused=false;notice('');$('#connection').textContent='';$('#reconnect').hidden=true;ui.expression('idle');ui.react('start');render();scheduleBot();}
function play(column){if(mode==='online'){send('move',{column});return;}if(mode!=='solo'||ended||paused||turn!==1)return;const next=move(board,column,1);if(!next)return;board=next;ended=result(board);turn=2;if(ended)reactEnd();render();scheduleBot();}
function send(type,values={}){if(socket?.readyState!==1||!state)return notice('Connect to your room first.');socket.send(JSON.stringify({type,revision:state.revision,...values}));}
async function request(path){const response=await fetch(endpoint+path,{method:'POST'});const body=await response.json().catch(()=>({error:'Room service is temporarily unavailable.'}));if(!response.ok)throw Error(body.error);return body;}
function keepToken(){try{localStorage.setItem('duvera.rooms.'+room,token);}catch{notice('Browser storage is unavailable. Keep this tab open to retain your seat; refresh will lose it.');}}
function connect(){
 const myEpoch=++epoch;socket?.close();const ws=new WebSocket(endpoint.replace(/^http/,'ws')+'/rooms/'+room+'/socket');socket=ws;$('#reconnect').hidden=true;render();
 ws.onopen=()=>{if(myEpoch!==epoch)return ws.close();ws.send(JSON.stringify({type:'auth',token}));};
 ws.onmessage=e=>{if(myEpoch!==epoch)return;let m;try{m=JSON.parse(e.data);}catch{return;}
  if(m.type==='error'){notice(m.message);return;}if(m.type!=='state'||state&&m.revision<state.revision)return;
  state=m;seat=m.seat;board=m.board;turn=m.turn;
  if(m.status==='over'&&announced!==m.match){announced=m.match;ui.expression(m.winner===seat?'win':'lose');ui.react(m.winner===seat?'win':'lose');}
  if(m.status==='playing')ui.expression('idle');render();
 };
 ws.onclose=e=>{if(myEpoch!==epoch)return;$('#reconnect').hidden=state?.status==='closed';notice(e.reason||'Connection ended. Reconnect or return to solo.');render();};
 ws.onerror=()=>{if(myEpoch===epoch)notice('Room connection failed. Try reconnecting or play solo.');};
}
async function online(create=false){if(connecting)return;if(!endpoint)return notice('Online rooms are not available on this deployment yet. Solo play is ready.');connecting=true;$('#create').disabled=true;notice('');
 try{
  if(create){const created=await request('/rooms');room=created.room;token=created.token;seat=created.seat;keepToken();}
  else {try{token=localStorage.getItem('duvera.rooms.'+room);}catch{}if(!token){const joined=await request('/rooms/'+room+'/join');token=joined.token;seat=joined.seat;keepToken();}}
  clearTimeout(botTimer);mode='online';state=null;announced=null;const url=new URL(location);url.searchParams.set('room',room);history.replaceState(null,'',url);$('#invite').value=url.href;ui.react('start');connect();
 }catch(e){notice(e.message||'Cannot reach the room service. Solo remains available.');}finally{connecting=false;$('#create').disabled=false;render();}}
$('#solo').onclick=solo;$('#create').onclick=()=>online(true);$('#ready').onclick=()=>send('ready');$('#rematch').onclick=()=>send('rematch');$('#claim').onclick=()=>send('claim');$('#reconnect').onclick=connect;
$('#leave').onclick=()=>{send('leave');solo();};
$('#copy').onclick=async()=>{try{await navigator.clipboard.writeText($('#invite').value);notice('Invite copied. Share it privately with one friend.');}catch{$('#invite').focus();$('#invite').select();notice('Select and copy the invite link above.');}};
$('#pause').onclick=()=>{paused=!paused;if(paused){clearTimeout(botTimer);window.CreatorAudio?.stop();}else scheduleBot();render();};
$('#difficulty').onchange=()=>{if(mode==='solo')solo();};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='solo'&&!ended){paused=true;clearTimeout(botTimer);render();}});
document.addEventListener('keydown',e=>{if(e.repeat||e.target.closest('input,select,button,a'))return;if(/^Digit[1-7]$/.test(e.code)){e.preventDefault();play(Number(e.code.at(-1))-1);}if(e.code==='ArrowLeft'||e.code==='ArrowRight'){e.preventDefault();selected=(selected+(e.code==='ArrowLeft'?6:1))%7;render();}if(e.code==='Space'){e.preventDefault();play(selected);}});
// Read-only snapshots support diagnostics without exposing online seat tokens.
window.fourSnapshot=()=>({mode,board:[...board],turn,ended,paused,state});
if(!endpoint)document.querySelector('.room-help').textContent='Private rooms are temporarily unavailable. Solo play is ready.';
render();if(room&&/^[a-f0-9-]{36}$/.test(room))online();
