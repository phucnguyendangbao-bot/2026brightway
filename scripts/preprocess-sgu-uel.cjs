// preprocess-sgu-uel.cjs — Cắt logo SGU/UEL về 512x512 vuông
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const items = [
  { src: 'assets/images/logos/sgu.png', out: 'assets/images/logos/sgu.png', desc: 'SGU' },
  { src: 'assets/images/logos/uel.png', out: 'assets/images/logos/uel.png', desc: 'UEL' }
];

for (const it of items) {
  const tmpFile = it.src + '.original';
  if (!fs.existsSync(tmpFile)) {
    fs.copyFileSync(it.src, tmpFile);
    console.log(`Backup ${it.desc} → original`);
  }
}

// Check Python PIL
try {
  const out = execSync('python -c "from PIL import Image; print(\'OK\')" 2>&1').toString();
  console.log('Python PIL:', out.trim());
} catch (e) {
  console.log('Python PIL not available, trying py...');
  const out2 = execSync('py -c "from PIL import Image; print(\'OK\')" 2>&1').toString();
  console.log('py PIL:', out2.trim());
}

const script = `
from PIL import Image
import os

def crop_center(src_path, dst_path, target=512):
    img = Image.open(src_path)
    w, h = img.size
    # If too small, resize up while preserving aspect
    if w < target or h < target:
        ratio = max(target/w, target/h)
        new_w = int(w*ratio)
        new_h = int(h*ratio)
        img = img.resize((new_w, new_h), Image.LANCZOS)
        w, h = img.size
    # Center crop
    left = (w - target) // 2
    top = (h - target) // 2
    right = left + target
    bottom = top + target
    img = img.crop((left, top, right, bottom))
    # If has alpha, keep it. Convert to RGBA to be sure.
    img = img.convert('RGBA')
    img.save(dst_path, 'PNG')
    print(f"{os.path.basename(src_path)}: {w}x{h} -> 512x512")

for f in ['sgu.png', 'uel.png']:
    src = os.path.join('assets', 'images', 'logos', f)
    crop_center(src, src, 512)
print('Done.')
`;

const tmpScript = path.join(process.cwd(), '_tmp_crop.py');
fs.writeFileSync(tmpScript, script);
try {
  execSync(`py "${tmpScript}"`, { stdio: 'inherit' });
} catch (e) {
  try {
    execSync(`python "${tmpScript}"`, { stdio: 'inherit' });
  } catch (e2) {
    console.error('Python PIL not available:', e2.message);
  }
}
fs.unlinkSync(tmpScript);

// Clean up original backup
for (const it of items) {
  const tmpFile = it.src + '.original';
  if (fs.existsSync(tmpFile)) {
    fs.unlinkSync(tmpFile);
    console.log(`Cleaned backup: ${path.basename(tmpFile)}`);
  }
}