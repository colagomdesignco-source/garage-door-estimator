#!/usr/bin/env bash
# DEPLOY — heykayandco.com shelf.html: YouTube card + "more." entry + soc pill reorder.
# Touches /opt/heykayandco/shelf.html ONLY. Gates fail => backup restored, exit 1.
set -euo pipefail

LIVE=/opt/heykayandco/shelf.html
BKDIR=/opt/heykayandco/_backup/$(date +%Y-%m-%d)
BK="$BKDIR/shelf.html.pre-youtube"

echo "=== 0. Anchors (read-only) ==="
grep -n 'class="disc"' "$LIVE"
grep -n '<div class="tick"' "$LIVE"
grep -n -A3 '<div class="more">' "$LIVE"

PILLS_BEFORE=$(grep -c 'class="pill' "$LIVE")
echo "pill count before: $PILLS_BEFORE"

mkdir -p "$BKDIR"
cp -a "$LIVE" "$BK"
echo "backup: $BK"

restore() { echo "GATE FAILED — restoring backup"; cp -a "$BK" "$LIVE"; exit 1; }

echo "=== 1-4. Edits ==="
python3 - "$LIVE" <<'PYEOF' || restore
import sys, re
p = sys.argv[1]
s = open(p, encoding='utf-8').read()

CSS = """
.watch{display:flex;align-items:center;gap:12px;background:var(--ink);color:var(--paper);border-radius:18px;padding:12px 16px;margin:0 0 12px;box-shadow:var(--sh);transition:transform .15s}
.watch:hover{transform:translateY(-1px)}
.watch .play{flex:none;width:38px;height:38px;border-radius:50%;background:var(--gold);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;padding-left:3px}
.watch .wt{flex:1;min-width:0}
.watch .wt b{display:block;font-family:var(--serif);font-weight:400;font-size:18px;line-height:1.15}
.watch .wt small{display:block;font-size:12.5px;opacity:.8;line-height:1.35;margin-top:2px}
.watch i{flex:none;font-style:normal;font-size:12px;font-weight:600;color:var(--gold);white-space:nowrap}
"""

CARD = '''<a class="watch" href="https://www.youtube.com/@HeyKayandCo/videos" target="_blank" rel="noopener" data-umami-event="shelf-youtube">
  <span class="play">▶</span>
  <span class="wt"><b>The full-length videos</b><small>logical fallacies, day 5 hair, and how we run our house</small></span>
  <i>YouTube →</i>
</a>
'''

MORE_A = '    <a href="https://www.youtube.com/@HeyKayandCo/videos" target="_blank" rel="noopener" data-umami-event="shelf-more-youtube">Watch on YouTube <span>the long versions of every video</span></a>\n'

# 1. CSS after the existing .disc a{...} rule
m = re.search(r'\.disc a\{[^}]*\}', s)
assert m, "anchor .disc a{...} not found"
s = s[:m.end()] + CSS.rstrip('\n') + s[m.end():]

# 2. Card after <p class="disc">...</p>, before <div class="tick"
m = re.search(r'<p class="disc">.*?</p>\s*', s, re.S)
assert m, 'anchor <p class="disc">...</p> not found'
tick = s.find('<div class="tick"', m.end())
assert tick != -1, 'anchor <div class="tick" not found after disc'
assert s[m.end():tick].strip() == '', 'unexpected content between disc and tick - check markup'
s = s[:m.end()] + CARD + s[m.end():]

# 3. First <a> inside <div class="more">
m = re.search(r'(<div class="more">\s*)', s)
assert m, 'anchor <div class="more"> not found'
s = s[:m.end()] + MORE_A + s[m.end():]

# 4. Move YouTube pill first in <div class="soc">
m = re.search(r'<div class="soc">(.*?)</div>', s, re.S)
assert m, 'anchor <div class="soc"> not found'
soc = m.group(1)
anchors = re.findall(r'<a\b.*?</a>', soc, re.S)
yt = [a for a in anchors if 'youtube' in a.lower()]
assert len(yt) == 1, f"expected exactly 1 YouTube pill in .soc, found {len(yt)}"
if anchors[0] is not yt[0]:
    soc_new = soc.replace(yt[0], '', 1)
    first = re.search(r'<a\b.*?</a>', soc_new, re.S)
    soc_new = soc_new[:first.start()] + yt[0] + '\n      ' + soc_new[first.start():]
    # tidy double blank lines left by the cut
    soc_new = re.sub(r'\n[ \t]*\n', '\n', soc_new)
    s = s[:m.start(1)] + soc_new + s[m.end(1):]

open(p, 'w', encoding='utf-8').write(s)
print("edits applied")
PYEOF

echo "=== 5. Gates ==="
[ "$(grep -c 'class="watch"' "$LIVE")" = 1 ] || restore
[ "$(grep -c 'shelf-youtube' "$LIVE")" = 2 ] || restore   # shelf-more-youtube contains shelf-youtube as substring
[ "$(grep -c 'data-umami-event="shelf-youtube"' "$LIVE")" = 1 ] || restore
[ "$(grep -c 'shelf-more-youtube' "$LIVE")" = 1 ] || restore
[ "$(grep -c '@HeyKayandCo/videos' "$LIVE")" = 2 ] || restore
[ "$(grep -c 'class="pill' "$LIVE")" = "$PILLS_BEFORE" ] || restore
[ "$(grep -c 'data-website-id' "$LIVE")" = 1 ] || restore

# JSON-LD blocks parse
python3 - "$LIVE" <<'PYEOF' || restore
import sys, re, json
s = open(sys.argv[1], encoding='utf-8').read()
blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S)
for i, b in enumerate(blocks):
    json.loads(b)
print(f"JSON-LD ok ({len(blocks)} block(s))")
PYEOF

# inline scripts parse
python3 - "$LIVE" <<'PYEOF' || restore
import sys, re, subprocess, tempfile, os
s = open(sys.argv[1], encoding='utf-8').read()
scripts = re.findall(r'<script(?![^>]*\bsrc=)([^>]*)>(.*?)</script>', s, re.S)
n = 0
for attrs, body in scripts:
    if 'ld+json' in attrs or not body.strip():
        continue
    n += 1
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False) as f:
        f.write(body); tmp = f.name
    r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True)
    os.unlink(tmp)
    if r.returncode != 0:
        print(r.stderr); sys.exit(1)
print(f"inline scripts ok ({n} checked)")
PYEOF

echo "=== 6. Reload + verify ==="
nginx -t && systemctl reload nginx
curl -sS -I https://heykayandco.com/shelf.html | head -1

echo "=== Diff vs backup ==="
diff -u "$BK" "$LIVE" || true

echo
echo "DONE. Manual check at 390px (phone / devtools): .watch card sits between the"
echo "disclosure line and the ticker, renders as one row, no horizontal scroll."
