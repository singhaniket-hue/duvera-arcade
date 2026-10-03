import {cp, mkdir, rm, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
await rm(output, {recursive: true, force: true});
await mkdir(output, {recursive: true});
for (const name of ['index.html', 'play.html', 'credits.html', '404.html', '_headers', 'assets', 'games', 'creators', 'LICENSE.md', 'THIRD_PARTY.md']) {
  await cp(path.join(root, name), path.join(output, name), {recursive: true});
}
// Public provenance lets a deployed direct upload be matched to its tested Git revision.
let revision = null, branch = null;
try {
  revision = execFileSync('git', ['rev-parse', 'HEAD'], {cwd:root, encoding:'utf8'}).trim();
  branch = execFileSync('git', ['branch', '--show-current'], {cwd:root, encoding:'utf8'}).trim();
} catch (_) {}
await writeFile(path.join(output, 'deployment.json'), JSON.stringify({revision, branch}, null, 2)+'\n');
console.log('Built static arcade in dist/ (no dependencies or server runtime required).');
