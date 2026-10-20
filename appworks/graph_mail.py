"""App-only Microsoft Graph sendMail. Fixed authorities; no redirects or retries."""
import http.client
import json
import re
from urllib.parse import urlencode, quote


def post(host, path, body, headers, timeout, expected):
    connection = http.client.HTTPSConnection(host, timeout=timeout)
    try:
        connection.request('POST', path, body=body, headers=headers)
        response = connection.getresponse()
        data = response.read(65537)
        if response.status != expected or len(data) > 65536:
            raise ValueError('Mail transport failed')
        return data
    finally:
        connection.close()


def send(cfg, message):
    encoded = urlencode({'client_id': cfg['RESET_GRAPH_CLIENT_ID'],
                         'client_secret': cfg['RESET_GRAPH_CLIENT_SECRET'],
                         'grant_type': 'client_credentials',
                         'scope': 'https://graph.microsoft.com/.default'}).encode()
    response = post('login.microsoftonline.com',
                    '/' + cfg['RESET_GRAPH_TENANT_ID'] + '/oauth2/v2.0/token', encoded,
                    {'Content-Type': 'application/x-www-form-urlencoded'}, cfg['RESET_GRAPH_TIMEOUT'], 200)
    result = json.loads(response)
    token = result.get('access_token') if isinstance(result, dict) else None
    if not isinstance(token, str) or not re.fullmatch(r'[A-Za-z0-9._~+/-]+=*', token):
        raise ValueError('Mail transport failed')
    payload = {'message': {'subject': str(message['Subject']),
                          'body': {'contentType': 'Text', 'content': message.get_content()},
                          'toRecipients': [{'emailAddress': {'address': str(message['To'])}}]},
               'saveToSentItems': False}
    post('graph.microsoft.com', '/v1.0/users/' + quote(cfg['RESET_GRAPH_SENDER'], safe='') + '/sendMail',
         json.dumps(payload).encode(), {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token},
         cfg['RESET_GRAPH_TIMEOUT'], 202)
