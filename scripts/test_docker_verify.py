"""Safety tests: all Docker and HTTP boundaries are mocked; no live writes."""
import copy
import importlib.util
import json
import os
from pathlib import Path
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).with_name('docker-verify.py')


def load_runner():
    spec = importlib.util.spec_from_file_location('docker_verify', SCRIPT)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    with patch('subprocess.run', side_effect=AssertionError('Docker during import')), patch('urllib.request.OpenerDirector.open', side_effect=AssertionError('HTTP during import')):
        spec.loader.exec_module(module)
    return module


class SafetyTests(unittest.TestCase):
    def test_requires_explicit_opt_in_before_any_io(self):
        runner = load_runner()
        with patch.object(runner, 'command') as command, patch.object(runner, 'request') as request, patch.object(runner, 'inside') as inside:
            with self.assertRaises(SystemExit):
                runner.main([])
            command.assert_not_called()
            request.assert_not_called()
            inside.assert_not_called()

    def test_rejects_unsafe_metadata_before_http_or_exec(self):
        valid = {
            'mounts': [{'Type': 'volume', 'Name': 'classroom-container-smoke-data', 'Destination': '/data', 'RW': True}],
            'project': 'classroom-container-smoke', 'service': 'classroom',
            'ports': {'8080/tcp': [{'HostIp': '127.0.0.1', 'HostPort': '8083'}]},
        }
        cases = []
        for key, value in [('Name', 'classroom-accounts-20261022'), ('Name', 'other'), ('Type', 'bind'), ('Destination', '/other'), ('RW', False)]:
            case = copy.deepcopy(valid)
            case['mounts'][0][key] = value
            cases.append(case)
        for key, value in [('project', 'classroom-docker-qa'), ('service', 'other'), ('ports', {'8080/tcp': [{'HostIp': '127.0.0.1', 'HostPort': '8082'}]}), ('ports', {'8080/tcp': [{'HostIp': '0.0.0.0', 'HostPort': '8083'}]}), ('mounts', []), ('mounts', valid['mounts'] * 2), ('ports', {} )]:
            cases.append({**valid, key: value})
        cases.append({})
        for metadata in cases:
            with self.subTest(metadata=metadata):
                runner = load_runner()
                with patch.object(runner, 'command', side_effect=['abc123', json.dumps(metadata)]) as command, patch.object(runner, 'inside') as inside, patch.object(runner, 'request') as request:
                    with self.assertRaisesRegex(RuntimeError, 'Unsafe QA target'):
                        runner.main(['--allow-destructive-qa'])
                    inside.assert_not_called()
                    request.assert_not_called()
                    self.assertEqual(command.call_count, 2)
                    self.assertEqual(command.call_args.args[0][:3], ['docker', 'inspect', '--format'])
                    self.assertNotIn('.Config.Env', command.call_args.args[0][3])

    def test_valid_metadata_reaches_exec_only_after_inspection(self):
        runner = load_runner()
        metadata = {'mounts': [{'Type': 'volume', 'Name': runner.VOLUME, 'Destination': '/data', 'RW': True}], 'project': runner.PROJECT, 'service': 'classroom', 'ports': {'8080/tcp': [{'HostIp': '127.0.0.1', 'HostPort': '8083'}]}}
        metadata['mounts'].append({'Type': 'tmpfs', 'Destination': '/tmp', 'RW': True})
        class ReachedExec(Exception):
            pass
        with patch.object(runner, 'command', side_effect=['abc123', json.dumps(metadata)]) as command, patch.object(runner, 'inside', side_effect=ReachedExec) as inside, patch.object(runner, 'request') as request:
            with self.assertRaises(ReachedExec):
                runner.main(['--allow-destructive-qa'])
            self.assertEqual(command.call_count, 2)
            inside.assert_called_once()
            request.assert_not_called()

    def test_missing_or_multiple_containers_fail_before_inspect_or_mutation(self):
        for container in ['', 'abc123\ndef456']:
            runner = load_runner()
            with patch.object(runner, 'command', return_value=container) as command, patch.object(runner, 'inside') as inside, patch.object(runner, 'request') as request:
                with self.assertRaisesRegex(RuntimeError, 'Unsafe QA target'):
                    runner.main(['--allow-destructive-qa'])
                command.assert_called_once()
                inside.assert_not_called()
                request.assert_not_called()

    def test_recreation_revalidates_target_before_and_after_up(self):
        runner = load_runner()
        self.assertTrue(callable(getattr(runner, 'recreate', None)), 'Recreation needs a verified boundary')
        events = []
        def verify():
            events.append('verify')
            return 'abc123'
        with patch.object(runner, 'preflight', side_effect=verify), patch.object(runner, 'command', side_effect=lambda args: events.append('up')):
            self.assertEqual(runner.recreate(), 'abc123')
        self.assertEqual(events, ['verify', 'up', 'verify'])
        with patch.object(runner, 'preflight', side_effect=RuntimeError('Unsafe QA target')), patch.object(runner, 'command') as command:
            with self.assertRaisesRegex(RuntimeError, 'Unsafe QA target'):
                runner.recreate()
            command.assert_not_called()

    def test_compose_recreation_ignores_ambient_deployment_settings(self):
        runner = load_runner()
        hostile = {'CLASSROOM_DATA_VOLUME': 'classroom-accounts-20261022', 'CLASSROOM_PORT': '8082', 'CLASSROOM_BIND_IP': '0.0.0.0', 'CLASSROOM_ENV_FILE': '/private/real-mail.env'}
        with patch.dict(os.environ, hostile), patch.object(runner.subprocess, 'run') as run:
            runner.command(runner.COMPOSE + ['up', '-d', '--force-recreate'])
            env = run.call_args.kwargs.get('env', os.environ)
            self.assertEqual(env['CLASSROOM_DATA_VOLUME'], 'classroom-container-smoke-data')
            self.assertEqual(env['CLASSROOM_PORT'], '8083')
            self.assertEqual(env['CLASSROOM_BIND_IP'], '127.0.0.1')
            self.assertEqual(env['CLASSROOM_ENV_FILE'], str(runner.ROOT / 'docker/runtime.env.example'))
            self.assertIn('classroom-container-smoke', run.call_args.args[0])


if __name__ == '__main__':
    unittest.main()
