/* Optional adapters: original gameplay remains the default. GPL-3.0. */
(function () {
  'use strict';
  const p = window.ArcadeCreator;
  if (!p) return;
  const gameID = location.pathname.match(/\/games\/([^/]+)\//)?.[1];
  if (!Object.prototype.hasOwnProperty.call(p.titles,gameID)) return;
  document.title = p.titles[gameID]+' · Moosher Arcade';
  document.documentElement.classList.add('moosher-game', 'moosher-'+gameID);
  const css = document.createElement('link'); css.rel='stylesheet'; css.href=p.root+'assets/creator-games.css'; document.head.append(css);
  const emit = event => window.CreatorAudio?.play(event);
  function addReactionSticker() {
    const sticker=document.createElement('img');sticker.className='creator-reaction-sticker';sticker.alt='';sticker.hidden=true;document.body.append(sticker);
    let timer;
    window.addEventListener('creator-reaction',({detail})=>{
      sticker.src=p.assets+'emote-'+({start:'smile',milestone:'laugh',win:'win',lose:'sad'}[detail.event]||'smile')+'.png';
      sticker.hidden=false;clearTimeout(timer);timer=setTimeout(()=>{sticker.hidden=true;},2200);
    });
  }
  if(document.body)addReactionSticker();else document.addEventListener('DOMContentLoaded',addReactionSticker,{once:true});
  if (gameID === 'clumsy-bird') {
    // Public me.save adapter, scoped to this edition; no engine file modification.
    const saved=Object.create(null), prefix='duvera.moosher.clumsy-bird.';
    const save={_init:function(){},add:function(values){
      for(const key of ['score','steps','topSteps']) {
        if(!Object.prototype.hasOwnProperty.call(values,key))continue;
        if(!Object.prototype.hasOwnProperty.call(saved,key)) {
          let value=values[key];
          try{const prior=JSON.parse(localStorage.getItem(prefix+key));if(typeof prior==='number'&&Number.isFinite(prior))value=prior;}catch(_){}
          saved[key]=value;
          Object.defineProperty(save,key,{configurable:true,get:()=>saved[key],set:value=>{saved[key]=value;try{localStorage.setItem(prefix+key,JSON.stringify(value));}catch(_){}}});
          save[key]=value;
        }
      }
    },remove:function(key){if(!['score','steps','topSteps'].includes(key))return;delete saved[key];delete save[key];try{localStorage.removeItem(prefix+key);}catch(_){}}};
    me.save=save;
    for (const resource of game.resources) {
      const replacement = {clumsy:'flap-sprite.png',logo:'flap-logo.png'}[resource.name];
      if (replacement) resource.src=p.assets+replacement;
    }
    const audioPlay = me.audio.play;
    me.audio.play = function (name) {
      if (name==='lose') emit('lose');
      if (name==='hit' && game.data.steps % 5 === 0) emit('milestone');
      return audioPlay.apply(this,arguments);
    };
    const reset = game.PlayScreen.prototype.onResetEvent;
    game.PlayScreen.prototype.onResetEvent = function () {const result=reset.apply(this,arguments);emit('start');return result;};
    const gameOver = game.GameOverScreen.prototype.onResetEvent;
    game.GameOverScreen.prototype.onResetEvent = function () {
      const result=gameOver.apply(this,arguments);
      if (game.data.newHiScore && game.data.steps>0) emit('win');
      return result;
    };
  }
  if (gameID === '2048') {
    const Storage = LocalStorageManager;
    window.LocalStorageManager = function () {Storage.call(this);this.bestScoreKey='duvera.moosher.2048.bestScore';this.gameStateKey='duvera.moosher.2048.gameState';};
    LocalStorageManager.prototype=Storage.prototype;
    let lastTop=2, started=false, wasOver=false, wasWon=false;
    const actuate = GameManager.prototype.actuate;
    GameManager.prototype.actuate = function () {
      const result=actuate.apply(this,arguments);
      let top=2;this.grid.eachCell((x,y,tile)=>{if(tile)top=Math.max(top,tile.value);});
      if(this.won&&!wasWon)emit('win');
      else if(this.over&&!wasOver)emit('lose');
      else if(top>lastTop&&top>=32)emit('milestone');
      lastTop=top;wasOver=this.over;wasWon=this.won;
      return result;
    };
    const move = GameManager.prototype.move;
    GameManager.prototype.move = function () {if(!started){emit('start');started=true;}return move.apply(this,arguments);};
    const restart = GameManager.prototype.restart;
    GameManager.prototype.restart = function () {lastTop=2;wasOver=false;wasWon=false;emit('start');return restart.apply(this,arguments);};
    document.querySelector('.title').textContent='Moosh 2048';
    document.querySelector('.game-intro').innerHTML='Same numbers. More masti. Reach <strong>2048!</strong>';
    const intro=document.querySelector('.game-explanation');
    intro.insertAdjacentHTML('beforebegin','<p class="creator-game-note">A fan-made Moosher edition · Original game by Gabriele Cirulli</p>');
  }
  if (gameID === 'hextris') {
    const baseStorage=hextrisStorage;
    window.hextrisStorage={getItem:key=>baseStorage.getItem('moosher.'+key),setItem:(key,value)=>baseStorage.setItem('moosher.'+key,value)};
    const text=renderText;
    window.renderText=function(x,y,size,color,content,font){
      if(content==='Hextris'){content='Moosh Spin';size=100;color='#175b57';}
      return text.call(this,x,y,size,color,content,font);
    };
    const start=startBtnHandler;
    window.startBtnHandler=function(){const result=start.apply(this,arguments);emit('start');return result;};
    const consolidate=consolidateBlocks;
    window.consolidateBlocks=function(){const before=score;const result=consolidate.apply(this,arguments);if(score>before)emit('milestone');return result;};
    const gameover=gameOverDisplay;
    window.gameOverDisplay=function(){const result=gameover.apply(this,arguments);emit('lose');return result;};
  }
}());
