import {readdir, readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const origin=process.argv[2], root=path.resolve('dist');
async function walk(dir){const files=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);files.push(...(e.isDirectory()?await walk(p):[p]));}return files;}
const files=await walk(root), results=[];
for(let i=0;i<files.length;i+=8) await Promise.all(files.slice(i,i+8).map(async file=>{const name=path.relative(root,file).replaceAll('\\','/');const response=await fetch(new URL(name,origin));const expected=await readFile(file);const actual=Buffer.from(await response.arrayBuffer());const hash=b=>createHash('sha256').update(b).digest('hex');results.push({path:name,status:response.status,type:response.headers.get('content-type'),match:hash(expected)===hash(actual)});}));
await mkdir('output',{recursive:true});
await writeFile('output/asset-verification.json',JSON.stringify({origin,results},null,2));
const bad=results.filter(r=>r.status!==200||!r.match);console.log(JSON.stringify({origin,files:results.length,failed:bad},null,2));if(bad.length)process.exitCode=1;
