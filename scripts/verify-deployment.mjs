import {readdir, readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const origin=process.argv[2], root=path.resolve('dist');
async function walk(dir){const files=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);files.push(...(e.isDirectory()?await walk(p):[p]));}return files;}
// Pages consumes _headers as configuration; verify its effects instead of expecting a public file.
const all=await walk(root), files=all.filter(file=>path.relative(root,file)!=='_headers'), results=[], configurationChecks=[];
for(let i=0;i<files.length;i+=8) await Promise.all(files.slice(i,i+8).map(async file=>{const name=path.relative(root,file).replaceAll('\\','/');const response=await fetch(new URL(name,origin));const expected=await readFile(file);const actual=Buffer.from(await response.arrayBuffer());const hash=b=>createHash('sha256').update(b).digest('hex');results.push({path:name,status:response.status,type:response.headers.get('content-type'),match:hash(expected)===hash(actual)});}));
await mkdir('output',{recursive:true});
if(all.some(file=>path.relative(root,file)==='_headers')){
 let route=null;const rules=new Map();for(const line of (await readFile(path.join(root,'_headers'),'utf8')).split(/\r?\n/)){if(line.startsWith('/')){route=line.trim();rules.set(route,[]);}else if(route&&line.trim()){const at=line.indexOf(':');rules.get(route).push([line.slice(0,at).trim(),line.slice(at+1).trim()]);}}
 for(const [route,headers]of rules){const response=await fetch(new URL(route,origin));for(const [name,value]of headers)configurationChecks.push({path:route,header:name,match:response.headers.get(name)?.includes(value)===true});}
}
await writeFile('output/asset-verification.json',JSON.stringify({origin,results,configurationChecks},null,2));
const bad=results.filter(r=>r.status!==200||!r.match),badHeaders=configurationChecks.filter(r=>!r.match);console.log(JSON.stringify({origin,files:results.length,headerChecks:configurationChecks.length,failed:[...bad,...badHeaders]},null,2));if(bad.length||badHeaders.length)process.exitCode=1;
