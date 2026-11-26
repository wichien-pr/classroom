"""Portable QA must not depend on a developer home or private deployment."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_cto_qa_has_no_host_paths_and_declares_isolation():
    runner = (ROOT / 'scripts/cto-polling-browser-verify.mjs').read_text()
    server = (ROOT / 'scripts/cto-email-role-qa-server.py').read_text()
    for text in (runner, server):
        assert '/Users/' not in text
    assert 'QA_SCRATCH_ROOT' in runner and 'QA_SCRATCH_ROOT' in server
    assert 'QA_PYTHON_ARCH' in runner
    assert 'fileURLToPath' in runner
    assert 'APPWORKS_' in runner and 'CTO_REVIEWER_' in runner
    assert 'serverStopped' in runner and 'listenerClosed' in runner
