// Drives each game with emulated touch input on phone-sized screens.
// Needs Playwright with Chromium, installed locally or globally; the arcade itself stays dependency-free.
import {spawn, execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const creator = process.env.CREATOR_EDITION || '';
if (creator && creator !== 'moosher') throw Error('Unknown creator edition');
async function loadPlaywright() {
  try { return await import('playwright'); } catch (_) {}
  try {
    const globalRoot = execFileSync('npm', ['root', '-g'], {encoding: 'utf8'}).trim();
    return createRequire(path.join(globalRoot, '/'))('playwright');
  } catch (_) {
    console.error('Playwright is required: npm install --no-save playwright && npx playwright install chromium');
    process.exit(2);
  }
}
const {chromium, devices} = await loadPlaywright();
const port = 4300 + Math.floor(Math.random() * 500);
const base = `http://127.0.0.1:${port}/`;
const server = spawn(process.execPath, [path.join(root, 'scripts/serve.mjs'), '--port', String(port), '--host', '127.0.0.1'], {stdio: ['ignore', 'pipe', 'inherit']});
await new Promise(resolve => server.stdout.once('data', resolve));

// Set SCREENSHOT_DIR to save what each game looks like on each screen.
const shots = process.env.SCREENSHOT_DIR && path.resolve(process.env.SCREENSHOT_DIR);
if (shots) await mkdir(shots, {recursive: true});
const results = [];
const check = (device, name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${device.padEnd(20)} ${name}${detail && !ok ? ` (${detail})` : ''}`);
};
const screens = {
  'Small phone 320': {...devices['iPhone SE'], viewport: {width: 320, height: 568}},
  'Pixel 5': devices['Pixel 5'],
  'iPhone 12 landscape': devices['iPhone 12 landscape'],
  'iPhone SE landscape': devices['iPhone SE landscape']
};
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {});
try {
  for (const [device, settings] of Object.entries(screens)) {
    const context = await browser.newContext(settings);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const cdp = await context.newCDPSession(page);
    const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', {type, touchPoints: points});
    // A real fingertip stays down for tens of milliseconds; melonJS polls input once per frame.
    const tap = async (x, y) => { await touch('touchStart', [{x, y}]); await page.waitForTimeout(80); await touch('touchEnd', []); };
    const swipe = async (x, y, dx, dy) => {
      await touch('touchStart', [{x, y}]);
      for (const step of [0.25, 0.5, 0.75, 1]) await touch('touchMove', [{x: x + dx * step, y: y + dy * step}]);
      await touch('touchEnd', []);
    };
    const open = async id => {
      await page.goto(`${base}play.html?game=${id}${creator ? "&creator=" + creator : ""}`);
      const frame = await (await page.waitForSelector('#game-frame')).contentFrame();
      await frame.waitForLoadState('load');
      await page.waitForTimeout(1500);
      return {frame, box: await page.locator('#game-frame').boundingBox()};
    };
    const shoot = async name => { if (shots) await page.screenshot({path: path.join(shots, `${device.replace(/\W+/g, '-').toLowerCase()}-${name}.png`), scale: 'css'}); };
    const noOverflow = frame => frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

    await page.goto(creator ? `${base}creators/${creator}/` : base);
    check(device, 'menu: no horizontal scroll', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.locator('.game-card, .creator-card').first().tap();
    await page.waitForURL(/game=/);
    check(device, 'menu: tapping a card opens the game', true);
    const title = await page.locator('#game-title').evaluate(el => ({full: el.scrollWidth, shown: el.clientWidth}));
    check(device, 'player: game title has room in header', title.shown >= Math.min(title.full, 80), `${title.shown}px of ${title.full}px`);
    for (const selector of ['.back-link', '#fullscreen']) {
      const box = await page.locator(selector).boundingBox();
      if (box) check(device, `player: ${selector} is at least 44px tall`, box.height >= 44, `${Math.round(box.height)}px`);
    }
    await shoot('player-header');
    check(device, 'player: page does not scroll', await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth));

    let {frame, box} = await open('clumsy-bird');
    const canvas = await frame.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; });
    const inside = {x: box.x + canvas.x + canvas.w / 2, y: box.y + canvas.y + canvas.h / 2};
    // Taps in the letterbox around the canvas count as taps on the game.
    const outside = canvas.y + canvas.h + 40 < box.height
      ? {x: inside.x, y: box.y + (canvas.y + canvas.h + box.height) / 2}
      : {x: box.x + canvas.x / 2, y: inside.y};
    check(device, 'clumsy-bird: screen has room outside the canvas', outside.x > box.x + 10, `canvas ${Math.round(canvas.w)}x${Math.round(canvas.h)} in ${Math.round(box.width)}x${Math.round(box.height)}`);
    await tap(outside.x, outside.y);
    await page.waitForTimeout(500);
    check(device, 'clumsy-bird: tap outside canvas starts game', await frame.evaluate(() => me.state.isCurrent(me.state.PLAY)));
    if (!await frame.evaluate(() => me.state.isCurrent(me.state.PLAY))) { await tap(inside.x, inside.y); await page.waitForTimeout(500); }
    await frame.waitForFunction(() => game.data.start === true, null, {timeout: 5000});
    await shoot('clumsy-bird');
    const birdY = () => frame.evaluate(() => me.state.current().bird.pos.y);
    for (const [where, point] of [['canvas', inside], ['outside canvas', outside]]) {
      const before = await birdY();
      await tap(point.x, point.y);
      await page.waitForTimeout(40);
      check(device, `clumsy-bird: tap on ${where} flaps the bird upward`, await birdY() < before);
    }
    check(device, 'clumsy-bird: no horizontal scroll', await noOverflow(frame));
    if (creator) {
      check(device, 'creator: flying sprite is selected', await frame.evaluate(() => game.resources.find(x=>x.name==='clumsy').src.includes('/creators/moosher/media/flap-sprite.png')));
      check(device, 'creator: title is personalized', await page.title() === 'Moosh Flap · Moosher Arcade');
      await page.locator('#creator-voice').tap();
      check(device, 'creator: mute reaches game', await frame.evaluate(() => CreatorAudio.settings().muted));
      await page.locator('#creator-voice').tap();
      check(device, 'creator: unmute reaches game', await frame.evaluate(() => !CreatorAudio.settings().muted));
    }

    ({frame, box} = await open('2048'));
    const board = frame.locator('.game-container');
    const boardBox = await board.boundingBox();
    check(device, '2048: board visible without scrolling', boardBox.y >= box.y && boardBox.y + boardBox.height <= box.y + box.height + 1, `board ends ${Math.round(boardBox.y + boardBox.height - box.y)}px into a ${Math.round(box.height)}px frame`);
    await board.scrollIntoViewIfNeeded();
    const state = () => frame.evaluate(() => localStorage.getItem(window.ArcadeCreator ? 'duvera.moosher.2048.gameState' : 'duvera.2048.gameState'));
    let moves = 0;
    for (const [dx, dy] of [[-120, 0], [0, -120], [120, 0], [0, 120], [-120, 0], [0, -120]]) {
      const previous = await state();
      const b = await board.boundingBox();
      await swipe(b.x + b.width / 2 - dx / 2, b.y + b.height / 2 - dy / 2, dx, dy);
      await page.waitForTimeout(200);
      if (await state() !== previous) moves++;
    }
    check(device, '2048: swipes move tiles', moves >= 3, `${moves}/6 swipes moved`);
    const scrolled = await frame.evaluate(() => scrollY);
    const b = await board.boundingBox();
    await swipe(b.x + b.width / 2, b.y + b.height / 2 + 60, 0, -120);
    check(device, '2048: swiping the board does not scroll', await frame.evaluate(() => scrollY) === scrolled);
    await frame.locator('.restart-button').scrollIntoViewIfNeeded();
    const restart = await frame.locator('.restart-button').boundingBox();
    await tap(restart.x + restart.width / 2, restart.y + restart.height / 2);
    await page.waitForTimeout(300);
    await shoot('2048');
    check(device, '2048: tapping New Game resets score', await frame.evaluate(() => document.querySelector('.score-container').firstChild.textContent === '0'));
    check(device, '2048: no horizontal scroll', await noOverflow(frame));
    if (creator) check(device, 'creator: 2048 save is isolated', await frame.evaluate(() => localStorage.getItem('duvera.moosher.2048.gameState') !== null && localStorage.getItem('duvera.2048.gameState') === null));

    ({frame, box} = await open('hextris'));
    check(device, 'hextris: no horizontal scroll', await noOverflow(frame));
    const overlap = await frame.evaluate(() => {
      const size = (window.ArcadeCreator ? 100 : 150) * settings.scale;
      ctx.save();
      ctx.font = size + 'px Exo';
      const metrics = ctx.measureText(window.ArcadeCreator ? 'Moosh Spin' : 'Hextris');
      ctx.restore();
      const x = trueCanvas.width / 2 + gdx + 6 * settings.scale;
      const baseline = trueCanvas.height / 2.1 + gdy - 155 * settings.scale + size / 2 - 9 * settings.scale;
      const title = {left: x - metrics.width / 2, right: x + metrics.width / 2, top: baseline - metrics.actualBoundingBoxAscent, bottom: baseline + metrics.actualBoundingBoxDescent};
      const score = document.getElementById('highScoreInGameText').getBoundingClientRect();
      return score.left < title.right && score.right > title.left && score.top < title.bottom && score.bottom > title.top;
    });
    check(device, 'hextris: high score clears the title', !overlap);
    await shoot('hextris-start');
    const start = await frame.locator('#startBtn').boundingBox();
    await tap(start.x + start.width / 2, start.y + start.height / 2);
    await frame.waitForFunction(() => gameState === 1, null, {timeout: 3000}).catch(() => {});
    check(device, 'hextris: tapping Play starts game', await frame.evaluate(() => gameState === 1));
    const position = () => frame.evaluate(() => MainHex.position);
    const p0 = await position();
    check(device, 'hextris: Play tap does not also rotate', p0 === 0, `position ${p0}`);
    await tap(box.x + box.width * 0.2, box.y + box.height * 0.6);
    const p1 = await position();
    await tap(box.x + box.width * 0.8, box.y + box.height * 0.6);
    await tap(box.x + box.width * 0.8, box.y + box.height * 0.6);
    const p2 = await position();
    await shoot('hextris');
    check(device, 'hextris: tapping left side rotates', p1 === (p0 + 1) % 6, `${p0} -> ${p1}`);
    check(device, 'hextris: tapping right side rotates back', p2 === (p1 + 4) % 6, `${p1} -> ${p2}`);
    const pause = await frame.locator('#pauseBtn').boundingBox();
    await tap(pause.x + pause.width / 2, pause.y + pause.height / 2);
    await page.waitForTimeout(300);
    check(device, 'hextris: tapping pause pauses', await frame.evaluate(() => gameState === -1));
    await tap(box.x + box.width * 0.2, box.y + box.height * 0.6);
    check(device, 'hextris: taps while paused are ignored', await position() === p2);

    check(device, 'no script errors', errors.length === 0, errors.join(' | '));
    await context.close();
  }
} finally {
  await browser.close();
  server.kill();
}
const failed = results.filter(ok => !ok).length;
console.log(`\n${results.length - failed} passed, ${failed} failed.`);
process.exitCode = failed ? 1 : 0;
