"""Apply mechanical OCR cleanups + a list of proofread replacements.

Usage: python3 -I fix.py DRAFT FIXES OUT
FIXES is a text file of lines `wrong => right` (exact substrings, applied in
order, each must match at least once). Lines starting with # are comments.
"""
import re
import sys

draft, fixes, out = sys.argv[1:4]
t = open(draft).read()
body, _, notes_part = t.partition('\nNOTAS\n')
t = body
# optional START / END markers: keep from START up to (not including) END
if len(sys.argv) > 4:
    t = t[t.index(sys.argv[4]):]
if len(sys.argv) > 5:
    t = t[:t.index(sys.argv[5])]
t = t + '\n\nNOTAS\n' + notes_part
# page markers from ocr_pages.py
t = re.sub(r'\s*<<p\d+>>\s*', ' ', t)
# the print sets parenthetical dashes as em dashes; OCR reads them as - or --
t = re.sub(r' -{1,2} ', ' — ', t)
t = re.sub(r'(?<=[ (])-{1,2}(?=\S)', '— ', t) if False else t
t = re.sub(r'[ \t]+', ' ', t)
t = re.sub(r' ([,;:.!?)])', r'\1', t)  # OCR spaces before punctuation
t = t.replace('( ', '(')
# The OCR's dictionary adds modern accents the 1943 print does not have
# (the print sets -avel/-ivel, facil, dificil without accent).
t = re.sub(r'([íáúó])(ve(?:l|is))\b', lambda m: {'í': 'i', 'á': 'a', 'ú': 'u', 'ó': 'o'}[m.group(1)] + m.group(2), t)
t = re.sub(r'\b([Dd])ifícil', r'\1ificil', t)
if re.search(r'\baqui\b', t):
    print('CHECK aqui/aquí:', len(re.findall(r'\baqui\b', t)))

CLITICS = {'se','lhe','lhes','o','a','os','as','lo','la','los','las','no','na','nos','vos','me','te','mo','ma','lha','lho','vo-lo','no-lo'}
joins = []
import json, os
CORPUS = json.load(open(os.environ.get('CORPUS', '/dev/null'))) if os.environ.get('CORPUS') else {}
def join(m):
    left, right = m.group(1), m.group(2)
    whole, hyph = (left + right).lower(), (left + '-' + right).lower()
    if hyph in CORPUS and whole not in CORPUS:
        keep, tag = True, 'KEEP '
    elif whole in CORPUS:
        keep, tag = False, ''
    else:
        keep = right.lower() in CLITICS
        tag = '?KEEP ' if keep else '?JOIN '
    joins.append(tag + left + '|' + right)
    return left + ('-' if keep else '') + right
t = re.sub(r'(\w+)\{-\}(\w+)', join, t)
missing = []
for line in open(fixes):
    line = line.rstrip('\n')
    if not line.strip() or line.startswith('#'):
        continue
    wrong, right = line.split(' => ', 1)
    right = right.replace('\\n', '\n')
    if wrong == '@END':
        # cut the body at this (post-fix) marker, keep the notes section
        body, _, rest = t.partition('\n\nNOTAS\n')
        if right not in body:
            missing.append('@END ' + right)
            continue
        t = body[:body.index(right)] + '\n\nNOTAS\n' + rest
        continue
    if wrong not in t:
        missing.append(wrong)
    t = t.replace(wrong, right)
open(out, 'w').write(t)
open(out + '.joins', 'w').write('  '.join(joins))
if missing:
    print('NOT FOUND:', *missing, sep='\n  ')
    sys.exit(1)
