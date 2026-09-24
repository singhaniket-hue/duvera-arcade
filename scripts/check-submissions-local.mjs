import {spawn,execFileSync} from 'node:child_process';
import {mkdir,mkdtemp,open} from 'node:fs/promises';
import net from 'node:net';import path from 'node:path';import {randomBytes} from 'node:crypto';
const free=()=>new Promise(r=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
await mkdir('output',{recursive:true});const state=await mkdtemp(path.resolve('output/submission-test-')),port=await free(),sitePort=await free(),key=randomBytes(32).toString('hex'),log=await open(path.join(state,'worker.log'),'w');
const env={...process.env,SUBMISSION_ENDPOINT:'http://127.0.0.1:'+port,SUBMISSION_TEST_KEY:key,TEST_BASE_URL:'http://127.0.0.1:'+sitePort+'/'};
const worker=spawn(process.execPath,['multiplayer/node_modules/wrangler/bin/wrangler.js','dev','--config','submissions/wrangler.jsonc','--ip','127.0.0.1','--port',String(port),'--persist-to',state,'--var','ADMIN_KEY:'+key],{stdio:['ignore',log.fd,log.fd],windowsHide:true,detached:process.platform!=='win32',env:{...env,WRANGLER_LOG_PATH:path.join(state,'wrangler.log')}});
const site=spawn(process.execPath,['scripts/serve.mjs','--host','127.0.0.1','--port',String(sitePort)],{stdio:'ignore',windowsHide:true,detached:process.platform!=='win32',env});
try{for(const url of[env.SUBMISSION_ENDPOINT,env.TEST_BASE_URL]){let ready=false;for(let i=0;i<120;i++){try{await fetch(url);ready=true;break;}catch{await new Promise(r=>setTimeout(r,250));}}if(!ready)throw Error('Local service failed to start: '+state);}
 for(const script of ['check-submissions','submissions-browser-check']){const code=await new Promise((r,j)=>{const child=spawn(process.execPath,['scripts/'+script+'.mjs'],{stdio:'inherit',windowsHide:true,env});child.on('error',j);child.on('exit',r);});if(code!==0)throw Error(script+' failed.');}
 console.log('Submission tests passed against isolated local storage.');
}finally{for(const child of[worker,site])if(child.exitCode===null){try{if(process.platform==='win32')execFileSync('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});else process.kill(-child.pid,'SIGTERM');}catch{child.kill();}}await log.close();}
