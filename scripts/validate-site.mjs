import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const issues = [];
let links = 0;
let scripts = 0;
const htmlFiles = [
  ...fs.readdirSync(root).filter(file => file.endsWith('.html')),
  ...fs.readdirSync(path.join(root, 'admin')).filter(file => file.endsWith('.html')).map(file => 'admin/' + file),
];
function checkLocal(value, file) {
  if (/^(https?:|data:|mailto:|tel:|#|javascript:)/.test(value)) return;
  const local = decodeURIComponent(value.split(/[?#]/)[0]);
  if (!local) return;
  const target = path.resolve(root, local.startsWith('/') ? '.' + local : path.join(path.dirname(file), local));
  links++;
  if (!fs.existsSync(target)) issues.push(`${file}: missing local target ${local}`);
}
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, tag => tag.slice(0, tag.indexOf('>') + 1));
  for (const match of markup.matchAll(/(?:href|src)="([^"\s]+)"/g)) {
    checkLocal(match[1], file);
  }
  for (const match of markup.matchAll(/srcset="([^\"]+)"/g)) {
    for (const candidate of match[1].split(',')) checkLocal(candidate.trim().split(/\s+/)[0], file);
  }
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc=|type="application\/ld\+json"/.test(match[1]) || !match[2].trim()) continue;
    scripts++;
    if (/type="module"/.test(match[1])) {
      const result = spawnSync(process.execPath, ['--input-type=module', '--check'], { input: match[2], encoding: 'utf8' });
      if (result.status !== 0) issues.push(`${file}: ${result.stderr.trim()}`);
      continue;
    }
    try { new vm.Script(match[2], { filename: file }); }
    catch (error) { issues.push(`${file}: ${error.message}`); }
  }
}
for (const file of fs.readdirSync(path.join(root, 'assets/css')).filter(file => file.endsWith('.css'))) {
  const name = 'assets/css/' + file;
  for (const match of fs.readFileSync(path.join(root, name), 'utf8').matchAll(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/g)) checkLocal(match[1].trim(), name);
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
