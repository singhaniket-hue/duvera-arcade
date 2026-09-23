// Drives each game with emulated touch input on phone-sized screens.
// Needs Playwright with Chromium, installed locally or globally; the arcade itself stays dependency-free.
import {spawn, execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
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

// Upstream packages are kept unchanged (see THIRD_PARTY.md), so their layout limits are reported, not failed.
const known = new Set(['clumsy-bird: tap below canvas starts game', '2048: board visible without scrolling']);
const results = [];
const check = (device, name, ok, detail = '') => {
  const status = ok ? 'PASS' : known.has(name) ? 'KNOWN' : 'FAIL';
  results.push(status);
  console.log(`${status.padEnd(5)} ${device.padEnd(19)} ${name}${detail && !ok ? ` (${detail})` : ''}`);
};
const screens = {
  'Small phone 320': {...devices['iPhone SE'], viewport: {width: 320, height: 568}},
  'Pixel 5': devices['Pixel 5'],
  'iPhone 12 landscape': devices['iPhone 12 landscape']
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
      await page.goto(`${base}play.html?game=${id}`);
      const frame = await (await page.waitForSelector('#game-frame')).contentFrame();
      await frame.waitForLoadState('load');
      await page.waitForTimeout(1500);
      return {frame, box: await page.locator('#game-frame').boundingBox()};
    };
    const noOverflow = frame => frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

    await page.goto(base);
    check(device, 'menu: no horizontal scroll', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.locator('.game-card').first().tap();
    await page.waitForURL(/game=/);
    check(device, 'menu: tapping a card opens the game', true);
    const title = await page.locator('#game-title').evaluate(el => ({full: el.scrollWidth, shown: el.clientWidth}));
    check(device, 'player: game title has room in header', title.shown >= Math.min(title.full, 80), `${title.shown}px of ${title.full}px`);
    for (const selector of ['.back-link', '#fullscreen']) {
      const box = await page.locator(selector).boundingBox();
      if (box) check(device, `player: ${selector} is at least 44px tall`, box.height >= 44, `${Math.round(box.height)}px`);
    }
    check(device, 'player: page does not scroll', await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth));

    let {frame, box} = await open('clumsy-bird');
    const canvas = await frame.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; });
    const inside = {x: box.x + canvas.x + canvas.w / 2, y: box.y + canvas.y + canvas.h / 2};
    const below = box.height - canvas.y - canvas.h;
    if (below > 40) {
      await tap(inside.x, box.y + canvas.y + canvas.h + below / 2);
      await page.waitForTimeout(500);
      check(device, 'clumsy-bird: tap below canvas starts game', await frame.evaluate(() => me.state.isCurrent(me.state.PLAY)), `${Math.round(below)}px untappable strip under the canvas`);
    }
    if (!await frame.evaluate(() => me.state.isCurrent(me.state.PLAY))) { await tap(inside.x, inside.y); await page.waitForTimeout(500); }
    check(device, 'clumsy-bird: tap starts game', await frame.evaluate(() => me.state.isCurrent(me.state.PLAY)));
    await frame.waitForFunction(() => game.data.start === true, null, {timeout: 5000});
    const birdY = () => frame.evaluate(() => me.state.current().bird.pos.y);
    const before = await birdY();
    await tap(inside.x, inside.y);
    await page.waitForTimeout(40);
    check(device, 'clumsy-bird: tap flaps the bird upward', await birdY() < before);
    check(device, 'clumsy-bird: no horizontal scroll', await noOverflow(frame));

    ({frame, box} = await open('2048'));
    const board = frame.locator('.game-container');
    const boardBox = await board.boundingBox();
    check(device, '2048: board visible without scrolling', boardBox.y + boardBox.height <= box.y + box.height + 1, `board ends ${Math.round(boardBox.y + boardBox.height - box.y)}px into a ${Math.round(box.height)}px frame`);
    await board.scrollIntoViewIfNeeded();
    const state = () => frame.evaluate(() => localStorage.getItem('duvera.2048.gameState'));
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
    check(device, '2048: tapping New Game resets score', await frame.evaluate(() => document.querySelector('.score-container').firstChild.textContent === '0'));
    check(device, '2048: no horizontal scroll', await noOverflow(frame));

    ({frame, box} = await open('hextris'));
    check(device, 'hextris: no horizontal scroll', await noOverflow(frame));
    const start = await frame.locator('#startBtn').boundingBox();
    await tap(start.x + start.width / 2, start.y + start.height / 2);
    await frame.waitForFunction(() => gameState === 1, null, {timeout: 3000}).catch(() => {});
    check(device, 'hextris: tapping Play starts game', await frame.evaluate(() => gameState === 1));
    const position = () => frame.evaluate(() => MainHex.position);
    const p0 = await position();
    await tap(box.x + box.width * 0.2, box.y + box.height * 0.6);
    const p1 = await position();
    await tap(box.x + box.width * 0.8, box.y + box.height * 0.6);
    await tap(box.x + box.width * 0.8, box.y + box.height * 0.6);
    const p2 = await position();
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
const count = status => results.filter(result => result === status).length;
console.log(`\n${count('PASS')} passed, ${count('KNOWN')} known upstream limitations, ${count('FAIL')} failed.`);
process.exitCode = count('FAIL') ? 1 : 0;
