import {cp, mkdir, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
await rm(output, {recursive: true, force: true});
await mkdir(output, {recursive: true});
for (const name of ['index.html', 'play.html', 'credits.html', 'assets', 'games', 'creators', 'LICENSE.md', 'THIRD_PARTY.md']) {
  await cp(path.join(root, name), path.join(output, name), {recursive: true});
}
console.log('Built static arcade in dist/ (no dependencies or server runtime required).');
