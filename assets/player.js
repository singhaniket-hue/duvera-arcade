/* Duvera Arcade player shell. GPL-3.0. */
'use strict';
const games = {
  'clumsy-bird': {name: 'Clumsy Bird', path: 'games/clumsy-bird/', controls: 'Space, click or tap to fly · M to mute'},
  '2048': {name: '2048', path: 'games/2048/', controls: 'Arrow keys or swipe to slide · R to restart'},
  'hextris': {name: 'Hextris', path: 'games/hextris/', controls: '← → or tap either side to rotate · ↓ to speed up · P to pause'}
};
const id = new URLSearchParams(window.location.search).get('game');
if (Object.prototype.hasOwnProperty.call(games, id)) {
  const game = games[id];
  const frame = document.getElementById('game-frame');
  const focusButton = document.getElementById('focus-game');
  const fullscreenButton = document.getElementById('fullscreen');
  const status = document.getElementById('player-status');
  document.title = game.name + ' · Duvera Arcade';
  document.getElementById('game-title').textContent = game.name;
  document.getElementById('game-controls').textContent = game.controls;
  document.getElementById('player-error').hidden = true;
  frame.title = game.name + ' game';
  frame.hidden = false;
  frame.addEventListener('load', () => { frame.contentWindow.focus(); });
  frame.src = game.path;
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
