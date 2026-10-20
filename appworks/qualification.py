"""Current manifest qualification shared by progress, levels and exam eligibility."""


def lesson_criteria(db, user_id, course):
    if not course.get('completion_requirements'):
        return {}
    manual = {r['lesson_id'] for r in db.execute(
        'SELECT lesson_id FROM lesson_manual_completion WHERE user_id=? AND course_id=?', (user_id, course['id']))}
    awards = db.execute('SELECT lesson_id,simulation_id,action FROM participation_awards_v2 WHERE user_id=? AND course_id=?',
                        (user_id, course['id'])).fetchall()
    result = {}
    for lesson in course['lessons']:
        allowed = course['participation'][lesson]
        actions = {(r['simulation_id'], r['action']) for r in awards if r['lesson_id'] == lesson
                   and r['action'] in allowed.get(r['simulation_id'], [])}
        result[lesson] = dict(manual=lesson in manual,
            simulation=any(s != 'check-your-thinking' for s, a in actions),
            thinking=any(s == 'check-your-thinking' and a in ('quiz-answer-a', 'quiz-answer-b') for s, a in actions))
    return result


def qualified_lessons(db, user_id, course):
    if course.get('completion_requirements'):
        return [lesson for lesson, criteria in lesson_criteria(db, user_id, course).items() if all(criteria.values())]
    saved = {r['lesson_id'] for r in db.execute(
        'SELECT lesson_id FROM lesson_progress WHERE user_id=? AND course_id=?', (user_id, course['id']))}
    return [lesson for lesson in course.get('lessons', []) if lesson in saved]
