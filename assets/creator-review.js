(function () {
  'use strict';
  const p=window.ArcadeCreator,a=window.CreatorAudio;
  if(!p||!a)return;
  const list=document.getElementById('clip-list'), volume=document.getElementById('voice-volume'), muted=document.getElementById('mute-voices');
  const eventNames={start:'Starting a run',milestone:'A scoring milestone',win:'A win / new best',lose:'Losing a run'};
  function refresh(){const s=a.settings();volume.value=Math.round(s.volume*100);document.getElementById('volume-value').value=volume.value+'%';muted.checked=s.muted;document.querySelectorAll('[data-clip]').forEach(x=>{x.checked=!s.disabled.includes(x.dataset.clip);});}
  for(const clip of p.clips){
    const card=document.createElement('section');card.className='clip';
    const title=document.createElement('h2');title.textContent=clip.label;
    const info=document.createElement('p');info.textContent=eventNames[clip.event]+' · '+(clip.end-clip.start).toFixed(2)+' seconds';
    const quote=document.createElement('p');quote.textContent='Automatic source caption: “'+clip.transcript+'”';
    const source=document.createElement('a');source.href=p.source+'&t='+Math.floor(clip.start)+'s';source.target='_blank';source.rel='noopener';source.textContent='Source '+Math.floor(clip.start/60)+':'+String(Math.floor(clip.start%60)).padStart(2,'0')+' ↗';
    const actions=document.createElement('div');actions.className='clip-actions';
    const play=document.createElement('button');play.type='button';play.textContent='▶ Preview';play.addEventListener('click',()=>{a.play(clip.event,{id:clip.id,preview:true});document.getElementById('review-status').textContent='Preview: '+clip.label;});
    const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.dataset.clip=clip.id;
    input.addEventListener('change',()=>{const d=new Set(a.settings().disabled);if(input.checked)d.delete(clip.id);else d.add(clip.id);a.update({disabled:[...d]});});
    label.append(input,' Use in games');actions.append(play,label);card.append(title,info,quote,source,document.createElement('br'),document.createElement('br'),actions);list.append(card);
  }
  volume.addEventListener('input',()=>{a.update({volume:Number(volume.value)/100});refresh();});muted.addEventListener('change',()=>a.update({muted:muted.checked}));
  document.getElementById('stop-audio').addEventListener('click',()=>{a.stop();document.getElementById('review-status').textContent='Preview stopped.';});
  window.addEventListener('creator-audio-settings',refresh);window.addEventListener('storage',refresh);refresh();
}());
