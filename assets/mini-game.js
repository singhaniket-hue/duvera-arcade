/* Shared creator configuration, safe scores and voice UI for original Duvera games. GPL-3.0. */
export function setupGame(id, defaultTitle) {
  const profile=window.ArcadeCreator;
  const theme=profile?.games?.[id] || (['draw','quiz'].includes(id)?profile?.party:null) || {};
  const title=profile?.titles?.[id] || defaultTitle;
  document.title=title+' · Duvera Arcade'; document.querySelector('h1').textContent=title;
  const home=document.querySelector('.home');home.href=profile?.home || '../../?creator=default';
  for(const [key,value] of Object.entries(profile?.palette||{}))document.documentElement.style.setProperty('--'+key,value);
  const portrait=document.querySelector('.portrait');
  const expression=key=>{if(!portrait)return;const file=theme.expressions?.[key]||theme.expressions?.idle;if(file){portrait.src=profile.assets+file;portrait.hidden=false;}else portrait.hidden=true;};
  expression('idle');
  const react=event=>window.CreatorAudio?.play(theme.sounds?.[event]||event);
  const voice=document.querySelector('#voice');voice.hidden=!profile;
  const refresh=()=>{voice.textContent=window.CreatorAudio?.settings().muted?'Voice off':'Voice on';voice.setAttribute('aria-pressed',String(!!window.CreatorAudio?.settings().muted));};
  voice.onclick=()=>{window.CreatorAudio.update({muted:!window.CreatorAudio.settings().muted});refresh();};
  window.addEventListener('creator-audio-settings',refresh);window.addEventListener('storage',refresh);refresh();
  const prefix='duvera.'+(profile?.id||'default')+'.'+id+'.';
  const read=(key,fallback=0)=>{try {const n=Number(localStorage.getItem(prefix+key));return Number.isFinite(n)&&n>=0?n:fallback;}catch{return fallback;}};
  const write=(key,value)=>{try {localStorage.setItem(prefix+key,String(value));return true;}catch{return false;}};
  return {profile,theme,expression,react,read,write};
}
