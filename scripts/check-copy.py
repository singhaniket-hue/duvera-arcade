"""Check every shipped page with pinned SlopMonster, plus unfinished-content guards."""
from pathlib import Path
import re
import subprocess
import sys
root = Path(__file__).resolve().parent.parent
pages = [root / name for name in ('index.html', 'play.html', 'credits.html', '404.html')]
pages += sorted((root / 'creators/moosher').glob('*.html'))
pages += sorted((root / 'games').glob('*/index.html'))
failed = []
for page in pages:
    result = subprocess.run([sys.executable, str(root / 'scripts/vendor/slopmonster/deslop.py'), str(page), '--allow-proof'], capture_output=True, text=True, encoding='utf-8')
    source = page.read_text(encoding='utf-8')
    unfinished = re.search(r'(?i)lorem ipsum|coming soon|under construction|\[needs (?:number|source)\]|href=[\"\x27]#(?:[\"\x27])|\splaceholder=', source)
    if result.returncode or unfinished:
        failed.append(str(page.relative_to(root)))
        print(result.stdout, result.stderr, 'Unfinished marker:', unfinished.group() if unfinished else 'none')
    else:
        print('PASS', page.relative_to(root), '5/5; no unfinished markers')
if failed:
    raise SystemExit('Copy check failed: ' + ', '.join(failed))
print(f'{len(pages)} public pages passed.')
