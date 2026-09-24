// Checks integration boundaries without requiring a browser or dependencies.
import {readFile, readdir, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => readFile(path.join(root, name), 'utf8');
async function walk(dir) {
  const files = [];
  for (const entry of await readdir(path.join(root, dir), {withFileTypes: true})) {
    if (entry.name.startsWith('.') || entry.name === 'dist' || entry.name === 'node_modules') continue;
    const name = path.join(dir, entry.name);
    files.push(...(entry.isDirectory() ? await walk(name) : [name]));
  }
  return files;
}
const files = await walk('');
let links = 0;
async function checkLink(file, value, runtime = false) {
  if (/^(?:[a-z]+:|\/\/|#)/i.test(value)) {
    if (runtime && /^(?:https?:|\/\/)/i.test(value)) throw Error(`Remote runtime dependency: ${file}: ${value}`);
    return;
  }
  const clean = decodeURIComponent(value.split(/[?#]/)[0]);
  if (!clean) return;
  // Web-root links are relative to this site's root, not the filesystem drive.
  const target = clean.startsWith('/') ? path.resolve(root, '.' + clean) : path.resolve(root, path.dirname(file), clean);
  assert.ok(target === path.resolve(root) || target.startsWith(root), `Link escapes repository: ${value}`);
  await stat(target).catch(() => { throw Error(`Missing asset in ${file}: ${value}`); });
  links++;
}
for (const file of files) {
  if (/\.(?:m?js)$/.test(file)) execFileSync(process.execPath, ['--check', path.join(root, file)], {stdio:'pipe'});
  if (file.endsWith('.html')) {
    const html = await read(file);
    for (const tag of html.matchAll(/<(?:a|script|link|img|iframe)\b[^>]*>/gi)) {
      for (const attr of tag[0].matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
        await checkLink(file, attr[1], /^<(?:script|link|img|iframe)\b/i.test(tag[0]));
      }
    }
  }
  if (file.endsWith('.css')) {
    for (const match of (await read(file)).matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) await checkLink(file, match[1], true);
  }
}
const manifest = JSON.parse(await read('games/hextris/manifest.webmanifest'));
for (const icon of manifest.icons) await checkLink('games/hextris/manifest.webmanifest', icon.src, true);
// Clumsy Bird's assets are loaded dynamically by melonJS.
const bird = vm.createContext({});
vm.runInContext(await read('games/clumsy-bird/js/game.js'), bird);
for (const asset of bird.game.resources) {
  const paths = asset.type === 'audio' ? ['mp3','ogg'].map(ext => asset.src + asset.name + '.' + ext) : [asset.src];
  for (const assetPath of paths) await checkLink('games/clumsy-bird/index.html', assetPath, true);
}
// Exercise 2048 merges, scoring, winning and resume with the real storage layer.
const context = vm.createContext({}); context.window = context;
for (const file of ['grid','tile','local_storage_manager','game_manager']) vm.runInContext(await read(`games/2048/js/${file}.js`), context);
const storage = new context.LocalStorageManager();
class Input { on() {} }
class Actuator { actuate() {} continueGame() {} }
const game = new context.GameManager(4, Input, Actuator, context.LocalStorageManager);
game.addRandomTile = () => {};
game.grid = new context.Grid(4);
[2,2,2,2].forEach((value,x) => game.grid.insertTile(new context.Tile({x,y:0},value)));
game.move(3);
assert.deepEqual([0,1,2,3].map(x => game.grid.cells[x][0]?.value || 0), [4,4,0,0]);
assert.equal(game.score, 8);
assert.equal(storage.getGameState().score, 8);
assert.equal(storage.getBestScore(), '8');
const resumed = new context.GameManager(4, Input, Actuator, context.LocalStorageManager);
assert.equal(resumed.score, 8);
game.grid = new context.Grid(4);
[1024,1024].forEach((value,x) => game.grid.insertTile(new context.Tile({x,y:0},value)));
game.move(3); assert.equal(game.won, true);
assert.ok(Object.keys(context.fakeStorage._data).every(key => key.startsWith('duvera.2048.')));
// Hextris must still work when browser storage is blocked, and isolate its keys.
for (const blocked of [false,true]) {
  const data = new Map();
  const localStorage = {getItem:key=>data.get(key) ?? null, setItem:(key,val)=>data.set(key,String(val)), removeItem:key=>data.delete(key)};
  const sandbox = vm.createContext({}); sandbox.window = sandbox;
  Object.defineProperty(sandbox,'localStorage',{get(){if(blocked) throw Error('Blocked'); return localStorage;}});
  vm.runInContext(await read('games/hextris/js/storage.js'), sandbox);
  sandbox.hextrisStorage.setItem('highscores','[100]');
  assert.equal(sandbox.hextrisStorage.getItem('highscores'),'[100]');
  assert.equal(sandbox.hextrisStorage.getItem('unknown'),null);
  assert.ok([...data.keys()].every(key => key.startsWith('duvera.hextris.')));
}
for (const file of files.filter(name => /^games\/hextris\/js\//.test(name))) {
  assert.doesNotMatch(await read(file), /google-analytics|googlesyndication|54\.183\.184\.126|hextris\.io\/a\.js/);
}
console.log(`Passed: JavaScript syntax, ${links} local assets/links, 2048 gameplay/resume, Hextris storage and removed service checks.`);
