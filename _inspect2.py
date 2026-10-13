import json
import io
import sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

with open(r"E:\PROJECT 2026\AIYOUNGGURU-main\assets\data\schools.json", encoding='utf-8') as f:
    data = json.load(f)

# Show HCMUT cutoffScores
hcmut = data[0]
print('=== HCMUT cutoffScores ===')
print(json.dumps(hcmut.get('cutoffScores', {}), ensure_ascii=False, indent=2)[:3000])
print()
print('=== HCMUT fields (count) ===')
fields = hcmut.get('fields', [])
print('Total fields:', len(fields))
if fields:
    print('First field:', json.dumps(fields[0], ensure_ascii=False, indent=2)[:1500])
