import os
from pathlib import Path
import pytest
import app


def test_explicit_service_entry_loads_private_env_process_wins_without_mutation(tmp_path, monkeypatch):
    import service
    path = tmp_path/'.env'
    path.write_text('# comment\nOUTLOOK_CLIENT_ID=file-id\nOUTLOOK_CLIENT_SECRET="literal$secret#value"\nAPPWORKS_RESET_ENABLED=0\nAPPWORKS_RESET_BASE_URL=\n')
    path.chmod(0o600)
    monkeypatch.setenv('OUTLOOK_CLIENT_ID', 'process-id')
    monkeypatch.delenv('OUTLOOK_CLIENT_SECRET', raising=False)
    monkeypatch.setattr(service, 'ENV_FILE', path)
    captured = []
    monkeypatch.setattr(app, 'create_app', lambda config: captured.append(config) or 'app')
    assert service.create_app() == 'app'
    assert captured[0]['RESET_GRAPH_CLIENT_ID'] == 'process-id'
    assert captured[0]['RESET_GRAPH_CLIENT_SECRET'] == 'literal$secret#value'
    assert captured[0]['RESET_ENABLED'] is False
    assert 'OUTLOOK_CLIENT_SECRET' not in os.environ


def test_test_and_qa_factory_never_loads_deployment_env(tmp_path, monkeypatch):
    import service
    path = tmp_path/'.env'
    path.write_text('APPWORKS_RESET_ENABLED=1\nOUTLOOK_CLIENT_SECRET=private-sentinel\n')
    path.chmod(0o600)
    monkeypatch.setattr(service, 'ENV_FILE', path)
    for testing in (True, False):
        instance = app.create_app({'TESTING':testing, 'DATABASE':str(tmp_path/f'{testing}.sqlite3')})
        assert not instance.config['RESET_ENABLED']
        assert instance.config['RESET_GRAPH_CLIENT_SECRET'] != 'private-sentinel'


@pytest.mark.parametrize('kind', ['permissions','symlink','malformed','duplicate','unclosed','export','oversize'])
def test_private_env_rejects_unsafe_file_without_value_disclosure(tmp_path, kind):
    import service
    path = tmp_path/'.env'
    path.write_text('OUTLOOK_CLIENT_SECRET=private-sentinel\n')
    path.chmod(0o600)
    if kind == 'permissions': path.chmod(0o644)
    if kind == 'symlink':
        target = tmp_path/'target'
        path.rename(target)
        path.symlink_to(target)
    if kind == 'malformed': path.write_text('private-sentinel\n')
    if kind == 'duplicate': path.write_text('OUTLOOK_CLIENT_SECRET=a\nOUTLOOK_CLIENT_SECRET=private-sentinel\n')
    if kind == 'unclosed': path.write_text('OUTLOOK_CLIENT_SECRET="private-sentinel\n')
    if kind == 'export': path.write_text('export OUTLOOK_CLIENT_SECRET=private-sentinel\n')
    if kind == 'oversize': path.write_text('OUTLOOK_CLIENT_SECRET='+'x'*65537)
    with pytest.raises(ValueError, match='Invalid private environment file') as error:
        service.read_env(path)
    assert 'private-sentinel' not in str(error.value)


# Characterization: implemented precedence/alias rules, not additional RED evidence.
@pytest.mark.parametrize('process_key,file_key', [
    ('OUTLOOK_CLIENT_ID','APPWORKS_RESET_GRAPH_CLIENT_ID'),
    ('APPWORKS_RESET_GRAPH_CLIENT_ID','OUTLOOK_CLIENT_ID'),
    ('OUTLOOK_CLIENT_ID','OUTLOOK_CLIENT_ID')])
def test_process_precedence_across_aliases(tmp_path, monkeypatch, process_key, file_key):
    import service
    path = tmp_path/'.env'
    path.write_text(file_key+'=file-id\n')
    path.chmod(0o600)
    for key in ('OUTLOOK_CLIENT_ID','APPWORKS_RESET_GRAPH_CLIENT_ID'):
        monkeypatch.delenv(key, raising=False)
    monkeypatch.setenv(process_key,'process-id')
    monkeypatch.setattr(service,'ENV_FILE',path)
    monkeypatch.setattr(app,'create_app',lambda config: config)
    assert service.create_app()['RESET_GRAPH_CLIENT_ID'] == 'process-id'


def test_environment_aliases_configure_graph_without_dotenv(tmp_path, monkeypatch):
    from test_password_reset_graph import CLIENT, TENANT
    for key, value in {'OUTLOOK_CLIENT_ID':CLIENT,'OUTLOOK_TENANT_ID':TENANT,
                       'OUTLOOK_CLIENT_SECRET':'qa-secret','OUTLOOK_USER_EMAIL':'sender@example.test',
                       'APPWORKS_RESET_TRANSPORT':'graph','APPWORKS_RESET_ENABLED':'1',
                       'APPWORKS_RESET_BASE_URL':'https://example.test'}.items():
        monkeypatch.setenv(key,value)
    instance = app.create_app({'TESTING':True,'DATABASE':str(tmp_path/'aliases.sqlite3')})
    assert instance.config['RESET_GRAPH_CLIENT_ID'] == CLIENT
    assert instance.config['RESET_GRAPH_TENANT_ID'] == TENANT
    assert instance.config['RESET_GRAPH_CLIENT_SECRET'] == 'qa-secret'
    assert instance.config['RESET_GRAPH_SENDER'] == 'sender@example.test'
