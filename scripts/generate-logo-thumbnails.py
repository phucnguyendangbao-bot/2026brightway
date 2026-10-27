"""Generate small WebP variants for raster logos shown at 60 CSS pixels.

Requires Pillow. Originals stay in place as fallbacks; Vercel serves the
generated assets directly, so Python is not needed at runtime.
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "images" / "logos"
TARGET = SOURCE / "thumbs"
TARGET.mkdir(exist_ok=True)

count = original_bytes = optimized_bytes = 0
for source in sorted(SOURCE.iterdir()):
    if source.suffix.lower() not in {".png", ".jpg", ".jpeg"}:
        continue
    target = TARGET / f"{source.stem}-{source.suffix[1:].lower()}.webp"
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened)
        image = image.convert("RGBA" if "A" in image.getbands() or "transparency" in image.info else "RGB")
        image.thumbnail((120, 120), Image.Resampling.LANCZOS)
        image.save(target, "WEBP", quality=88, method=6)
    count += 1
    original_bytes += source.stat().st_size
    optimized_bytes += target.stat().st_size

print(f"{count} logos: {original_bytes:,} -> {optimized_bytes:,} bytes")

brand = ROOT / "assets" / "images" / "brand" / "brightway-mark.png"
brand_small = brand.with_name("brightway-mark-96.webp")
with Image.open(brand) as opened:
    image = opened.convert("RGBA")
    image.thumbnail((96, 96), Image.Resampling.LANCZOS)
    image.save(brand_small, "WEBP", quality=90, method=6)
print(f"Brand mark: {brand.stat().st_size:,} -> {brand_small.stat().st_size:,} bytes")
