"""Isolated profile-photo QA: never touches production DB or uploads."""
import json
from pathlib import Path
import sys
import tempfile
from PIL import Image, ImageDraw
from waitress import serve

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'appworks'))
from app import create_app

qa = Path(tempfile.mkdtemp(prefix='profile-qa-', dir=ROOT/'evidence'))
app = create_app({'DATABASE': str(qa/'accounts.sqlite3'), 'PROFILE_UPLOAD_DIR': str(qa/'photos')})
image = Image.new('RGB', (400,400), '#1d4ed8')
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((70,60,330,320),40,fill='#fbbf24')
draw.ellipse((115,120,155,160),fill='#172554');draw.ellipse((245,120,285,160),fill='#172554')
draw.rectangle((130,210,270,235),fill='#172554');draw.text((150,350),'QA SYNTHETIC',fill='white')
image.save(qa/'synthetic.png')
(ROOT/'evidence/profile-qa-server.json').write_text(json.dumps({'database':app.config['DATABASE'],'uploads':app.config['PROFILE_UPLOAD_DIR'],'fixture':str(qa/'synthetic.png'),'url':'http://127.0.0.1:8096'},indent=2))
serve(app, host='127.0.0.1', port=8096)
