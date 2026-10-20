from test_app import app, client, token, register


def login(client, email='learner@example.com'):
    register(client, email)
    client.post('/login', data={'csrf_token':token(client,'/login'), 'email':email, 'password':'correct horse battery'})


def test_icon_like_controls_preserve_explicit_state(client):
    import re
    login(client)
    url=post(client,'/community/posts',title='icon controls',body='body',category='general').location
    for state, label, count in [('false','ถูกใจ',0),('true','ยกเลิกถูกใจ',1),('false','ถูกใจ',0)]:
        for path in ['/community',url]:
            html=client.get(path).text
            button=re.search(r'<button[^>]*class="reaction[^>]*>.*?</button>',html,re.S)
            assert button, 'Like must be a native icon reaction button'
            assert f'aria-pressed="{state}"' in button[0]
            assert f'aria-label="{label}"' in button[0]
            assert '<svg' in button[0] and 'aria-hidden="true"' in button[0]
            assert f'<span class="reaction-count">{count}</span>' in button[0]
            assert 'ถูกใจ' not in re.sub(r'<[^>]+>','',button[0])
        if count == 0 and state == 'false':
            post(client,url+'/like',state='1')
        else:
            post(client,url+'/like',state='0')


def test_reference_card_identity_pin_and_latest_comment(client, app):
    import re
    login(client)
    url=post(client,'/community/posts',title='reference card',body='body',category='questions').location
    html=client.get('/community').text
    assert 'class="post-avatar"' in html
    assert 'class="author-level" aria-label="L1">1</span>' in html
    assert 'class="last-comment"' not in html
    assert 'post-card is-pinned' not in html
    assert f'aria-label="0 ความคิดเห็น" href="{url}#comments"' in html
    other=app.test_client(); login(other,'other@example.com')
    app.config['COMMUNITY_MODERATOR_IDS']={2}
    post(other,url+'/pin',state='1')
    post(other,url+'/comments',body='real last comment')
    for path in ['/community',url]:
        html=client.get(path).text
        assert 'post-card is-pinned' in html
        assert 'class="pin-label"' in html
        match=re.search(r'<div class="last-comment">(.*?)</div>',html,re.S)
        assert match is not None
        last=match[1]
        assert 'href="/members/2"' in last
        assert 'เมื่อสักครู่' in last
        assert '@example.com' not in last
    post(other,'/community/comments/1/delete',confirm='delete')
    assert 'class="last-comment"' not in client.get('/community').text


def test_authenticated_empty_community(client):
    assert client.get('/community').status_code == 303
    login(client)
    page = client.get('/community')
    assert page.status_code == 200
    assert 'ยังไม่มีโพสต์' in page.text
    assert 'คำถาม' in page.text


def post(client, path, **values):
    return client.post(path, data={'csrf_token': token(client,'/community'), **values}, content_type='multipart/form-data')


def test_create_read_validated_plain_text(client, app):
    login(client)
    response = post(client, '/community/posts', title='<script>title</script>', body='first\nsecond <img src=x>', category='questions')
    assert response.status_code == 303
    detail = client.get(response.location)
    assert detail.status_code == 200
    assert '&lt;script&gt;title&lt;/script&gt;' in detail.text
    assert 'first\nsecond &lt;img src=x&gt;' in detail.text
    assert 'member-1' in detail.text and 'L1' in detail.text
    assert 'first' in client.get('/community').text
    for values in [dict(title='',body='text',category='general'),dict(title='a'*161,body='text',category='general'),dict(title='ok',body='a'*2001,category='general'),dict(title='ok',body='text',category='nope')]:
        assert post(client,'/community/posts',**values).status_code == 400
    assert client.post('/community/posts',data={}).status_code == 403
    assert client.post('/community/posts',data={'csrf_token':token(client,'/community')},headers={'Origin':'https://evil.example'}).status_code == 403
    from app import create_app
    again=create_app({'TESTING':True,'DATABASE':app.config['DATABASE']}).test_client()
    again.set_cookie('aw_session',client.get_cookie('aw_session').value)
    assert 'first' in again.get(response.location).text


