import questions from './quiz-questions.json' with {type:'json'};
export function validateQuestions(pack){if(!Array.isArray(pack)||pack.length<10)throw Error('Need ten questions.');const ids=new Set();for(const q of pack){if(!q||typeof q.id!=='string'||ids.has(q.id)||typeof q.question!=='string'||!q.question.trim()||q.options?.length!==4||new Set(q.options).size!==4||q.options.some(x=>typeof x!=='string'||!x.trim())||!Number.isInteger(q.correct)||q.correct<0||q.correct>3||!q.explanation||!q.source?.startsWith('https://'))throw Error('Invalid question.');ids.add(q.id);}return true;}
validateQuestions(questions);
const shuffled=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
export function startQuiz(r,now){if(r.players.filter(p=>p.offline===null).length<2)throw Error('Quiz needs 2 connected players.');r.players.forEach(p=>p.score=0);r.quiz=shuffled(questions).slice(0,10).map(q=>{const order=shuffled([0,1,2,3]);return {...q,options:order.map(i=>q.options[i]),correct:order.indexOf(q.correct)};});r.round=0;r.total=10;r.locked=true;r.reason='';r.feed=[];nextQuiz(r,now);}
export function nextQuiz(r,now){if(r.round>=10){r.phase='finished';r.deadline=0;return;}r.round++;r.roundId=crypto.randomUUID();r.answers={};r.phase='question';r.started=now;r.deadline=now+20000;r.eligible=r.players.filter(p=>p.offline===null).map(p=>p.id);}
export function closeQuiz(r){const q=r.quiz[r.round-1];for(const p of r.players){const a=r.answers[p.id];if(a?.choice===q.correct)p.score+=500+Math.floor(500*Math.max(0,20000-a.elapsed)/20000);}r.phase=r.round===10?'finished':'quizReveal';r.deadline=0;}
export function quizAction(r,p,m,now){
 if(m.roundId!==r.roundId)throw Error('This question has closed or changed.');
 if(m.type==='next'){if(p.id!==r.host)throw Error('Only the host can do that.');if(r.phase!=='quizReveal')throw Error('Wait until this question closes.');if(r.players.filter(p=>p.offline===null).length<2)throw Error('Wait for 2 connected players.');nextQuiz(r,now);return;}
 if(m.type!=='answer')throw Error('Unknown quiz command.');if(r.phase!=='question'||m.roundId!==r.roundId)throw Error('This question has closed or changed.');if(!r.eligible.includes(p.id))throw Error('Join the next question.');if(r.answers[p.id])throw Error('Your answer is already locked.');if(!Number.isInteger(m.choice)||m.choice<0||m.choice>3)throw Error('Choose one of the four answers.');
 r.answers[p.id]={choice:m.choice,elapsed:Math.max(0,now-r.started)};
 if(r.eligible.every(id=>r.answers[id]||!r.players.some(p=>p.id===id)))closeQuiz(r);
}
export function quizSnapshot(r,id){const q=r.quiz?.[r.round-1];if(!q)return {};const closed=r.phase==='quizReveal'||r.phase==='finished';return {question:{text:q.question,options:q.options,...(closed?{correct:q.correct,explanation:q.explanation,source:q.source}:{})},selection:r.answers[id]?.choice??null,answered:Object.keys(r.answers),eligible:r.eligible};}
