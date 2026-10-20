"""Read-only final proof for LAB07; never opens production SQLite."""
import hashlib,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
E=ROOT/'evidence/lab07'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
before=json.loads((E/'before-hashes.json').read_text())
protected={p:h for p,h in before.items() if p.startswith(('appworks/instance/','courses/scale-lab/dist/','backups/')) or p.endswith('.pdf') or p=='appworks/.env'}
assert all((ROOT/p).is_file() and sha(ROOT/p)==h for p,h in protected.items())
manifest='courses/scale-lab/course.json'
assert sha(ROOT/manifest)==before[manifest]
old=json.loads(subprocess.check_output(['git','show','HEAD:courses/scale-lab/assessment.json'],cwd=ROOT))
new=json.loads((ROOT/'courses/scale-lab/assessment.json').read_text())
for a,b in zip(old['questions'],new['questions']):
    assert (a['id'],a['lesson_id'],a['answer'],[x['id'] for x in a['options']])==(b['id'],b['lesson_id'],b['answer'],[x['id'] for x in b['options']])
    if a['lesson_id']!='cdn':assert a==b
assert len(old['questions'])==len(new['questions'])
info=json.loads((E/'server.json').read_text());standalone=json.loads((E/'standalone.json').read_text())
builds={}
for name,directory in [('integrated',Path(info['courses_root'])/'scale-lab/dist'),('standalone',Path(standalone['dist']))]:
    files=[p for p in directory.rglob('*') if p.is_file()]
    assert files and not any(p.suffix.lower() in ('.pdf','.map','.sqlite3') or p.name=='assessment.json' for p in files)
    builds[name]={str(p.relative_to(directory)):sha(p) for p in files}
for directory in [ROOT/'courses/scale-lab/public',ROOT/'courses/scale-lab/dist']:
    assert not list(directory.rglob('*.pdf'))
pdfs=list(ROOT.glob('*.pdf'))
for p in pdfs:subprocess.run(['git','check-ignore','-q',str(p)],cwd=ROOT,check=True)
assert not subprocess.check_output(['git','ls-files','*.pdf'],cwd=ROOT).strip()
assert not subprocess.check_output(['git','diff','--cached','--name-only'],cwd=ROOT).strip()
source={str(p.relative_to(ROOT)):sha(p) for p in (ROOT/'courses/scale-lab/src').rglob('*') if p.is_file()}
report={'protectedFiles':len(protected),'protectedBytesUnchanged':True,'pdfSha256':sha(ROOT/'cdn.pdf'),'rootPDFsIgnored':len(pdfs),'manifestUnchanged':True,'assessmentIDsAndNonCDNQuestionsUnchanged':True,'historicalSnapshotsUnmodified':True,'productionDBAndBackupsByteIdentical':True,'isolatedBuilds':builds,'sourceHashes':source,'noPDFsInPublicOrBuilds':True,'stagedFiles':[],'qaProcesses':[{'pid':73962,'handle':'proc_b57598b8fbde'},{'pid':75600,'handle':'proc_dbedef034f39'},{'pid':76805,'handle':'proc_478b03ce1cab'},{'pid':78836,'handle':'proc_eb4cc755986c'}]}
(E/'preservation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ('sourceHashes','isolatedBuilds')},indent=2))