def test_owner_edit_delete_and_moderation(client, app):
    login(client)
    url=post(client,'/community/posts',title='original',body='body',category='general').location
    other=app.test_client(); login(other,'other@example.com')
    assert post(other,url+'/edit',title='stolen',body='bad',category='general').status_code == 403
    assert post(other,url+'/delete',confirm='delete').status_code == 403
    assert post(client,url+'/pin',state='1').status_code == 403
    assert post(client,url+'/edit',title='edited',body='new body',category='tips').status_code == 303
    assert 'edited' in client.get(url).text
    app.config['COMMUNITY_MODERATOR_IDS']={2}
    assert post(other,url+'/pin',state='1').status_code == 303
    assert 'ปักหมุด' in client.get(url).text
    assert post(client,url+'/delete').status_code == 400
    assert post(client,url+'/delete',confirm='delete').status_code == 303
    assert client.get(url).status_code == 404
    assert post(client,url+'/edit',title='x',body='y',category='general').status_code == 404


def test_likes_comments_ownership_and_cleanup(client,app):
    import sqlite3
    login(client)
    url=post(client,'/community/posts',title='discussion',body='hello',category='general').location
    other=app.test_client(); login(other,'other@example.com')
    for _ in range(2):
        assert post(other,url+'/like',state='1').status_code == 303
    assert '<span class="reaction-count">1</span>' in client.get(url).text
    assert post(other,url+'/like',state='0').status_code == 303
    assert '<span class="reaction-count">0</span>' in client.get(url).text
    assert client.get(url+'/like').status_code == 405
    assert post(other,url+'/comments',body='comment <script>x</script>').status_code == 303
    assert '1 ความคิดเห็น' in client.get(url).text
    assert '&lt;script&gt;x&lt;/script&gt;' in client.get(url).text
    comment='/community/comments/1'
    assert post(client,comment+'/edit',body='stolen').status_code == 403
    assert post(client,comment+'/delete',confirm='delete').status_code == 403
    assert post(other,comment+'/edit',body='edited comment').status_code == 303
    assert 'edited comment' in client.get(url).text
    assert post(other,comment+'/delete',confirm='delete').status_code == 303
    assert post(other,comment+'/edit',body='gone').status_code == 404
    post(other,url+'/comments',body='second')
    post(client,url+'/delete',confirm='delete')
    assert post(other,url+'/comments',body='gone').status_code == 404
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM community_comments').fetchone()[0]==0
        assert db.execute('SELECT count(*) FROM community_likes').fetchone()[0]==0


def test_search_filters_pagination_stable(client, app):
    import sqlite3
    login(client)
    with sqlite3.connect(app.config['DATABASE']) as db:
        for i in range(25):
            db.execute('INSERT INTO community_posts(user_id,title,body,category,created,updated,activity) VALUES(?,?,?,?,?,?,?)',(1,f'Post {i:02}', '100% literal' if i==1 else 'ordinary','questions' if i%2 else 'general',100,100,100))
    first=client.get('/community?category=questions&q=Post&sort=newest')
    assert 'Post 23' in first.text and 'Post 24' not in first.text
    assert 'Post 01' not in first.text
    second=client.get('/community?category=questions&q=Post&sort=newest&page=2')
    assert 'Post 01' in second.text and 'Post 23' not in second.text
    assert 'category=questions' in first.text and 'page=2' in first.text
    assert 'Post 01' in client.get('/community?q=%25').text
    assert 'Post 02' not in client.get('/community?q=%25').text
    for query in ['page=-1','page=999999999999999999999','category=invalid','sort=no','q='+('x'*101)]:
        assert client.get('/community?'+query).status_code==400
    assert client.get('/community/posts/1?comment_page=-1').status_code==400


