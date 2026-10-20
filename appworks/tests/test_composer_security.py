"""Regression/security boundaries for the implemented composer."""
import io
import sqlite3
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import pytest
from test_app import app, client, token
from test_community import login, post
from test_composer import picture


def test_vote_rate_limit_retry_header(client):
    login(client)
    url=post(client,'/community/posts',title='rate',body='body',category='general',poll_question='Q',poll_options='A\nB').location
    for i in range(15):
        assert post(client,url+'/vote',option=str(i%2)).status_code==303
    response=post(client,url+'/vote',option='1')
    assert response.status_code==429
    assert response.headers.get('Retry-After')=='600'
    assert post(client,url+'/vote',option='0').status_code==303


def test_exact_file_and_request_boundaries(client,app):
    login(client)
    response=post(client,'/community/posts',title='max',body='body',category='general',attachments=(io.BytesIO(b'a'*(5*1024*1024)),'max.txt'))
    assert response.status_code==303
    assert len(client.get('/community/media/1').data)==5*1024*1024
    too_big=post(client,'/community/posts',title='big',body='body',category='general',attachments=(io.BytesIO(b'a'*(20*1024*1024+32768)),'big.txt'))
    assert too_big.status_code==413
    assert client.post('/login',data={'body':'x'*20000}).status_code==413
    csrf=token(client,'/community')
    assert client.post(response.location+'/vote',data={'csrf_token':csrf,'body':'x'*20000}).status_code==413


def test_frame_bomb_count_and_static_animation_rejected(client):
    login(client)
    for raw,name in [(picture('GIF',101),'bomb.gif'),(picture('PNG',3),'animated.png')]:
        assert post(client,'/community/posts',title='bad',body='body',category='general',attachments=(io.BytesIO(raw),name)).status_code==400
    assert post(client,'/community/posts',title='bad',body='body',category='general',attachments=[(io.BytesIO(b'x'),f'{i}.txt') for i in range(5)]).status_code==400


def test_image_metadata_and_trailing_script_stripped(client):
    login(client)
    data=picture()+b'<script>polyglot</script>'
    response=post(client,'/community/posts',title='image',body='body',category='general',attachments=(io.BytesIO(data),'x.png'))
    assert response.status_code==303
    assert b'<script>' not in client.get('/community/media/1').data


def test_storage_rollback_on_database_failure(client,app):
    login(client)
    with sqlite3.connect(app.config['DATABASE']) as db:
        db.execute("CREATE TRIGGER qa_fail BEFORE INSERT ON community_attachments BEGIN SELECT RAISE(ABORT,'QA injected failure'); END")
    with pytest.raises(sqlite3.IntegrityError):
        post(client,'/community/posts',title='rollback',body='body',category='general',attachments=(io.BytesIO(picture()),'a.png'))
    assert list(Path(app.config['COMMUNITY_UPLOAD_DIR']).glob('*'))==[]
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM community_posts').fetchone()[0]==0
        assert db.execute('SELECT count(*) FROM community_rate_events').fetchone()[0]==0


def test_other_account_cannot_remove_files_or_edit_poll(client,app):
    login(client)
    url=post(client,'/community/posts',title='private owner',body='body',category='general',attachments=(io.BytesIO(picture()),'a.png'),poll_question='Q',poll_options='A\nB').location
    other=app.test_client();login(other,'other@example.com')
    assert post(other,url+'/edit',title='stolen',body='body',category='general',remove_attachments='1',poll_question='bad',poll_options='X\nY').status_code==403
    own=post(other,'/community/posts',title='other',body='body',category='general').location
    assert post(other,own+'/edit',title='other',body='body',category='general',remove_attachments='1').status_code==400
    assert client.get('/community/media/1').status_code==200
    assert client.get('/community/media/999999999999999999999999999').status_code==404
    with sqlite3.connect(app.config['DATABASE']) as db:
        db.execute('DELETE FROM community_posts WHERE id=1')
    assert client.get('/community/media/1').status_code==404


@pytest.mark.parametrize('question,options',[('','A\nB'),('Q','A'),('Q','A\na'),('Q','A\n\nB'),('Q','\n'.join(str(i) for i in range(7))),('Q','A'*101+'\nB'),('Q\x00','A\nB')])
def test_poll_validation(client,question,options):
    login(client)
    assert post(client,'/community/posts',title='poll',body='body',category='general',poll_question=question,poll_options=options).status_code==400


def test_concurrent_votes_and_nonce_uploads(client,app):
    login(client);csrf=token(client,'/community');cookie=client.get_cookie('aw_session').value
    def send(_):
        c=app.test_client();c.set_cookie('aw_session',cookie)
        return c.post('/community/posts',data=dict(csrf_token=csrf,title='concurrent',body='body',category='general',nonce='n'*32,poll_question='Q',poll_options='A\nB',attachments=(io.BytesIO(picture()),'a.png')))
    with ThreadPoolExecutor(max_workers=4) as pool:
        responses=list(pool.map(send,range(4)))
    assert {r.status_code for r in responses}=={303}
    assert len({r.location for r in responses})==1
    url=responses[0].location
    def vote(_):
        c=app.test_client();c.set_cookie('aw_session',cookie)
        return c.post(url+'/vote',data=dict(csrf_token=csrf,option='1'))
    with ThreadPoolExecutor(max_workers=4) as pool:
        assert {r.status_code for r in pool.map(vote,range(8))}=={303}
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM community_attachments').fetchone()[0]==1
        assert db.execute('SELECT count(*) FROM community_votes').fetchone()[0]==1
        assert db.execute("SELECT count(*) FROM community_rate_events WHERE kind='vote'").fetchone()[0]==1
    assert len(list(Path(app.config['COMMUNITY_UPLOAD_DIR']).glob('*')))==1


def test_vote_session_origin_activity_and_restart(client,app):
    from app import create_app
    login(client)
    url=post(client,'/community/posts',title='persist',body='body',category='general',poll_question='Q',poll_options='A\nB',attachments=(io.BytesIO(picture('GIF',3)),'a.gif')).location
    with sqlite3.connect(app.config['DATABASE']) as db:
        before=db.execute('SELECT count(*) FROM activity_events').fetchone()[0]
    csrf=token(client,'/community')
    assert client.post(url+'/vote',data=dict(csrf_token=csrf,option='0'),headers={'Origin':'https://evil.example'}).status_code==403
    guest=app.test_client();guest_csrf=token(guest)
    assert guest.post(url+'/vote',data=dict(csrf_token=guest_csrf,option='0')).location=='/login'
    assert post(client,url+'/vote',option='0').status_code==303
    again=create_app({'TESTING':True,'DATABASE':app.config['DATABASE'],'COMMUNITY_UPLOAD_DIR':app.config['COMMUNITY_UPLOAD_DIR']}).test_client()
    again.set_cookie('aw_session',client.get_cookie('aw_session').value)
    assert '1 โหวต' in again.get(url).text
    assert again.get('/community/media/1').mimetype=='image/gif'
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM activity_events').fetchone()[0]==before
