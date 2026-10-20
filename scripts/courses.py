#!/usr/bin/env python3
"""Validate manifests or build trusted local courses for Classroom."""
import argparse
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'appworks'))
from course_registry import discover_courses


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=('validate', 'build'))
    args = parser.parse_args()
    try:
        courses = discover_courses(ROOT / 'courses', strict=True, require_build=args.command != 'build')
        for course in courses:
            if args.command == 'build':
                env = {**os.environ, 'VITE_CLASSROOM_URL': '/',
                       'VITE_CLASSROOM_PROGRESS_URL': f"/api/courses/{course['id']}/progress" if 'lessons' in course else ''}
                subprocess.run(['npm', 'run', 'build', '--', '--base', f"/courses/{course['id']}/"], cwd=course['course_path'], env=env, check=True)
            print(f"OK {course['id']}: /courses/{course['id']}/", flush=True)
        discover_courses(ROOT / 'courses', strict=True)
        return 0
    except (ValueError, OSError, subprocess.CalledProcessError) as exc:
        print(str(exc), file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
