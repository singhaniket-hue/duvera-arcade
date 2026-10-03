import assert from 'node:assert/strict';
import {Stack} from '../games/stack/engine.mjs';
const g=new Stack();assert.equal(g.drop(),null);g.start();
g.moving.x=90;assert.equal(g.drop().kind,'perfect');assert.equal(g.streak,1);assert.equal(g.moving.width,180);
assert.equal(g.drop(),null,'duplicate input during settling is ignored');
g.cooldown=0;g.moving.x=100;let r=g.drop();assert.equal(r.kind,'trim');assert.equal(r.offcut.width,10);assert.equal(g.moving.width,170);assert.equal(g.streak,0);
g.cooldown=0;g.moving.x=80;r=g.drop();assert.equal(r.offcut.width,20);assert.equal(g.moving.width,150);
g.pause();const x=g.moving.x;g.step(10);assert.equal(g.moving.x,x);assert.equal(g.drop(),null);g.resume();g.step(10);assert.ok(Math.abs(g.moving.x-x)<=g.speed*.05,'long frame bounded');
g.blocks=[{x:150,width:1,level:3}];g.moving={x:150.1,width:1,level:4};g.cooldown=0;assert.equal(g.drop().kind,'trim');assert.ok(Math.abs(g.moving.width-.9)<1e-9);
g.cooldown=0;g.moving.x=0;assert.equal(g.drop().kind,'miss');assert.equal(g.status,'over');
g.start();for(let i=0;i<1000;i++){g.cooldown=0;g.moving.x=g.blocks.at(-1).x;assert.equal(g.drop().kind,'perfect');}
assert.equal(g.score,1000);assert.equal(g.streak,1000);assert.equal(g.blocks.length,40);assert.equal(g.speed,245);
g.start();assert.equal(g.score,0);assert.equal(g.blocks.length,1);
console.log('Stack mechanics passed: exact placements, both overhangs, narrow blocks, duplicate input, miss, pause, long frames, 1,000-block bounded tower and reset.');
