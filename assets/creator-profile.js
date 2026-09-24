/* Duvera creator edition registry. GPL-3.0. */
(function () {
  'use strict';
  const root = new URL('../', document.currentScript.src);
  const requested = new URLSearchParams(location.search).get('creator');
  const matchedHost = /^(moosher|moosherr)\.duvera\.app$/i.test(location.hostname);
  const active = requested === 'moosher' || (!requested && (matchedHost || location.pathname.includes('/creators/moosher/')));
  const clips = [
    {id:'hello', file:'hello.mp3', label:'Hello', event:'start', start:1.85, end:2.8, transcript:'Hello', review:'Manually reviewed by the site owner; source attribution retained.'},
    {id:'lets-go', file:'lets-go.mp3', label:'Okay, let’s go', event:'milestone', start:68.8, end:70.45, transcript:'Okay, let’s go', review:'Manually reviewed by the site owner; source attribution retained.'},
    {id:'badhiya', file:'badhiya.mp3', label:'Badhiya bana hai', event:'win', start:110.25, end:112.45, transcript:'Hell yeah, badhiya bana hai', review:'Manually reviewed by the site owner; source attribution retained.'},
    {id:'theek-hai', file:'theek-hai.mp3', label:'Theek kar deti hoon', event:'lose', start:277.55, end:280.6, transcript:'Arey theek hai bhai, theek kar deti hoon, ruk jao', review:'Manually reviewed by the site owner; source attribution retained.'}
  ];
  window.ArcadeCreator = active ? Object.freeze({
    id:'moosher', name:'Moosher', handle:'@Moosherr', root:root.href,
    home:new URL('creators/moosher/',root).href,
    assets:new URL('creators/moosher/media/',root).href,
    channel:'https://www.youtube.com/@Moosherr',
    source:'https://www.youtube.com/watch?v=LnAsPIae94Q',
    titles:{'clumsy-bird':'Moosh Flap','2048':'Moosh 2048','hextris':'Moosh Spin','stack':'Moosh Stack','four':'Moosh Four','dash':'Moosh Dash'},
    palette:{ink:'#173e38',teal:'#155a51',mint:'#c2e5cd',coral:'#ef9279',cream:'#f4f0e7',gold:'#f2cd65'},
    games:{dash:{tagline:'A little run. A lot of masti.',faces:{run:'emote-focus.png',jump:'emote-surprise.png',hit:'emote-sad.png'},sounds:{start:'start',milestone:'milestone',win:'win',lose:'lose'}},four:{tokens:['emote-focus.png','emote-surprise.png'],expressions:{idle:'emote-focus.png',win:'emote-win.png',lose:'emote-sad.png'},sounds:{start:'start',win:'win',lose:'lose'}},stack:{expressions:{idle:'emote-focus.png',streak:'emote-win.png',lose:'emote-sad.png'},sounds:{start:'start',milestone:'milestone',win:'win',lose:'lose'}}},
    clips
  }) : null;
  // The future creator subdomain opens its edition without duplicating deployments.
  if (active && matchedHost && !requested && /\/(?:index\.html)?$/.test(location.pathname) && !location.pathname.includes('/games/') && !location.pathname.includes('/creators/')) {
    location.replace(new URL('creators/moosher/',root));
  }
}());
