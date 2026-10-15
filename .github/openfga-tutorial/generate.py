# Generates OPENFGA.adoc from OPENFGA.adoc.tmpl by expanding these placeholders with code from the openfga branch:
#   @@show REV PATH@@, @@diff A B PATH@@, and @@lines REV PATH :: START_REGEX :: END_REGEX@@
# REV is openfga, openfga~1, and so on, where each commit on the branch is one tutorial step.
# Usage: python3 .github/openfga-tutorial/generate.py [branch-ref], e.g. origin/openfga (default: openfga)
import os, re, subprocess, sys
here = os.path.dirname(os.path.abspath(__file__))
repo = os.path.abspath(os.path.join(here, '..', '..'))
tmpl, out = os.path.join(here, 'OPENFGA.adoc.tmpl'), os.path.join(repo, 'OPENFGA.adoc')
branch = sys.argv[1] if len(sys.argv) > 1 else 'openfga'
git = lambda *a: subprocess.run(['git', '-C', repo, *a], capture_output=True, text=True, check=True).stdout

def ref(rev):
    return branch + rev[len('openfga'):] if rev.startswith('openfga') else rev

def lines(rev, path, start, end):
    src = git('show', f'{ref(rev)}:{path}')
    m = re.search(start, src, re.M)
    if not m: sys.exit(f'start not found: {start} in {path}')
    s = src.rfind('\n', 0, m.start()) + 1
    e = re.search(end, src[m.start():], re.M)
    if not e: sys.exit(f'end not found: {end} in {path}')
    return src[s:m.start() + e.end()].rstrip('\n')

def expand(m):
    body = m.group(1)
    if body.startswith('lines'):
        head, start, end = body.split(' :: ')
        _, rev, path = head.split(' ')
        return lines(rev, path, start, end)
    kind, *args = body.split(' ')
    if kind == 'show':
        return git('show', f'{ref(args[0])}:{args[1]}').rstrip('\n')
    d = git('diff', ref(args[0]), ref(args[1]), '--', args[2])
    return re.sub(r'^index .*\n', '', d, flags=re.M).rstrip('\n')

text = re.sub(r'@@((?:show|diff|lines) (?:[^@]|@(?!@))+)@@', expand, open(tmpl).read())
open(out, 'w').write(text)
print('wrote', out)
