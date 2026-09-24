// Edge cases for Draw and Quiz rooms: departures, stuck states, near-miss guesses, limits and storage cost.
// Runs the real rules and PartyRoom with a fake clock/transport; no Worker needed.
import assert from 'node:assert/strict';
import {createParty,addPlayer,partyAction,partySnapshot,advance,depart} from '../multiplayer/party-core.mjs';
import {PartyRoom} from '../multiplayer/party-room.mjs';

let now = 1_000_000;
const results = [];
const check = (name, fn) => {
  try { fn(); results.push(true); console.log('PASS ' + name); }
  catch (error) { results.push(false); console.log('FAIL ' + name + '\n     ' + String(error.message).split('\n')[0]); }
};
const checkAsync = async (name, fn) => {
  try { await fn(); results.push(true); console.log('PASS ' + name); }
  catch (error) { results.push(false); console.log('FAIL ' + name + '\n     ' + String(error.message).split('\n')[0]); }
};
function room(kind, count) {
  const r = createParty(kind, now);
  const players = Array.from({length: count}, (_, i) => { const p = addPlayer(r, 'token' + i, 'P' + i, 0, now); p.offline = null; return p; });
  return {r, players};
}
const act = (r, id, type, extra = {}) => partyAction(r, id, {type, id: crypto.randomUUID(), roundId: r.roundId, canvasVersion: r.canvasVersion, ...extra}, now);
const drawing = r => { act(r, r.drawer, 'choose', {choice: 0}); return r.word; };

// --- Stuck states after departures -------------------------------------------------------------
check('draw: after a leave drops the match below 3 players, the room can take a new player', () => {
  const {r, players} = room('draw', 3);
  act(r, players[0].id, 'start');
  act(r, players[2].id, 'leave');
  // Play out whatever turn is running so the match reaches its next decision point.
  for (let i = 0; i < 5 && !['paused', 'finished', 'lobby'].includes(r.phase); i++) { now = r.deadline; advance(r, now); }
  assert.equal(r.phase, 'paused', 'expected the match to pause');
  let recovered = false;
  for (const type of ['lock', 'start', 'skip']) { try { act(r, r.host, type); } catch {} try { addPlayer(r, 'late', 'Late', 0, now); recovered = true; break; } catch {} }
  assert.ok(recovered, 'paused room rejects every join ("' + (() => { try { addPlayer(r, 'x', 'x', 0, now); } catch (e) { return e.message; } })() + '") and start needs 3 connected, so it can never continue');
});

check('quiz: when the only other player leaves, the host can still finish or restart', () => {
  const {r, players} = room('quiz', 2);
  act(r, players[0].id, 'start');
  act(r, players[0].id, 'answer', {choice: 0});
  act(r, players[1].id, 'answer', {choice: 0});
  assert.equal(r.phase, 'quizReveal');
  act(r, players[1].id, 'leave');
  let moved = false;
  for (const type of ['next', 'start']) { try { act(r, r.host, type); moved = true; break; } catch {} }
  assert.ok(moved || r.phase === 'finished', 'host is stuck on question ' + r.round + ' (next: "Wait for 2 connected players", start: "Match already started", joins rejected)');
});

check('draw: an unlocked paused room admits a replacement who can resume and draw', () => {
  const {r, players} = room('draw', 3);
  act(r, players[0].id, 'start');
  act(r, players[2].id, 'leave');
  act(r, r.host, 'skip'); act(r, r.host, 'skip');
  assert.equal(r.phase, 'paused');
  act(r, r.host, 'lock');
  const replacement = addPlayer(r, 'new-token', 'Replacement', 0, now);
  replacement.offline = null;
  assert.equal(r.total, 3, 'the departed unplayed seat does not inflate the turn count');
  act(r, r.host, 'start');
  assert.equal(r.phase, 'choose');
  assert.ok(r.locked, 'resuming locks active joins again');
  act(r, r.host, 'skip'); act(r, r.host, 'skip');
  assert.equal(r.drawer, replacement.id);
});

