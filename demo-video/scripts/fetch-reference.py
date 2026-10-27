from pathlib import Path
import urllib.request
root=Path(__file__).resolve().parents[1]
url='https://www.remotion.dev/elements/captions/basic-captions.md'
try:
 with urllib.request.urlopen(url,timeout=25) as r: content=r.read().decode()
 (root/'.private/basic-captions-reference.md').write_text(content)
 print('Caption reference downloaded:',len(content),'characters')
except Exception as e: print('Caption reference unavailable:',type(e).__name__)
