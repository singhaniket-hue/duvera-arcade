// Original fixed-step runner. World dimensions never depend on screen size. GPL-3.0.
export const GROUND=270;
export class Dash {
 constructor(random=Math.random){this.random=random;this.reset();}
 reset(){this.status='ready';this.time=0;this.distance=0;this.coins=0;this.y=0;this.vy=0;this.ducking=false;this.obstacles=[];this.pickups=[];this.next=2.8;this.spawned=0;this.score=0;this.accumulator=0;}
 start(){this.reset();this.status='playing';}
 get speed(){return Math.min(420,210+this.time*2.2);}
 get player(){return {x:92,y:GROUND-this.y-(this.ducking&&this.y===0?32:66),width:30,height:this.ducking&&this.y===0?32:66};}
 jump(){if(this.status!=='playing'||this.y>0)return false;this.ducking=false;this.vy=650;return true;}
 duck(value){this.ducking=!!value&&this.status==='playing';}
 pause(){if(this.status==='playing'){this.status='paused';this.ducking=false;this.accumulator=0;}}
 resume(){if(this.status==='paused')this.status='playing';}
 spawn(){
  // Every encounter is isolated by at least 1.65 seconds of travel. A full jump lasts ~0.76 s.
  const type=this.spawned<2?'crate':this.random()<.5?'crate':'arch';
  this.obstacles.push({x:760,y:type==='crate'?GROUND-42:GROUND-105,width:type==='crate'?38:54,height:type==='crate'?42:55,type,passed:false});
  this.pickups.push({x:820,y:type==='crate'?GROUND-93:GROUND-18,radius:9});
  this.spawned++;this.next=1.85+this.random()*.65;
 }
 tick(dt){
  this.time+=dt;this.distance+=this.speed*dt;this.next-=dt;
  this.y+=this.vy*dt;this.vy-=1700*dt;if(this.y<0){this.y=0;this.vy=0;}
  if(this.next<=0)this.spawn();
  for(const obstacle of this.obstacles)obstacle.x-=this.speed*dt;
  for(const coin of this.pickups)coin.x-=this.speed*dt;
  const p=this.player;
  const hits=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
  if(this.obstacles.some(o=>hits(p,o))){this.status='over';this.ducking=false;return;}
  this.pickups=this.pickups.filter(c=>{if(hits(p,{x:c.x-c.radius,y:c.y-c.radius,width:c.radius*2,height:c.radius*2})){this.coins++;return false;}return c.x>-20;});
  this.obstacles=this.obstacles.filter(o=>o.x+o.width>-20);this.score=Math.floor(this.distance/10)+this.coins*25;
 }
 step(seconds){if(this.status!=='playing')return;this.accumulator+=Math.max(0,Math.min(seconds,.1));while(this.accumulator>=1/120&&this.status==='playing'){this.tick(1/120);this.accumulator-=1/120;}}
}
