import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';

const indexUrl = new URL('../dist/index.html', import.meta.url);
const index = await readFile(indexUrl, 'utf8');
const buildAssets = [...index.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map((match) => match[1]);
const workerUrl = new URL('../dist/sw.js', import.meta.url);
const worker = await readFile(workerUrl, 'utf8');
await writeFile(workerUrl, worker.replace('/* INJECT_BUILD_ASSETS */ []', JSON.stringify(buildAssets)));

for (const route of ['privacy', 'terms', 'review', 'settings']) {
  await mkdir(new URL(`../dist/${route}/`, import.meta.url), { recursive: true });
  await cp(indexUrl, new URL(`../dist/${route}/index.html`, import.meta.url));
}
