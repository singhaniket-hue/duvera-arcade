// Draw and Quiz on phone-sized screens with real touch input, against a running local Worker.
// Hosts play inside the arcade player; guests open the invite link. Needs ROOM_ENDPOINT.
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import net from 'node:net';
import {chromium, devices} from 'playwright';

const endpoint = process.env.ROOM_ENDPOINT || 'http://127.0.0.1:8787';
const shots = process.env.SCREENSHOT_DIR;
if (shots) await mkdir(shots, {recursive: true});
const port = await new Promise(resolve => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const server = spawn(process.execPath, ['scripts/serve.mjs', '--port', String(port), '--host', '127.0.0.1'], {stdio: ['ignore', 'pipe', 'inherit'], env: {...process.env, ROOM_ENDPOINT: endpoint}});
await new Promise(resolve => server.stdout.once('data', resolve));
const base = `http://127.0.0.1:${port}/`;
const results = [];
const check = (name, ok, detail = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${!ok && detail ? '\n     ' + detail : ''}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const phones = {
  'Pixel 5': devices['Pixel 5'],
  'Small phone 320': {...devices['iPhone SE'], viewport: {width: 320, height: 568}},
  'iPhone 12 landscape': devices['iPhone 12 landscape']
};
const browser = await chromium.launch();
const errors = [];

async function open(label, url, inShell) {
  const context = await browser.newContext(phones[label]);
  await context.addInitScript(() => {
    const Native = WebSocket; window.wire = [];
    window.WebSocket = class extends Native { constructor(...a) { super(...a); window.testSocket = this; this.addEventListener('message', e => window.wire.push(JSON.parse(e.data))); this.addEventListener('close', e => { window.lastClose = {code: e.code, reason: e.reason}; }); } };
  });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(`${label}: ${e.message}`));
  await page.goto(url);
  const frame = inShell ? await (await page.waitForSelector('#game-frame')).contentFrame() : page.mainFrame();
  await frame.waitForSelector('#create');
  const cdp = await context.newCDPSession(page);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', {type, touchPoints: points});
  const offset = async () => inShell ? page.locator('#game-frame').boundingBox() : {x: 0, y: 0};
  return {label, context, page, frame, touch, offset};
}
async function tapEl(p, selector) {
  const el = p.frame.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  const b = await el.boundingBox();
  await p.touch('touchStart', [{x: b.x + b.width / 2, y: b.y + b.height / 2}]); await sleep(60); await p.touch('touchEnd', []);
}
const overflow = p => p.frame.evaluate(() => document.documentElement.scrollWidth - innerWidth);
async function smallTargets(p, selectors, min) {
  return p.frame.evaluate(({selectors, min}) => selectors.flatMap(sel => [...document.querySelectorAll(sel)].filter(el => el.offsetParent).map(el => { const r = el.getBoundingClientRect(); return {sel, text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 14), w: Math.round(r.width), h: Math.round(r.height)}; }).filter(x => x.h < min || x.w < min)), {selectors, min});
}
const shoot = async (p, name) => { if (shots) await p.page.screenshot({path: `${shots}/${p.label.replace(/\W+/g, '-').toLowerCase()}-${name}.png`}); };

