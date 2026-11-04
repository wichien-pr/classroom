"""Integrated theme delivery uses authenticated HTML, never mutates built files."""
from test_app import app, client
from test_community import login
from course_registry import discover_courses
import pytest


def test_all_enabled_courses_receive_early_shared_theme(app, client):
    login(client)
    courses = discover_courses(app.config['COURSES_ROOT'], strict=True)
    assert courses
    for course in courses:
        entry = course['build_path'] / course['entry']
        before = entry.read_bytes()
        response = client.get('/courses/' + course['id'] + '/')
        assert response.status_code == 200
        html = response.text
        assert html.count('data-theme-bootstrap') == 1
        assert html.index('data-theme-bootstrap') < html.index('<script type="module"')
        assert 'classroom-theme' in html
        assert entry.read_bytes() == before
        assert 'ETag' not in response.headers


def test_guest_course_has_no_theme_decoration(client):
    response = client.get('/courses/scale-lab/')
    assert response.status_code == 303
    assert 'data-theme-bootstrap' not in response.text
