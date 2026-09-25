import assert from 'node:assert/strict';
import {Smash,LEVELS,bricksFor,PADDLE_Y} from '../games/smash/engine.mjs';
assert.equal(new Set(LEVELS.map(x=>x.join(''))).size,5);
const g=new Smash();g.reset();assert.equal(g.lives,3);g.movePaddle(-100);assert.equal(g.paddle,g.paddleWidth/2);g.movePaddle(999);assert.equal(g.paddle,480-g.paddleWidth/2);g.launch();
g.ball={x:8,y:300,radius:7,vx:-300,vy:100};g.step(.02);assert.ok(g.ball.vx>0,'left wall rebound');
g.ball={x:g.paddle,y:PADDLE_Y-10,radius:7,vx:0,vy:300};g.step(.02);assert.ok(g.ball.vy<0,'paddle rebound');
g.ball.vx=1000;g.ball.vy=0.01;g.normalize();assert.ok(Math.abs(g.ball.vy)>=g.speed*.319,'horizontal loop guard');
g.pause();const before=structuredClone({ball:g.ball,paddle:g.paddle,time:g.time});g.movePaddle(0);g.step(20);assert.deepEqual({ball:g.ball,paddle:g.paddle,time:g.time},before);g.resume();
g.power('wide');assert.equal(g.paddleWidth,126);g.power('slow');assert.ok(g.speed<200);g.power('life');assert.equal(g.lives,4);for(let i=0;i<10;i++)g.power('life');assert.equal(g.lives,5);g.time+=13;assert.equal(g.paddleWidth,86);assert.equal(g.speed,255);
g.reset();for(let life=2;life>=0;life--){g.launch();g.ball.y=440;g.ball.vy=200;g.step(.01);assert.equal(g.lives,life);assert.equal(g.status,life?'ready':'over');}
// Real collisions, one targeted trajectory per brick; verify each authored level can finish.
for(let level=1;level<=5;level++){
 g.reset(level);assert.ok(g.bricks.length>=20);g.launch();
 for(const target of g.bricks){while(target.hp){g.ball={x:target.x+target.width/2,y:target.y+target.height+8,radius:7,vx:0,vy:-g.speed};g.step(.012);}}
 assert.equal(g.status,level===5?'won':'level');assert.ok(g.score>=bricksFor(level).length*10);if(level<5){const score=g.score;g.next();assert.equal(g.level,level+1);assert.equal(g.score,score);}
}
g.reset();g.launch();g.ball={x:240,y:200,radius:7,vx:80,vy:300};g.step(3);assert.ok(g.time<=.101,'large stalled frame is bounded');
console.log('Smash mechanics passed: five unique levels cleared through collisions, wall/paddle rebounds, loop guard, power-up expiry/cap, life loss, pause, progression and stalled frames.');