// ---------------------------------------------------------------------------------------------------
async function drawOnPhones() {
  const host = await open('Pixel 5', base + 'play.html?game=draw', true);
  await host.frame.fill('#name', 'Host');
  await tapEl(host, '#create');
  await host.frame.waitForFunction(() => document.querySelector('#invite').value.includes('room='));
  const invite = await host.frame.inputValue('#invite');
  const guests = [];
  for (const [label, name] of [['Small phone 320', 'Tiny'], ['iPhone 12 landscape', 'Wide']]) {
    const g = await open(label, invite, false);
    await g.frame.fill('#name', name);
    await tapEl(g, '#join');
    guests.push(g);
  }
  const everyone = [host, ...guests];
  await host.frame.waitForFunction(() => window.drawSnapshot()?.players.filter(p => p.connected).length === 3);
  for (const p of everyone) {
    check(`draw ${p.label}: room screen has no horizontal scroll`, await overflow(p) <= 0, (await overflow(p)) + 'px');
    const small = await smallTargets(p, ['#copy', '#reconnect', '#leave', '#start', '#lock', '#skip'], 44);
    check(`draw ${p.label}: room buttons are at least 44 px`, !small.length, JSON.stringify(small));
  }
  await tapEl(host, '#start');
  const drawerId = await host.frame.evaluate(async () => { for (let i = 0; i < 100 && window.drawSnapshot()?.phase !== 'choose'; i++) await new Promise(r => setTimeout(r, 50)); return window.drawSnapshot().drawer; });
  let drawer = null;
  for (const p of everyone) if (await p.frame.evaluate(id => window.drawSnapshot().you === id, drawerId)) drawer = p;
  const watchers = everyone.filter(p => p !== drawer);
  await tapEl(drawer, '#choices button');
  await drawer.frame.waitForFunction(() => window.drawSnapshot()?.phase === 'drawing');
  for (const p of everyone) await shoot(p, 'draw-' + (p === drawer ? 'drawer' : 'guesser'));

  const canvas = drawer.frame.locator('#canvas');
  await canvas.scrollIntoViewIfNeeded();
  // Playwright reports boxes inside the iframe in page coordinates already.
  const cb = await canvas.boundingBox(), frameBox = await drawer.offset();
  const vp = drawer.page.viewportSize();
  check(`draw ${drawer.label} (drawer): whole canvas is on screen while drawing`, cb.y >= frameBox.y && cb.y + cb.height <= vp.height && cb.x >= 0 && cb.x + cb.width <= vp.width, `canvas ${Math.round(cb.width)}x${Math.round(cb.height)} at y=${Math.round(cb.y)} in a ${vp.width}x${vp.height} screen`);
  const small = await smallTargets(drawer, ['#palette button', '#size', '#eraser', '#undo', '#clear'], 44);
  check(`draw ${drawer.label} (drawer): drawing tools are at least 44 px`, !small.length, JSON.stringify(small.slice(0, 4)));

  // One continuous finger stroke across the canvas.
  const at = (fx, fy) => ({x: cb.x + cb.width * fx, y: cb.y + cb.height * fy});
  const inkCount = p => p.frame.evaluate(() => { const d = document.querySelector('#canvas').getContext('2d').getImageData(0, 0, 800, 600).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 200) n++; return n; });
  const inkBefore = await Promise.all(watchers.map(inkCount));
  const scrollBefore = await drawer.frame.evaluate(() => scrollY);
  await drawer.touch('touchStart', [at(0.2, 0.5)]);
  for (let i = 1; i <= 12; i++) { await drawer.touch('touchMove', [at(0.2 + i * 0.05, 0.5)]); await sleep(16); }
  await drawer.touch('touchEnd', []);
  await sleep(600);
  check(`draw ${drawer.label} (drawer): drawing does not scroll the page`, await drawer.frame.evaluate(() => scrollY) === scrollBefore);
  for (const [i, w] of watchers.entries()) {
    const inked = await inkCount(w) - inkBefore[i];
    check(`draw ${w.label}: sees the drawer's finger stroke`, inked > 500, inked + ' new inked pixels');
  }

  // Quick dots: a person tapping ~10 times a second for 3 seconds.
  const dotsBefore = await watchers[0].frame.evaluate(() => window.wire.filter(m => m.type === 'ink' && m.seq === 0).length);
  for (let i = 0; i < 30; i++) { const p = at(0.1 + (i % 10) * 0.08, 0.2 + Math.floor(i / 10) * 0.1); await drawer.touch('touchStart', [p]); await sleep(40); await drawer.touch('touchEnd', []); await sleep(60); }
  await sleep(800);
  const closed = await drawer.frame.evaluate(() => window.lastClose || null);
  const dots = await watchers[0].frame.evaluate(() => window.wire.filter(m => m.type === 'ink' && m.seq === 0).length) - dotsBefore;
  check(`draw ${drawer.label} (drawer): tapping 10 dots a second keeps the drawer connected`, !closed, `socket closed ${JSON.stringify(closed)} after ${dots}/30 dots; the client does not reconnect after 1008`);
  check(`draw ${watchers[0].label}: receives all 30 dots`, dots === 30, dots + '/30');
  await shoot(drawer, 'draw-dots');

  // A guesser types the word on a phone keyboard and submits.
  const word = await drawer.frame.evaluate(() => window.drawSnapshot()?.word);
  const guesser = watchers[0];
  if (word && !closed) {
    await guesser.frame.locator('#guess').scrollIntoViewIfNeeded();
    await guesser.frame.fill('#guess', word);
    await tapEl(guesser, '#send');
    await sleep(500);
    check(`draw ${guesser.label}: a correct guess typed on the phone is accepted`, await guesser.frame.evaluate(() => window.drawSnapshot().solved.includes(window.drawSnapshot().you)));
    const small = await smallTargets(guesser, ['#send'], 44);
    check(`draw ${guesser.label}: Send button is at least 44 px`, !small.length, JSON.stringify(small));
  }
  for (const p of everyone) await p.context.close();
}

