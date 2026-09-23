/* Small, replaceable reaction player. No synthesized creator voice. GPL-3.0. */
(function () {
  'use strict';
  const profile = window.ArcadeCreator;
  if (!profile) return;
  const key = 'duvera.' + profile.id + '.audio';
  let prefs = {volume:0.55, muted:false, disabled:[]};
  let unlocked = false, current = null, lastAt = -Infinity, currentPriority = 0;
  const eventTimes = Object.create(null);
  function sync() {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (saved && typeof saved === 'object') {
        prefs.volume = Number.isFinite(saved.volume) ? Math.max(0,Math.min(1,saved.volume)) : 0.55;
        prefs.muted = saved.muted === true;
        prefs.disabled = Array.isArray(saved.disabled) ? saved.disabled.filter(x=>typeof x==='string') : [];
      }
    } catch (_) {}
    if (current) { current.volume = prefs.volume; if (prefs.muted) stop(); }
  }
  function stop() { if (current) {current.pause(); current.currentTime = 0; current = null;} }
  function update(values) {
    prefs = {...prefs,...values};
    prefs.volume = Math.max(0,Math.min(1,Number(prefs.volume)||0));
    try {localStorage.setItem(key,JSON.stringify(prefs));} catch (_) {}
    if (current) {current.volume = prefs.volume; if(prefs.muted) stop();}
    window.dispatchEvent(new CustomEvent('creator-audio-settings'));
  }
  function play(event, options = {}) {
    sync();
    const clip = profile.clips.find(c => options.id ? c.id === options.id : c.event === event);
    const now = performance.now(), priority = event === 'win' ? 3 : event === 'lose' ? 2 : 1;
    if (!clip || !unlocked || prefs.volume === 0 || document.hidden) return false;
    if (!options.preview && (prefs.muted || prefs.disabled.includes(clip.id) || (window.game && game.data.muted))) return false;
    if (!options.preview && (now-(eventTimes[event] ?? -Infinity)<7000 || (now-lastAt<3500 && priority<=currentPriority))) return false;
    stop();
    const audio = new Audio(profile.assets+'audio/'+clip.file);
    current = audio; audio.volume = prefs.volume; currentPriority=priority; lastAt=now; eventTimes[event]=now;
    audio.addEventListener('ended',()=>{if(current===audio)current=null;});
    audio.play().catch(()=>{if(current===audio)current=null;});
    window.dispatchEvent(new CustomEvent('creator-reaction',{detail:{id:clip.id,event}}));
    return true;
  }
  sync();
  for (const name of ['pointerdown','touchstart','keydown']) document.addEventListener(name,()=>{unlocked=true;},{capture:true,passive:true});
  window.addEventListener('storage',sync);
  window.addEventListener('pagehide',stop);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.CreatorAudio = {play,stop,update,settings:()=>({...prefs,disabled:[...prefs.disabled]})};
}());
