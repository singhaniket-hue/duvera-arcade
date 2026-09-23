/* Duvera creator edition registry. GPL-3.0. */
(function () {
  'use strict';
  const root = new URL('../', document.currentScript.src);
  const requested = new URLSearchParams(location.search).get('creator');
  const matchedHost = /^(moosher|moosherr)\.duvera\.app$/i.test(location.hostname);
  const active = requested === 'moosher' || (!requested && (matchedHost || location.pathname.includes('/creators/moosher/')));
  const clips = [
    {id:'hello', file:'hello.mp3', label:'Hello', event:'start', start:1.85, end:2.8, transcript:'Hello', review:'Caption-selected; human listening review pending.'},
    {id:'lets-go', file:'lets-go.mp3', label:'Okay, let’s go', event:'milestone', start:68.8, end:70.45, transcript:'Okay, let’s go', review:'Caption-selected; human listening review pending.'},
    {id:'badhiya', file:'badhiya.mp3', label:'Badhiya bana hai', event:'win', start:110.25, end:112.45, transcript:'Hell yeah, badhiya bana hai', review:'Caption-selected; human listening review pending.'},
    {id:'theek-hai', file:'theek-hai.mp3', label:'Theek kar deti hoon', event:'lose', start:277.55, end:280.6, transcript:'Arey theek hai bhai, theek kar deti hoon, ruk jao', review:'Caption-selected; human listening review pending.'}
  ];
  window.ArcadeCreator = active ? Object.freeze({
    id:'moosher', name:'Moosher', handle:'@Moosherr', root:root.href,
    home:new URL('creators/moosher/',root).href,
    assets:new URL('creators/moosher/media/',root).href,
    channel:'https://www.youtube.com/@Moosherr',
    source:'https://www.youtube.com/watch?v=LnAsPIae94Q',
    titles:{'clumsy-bird':'Moosh Flap','2048':'Moosh 2048','hextris':'Moosh Spin'},
    clips
  }) : null;
  // The future creator subdomain opens its edition without duplicating deployments.
  if (active && matchedHost && !requested && /\/(?:index\.html)?$/.test(location.pathname) && !location.pathname.includes('/games/') && !location.pathname.includes('/creators/')) {
    location.replace(new URL('creators/moosher/',root));
  }
}());
