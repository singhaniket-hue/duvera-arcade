// Drives Draw and Quiz rooms on a running local Worker over real WebSockets: full 8-player matches,
// concurrent joins/answers, reconnects and hostile clients. Every message each player receives is
// scanned for secrets. Needs ROOM_ENDPOINT (check-multiplayer.mjs sets it).
import assert from 'node:assert/strict';

const endpoint = process.env.ROOM_ENDPOINT || 'http://127.0.0.1:8787';
const origin = 'http://localhost:5288';
const results = [];
const check = (name, ok, detail = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${!ok && detail ? '\n     ' + detail : ''}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ipCounter = 1;
const freshIp = () => `10.20.${ipCounter >> 8}.${ipCounter++ & 255}`;

async function post(path, body, headers = {}) {
  const res = await fetch(endpoint + path, {method: 'POST', headers: {Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': freshIp(), ...headers}, body: typeof body === 'string' ? body : JSON.stringify(body)});
  let data = {}; try { data = await res.json(); } catch {}
  return {status: res.status, ...data};
}

class Player {
  constructor(kind, room, seat, name) { Object.assign(this, {kind, room, token: seat.token, id: seat.seat, name, messages: [], state: null, closed: null}); }
  connect({auth = true, headers = {Origin: origin}} = {}) {
    this.closed = null;
    const ws = new WebSocket(endpoint.replace(/^http/, 'ws') + `/party/${this.kind}/rooms/${this.room}/socket`, {headers});
    this.ws = ws;
    ws.onmessage = e => { const m = JSON.parse(e.data); m.at = Date.now(); this.messages.push(m); if (m.type === 'state' && (!this.state || m.revision >= this.state.revision)) this.state = m; };
    ws.onclose = e => { this.closed = {code: e.code, reason: e.reason}; };
    return new Promise((resolve, reject) => {
      ws.onopen = () => { if (auth) ws.send(JSON.stringify({type: 'auth', token: this.token})); resolve(this); };
      ws.onerror = () => reject(Error('socket failed to open'));
    });
  }
  send(type, extra = {}) { this.ws.send(JSON.stringify({type, id: crypto.randomUUID(), roundId: this.state?.roundId, canvasVersion: this.state?.canvasVersion, ...extra})); }
  raw(data) { this.ws.send(data); }
  async until(pred, what, timeout = 8000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) { if (this.state && pred(this.state)) return this.state; await sleep(20); }
    throw Error(`${this.name} timed out waiting for ${what} (phase ${this.state?.phase}, round ${this.state?.round}, answered ${JSON.stringify(this.state?.answered?.length)}/${this.state?.eligible?.length}, errors ${JSON.stringify(this.errors().slice(-3))}, closed ${JSON.stringify(this.closed)})`);
  }
  async closedWith(timeout = 4000) { const end = Date.now() + timeout; while (!this.closed && Date.now() < end) await sleep(20); return this.closed; }
  errors() { return this.messages.filter(m => m.type === 'error').map(m => m.message); }
}

async function openRoom(kind, count, {extraJoins = 0} = {}) {
  const created = await post(`/party/${kind}/rooms`, {name: 'Host', avatar: 1});
  assert.ok(created.token, 'room creation failed: ' + JSON.stringify(created));
  const joins = await Promise.all(Array.from({length: count - 1 + extraJoins}, (_, i) => post(`/party/${kind}/rooms/${created.room}/join`, {name: 'P' + (i + 1), avatar: i % 6})));
  const seats = joins.filter(j => j.token);
  const players = [new Player(kind, created.room, created, 'Host'), ...seats.slice(0, count - 1).map((s, i) => new Player(kind, created.room, s, 'P' + (i + 1)))];
  await Promise.all(players.map(p => p.connect()));
  await Promise.all(players.map(p => p.until(s => s.players.filter(x => x.connected).length === players.length, 'everyone connected')));
  return {room: created.room, players, joins};
}
const closeAll = players => players.forEach(p => { try { p.ws.close(); } catch {} });

// ---------------------------------------------------------------------------------------------------
async function drawMatch() {
  const {players, joins} = await openRoom('draw', 8, {extraJoins: 4});
  check('draw: 11 simultaneous joins fill exactly 7 seats', joins.filter(j => j.token).length === 7 && joins.filter(j => !j.token).every(j => j.status === 409), JSON.stringify(joins.map(j => j.status)));
  const [host] = players, byId = new Map(players.map(p => [p.id, p]));
  host.send('start');
  const drawers = [], secretsSeen = [], inkProblems = [], scoreProblems = [];
  for (let turn = 1; turn <= 8; turn++) {
    await host.until(s => s.phase === 'choose' && s.round === turn, 'turn ' + turn);
    const drawer = byId.get(host.state.drawer);
    drawers.push(drawer.name);
    await drawer.until(s => s.choices?.length === 3 && s.round === turn, 'choices');
    drawer.send('choose', {choice: turn % 3});
    await drawer.until(s => s.phase === 'drawing' && s.word, 'word');
    const word = drawer.state.word;
    const guessers = players.filter(p => p !== drawer);
    await Promise.all(guessers.map(p => p.until(s => s.phase === 'drawing' && s.round === turn, 'drawing phase')));
    const inkStart = guessers.map(p => p.messages.length);

    // Three gestures, the last split across batches like a real client.
    const sent = [];
    for (let g = 0; g < 3; g++) {
      const stroke = crypto.randomUUID(), batches = g === 2 ? 4 : 1;
      for (let seq = 0; seq < batches; seq++) {
        const points = Array.from({length: 32}, (_, i) => [Math.round((i / 31) * 1e4) / 1e4, Math.round(((g + seq / batches) / 3) * 1e4) / 1e4]);
        drawer.send('stroke', {stroke, seq, color: '#e34c4c', size: 7, points});
        sent.push({stroke, seq, points});
        await sleep(90);
      }
    }
    await sleep(300);
    for (const [i, p] of guessers.entries()) {
      const ink = p.messages.slice(inkStart[i]).filter(m => m.type === 'ink');
      const same = ink.length === sent.length && ink.every((m, k) => m.stroke === sent[k].stroke && m.seq === sent[k].seq && JSON.stringify(m.points) === JSON.stringify(sent[k].points));
      if (!same) inkProblems.push(`turn ${turn}: ${p.name} got ${ink.length}/${sent.length} batches${ink.length === sent.length ? ' out of order or altered' : ''}`);
    }

    // Wrong guesses, then every guesser answers at once.
    guessers[0].send('guess', {text: 'definitely-wrong'});
    await sleep(100);
    const before = new Map(host.state.players.map(p => [p.id, p.score]));
    guessers.forEach((p, i) => p.send('guess', {text: i % 2 ? word.toUpperCase() + '  ' : word}));
    await host.until(s => s.phase === 'reveal' && s.round === turn, 'everyone guessed');
    const after = new Map(host.state.players.map(p => [p.id, p.score]));
    for (const p of guessers) { const d = after.get(p.id) - before.get(p.id); if (d < 100 || d > 300) scoreProblems.push(`turn ${turn}: ${p.name} +${d}`); }
    const dd = after.get(drawer.id) - before.get(drawer.id);
    if (dd !== 350) scoreProblems.push(`turn ${turn}: drawer +${dd}, expected 350`);
    if (host.state.reveal !== word) scoreProblems.push(`turn ${turn}: reveal "${host.state.reveal}" != "${word}"`);

    // Secret scan: while this turn was secret, no guesser message may carry the word, choices or a correct guess.
    for (const p of guessers) {
      for (const m of p.messages.filter(m => m.type === 'state' && m.round === turn && ['choose', 'drawing'].includes(m.phase))) {
        if (m.word || m.choices) secretsSeen.push(`${p.name} received ${m.word ? 'word' : 'choices'} in turn ${turn}`);
        const shown = m.feed.find(f => f.text.toLowerCase().endsWith(': ' + word.toLowerCase()) || f.text.toLowerCase().endsWith(': ' + word.toLowerCase() + '  '));
        if (shown) secretsSeen.push(`${p.name} saw "${shown.text}" in the feed`);
      }
    }
    host.send('skip'); // leave the 7-second reveal early
  }
  await host.until(s => s.phase === 'finished', 'match end');
  check('draw: 8-player match gives every player exactly one turn', new Set(drawers).size === 8, drawers.join(', '));
  check('draw: every guesser receives every ink batch, in order and unaltered', !inkProblems.length, inkProblems.slice(0, 3).join('; '));
  check('draw: simultaneous correct guesses all score (100–300 each, drawer +50 per guesser)', !scoreProblems.length, scoreProblems.slice(0, 3).join('; '));
  check('draw: no guesser ever sees the current word (via word/choices fields, a correct guess, or an earlier reveal of a repeated word)', !secretsSeen.length, secretsSeen.slice(0, 3).join('; '));
  check('draw: all players agree on final scores', players.every(p => JSON.stringify(p.state.players) === JSON.stringify(host.state.players)));
  check('draw: no session token appears in any message', players.every(p => !p.messages.some(m => players.some(q => JSON.stringify(m).includes(q.token)))));
  host.send('start');
  await host.until(s => s.phase === 'choose' && s.round === 1, 'rematch');
  check('draw: rematch resets all scores', host.state.players.every(p => p.score === 0));
  closeAll(players);
}

async function drawResilience() {
  const {players} = await openRoom('draw', 4);
  const [host] = players, byId = new Map(players.map(p => [p.id, p]));
  host.send('start');
  await host.until(s => s.phase === 'choose', 'first turn');
  const drawer = byId.get(host.state.drawer);
  drawer.send('choose', {choice: 0});
  await host.until(s => s.phase === 'drawing', 'drawing');
  const [guesser, watcher] = players.filter(p => p !== drawer);

  // A guesser forging ink must be refused and nothing may reach the others.
  const inkBefore = watcher.messages.filter(m => m.type === 'ink').length;
  guesser.send('stroke', {stroke: 'forged', seq: 0, color: '#e34c4c', size: 7, points: [[0.5, 0.5]]});
  await sleep(300);
  check('draw: forged ink from a guesser is rejected and not relayed', guesser.errors().some(e => /drawer/.test(e)) && watcher.messages.filter(m => m.type === 'ink').length === inkBefore);

  // Same seat in a second tab replaces the first connection.
  const second = new Player('draw', drawer.room, {token: drawer.token, seat: drawer.id}, drawer.name + ' tab 2');
  await second.connect();
  const oldClose = await drawer.closedWith();
  check('draw: opening the same seat in a second tab closes the first (1000)', oldClose?.code === 1000, JSON.stringify(oldClose));
  await second.until(s => s.you === drawer.id, 'second tab seated');

  // The drawer dropping mid-turn skips the turn; reconnecting keeps the seat and score.
  const score = second.state.players.find(p => p.id === drawer.id).score;
  second.ws.close();
  await watcher.until(s => s.phase === 'reveal' && /disconnected/i.test(s.reason || ''), 'drawer disconnect skip');
  check('draw: others see the turn skipped and the drawer offline', watcher.state.players.find(p => p.id === drawer.id).connected === false);
  const back = new Player('draw', drawer.room, {token: drawer.token, seat: drawer.id}, drawer.name + ' back');
  await back.connect();
  await watcher.until(s => s.players.find(p => p.id === drawer.id)?.connected, 'reconnect');
  check('draw: reconnecting within the grace period restores seat and score', back.state?.players.find(p => p.id === drawer.id)?.score === score);
  closeAll([...players, second, back]);
}

// ---------------------------------------------------------------------------------------------------
async function quizMatch() {
  const {players} = await openRoom('quiz', 8);
  const [host] = players;
  host.send('start');
  const problems = [], early = [];
  let closeTimes = [];
  for (let q = 1; q <= 10; q++) {
    await Promise.all(players.map(p => p.until(s => s.phase === 'question' && s.round === q, 'question ' + q)));
    const before = new Map(host.state.players.map(p => [p.id, p.score]));
    const choices = players.map(() => Math.floor(Math.random() * 4));
    const sentAt = Date.now();
    players.forEach((p, i) => p.send('answer', {choice: choices[i]}));
    const closed = await host.until(s => s.round === q && ['quizReveal', 'finished'].includes(s.phase), 'close of question ' + q);
    closeTimes.push(Date.now() - sentAt);
    const correct = closed.question.correct;
    for (const [i, p] of players.entries()) {
      const d = closed.players.find(x => x.id === p.id).score - before.get(p.id);
      if (choices[i] === correct ? d < 500 || d > 1000 : d !== 0) problems.push(`Q${q} ${p.name} chose ${choices[i]} (correct ${correct}) and got +${d}`);
    }
    for (const p of players) for (const m of p.messages.filter(m => m.type === 'state' && m.round === q && m.phase === 'question')) {
      if ('correct' in (m.question || {}) || 'explanation' in (m.question || {})) early.push(`${p.name} saw the answer to Q${q} early`);
      if (m.selection !== null && m.selection !== choices[players.indexOf(p)]) early.push(`${p.name} saw someone else's selection`);
    }
    await sleep(400); // a person reads the explanation; also keeps the host under the 20 msg/s limit
    if (q < 10) host.send('next');
  }
  await host.until(s => s.phase === 'finished', 'final standings');
  check('quiz: 8 simultaneous answers are all counted and scored correctly on 10 questions', !problems.length, problems.slice(0, 3).join('; '));
  check('quiz: a question closes as soon as all 8 have answered', Math.max(...closeTimes) < 3000, 'slowest close ' + Math.max(...closeTimes) + 'ms');
  check('quiz: no one sees the correct answer or others\' choices before a question closes', !early.length, early.slice(0, 3).join('; '));
  check('quiz: all players agree on final standings', players.every(p => JSON.stringify(p.state.players) === JSON.stringify(host.state.players)));
  closeAll(players);
}

async function quizDeadline() {
  const {players} = await openRoom('quiz', 3);
  const [host, a, b] = players;
  host.send('start');
  await host.until(s => s.phase === 'question', 'question');
  const opened = Date.now(), deadline = host.state.deadline - host.state.serverNow;
  host.send('answer', {choice: 0}); a.send('answer', {choice: 1});
  await sleep(300);
  a.send('answer', {choice: 2});
  await sleep(200);
  check('quiz: a second answer from the same player is refused', a.errors().some(e => /locked/.test(e)));
  const closed = await host.until(s => s.phase === 'quizReveal', 'server deadline', 26000);
  const took = Date.now() - opened;
  check('quiz: the server closes an unanswered question at its 20 s deadline without any client action', took >= deadline - 500 && took < deadline + 3000, `closed after ${took}ms (deadline ${deadline}ms)`);
  check('quiz: the player who did not answer scores nothing', closed.players.find(p => p.id === b.id).score === 0);
  b.send('answer', {choice: closed.question.correct});
  await sleep(300);
  check('quiz: a late answer after close is refused', b.errors().some(e => /closed|changed/.test(e)) && host.state.players.find(p => p.id === b.id).score === 0);
  closeAll(players);
}

// ---------------------------------------------------------------------------------------------------
async function hostile() {
  const {room, players} = await openRoom('draw', 3);
  const [host] = players;

  const evil = await post(`/party/draw/rooms/${room}/join`, {name: 'x'}, {Origin: 'https://evil.example'});
  check('hostile: joins from other origins are refused (403)', evil.status === 403, 'status ' + evil.status);
  const evilSocket = new Player('draw', room, {token: host.token}, 'evil');
  const refused = await evilSocket.connect({headers: {Origin: 'https://evil.example'}}).then(() => false, () => true);
  check('hostile: sockets from other origins are refused', refused);

  const early = new Player('draw', room, {token: 'x'}, 'early');
  await early.connect({auth: false});
  early.send('start');
  check('hostile: commands before authentication close the socket (1008)', (await early.closedWith())?.code === 1008);

  const wrong = new Player('draw', room, {token: 'not-a-token'}, 'wrong');
  await wrong.connect();
  check('hostile: an invalid token closes the socket (1008)', (await wrong.closedWith())?.code === 1008);

  const big = new Player('draw', room, {token: players[1].token}, 'big');
  await big.connect(); await sleep(200);
  big.raw('x'.repeat(16385));
  check('hostile: a message over 16 KiB closes the socket (1009)', (await big.closedWith())?.code === 1009);

  const binary = new Player('draw', room, {token: players[1].token}, 'binary');
  await binary.connect(); await sleep(200);
  binary.raw(new Uint8Array([1, 2, 3]));
  check('hostile: binary frames close the socket', !!(await binary.closedWith()));

  const junk = new Player('draw', room, {token: players[1].token}, 'junk');
  await junk.connect(); await sleep(200);
  junk.raw('{not json');
  await sleep(300);
  check('hostile: invalid JSON gets an error reply and keeps the seat', junk.errors().includes('Invalid message.') && !junk.closed);

  const flood = new Player('draw', room, {token: players[2].token}, 'flood');
  await flood.connect(); await sleep(200);
  for (let i = 0; i < 30; i++) flood.raw('{"type":"sync"}');
  check('hostile: more than 20 messages per second closes the socket (1008)', (await flood.closedWith())?.code === 1008);

  // Node's WebSocket client does not surface this server-initiated close (Chromium receives 1008 at ~10 s),
  // so check the property that matters: a socket that waited past the timeout can no longer take a seat.
  const idle = new Player('draw', room, {token: players[1].token}, 'idle');
  await idle.connect({auth: false});
  await sleep(12000);
  try { idle.send('auth', {token: players[1].token}); } catch {}
  await sleep(1000);
  check('hostile: a socket that does not authenticate within 10 s cannot authenticate later', !idle.messages.some(m => m.type === 'state'), 'late auth was accepted');

  const extra = [];
  let rejected = false;
  for (let i = 0; i < 20 && !rejected; i++) { const s = new Player('draw', room, {token: 'x'}, 'extra' + i); try { await s.connect({auth: false}); extra.push(s); } catch { rejected = true; } }
  check('hostile: the room refuses sockets beyond its 16-connection limit', rejected, `${extra.length} extra sockets accepted`);
  closeAll([...extra, ...players]);

  const ip = '10.99.0.1', statuses = [];
  for (let i = 0; i < 11; i++) statuses.push((await post('/party/quiz/rooms', {name: 'g'}, {'CF-Connecting-IP': ip})).status);
  check('hostile: one address can create at most 10 rooms per hour', statuses.slice(0, 10).every(s => s === 200) && statuses[10] === 429, statuses.join(','));
}

const only = process.env.ONLY;
for (const [name, fn] of [['draw match', drawMatch], ['draw resilience', drawResilience], ['quiz match', quizMatch], ['quiz deadline', quizDeadline], ['hostile clients', hostile]]) {
  if (only && !name.includes(only)) continue;
  try { await fn(); } catch (e) { check(`${name}: completed without a protocol stall`, false, e.message); }
}
const failed = results.filter(x => !x).length;
console.log(`\n${results.length - failed} passed, ${failed} failed (local Worker ${endpoint}).`);
process.exit(failed ? 1 : 0);
