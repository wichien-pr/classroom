import json
import pytest
from test_app import register, token

@pytest.fixture
def setup_course(tmp_path):
    root = tmp_path / 'courses'
    course = root / 'example'
    (course / 'dist' / 'assets').mkdir(parents=True)
    (course / 'dist' / 'index.html').write_text('<h1>Actual course</h1>')
    (course / 'dist' / 'assets' / 'main.js').write_text('console.log("course")')
    manifest = dict(id='example', title='Example', subtitle='TEST', enabled=True, order=1, delivery='static', build_dir='dist', entry='index.html')
    (course / 'course.json').write_text(json.dumps(manifest))
    from app import create_app
    app = create_app({'TESTING': True, 'DATABASE': str(tmp_path / 'test.db'), 'COURSES_ROOT': str(root)})
    client = app.test_client()
    register(client)
    client.post('/login', data={'csrf_token': token(client, '/login'), 'email': 'learner@example.com', 'password': 'correct horse battery'})
    return client, course, manifest


def test_discovered_course_card_and_authenticated_build(setup_course):
    client, course, manifest = setup_course
    page = client.get('/')
    assert '/courses/example/' in page.text
    assert 'Example' in page.text
    assert 'appworks-progress' not in page.text
    assert client.get('/courses/example/').text == '<h1>Actual course</h1>'
    assert client.get('/courses/example/assets/main.js').mimetype in ('text/javascript', 'application/javascript')
    guest = client.application.test_client()
    for path in ('/courses/example/', '/courses/example/assets/main.js'):
        response = guest.get(path)
        assert response.status_code == 303
        assert response.location == '/login'


@pytest.mark.parametrize('change', [
    {'enabled': False}, {'enabled': 'yes'}, {'id': '../escape'}, {'id': 'UPPER'},
    {'delivery': 'server'}, {'build_dir': '..'}, {'build_dir': '.'},
    {'build_dir': '/tmp'}, {'entry': '../app.py'}, {'order': 'one'},
    {'title': ''}, {'subtitle': 5}, {'id': 'different'},
])
def test_invalid_or_disabled_courses_fail_closed(setup_course, change):
    client, course, manifest = setup_course
    manifest.update(change)
    (course / 'course.json').write_text(json.dumps(manifest))
    assert '/courses/example/' not in client.get('/').text
    assert client.get('/courses/example/').status_code == 404


def test_malformed_manifest_does_not_break_classroom(setup_course):
    client, course, _ = setup_course
    (course / 'course.json').write_text('{broken')
    assert client.get('/').status_code == 200
    assert client.get('/courses/example/').status_code == 404


@pytest.mark.parametrize('escape', ['file', 'build', 'manifest', 'course'])
def test_symlink_escape_rejected(setup_course, tmp_path, escape):
    client, course, _ = setup_course
    outside = tmp_path / 'secret'
    outside.write_text('secret')
    if escape == 'file':
        (course / 'dist' / 'secret.txt').symlink_to(outside)
        path = '/courses/example/secret.txt'
    elif escape == 'build':
        import shutil
        shutil.rmtree(course / 'dist')
        (course / 'dist').symlink_to(tmp_path, target_is_directory=True)
        path = '/courses/example/secret'
    elif escape == 'manifest':
        outside.write_text((course / 'course.json').read_text())
        (course / 'course.json').unlink()
        (course / 'course.json').symlink_to(outside)
        path = '/courses/example/'
    else:
        target = tmp_path / 'external'
        course.rename(target)
        course.symlink_to(target, target_is_directory=True)
        path = '/courses/example/'
    assert client.get(path).status_code == 404


@pytest.mark.parametrize('path', ['../course.json', '%2e%2e/course.json', 'course.json', 'src/main.js', '.env', 'assets/missing.js', 'x/../../app.py'])
def test_source_traversal_missing_assets_not_served(setup_course, path):
    client, _, _ = setup_course
    assert client.get('/courses/example/' + path).status_code == 404


def test_direct_deep_route_serves_entry(setup_course):
    client, _, _ = setup_course
    assert client.get('/courses/example/labs/replication').text == '<h1>Actual course</h1>'


def test_validation_command():
    import subprocess
    import sys
    from pathlib import Path
    root = Path(__file__).resolve().parents[2]
    result = subprocess.run([sys.executable, str(root / 'scripts/courses.py'), 'validate'], capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    assert 'scale-lab' in result.stdout


def test_duplicate_id_cannot_shadow_valid_course(setup_course):
    import shutil
    client, course, _ = setup_course
    shutil.copytree(course, course.parent / 'duplicate')
    page = client.get('/').text
    assert page.count('href="/courses/example/"') == 1
    assert client.get('/courses/duplicate/').status_code == 404
    from course_registry import discover_courses
    with pytest.raises(ValueError, match='id must be unique'):
        discover_courses(course.parent, strict=True)


def test_missing_build_hidden(setup_course):
    client, course, _ = setup_course
    (course / 'dist/index.html').unlink()
    assert '/courses/example/' not in client.get('/').text
    assert client.get('/courses/example/').status_code == 404


def test_manifest_text_is_escaped(setup_course):
    client, course, manifest = setup_course
    manifest['title'] = '<script>alert(1)</script>'
    (course / 'course.json').write_text(json.dumps(manifest))
    assert '<script>alert(1)</script>' not in client.get('/').text
