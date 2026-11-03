"""Empty published courses use existing generic delivery, never qualification."""
import json
from pathlib import Path
import sqlite3
from test_courses import setup_course
from test_app import token


def test_empty_course_has_no_completion_level_or_exam_credit(setup_course):
    client, course, manifest = setup_course
    # Characterization: absence of lessons opts out; no backend exception needed.
    assert 'lessons' not in manifest
    card = client.get('/').text
    assert 'href="/courses/example/"' in card
    assert '<progress ' not in card
    assert client.get('/courses/example/').status_code == 200
    csrf = token(client, '/')
    for endpoint in ('progress', 'participation'):
        url = '/api/courses/example/' + endpoint
        assert client.get(url).status_code == 404
        assert client.post(url, json={'lesson_id': 'invented'}, headers={'X-CSRF-Token': csrf}).status_code == 404
    exam = client.get('/api/exam').json
    assert exam['completed_courses'] == 0
    assert exam['eligible'] is False
    assert exam['attempt'] is None
    assert client.post('/api/exam', json={}, headers={'X-CSRF-Token': csrf}).status_code == 403
    member = client.get('/api/leaderboards').json['members'][0]
    assert member['level'] == 1 and member['completed_courses'] == 0
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        for table in ('lesson_progress', 'lesson_manual_completion', 'participation_awards_v2', 'exam_attempts', 'level_achievements'):
            assert db.execute(f'SELECT count(*) FROM {table}').fetchone()[0] == 0


def test_framework_manifest_has_source_grounded_curriculum():
    root = Path(__file__).resolve().parents[2]
    path = root / 'courses/framework-for-system-design-interview'
    manifest = json.loads((path / 'course.json').read_text())
    assert manifest['enabled'] is True
    assert manifest['title'] == 'A Framework For System Design Interviews'
    assert manifest['lessons'] == ['framework-scope']
    assert manifest['completion_requirements'] == ['manual', 'simulation', 'thinking']
    assert (path / 'assessment.json').exists()
