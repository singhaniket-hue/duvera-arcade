// Original Duvera brick breaker. Fixed 240 Hz collision steps; five original layouts. GPL-3.0.
export const WIDTH=480,HEIGHT=420,PADDLE_Y=382;
export const LEVELS=[
 ['11111111','11111111','01111110'],
 ['10100101','11111111','01111110','00111100'],
 ['11000011','01100110','00111100','01100110','11000011'],
 ['12122121','01011010','11111111','00100100'],
 ['22211222','12122121','01111110','00122100','00011000']
];
export function bricksFor(level){const rows=LEVELS[Math.max(0,Math.min(4,level-1))];let id=0;return rows.flatMap((row,y)=>[...row].flatMap((hp,x)=>hp==='0'?[]:[{id:id++,x:20+x*55,y:42+y*25,width:49,height:19,hp:Number(hp)}]));}
export class Smash {
 constructor(){this.level=1;this.reset(1);this.status='menu';}
 reset(level=1){this.level=Math.max(1,Math.min(5,Math.floor(level)||1));this.lives=3;this.score=0;this.time=0;this.wideUntil=0;this.slowUntil=0;this.drops=[];this.broken=0;this.direction=0;this.paddle=240;this.accumulator=0;this.bricks=bricksFor(this.level);this.serve();}
 get paddleWidth(){return this.time<this.wideUntil?126:86;}
 get speed(){return (255+(this.level-1)*24)* (this.time<this.slowUntil?.7:1);}
 serve(){this.ball={x:this.paddle,y:PADDLE_Y-10,radius:7,vx:0,vy:0};this.status='ready';}
 launch(){if(this.status!=='ready')return;this.status='playing';this.ball.vx=this.speed*.32;this.ball.vy=-this.speed*Math.sqrt(1-.32**2);}
 movePaddle(x){if(this.status==='paused')return;this.paddle=Math.max(this.paddleWidth/2,Math.min(WIDTH-this.paddleWidth/2,x));if(this.status==='ready')this.ball.x=this.paddle;}
 pause(){if(['ready','playing'].includes(this.status)){this.beforePause=this.status;this.status='paused';this.direction=0;this.accumulator=0;}}
 resume(){if(this.status==='paused')this.status=this.beforePause;}
 next(){if(this.status==='level'&&this.level<5){const lives=this.lives,score=this.score;this.reset(this.level+1);this.lives=lives;this.score=score;}}
 power(type){if(type==='wide')this.wideUntil=this.time+12;if(type==='slow')this.slowUntil=this.time+10;if(type==='life')this.lives=Math.min(5,this.lives+1);this.movePaddle(this.paddle);}
 normalize(){const b=this.ball,s=this.speed;const magnitude=Math.hypot(b.vx,b.vy)||s;b.vx=b.vx/magnitude*s;b.vy=b.vy/magnitude*s;const min=s*.32;if(Math.abs(b.vy)<min){b.vy=(b.vy<0?-1:1)*min;b.vx=(b.vx<0?-1:1)*Math.sqrt(s*s-min*min);}}
 tick(dt){
  this.time+=dt;this.movePaddle(this.paddle+this.direction*390*dt);
  if(this.status==='ready')return;
  const b=this.ball,r=b.radius,oldX=b.x,oldY=b.y;this.normalize();b.x+=b.vx*dt;b.y+=b.vy*dt;
  if(b.x<r){b.x=r;b.vx=Math.abs(b.vx);}if(b.x>WIDTH-r){b.x=WIDTH-r;b.vx=-Math.abs(b.vx);}if(b.y<r){b.y=r;b.vy=Math.abs(b.vy);}
  if(b.vy>0&&oldY+r<=PADDLE_Y+2&&b.y+r>=PADDLE_Y&&Math.abs(b.x-this.paddle)<=this.paddleWidth/2+r){
   b.y=PADDLE_Y-r;const ratio=Math.max(-1,Math.min(1,(b.x-this.paddle)/(this.paddleWidth/2)));const angle=ratio*Math.PI*.34;b.vx=Math.sin(angle)*this.speed;b.vy=-Math.cos(angle)*this.speed;
  }
  for(const brick of this.bricks){
   if(brick.hp<=0||b.x+r<=brick.x||b.x-r>=brick.x+brick.width||b.y+r<=brick.y||b.y-r>=brick.y+brick.height)continue;
   if(oldY+r<=brick.y||oldY-r>=brick.y+brick.height)b.vy=-b.vy;else if(oldX+r<=brick.x||oldX-r>=brick.x+brick.width)b.vx=-b.vx;else b.vy=-b.vy;
   b.x=oldX;b.y=oldY;brick.hp--;this.score+=10;
   if(brick.hp===0){this.broken++;if(brick.id%9===4)this.drops.push({x:brick.x+brick.width/2,y:brick.y,type:['wide','slow','life'][Math.floor(brick.id/9)%3]});}
   break;
  }
  for(const d of this.drops)d.y+=110*dt;
  this.drops=this.drops.filter(d=>{if(d.y>=PADDLE_Y-8&&d.y<=PADDLE_Y+12&&Math.abs(d.x-this.paddle)<this.paddleWidth/2+9){this.power(d.type);return false;}return d.y<HEIGHT+10;});
  if(this.bricks.every(b=>b.hp===0)){this.status=this.level===5?'won':'level';this.drops=[];return;}
  if(b.y-r>HEIGHT){this.lives--;this.drops=[];if(this.lives===0)this.status='over';else this.serve();}
 }
 step(seconds){if(!['ready','playing'].includes(this.status))return;this.accumulator+=Math.max(0,Math.min(.1,seconds));while(this.accumulator>=1/240&&['ready','playing'].includes(this.status)){this.tick(1/240);this.accumulator-=1/240;}}
}
