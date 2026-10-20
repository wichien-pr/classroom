from pathlib import Path
import subprocess,json,datetime,hashlib,socket
root=Path(__file__).resolve().parents[1]
output=[f'Verification UTC: {datetime.datetime.now(datetime.timezone.utc).isoformat()}\n']
failed=False
for command in [['npm','test'],['npm','run','test:e2e'],['npm','run','build']]:
    result=subprocess.run(command,cwd=root,capture_output=True,text=True)
    text=f"\n$ {' '.join(command)}\n{result.stdout}{result.stderr}\nEXIT {result.returncode}\n"
    print(text);output.append(text);failed=failed or result.returncode!=0
source=(root.parent/'TEAM_TRAINING_TH.md').read_bytes()
copy=(root/'public/TEAM_TRAINING_TH.md').read_bytes()
built=(root/'dist/TEAM_TRAINING_TH.md').read_bytes()
equal=source==copy==built
output.append(f'\nSource/public/dist byte equality: {equal}\nSource SHA256: {hashlib.sha256(source).hexdigest()}\n')
failed=failed or not equal
report=json.loads((root/'evidence/browser-results.json').read_text())
output.append('Browser stats: '+json.dumps(report['stats'],ensure_ascii=False)+'\n')
with socket.socket() as s:
    listening=s.connect_ex(('127.0.0.1',4175))==0
output.append(f'Playwright temporary server still listening on 4175: {listening}\n')
failed=failed or listening
(root/'evidence/verification.txt').write_text(''.join(output))
print(''.join(output[-4:]))
raise SystemExit(1 if failed else 0)
