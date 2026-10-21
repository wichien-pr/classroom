"""Build isolated variants only, record hashes and enforce publishing boundary."""
import hashlib,json,os,subprocess,tempfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
evidence=root/'evidence/lab08'
info=json.loads((evidence/'owned/server.json').read_text())
standalone=Path(tempfile.mkdtemp(prefix='classroom-lab08-standalone-'))/'dist'
outputs={'standalone':standalone,'integrated':Path(info['courses_root'])/'scale-lab/dist'}
reports={}
for variant,out in outputs.items():
    env={**os.environ,'PATH':'/usr/local/bin:'+os.environ['PATH'],'VITE_CLASSROOM_URL':'','VITE_CLASSROOM_PROGRESS_URL':''}
    if variant=='integrated':env.update(VITE_CLASSROOM_URL='/',VITE_CLASSROOM_PROGRESS_URL='/api/courses/scale-lab/progress')
    assert not out.resolve().is_relative_to(root)
    cmd=['npm','run','build','--','--emptyOutDir','--base','/courses/scale-lab/' if variant=='integrated' else '/','--outDir',str(out)]
    with (evidence/f'build-{variant}.txt').open('w') as log:subprocess.run(cmd,cwd=root/'courses/scale-lab',env=env,stdout=log,stderr=subprocess.STDOUT,check=True)
    files=[p for p in out.rglob('*') if p.is_file()]
    assert not any(p.suffix in ['.pdf','.sqlite3','.map'] or p.name=='assessment.json' for p in files)
    reports[variant]={str(p.relative_to(out)):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
(evidence/'standalone.json').write_text(json.dumps({'dist':str(standalone)}))
(evidence/'build-hashes.json').write_text(json.dumps(reports,indent=2)+'\n')
print({k:len(v) for k,v in reports.items()})
