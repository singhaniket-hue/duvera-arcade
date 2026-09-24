import assert from 'node:assert/strict';
import questions from '../multiplayer/quiz-questions.json' with {type:'json'};
import practice from '../games/quiz/practice.json' with {type:'json'};
import {validateQuestions} from '../multiplayer/quiz-core.mjs';
import {createParty,addPlayer,partyAction,partySnapshot,advance,depart} from '../multiplayer/party-core.mjs';
import {Practice} from '../games/quiz/practice.mjs';
let now=100000,checks=0;const check=(n,fn)=>{fn();checks++;console.log('PASS '+n);};
check('source-linked question packs have ten unique valid questions',()=>{validateQuestions(questions);validateQuestions(practice);assert.equal(questions.length,10);assert.equal(practice.length,10);assert.ok(practice.every(p=>!questions.some(q=>q.id===p.id)));assert.throws(()=>validateQuestions([{...questions[0],correct:7},...questions.slice(1)]),/Invalid/);});
const r=createParty('quiz',now),a=addPlayer(r,'a','Alice',0,now);a.offline=null;
const act=(p,type,extra={})=>partyAction(r,p.id,{id:crypto.randomUUID(),type,roundId:r.roundId,...extra},now);
check('two participants required',()=>assert.throws(()=>act(a,'start'),/2/));const b=addPlayer(r,'b','Bob',1,now);b.offline=null;
check('guest cannot start',()=>assert.throws(()=>act(b,'start'),/host/));act(a,'start');
check('ten shuffled server questions and 20-second deadline',()=>{assert.equal(r.quiz.length,10);assert.equal(r.deadline-now,20000);assert.equal(new Set(r.quiz.map(q=>q.id)).size,10);});
for(let i=1;i<=10;i++){
 const q=r.quiz[r.round-1],s=partySnapshot(r,b.id,now);check('question '+i+' hides answers and explanation',()=>{assert.equal(s.question.correct,undefined);assert.equal(s.question.explanation,undefined);assert.equal(s.question.source,undefined);assert.equal(s.quiz,undefined);});
 if(i===1){check('invalid selection and premature next rejected',()=>{assert.throws(()=>act(a,'answer',{choice:4}),/four/);assert.throws(()=>act(a,'next'),/closes/);});}
 const previous=a.score;act(a,'answer',{choice:q.correct,elapsed:0,score:999999});check('score withheld until question closes '+i,()=>{assert.equal(a.score,previous);assert.equal(partySnapshot(r,b.id,now).selection,null);});
 if(i===1)check('duplicate answer cannot change or inflate score',()=>assert.throws(()=>act(a,'answer',{choice:(q.correct+1)%4}),/locked/));
 now+=10000;act(b,'answer',{choice:q.correct});check('server scoring and post-close explanation '+i,()=>{assert.equal(a.score,previous+1000);assert.equal(b.score,750*i);assert.equal(partySnapshot(r,b.id,now).question.correct,q.correct);});
 if(i<10){const old=r.roundId;act(a,'next');check('stale input rejected '+i,()=>assert.throws(()=>act(b,'answer',{roundId:old,choice:0}),/changed/));}
}
check('ten questions end in final standings',()=>{assert.equal(r.phase,'finished');assert.equal(a.score,10000);assert.equal(b.score,7500);});act(a,'start');check('rematch resets all scores',()=>assert.equal(a.score+b.score,0));
now=r.deadline;check('deadline wins against late input',()=>{assert.throws(()=>act(a,'answer',{choice:r.quiz[0].correct}),/closed/);assert.equal(r.phase,'quizReveal');assert.equal(a.score,0);});
depart(r,a.id,now,true);check('host departure transfers control',()=>assert.equal(r.host,b.id));const c=addPlayer;check('active room rejects late seats',()=>assert.throws(()=>c(r,'c','C',0,now),/locked/));
const p=new Practice(practice);p.paused=true;p.update(50000);check('practice pause freezes timer',()=>assert.equal(p.remaining,20000));p.paused=false;p.update(20001);check('practice timeout reveals without scoring',()=>{assert.equal(p.phase,'reveal');assert.equal(p.score,0);});p.reset();for(let i=0;i<10;i++){p.update(1000);p.finish(practice[i].correct);if(i<9)p.next();}check('practice full match and retry',()=>{assert.equal(p.phase,'finished');assert.equal(p.score,9750);p.reset();assert.equal(p.score,0);assert.equal(p.index,0);});
console.log(`${checks} Quiz rules, scoring and practice checks passed.`);
