import json
import sqlite3
import pytest
from test_courses import setup_course
from test_progress import tracked, complete


def test_ties_current_manifests_and_escaping(setup_course):
    client,course,manifest=tracked(setup_course)
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        db.execute('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)',('<script>evil</script>','tie@example.test','not-a-login'))
    data=client.get('/api/leaderboards').json['members']
    assert [m['id'] for m in data]==sorted(m['id'] for m in data)
    assert '<script>evil</script>' not in client.get('/leaderboards').text
    complete(client);complete(client,'practice')
    assert client.get('/api/leaderboards').json['members'][0]['level']==2
    manifest['lessons'].append('new-lesson')
    (course/'course.json').write_text(json.dumps(manifest))
    assert all(m['level']==1 for m in client.get('/api/leaderboards').json['members'])
    manifest['lessons']=['intro'];manifest['enabled']=False
    (course/'course.json').write_text(json.dumps(manifest))
    assert all(m['completed_courses']==0 for m in client.get('/api/leaderboards').json['members'])


def test_authenticated_pages_and_navigation(setup_course):
    client, _, _ = setup_course
    assert 'href="/leaderboards"' in client.get('/').text
    response = client.get('/leaderboards')
    assert response.status_code == 200
    assert 'Level 9' in response.text
    assert '13' in response.text
    assert client.get('/exam').status_code == 200
    guest = client.application.test_client()
    assert guest.get('/leaderboards').status_code == 303
    assert guest.get('/exam').status_code == 303


def test_whole_courses_not_lessons(setup_course):
    client, course, manifest = tracked(setup_course)
    response = client.get('/api/leaderboards')
    assert response.status_code == 200
    assert response.json['members'][0]['level'] == 1
    complete(client)
    assert client.get('/api/leaderboards').json['members'][0]['completed_courses'] == 0
    complete(client, 'practice')
    member = client.get('/api/leaderboards').json['members'][0]
    assert member['completed_courses'] == 1
    assert member['level'] == 2
    assert 'email' not in member

@pytest.mark.parametrize('count,level', [(0,1),(1,2),(2,2),(3,3),(4,3),(5,4),(6,4),(7,5),(8,5),(9,6),(10,6),(11,7),(12,7),(13,8),(14,8)])
def test_exact_level_boundaries(count, level):
    import achievements
    assert achievements.level_for(count, False) == level
