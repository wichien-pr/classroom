"""Offline text extraction only; never loads saved scripts or remote URLs."""
from html.parser import HTMLParser
from pathlib import Path
import hashlib, json
ROOT=Path(__file__).resolve().parents[1]
class Extract(HTMLParser):
    def __init__(self):
        super().__init__(); self.skip=0; self.parts=[]; self.images=[]
    def handle_starttag(self,tag,attrs):
        if tag in ('script','style','nav'): self.skip+=1
        if tag=='img' and not self.skip:self.images.append(dict(attrs))
        if tag in ('p','h1','h2','h3','li','tr','div'):self.parts.append('\n')
    def handle_endtag(self,tag):
        if tag in ('script','style','nav'):self.skip=max(0,self.skip-1)
    def handle_data(self,data):
        if not self.skip:self.parts.append(data)
p=ROOT/'Back-of-the-envelope-Estimation.html'; x=Extract();x.feed(p.read_text())
out=ROOT/'evidence/estimation';out.mkdir(parents=True,exist_ok=True)
text='\n'.join(line.strip() for line in ''.join(x.parts).splitlines() if line.strip())
(out/'source-text.txt').write_text(text)
start=text.index('In a system design interview, sometimes you are asked to estimate')
end=text.index('Reference materials',start)
(out/'article-only.txt').write_text(text[start:end].strip()+'\n')
(out/'source-inventory.json').write_text(json.dumps({'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'images':x.images},indent=2))
print(out/'source-text.txt')
