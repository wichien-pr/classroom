from pathlib import Path
import re


def test_class_labels_are_thai_across_live_templates():
    templates = Path(__file__).resolve().parents[1] / 'templates'
    remaining = [p.name for p in templates.glob('*.html') if re.search(r'\b(?:CLASS|Class)\b', p.read_text())]
    assert remaining == [], f'Untranslated visible class labels: {remaining}'
    for name in ('leaderboards.html', 'profile-card.html', 'exam.html'):
        assert 'คลาส' in (templates / name).read_text()
