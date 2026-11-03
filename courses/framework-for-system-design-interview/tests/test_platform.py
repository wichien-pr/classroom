"""Regression coverage against the live registry and unmodified build pipeline.
Run from any directory: python3 <course>/tests/test_platform.py
Build pipeline tests use a disposable copy of the enabled LAB01 course.
"""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

COURSE = Path(__file__).resolve().parents[1]
ROOT = COURSE.parents[1]
sys.path.insert(0, str(ROOT / 'appworks'))
from course_registry import discover_courses


class FrameworkPlatformTests(unittest.TestCase):
    def test_enabled_course_is_discoverable(self):
        for require_build in (False, True):
            courses = discover_courses(ROOT / 'courses', strict=True, require_build=require_build)
            self.assertIn(COURSE.name, [course['id'] for course in courses])

    def test_real_pipeline_builds_isolated_copy_with_private_bank(self):
        cache = COURSE / 'node_modules' / '.cache'
        cache.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(prefix='pipeline-', dir=cache) as directory:
            isolated = Path(directory)
            (isolated / 'scripts').mkdir()
            (isolated / 'appworks').mkdir()
            shutil.copy2(ROOT / 'scripts/courses.py', isolated / 'scripts/courses.py')
            shutil.copy2(ROOT / 'appworks/course_registry.py', isolated / 'appworks/course_registry.py')
            target = isolated / 'courses' / COURSE.name
            shutil.copytree(COURSE, target, ignore=shutil.ignore_patterns('node_modules', 'dist', 'tests'))
            (target / 'node_modules').symlink_to(COURSE / 'node_modules', target_is_directory=True)
            manifest = json.loads((target / 'course.json').read_text())
            self.assertTrue(manifest['enabled'])
            (target / 'course.json').write_text(json.dumps(manifest))
            for command in ('build', 'validate'):
                result = subprocess.run([sys.executable, str(isolated / 'scripts/courses.py'), command],
                                        cwd=isolated, text=True, capture_output=True, env=os.environ.copy())
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                print(result.stdout)
            html = (target / 'dist/index.html').read_text()
            self.assertIn(f'/courses/{COURSE.name}/assets/', html)
            self.assertNotIn('/src/main.js', html)
            built = discover_courses(isolated / 'courses', strict=True)
            self.assertEqual(len(built), 1)
            self.assertEqual(built[0]['lessons'], ['framework-scope'])
            self.assertFalse((target / 'dist/assessment.json').exists())
            self.assertTrue(json.loads((COURSE / 'course.json').read_text())['enabled'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