check('quiz: early finish unlocks invites, preserves earned scores and supports a fresh match', () => {
  const {r, players} = room('quiz', 2);
  act(r, r.host, 'start');
  act(r, r.host, 'answer', {choice: r.quiz[0].correct});
  act(r, players[1].id, 'leave');
  assert.equal(r.phase, 'finished');
  assert.equal(players[0].score, 1000);
  const replacement = addPlayer(r, 'new', 'Replacement', 0, now);
  replacement.offline = null;
  act(r, r.host, 'start');
  assert.equal(r.phase, 'question');
  assert.equal(r.round, 1);
  assert.equal(players[0].score, 0);
  assert.equal(r.reason, '');
});

check('quiz: question closes as soon as the last unanswered player leaves', () => {
  const {r, players} = room('quiz', 3);
  act(r, players[0].id, 'start');
  act(r, players[0].id, 'answer', {choice: 0});
  act(r, players[1].id, 'answer', {choice: 1});
  act(r, players[2].id, 'leave');
  assert.equal(r.phase, 'quizReveal', 'still waiting ' + Math.round((r.deadline - now) / 1000) + 's for a player who left');
});

check('draw: round ends as soon as the last unsolved guesser leaves', () => {
  const {r, players} = room('draw', 4);
  act(r, players[0].id, 'start');
  const word = drawing(r);
  act(r, players[1].id, 'guess', {text: word.word});
  act(r, players[2].id, 'guess', {text: word.word});
  act(r, players[3].id, 'leave');
  assert.equal(r.phase, 'reveal', 'everyone remaining has guessed, but the turn keeps running for ' + Math.round((r.deadline - now) / 1000) + 's');
});

// --- Guess handling ------------------------------------------------------------------------------
check('draw: a correct guess with trailing punctuation counts and is not broadcast', () => {
  const {r, players} = room('draw', 3);
  act(r, players[0].id, 'start');
  const word = drawing(r);
  act(r, players[1].id, 'guess', {text: word.word + '!'});
  const feed = partySnapshot(r, players[2].id, now).feed.map(x => x.text).join(' | ');
  assert.ok(r.solved.includes(players[1].id), 'guess "' + word.word + '!" was rejected and shown to everyone: ' + feed);
});

check('draw: a correct guess with an internal hyphen or extra spaces counts', () => {
  const {r, players} = room('draw', 3);
  act(r, players[0].id, 'pack', {pack: 'custom', words: [{word: 'ice cream', aliases: []}, {word: 'ice-cream cone', aliases: []}, {word: 't-shirt', aliases: []}]});
  act(r, players[0].id, 'start');
  act(r, r.drawer, 'choose', {choice: r.choices.findIndex(w => w.word === 't-shirt')});
  act(r, players[1].id, 'guess', {text: 'T shirt'});
  assert.ok(r.solved.includes(players[1].id), '"T shirt" for "t-shirt" was rejected and broadcast');
});

check('draw: custom packs accept Devanagari words', () => {
  const {r, players} = room('draw', 3);
  act(r, players[0].id, 'pack', {pack: 'custom', words: ['बिल्ली', 'घर', 'पेड़'].map(word => ({word, aliases: []}))});
  assert.equal(r.pack, 'custom');
});

check('draw: hint shows one blank per visible letter for Devanagari words', () => {
  const {r, players} = room('draw', 3);
  // Bypass pack validation so the hint itself is tested even while the check above fails.
  r.custom = ['बिल्ली', 'घर', 'पेड़'].map(word => ({word, aliases: []})); r.pack = 'custom';
  act(r, players[0].id, 'start');
  const word = drawing(r).word;
  const graphemes = [...new Intl.Segmenter('hi', {granularity: 'grapheme'}).segment(word)].length;
  const hint = partySnapshot(r, players[1].id, now).hint;
  const blanks = hint.split(' ').filter(Boolean).length;
  assert.equal(blanks, graphemes, `"${word}" has ${graphemes} letters but the hint shows ${blanks} blanks ("${hint}")`);
});

