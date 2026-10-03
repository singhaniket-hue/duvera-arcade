// Original Duvera Stack mechanics. GPL-3.0.
export class Stack {
  constructor() { this.reset(); }
  reset() {
    this.blocks = [{x:90, width:180, level:0}];
    this.score=0; this.streak=0; this.bestStreak=0; this.status='ready'; this.direction=1;
    this.moving={x:0,width:180,level:1}; this.cooldown=0;
  }
  start() { this.reset(); this.status='playing'; }
  get speed() { return Math.min(245, 80+this.score*5); }
  step(seconds) {
    if(this.status!=='playing') return;
    const dt=Math.min(Math.max(seconds,0),0.05);
    this.cooldown=Math.max(0,this.cooldown-dt);
    this.moving.x+=this.direction*this.speed*dt;
    const limit=360-this.moving.width;
    if(this.moving.x>limit) {this.moving.x=limit;this.direction=-1;}
    if(this.moving.x<0) {this.moving.x=0;this.direction=1;}
  }
  drop() {
    if(this.status!=='playing'||this.cooldown>0) return null;
    const top=this.blocks.at(-1), moving={...this.moving};
    const perfect=Math.abs(moving.x-top.x)<=Math.min(3,moving.width*0.08);
    if(perfect) moving.x=top.x;
    const left=Math.max(top.x,moving.x),right=Math.min(top.x+top.width,moving.x+moving.width);
    if(right-left<=0) {this.status='over';return {kind:'miss',offcut:moving};}
    const offcut=perfect?null:moving.x<top.x?{...moving,width:left-moving.x}:{...moving,x:right,width:moving.x+moving.width-right};
    const block={x:left,width:right-left,level:++this.score};
    this.blocks.push(block); if(this.blocks.length>40)this.blocks.shift();
    this.streak=perfect?this.streak+1:0;this.bestStreak=Math.max(this.bestStreak,this.streak);
    this.direction=this.score%2===0?1:-1;
    this.moving={x:this.direction===1?0:360-block.width,width:block.width,level:this.score+1};
    this.cooldown=0.18;
    return {kind:perfect?'perfect':'trim',offcut,score:this.score,streak:this.streak};
  }
  pause() {if(this.status==='playing')this.status='paused';}
  resume() {if(this.status==='paused')this.status='playing';}
}
