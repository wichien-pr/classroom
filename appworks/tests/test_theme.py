"""Platform theme contracts; account fixtures remain in temporary SQLite."""
import pytest
from test_app import app, client
from test_community import login


@pytest.mark.parametrize('path', ['/login', '/register', '/forgot-password', '/reset-password'])
def test_guest_theme_available_before_page_styles(client, path):
    html = client.get(path).text
    assert 'id="theme-toggle"' in html
    assert html.index('data-theme-bootstrap') < html.index('<style>')
    assert 'aria-label="ธีมมืด"' in html


@pytest.mark.parametrize('path', ['/', '/leaderboards', '/account/profile', '/account/profile/edit', '/community', '/exam'])
def test_shared_platform_theme_control(client, path):
    login(client)
    html = client.get(path).text
    assert html.count('id="theme-toggle"') == 1
    assert 'data-theme-bootstrap' in html
    assert 'theme-style' in html
    assert 'type="button" aria-label="ธีมมืด" aria-pressed="false"' in html
