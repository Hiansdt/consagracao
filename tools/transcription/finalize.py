"""Join a fixed body with handwritten notes into the app's text format.
Usage: python3 -I finalize.py OUT_TXT NOTES_TXT FINAL"""
import sys
body = open(sys.argv[1]).read().partition('\nNOTAS\n')[0].strip()
notes = open(sys.argv[2]).read().strip() if sys.argv[2] != '-' else ''
open(sys.argv[3], 'w').write(body + ('\n\n---\n' + notes if notes else '') + '\n')
