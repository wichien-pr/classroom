"""Validated local static manifests; never import or execute course code."""
import json
import re
from pathlib import Path


def contained_path(root, relative):
    if not isinstance(relative, str) or not relative or '\\' in relative:
        raise ValueError('invalid relative path')
    parts = relative.split('/')
    if any(not p or p.startswith('.') for p in parts):
        raise ValueError('hidden, absolute or traversal path')
    root = Path(root).resolve()
    path = root.joinpath(*parts)
    if not path.resolve().is_relative_to(root) or any(root.joinpath(*parts[:i]).is_symlink() for i in range(1, len(parts) + 1)):
        raise ValueError('symlink or escaping path')
    return path


def discover_courses(root, *, strict=False, require_build=True):
    root = Path(root).resolve()
    courses, errors, ids = [], [], set()
    for manifest in sorted(root.glob('*/course.json')):
        try:
            directory = contained_path(root, manifest.parent.name)
            source = contained_path(directory, 'course.json')
            data = json.loads(source.read_text(encoding='utf-8'))
            if not isinstance(data, dict):
                raise ValueError('manifest must be an object')
            identifier = data.get('id')
            if not isinstance(identifier, str) or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', identifier) or identifier != directory.name or identifier in ids:
                raise ValueError('id must be unique, safe and match directory')
            ids.add(identifier)
            if type(data.get('enabled')) is not bool or type(data.get('order')) is not int:
                raise ValueError('enabled must be boolean; order must be integer')
            if any(not isinstance(data.get(k), str) or not data[k].strip() for k in ('title', 'subtitle')) or data.get('delivery') != 'static':
                raise ValueError('title/subtitle and static delivery required')
            if 'lessons' in data:
                lessons = data['lessons']
                if (not isinstance(lessons, list) or not lessons or
                    any(not isinstance(x, str) or len(x) > 80 or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', x) for x in lessons) or
                    len(set(lessons)) != len(lessons)):
                    raise ValueError('lessons must be a nonempty list of unique stable IDs (max 80 characters)')
            if 'participation' in data:
                definitions = data['participation']
                def safe_id(value):
                    return isinstance(value, str) and len(value) <= 80 and re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', value)
                if not isinstance(definitions, dict) or not definitions or len(definitions) > 200:
                    raise ValueError('participation must declare lesson simulations')
                for lesson, simulations in definitions.items():
                    if lesson not in data.get('lessons', []) or not isinstance(simulations, dict) or not 1 <= len(simulations) <= 50:
                        raise ValueError('participation lesson must exist and declare simulations')
                    for simulation, actions in simulations.items():
                        if (not safe_id(simulation) or not isinstance(actions, list) or not 1 <= len(actions) <= 50
                            or any(not safe_id(action) for action in actions) or len(set(actions)) != len(actions)):
                            raise ValueError('participation actions must be unique stable IDs')
            if 'completion_requirements' in data:
                if data['completion_requirements'] != ['manual', 'simulation', 'thinking'] or not data.get('lessons'):
                    raise ValueError('completion_requirements must be manual, simulation, thinking')
                for lesson in data['lessons']:
                    simulations = data.get('participation', {}).get(lesson, {})
                    if (not any(s != 'check-your-thinking' for s in simulations)
                        or not {'quiz-answer-a', 'quiz-answer-b'} <= set(simulations.get('check-your-thinking', []))):
                        raise ValueError('completion_requirements need simulation and both thinking choices for every lesson')
            # A dedicated output directory is mandatory; never serve source root.
            if data.get('build_dir') != 'dist':
                raise ValueError('build_dir must be dist')
            build = contained_path(directory, data['build_dir'])
            entry = contained_path(build, data.get('entry'))
            if entry.suffix != '.html':
                raise ValueError('entry must be HTML')
            if require_build and data['enabled'] and not entry.is_file():
                raise ValueError('build entry missing')
            if data['enabled']:
                courses.append({**data, 'build_path': build, 'course_path': directory})
        except (OSError, ValueError, TypeError, RuntimeError) as exc:
            errors.append(f'{manifest}: {exc}')
    if strict and errors:
        raise ValueError('\n'.join(errors))
    return sorted(courses, key=lambda c: (c['order'], c['id']))
