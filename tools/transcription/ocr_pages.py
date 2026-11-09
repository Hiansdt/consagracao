"""Draft OCR text for a page range of the 1943 scan, plus page montages.

Usage: python3 -I ocr_pages.py PDF FIRST LAST OUTDIR [--crop-right]

Writes OUTDIR/draft.txt (body paragraphs, then footnotes per page) and
OUTDIR/m-<first>.png montages of 3 pages each for visual proofreading.
"""
import re
import subprocess
import sys
from pathlib import Path

pdf, first, last, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), Path(sys.argv[4])
crop_right = '--crop-right' in sys.argv
out.mkdir(parents=True, exist_ok=True)

body, notes = [], []
for p in range(first, last + 1):
    args = ['pdftotext', '-raw', '-f', str(p), '-l', str(p)]
    if crop_right:
        # bilingual appendix pages: Portuguese is the right column
        args += ['-x', '112', '-y', '0', '-W', '113', '-H', '352', '-r', '72']
    txt = subprocess.run(args + [pdf, '-'], capture_output=True, text=True).stdout
    lines = [l.rstrip() for l in txt.replace(chr(0xad), '-').splitlines()]
    lines = [l for l in lines if l.strip() and 'alexandriacatolica' not in l and not re.fullmatch(r'\s*\d{1,3}\s*', l)]
    in_note = False
    for l in lines:
        if re.match(r'^\s*\d{1,2}\)\s', l):
            in_note = True
            notes.append(f'[p{p}] ' + l.strip())
        elif in_note:
            notes[-1] += ' ' + l.strip()
        else:
            body.append(l.strip())
    body.append(f'<<p{p}>>')

text = ''
for l in body:
    if l.startswith('<<'):
        text += f' {l} '
    elif re.match(r'^\d{1,3}\.\s', l) and text:
        text += '\n\n' + l
    elif text.endswith('-') and not text.endswith(' -'):
        text = text[:-1] + '{-}' + l
    else:
        text += ' ' + l
(out / 'draft.txt').write_text(text.strip() + '\n\nNOTAS\n' + '\n'.join(notes) + '\n')

for start in range(first, last + 1, 3):
    end = min(start + 2, last)
    subprocess.run(['pdftoppm', '-f', str(start), '-l', str(end), '-r', '150', '-png', pdf, str(out / 'pg')], check=True)
    imgs = sorted(out.glob('pg-*.png'))
    subprocess.run(['montage', *map(str, imgs), '-tile', 'x1', '-geometry', '+8+0', str(out / f'm-{start:03d}.png')], check=True)
    for i in imgs:
        i.unlink()
print(out / 'draft.txt')
