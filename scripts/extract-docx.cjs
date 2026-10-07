// extract-docx.cjs - Read .docx and extract text using pure Node
const fs = require('fs');
const zlib = require('zlib');

const file = process.argv[2];
if (!file) { console.error('Usage: node extract-docx.cjs <file>'); process.exit(1); }

// .docx is a zip. We need to read the central directory and find word/document.xml
const buf = fs.readFileSync(file);

// Quick zip parser: scan for "PK\x03\x04" local file headers
const findEndOfCentralDir = (buf) => {
  // Search from end backwards for EOCD signature 0x06054b50
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) return i;
  }
  return -1;
};
const eocdOffset = findEndOfCentralDir(buf);
if (eocdOffset < 0) { console.error('Not a valid zip'); process.exit(1); }
const cdSize = buf.readUInt32LE(eocdOffset + 12);
const cdOffset = buf.readUInt32LE(eocdOffset + 16);

// Walk central directory entries to find "word/document.xml"
let entry = cdOffset;
let foundOffset = -1, foundSize = -1, foundCompressed = -1, foundMethod = -1;
while (entry < cdOffset + cdSize) {
  if (buf.readUInt32LE(entry) !== 0x02014b50) break;
  const compMethod = buf.readUInt16LE(entry + 10);
  const compSize = buf.readUInt32LE(entry + 20);
  const uncompSize = buf.readUInt32LE(entry + 24);
  const nameLen = buf.readUInt16LE(entry + 28);
  const extraLen = buf.readUInt16LE(entry + 30);
  const commentLen = buf.readUInt16LE(entry + 32);
  const localOffset = buf.readUInt32LE(entry + 42);
  const name = buf.slice(entry + 46, entry + 46 + nameLen).toString('utf8');
  if (name === 'word/document.xml') {
    foundOffset = localOffset;
    foundSize = uncompSize;
    foundCompressed = compSize;
    foundMethod = compMethod;
    break;
  }
  entry += 46 + nameLen + extraLen + commentLen;
}

if (foundOffset < 0) { console.error('word/document.xml not found'); process.exit(1); }

// Read local file header
let p = foundOffset;
if (buf.readUInt32LE(p) !== 0x04034b50) { console.error('Bad local header'); process.exit(1); }
const lNameLen = buf.readUInt16LE(p + 26);
const lExtraLen = buf.readUInt16LE(p + 28);
p += 30 + lNameLen + lExtraLen;
const compressed = buf.slice(p, p + foundCompressed);
let data;
if (foundMethod === 0) {
  data = compressed;
} else if (foundMethod === 8) {
  data = zlib.inflateRawSync(compressed);
} else {
  console.error('Unsupported compression method:', foundMethod);
  process.exit(1);
}

const xml = data.toString('utf8');
// Extract w:t text nodes
const out = xml.replace(/<w:p\b[^>]*>/g, '\n<w:p>')  // preserve paragraph breaks
  .replace(/<\/w:p>/g, '\n')
  .replace(/<w:tab\/>/g, '\t')
  .replace(/<w:br\/>/g, '\n')
  .replace(/<w:t[^>]*>/g, '')
  .replace(/<\/w:t>/g, '')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/\n{3,}/g, '\n\n')
  .trim();
console.log(out);