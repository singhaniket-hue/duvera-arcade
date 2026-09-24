import {createParty,addPlayer,partyAction,partySnapshot,advance,depart,connected} from './party-core.mjs';
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{'Content-Type':'application/json'}});
export class PartyRoom {
 constructor(ctx){this.ctx=ctx;this.room=null;ctx.blockConcurrencyWhile(async()=>{this.room=await ctx.storage.get('party');});}
 async fetch(req){
  const path=new URL(req.url).pathname,now=Date.now();
  if(req.method==='POST'&&(path==='/create'||path==='/join')){
   const body=await req.text();if(body.length>1024)return json({error:'Request too large.'},413);let m;try{m=JSON.parse(body);}catch{return json({error:'Invalid request.'},400);}
   if(!m||typeof m!=='object')return json({error:'Invalid request.'},400);
   if(path==='/create'){if(this.room)return json({error:'Room exists.'},409);if(m.kind!=='draw')return json({error:'Unknown game.'},400);this.room=createParty(m.kind,now);}
   if(!this.room||now>=this.room.expires)return json({error:'Room expired.'},410);
   try{const p=addPlayer(this.room,crypto.randomUUID()+crypto.randomUUID(),m.name,m.avatar,now);await this.save();this.broadcast();return json({token:p.token,seat:p.id});}catch(e){return json({error:e.message},409);}
  }
  if(!this.room||now>=this.room.expires)return json({error:'Room expired.'},410);
  if(path==='/socket'&&req.headers.get('Upgrade')?.toLowerCase()==='websocket'){
   if(this.ctx.getWebSockets().length>=16)return json({error:'Too many connections.'},429);
   const [client,server]=Object.values(new WebSocketPair());this.ctx.acceptWebSocket(server);server.serializeAttachment({seat:null,opened:now,window:now,count:0});await this.schedule();return new Response(null,{status:101,webSocket:client});
  }return json({error:'Unknown route.'},404);
 }
 broadcast(full=false){for(const ws of this.ctx.getWebSockets()){const id=ws.deserializeAttachment()?.seat;if(id&&this.room.players.some(p=>p.id===id))try{ws.send(JSON.stringify(partySnapshot(this.room,id,Date.now(),full)));}catch{}}}
 async schedule(){const now=Date.now(),r=this.room;if(!r)return;const pending=this.ctx.getWebSockets().map(s=>s.deserializeAttachment()).filter(a=>!a.seat&&a.opened+10000>now).map(a=>a.opened+10000);const offline=r.players.filter(p=>p.offline!==null).map(p=>p.offline+60000);await this.ctx.storage.setAlarm(Math.max(now+1,Math.min(r.expires,r.deadline||Infinity,r.phase==='drawing'&&!r.hinted?r.started+40000:Infinity,...pending,...offline,connected(r).length?Infinity:r.touched+1800000)));}
 async save(){await this.ctx.storage.put('party',this.room);await this.schedule();}
 async webSocketMessage(ws,data){try{await this.handle(ws,data);}catch{ws.close(1013,'Room unavailable. Reconnect later.');}}
 async handle(ws,data){
  const now=Date.now(),a=ws.deserializeAttachment(),r=this.room;
  if(!r||now>=r.expires)return ws.close(1000,'Room expired');
  if(typeof data!=='string'||data.length>16384)return ws.close(1009,'Message too large');
  if(now-a.window>=1000){a.count=0;a.window=now;}a.count++;ws.serializeAttachment(a);if(a.count>20)return ws.close(1008,'Input rate exceeded');
  let m;try{m=JSON.parse(data);}catch{return ws.send(JSON.stringify({type:'error',message:'Invalid message.'}));}if(!m||typeof m!=='object')return;
  if(!a.seat){
   if(m.type!=='auth'||typeof m.token!=='string')return ws.close(1008,'Authenticate first');const p=r.players.find(x=>x.token===m.token);if(!p)return ws.close(1008,'Invalid session token');
   for(const old of this.ctx.getWebSockets())if(old!==ws&&old.deserializeAttachment()?.seat===p.id){old.serializeAttachment({...old.deserializeAttachment(),seat:null});old.close(1000,'Seat opened in another tab');}
   a.seat=p.id;ws.serializeAttachment(a);p.offline=null;r.touched=now;r.revision++;await this.save();this.broadcast(true);return;
  }
  if(m.type==='sync'){if(advance(r,now)){await this.save();this.broadcast(true);}else ws.send(JSON.stringify(partySnapshot(r,a.seat,now,true)));return;}
  const oldVersion=r.canvasVersion;
  try{partyAction(r,a.seat,m,now);}catch(e){ws.send(JSON.stringify({type:'error',message:e.message}));await this.save();this.broadcast(true);return;}
  for(const s of this.ctx.getWebSockets())if(s.deserializeAttachment()?.seat&&!r.players.some(p=>p.id===s.deserializeAttachment().seat)){s.serializeAttachment({...s.deserializeAttachment(),seat:null});s.close(1000,'You left or were removed from the room');}
  await this.save();
  if(m.type==='stroke'&&oldVersion===r.canvasVersion){const stroke=r.drawing.find(s=>s.id===m.stroke);for(const s of this.ctx.getWebSockets())if(s.deserializeAttachment()?.seat)s.send(JSON.stringify({type:'ink',canvasVersion:r.canvasVersion,stroke:m.stroke,seq:m.seq,points:m.points,color:stroke.color,size:stroke.size}));}
  else this.broadcast(true);
 }
 async webSocketClose(ws){await this.disconnected(ws);}
 async webSocketError(ws){await this.disconnected(ws);}
 async disconnected(ws){const a=ws.deserializeAttachment();ws.serializeAttachment({...a,seat:null});if(a.seat&&this.room&&!this.ctx.getWebSockets().some(s=>s.deserializeAttachment()?.seat===a.seat)){depart(this.room,a.seat,Date.now());await this.save();this.broadcast(true);}}
 async alarm(){
  const now=Date.now(),r=this.room;if(!r)return;
  for(const s of this.ctx.getWebSockets()){const a=s.deserializeAttachment();if(!a.seat&&now>=a.opened+10000)s.close(1008,'Authentication timed out');}
  if(now>=r.expires||(!connected(r).length&&now-r.touched>=1800000)){for(const s of this.ctx.getWebSockets())s.close(1000,'Room expired');await this.ctx.storage.deleteAll();this.room=null;return;}
  for(const p of [...r.players])if(p.offline!==null&&now>=p.offline+60000)depart(r,p.id,now,true);
  advance(r,now);await this.save();this.broadcast(true);
 }
}
