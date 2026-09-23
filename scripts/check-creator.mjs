import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const code=async name=>readFile(path.join(root,name),'utf8');
function context(search='?creator=moosher',pathname='/games/2048/',hostname='localhost') {
  const listeners={}, store=new Map(),nodes=new Map();
  const node=()=>({classList:{add(){}},append(){},insertAdjacentHTML(){},addEventListener(){}});
  const sandbox={URL,URLSearchParams,console,setTimeout,clearTimeout,performance:{now:()=>sandbox.now},now:10000,
    document:{currentScript:{src:'http://localhost/assets/creator-profile.js'},hidden:false,head:node(),body:node(),documentElement:node(),createElement:node,querySelector:s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);},addEventListener:(n,fn)=>{(listeners[n]??=[]).push(fn);}},
    location:{search,pathname,hostname,replace:url=>{sandbox.redirect=String(url);}},localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
    addEventListener:(n,fn)=>{(listeners[n]??=[]).push(fn);},dispatchEvent:e=>{for(const fn of listeners[e.type]??[])fn(e);},CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts?.detail;}},
    Audio:class{constructor(url){this.url=url;sandbox.createdAudio.push(this);}play(){this.played=true;return Promise.resolve();}pause(){this.paused=true;}addEventListener(){}},createdAudio:[]};
  sandbox.window=sandbox;sandbox.store=store;sandbox.listeners=listeners;
  return vm.createContext(sandbox);
}
const registry=await code('assets/creator-profile.js'),audio=await code('assets/creator-audio.js'),adapter=await code('assets/creator-game.js');
for(const query of ['', '?creator=unknown','?creator=__proto__','?creator=default']){
  const c=context(query);vm.runInContext(registry,c);vm.runInContext(adapter,c);assert.equal(c.ArcadeCreator,null);
}
const host=context('', '/', 'moosher.duvera.app');vm.runInContext(registry,host);assert.ok(host.redirect.endsWith('/creators/moosher/'));
const optout=context('?creator=default','/','moosher.duvera.app');vm.runInContext(registry,optout);assert.equal(optout.ArcadeCreator,null);
const c=context();vm.runInContext(registry,c);vm.runInContext(audio,c);
assert.equal(c.CreatorAudio.play('start'),false,'Audio must wait for input');
for(const fn of c.listeners.pointerdown)fn({});
assert.equal(c.CreatorAudio.play('start'),true);
assert.equal(c.CreatorAudio.play('start'),false,'Repeated reactions must be throttled');
c.now+=100;assert.equal(c.CreatorAudio.play('lose'),true,'Loss may interrupt a low-priority greeting');assert.equal(c.createdAudio[0].paused,true);
c.CreatorAudio.update({muted:true});c.now+=9000;assert.equal(c.CreatorAudio.play('win'),false);
c.CreatorAudio.update({muted:false,disabled:['badhiya']});assert.equal(c.CreatorAudio.play('win'),false);
c.CreatorAudio.update({disabled:[]});assert.equal(c.CreatorAudio.play('win'),true);
c.document.hidden=true;assert.equal(c.CreatorAudio.play('start',{preview:true,id:'hello'}),false);
for(const file of ['grid','tile','local_storage_manager','game_manager'])vm.runInContext(await code(`games/2048/js/${file}.js`),c);
vm.runInContext(adapter,c);
class Input{on(){}}class Actuator{actuate(){}continueGame(){}}
const game=new c.GameManager(4,Input,Actuator,c.LocalStorageManager);game.addRandomTile=()=>{};game.grid=new c.Grid(4);
for(const x of [0,1])game.grid.insertTile(new c.Tile({x,y:0},16));game.move(3);assert.equal(game.grid.cells[0][0].value,32);
assert.ok(c.store.has('duvera.moosher.2048.gameState'));assert.equal(c.store.has('duvera.2048.gameState'),false);
// Check the public melonJS save adapter with existing original scores present.
const bird=context('?creator=moosher','/games/clumsy-bird/');vm.runInContext(registry,bird);
bird.store.set('me.save.topSteps','99');bird.game={resources:[{name:'clumsy',src:'original.png'}],PlayScreen:function(){},GameOverScreen:function(){},data:{}};
bird.game.PlayScreen.prototype.onResetEvent=()=>{};bird.game.GameOverScreen.prototype.onResetEvent=()=>{};bird.me={audio:{play(){}},save:{}};
vm.runInContext(adapter,bird);bird.me.save.add({topSteps:3});bird.me.save.topSteps=7;assert.equal(bird.store.get('me.save.topSteps'),'99');assert.equal(bird.store.get('duvera.moosher.clumsy-bird.topSteps'),'7');
// Check every runtime-selected asset, which HTML link scanning cannot see.
for(const name of ['avatar.webp','flap-logo.png','flap-sprite.png',...['smile','laugh','surprise','focus','sad','win'].map(x=>'emote-'+x+'.png'),...c.ArcadeCreator.clips.map(x=>'audio/'+x.file)])assert.ok((await stat(path.join(root,'creators/moosher/media',name))).size>0);
const sprite=await readFile(path.join(root,'creators/moosher/media/flap-sprite.png'));assert.equal(sprite.readUInt32BE(16),255);assert.equal(sprite.readUInt32BE(20),60);
console.log('Creator checks passed: profile routing, opt-out, audio gating/cooldowns/muting, 2048 merges, isolated saves, sprite geometry and media assets.');
