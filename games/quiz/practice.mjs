// Separate static practice session. Multiplayer never imports the practice answer pack.
export class Practice {
 constructor(pack){this.pack=pack;this.reset();}
 reset(){this.index=0;this.score=0;this.phase='question';this.selection=null;this.remaining=20000;this.paused=false;}
 update(dt){if(this.phase!=='question'||this.paused)return;this.remaining=Math.max(0,this.remaining-Math.max(0,dt));if(!this.remaining)this.finish(null);}
 finish(choice){if(this.phase!=='question'||this.paused)return false;if(choice!==null&&(!Number.isInteger(choice)||choice<0||choice>3))return false;this.selection=choice;if(choice===this.pack[this.index].correct)this.score+=500+Math.floor(500*this.remaining/20000);this.phase=this.index===9?'finished':'reveal';return true;}
 next(){if(this.phase!=='reveal')return;this.index++;this.selection=null;this.remaining=20000;this.phase='question';}
 snapshot(){const q=this.pack[this.index],closed=this.phase!=='question';return {phase:this.phase,round:this.index+1,total:10,score:this.score,selection:this.selection,paused:this.paused,remaining:this.remaining,question:{text:q.question,options:q.options,...(closed?{correct:q.correct,explanation:q.explanation,source:q.source}:{})}};}
}
