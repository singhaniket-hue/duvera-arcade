// Runs the extended Draw/Quiz suites: rule edge cases, seeded fuzzing, real-socket protocol tests
// and phone-sized browser tests against an isolated local Worker. Reports every suite, then exits
// non-zero if any failed.
import {spawn, execFileSync} from 'node:child_process';
import {mkdir, mkdtemp, open} from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
await mkdir('output', {recursive: true});
const state = await mkdtemp(path.resolve('output/party-rigor-'));
const port = await new Promise(resolve => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const log = await open(path.join(state, 'worker.log'), 'w');
const worker = spawn(process.execPath, ['multiplayer/node_modules/wrangler/bin/wrangler.js', 'dev', '--config', 'multiplayer/wrangler.jsonc', '--ip', '127.0.0.1', '--port', String(port), '--persist-to', state], {stdio: ['ignore', log.fd, log.fd], detached: process.platform !== 'win32', env: {...process.env, WRANGLER_LOG_PATH: path.join(state, 'wrangler.log')}});
const endpoint = 'http://127.0.0.1:' + port;
const summary = [];
try {
  let ready = false;
  for (let i = 0; i < 120 && !ready; i++) { if (worker.exitCode !== null) throw Error('Local Worker exited; see ' + state); try { await fetch(endpoint); ready = true; } catch { await new Promise(r => setTimeout(r, 250)); } }
  if (!ready) throw Error('Local Worker did not start; see ' + state);
  for (const file of ['check-party-edge', 'check-party-fuzz', 'party-protocol-check', 'party-mobile-check']) {
    console.log(`\n=== ${file} ===`);
    const code = await new Promise((resolve, reject) => { const child = spawn(process.execPath, ['scripts/' + file + '.mjs'], {stdio: 'inherit', env: {...process.env, ROOM_ENDPOINT: endpoint}}); child.on('error', reject); child.on('exit', resolve); });
    summary.push([file, code]);
  }
} finally {
  if (worker.exitCode === null) { try { if (process.platform === 'win32') execFileSync('taskkill', ['/PID', String(worker.pid), '/T', '/F'], {stdio: 'ignore'}); else process.kill(-worker.pid, 'SIGTERM'); } catch { worker.kill(); } }
  await log.close();
}
console.log('\n' + summary.map(([f, c]) => `${c === 0 ? 'PASS' : 'FAIL'} ${f}`).join('\n'));
process.exitCode = summary.every(([, c]) => c === 0) ? 0 : 1;
