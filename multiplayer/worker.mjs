import {emptyBoard,move,result} from '../games/four/rules.mjs';
export {PartyRoom} from './party-room.mjs';
const TTL=24*60*60*1000,IDLE=30*60*1000,GRACE=60000;
const token=()=>crypto.randomUUID()+crypto.randomUUID();
function json(body,status=200,origin=''){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...(origin?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{})}});}
function allowed(origin){try{const u=new URL(origin);return u.origin===origin&&(u.hostname==='moosher.duvera.app'||u.hostname==='duvera-moosher.pages.dev'||u.hostname.endsWith('.duvera-moosher.pages.dev')||(['localhost','127.0.0.1'].includes(u.hostname)&&u.protocol==='http:'));}catch{return false;}}
export default {async fetch(req,env){
 const origin=req.headers.get('Origin')||'';
 if(!allowed(origin))return json({error:'This game origin is not allowed.'},403);
 if(req.method==='OPTIONS')return new Response(null,{headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Max-Age':'600','Vary':'Origin'}});
 const url=new URL(req.url);
 try{
  const party=url.pathname.match(/^\/party\/(draw|quiz)\/rooms(?:\/([a-f0-9-]{36})\/(join|socket))?$/);
  if(req.method==='POST'&&(url.pathname==='/rooms'||(party&&!party[2]))){
   // One tiny SQLite gate per hashed IP bounds room creation without storing raw addresses.
   const ip=req.headers.get('CF-Connecting-IP')||'local';const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip));const hash=Array.from(new Uint8Array(digest)).map(n=>n.toString(16).padStart(2,'0')).join('');
   const gate=env.ROOMS.get(env.ROOMS.idFromName('gate:'+hash));const permitted=await gate.fetch('https://room/gate',{method:'POST'});
   if(!permitted.ok)return json({error:'Room creation limit reached. Try later or play solo.'},429,origin);
   const id=crypto.randomUUID(),binding=party?env.PARTIES:env.ROOMS,room=binding.get(binding.idFromName(party?party[1]+':'+id:id));
   let body;if(party){const raw=await req.text();if(raw.length>1024)return json({error:'Request too large.'},413,origin);let input;try{input=JSON.parse(raw);}catch{return json({error:'Invalid request.'},400,origin);}body=JSON.stringify({...input,kind:party[1]});}
   const response=await room.fetch('https://room/create',{method:'POST',body});return json({...await response.json(),room:id},response.status,origin);
  }
  if(party&&party[2]){const response=await env.PARTIES.get(env.PARTIES.idFromName(party[1]+':'+party[2])).fetch(new Request('https://room/'+party[3],req));if(response.status===101)return response;return json(await response.json(),response.status,origin);}
  const match=url.pathname.match(/^\/rooms\/([a-f0-9-]{36})\/(join|socket)$/);
  if(!match)return json({error:'Unknown room route.'},404,origin);
  const response=await env.ROOMS.get(env.ROOMS.idFromName(match[1])).fetch(new Request('https://room/'+match[2],req));
  if(response.status===101)return response;
  return json(await response.json(),response.status,origin);
 }catch{return json({error:'Room service is unavailable or at its quota. Your solo game is still available.'},503,origin);}
}};
export class FourRoom {
 constructor(ctx){this.ctx=ctx;this.room=null;this.gate=null;ctx.blockConcurrencyWhile(async()=>{this.room=await ctx.storage.get('room');this.gate=await ctx.storage.get('gate');});}
 async fetch(req){
  const path=new URL(req.url).pathname,now=Date.now();
  if(path==='/gate'){
   if(!this.gate||now>this.gate.until)this.gate={count:0,until:now+3600000};
   if(this.gate.count>=10)return json({},429);this.gate.count++;await this.ctx.storage.put('gate',this.gate);await this.ctx.storage.setAlarm(this.gate.until);return json({ok:true});
  }
  if(path==='/create'&&req.method==='POST'){
   if(this.room)return json({error:'Room exists.'},409);
   this.room={created:now,expires:now+TTL,touched:now,board:emptyBoard(),turn:1,status:'waiting',revision:0,match:1,seats:[{token:token(),ready:false,rematch:false,offline:now},null],winner:null};
   await this.save();return json({token:this.room.seats[0].token,seat:1});
  }
  if(!this.room||now>this.room.expires)return json({error:'Room expired. Create a new invite.'},410);
  if(path==='/join'&&req.method==='POST'){
   if(this.room.seats[1])return json({error:'This room already has two players.'},409);
   if(this.room.status!=='waiting')return json({error:'This match has closed.'},409);
   this.room.seats[1]={token:token(),ready:false,rematch:false,offline:now};this.room.revision++;await this.save();this.broadcast();return json({token:this.room.seats[1].token,seat:2});
  }
  if(path==='/socket'&&req.headers.get('Upgrade')?.toLowerCase()==='websocket'){
   if(this.ctx.getWebSockets().length>=8)return json({error:'Too many connections. Close duplicate tabs and retry.'},429);
   const [client,server]=Object.values(new WebSocketPair());this.ctx.acceptWebSocket(server);server.serializeAttachment({seat:0,opened:now,count:0,window:now});
   await this.ctx.storage.setAlarm(Math.min(now+10000,this.room.expires));return new Response(null,{status:101,webSocket:client});
  }
  return json({error:'Method not allowed.'},405);
 }
 connected(seat){return this.ctx.getWebSockets().some(s=>s.deserializeAttachment()?.seat===seat&&s.readyState===1);}
 snapshot(seat){const r=this.room;return {type:'state',seat,board:r.board,turn:r.turn,status:r.status,revision:r.revision,match:r.match,winner:r.winner,winning:r.winning||[],expires:r.expires,seats:r.seats.map((s,i)=>s?{ready:s.ready,rematch:s.rematch,connected:this.connected(i+1),offline:s.offline}:null)};}
 broadcast(){for(const ws of this.ctx.getWebSockets()){const seat=ws.deserializeAttachment()?.seat;if(seat)try{ws.send(JSON.stringify(this.snapshot(seat)));}catch{}}}
 async save(){const r=this.room;r.touched=Date.now();await this.ctx.storage.put('room',r);const allOff=!this.connected(1)&&!this.connected(2);const pending=this.ctx.getWebSockets().map(ws=>ws.deserializeAttachment()).filter(a=>!a.seat).map(a=>a.opened+10000);await this.ctx.storage.setAlarm(Math.min(r.expires,allOff?Date.now()+IDLE:r.expires,...pending));}
 async webSocketMessage(ws,data){
  try{await this.handleMessage(ws,data);}catch{for(const socket of this.ctx.getWebSockets())socket.close(1013,'Room service is at capacity. Try reconnecting later or play solo.');}
 }
 async handleMessage(ws,data){
  const a=ws.deserializeAttachment(),now=Date.now();
  const error=message=>ws.send(JSON.stringify({type:'error',message}));
  if(typeof data!=='string'||data.length>1024){ws.close(1009,'Message too large');return;}
  if(now-a.window>1000){a.window=now;a.count=0;}a.count++;ws.serializeAttachment(a);if(a.count>12){ws.close(1008,'Too many inputs');return;}
  let m;try{m=JSON.parse(data);}catch{return error('Invalid message.');}
  if(!m||typeof m!=='object')return error('Invalid message.');
  if(!this.room||now>this.room.expires){ws.close(1000,'Room expired');return;}
  if(!a.seat){
   if(m.type!=='auth'||typeof m.token!=='string')return ws.close(1008,'Authenticate first');
   const seat=this.room.seats.findIndex(s=>s?.token===m.token)+1;
   if(!seat)return ws.close(1008,'Invalid seat token');
   for(const old of this.ctx.getWebSockets())if(old!==ws&&old.deserializeAttachment()?.seat===seat){old.serializeAttachment({...old.deserializeAttachment(),seat:0});old.close(1000,'Seat opened in another tab');}
   a.seat=seat;ws.serializeAttachment(a);this.room.seats[seat-1].offline=null;
   if(this.room.status==='waiting'&&this.room.seats.every(x=>x?.ready)&&this.connected(1)&&this.connected(2)){this.room.status='playing';this.room.revision++;}
   if(this.room.status==='over'&&this.room.seats.every(x=>x?.rematch)&&this.connected(1)&&this.connected(2)){this.room.board=emptyBoard();this.room.match++;this.room.turn=this.room.match%2?1:2;this.room.winner=null;this.room.winning=[];this.room.status='playing';this.room.seats.forEach(x=>x.rematch=false);this.room.revision++;}
   await this.save();this.broadcast();return;
  }
  const r=this.room,s=r.seats[a.seat-1];
  if(m.type==='sync'){ws.send(JSON.stringify(this.snapshot(a.seat)));return;}
  if(m.revision!==r.revision)return error('Board changed. Wait for the latest state.');
  if(m.type==='ready'&&r.status==='waiting'){
   s.ready=true;if(r.seats.every(x=>x?.ready)&&this.connected(1)&&this.connected(2))r.status='playing';
  }else if(m.type==='move'&&r.status==='playing'){
   if(r.turn!==a.seat)return error('Wait for your turn.');if(!this.connected(3-a.seat))return error('Opponent disconnected. Wait for reconnect or claim the timeout.');
   const next=move(r.board,m.column,a.seat);if(!next)return error('Choose an open column.');r.board=next;const end=result(next);if(end){r.status='over';r.winner=end.winner;r.winning=end.cells;}else r.turn=3-r.turn;
  }else if(m.type==='rematch'&&r.status==='over'){
   s.rematch=true;if(r.seats.every(x=>x?.rematch)&&this.connected(1)&&this.connected(2)){r.board=emptyBoard();r.match++;r.turn=r.match%2?1:2;r.winner=null;r.winning=[];r.status='playing';r.seats.forEach(x=>x.rematch=false);}
  }else if(m.type==='claim'&&r.status==='playing'){
   const other=r.seats[2-a.seat];if(this.connected(3-a.seat)||!other?.offline||now-other.offline<GRACE)return error('The reconnect window is still open.');r.status='over';r.winner=a.seat;r.reason='disconnect';
  }else if(m.type==='leave'){
   r.status='closed';r.winner=null;r.seats.forEach(x=>{if(x)x.token=token();});
  }else return error('That action is not available.');
  r.revision++;await this.save();this.broadcast();if(r.status==='closed')for(const socket of this.ctx.getWebSockets())socket.close(1000,'A player left the room');
 }
 async webSocketClose(ws){await this.disconnected(ws);}
 async webSocketError(ws){await this.disconnected(ws);}
 async disconnected(ws){const seat=ws.deserializeAttachment()?.seat;ws.serializeAttachment({...ws.deserializeAttachment(),seat:0});if(seat&&this.room&&!this.connected(seat)){this.room.seats[seat-1].offline=Date.now();await this.save();this.broadcast();}}
 async alarm(){
  const now=Date.now();for(const ws of this.ctx.getWebSockets()){const a=ws.deserializeAttachment();if(!a?.seat&&now-a.opened>=10000)ws.close(1008,'Authentication timed out');}
  if(this.gate&&now>=this.gate.until){await this.ctx.storage.deleteAll();this.gate=null;return;}
  if(!this.room)return;
  if(now>=this.room.expires||(!this.connected(1)&&!this.connected(2)&&now-this.room.touched>=IDLE)){for(const ws of this.ctx.getWebSockets())ws.close(1000,'Room expired');await this.ctx.storage.deleteAll();this.room=null;return;}
  await this.ctx.storage.setAlarm(Math.min(this.room.expires,now+IDLE));
 }
}
