import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const option = name => {const i = process.argv.indexOf(name); return i < 0 ? undefined : process.argv[i + 1];};
const port = Number(option('--port') || process.env.PORT || 4173);
const host = option('--host') || '0.0.0.0';
// ES modules used by original Duvera games.
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon','.webp':'image/webp','.woff':'font/woff','.otf':'font/otf','.ttf':'font/ttf','.eot':'application/vnd.ms-fontobject','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.md':'text/plain; charset=utf-8'};
createServer(async (req, res) => {
  types['.mjs']='text/javascript; charset=utf-8';
  if (!['GET', 'HEAD'].includes(req.method)) {res.writeHead(405); return res.end();}
  try {
    const requestPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    // Local multiplayer preview only; the built room-config.js remains unchanged.
    if(requestPath==='/assets/room-config.js'&&process.env.ROOM_ENDPOINT){res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});return res.end('window.ArcadeRooms={endpoint:'+JSON.stringify(process.env.ROOM_ENDPOINT)+'};');}
    if(/^\/(?:multiplayer|node_modules|output|scripts)(?:\/|$)/i.test(requestPath)){res.writeHead(404);return res.end('Not found');}
    if (requestPath.split('/').some(p => p.startsWith('.') && p !== '')) {res.writeHead(404); return res.end('Not found');}
    let file = path.resolve(root, '.' + requestPath);
    if (file !== path.resolve(root) && !file.startsWith(root)) {res.writeHead(403); return res.end();}
    if ((await stat(file)).isDirectory()) {
      if (!requestPath.endsWith('/')) {res.writeHead(301, {Location: requestPath + '/'}); return res.end();}
      file = path.join(file, 'index.html');
    }
    const body = await readFile(file);
    res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (_) {res.writeHead(404); res.end('Not found');}
}).listen(port, host, () => console.log(`Duvera Arcade listening on ${host}:${port}`));
