"""Explicit deployment factory. Tests/QA import app:create_app, never this factory.

No import-time IO or process-environment mutation. Literal KEY=value syntax only.
"""
import os
import re
import stat
from pathlib import Path

ENV_FILE = Path(__file__).resolve().with_name('.env')
ALIASES = {'OUTLOOK_CLIENT_ID': 'RESET_GRAPH_CLIENT_ID',
           'OUTLOOK_TENANT_ID': 'RESET_GRAPH_TENANT_ID',
           'OUTLOOK_CLIENT_SECRET': 'RESET_GRAPH_CLIENT_SECRET',
           'OUTLOOK_USER_EMAIL': 'RESET_GRAPH_SENDER'}


def read_env(path):
    values = {}
    try:
        try:
            fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
        except FileNotFoundError:
            return values
        with os.fdopen(fd, 'r', encoding='utf-8') as stream:
            metadata = os.fstat(stream.fileno())
            if not stat.S_ISREG(metadata.st_mode) or metadata.st_uid != os.getuid() or metadata.st_mode & 0o077:
                raise ValueError
            content = stream.read(65537)
            if len(content) > 65536:
                raise ValueError
        for line in content.splitlines():
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            key, value = line.split('=', 1)
            key, value = key.strip(), value.strip()
            if not re.fullmatch(r'[A-Z][A-Z0-9_]*', key) or key in values:
                raise ValueError
            if value.startswith(('"', "'")):
                if len(value) < 2 or value[-1] != value[0]:
                    raise ValueError
                value = value[1:-1]
            if any(ord(c) < 32 or ord(c) == 127 for c in value):
                raise ValueError
            values[key] = value
    except (OSError, ValueError, UnicodeError):
        raise ValueError('Invalid private environment file') from None
    return values

def create_app():
    import app
    values = read_env(ENV_FILE)
    config = {}
    # Process environment beats file, including aliases across both layers.
    for layer in (values, os.environ):
        for key, value in layer.items():
            if key in ALIASES:
                config[ALIASES[key]] = value
        for key, value in layer.items():
            if key.startswith('APPWORKS_RESET_') or key == 'APPWORKS_COOKIE_SECURE':
                config[key.removeprefix('APPWORKS_')] = value
    try:
        for key, value in config.items():
            if key in ('RESET_ENABLED', 'RESET_ALLOW_LOCAL', 'COOKIE_SECURE'):
                config[key] = value == '1'
            elif key.endswith(('_TIMEOUT', '_PORT')):
                config[key] = int(value)
    except (TypeError, ValueError):
        raise ValueError('Invalid service configuration') from None
    return app.create_app(config)