def test_persisted_rate_limits_and_retry_deduplication(client,app):
    import sqlite3,time
    login(client)
    values=dict(title='retry',body='body',category='general')
    first=post(client,'/community/posts',**values)
    assert post(client,'/community/posts',**values).location==first.location
    for i in range(4):
        assert post(client,'/community/posts',title=f'new {i}',body='body',category='general').status_code==303
    assert post(client,'/community/posts',title='too many',body='body',category='general').status_code==429
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM community_posts').fetchone()[0]==5
        db.execute("UPDATE community_rate_events SET created=?",(time.time()-601,))
    assert post(client,'/community/posts',title='after window',body='body',category='general').status_code==303
    for i in range(15):
        assert post(client,first.location+'/comments',body=f'comment {i}').status_code==303
    assert post(client,first.location+'/comments',body='too many').status_code==429
    assert post(client,first.location+'/comments',body='comment 14').status_code==303


def test_friendly_errors_and_max_thai_body(client):
    login(client)
    response=post(client,'/community/posts',title='ภาษาไทย',body='ก'*2000,category='general')
    assert response.status_code==303
    oversized=client.post('/community/posts',data={'csrf_token':token(client,'/community'),'body':'x'*20000})
    assert oversized.status_code==413
    assert 'คำขอมีขนาดใหญ่เกินไป' in oversized.text
    invalid=post(client,response.location+'/comments',body='')
    assert invalid.status_code==400 and 'ร่วมแสดงความคิดเห็น' in invalid.text
    assert post(client,response.location+'/edit',title='bad\x00',body='body',category='general').status_code==400


def test_navigation_and_last_comment(client,app):
    login(client)
    assert 'href="/community"' not in client.get('/').text
    assert 'เร็ว ๆ นี้' not in client.get('/').text
    assert 'href="/community"' not in client.get('/leaderboards').text
    url=post(client,'/community/posts',title='topic',body='body',category='general').location
    post(client,url+'/comments',body='reply')
    assert 'ความคิดเห็นล่าสุด' in client.get('/community').text


def test_concurrent_likes_and_duplicate_posts(client,app):
    from concurrent.futures import ThreadPoolExecutor
    import sqlite3
    login(client)
    csrf=token(client,'/community'); cookie=client.get_cookie('aw_session').value
    def send(path,values):
        c=app.test_client(); c.set_cookie('aw_session',cookie)
        return c.post(path,data={'csrf_token':csrf,**values})
    with ThreadPoolExecutor(max_workers=4) as pool:
        responses=list(pool.map(lambda _:send('/community/posts',dict(title='one',body='body',category='general')),range(4)))
    assert {r.status_code for r in responses}=={303}
    assert len({r.location for r in responses})==1
    url=responses[0].location
    with ThreadPoolExecutor(max_workers=4) as pool:
        responses=list(pool.map(lambda _:send(url+'/like',dict(state='1')),range(8)))
    assert {r.status_code for r in responses}=={303}
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM community_likes').fetchone()[0]==1


def test_strict_forms_and_friendly_forbidden(client,app):
    login(client)
    response=post(client,'/community/posts',title='safe',body='body',category='general',user_id='2')
    assert response.status_code==400
    url=post(client,'/community/posts',title='safe',body='body',category='general').location
    other=app.test_client(); login(other,'other@example.com')
    response=post(other,url+'/delete',confirm='delete')
    assert response.status_code==403 and 'ไม่มีสิทธิ์' in response.text
    assert 'ไม่พบโพสต์' in client.get('/community/posts/9999').text


def test_deleted_identifiers_never_reused(client):
    login(client)
    old=post(client,'/community/posts',title='old',body='body',category='general').location
    post(client,old+'/delete',confirm='delete')
    new=post(client,'/community/posts',title='new',body='body',category='general').location
    assert old!=new
    assert client.get(old).status_code==404


def test_comment_pages_redirect_to_new_comment(client,app):
    import sqlite3
    login(client)
    url=post(client,'/community/posts',title='many',body='body',category='general').location
    with sqlite3.connect(app.config['DATABASE']) as db:
        db.executemany('INSERT INTO community_comments(post_id,user_id,body,created,updated) VALUES(1,1,?,?,?)',[(f'old {i}',i,i) for i in range(25)])
    response=post(client,url+'/comments',body='my new reply')
    assert 'comment_page=2' in response.location
    assert 'my new reply' in client.get(response.location).text
    assert 'my new reply' not in client.get(url).text


