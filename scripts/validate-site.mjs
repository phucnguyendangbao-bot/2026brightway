import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const issues = [];
let links = 0;
let scripts = 0;
const htmlFiles = fs.readdirSync(root).filter(file => file.endsWith('.html'));
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, tag => tag.slice(0, tag.indexOf('>') + 1));
  for (const match of markup.matchAll(/(?:href|src)="([^"\s]+)"/g)) {
    const value = match[1];
    if (/^(https?:|data:|mailto:|tel:|#|javascript:)/.test(value)) continue;
    const local = decodeURIComponent(value.split(/[?#]/)[0]).replace(/^\//, '');
    if (!local) continue;
    links++;
    if (!fs.existsSync(path.join(root, local))) issues.push(`${file}: missing local target ${local}`);
  }
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc=|type="(?:application\/ld\+json|module)"/.test(match[1]) || !match[2].trim()) continue;
    scripts++;
    try { new vm.Script(match[2], { filename: file }); }
    catch (error) { issues.push(`${file}: ${error.message}`); }
  }
}
for (const folder of ['assets/js', 'assets/data', 'api']) {
  for (const file of fs.readdirSync(path.join(root, folder)).filter(file => /\.(?:m?js|cjs)$/.test(file))) {
    const target = path.join(root, folder, file);
    const result = spawnSync(process.execPath, ['--check', target], { encoding: 'utf8' });
    scripts++;
    if (result.status !== 0) issues.push(result.stderr.trim());
  }
}
console.log(JSON.stringify({ status: issues.length ? 'FAIL' : 'PASS', pages: htmlFiles.length, localLinksAndAssets: links, syntaxChecks: scripts, issues }, null, 2));
if (issues.length) process.exitCode = 1;
