// Original Duvera grid-bomb arena. GPL-3.0. No external game code or assets.
export const COLS=13, ROWS=11, FUSE=2.4, FIRE=.55;
export const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
export function randomSeed(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const key=(x,y)=>y*COLS+x;
export class BlastGame {
 constructor({seed=Date.now(),mode='solo'}={}) {
  this.rng=randomSeed(seed);this.mode=mode==='duo'?'duo':'solo';this.time=0;this.status='ready';this.result=null;this.bombs=[];this.flames=[];this.items=new Map();this.events=[];this.serial=0;
  const corners=[[1,1],[11,9],[11,1],[1,9]];
  this.actors=corners.map(([x,y],id)=>({id,x,y,fromX:x,fromY:y,movedAt:0,alive:true,bot:id>=(this.mode==='duo'?2:1),cooldown:0,think:0,range:2,capacity:1,speed:.16,crates:0,kills:0}));
  const safe=new Set();for(const [x,y]of corners)for(let d=-2;d<=2;d++){safe.add(key(x+d,y));safe.add(key(x,y+d));}
  this.grid=Array.from({length:ROWS},(_,y)=>Array.from({length:COLS},(_,x)=>x===0||y===0||x===COLS-1||y===ROWS-1||(x%2===0&&y%2===0)?1:!safe.has(key(x,y))&&this.rng()<.73?2:0));
 }
 start(){if(this.status==='ready'){this.status='playing';this.events.push({type:'start'});}}
 pause(){if(this.status==='playing')this.status='paused';else if(this.status==='paused')this.status='playing';}
 tile(x,y){return this.grid[y]?.[x]??1;}
 bombAt(x,y){return this.bombs.find(b=>b.x===x&&b.y===y);}
 onFire(x,y){return this.flames.some(f=>f.x===x&&f.y===y&&f.until>this.time);}
 canEnter(a,x,y){const b=this.bombAt(x,y);return this.tile(x,y)===0&&(!b||b.pass.has(a.id));}
 move(id,dir){const a=this.actors[id],d=DIRS[dir];if(this.status!=='playing'||!a?.alive||!d||a.cooldown>0)return false;
  const x=a.x+d[0],y=a.y+d[1];if(!this.canEnter(a,x,y))return false;
  for(const b of this.bombs)if(b.x===a.x&&b.y===a.y)b.pass.delete(id);
  a.fromX=a.x;a.fromY=a.y;a.x=x;a.y=y;a.movedAt=this.time;a.cooldown=a.speed;
  const item=this.items.get(key(x,y));if(item){if(item==='range')a.range=Math.min(6,a.range+1);if(item==='bomb')a.capacity=Math.min(4,a.capacity+1);if(item==='speed')a.speed=Math.max(.095,a.speed-.015);this.items.delete(key(x,y));this.events.push({type:'power',id,item});}
  if(this.onFire(x,y))this.kill(a,null);return true;
 }
 plant(id){const a=this.actors[id];if(this.status!=='playing'||!a?.alive||this.bombAt(a.x,a.y)||this.bombs.filter(b=>b.owner===id).length>=a.capacity)return false;
  this.bombs.push({id:++this.serial,x:a.x,y:a.y,owner:id,range:a.range,at:this.time+FUSE,pass:new Set(this.actors.filter(p=>p.alive&&p.x===a.x&&p.y===a.y).map(p=>p.id))});this.events.push({type:'plant',id});return true;
 }
 cells(b,grid=this.grid){const cells=[[b.x,b.y]];for(const [dx,dy]of DIRS)for(let n=1;n<=b.range;n++){const x=b.x+dx*n,y=b.y+dy*n,t=grid[y]?.[x]??1;if(t===1)break;cells.push([x,y]);if(t===2||this.bombAt(x,y))break;}return cells;}
 danger(extra=null){const danger=new Set(this.flames.filter(f=>f.until>this.time).map(f=>key(f.x,f.y)));for(const b of extra?[...this.bombs,extra]:this.bombs)for(const [x,y]of this.cells(b))danger.add(key(x,y));return danger;}
 kill(a,owner){if(!a.alive)return;a.alive=false;if(owner!==null&&owner!==a.id)this.actors[owner].kills++;this.events.push({type:'out',id:a.id});}
 explode(){const due=this.bombs.filter(b=>b.at<=this.time||this.onFire(b.x,b.y));if(!due.length)return;
  // All explosions in this tick see the same walls/crates, including chain reactions.
  const grid=this.grid.map(row=>row.slice()),done=new Set(),burned=new Map();
  for(let i=0;i<due.length;i++){const b=due[i];if(done.has(b.id))continue;done.add(b.id);this.events.push({type:'blast',x:b.x,y:b.y});
   for(const [x,y]of this.cells(b,grid)){const k=key(x,y);burned.set(k,{x,y,owner:b.owner});const chain=this.bombAt(x,y);if(chain&&!done.has(chain.id))due.push(chain);}
  }
  this.bombs=this.bombs.filter(b=>!done.has(b.id));
  for(const [k,f]of burned){this.items.delete(k);if(this.grid[f.y][f.x]===2){this.grid[f.y][f.x]=0;this.actors[f.owner].crates++;if(this.rng()<.36)this.items.set(k,['range','bomb','speed'][Math.floor(this.rng()*3)]);}
   this.flames.push({...f,until:this.time+FIRE});for(const a of this.actors)if(a.alive&&a.x===f.x&&a.y===f.y)this.kill(a,f.owner);
  }
 }
 route(a,danger,{escape=false,extra=null}={}) {
  const queue=[{x:a.x,y:a.y,first:null,dist:0}],seen=new Set([key(a.x,a.y)]);let best=null,bestScore=-Infinity;
  while(queue.length){const p=queue.shift();if(p.dist>0&&!danger.has(key(p.x,p.y))){if(escape)return p.first;
    const crate=DIRS.some(([dx,dy])=>this.tile(p.x+dx,p.y+dy)===2);
    const rival=Math.min(...this.actors.filter(t=>t.alive&&t.id!==a.id).map(t=>Math.abs(t.x-p.x)+Math.abs(t.y-p.y)));
    const score=(this.items.has(key(p.x,p.y))?18:0)+(crate?7:0)-p.dist*.65-rival*.15;
    if(score>bestScore){best=p.first;bestScore=score;}
   }
   if(p.dist>=12)continue;
   for(let offset=0;offset<4;offset++){const dir=(offset+a.id)%4,[dx,dy]=DIRS[dir],x=p.x+dx,y=p.y+dy,k=key(x,y);
    if(seen.has(k)||this.tile(x,y)!==0||this.bombAt(x,y)||(extra&&x===extra.x&&y===extra.y)||this.onFire(x,y))continue;
    if(!escape&&danger.has(k))continue;seen.add(k);queue.push({x,y,first:p.first??dir,dist:p.dist+1});
   }
  }return best;
 }
 bot(a){if(a.cooldown>0||a.think>0)return;a.think=.08;let danger=this.danger();
  if(danger.has(key(a.x,a.y))){const dir=this.route(a,danger,{escape:true});if(dir!==null)this.move(a.id,dir);return;}
  const mock={x:a.x,y:a.y,range:a.range};const cells=this.cells(mock);
  const target=cells.some(([x,y])=>this.tile(x,y)===2||this.actors.some(p=>p.alive&&p.id!==a.id&&p.x===x&&p.y===y));
  if(target&&!this.bombAt(a.x,a.y)&&this.bombs.filter(b=>b.owner===a.id).length<a.capacity){const nextDanger=this.danger(mock),escape=this.route(a,nextDanger,{escape:true,extra:mock});
   if(escape!==null&&this.plant(a.id)){this.move(a.id,escape);return;}
  }
  const dir=this.route(a,danger);if(dir!==null)this.move(a.id,dir);
 }
 step(dt){if(this.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;let remaining=Math.min(dt,1);while(remaining>0&&this.status==='playing'){const d=Math.min(remaining,.04);remaining-=d;this.time+=d;this.flames=this.flames.filter(f=>f.until>this.time);
   for(const a of this.actors){a.cooldown=Math.max(0,a.cooldown-d);a.think=Math.max(0,a.think-d);}
   this.explode();for(const a of this.actors)if(a.alive&&this.onFire(a.x,a.y))this.kill(a,this.flames.find(f=>f.x===a.x&&f.y===a.y)?.owner??null);
   const alive=this.actors.filter(a=>a.alive);if(alive.length<=1||this.time>=180||(!this.actors[0].alive&&this.mode==='solo')){this.status='over';this.result=alive.length===1?alive[0].id:null;this.events.push({type:'over',winner:this.result});break;}
   for(const a of this.actors)if(a.alive&&a.bot)this.bot(a);
  }
 }
}
