import assert from 'node:assert/strict';
import {emptyBoard,move,result,chooseMove,legalMoves} from '../games/four/rules.mjs';
let b=emptyBoard();assert.equal(move(b,7,1),null);assert.equal(move(b,1.5,1),null);
for(let i=0;i<6;i++)b=move(b,0,i%2+1);assert.equal(move(b,0,1),null);
for(const indices of [[35,36,37,38],[0,7,14,21],[0,8,16,24],[21,15,9,3]]){b=emptyBoard();indices.forEach(i=>b[i]=2);assert.equal(result(b).winner,2);assert.equal(move(b,6,1),null);}
b=emptyBoard();[35,36,37].forEach(i=>b[i]=2);assert.equal(chooseMove(b,2),3,'takes immediate win');
b=emptyBoard();[35,36,37].forEach(i=>b[i]=1);for(const difficulty of ['easy','normal'])assert.equal(chooseMove(b,2,difficulty),3,'blocks immediate loss');
assert.equal(chooseMove(emptyBoard(),2),3,'normal bot values centre');
let seed=13;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);let draw=false;
for(let attempt=0;attempt<500&&!draw;attempt++){b=emptyBoard();for(let turn=0;turn<42;turn++){const options=legalMoves(b).map(c=>move(b,c,turn%2+1)).filter(n=>!result(n)?.winner);if(!options.length)break;b=options[Math.floor(random()*options.length)];}draw=!!result(b)?.draw;}
assert.ok(draw,'full legal draw fixture');assert.equal(chooseMove(b,1),null);
// Complete legal easy/normal games prove the bot never returns an illegal move.
for(let match=0;match<4;match++){b=emptyBoard();for(let ply=0;ply<42&&!result(b);ply++){const player=ply%2+1,c=chooseMove(b,player,player===1?'easy':'normal',random);b=move(b,c,player);assert.ok(b);}}
console.log('Four rules passed: all win directions, draw, invalid/full columns, terminal locks, tactical win/block, centre strategy and complete bot games.');
