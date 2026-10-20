import io
import sqlite3
from pathlib import Path
import pytest
from PIL import Image
from app import create_app
from test_app import register, token


def picture(fmt='PNG', size=(96, 80), **kwargs):
    out = io.BytesIO()
    Image.new('RGB', size, '#2676cd').save(out, format=fmt, **kwargs)
    return out.getvalue()


@pytest.fixture
def account(tmp_path):
    app = create_app({'TESTING': True, 'DATABASE': str(tmp_path/'accounts.sqlite3'), 'PROFILE_UPLOAD_DIR': str(tmp_path/'photos')})
    client = app.test_client()
    register(client)
    client.post('/login', data={'csrf_token': token(client, '/login'), 'email':'learner@example.com', 'password':'correct horse battery'})
    return app, client


def upload(client, content=None, **fields):
    return client.post('/account/profile', data={'csrf_token':token(client, '/'), 'photo':(io.BytesIO(picture() if content is None else content), '../../app.py'), **fields})


@pytest.mark.parametrize('content', [b'', b'<svg xmlns="http://www.w3.org/2000/svg"/>', b'not an image', picture('GIF'), picture()[:45], picture(size=(4097,32)), picture(size=(16,16))])
def test_invalid_images_rejected_without_files(account, content):
    app, client = account
    response = upload(client, content)
    assert response.status_code == 400
    assert 'รูปภาพ' in response.text
    assert not list(Path(app.config['PROFILE_UPLOAD_DIR']).glob('*'))


def test_upload_body_budget_is_route_scoped(account):
    app, client = account
    # Valid larger-than-16KiB input (trailing bytes never retained).
    assert upload(client, picture()+b'X'*20000).status_code == 303
    response = upload(client, picture()+b'X'*(5*1024*1024))
    assert response.status_code == 413
    assert '5 MiB' in response.text
    assert client.post('/login', data={'pad':'x'*20000}).status_code == 413


def test_replace_remove_cleanup_and_account_isolation(account):
    app, client = account
    other = app.test_client()
    register(other, 'second@example.test')
    assert upload(client).status_code == 303
    root = Path(app.config['PROFILE_UPLOAD_DIR'])
    first = next(root.iterdir())
    assert upload(client, picture('WEBP'), user_id='2').status_code == 400
    assert client.get('/account/photos/2').status_code == 404
    assert upload(client, picture('JPEG')).status_code == 303
    assert not first.exists()
    assert len(list(root.iterdir())) == 1
    assert client.post('/account/profile', data={'csrf_token':token(client,'/'), 'action':'remove'}).status_code == 303
    assert not list(root.iterdir())
    assert client.get('/account/photos/1').status_code == 404


def test_photo_shared_ui_and_initials(account):
    app, client = account
    for path in ('/', '/account/profile', '/leaderboards', '/exam'):
        assert 'href="/account/profile"' in client.get(path).text
        assert 'avatar-initials' in client.get(path).text
    upload(client)
    for path in ('/', '/account/profile', '/leaderboards', '/exam'):
        assert 'src="/account/photos/1"' in client.get(path).text
    page = client.get('/account/profile').text
    assert 'aria-current="page" href="/account/profile"' in page
    assert 'href="/account/profile/edit"' in page
    assert 'id="photo"' not in page
    assert 'id="photo-preview"' not in page
    assert 'ลบรูปโปรไฟล์' not in page
    editor = client.get('/account/profile/edit').text
    assert 'id="photo-preview"' in editor and '5 MiB' in editor
    assert 'ลบรูปโปรไฟล์' in editor
    assert 'id="display-name"' in editor and 'id="bio"' in editor


def test_photo_results_return_to_editor(account):
    app, client = account
    response = upload(client)
    assert response.location == '/account/profile/edit?photo_saved=1'
    for content, status in [(b'invalid', 400), (b'x' * (5*1024*1024+1), 413), (b'x' * (6*1024*1024), 413)]:
        response = upload(client, content)
        assert response.status_code == status
        assert 'id="photo"' in response.text
        assert 'id="display-name"' in response.text
        assert 'role="alert"' in response.text
        assert 'ลบรูปโปรไฟล์' in response.text
        assert client.get('/account/photos/1').status_code == 200
    response = client.post('/account/profile', data={'csrf_token':token(client,'/'), 'action':'remove'})
    assert response.location == '/account/profile/edit?photo_saved=1'
    assert 'ลบรูปโปรไฟล์' not in client.get(response.location).text


def test_random_collision_never_deletes_existing_photo(account, monkeypatch):
    app, client = account
    upload(client)
    root = Path(app.config['PROFILE_UPLOAD_DIR']); existing=next(root.iterdir())
    monkeypatch.setattr('profiles.secrets.token_hex', lambda n: existing.stem)
    with pytest.raises(FileExistsError):
        upload(client)
    assert existing.is_file()
    assert client.get('/account/photos/1').status_code == 200


