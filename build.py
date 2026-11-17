#!/usr/bin/env python3
"""Baut aus den Quelldateien eine einzige HTML-Datei (parliamo.html), die ohne weitere Dateien läuft."""
import re, sys, pathlib

root = pathlib.Path(__file__).parent
css = (root / 'css/style.css').read_text(encoding='utf-8')
js = ''
for name in ['data', 'store', 'exercises', 'ai', 'app']:
    src = (root / f'js/{name}.js').read_text(encoding='utf-8')
    src = re.sub(r'^import .*?;\n', '', src, flags=re.M)
    src = re.sub(r'^export (?=(const|function|async function|let) )', '', src, flags=re.M)
    assert 'export ' not in re.sub(r'//.*', '', src).replace('export:', '').replace("'export'", ''), name
    js += f'\n// ---- {name}.js ----\n{src}'

page = f'''<title>Parliamo</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
{css}</style>
<div id="app"></div>
<script>
(() => {{
'use strict';
{js}
}})();
</script>
'''
full = f'''<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Parliamo!">
<style>:root{{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}}body{{margin:0}}</style>
</head>
<body>
{page}</body>
</html>
'''
(root / 'parliamo.html').write_text(full, encoding='utf-8')
if len(sys.argv) > 1:
    pathlib.Path(sys.argv[1]).write_text(page, encoding='utf-8')
print('ok', len(full) // 1024, 'KB')
