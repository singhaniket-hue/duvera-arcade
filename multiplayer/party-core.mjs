// Original authoritative party rules. No transport, browser state or client-supplied clocks.
import words from './draw-words.json' with {type:'json'};
import {startQuiz,nextQuiz,closeQuiz,quizAction,quizSnapshot} from './quiz-core.mjs';
export const COLORS=['#173e38','#e34c4c','#e9b826','#25844b','#2478ce','#a753c6','#ffffff'];
export const normalize=s=>String(s).normalize('NFKC').toLowerCase().trim().replace(/\s+/g,' ');
export function cleanPack(input){
 if(!Array.isArray(input)||input.length<3||input.length>60)throw Error('A custom pack needs 3–60 words.');
 const seen=new Set();return input.map(w=>{if(!w||typeof w.word!=='string'||!Array.isArray(w.aliases)||w.aliases.length>6)throw Error('Use word and aliases for each entry.');
 const word=w.word.trim();if(!/^[\p{L}\p{N}][\p{L}\p{N} '-]{0,39}$/u.test(word)||seen.has(normalize(word)))throw Error('Use unique words, up to 40 letters.');seen.add(normalize(word));
 const aliases=w.aliases.map(a=>{if(typeof a!=='string'||!a.trim()||a.length>40)throw Error('Aliases must be short text.');return a.trim();});return {word,aliases};});
}
const fail=message=>{throw Error(message);};
const random=n=>crypto.getRandomValues(new Uint32Array(1))[0]%n;
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=random(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
export function createParty(kind,now){return {kind,created:now,expires:now+86400000,touched:now,revision:0,phase:'lobby',players:[],host:null,locked:false,round:0,deadline:0,feed:[],pack:'english',custom:null,queue:[],drawing:[],points:0,canvasVersion:0,solved:[],seen:[]};}
export function addPlayer(r,token,nickname,avatar,now){
 if(r.locked||!['lobby','finished'].includes(r.phase))fail('This room is locked or already playing.');if(r.players.length>=8)fail('This room is full (8 players).');
 const name=String(nickname||'Player').trim().slice(0,20)||'Player';const p={id:crypto.randomUUID(),token,name,avatar:Number.isInteger(avatar)&&avatar>=0&&avatar<6?avatar:0,score:0,offline:now};r.players.push(p);r.host??=p.id;r.revision++;return p;
}
export const connected=r=>r.players.filter(p=>p.offline===null);
function note(r,text){r.feed.push({text});r.feed=r.feed.slice(-30);}
export function endDraw(r,now,reason='Time is up.'){r.phase='reveal';r.deadline=now+7000;r.reveal=r.word?.word||'';r.reason=reason;note(r,reason+(r.reveal?' Word: '+r.reveal:''));}
function nextDraw(r,now){
 if(!r.queue.length){r.phase='finished';r.deadline=0;note(r,'Match complete. The host can start a rematch.');return;}
 if(connected(r).length<3){r.phase='paused';r.deadline=0;note(r,'Waiting for at least 3 connected players. Host can resume.');return;}
 let id;while(r.queue.length&&!id){const candidate=r.queue.shift();if(connected(r).some(p=>p.id===candidate))id=candidate;}
 if(!id){r.phase='finished';r.deadline=0;return;}
 r.drawer=id;r.round++;r.roundId=crypto.randomUUID();r.canvasVersion++;r.drawing=[];r.points=0;r.solved=[];r.word=null;r.reveal='';r.reason='';
 r.choices=shuffle(r.custom||words[r.pack]).slice(0,3);r.phase='choose';r.deadline=now+15000;
}
function choose(r,index,now){r.word=r.choices[index];r.choices=[];r.phase='drawing';r.started=now;r.hinted=false;r.deadline=now+75000;}
export function advance(r,now){
 if(r.kind==='quiz'){if(r.phase==='question'&&now>=r.deadline){closeQuiz(r);r.revision++;return true;}return false;}
 if(r.phase==='drawing'&&!r.hinted&&now>=r.started+40000&&now<r.deadline){r.hinted=true;r.revision++;return true;}
 if(r.deadline&&now>=r.deadline){if(r.phase==='choose')choose(r,0,now);else if(r.phase==='drawing')endDraw(r,now);else if(r.phase==='reveal')nextDraw(r,now);r.revision++;return true;}return false;
}
export function depart(r,id,now,remove=false){
 const p=r.players.find(x=>x.id===id);if(!p)return;p.offline=now;
 if(remove)r.players=r.players.filter(x=>x.id!==id);
 if(r.host===id)r.host=connected(r)[0]?.id||r.players[0]?.id||null;
 if(r.drawer===id&&['choose','drawing'].includes(r.phase))endDraw(r,now,'Drawer disconnected. This turn was skipped.');
 note(r,p.name+(remove?' left the room.':' disconnected; reconnect within 60 seconds.'));r.revision++;
}
export function partyAction(r,id,m,now){
 const p=r.players.find(x=>x.id===id);if(!p)fail('Seat is no longer available.');
 advance(r,now);
 if(typeof m.id!=='string'||m.id.length>64||m.id.length<8)fail('A command ID is required.');
 if(r.seen.includes(id+':'+m.id))fail('Duplicate command ignored.');
 r.seen.push(id+':'+m.id);r.seen=r.seen.slice(-256);
 const host=()=>{if(r.host!==id)fail('Only the host can do that.');};
 if(m.type==='lock'){host();r.locked=!r.locked;}
 else if(m.type==='kick'){host();if(m.player===id)fail('Use Leave to leave the room.');if(!r.players.some(x=>x.id===m.player))fail('Unknown player.');depart(r,m.player,now,true);}
 else if(m.type==='leave'){depart(r,id,now,true);}
 else if(m.type==='pack'){host();if(r.kind!=='draw')fail('This game has no word packs.');if(!['lobby','finished'].includes(r.phase))fail('Change packs between matches.');if(!['english','hindi','custom'].includes(m.pack))fail('Unknown word pack.');r.custom=m.pack==='custom'?cleanPack(m.words):null;r.pack=m.pack;}
 else if(m.type==='start'){
  host();if(!['lobby','finished','paused'].includes(r.phase))fail('Match already started.');
  if(r.kind==='quiz')startQuiz(r,now);else{if(connected(r).length<3)fail('Draw needs 3 connected players.');if(r.phase!=='paused'){r.players.forEach(x=>x.score=0);r.queue=connected(r).map(x=>x.id);r.round=0;r.total=r.queue.length;r.feed=[];}r.locked=true;nextDraw(r,now);}
 }else if(m.type==='skip'){host();if(r.kind!=='draw'||!['choose','drawing','reveal'].includes(r.phase))fail('No round to skip.');if(r.phase==='reveal')nextDraw(r,now);else endDraw(r,now,'Host skipped this turn.');}
 else if(r.kind==='quiz')quizAction(r,p,m,now);
 else{
  if(m.roundId!==r.roundId)fail('That input belongs to an earlier round.');
  if(m.type==='choose'){
   if(id!==r.drawer||r.phase!=='choose'||!Number.isInteger(m.choice)||m.choice<0||m.choice>2)fail('Only the drawer can choose a word.');choose(r,m.choice,now);
  }else if(m.type==='guess'){
   if(r.phase!=='drawing'||id===r.drawer||r.solved.includes(id))fail('You cannot guess now.');if(typeof m.text!=='string'||!m.text.trim()||m.text.length>80)fail('Use a guess of 1–80 characters.');
   if([r.word.word,...r.word.aliases].some(w=>normalize(w)===normalize(m.text))){p.score+=100+Math.floor(200*Math.max(0,r.deadline-now)/75000);const d=r.players.find(x=>x.id===r.drawer);if(d)d.score+=50;r.solved.push(id);note(r,p.name+' guessed correctly!');if(connected(r).filter(x=>x.id!==r.drawer).every(x=>r.solved.includes(x.id)))endDraw(r,now,'Everyone guessed it!');}
   else note(r,p.name+': '+m.text.trim());
  }else if(['stroke','undo','clear'].includes(m.type)){
   if(r.phase!=='drawing'||id!==r.drawer)fail('Only the current drawer can draw.');
   if(m.canvasVersion!==r.canvasVersion)fail('Canvas changed. Try again.');
   if(m.type==='clear'){r.drawing=[];r.points=0;r.canvasVersion++;}
   else if(m.type==='undo'){const last=r.drawing.pop();if(last)r.points-=last.points.length;r.canvasVersion++;}
   else{
    if(typeof m.stroke!=='string'||m.stroke.length>64||!Number.isInteger(m.seq)||!Array.isArray(m.points)||m.points.length<1||m.points.length>32||!m.points.every(v=>Array.isArray(v)&&v.length===2&&v.every(n=>Number.isFinite(n)&&n>=0&&n<=1)))fail('Invalid drawing batch.');
    let s=r.drawing.find(x=>x.id===m.stroke);
    if(!s){if(m.seq!==0||r.drawing.length>=120||!COLORS.includes(m.color)||![3,7,14,24].includes(m.size))fail('Drawing limit reached or invalid brush.');s={id:m.stroke,seq:0,color:m.color,size:m.size,points:[]};r.drawing.push(s);}
    if(s.seq!==m.seq)fail('Drawing batch is stale.');if(r.points+m.points.length>8000)fail('Canvas is full. Undo or clear to continue.');s.points.push(...m.points);s.seq++;r.points+=m.points.length;
   }
  }else fail('Unknown command.');
 }
 r.touched=now;r.revision++;
}
export function partySnapshot(r,id,now,includeDrawing=false){
 const s={type:'state',kind:r.kind,you:id,host:r.host,phase:r.phase,revision:r.revision,locked:r.locked,round:r.round,total:r.total||0,roundId:r.roundId,drawer:r.drawer,deadline:r.deadline,serverNow:now,pack:r.pack,canvasVersion:r.canvasVersion,feed:r.feed,players:r.players.map(({id,name,avatar,score,offline})=>({id,name,avatar,score,connected:offline===null})),solved:r.solved,reveal:r.phase==='reveal'?r.reveal:undefined,reason:r.reason};
 if(id===r.drawer&&r.phase==='choose')s.choices=r.choices.map(x=>x.word);
 if(r.phase==='drawing'){if(id===r.drawer)s.word=r.word.word;else {const elapsed=now-r.started;s.hint=Array.from(r.word.word).map((c,i)=>c===' '?' / ':elapsed>=40000&&i===0?c:'_').join(' ');}}
 if(includeDrawing)s.drawing=r.drawing;
 if(r.kind==='quiz')Object.assign(s,quizSnapshot(r,id));
 return s;
}
