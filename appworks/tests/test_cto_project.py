import hashlib
import sqlite3
import time
import uuid
import pytest
from app import create_app

API = '/api/cto-project'

@pytest.fixture
def setup(tmp_path):
    config = {'TESTING': True, 'DATABASE': str(tmp_path / 'qa.sqlite3'), 'CTO_REVIEWER_IDS': [3]}
    app = create_app(config)
    with sqlite3.connect(config['DATABASE']) as db:
        for uid in (1, 2, 3):
            db.execute('INSERT INTO users(id,name,email,password_hash) VALUES(?,?,?,?)', (uid, f'QA {uid}', f'qa{uid}@example.invalid', '!'))
            db.execute('INSERT INTO sessions VALUES(?,?,?,?)', (hashlib.sha256(f'cto-qa-{uid}'.encode()).hexdigest(), uid, f'csrf-{uid}', time.time()+3600))
    def client(uid):
        c = app.test_client()
        c.set_cookie('aw_session', f'cto-qa-{uid}')
        return c
    return app, config, client

def post(c, uid, data, path=API):
    return c.post(path, json=data, headers={'X-CSRF-Token': f'csrf-{uid}'})

def command(action, step=1, version=0, **extra):
    return dict(action=action, step=step, version=version, request_id=str(uuid.uuid4()), **extra)

def test_review_gates_next_step_and_keeps_immutable_history(setup):
    app, config, client = setup
    c, reviewer = client(1), client(3)
    post(c, 1, {'action': 'start'})
    evidence = command('submit', evidence='Meeting notes and acceptance examples', reflection='AI proposed scope; I corrected it')
    submitted = post(c, 1, evidence)
    assert submitted.status_code == 200
    assert submitted.json['steps'][0]['state'] == 'submitted'
    assert post(c, 1, evidence).status_code == 200
    assert post(c, 1, command('save', step=2, evidence='locked', reflection='x')).status_code == 409
    review = command('changes_requested', version=1, feedback='Add failure case')
    assert post(c, 1, review, API+'/review/1').status_code == 403
    assert post(reviewer, 3, review, API+'/review/1').status_code == 200
    assert c.get(API).json['steps'][0]['feedback'] == 'Add failure case'
    assert post(c, 1, command('submit', version=2, evidence='Revised with failure', reflection='Checked AI')).status_code == 200
    assert post(reviewer, 3, command('approved', version=3, feedback='Meets agreed scope'), API+'/review/1').status_code == 200
    state = c.get(API).json
    assert state['steps'][1]['unlocked']
    assert len(state['history']) == 4
    assert state['history'][0]['evidence'] == evidence['evidence']
    assert post(c, 1, command('save', version=4, evidence='mutate', reflection='x')).status_code == 409
    assert client(2).get(API).json['history'] == []
    assert reviewer.get(API+'/review').json['projects'][0]['user_id'] == 1
    assert c.get(API+'/review').status_code == 403


def test_catalog_and_authenticated_course(setup):
    app, config, client = setup
    c = client(1)
    assert b'/courses/cto-project-lab/' in c.get('/').data
    page = c.get('/courses/cto-project-lab/')
    assert page.status_code == 200
    assert b'CTO Project Lab' in page.data
    assert app.test_client().get('/courses/cto-project-lab/').status_code == 303
    assert c.get('/api/courses/cto-project-lab/progress').status_code == 404


@pytest.mark.parametrize('action', ['start', 'save'])
def test_csrf_origin_and_guest_rejected(setup, action):
    app, config, client = setup
    c = client(1)
    data = {'action': action}
    assert c.post(API, json=data).status_code == 403
    assert c.post(API, json=data, headers={'X-CSRF-Token':'csrf-1', 'Origin':'https://evil.invalid'}).status_code == 403
    assert app.test_client().get(API).status_code == 401
    assert c.get(API).json['project'] is None


def test_reviewer_default_empty_and_no_self_approval(setup):
    app, config, client = setup
    reviewer = client(3)
    post(reviewer, 3, {'action':'start'})
    post(reviewer, 3, command('submit', evidence='own', reflection='reviewed'))
    assert post(reviewer, 3, command('approved', version=1, feedback='own'), API+'/review/3').status_code == 403
    isolated = create_app({**config, 'CTO_REVIEWER_IDS': ''}).test_client()
    isolated.set_cookie('aw_session','cto-qa-3')
    assert isolated.get(API+'/review').status_code == 403
    assert not isolated.get(API).json['reviewer']


