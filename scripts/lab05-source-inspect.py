"""Local source review only; never copies source PDF into course assets."""
from pathlib import Path
import hashlib
import json
import pymupdf as fitz
root = Path(__file__).resolve().parents[1]
out = root / 'evidence/lab05/source'
out.mkdir(parents=True, exist_ok=True)
source = root / 'Database-Replication.pdf'
doc = fitz.open(source)
texts = []
for i, page in enumerate(doc, 1):
    texts.append(f'PAGE {i}\n{page.get_text()}')
    page.get_pixmap(matrix=fitz.Matrix(1.4, 1.4)).save(out / f'page-{i}.png')
(out / 'text.txt').write_text('\n\n'.join(texts))
print(json.dumps({'pages': len(doc), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'evidence': str(out)}))
