from test_app import app, client, register, token


def test_feed_omits_search_sort_panel_but_keeps_categories(client):
    register(client)
    client.post('/login', data={'csrf_token': token(client, '/login'), 'email': 'learner@example.com', 'password': 'correct horse battery'})
    response = client.get('/community')
    assert response.status_code == 200
    assert 'role="search"' not in response.text
    assert 'name="sort"' not in response.text
    assert 'ค้นหาหัวข้อหรือเนื้อหา' not in response.text
    assert 'class="chips"' in response.text
    assert 'id="write-prompt"' in response.text