// ---------------------------------------------------------------------------------------------------
async function quizOnPhones() {
  const host = await open('Small phone 320', base + 'play.html?game=quiz', true);
  await host.frame.fill('#name', 'Host');
  await tapEl(host, '#create');
  await host.frame.waitForFunction(() => document.querySelector('#invite').value.includes('room='));
  const guest = await open('iPhone 12 landscape', await host.frame.inputValue('#invite'), false);
  await guest.frame.fill('#name', 'Guest');
  await tapEl(guest, '#join');
  await host.frame.waitForFunction(() => window.quizSnapshot()?.players?.filter(p => p.connected).length === 2);
  await tapEl(host, '#start');
  for (const p of [host, guest]) {
    await p.frame.waitForFunction(() => window.quizSnapshot()?.phase === 'question');
    await shoot(p, 'quiz-question');
    check(`quiz ${p.label}: question screen has no horizontal scroll`, await overflow(p) <= 0, (await overflow(p)) + 'px');
    const small = await smallTargets(p, ['#answers button'], 44);
    check(`quiz ${p.label}: answer buttons are at least 44 px`, !small.length, JSON.stringify(small.slice(0, 2)));
    const inView = await p.frame.evaluate(() => { const r = document.querySelector('#question').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; });
    check(`quiz ${p.label}: the question is in view when it opens`, inView, 'the page stays scrolled where the player last tapped (the host taps Start at the bottom)');
    const fits = await p.frame.evaluate(() => { document.querySelector('#question').scrollIntoView({block: 'start'}); const b = [...document.querySelectorAll('#answers button')].map(x => x.getBoundingClientRect()); return b.every(r => r.top >= 0 && r.bottom <= innerHeight); });
    check(`quiz ${p.label}: question and all four answers fit on one screen`, fits);
    await tapEl(p, '#answers button');
  }
  await host.frame.waitForFunction(() => window.quizSnapshot()?.phase === 'quizReveal');
  check('quiz: tapped answers from both phones close the question', true);
  await shoot(host, 'quiz-reveal');
  const small = await smallTargets(host, ['#next'], 44);
  check(`quiz ${host.label}: Next button is at least 44 px`, !small.length, JSON.stringify(small));
  await host.context.close(); await guest.context.close();

  const solo = await open('Small phone 320', base + 'play.html?game=quiz', true);
  await tapEl(solo, '#practice');
  await solo.frame.waitForFunction(() => window.quizSnapshot()?.mode === 'practice');
  await tapEl(solo, '#answers button');
  await sleep(300);
  check('quiz practice on a 320 px phone: a tapped answer is scored and explained', await solo.frame.evaluate(() => !document.querySelector('#explanation').hidden));
  await solo.context.close();
}

try {
  for (const [name, fn] of [['draw', drawOnPhones], ['quiz', quizOnPhones]]) {
    try { await fn(); } catch (e) { check(`${name}: phone scenario completed`, false, e.message.split('\n')[0]); }
  }
  check('no page errors on phones', !errors.length, errors.slice(0, 3).join(' | '));
} finally { await browser.close(); server.kill(); }
const failed = results.filter(x => !x).length;
console.log(`\n${results.length - failed} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
