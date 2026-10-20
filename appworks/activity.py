"""Minimal deduplicated activity facts, not a clickstream. Server timestamps only."""
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import time

ZONE = ZoneInfo('Asia/Bangkok')


def calendar(db, user_id, now):
    today = local_day(now)
    start = today - timedelta(days=today.weekday() + 52 * 7)
    inception = db.execute('SELECT started_at FROM activity_tracking WHERE id=1').fetchone()[0]
    first = local_day(inception)
    totals = {}
    for row in db.execute('''SELECT day,kind,count(*) AS n FROM activity_events
            WHERE user_id=? AND day>=? AND day<=? GROUP BY day,kind''',
            (user_id, start.isoformat(), today.isoformat())):
        totals.setdefault(row['day'], {})[row['kind']] = row['n']
    weeks, months = [], []
    active30 = learning30 = 0
    for w in range(53):
        week = []
        for weekday in range(7):
            day = start + timedelta(days=w*7+weekday)
            counts = {k:totals.get(day.isoformat(), {}).get(k, 0) for k in ('login','course_open','lesson_completed')}
            total = sum(counts.values())
            state = 'future' if day > today else 'unknown' if day < first else 'active' if total else 'inactive'
            level = 0 if not total else 1 if total <= 2 else 2 if total <= 4 else 3 if total <= 7 else 4
            if today-timedelta(days=29) <= day <= today:
                active30 += bool(total)
                learning30 += bool(counts['course_open'] or counts['lesson_completed'])
            week.append(dict(date=day.isoformat(), state=state, total=total, level=level, **counts))
            if day.day == 1:
                months.append(dict(column=w+1, label=day.strftime('%b')))
        weeks.append(week)
    return dict(weeks=weeks, months=months, today=today.isoformat(), started=first.isoformat(),
                started_at=datetime.fromtimestamp(inception, ZONE).isoformat(timespec='seconds'),
                active30=active30, learning30=learning30)


def local_day(timestamp):
    return datetime.fromtimestamp(timestamp, ZONE).date()


def install(connect):
    with connect() as db:
        db.execute('CREATE TABLE IF NOT EXISTS activity_tracking (id INTEGER PRIMARY KEY CHECK(id=1), started_at REAL NOT NULL)')
        db.execute('INSERT OR IGNORE INTO activity_tracking VALUES(1,?)', (time.time(),))
        db.execute('''CREATE TABLE IF NOT EXISTS activity_events (
            user_id INTEGER NOT NULL, day TEXT NOT NULL, kind TEXT NOT NULL
            CHECK(kind IN ('login','course_open','lesson_completed')),
            subject TEXT NOT NULL, observed_at REAL NOT NULL,
            PRIMARY KEY(user_id,day,kind,subject))''')


def record(db, user_id, kind, subject=''):
    now = time.time()
    db.execute('INSERT OR IGNORE INTO activity_events VALUES(?,?,?,?,?)',
               (user_id, local_day(now).isoformat(), kind, subject, now))