def test_full_seven_step_workflow_and_score_isolation(setup):
    app, config, client = setup
    learner, reviewer = client(1), client(3)
    post(learner,1,{'action':'start'})
    for step in range(1,8):
        assert post(learner,1,command('submit',step=step,evidence=f'actual artifact {step}',reflection='AI checked')).status_code == 200
        assert post(reviewer,3,command('approved',step=step,version=1,feedback='verified'),API+'/review/1').status_code == 200
    snapshot=learner.get(API).json
    assert all(s['state']=='approved' for s in snapshot['steps'])
    assert len(snapshot['history'])==14
    with sqlite3.connect(config['DATABASE']) as db:
        for table in ('lesson_progress','participation_awards_v2','exam_attempts'):
            assert db.execute(f'SELECT count(*) FROM {table}').fetchone()[0]==0
        with pytest.raises(sqlite3.IntegrityError, match='immutable history'):
            db.execute('DELETE FROM cto_history')


def test_concurrent_start_save_review_and_receipt_conflict(setup):
    from concurrent.futures import ThreadPoolExecutor
    app, config, client=setup
    def start(_):
        return post(client(1),1,{'action':'start'}).json['project']
    with ThreadPoolExecutor(max_workers=4) as pool:
        projects=list(pool.map(start,range(4)))
    assert all(p==projects[0] for p in projects)
    payload=command('save',evidence='original',reflection='checked')
    def save(_):
        return post(client(1),1,payload).status_code
    with ThreadPoolExecutor(max_workers=4) as pool:
        assert list(pool.map(save,range(4)))==[200]*4
    assert post(client(1),1,{**payload,'evidence':'changed'}).status_code==409
    assert post(client(1),1,command('save',evidence='stale',reflection='x')).status_code==409
    assert post(client(2),2,{**payload,'user_id':1}).status_code==400
    assert post(client(1),1,command('submit',version=1,evidence='ready',reflection='checked')).status_code==200
    def review(decision):
        return post(client(3),3,command(decision,version=2,feedback='checked'),API+'/review/1').status_code
    with ThreadPoolExecutor(max_workers=2) as pool:
        assert sorted(pool.map(review,['approved','changes_requested']))==[200,409]
    with sqlite3.connect(config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM cto_projects').fetchone()[0]==1
        assert db.execute('SELECT count(*) FROM cto_history').fetchone()[0]==3


@pytest.mark.parametrize('patch', [{'step':True},{'version':True},{'request_id':'bad'},{'evidence':''},{'reflection':''},{'evidence':'x'*3001},{'action':'approved'}])
def test_invalid_submissions_preserve_draft(setup,patch):
    app,config,client=setup
    c=client(1)
    post(c,1,{'action':'start'})
    assert post(c,1,{**command('submit',evidence='notes',reflection='checked'),**patch}).status_code==400
    assert c.get(API).json['steps'][0]['version']==0


@pytest.mark.parametrize('template_index', range(4))
def test_each_project_template_is_bounded_and_snapshotted(setup, monkeypatch, template_index):
    import cto_project
    app, config, client = setup
    template=cto_project.TEMPLATES[template_index]
    monkeypatch.setattr(cto_project.secrets, 'choice', lambda items: template)
    c=client(1)
    assigned=post(c,1,{'action':'start'}).json
    assert assigned['project']['id']==template['id']
    assert assigned['project']['requirements'] and assigned['project']['examples']
    assert 'CLI' in assigned['steps'][2]['tasks']
    monkeypatch.setattr(cto_project.secrets, 'choice', lambda items: {'id':'changed'})
    assert post(c,1,{'action':'start'}).json['project']==assigned['project']


def test_maximum_thai_evidence_fits_request_contract(setup):
    app, config, client = setup
    c = client(1)
    post(c,1,{'action':'start'})
    payload=command('save',evidence='ก'*3000,reflection='ข'*3000)
    assert post(c,1,payload).status_code == 200
    assert c.get(API).json['steps'][0]['evidence']==payload['evidence']


def test_start_is_explicit_durable_and_account_owned(setup):
    app, config, client = setup
    c = client(1)
    initial = c.get(API)
    assert initial.status_code == 200
    assert initial.json['project'] is None
    started = post(c, 1, {'action': 'start'}).json
    assert started['project']['difficulty'] == 3
    assert started['project']['kind'] in ('web', 'batch')
    assert len(started['steps']) == 7
    assert post(c, 1, {'action': 'start'}).json['project'] == started['project']
    assert client(2).get(API).json['project'] is None
    restarted = create_app(config).test_client()
    restarted.set_cookie('aw_session', 'cto-qa-1')
    assert restarted.get(API).json['project'] == started['project']
