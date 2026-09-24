#!/usr/bin/env python3
"""Replace #home-view content in index.html with new clean content."""
import re
from pathlib import Path

ROOT = Path(r"e:\PROJECT 2026\AIYOUNGGURU-main")
INDEX = ROOT / "index.html"
NEW = ROOT / "_home_content.html"

# Đọc file
html = INDEX.read_text(encoding="utf-8")
new_content = NEW.read_text(encoding="utf-8").strip()

# Pattern: từ <div id="home-view"> đến </div><!-- /#home-view -->
# Dùng non-greedy và DOTALL
pattern = re.compile(
    r'(<div id="home-view">)(.*?)(</div><!-- /#home-view -->)',
    re.DOTALL
)

m = pattern.search(html)
if not m:
    print("ERROR: Không tìm thấy #home-view block")
    exit(1)

print(f"Old block: lines {html[:m.start()].count(chr(10))+1} to {html[:m.end()].count(chr(10))+1}")
print(f"Old length: {len(m.group(2))} chars")
print(f"New content length: {len(new_content)} chars")

# Thay
new_html = pattern.sub(lambda mo: mo.group(1) + "\n" + new_content + "\n" + mo.group(3), html)

INDEX.write_text(new_html, encoding="utf-8")
print(f"Wrote {INDEX}, new size: {len(new_html)} chars")
