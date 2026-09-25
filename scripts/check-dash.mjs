import assert from 'node:assert/strict';
import {Dash,GROUND} from '../games/dash/engine.mjs';
const g=new Dash(()=>.25);g.start();for(let i=0;i<240;i++)g.step(1/120);assert.equal(g.obstacles.length,0,'introductory grace');
assert.ok(g.jump());g.step(.02);assert.ok(g.y>0);assert.equal(g.jump(),false,'no double jump');
g.pause();const snapshot=[g.y,g.time,g.distance];g.step(30);assert.deepEqual([g.y,g.time,g.distance],snapshot);g.resume();g.step(.02);assert.ok(g.time>snapshot[1]);
g.start();g.obstacles=[{x:120,y:GROUND-42,width:38,height:42,type:'crate'}];g.step(.02);assert.equal(g.status,'over','ground collision');
g.start();g.obstacles=[{x:170,y:GROUND-42,width:38,height:42,type:'crate'}];g.jump();for(let i=0;i<120;i++)g.step(1/120);assert.equal(g.status,'playing','jump clears crate');
g.start();g.obstacles=[{x:125,y:GROUND-105,width:54,height:55,type:'arch'}];g.duck(true);for(let i=0;i<80;i++)g.step(1/120);assert.equal(g.status,'playing','duck clears overhead sign');
g.start();g.obstacles=[{x:125,y:GROUND-105,width:54,height:55,type:'arch'}];g.step(.04);assert.equal(g.status,'over','standing hits sign');
g.start();g.pickups=[{x:125,y:GROUND-18,radius:9}];g.step(.04);assert.equal(g.coins,1);assert.ok(g.score>=25);
g.start();g.step(10);assert.ok(g.time<=.101,'stalled frames cannot teleport player');
let seed=27;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/2**32);const run=new Dash(random);run.start();
for(let i=0;i<120*600;i++){
 const next=run.obstacles.find(o=>o.x+o.width>92),gap=next?next.x-122:Infinity;
 run.duck(next?.type==='arch'&&gap<run.speed*.4);
 if(next?.type==='crate'&&gap<run.speed*.3&&run.y===0)run.jump();
 run.step(1/120);assert.equal(run.status,'playing','legal response clears generated encounter at every speed');
 assert.ok(run.obstacles.length<5&&run.pickups.length<6,'bounded world history');
}
assert.equal(run.speed,420);assert.ok(run.spawned>200);assert.ok(run.coins>0);
console.log(`Dash mechanics passed: jump/duck/hit, stars, pause/grace/stalls, plus ${run.spawned} seeded encounters over 10 minutes with legal responses and bounded memory.`);
