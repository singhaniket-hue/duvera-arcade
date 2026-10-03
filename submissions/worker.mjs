import {inspectAudio,MAX_BYTES} from '../assets/audio-upload-format.mjs';
const DAY=86400000,CREATORS=new Set(['moosher']);
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(n=>n.toString(16).padStart(2,'0')).join('');
function allowed(origin){try{const u=new URL(origin);return u.origin===origin&&((u.protocol==='https:'&&(u.hostname==='moosher.duvera.app'||u.hostname==='duvera-moosher.pages.dev'||u.hostname.endsWith('.duvera-moosher.pages.dev')))||(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)));}catch{return false;}}
async function authorized(req,key){const value=req.headers.get('Authorization')||'';if(!key||key.length<40||value.length>200)return false;const a=await hash(value),b=await hash('Bearer '+key);let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
export default {async fetch(req,env){
  const origin=req.headers.get('Origin')||'';
  if(!allowed(origin))return json({error:'This website origin is not allowed.'},403);
  const cors=response=>{const headers=new Headers(response.headers);headers.set('Access-Control-Allow-Origin',origin);headers.set('Vary','Origin');return new Response(response.body,{status:response.status,headers});};
  if(req.method==='OPTIONS')return cors(new Response(null,{status:204,headers:{'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Max-Age':'600'}}));
  const path=new URL(req.url).pathname,match=path.match(/^\/(submit|admin)\/([a-z0-9-]+)(?:\/([a-f0-9-]{36})(?:\/(audio|approve|delete))?)?$/);
  if(!match||!CREATORS.has(match[2]))return cors(json({error:'Not found.'},404));
  if(!env.ADMIN_KEY||env.ADMIN_KEY.length<40)return cors(json({error:'The submission inbox is temporarily unavailable. Please try later.'},503));
  if(match[1]==='admin'&&!await authorized(req,env.ADMIN_KEY))return cors(json({error:'Enter the private review key.'},401));
  if(match[1]==='submit'&&(req.method!=='POST'||match[3]))return cors(json({error:'Method not allowed.'},405));
  try{
    const headers=new Headers(req.headers);headers.delete('Authorization');
    // Daily salted digest; never persist raw network addresses or trust client-supplied internal headers.
    headers.set('X-Inbox-IP',await hash(env.ADMIN_KEY+':'+Math.floor(Date.now()/DAY)+':'+(req.headers.get('CF-Connecting-IP')||'local')));
    const internal=new Request('https://inbox'+path,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:req.body,duplex:'half'});
    return cors(await env.INBOX.get(env.INBOX.idFromName(match[2])).fetch(internal));
  }catch{return cors(json({error:'The inbox is unavailable or at its quota. Please try later; your clip has not been published.'},503));}
}};
export async function boundedBody(req,limit){
  if(Number(req.headers.get('Content-Length'))>limit)throw new Error('Request too large.');
  const reader=req.body?.getReader();if(!reader)throw new Error('Choose an audio file.');let size=0;const chunks=[];
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new Error('Request too large.');}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}return bytes;
}
export function metadata(form){
  const field=(name,max,required=false)=>{const value=form.get(name);if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw new Error('Check the clip details.');return value.trim();};
  const title=field('title',80,true),credit=field('credit',40),note=field('note',400),reaction=field('reaction',20,true),source=field('source',500,true);
  if(form.get('consent')!=='yes'||!['start','milestone','win','lose','other'].includes(reaction))throw new Error('Confirm the source and permission statement.');
  if(form.get('website'))throw new Error('Submission could not be accepted.');
  let url;try{url=new URL(source);}catch{throw new Error('Enter a public source video URL.');}
  if(url.protocol!=='https:'||url.username||url.password)throw new Error('Use an HTTPS source video URL without login details.');
  const start=Number(field('start',12,true)),end=Number(field('end',12,true));
  if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end-start>30||end>86400)throw new Error('Enter source start/end times in seconds, covering at most 30 seconds.');
  return {title,credit,note,reaction,source:url.href,start,end,consentVersion:1};
}
export class AudioInbox {
  constructor(ctx){this.ctx=ctx;this.sql=ctx.storage.sql;this.sql.exec('CREATE TABLE IF NOT EXISTS clips (id TEXT PRIMARY KEY, created INTEGER, expires INTEGER, status TEXT, info TEXT, digest TEXT, bytes INTEGER, audio BLOB); CREATE TABLE IF NOT EXISTS gates (key TEXT PRIMARY KEY, count INTEGER, expires INTEGER)');}
  one(q,...args){return this.sql.exec(q,...args).toArray()[0];}
  cleanup(now){this.sql.exec('DELETE FROM clips WHERE expires<=?',now);this.sql.exec('DELETE FROM gates WHERE expires<=?',now);}
  async alarm(){this.cleanup(Date.now());if(this.one('SELECT COUNT(*) AS n FROM clips').n||this.one('SELECT COUNT(*) AS n FROM gates').n)await this.ctx.storage.setAlarm(Date.now()+DAY);}
  gate(ip,now){return this.ctx.storage.transactionSync(()=>{
    const day=Math.floor(now/DAY),expires=(day+1)*DAY,keys=[['ip:'+day+':'+ip,6],['attempts:'+day,60]];
    if(keys.some(([key,max])=>(this.one('SELECT count FROM gates WHERE key=?',key)?.count||0)>=max))return false;
    for(const [key] of keys)this.sql.exec('INSERT INTO gates VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1',key,expires);return true;
  });}
  async fetch(req){
    const now=Date.now(),parts=new URL(req.url).pathname.split('/').slice(1),[kind,creator,id,action]=parts;
    if(kind==='submit'){
      if(!this.gate(req.headers.get('X-Inbox-IP')||'local',now))return json({error:'Submission limit reached. Please try tomorrow.'},429);
      await this.ctx.storage.setAlarm(now+DAY);
      let form,info,bytes,audio;
      try{const body=await boundedBody(req,MAX_BYTES+8192);form=await new Request('https://inbox',{method:'POST',headers:{'Content-Type':req.headers.get('Content-Type')||''},body}).formData();info=metadata(form);const file=form.get('audio');if(!file||typeof file.arrayBuffer!=='function'||file.size>MAX_BYTES)throw new Error('Choose an MP3 or WAV file of at most 1 MiB.');bytes=await file.arrayBuffer();audio=inspectAudio(bytes);}catch(error){return json({error:error.message||'Invalid audio upload.'},400);}
      const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
      const response=this.ctx.storage.transactionSync(()=>{
        this.cleanup(now);
        if(this.one('SELECT id FROM clips WHERE digest=? LIMIT 1',digest))return json({error:'This clip is already in the private review inbox.'},409);
        const total=this.one('SELECT COUNT(*) AS n FROM clips'),dayKey='uploads:'+Math.floor(now/DAY);
        if(total.n>=100||(this.one('SELECT count FROM gates WHERE key=?',dayKey)?.count||0)>=20)return json({error:'The review inbox is full for now. Please try again later.'},429);
        const id=crypto.randomUUID();this.sql.exec('INSERT INTO clips VALUES (?,?,?,?,?,?,?,?)',id,now,now+30*DAY,'pending',JSON.stringify({...info,...audio,creator}),digest,audio.bytes,bytes);
        this.sql.exec('INSERT INTO gates VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1',dayKey,(Math.floor(now/DAY)+1)*DAY);
        return json({id,message:'Received for private review. Your clip is not published or added to any game.'},201);
      });return response;
    }
    // This class is reachable only through the authenticated Worker route.
    if(!id&&req.method==='GET'){
      const clips=this.sql.exec('SELECT id,created,expires,status,info FROM clips WHERE expires>? ORDER BY created DESC',now).toArray().map(row=>({...row,info:JSON.parse(row.info)}));return json({clips});
    }
    const clip=id?this.one('SELECT id,expires,status,info FROM clips WHERE id=? AND expires>?',id,now):null;if(!clip)return json({error:'Submission no longer exists or has expired.'},404);
    if(action==='audio'&&req.method==='GET'){
      const info=JSON.parse(clip.info),data=this.one('SELECT audio FROM clips WHERE id=?',id).audio;
      return new Response(data,{headers:{'Content-Type':info.type,'Content-Disposition':`attachment; filename="clip-${id}.${info.extension}"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});
    }
    if(action==='approve'&&req.method==='POST'){
      if(clip.status!=='approved')this.sql.exec('UPDATE clips SET status=?,expires=? WHERE id=?','approved',now+90*DAY,id);
      return json({message:'Approved for a later game update. Download the clip and source details; nothing has been published.'});
    }
    if(action==='delete'&&req.method==='POST'){this.sql.exec('DELETE FROM clips WHERE id=?',id);return json({message:'Submission deleted.'});}
    return json({error:'Method not allowed.'},405);
  }
}