def test_learning_activity_unchanged_and_real_level(client,app):
    import sqlite3,json
    from pathlib import Path
    login(client)
    with sqlite3.connect(app.config['DATABASE']) as db:
        before=db.execute('SELECT count(*) FROM activity_events').fetchone()[0]
        course=json.loads((Path(app.config['COURSES_ROOT'])/'scale-lab/course.json').read_text())
        db.executemany('INSERT INTO lesson_progress VALUES(?,?,?,?)',[(1,'scale-lab',lesson,100) for lesson in course['lessons']])
        db.executemany('INSERT INTO lesson_manual_completion VALUES(?,?,?,?)',[(1,'scale-lab',lesson,100) for lesson in course['lessons']])
        import uuid
        for lesson in course['lessons']:
            for simulation, actions in course['participation'][lesson].items():
                db.execute('INSERT INTO participation_awards_v2 VALUES(?,?,?,?,?,?,?,1)', (1,'scale-lab',lesson,simulation,actions[0],str(uuid.uuid4()),100))
    url=post(client,'/community/posts',title='real level',body='body',category='general').location
    post(client,url+'/comments',body='reply'); post(client,url+'/like',state='1')
    assert 'L2' in client.get(url).text
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM activity_events').fetchone()[0]==before


import pytest
@pytest.mark.parametrize('suffix,values',[('/edit',dict(title='x',body='y',category='general')),('/delete',dict(confirm='delete')),('/like',dict(state='1')),('/pin',dict(state='1')),('/comments',dict(body='hi'))])
def test_each_mutation_session_csrf_origin(client,app,suffix,values):
    login(client)
    url=post(client,'/community/posts',title='secure',body='body',category='general').location
    assert client.post(url+suffix,data=values).status_code==403
    assert client.post(url+suffix,data={**values,'csrf_token':token(client,'/community')},headers={'Sec-Fetch-Site':'cross-site'}).status_code==403
    guest=app.test_client(); csrf=token(guest)
    response=guest.post(url+suffix,data={**values,'csrf_token':csrf})
    assert response.status_code==303 and response.location=='/login'


@pytest.mark.parametrize('path',['/community/posts/999999999999999999999999999999','/community/comments/999999999999999999999999999999/edit'])
def test_out_of_range_identifiers_are_404(client,path):
    login(client)
    response=post(client,path,body='safe') if '/comments/' in path else client.get(path)
    assert response.status_code==404


def test_invalid_comment_edit_keeps_draft_in_editor(client):
    import re
    login(client)
    url=post(client,'/community/posts',title='topic',body='body',category='general').location
    post(client,url+'/comments',body='original')
    response=post(client,'/community/comments/1/edit',body='x'*1001)
    assert response.status_code==400
    edit=re.search(r'action="/community/comments/1/edit".*?<textarea[^>]*>(.*?)</textarea>',response.text,re.S)
    assert edit is not None
    assert edit[1]=='x'*1001
    assert '<textarea name="body" maxlength="1000" required></textarea>' in response.text


def test_moderator_unpin_delete_other_content(client,app):
    login(client)
    url=post(client,'/community/posts',title='moderate',body='body',category='general').location
    post(client,url+'/comments',body='reply')
    other=app.test_client(); login(other,'moderator@example.com')
    app.config['COMMUNITY_MODERATOR_IDS']={2}
    assert post(other,url+'/pin',state='1').status_code==303
    assert post(other,url+'/pin',state='0').status_code==303
    assert 'class="pin-label"' not in client.get(url).text
    assert post(other,'/community/comments/1/delete',confirm='delete').status_code==303
    assert '0 ความคิดเห็น' in client.get(url).text
    assert post(other,url+'/delete',confirm='delete').status_code==303
    assert client.get(url).status_code==404
