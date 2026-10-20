import re
import pytest
from test_app import app, client, register, token


@pytest.mark.parametrize('path', ['/', '/community', '/leaderboards', '/account/profile', '/account/profile/edit'])
def test_profile_tab_present_with_english_label(client, path):
    register(client)
    client.post('/login', data={'csrf_token': token(client, '/login'), 'email': 'learner@example.com', 'password': 'correct horse battery'})
    response = client.get(path)
    assert response.status_code == 200
    navigation = re.search(r'<nav[^>]*>(.*?)</nav>', response.text, re.S)[1]
    assert re.search(r'<a\b[^>]*href="/account/profile"[^>]*>Profile</a>', navigation)
    assert '>โปรไฟล์</a>' not in navigation
