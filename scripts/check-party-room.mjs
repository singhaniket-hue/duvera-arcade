import assert from 'node:assert/strict';
import {PartyRoom} from '../multiplayer/party-room.mjs';
let now=100000;const realNow=Date.now;Date.now=()=>now;let pending,alarm,checks=0;const data=new Map(),sockets=[];
const ctx={storage:{get:async k=>data.get(k),put:async(k,v)=>data.set(k,structuredClone(v)),setAlarm:async t=>alarm=t,deleteAll:async()=>data.clear()},blockConcurrencyWhile(fn){pending=fn();},getWebSockets(){return sockets.filter(s=>s.readyState===1);}};
const room=new PartyRoom(ctx);await pending;
const check=(n,v)=>{assert.ok(v,n);checks++;console.log('PASS '+n);};
const socket=()=>{const s={a:{seat:null,opened:now,count:0,window:now},readyState:1,messages:[],serializeAttachment(a){this.a=a;},deserializeAttachment(){return this.a;},send(v){this.messages.push(JSON.parse(v));},close(code,reason){this.readyState=3;this.closed={code,reason};}};sockets.push(s);return s;};
const send=(s,type,x={})=>room.webSocketMessage(s,JSON.stringify({type,id:crypto.randomUUID(),roundId:room.room?.roundId,canvasVersion:room.room?.canvasVersion,...x}));
try{
 const owner=await(await room.fetch(new Request('https://room/create',{method:'POST',body:JSON.stringify({kind:'draw',name:'A'})}))).json();const guests=[];for(const name of['B','C'])guests.push(await(await room.fetch(new Request('https://room/join',{method:'POST',body:JSON.stringify({name})}))).json());
 const a=socket(),b=socket(),c=socket();await send(a,'auth',{token:owner.token});await send(b,'auth',{token:guests[0].token});await send(c,'auth',{token:guests[1].token});await send(a,'start');
 const restored=new PartyRoom(ctx);await pending;check('hibernation restores secret choices and deadline',restored.room.choices.length===3&&restored.room.deadline===room.room.deadline);
 check('snapshot has no other credentials or word choices',!JSON.stringify(b.messages).includes(owner.token)&&!b.messages.at(-1).choices);
 const invalid=socket();await send(invalid,'auth',{token:'wrong'});check('unguessable token required',invalid.closed.code===1008);
 const duplicate=socket();await send(duplicate,'auth',{token:guests[0].token});check('reconnect replaces old socket in same seat',b.closed.code===1000&&duplicate.a.seat===guests[0].seat);
 now=room.room.deadline;await room.alarm();check('alarm chooses word at selection deadline',room.room.phase==='drawing');now+=40000;await room.alarm();check('alarm delivers hint',duplicate.messages.at(-1).hint[0]!== '_');
 const huge=socket();await room.webSocketMessage(huge,'x'.repeat(16385));check('payload size bound',huge.closed.code===1009);
 const spam=socket();for(let i=0;i<21;i++)await send(spam,'auth',{token:owner.token});check('rate limit closes flood',spam.closed?.code===1008);
 const waiting=socket();now+=10001;await room.alarm();check('unauthenticated socket expiry',waiting.closed.code===1008&&alarm>now);
 c.readyState=3;await room.disconnected(c);now+=60001;await room.alarm();check('offline seat removed after grace',!room.room.players.some(p=>p.id===guests[1].seat));
 now=room.room.expires;await room.alarm();check('expired room deletes stored state',room.room===null&&data.size===0);
 console.log(`${checks} party transport/lifecycle checks passed.`);
}finally{Date.now=realNow;}
