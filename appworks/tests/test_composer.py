import io
import sqlite3
import pytest
from test_app import app, client, token
from test_community import login, post


def picture(fmt='PNG', frames=1):
    from PIL import Image
    out=io.BytesIO()
    images=[Image.new('RGB',(32,32),(i % 255,50,100)) for i in range(frames)]
    images[0].save(out,fmt,save_all=frames>1,append_images=images[1:] if frames>1 else [],duration=100)
    return out.getvalue()


def test_attachment_lifecycle(client,app):
    login(client)
    response=post(client,'/community/posts',title='file',body='body',category='general',attachments=(io.BytesIO(picture()),'../../ภาพ.png'))
    assert response.status_code == 303
    with sqlite3.connect(app.config['DATABASE']) as db:
        aid,ref=db.execute('SELECT id,storage FROM community_attachments').fetchone()
    path=f'/community/media/{aid}'
    image=client.get(path)
    assert image.status_code == 200 and image.mimetype == 'image/png'
    assert image.headers['X-Content-Type-Options']=='nosniff'
    assert app.test_client().get(path).status_code == 303
    assert path in client.get(response.location).text
    assert post(client,response.location+'/edit',title='file',body='body',category='general',remove_attachments=str(aid)).status_code == 303
    assert client.get(path).status_code==404
    from pathlib import Path
    assert not (Path(app.config['COMMUNITY_UPLOAD_DIR'])/ref).exists()


@pytest.mark.parametrize('raw,name',[(b'<svg onload=alert(1)>','x.svg'),(b'<html>bad','x.png'),(b'bad','x.pdf'),(b'\xff','x.txt'),(b'a'*(5*1024*1024+1),'big.txt')],ids=['svg','fake-image','fake-pdf','invalid-utf8','oversize'])
def test_invalid_attachments(client,raw,name):
    login(client)
    response=post(client,'/community/posts',title='file',body='body',category='general',attachments=(io.BytesIO(raw),name))
    assert response.status_code == 400


def test_own_animated_gif_and_documents(client,app):
    login(client)
    response=post(client,'/community/posts',title='gif',body='body',category='general',attachments=[(io.BytesIO(picture('GIF',3)),'mine.gif'),(io.BytesIO(b'QA plain text'),'note.txt')])
    assert response.status_code==303
    with sqlite3.connect(app.config['DATABASE']) as db:
        ids=db.execute('SELECT id FROM community_attachments ORDER BY id').fetchall()
    from PIL import Image
    assert Image.open(io.BytesIO(client.get(f'/community/media/{ids[0][0]}').data)).n_frames==3
    assert 'attachment;' in client.get(f'/community/media/{ids[1][0]}').headers['Content-Disposition']
    post(client,response.location+'/delete',confirm='delete')
    assert client.get(f'/community/media/{ids[0][0]}').status_code==404


def test_poll_votes_and_locked_structure(client,app):
    login(client)
    values=dict(title='poll',body='body',category='general',poll_question='Which?',poll_options='One\nTwo')
    response=post(client,'/community/posts',**values)
    assert response.status_code==303
    url=response.location
    other=app.test_client(); login(other,'other@example.com')
    assert post(other,url+'/vote',option='0').status_code==303
    assert post(other,url+'/vote',option='0').status_code==303
    assert post(other,url+'/vote',option='1').status_code==303
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT user_id,choice FROM community_votes').fetchall()==[(2,1)]
    assert 'Which?' in client.get(url).text
    assert post(client,url+'/edit',**{**values,'poll_options':'Three\nTwo'}).status_code==400
    assert post(client,url+'/edit',**values).status_code==303
    assert post(other,url+'/vote',option='2').status_code==400
    assert client.post(url+'/vote',data={'option':'0'}).status_code==403
    assert post(other,url+'/vote',option='0',user_id='1').status_code==400
    post(client,url+'/delete',confirm='delete')
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM community_votes').fetchone()[0]==0


def test_validation_preserves_links_poll_and_existing_files(client,app):
    login(client)
    url=post(client,'/community/posts',title='file',body='body',category='general',attachments=(io.BytesIO(picture()),'a.png')).location
    response=post(client,url+'/edit',title='draft',body='body',category='general',link_url='javascript:bad',video_url='https://youtu.be/abcdefghijk',poll_question='draft question',poll_options='One\nTwo')
    assert response.status_code==400
    assert 'value="javascript:bad"' in response.text
    assert 'value="draft question"' in response.text
    assert 'data-existing="1"' in response.text


def test_nonce_retry_keeps_one_set_of_files(client,app):
    login(client)
    values=dict(title='same',body='same',category='general',nonce='a'*32)
    def send(**extra):
        return post(client,'/community/posts',**{**values,**extra},attachments=(io.BytesIO(picture()),'a.png'))
    first=send()
    assert first.status_code==303
    assert send().location==first.location
    second=send(nonce='b'*32)
    assert second.status_code==303 and second.location!=first.location
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM community_attachments').fetchone()[0]==2


def test_composer_progressive_controls(client):
    login(client)
    html=client.get('/community').text
    assert 'id="composer"' in html
    for name in ('attachments','link_url','video_url','poll_question','poll_options'):
        assert f'name="{name}"' in html
    assert 'data-tool="emoji"' in html and 'data-tool="gif"' in html
    assert 'id="composer-dialog"' in html
    assert 'ข้อความเท่านั้น' not in html


def test_structured_links(client):
    login(client)
    response = post(client, '/community/posts', title='links', body='hello', category='general', link_url='https://example.com/a?x=1&y=2', video_url='https://youtu.be/abcdefghijk')
    assert response.status_code == 303
    page = client.get(response.location).text
    assert 'https://example.com/a?x=1&amp;y=2' in page
    assert 'rel="noopener noreferrer"' in page
    assert 'https://youtu.be/abcdefghijk' in page
    assert '<iframe' not in page


@pytest.mark.parametrize('url', ['javascript:alert(1)','data:text/html,x','file:///etc/passwd','https://good.test@evil.test','https://good.test\\@evil.test','https://good.test/%0afoo','https://good.test\n/evil','//evil.test'])
def test_unsafe_links(client,url):
    login(client)
    assert post(client,'/community/posts',title='unsafe',body='body',category='general',link_url=url).status_code == 400


def test_video_whitelist(client):
    login(client)
    assert post(client,'/community/posts',title='unsafe',body='body',category='general',video_url='https://youtube.com.evil.test/watch?v=abcdefghijk').status_code == 400
