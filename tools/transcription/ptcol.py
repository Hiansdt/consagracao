"""Print the right (Portuguese) column of bilingual appendix pages, line by line.
Usage: python3 -I ptcol.py PDF FIRST LAST [SPLIT_PT]
Single-column pages (no words left of the split on most lines) print whole."""
import re
import subprocess
import sys
from html import unescape

pdf, first, last = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
split = float(sys.argv[4]) if len(sys.argv) > 4 else 112
for p in range(first, last + 1):
    xml = subprocess.run(['pdftotext', '-bbox', '-f', str(p), '-l', str(p), pdf, '-'], capture_output=True, text=True).stdout
    words = [(float(a), float(b), unescape(w)) for a, b, w in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)"[^>]*>([^<]*)</word>', xml)]
    words = [w for w in words if 'alexandriacatolica' not in w[2]]
    left = [w for w in words if w[0] < split - 20]
    bilingual = len(left) > 10 and any(w[0] >= split for w in words)
    col = [w for w in words if w[0] >= split] if bilingual else words
    lines = {}
    for x, y, w in sorted(col, key=lambda t: (round(t[1] / 3), t[0])):
        lines.setdefault(round(y / 3), []).append(w)
    print(f'=== p{p} {"PT-col" if bilingual else "full"}')
    for k in sorted(lines):
        print(' '.join(lines[k]).replace('­', '-'))
