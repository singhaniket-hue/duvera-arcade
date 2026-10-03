// Randomized Draw/Quiz rule testing: seeded command sequences from up to 8 players with invariant checks
// after every step. Reproduce a failure with FUZZ_SEED=<seed> FUZZ_GAMES=1 node scripts/check-party-fuzz.mjs
import {createParty,addPlayer,partyAction,partySnapshot,advance,depart,normalize} from '../multiplayer/party-core.mjs';

const games = Number(process.env.FUZZ_GAMES || 400), steps = Number(process.env.FUZZ_STEPS || 400);
const firstSeed = Number(process.env.FUZZ_SEED || 1);
function prng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const failures = new Map();
const PHASES = {draw: ['lobby', 'choose', 'drawing', 'reveal', 'paused', 'finished'], quiz: ['lobby', 'question', 'quizReveal', 'finished']};

for (let g = 0; g < games; g++) {
  const seed = firstSeed + g, rand = prng(seed), pick = a => a[Math.floor(rand() * a.length)], kind = g % 2 ? 'quiz' : 'draw';
  let now = 1_000_000, lastKind = '';
  const r = createParty(kind, now), ever = [], log = [];
  const fail = (rule, detail) => { const key = kind + ': ' + rule; if (!failures.has(key)) failures.set(key, {seed, detail, log: log.slice(-6)}); };
  const join = () => { try { const p = addPlayer(r, 'tok-' + seed + '-' + ever.length, pick(['Ann', '<b>x</b>', '', 'Zoë', 'a'.repeat(40)]), pick([0, 5, 9, -1, 1.5]), now); p.offline = null; ever.push(p.id); } catch {} };
  const count = 2 + Math.floor(rand() * 7);
  for (let i = 0; i < count; i++) join();
  let prevScores = new Map(), prevRound = -1, prevPhase = r.phase;

  for (let step = 0; step < steps; step++) {
    const id = rand() < 0.95 ? pick(ever) : 'not-a-player';
    const word = r.word, words = word ? [word.word, ...word.aliases] : ['cat'];
    const opt = pick([r.quiz?.[r.round - 1]?.correct ?? 0, 0, 1, 2, 3, 4, -1, 1.5, '1', null]);
    const menu = kind === 'draw'
      ? ['start', 'start', 'choose', 'choose', 'guess', 'guess', 'guess', 'stroke', 'stroke', 'stroke', 'undo', 'clear', 'skip', 'lock', 'kick', 'pack', 'leave', 'bogus']
      : ['start', 'start', 'answer', 'answer', 'answer', 'answer', 'next', 'next', 'lock', 'kick', 'leave', 'bogus'];
    const type = pick(menu);
    const m = {type, id: rand() < 0.97 ? 'cmd-' + seed + '-' + step : 'cmd-dup', roundId: rand() < 0.9 ? r.roundId : 'stale', canvasVersion: rand() < 0.9 ? r.canvasVersion : r.canvasVersion - 1};
    if (type === 'choose') m.choice = pick([0, 1, 2, 3, -1, 'x']);
    if (type === 'guess') m.text = pick([...words, words[0].toUpperCase() + ' ', 'nope', '', 'x'.repeat(81), 42]);
    if (type === 'stroke') Object.assign(m, {stroke: pick(['s1', 's2', 's' + step]), seq: pick([0, 1, 2, r.drawing.find(s => s.id === 's1')?.seq ?? 0]), color: pick(['#173e38', '#ffffff', 'red']), size: pick([3, 7, 24, 5]), points: pick([[[0.5, 0.5]], Array.from({length: 32}, () => [rand(), rand()]), [[2, 0]], [], 'x', [[NaN, 0]]])});
    if (type === 'kick') m.player = pick([...ever, 'ghost']);
    if (type === 'pack') Object.assign(m, pick([{pack: 'english'}, {pack: 'hindi'}, {pack: 'klingon'}, {pack: 'custom', words: [{word: 'aa', aliases: []}, {word: 'bb', aliases: ['b']}, {word: 'cc', aliases: []}]}, {pack: 'custom', words: 'x'}]));
    if (type === 'answer') m.choice = opt;

    const roll = rand();
    try {
      if (roll < 0.06) { const p = r.players.find(x => x.id === id); if (p && p.offline === null) { log.push('disconnect ' + id.slice(0, 4)); depart(r, id, now); } }
      else if (roll < 0.10) { const p = r.players.find(x => x.id === id); if (p) { log.push('reconnect ' + id.slice(0, 4)); p.offline = null; } }
      else if (roll < 0.12) { log.push('join'); join(); }
      else if (roll < 0.25) { now += pick([500, 5000, 20000, 41000, 76000]); log.push('time +' + now); advance(r, now); for (const p of [...r.players]) if (p.offline !== null && now >= p.offline + 60000) depart(r, p.id, now, true); }
      else { log.push(JSON.stringify({...m, points: m.points?.length, words: undefined}).slice(0, 120)); partyAction(r, id, m, now); }
    } catch (e) {
      if (e?.constructor !== Error) fail('command crashed with ' + e?.constructor?.name, e.message);
    }

    // ---- invariants ----
    if (!PHASES[kind].includes(r.phase)) fail('unknown phase', r.phase);
    if (r.players.length > 8) fail('more than 8 players', r.players.length);
    if (new Set(r.players.map(p => p.id)).size !== r.players.length) fail('duplicate player ids', '');
    if (r.players.length && !r.players.some(p => p.id === r.host)) fail('host is not a player', r.host);
    for (const p of r.players) if (!Number.isInteger(p.score) || p.score < 0) fail('invalid score', p.score);
    if (r.feed.length > 30) fail('feed over 30 entries', r.feed.length);

    const matchReset = r.round < prevRound || (prevPhase !== r.phase && ['choose', 'question'].includes(r.phase) && r.round === 1);
    for (const p of r.players) {
      const before = prevScores.get(p.id);
      if (before === undefined || matchReset) continue;
      const delta = p.score - before;
      if (delta < 0) fail('score decreased mid-match', `${before} -> ${p.score}`);
      if (kind === 'quiz' && delta && (delta < 500 || delta > 1000)) fail('quiz score change outside 500–1000', delta);
      if (kind === 'draw' && delta && p.id !== r.drawer && (delta < 100 || delta > 300)) fail('guesser score change outside 100–300', delta);
    }

    if (kind === 'draw') {
      const total = r.drawing.reduce((n, s) => n + s.points.length, 0);
      if (total !== r.points) fail('point counter out of sync with canvas', `${r.points} vs ${total}`);
      if (r.points > 8000 || r.drawing.length > 120) fail('canvas limits exceeded', `${r.points} points, ${r.drawing.length} strokes`);
      if (['choose', 'drawing'].includes(r.phase) && !r.players.some(p => p.id === r.drawer)) fail('drawer is not in the room', r.phase);
      if (r.phase === 'drawing' && !r.word) fail('drawing phase without a word', '');
    }

    for (const p of r.players) {
      const snap = partySnapshot(r, p.id, now, true), json = JSON.stringify(snap);
      if (r.players.some(x => json.includes(x.token))) fail('snapshot contains a session token', '');
      if (kind === 'draw' && p.id !== r.drawer) {
        if (snap.word || snap.choices) fail('non-drawer receives the word or choices', r.phase);
        if (snap.reveal !== undefined && r.phase !== 'reveal') fail('reveal outside reveal phase', r.phase);
        if (r.word && ['choose', 'drawing'].includes(r.phase)) {
          const secrets = [r.word.word, ...r.word.aliases].map(normalize);
          const leaked = r.feed.find(f => { const text = f.text.split(': ').slice(1).join(': '); return text && secrets.includes(normalize(text)); });
          if (leaked) fail('current word already visible in the feed (guessed or revealed earlier)', leaked.text);
          if (snap.hint && r.phase === 'drawing' && snap.hint.replace(/ /g, '').includes(secrets[0])) fail('hint spells the word', snap.hint);
        }
      }
      if (kind === 'quiz' && r.phase === 'question') {
        if (snap.question && ('correct' in snap.question || 'explanation' in snap.question)) fail('answer visible while the question is open', '');
        if (json.includes('"choice"')) fail('other players\' choices visible', '');
      }
      if (kind === 'quiz' && snap.selection !== null && snap.selection !== undefined && snap.selection !== r.answers?.[p.id]?.choice) fail('selection belongs to someone else', '');
    }

    prevScores = new Map(r.players.map(p => [p.id, p.score]));
    prevRound = r.round; prevPhase = r.phase; lastKind = kind;
  }
  void lastKind;
}

for (const [rule, f] of failures) console.log(`FAIL ${rule}\n     seed ${f.seed}: ${String(f.detail).slice(0, 160)}\n     last steps: ${f.log.join(' ; ').slice(0, 400)}`);
console.log(`\n${games} games x ${steps} steps (seeds ${firstSeed}–${firstSeed + games - 1}): ${failures.size ? failures.size + ' invariant(s) broken' : 'all invariants held'}.`);
process.exitCode = failures.size ? 1 : 0;
