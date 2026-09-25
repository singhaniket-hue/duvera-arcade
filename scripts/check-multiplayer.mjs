// Reproducible local suite: real Worker + independent browsers, fresh test-only SQLite state.
import {spawn,execFileSync} from 'node:child_process';
import {mkdir,mkdtemp,open} from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
await mkdir('output',{recursive:true});const state=await mkdtemp(path.resolve('output/room-test-'));
const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const log=await open(path.join(state,'worker.log'),'w');
const worker=spawn(process.execPath,['multiplayer/node_modules/wrangler/bin/wrangler.js','dev','--config','multiplayer/wrangler.jsonc','--ip','127.0.0.1','--port',String(port),'--persist-to',state],{stdio:['ignore',log.fd,log.fd],windowsHide:true,detached:process.platform!=='win32',env:{...process.env,WRANGLER_LOG_PATH:path.join(state,'wrangler.log')}});
const endpoint='http://127.0.0.1:'+port;const env={...process.env,ROOM_ENDPOINT:endpoint};delete env.TEST_BASE_URL;delete env.SOLO_ONLY;delete env.SCREENSHOT_DIR;
try{
 let ready=false;for(let i=0;i<120;i++){if(worker.exitCode!==null)throw Error('Local Worker exited; inspect '+state);try{await fetch(endpoint);ready=true;break;}catch{await new Promise(r=>setTimeout(r,250));}}if(!ready)throw Error('Local Worker did not become ready: '+state);
 console.log('Testing local Worker at '+endpoint+'; isolated state: '+state);
 for(const file of ['check-four','check-rooms','four-browser-check','check-draw','check-party-room','draw-browser-check','check-quiz','quiz-browser-check']){
  const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['scripts/'+file+'.mjs'],{stdio:'inherit',env,windowsHide:true});child.on('error',reject);child.on('exit',resolve);});if(code!==0)throw Error(file+' failed ('+code+').');
 }
 console.log('All local multiplayer suites passed. No cloud deployment performed.');
}finally{
 if(worker.exitCode===null){try{if(process.platform==='win32')execFileSync('taskkill',['/PID',String(worker.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});else process.kill(-worker.pid,'SIGTERM');}catch{worker.kill();}}
 await log.close();
}
