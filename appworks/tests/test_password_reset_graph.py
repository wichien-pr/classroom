import json
import sqlite3
from urllib.parse import parse_qs
import pytest
from app import create_app
from test_password_reset import register, request_reset

CLIENT = '11111111-1111-4111-8111-111111111111'
TENANT = '22222222-2222-4222-8222-222222222222'


def config(tmp_path):
    return dict(TESTING=True, DATABASE=str(tmp_path/'graph.sqlite3'), RESET_ENABLED=True,
                RESET_TRANSPORT='graph', RESET_BASE_URL='https://classroom.example.test',
                RESET_GRAPH_CLIENT_ID=CLIENT, RESET_GRAPH_TENANT_ID=TENANT,
                RESET_GRAPH_CLIENT_SECRET='fake-private-secret', RESET_GRAPH_SENDER='sender@example.test')


def test_graph_request_reaches_token_and_sender_sendmail(tmp_path, monkeypatch):
    import http.client
    calls = []
    class Connection:
        def __init__(self, host, timeout):
            self.host = host
            assert timeout == 10
        def request(self, method, path, body, headers):
            calls.append((self.host, method, path, body, headers))
        def getresponse(self):
            class Response:
                status = 200 if len(calls) == 1 else 202
                def read(self, size):
                    assert size == 65537
                    return json.dumps({'access_token':'fake-access-token','token_type':'Bearer'}).encode()
            return Response()
        def close(self):
            pass
    monkeypatch.setattr(http.client, 'HTTPSConnection', Connection)
    app = create_app(config(tmp_path))
    client = app.test_client()
    register(client)
    assert request_reset(app, client).status_code == 200
    assert len(calls) == 2
    host, method, path, body, headers = calls[0]
    assert (host, method, path) == ('login.microsoftonline.com','POST',f'/{TENANT}/oauth2/v2.0/token')
    assert parse_qs(body.decode()) == {'client_id':[CLIENT], 'client_secret':['fake-private-secret'],
        'grant_type':['client_credentials'], 'scope':['https://graph.microsoft.com/.default']}
    host, method, path, body, headers = calls[1]
    assert (host, method, path) == ('graph.microsoft.com','POST','/v1.0/users/sender%40example.test/sendMail')
    assert headers['Authorization'] == 'Bearer fake-access-token'
    payload = json.loads(body)
    assert payload['saveToSentItems'] is False
    assert payload['message']['toRecipients'] == [{'emailAddress':{'address':'member@example.test'}}]
    assert payload['message']['body']['contentType'] == 'Text'
    assert 'https://classroom.example.test/reset-password#' in payload['message']['body']['content']
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM password_resets').fetchone()[0] == 1


@pytest.mark.parametrize('key,value', [
    ('RESET_GRAPH_CLIENT_ID',''), ('RESET_GRAPH_CLIENT_ID','common'),
    ('RESET_GRAPH_TENANT_ID','../other'), ('RESET_GRAPH_TENANT_ID',''),
    ('RESET_GRAPH_CLIENT_SECRET',''), ('RESET_GRAPH_CLIENT_SECRET','line\nbreak'),
    ('RESET_GRAPH_SENDER',''), ('RESET_GRAPH_SENDER','Sender <sender@example.test>'),
    ('RESET_GRAPH_SENDER','sender@example.test/other'),
    ('RESET_GRAPH_TIMEOUT',0), ('RESET_GRAPH_TIMEOUT',31),
    ('RESET_TRANSPORT','automatic')])
def test_graph_unsafe_configuration_rejected(tmp_path, key, value):
    with pytest.raises(ValueError, match='Invalid password recovery configuration'):
        create_app({**config(tmp_path), key:value})


@pytest.mark.parametrize('failure', ['token-401','send-403','redirect','oversize','missing-token','invalid-token','http-error','timeout'])
def test_graph_failures_are_generic_revoke_token_never_use_smtp(tmp_path, monkeypatch, caplog, failure):
    import http.client
    import smtplib
    calls = []
    class Connection:
        def __init__(self, host, timeout):
            self.host = host
        def request(self, *args, **kwargs):
            calls.append(self.host)
            if failure == 'http-error':
                raise http.client.HTTPException('fake-private-secret')
            if failure == 'timeout':
                raise TimeoutError('fake-private-secret')
        def getresponse(self):
            class Response:
                status = (401 if failure == 'token-401' else 302 if failure == 'redirect' else
                          403 if failure == 'send-403' and len(calls) == 2 else 200 if len(calls) == 1 else 202)
                def read(self, size):
                    if failure == 'oversize': return b'x' * size
                    if failure == 'missing-token': return b'{}'
                    if failure == 'invalid-token': return b'{"access_token":""}'
                    return b'{"access_token":"fake-access-token","token_type":"Bearer"}'
            return Response()
        def close(self): pass
    monkeypatch.setattr(http.client, 'HTTPSConnection', Connection)
    def forbidden(*a, **kw):
        pytest.fail('SMTP fallback forbidden')
    monkeypatch.setattr(smtplib, 'SMTP', forbidden)
    app = create_app(config(tmp_path))
    client = app.test_client()
    register(client)
    response = request_reset(app, client)
    assert response.status_code == 200
    assert response.text == request_reset(app, client, 'missing@example.test').text
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM password_resets').fetchone()[0] == 0
    assert 'Password recovery delivery failed' in caplog.text
    assert all(value not in caplog.text + response.text for value in
               ['fake-private-secret','fake-access-token','member@example.test'])
    assert len(calls) == (2 if failure == 'send-403' else 1)


# Regression: local web origin never changes fixed HTTPS Graph authorities.
def test_explicit_localhost_origin_with_graph(tmp_path):
    app = create_app({**config(tmp_path), 'RESET_BASE_URL':'http://localhost:8080',
                      'RESET_ALLOW_LOCAL':True, 'COOKIE_SECURE':False})
    assert app.config['RESET_BASE_URL'] == 'http://localhost:8080'
    assert not app.config['COOKIE_SECURE']
    with pytest.raises(ValueError, match='Invalid password recovery configuration'):
        create_app({**config(tmp_path), 'RESET_BASE_URL':'http://localhost:8080', 'RESET_ALLOW_LOCAL':False})
