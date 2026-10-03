// Exercise authoritative lifecycle/security edge cases with real room methods and fake I/O/clock.
import assert from 'node:assert/strict';
import {FourRoom} from '../multiplayer/worker.mjs';
let now=100000;const actualNow=Date.now;Date.now=()=>now;
const data=new Map(),sockets=[];let alarm=null,pending;
const ctx={storage:{get:async k=>data.get(k),put:async(k,v)=>data.set(k,structuredClone(v)),setAlarm:async t=>alarm=t,deleteAll:async()=>data.clear()},blockConcurrencyWhile(fn){pending=fn();},getWebSockets(){return sockets.filter(s=>s.readyState===1);}};
const room=new FourRoom(ctx);await pending;
const socket=seat=>{const s={a:{seat,opened:now,count:0,window:now},readyState:1,messages:[],serializeAttachment(a){this.a=a;},deserializeAttachment(){return this.a;},send(v){this.messages.push(JSON.parse(v));},close(code,reason){this.readyState=3;this.closed={code,reason};}};sockets.push(s);return s;};
const send=(ws,type,extra={})=>room.webSocketMessage(ws,JSON.stringify({type,revision:room.room.revision,...extra}));
try{
 const owner=await (await room.fetch(new Request('https://room/create',{method:'POST'}))).json();assert.equal(owner.token.length,72);
 const guest=await (await room.fetch(new Request('https://room/join',{method:'POST'}))).json();assert.notEqual(owner.token,guest.token);
 assert.equal((await room.fetch(new Request('https://room/join',{method:'POST'}))).status,409);
 const bad=socket(0);await room.webSocketMessage(bad,JSON.stringify({type:'auth',token:'guess'}));assert.equal(bad.closed.code,1008);
 const a=socket(0),b=socket(0);await room.webSocketMessage(a,JSON.stringify({type:'auth',token:owner.token}));await room.webSocketMessage(b,JSON.stringify({type:'auth',token:guest.token}));
 await send(a,'ready');await send(b,'ready');assert.equal(room.room.status,'playing');
 await send(b,'move',{column:3});assert.ok(room.room.board.every(x=>!x));
 await send(a,'move',{column:-1});assert.ok(room.room.board.every(x=>!x));
 await send(a,'setScore',{winner:1});assert.equal(room.room.winner,null);
 const rev=room.room.revision;await send(a,'move',{column:0});await room.webSocketMessage(b,JSON.stringify({type:'move',revision:rev,column:1}));assert.equal(room.room.board.filter(Boolean).length,1);
 b.readyState=3;await room.disconnected(b);await send(a,'claim');assert.equal(room.room.status,'playing');now+=60001;await send(a,'claim');assert.equal(room.room.winner,1);assert.equal(room.room.status,'over');
 assert.ok(!JSON.stringify(room.snapshot(1)).includes(guest.token));
 const resumed=new FourRoom(ctx);await pending;assert.equal(resumed.room.winner,1,'state survives object eviction');
 // Reconnection opens a ready room when the second Ready was sent during a disconnect.
 room.room.status='waiting';room.room.seats.forEach(s=>s.ready=true);const again=socket(0);await room.webSocketMessage(again,JSON.stringify({type:'auth',token:guest.token}));assert.equal(room.room.status,'playing');
 const huge=socket(1);await room.webSocketMessage(huge,'x'.repeat(1025));assert.equal(huge.closed.code,1009);
 const spam=socket(1);for(let i=0;i<13;i++)await room.webSocketMessage(spam,'{"type":"sync"}');assert.equal(spam.closed.code,1008);
 const unauth=socket(0);now+=10001;await room.alarm();assert.equal(unauth.closed.code,1008);
 now=room.room.expires+1;await room.alarm();assert.equal(room.room,null);assert.equal(data.size,0);assert.ok(sockets.every(s=>s.readyState===3));
 console.log('Room lifecycle/security passed: private tokens, full seats, illegal/out-of-turn/stale commands, timeout grace, eviction restore, reconnect-ready, payload/rate bounds, unauthenticated expiry and room data deletion.');
}finally{Date.now=actualNow;}
