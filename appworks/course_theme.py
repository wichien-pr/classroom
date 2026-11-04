"""Shared preference only; each trusted course owns its own palette CSS."""
import re
from flask import g, request, render_template


def install(app):
    @app.after_request
    def course_theme(response):
        if (g.user and request.endpoint == 'course_file' and request.method == 'GET'
                and response.status_code == 200 and response.mimetype == 'text/html'):
            response.direct_passthrough = False
            html = response.get_data(as_text=True)
            bootstrap = render_template('theme-head.html')
            html = re.sub(r'(<head\b[^>]*>)', lambda match: match[0] + bootstrap,
                          html, count=1, flags=re.IGNORECASE)
            response.set_data(html)
            for key in ('ETag', 'Last-Modified', 'Accept-Ranges'):
                response.headers.pop(key, None)
        return response