check('draw: no word is offered twice in one match', () => {
  // 8 turns x 3 choices from the 24-word pack; repeated over 50 matches so a repeat is near-certain if allowed.
  for (let match = 0; match < 50; match++) {
    const {r, players} = room('draw', 8);
    act(r, players[0].id, 'start');
    const offered = [];
    while (r.phase !== 'finished') {
      if (r.phase === 'choose') { offered.push(...r.choices.map(w => w.word)); act(r, r.drawer, 'choose', {choice: 0}); }
      now = r.deadline; advance(r, now);
    }
    const repeats = offered.filter((w, i) => offered.indexOf(w) !== i);
    assert.equal(repeats.length, 0, `match ${match + 1} offered ${[...new Set(repeats)].join(', ')} more than once; an earlier reveal ("Word: …") stays in the feed`);
  }
});

check('draw: a short custom pack shrinks choices and never repeats a chosen answer', () => {
  const {r} = room('draw', 3);
  act(r, r.host, 'pack', {pack: 'custom', words: ['cat', 'sun', 'bike'].map(word => ({word, aliases: []}))});
  act(r, r.host, 'start');
  const used = [];
  for (let turn = 0; turn < 3; turn++) {
    assert.equal(r.choices.length, 3 - turn);
    assert.throws(() => act(r, r.drawer, 'choose', {choice: r.choices.length}));
    used.push(drawing(r).word);
    act(r, r.host, 'skip'); act(r, r.host, 'skip');
  }
  assert.equal(r.phase, 'finished');
  assert.equal(new Set(used).size, 3);
});

check('draw: a one-grapheme word stays masked after the timed hint', () => {
  const {r, players} = room('draw', 3);
  r.custom = ['क', 'घर', 'पेड़'].map(word => ({word, aliases: []}));
  act(r, r.host, 'start');
  act(r, r.drawer, 'choose', {choice: r.choices.findIndex(w => w.word === 'क')});
  now += 40000; advance(r, now);
  assert.equal(partySnapshot(r, players[1].id, now).hint, '_');
});

// --- Scoring --------------------------------------------------------------------------------------
check('draw: guess scores stay within 100–300 and reward speed', () => {
  const {r, players} = room('draw', 4);
  act(r, players[0].id, 'start');
  const word = drawing(r);
  act(r, players[1].id, 'guess', {text: word.word});
  now += 60000;
  act(r, players[2].id, 'guess', {text: word.word});
  assert.equal(players[1].score, 300);
  assert.ok(players[2].score >= 100 && players[2].score < players[1].score, 'late score ' + players[2].score);
  assert.equal(players[0].score, 100, 'drawer gets 50 per correct guesser');
});

check('quiz: faster correct answers score more, wrong answers score nothing, all within 500–1000', () => {
  const {r, players} = room('quiz', 3);
  act(r, players[0].id, 'start');
  const correct = r.quiz[0].correct;
  act(r, players[0].id, 'answer', {choice: correct});
  now += 10000;
  act(r, players[1].id, 'answer', {choice: correct});
  act(r, players[2].id, 'answer', {choice: (correct + 1) % 4});
  assert.equal(r.phase, 'quizReveal');
  assert.equal(players[0].score, 1000);
  assert.equal(players[1].score, 750);
  assert.equal(players[2].score, 0);
});

check('quiz: an answer arriving at the deadline is rejected and the question closes', () => {
  const {r, players} = room('quiz', 2);
  act(r, players[0].id, 'start');
  now = r.deadline;
  assert.throws(() => act(r, players[0].id, 'answer', {choice: 0}), /closed/);
  assert.equal(r.phase, 'quizReveal');
});

check('quiz: eight simultaneous answers close the question once', () => {
  const {r, players} = room('quiz', 8);
  act(r, players[0].id, 'start');
  for (const p of players) act(r, p.id, 'answer', {choice: r.quiz[0].correct});
  assert.equal(r.phase, 'quizReveal');
  assert.ok(players.every(p => p.score === 1000), 'scores ' + players.map(p => p.score));
});

