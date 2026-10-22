# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS courses
RUN apt-get update && apt-get install -y --no-install-recommends python3 && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY appworks/course_registry.py appworks/course_registry.py
COPY scripts/courses.py scripts/courses.py
COPY courses/ courses/
# Discover enabled manifests; never maintain a second hard-coded course list.
RUN python3 -c "import sys,subprocess; sys.path.insert(0,'appworks'); from course_registry import discover_courses; [subprocess.run(['npm','ci'],cwd=c['course_path'],check=True) for c in discover_courses('courses',strict=True,require_build=False)]"
RUN python3 scripts/courses.py build && python3 scripts/courses.py validate
# Only the manifest, private bank and built public output enter the runtime.
RUN python3 -c "import sys,shutil,pathlib; sys.path.insert(0,'appworks'); from course_registry import discover_courses; [(d.mkdir(parents=True),shutil.copy2(c['course_path']/'course.json',d/'course.json'),shutil.copytree(c['build_path'],d/'dist'),shutil.copy2(c['course_path']/'assessment.json',d/'assessment.json') if (c['course_path']/'assessment.json').exists() else None) for c in discover_courses('courses',strict=True) for d in [pathlib.Path('/release/courses')/c['id']]]"

FROM python:3.13-slim-bookworm AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1     APPWORKS_DATABASE=/data/classroom.sqlite3     APPWORKS_PROFILE_UPLOAD_DIR=/data/profile-photos     APPWORKS_COMMUNITY_UPLOAD_DIR=/data/community-uploads
WORKDIR /app/appworks
COPY appworks/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt     && groupadd --gid 10001 classroom     && useradd --uid 10001 --gid classroom --no-create-home classroom     && mkdir -p /data/profile-photos /data/community-uploads     && chown -R classroom:classroom /data
COPY appworks/*.py ./
COPY appworks/templates/ ./templates/
COPY appworks/platform-assets/ ./platform-assets/
COPY --from=courses /release/courses/ /app/courses/
USER 10001:10001
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3     CMD ["python", "-c", "import urllib.request; r=urllib.request.urlopen('http://127.0.0.1:8080/healthz',timeout=3); assert r.status == 200"]
CMD ["waitress-serve", "--listen=0.0.0.0:8080", "--threads=4", "--call", "service:create_app"]
