import json
import io
import sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

with open(r"E:\PROJECT 2026\AIYOUNGGURU-main\assets\data\schools.json", encoding='utf-8') as f:
    data = json.load(f)
print('Total schools:', len(data))
print()
print('Schools (short, name, city):')
for s in data:
    name = s.get("name", "?")
    name_safe = name.encode('ascii', 'replace').decode('ascii')
    print('  -', s.get("short", "?"), '|', name_safe, '|', s.get("city", "?"))
print()
print('First school keys:', list(data[0].keys()))
print()
print('First school JSON (utf-8 truncated to 3000):')
print(json.dumps(data[0], ensure_ascii=False, indent=2)[:3000])
