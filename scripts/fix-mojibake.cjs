const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FIX = process.argv.includes('--fix');
const EXTENSIONS = new Set(['.html', '.css', '.js', '.json', '.md', '.sql']);
const SKIP_DIRS = new Set(['.git', 'node_modules']);

const CP1252_REVERSE = new Map([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84],
  [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88],
  [0x2030, 0x89], [0x0160, 0x8a], [0x2039, 0x8b], [0x0152, 0x8c],
  [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92], [0x201c, 0x93],
  [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
  [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b],
  [0x0153, 0x9c], [0x017e, 0x9e], [0x0178, 0x9f]
]);

const UTF8_DECODER = new TextDecoder('utf-8', { fatal: true });

function mojibakeScore(text) {
  const patterns = [
    /(?:Ã|Â|Æ|Ä)[\u0080-\u00bf]/gu,
    /ð(?:[\u0080-\u00bf]|Ÿ)/gu,
    /á(?:»|º)./gu,
    /â(?:[\u0080-\u00bf]|[\u2010-\u203a]|€|™)/gu,
    /ï[\u0080-\u00bf]/gu
  ];
  return patterns.reduce((total, pattern) => total + (text.match(pattern) || []).length, 0);
}

function encodeAsWindows1252(text) {
  const bytes = [];
  for (const character of text) {
    const codePoint = character.codePointAt(0);
    if (CP1252_REVERSE.has(codePoint)) {
      bytes.push(CP1252_REVERSE.get(codePoint));
    } else if (codePoint <= 0xff) {
      bytes.push(codePoint);
    } else {
      bytes.push(...Buffer.from(character, 'utf8'));
    }
  }
  return Uint8Array.from(bytes);
}

function repairLine(line) {
  let current = line;
  for (let pass = 0; pass < 3; pass += 1) {
    const before = mojibakeScore(current);
    if (before === 0) break;

    let candidate;
    try {
      candidate = UTF8_DECODER.decode(encodeAsWindows1252(current));
    } catch {
      break;
    }

    if (mojibakeScore(candidate) >= before || candidate.includes('\ufffd')) break;
    current = candidate;
  }
  return current;
}

function listTextFiles(directory, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      listTextFiles(fullPath, output);
    } else if (EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      output.push(fullPath);
    }
  }
  return output;
}

const changed = [];
const unresolved = [];

for (const filePath of listTextFiles(ROOT)) {
  const original = fs.readFileSync(filePath, 'utf8');
  if (mojibakeScore(original) === 0) continue;

  const repaired = original
    .split(/(\r?\n)/)
    .map(part => (part === '\n' || part === '\r\n' ? part : repairLine(part)))
    .join('');

  if (repaired !== original) {
    changed.push(path.relative(ROOT, filePath));
    if (FIX) fs.writeFileSync(filePath, repaired, 'utf8');
  }

  const remaining = mojibakeScore(repaired);
  if (remaining > 0) unresolved.push({ file: path.relative(ROOT, filePath), remaining });
}

console.log(JSON.stringify({ mode: FIX ? 'fix' : 'check', changed, unresolved }, null, 2));
if (!FIX && (changed.length > 0 || unresolved.length > 0)) process.exitCode = 1;
