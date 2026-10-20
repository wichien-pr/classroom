import re
from test_app import app, client
from test_community import login


def test_community_tab_hidden_without_removing_feature(client):
    login(client)
    for path in ['/', '/leaderboards', '/account/profile', '/community']:
        response=client.get(path)
        assert response.status_code==200
        nav=re.search(r'<nav\b[^>]*>(.*?)</nav>',response.text,re.S)[1]
        assert 'href="/community"' not in nav
        assert 'Classroom' in nav and 'Leaderboards' in nav and 'Profile' in nav