def test_upload_owned_photo_persists_after_restart(account):
    app, client = account
    assert client.get('/account/profile').status_code == 200
    assert upload(client).status_code == 303
    response = client.get('/account/photos/1')
    assert response.status_code == 200
    assert response.mimetype == 'image/jpeg'
    assert Image.open(io.BytesIO(response.data)).size == (96, 80)
    restarted = create_app(dict(app.config)).test_client()
    restarted.set_cookie('aw_session', client.get_cookie('aw_session').value)
    assert restarted.get('/account/photos/1').data == response.data
    with sqlite3.connect(app.config['DATABASE']) as db:
        ref = db.execute('SELECT photo_ref FROM users WHERE id=1').fetchone()[0]
    assert Path(ref).name == ref and ref.endswith('.jpg')
    assert (Path(app.config['PROFILE_UPLOAD_DIR'])/ref).is_file()

@pytest.mark.parametrize('fmt', ['JPEG','PNG','WEBP'])
def test_actual_decoding_metadata_stripping_and_bounds(account, fmt):
    app, client = account
    exif = Image.Exif(); exif[270] = 'PRIVATE GPS OWNER'; exif[274] = 6
    assert upload(client, picture(fmt, (800,400), exif=exif)).status_code == 303
    response = client.get('/account/photos/1')
    image = Image.open(io.BytesIO(response.data))
    assert max(image.size) == 256 and image.format == 'JPEG'
    assert not image.getexif() and b'PRIVATE GPS OWNER' not in response.data
    assert response.headers['Cache-Control'] == 'no-store'
    assert response.headers['X-Content-Type-Options'] == 'nosniff'


def test_animation_pixel_flood_truncation(account):
    app, client = account
    for fmt in ['PNG','WEBP','GIF']:
        out = io.BytesIO()
        Image.new('RGB',(64,64),'red').save(out,fmt,save_all=True,append_images=[Image.new('RGB',(64,64),'blue')],duration=100,loop=0)
        assert upload(client,out.getvalue()).status_code == 400
    assert upload(client,picture(size=(4000,4000))).status_code == 400
    assert upload(client,picture('JPEG')[:-30]).status_code == 400
    # Header declares a decompression bomb without allocating a huge image.
    import struct, zlib
    raw = picture(); header=struct.pack('>IIBBBBB',100000,100000,8,2,0,0,0)
    bomb=raw[:16]+header+struct.pack('>I',zlib.crc32(b'IHDR'+header))+raw[33:]
    assert upload(client,bomb).status_code == 400


def test_auth_csrf_paths_and_second_account(account):
    app, client = account
    guest=app.test_client()
    assert guest.get('/account/profile').status_code == 303
    assert guest.get('/account/photos/1').status_code == 303
    assert guest.post('/account/profile',data={}).status_code == 403
    csrf=token(client,'/')
    for headers in [{'Origin':'https://evil.test'}, {'Sec-Fetch-Site':'cross-site'}]:
        assert client.post('/account/profile',data={'csrf_token':csrf,'action':'remove'},headers=headers).status_code == 403
    assert client.post('/account/profile',data={'action':'remove'}).status_code == 403
    other=app.test_client();register(other,'other@example.test')
    other.post('/login',data={'csrf_token':token(other,'/login'),'email':'other@example.test','password':'correct horse battery'})
    assert other.post('/account/profile',data={'csrf_token':csrf,'action':'remove'}).status_code == 403
    upload(client)
    assert other.get('/account/photos/1').status_code == 200
    assert other.get('/account/photos/2').status_code == 404
    assert other.post('/account/profile/1',data={'csrf_token':token(other,'/'),'action':'remove'}).status_code == 404
    assert client.get('/account/photos/1').status_code == 200
    for path in ['/account/photos/../app.py','/account/photos/../../instance/classroom.sqlite3','/profile-photos/', '/profiles.py','/account/photos/1/../../app.py']:
        assert client.get(path).status_code == 404


def test_transaction_failure_keeps_old_and_removes_new(account):
    app, client=account;upload(client)
    root=Path(app.config['PROFILE_UPLOAD_DIR']); before=set(root.iterdir())
    with sqlite3.connect(app.config['DATABASE']) as db:
        db.execute("CREATE TRIGGER reject_photo BEFORE UPDATE OF photo_ref ON users BEGIN SELECT RAISE(ABORT, 'QA failure'); END")
    with pytest.raises(sqlite3.IntegrityError):
        upload(client)
    assert set(root.iterdir()) == before
    assert client.get('/account/photos/1').status_code == 200


def test_shared_ref_and_malicious_db_path_never_deleted_or_served(account):
    app,client=account;upload(client)
    root=Path(app.config['PROFILE_UPLOAD_DIR']);first=next(root.iterdir())
    with sqlite3.connect(app.config['DATABASE']) as db:
        db.execute('INSERT INTO users(name,email,password_hash,photo_ref) VALUES(?,?,?,?)',('Shared','shared@test.test','no-login',first.name))
    upload(client)
    assert first.exists() and client.get('/account/photos/2').status_code == 200
    with sqlite3.connect(app.config['DATABASE']) as db:
        db.execute("UPDATE users SET photo_ref='../accounts.sqlite3' WHERE id=1")
    assert client.get('/account/photos/1').status_code == 404
    upload(client)
    assert Path(app.config['DATABASE']).is_file()
    with sqlite3.connect(app.config['DATABASE']) as db:
        ref=db.execute('SELECT photo_ref FROM users WHERE id=1').fetchone()[0]
    (root/ref).unlink();(root/ref).symlink_to(app.config['DATABASE'])
    assert client.get('/account/photos/1').status_code == 404

