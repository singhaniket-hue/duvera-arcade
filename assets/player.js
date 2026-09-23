/* Duvera Arcade player shell. GPL-3.0. */
'use strict';
const games = {
  'clumsy-bird': {name: 'Clumsy Bird', path: 'games/clumsy-bird/', controls: 'Space, click or tap to fly · M to mute'},
  '2048': {name: '2048', path: 'games/2048/', controls: 'Arrow keys or swipe to slide · R to restart'},
  'hextris': {name: 'Hextris', path: 'games/hextris/', controls: '← → or tap either side to rotate · ↓ to speed up · P to pause'}
};
const id = new URLSearchParams(window.location.search).get('game');
if (Object.prototype.hasOwnProperty.call(games, id)) {
  const creator = window.ArcadeCreator;
  if (!creator) document.querySelector('.back-link').href = './?creator=default';
  const game = {...games[id]};
  if (creator) {
    game.name = creator.titles[id];
    document.body.classList.add('creator-player');
    document.querySelector('.back-link').href = creator.home;
    document.querySelector('.back-link').textContent = '← Arcade';
    const voice = document.getElementById('creator-voice');
    voice.hidden = false;
    const refreshVoice = () => {const muted = window.CreatorAudio.settings().muted;voice.textContent = muted ? 'Voice off' : 'Voice on';voice.setAttribute('aria-pressed', String(muted));voice.setAttribute('aria-label', muted ? 'Enable creator reactions' : 'Mute creator reactions');};
    voice.addEventListener('click', () => {window.CreatorAudio.update({muted: !window.CreatorAudio.settings().muted});const audio = document.getElementById('game-frame').contentWindow.CreatorAudio;audio?.update({muted:window.CreatorAudio.settings().muted});refreshVoice();document.getElementById('game-frame').contentWindow.focus();});
    window.addEventListener('storage',refreshVoice);
    refreshVoice();
  }
  const frame = document.getElementById('game-frame');
  const focusButton = document.getElementById('focus-game');
  const fullscreenButton = document.getElementById('fullscreen');
  const status = document.getElementById('player-status');
  document.title = game.name + (creator ? ' · Moosher Arcade' : ' · Duvera Arcade');
  document.getElementById('game-title').textContent = game.name;
  document.getElementById('game-controls').textContent = game.controls;
  document.getElementById('player-error').hidden = true;
  frame.title = game.name + ' game';
  frame.hidden = false;
  frame.addEventListener('load', () => { frame.contentWindow.focus(); });
  frame.src = game.path + (creator ? '?creator=moosher' : '?creator=default');
  focusButton.hidden = false;
  focusButton.addEventListener('click', () => { frame.contentWindow.focus(); });
  if (document.fullscreenEnabled) {
    fullscreenButton.hidden = false;
    fullscreenButton.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
        status.hidden = true;
        frame.contentWindow.focus();
      } catch (_) {
        status.textContent = 'Full screen is unavailable in this browser. You can continue playing here.';
        status.hidden = false;
      }
    });
    document.addEventListener('fullscreenchange', () => {
      fullscreenButton.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen';
    });
  }
}
