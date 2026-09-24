import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile} from 'node:fs/promises';
import worker,{AudioInbox,boundedBody} from '../submissions/worker.mjs';
import {inspectAudio,MAX_BYTES} from '../assets/audio-upload-format.mjs';
let checks=0;const check=(name,ok)=>{assert.ok(ok,name);console.log('PASS '+name);checks++;};
export function wav(seconds=1,seed=1){const size=Math.round(seconds*8000)*2,b=new Uint8Array(44+size),v=new DataView(b.buffer);for(const [i,t]of [[0,'RIFF'],[8,'WAVE'],[12,'fmt '],[36,'data']])b.set(new TextEncoder().encode(t),i);v.setUint32(4,36+size,true);v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,16000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);v.setUint32(40,size,true);for(let i=44;i<b.length;i+=2)v.setInt16(i,Math.round(Math.sin(i/seed)*500),true);return b;}
export function form(bytes=wav(),values={}){const f=new FormData();for(const[k,v]of Object.entries({title:'Clip',credit:'',note:'',reaction:'other',source:'https://www.youtube.com/watch?v=LnAsPIae94Q',start:'1',end:'2',consent:'yes',website:'',...values}))f.set(k,v);f.set('audio',new Blob([bytes],{type:'audio/wav'}),'clip.wav');return f;}
if(import.meta.url===new URL(process.argv[1],'file:').href || process.argv[1]?.replaceAll('\\','/').endsWith('/check-submissions.mjs')){
 const db=new DatabaseSync(':memory:');let alarm=null;
 const storage={sql:{exec(q,...args){const statement=db.prepare(q);const params=args.map(a=>a instanceof ArrayBuffer?new Uint8Array(a):a);if(q.includes(';')){db.exec(q);return{toArray:()=>[]};}let rows;try{rows=statement.all(...params);}catch(error){throw error;}return{toArray:()=>rows};}},transactionSync(fn){db.exec('BEGIN');try{const result=fn();db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}},async setAlarm(t){alarm=t;}};
 // DDL contains multiple statements; the adapter executes these as a batch.
 const original=storage.sql.exec;storage.sql.exec=(q,...args)=>q.includes(';')?(db.exec(q),{toArray:()=>[]}):original(q,...args);
 const inbox=new AudioInbox({storage});const key='test-key-only-'.repeat(5),origin='http://localhost:4173';let calls=0;
 const env={ADMIN_KEY:key,INBOX:{idFromName:x=>x,get:()=>({fetch:r=>{calls++;return inbox.fetch(r);}})}};
 const call=(path,options={})=>worker.fetch(new Request('https://service'+path,{...options,headers:{Origin:origin,...options.headers}}),env);
 const admin=(path='',method='GET')=>call('/admin/moosher'+path,{method,headers:{Authorization:'Bearer '+key}});
 check('PCM WAV duration validated',inspectAudio(wav(2)).duration===2);
 for(const file of ['hello','lets-go','badhiya','theek-hai'])check('existing MP3 supported: '+file,inspectAudio(await readFile('creators/moosher/media/audio/'+file+'.mp3')).extension==='mp3');
 for(const [label,data]of [['empty',new Uint8Array()],['oversized',new Uint8Array(MAX_BYTES+1)],['HTML spoof',new TextEncoder().encode('<html>'+('x'.repeat(100)))],['too long',wav(16)],['too short',wav(.1)],['truncated',wav().slice(0,-1)]]){assert.throws(()=>inspectAudio(data));check('rejects '+label,true);}
 const compressed=wav();new DataView(compressed.buffer).setUint16(20,3,true);assert.throws(()=>inspectAudio(compressed));check('rejects compressed WAV',true);
 const noAuth=await call('/admin/moosher');check('admin list requires key before storage',noAuth.status===401&&calls===0);
 check('wrong key denied',(await call('/admin/moosher',{headers:{Authorization:'Bearer wrong'}})).status===401);
 check('untrusted origin denied',(await call('/submit/moosher',{method:'POST',headers:{Origin:'https://evil.example'},body:form()})).status===403);
 check('unknown creator denied',(await call('/submit/someone',{method:'POST',body:form()})).status===404);
 check('missing owner key fails closed',(await worker.fetch(new Request('https://service/submit/moosher',{method:'POST',headers:{Origin:origin},body:form()}),{...env,ADMIN_KEY:''})).status===503);
 const send=(data,ip)=>call('/submit/moosher',{method:'POST',headers:{'CF-Connecting-IP':ip},body:data});
 let r=await send(form(wav(),{title:'<img src=x onerror=alert(1)>',note:'untrusted text'}),'1');check('valid upload accepted',r.status===201);const{id}=await r.json();check('expiry alarm scheduled',alarm>Date.now());
 check('audio private without key',(await call('/admin/moosher/'+id+'/audio')).status===401);
 check('public route cannot retrieve audio',(await call('/submit/moosher/'+id+'/audio')).status===405);
 const list=await(await admin()).json();check('list returns metadata without binary or credential',list.clips.length===1&&!JSON.stringify(list).includes(key)&&!('audio'in list.clips[0]));
 r=await admin('/'+id+'/audio');check('owner receives exact audio bytes',r.headers.get('Content-Type')==='audio/wav'&&Buffer.from(await r.arrayBuffer()).equals(Buffer.from(wav())));
 check('duplicate upload rejected',(await send(form(),'2')).status===409);
 for(const [name,values]of [['consent',{consent:'no'}],['source protocol',{source:'javascript:alert(1)'}],['source credentials',{source:'https://user:password@example.com'}],['timestamp',{end:'0'}],['honeypot',{website:'spam'}]])check('rejects invalid '+name,(await send(form(wav(1,3),values),'invalid-'+name)).status===400);
 check('rejects spoofed audio',(await send(form(new TextEncoder().encode('not audio')),'badfile')).status===400);
 check('approval does not publish',(await admin('/'+id+'/approve','POST')).status===200&&(await(await admin()).json()).clips[0].status==='approved');
 const approved=(await(await admin()).json()).clips[0];check('approved candidate expiry is 90 days',approved.expires-approved.created>=89*86400000);
 await admin('/'+id+'/approve','POST');check('repeat approval does not extend expiry',(await(await admin()).json()).clips[0].expires===approved.expires);
 for(let i=0;i<6;i++)await send(form(new Uint8Array()),'ratelimit');check('daily per-IP attempts bounded',(await send(form(),'ratelimit')).status===429);
 check('delete removes candidate',(await admin('/'+id+'/delete','POST')).status===200&&(await admin('/'+id+'/audio')).status===404);
 const body=new Request('https://x',{method:'POST',body:new Uint8Array(100)});await assert.rejects(()=>boundedBody(body,20));check('stream body size enforced without length header',true);
 r=await send(form(wav(1,7)),'expiry');const exp=await r.json();db.prepare('UPDATE clips SET expires=0 WHERE id=?').run(exp.id);await inbox.alarm();check('alarm erases expired binary and metadata',db.prepare('SELECT COUNT(*) AS n FROM clips').get().n===0);
 db.prepare('INSERT OR REPLACE INTO gates VALUES (?,20,?)').run('uploads:'+Math.floor(Date.now()/86400000),Date.now()+86400000);check('global successful upload cap enforced',(await send(form(wav(1,8)),'global-limit')).status===429);
 db.close();console.log(`${checks} submission security/format checks passed.`);
}
