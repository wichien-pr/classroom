"""Read-only hashes; source PDF renders remain in private temporary storage."""
import hashlib,json,subprocess,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
out=root/'evidence/lab07';out.mkdir(parents=True,exist_ok=True)
paths=set(root.glob('*.pdf'))|set((root/'courses/scale-lab/dist').rglob('*'))|set((root/'appworks/instance').rglob('*'))|set((root/'backups').rglob('*'))|{root/'appworks/.env'}
tracked=subprocess.check_output(['git','ls-files'],cwd=root,text=True).splitlines()
paths|={root/p for p in tracked}
data={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(paths) if p.is_file()}
name=sys.argv[1] if len(sys.argv)>1 else 'before'
(out/f'{name}-hashes.json').write_text(json.dumps(data,indent=2)+'\n')
print(name,len(data))