// --- Transport limits and cost (PartyRoom with fake storage) ---------------------------------------
function fakeRoom() {
  const data = new Map(), sockets = [];
  let pending, puts = 0;
  const ctx = {
    storage: {get: async k => data.get(k), put: async (k, v) => { puts++; data.set(k, structuredClone(v)); }, setAlarm: async () => {}, deleteAll: async () => data.clear()},
    blockConcurrencyWhile(fn) { pending = fn(); }, getWebSockets: () => sockets.filter(s => s.readyState === 1)
  };
  const party = new PartyRoom(ctx);
  const socket = () => {
    const s = {a: {seat: null, opened: now, count: 0, window: now}, readyState: 1, bytes: 0, messages: [],
      serializeAttachment(a) { this.a = a; }, deserializeAttachment() { return this.a; },
      send(v) { this.bytes += v.length; this.messages.push(JSON.parse(v)); }, close(code, reason) { this.readyState = 3; this.closed = {code, reason}; }};
    sockets.push(s); return s;
  };
  return {party, socket, ready: () => pending, puts: () => puts};
}
const realNow = Date.now;
Date.now = () => now;
try {
  async function seated(kind, count) {
    const f = fakeRoom(); await f.ready();
    const seats = [];
    for (let i = 0; i < count; i++) {
      const res = await f.party.fetch(new Request('https://room/' + (i ? 'join' : 'create'), {method: 'POST', body: JSON.stringify({kind, name: 'P' + i})}));
      const seat = await res.json(); const ws = f.socket();
      await f.party.webSocketMessage(ws, JSON.stringify({type: 'auth', token: seat.token}));
      seats.push({...seat, ws});
    }
    const send = (s, type, extra = {}) => { now += 60; return f.party.webSocketMessage(s.ws, JSON.stringify({type, id: crypto.randomUUID(), roundId: f.party.room.roundId, canvasVersion: f.party.room.canvasVersion, ...extra})); };
    return {...f, seats, send};
  }

  await checkAsync('draw: the largest custom pack the rules accept fits in one message', async () => {
    const {seats, send, party} = await seated('draw', 3);
    const alias = n => 'a'.repeat(39) + n;
    const words = Array.from({length: 60}, (_, i) => ({word: 'word' + String(i).padStart(2, '0') + 'x'.repeat(34), aliases: [1, 2, 3, 4, 5, 6].map(alias)}));
    const size = JSON.stringify({type: 'pack', id: crypto.randomUUID(), pack: 'custom', words}).length;
    await send(seats[0], 'pack', {pack: 'custom', words});
    assert.ok(!seats[0].ws.closed, `a valid 60-word pack is ${size} bytes; the socket was closed (${seats[0].ws.closed?.code} ${seats[0].ws.closed?.reason}) instead of accepting it or explaining the limit`);
    assert.equal(party.room.pack, 'custom');
  });

  await checkAsync('rejected commands do not write to storage', async () => {
    const {seats, send, puts, party} = await seated('draw', 3);
    const before = puts();
    const stateBefore = structuredClone(party.room);
    for (let i = 0; i < 10; i++) await send(seats[1], 'start');
    assert.equal(puts() - before, 0, `10 rejected "start" commands from a guest caused ${puts() - before} storage writes and full-state broadcasts`);
    assert.deepEqual(party.room, stateBefore, 'rejections must not dirty command IDs or any game state');
  });

  await checkAsync('custom packs: maximum Unicode text fits while non-pack UTF-8 input stays bounded', async () => {
    const {seats, send, party} = await seated('draw', 3);
    const words = Array.from({length: 60}, (_, i) => ({word: String(i).padStart(2, '0') + '猫'.repeat(38), aliases: Array(6).fill('猫'.repeat(40))}));
    await send(seats[0], 'pack', {pack: 'custom', words});
    assert.equal(party.room.custom.length, 60);
    assert.ok(!seats[0].ws.closed);
    await party.webSocketMessage(seats[1].ws, JSON.stringify({type: 'guess', text: '猫'.repeat(6000)}));
    assert.equal(seats[1].ws.closed?.code, 1009, '16 KiB is a byte bound, not a character bound');
  });

  await checkAsync('a rejected late answer still persists the server deadline transition', async () => {
    const {party, seats, send, puts} = await seated('quiz', 2);
    await send(seats[0], 'start');
    const before = puts(); now = party.room.deadline;
    await send(seats[0], 'answer', {choice: 0});
    assert.equal(party.room.phase, 'quizReveal');
    assert.equal(puts(), before + 1);
    assert.equal(party.room.players[0].score, 0);
  });

  await checkAsync('draw: a wrong guess on a full canvas does not resend the whole drawing to everyone', async () => {
    const {seats, send, party} = await seated('draw', 8);
    await send(seats[0], 'start');
    const drawer = seats.find(s => s.seat === party.room.drawer);
    await send(drawer, 'choose', {choice: 0});
    // Fill the canvas the way a real client does: full-precision coordinates, 32 points per batch.
    for (let seq = 0; seq < 250; seq++) { await send(drawer, 'stroke', {stroke: 'long', seq, color: '#173e38', size: 7, points: Array.from({length: 32}, () => [Math.random(), Math.random()])}); }
    assert.equal(party.room.points, 8000);
    const guesser = seats.find(s => s !== drawer);
    for (const s of seats) { s.ws.bytes = 0; s.ws.messages = []; }
    await send(guesser, 'guess', {text: 'not the word'});
    const total = seats.reduce((n, s) => n + s.ws.bytes, 0);
    assert.ok(total < 8 * 65536, `one wrong guess sent ${(total / 1e6).toFixed(1)} MB (${Math.round(total / 8 / 1024)} KB per player); at 20 messages/s per guesser that is ~${Math.round(total * 20 * 7 / 1e6)} MB/s of JSON the room must serialize`);
    assert.ok(seats.every(s => s.ws.messages.every(m => !('drawing' in m))), 'ordinary state updates contain no canvas history');
    console.log(`     Full-canvas wrong guess: ${total} bytes total across 8 players.`);
    const storedDrawing = structuredClone(party.room.drawing), writes = party.room.revision;
    await send(guesser, 'sync');
    assert.deepEqual(guesser.ws.messages.at(-1).drawing, storedDrawing, 'explicit resync restores the entire canvas');
    assert.equal(party.room.revision, writes, 'resync does not mutate the game');
    const beforeRejected = structuredClone(party.room);
    await send(drawer, 'stroke', {stroke: 'overfull-new-stroke', seq: 0, color: '#173e38', size: 7, points: [[0, 0]]});
    assert.deepEqual(party.room, beforeRejected, 'rejecting an overfull stroke must not insert an empty gesture');
  });

  await checkAsync('a kicked player cannot re-authenticate with the old token', async () => {
    const {seats, send, party} = await seated('draw', 3);
    await send(seats[0], 'kick', {player: seats[2].seat});
    assert.equal(seats[2].ws.closed?.code, 1000);
    const f2 = {ws: null};
    const ws = {a: {seat: null, opened: now, count: 0, window: now}, readyState: 1, serializeAttachment(a) { this.a = a; }, deserializeAttachment() { return this.a; }, send() {}, close(code) { this.readyState = 3; this.closed = {code}; }};
    await party.webSocketMessage(ws, JSON.stringify({type: 'auth', token: seats[2].token}));
    assert.equal(ws.closed?.code, 1008);
    void f2;
  });

  await checkAsync('draw: a stale stroke after undo is rejected without corrupting the canvas', async () => {
    const {seats, send, party} = await seated('draw', 3);
    await send(seats[0], 'start');
    const drawer = seats.find(s => s.seat === party.room.drawer);
    await send(drawer, 'choose', {choice: 0});
    const version = party.room.canvasVersion;
    await send(drawer, 'stroke', {stroke: 'a', seq: 0, color: '#173e38', size: 7, points: [[0.1, 0.1]]});
    await send(drawer, 'undo');
    await party.webSocketMessage(drawer.ws, JSON.stringify({type: 'stroke', id: crypto.randomUUID(), roundId: party.room.roundId, canvasVersion: version, stroke: 'a', seq: 1, color: '#173e38', size: 7, points: [[0.2, 0.2]]}));
    assert.equal(party.room.points, 0);
    assert.equal(party.room.drawing.length, 0);
  });
} finally {
  Date.now = realNow;
}

const failed = results.filter(x => !x).length;
console.log(`\n${results.length - failed} passed, ${failed} failed.`);
process.exitCode = failed ? 1 : 0;
