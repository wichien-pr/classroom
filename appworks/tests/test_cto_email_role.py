"""Email authority uses authenticated stored identities, never request fields."""
import sqlite3
import pytest
from app import create_app
from test_cto_project import setup, post, command, API

EMAIL = 'wichien@appworks.co.th'


def email_client(config, uid, **overrides):
    app = create_app({**config, 'CTO_REVIEWER_IDS': '', 'CTO_REVIEWER_EMAILS': EMAIL, **overrides})
    client = app.test_client()
    client.set_cookie('aw_session', f'cto-qa-{uid}')
    return client


def test_email_authority_is_stored_identity_and_union_with_ids(setup):
    app, config, client = setup
    with sqlite3.connect(config['DATABASE']) as db:
        db.execute('UPDATE users SET email=? WHERE id=3', (EMAIL,))
    reviewer = email_client(config, 3)
    assert reviewer.get(API).json['reviewer'] is True
    assert email_client(config, 2).get(API).json['reviewer'] is False
    assert email_client(config, 2, CTO_REVIEWER_IDS='2').get(API).json['reviewer'] is True
    learner = client(1)
    post(learner, 1, {'action': 'start'})
    post(learner, 1, command('submit', evidence='proof', reflection='checked'))
    approval = command('approved', version=1, feedback='verified')
    assert post(email_client(config, 2), 2, approval, API+'/review/1').status_code == 403
    assert post(email_client(config, 2), 2, {**approval, 'email': EMAIL}, API+'/review/1').status_code == 403
    assert post(reviewer, 3, approval, API+'/review/1').status_code == 200
    assert post(reviewer, 3, approval, API+'/review/1').status_code == 200
    assert post(reviewer, 3, {**approval, 'feedback': 'conflict'}, API+'/review/1').status_code == 409
    post(reviewer, 3, {'action': 'start'})
    post(reviewer, 3, command('submit', evidence='own', reflection='own'))
    assert all(p['user_id'] != 3 for p in reviewer.get(API+'/review').json['projects'])
    assert post(reviewer, 3, approval, API+'/review/3').status_code == 403
    with sqlite3.connect(config['DATABASE']) as db:
        db.execute('UPDATE users SET email=? WHERE id=3', ('other@example.invalid',))
    assert reviewer.get(API).json['reviewer'] is False
    assert reviewer.get(API+'/review').status_code == 403


@pytest.mark.parametrize('key', ['CTO_REVIEWER_EMAILS', 'APPWORKS_CTO_REVIEWER_EMAILS'])
def test_private_env_and_process_precedence(setup, monkeypatch, tmp_path, key):
    import service
    _, config, _ = setup
    with sqlite3.connect(config['DATABASE']) as db:
        db.execute('UPDATE users SET email=? WHERE id=3', (EMAIL,))
    env = tmp_path / '.env'
    env.write_text(f'{key}={EMAIL}\n')
    env.chmod(0o600)
    monkeypatch.setattr(service, 'ENV_FILE', env)
    monkeypatch.setenv('APPWORKS_DATABASE', config['DATABASE'])
    monkeypatch.delenv('CTO_REVIEWER_EMAILS', raising=False)
    monkeypatch.delenv('APPWORKS_CTO_REVIEWER_EMAILS', raising=False)
    c = service.create_app().test_client()
    c.set_cookie('aw_session', 'cto-qa-3')
    assert c.get(API).json['reviewer'] is True
    monkeypatch.setenv('APPWORKS_CTO_REVIEWER_EMAILS', '')
    c = service.create_app().test_client()
    c.set_cookie('aw_session', 'cto-qa-3')
    assert c.get(API).json['reviewer'] is False
