"""Loopback-only test SMTP sink. No external mail or credential logging."""
import socketserver
import threading
from email import policy
from email.parser import BytesParser


class Handler(socketserver.StreamRequestHandler):
    def handle(self):
        self.wfile.write(b'220 localhost QA SMTP\r\n')
        while line := self.rfile.readline():
            verb = line.split(b' ', 1)[0].strip().upper()
            if verb == b'DATA':
                self.wfile.write(b'354 message\r\n')
                chunks = []
                while (part := self.rfile.readline()) not in (b'.\r\n', b''):
                    chunks.append(part[1:] if part.startswith(b'..') else part)
                self.server.messages.append(BytesParser(policy=policy.default).parsebytes(b''.join(chunks)))
                self.wfile.write(b'250 accepted\r\n')
            elif verb == b'QUIT':
                self.wfile.write(b'221 bye\r\n')
                return
            else:
                self.wfile.write(b'250 localhost\r\n')


class Capture(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

    def __init__(self):
        super().__init__(('127.0.0.1', 0), Handler)
        self.messages = []
        threading.Thread(target=self.serve_forever, daemon=True).start()

    def close(self):
        self.shutdown()
        self.server_close()
