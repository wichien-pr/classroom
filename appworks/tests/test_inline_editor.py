import io,json,sqlite3
import pytest
from test_app import app,client
from test_community import login,post
from test_composer import picture


def test_error_keeps_order(client,app):
    login(client)
    raw=[{'type':'text','text':'before'},{'type':'attachment','upload':0},{'type':'text','text':'after'}]
    result=post(client,'/community/posts',title='ordered',body='beforeafter',category='general',content_blocks=json.dumps(raw),attachments=(io.BytesIO(picture()),'a.png'))
    with sqlite3.connect(app.config['DATABASE']) as db:
        saved=db.execute('SELECT content_blocks FROM community_posts').fetchone()[0]
    response=post(client,result.location+'/edit',title='ordered',body='beforeafter',category='general',content_blocks=saved,link_url='javascript:bad')
    assert response.status_code==400
    from html import unescape
    assert 'data-blocks="'+saved in unescape(response.text)


def test_lossless_unicode_blocks(client,app):
    login(client)
    text='😀'*2000
    content=[{'type':'text','text':text}]
    result=post(client,'/community/posts',title='😀'*160,body=text,category='general',content_blocks=json.dumps(content,ensure_ascii=False))
    assert result.status_code==303
    with sqlite3.connect(app.config['DATABASE']) as db:
        body,raw=db.execute('SELECT body,content_blocks FROM community_posts').fetchone()
    assert body==text and json.loads(raw)==content


def test_order_image_only_security(client,app):
    login(client)
    content=[{'type':'text','text':'<script>alert(1)</script>'},{'type':'attachment','upload':0},{'type':'text','text':' หลังภาพ\n'}]
    result=post(client,'/community/posts',title='ordered',body='',category='general',content_blocks=json.dumps(content),attachments=(io.BytesIO(picture()),'a.png'))
    assert result.status_code==303
    html=client.get(result.location).text
    assert '<script>alert(1)</script>' not in html and '&lt;script&gt;' in html
    with sqlite3.connect(app.config['DATABASE']) as db:
        raw=db.execute('SELECT content_blocks FROM community_posts').fetchone()[0]
    saved=json.loads(raw);assert [b['type'] for b in saved]==['text','attachment','text']
    image=[saved[1]]
    assert post(client,result.location+'/edit',title='image only',body='',category='general',content_blocks=json.dumps(image)).status_code==303
    assert post(client,result.location+'/edit',title='empty',body='',category='general',remove_attachments=str(image[0]['id']),content_blocks='[{"type":"text","text":""}]').status_code==400
    other=app.test_client();login(other,'other@example.com')
    assert post(other,result.location+'/edit',title='foreign',body='',category='general',content_blocks=json.dumps(image)).status_code==403
    assert post(other,'/community/posts',title='foreign',body='x',category='general',content_blocks=json.dumps(image)).status_code==400


@pytest.mark.parametrize('content',[[],[{'type':'html','html':'<img onerror=alert(1)>'}],[{'type':'attachment','id':999}], [{'type':'text','text':'x','html':'bad'}],[{'type':'text','text':'a'*2001}], [{'type':'text','text':'\u0000'}],[{'type':'text','text':'x'}]*65])
def test_reject_arbitrary_blocks(client,content):
    login(client)
    assert post(client,'/community/posts',title='bad',body='body',category='general',content_blocks=json.dumps(content)).status_code==400


@pytest.mark.parametrize('raw',['['*1100+']'*1100, '[{"type":"text","text":"\\ud800"}]'])
def test_malformed_unicode_or_depth(client,raw):
    login(client)
    assert post(client,'/community/posts',title='bad',body='x',category='general',content_blocks=raw).status_code==400


def test_duplicate_missing_and_invalid_image_refs(client):
    login(client)
    for blocks in [[{'type':'attachment','upload':0}]*2,[{'type':'attachment','upload':True}],[{'type':'text','text':'x'}]]:
        assert post(client,'/community/posts',title='bad',body='',category='general',content_blocks=json.dumps(blocks),attachments=(io.BytesIO(picture()),'a.png')).status_code==400
    for raw,name in [(b'bad','bad.png'),(b'document','a.txt')]:
        assert post(client,'/community/posts',title='bad',body='',category='general',attachments=(io.BytesIO(raw),name)).status_code==400
