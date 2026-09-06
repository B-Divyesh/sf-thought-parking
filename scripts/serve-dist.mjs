import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';

const root = resolve(process.cwd(), 'dist');
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || '4173');
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
};

async function existingFile(pathname) {
  const relative = decodeURIComponent(pathname).replace(/^\/+/, '');
  const candidate = resolve(root, relative || 'index.html');
  if (!candidate.startsWith(`${root}/`) && candidate !== root) return undefined;
  try {
    const details = await stat(candidate);
    if (details.isDirectory()) return existingFile(`${pathname.replace(/\/$/, '')}/index.html`);
    return details.isFile() ? candidate : undefined;
  } catch {
    return undefined;
  }
}

createServer(async (request, response) => {
  const pathname = new URL(request.url || '/', `http://${host}`).pathname;
  const file = await existingFile(pathname);
  const status = file ? 200 : 404;
  const output = file || join(root, '404.html');
  response.writeHead(status, { 'Content-Type': types[extname(output)] || 'application/octet-stream' });
  createReadStream(output).pipe(response);
}).listen(port, host, () => {
  process.stdout.write(`Serving ${root} at http://${host}:${port}\n`);
});
