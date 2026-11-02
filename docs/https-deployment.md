# HTTPS deployment

Classroom supports HTTPS through the optional `compose.https.yaml` override:

```
Browser --HTTPS--> Caddy :443 --HTTP/private Docker network--> Waitress :8080
```

The ordinary `compose.yaml` remains local HTTP. The HTTPS override removes the
backend's published port, publishes Caddy on TCP 80/443, enables Secure session
cookies, and sets the password-reset canonical origin to the HTTPS domain.
Caddy obtains and renews certificates and redirects HTTP to HTTPS. Its `/data`
volume retains private keys and ACME state across recreation; protect it like
other secrets and do not delete it during upgrades.

## Local Docker deployment at https://localhost

Use `sh scripts/classroom-https-local.sh ...` for this machine's account deployment.
It selects the existing account volume, the HTTPS override, and
`compose.https-local.yaml`, binding ports 80/443 to loopback only. It uses the
private `docker/runtime.env` when present, otherwise the mail-disabled example;
set `CLASSROOM_ENV_FILE` explicitly to select another private configuration.
Do not use the original HTTP wrapper alone for subsequent updates.

```sh
sh scripts/classroom-https-local.sh build
sh scripts/classroom-https-local.sh up -d --no-build --wait --wait-timeout 180
sh scripts/classroom-https-local.sh ps
```

Caddy issues localhost certificates from its persistent local CA, not a public
CA. A browser will warn until that CA is trusted. The exported public root
certificate for the current deployment is
`backups/https-local/localhost-root-ca.crt`. To trust it on macOS, import this
certificate into Keychain Access, verify it is the intended local Caddy CA, and
set its SSL trust to Always Trust. This changes local trust and is deliberately
left to the operator; do not import the CA private key or disable browser TLS
verification globally. CLI verification without modifying system trust:

```sh
curl --cacert backups/https-local/localhost-root-ca.crt https://localhost/healthz
```

This URL is reachable only on the Docker host. For other machines/public access,
use a real domain and the public HTTPS deployment below. The deployed localhost
instance retained the existing account volume after a private backup and
schema/table/upload fingerprint comparison. HTTPS health, login form, Secure
cookie and HTTP redirect were verified; live account login and mail delivery
were not exercised. The login-page probe creates an anonymous session normally.

## Before enabling

- Use a DNS hostname you control, e.g. `classroom.example.com`, without scheme,
  path, or port. Point its A/AAAA records at this host; remove unreachable AAAA
  records. Public certificate issuance requires reachable challenge ports.
- Allow inbound TCP 80 and 443 and outbound DNS/HTTPS. Ensure no other service
  owns those host ports. This configuration does not require UDP 443/HTTP3.
- Docker Compose 2.30+ is already required by the base deployment. The override
  uses Compose's `!reset` tag to remove, rather than append to, backend ports.
- Keep the application's existing private runtime env file and data volume.
  Configure the existing SMTP/Graph transport separately if email is needed.
  The override explicitly supersedes insecure cookie/reset URL settings in the
  runtime env file; it does not enable mail or change credentials.
- Back up the existing application volume before a production recreation, as
  described in `docker-deployment.md`. Do not run QA fixture tools on live data.

## Existing account deployment

From the repository root, set the real hostname in the deployment environment:

```sh
export CLASSROOM_DOMAIN=classroom.example.com
sh scripts/classroom-compose.sh -f compose.https.yaml config --quiet
sh scripts/classroom-compose.sh -f compose.https.yaml build
# After backup and authorization for recreation:
sh scripts/classroom-compose.sh -f compose.https.yaml up -d --no-build --wait --wait-timeout 180
curl --fail https://classroom.example.com/healthz
```

The wrapper still selects the same existing account volume and Compose project.
Always include `-f compose.https.yaml` and the same `CLASSROOM_DOMAIN` for later
HTTPS status/update/stop commands. Running plain `up` without this override would
reconfigure the application back to its HTTP mode. Persist the domain in your
operator/deployment environment; do not embed credentials in shell commands.

`--wait` checks backend readiness and that Caddy is running, not that public ACME
issuance has succeeded. Verify the public HTTPS URL with certificate verification
enabled (no `curl -k`), then test login and a state-changing operation. A first
certificate may take time. Inspect bounded Caddy logs for issuance errors:

```sh
sh scripts/classroom-compose.sh -f compose.https.yaml logs --tail 100 https
```

For a new installation, use `docker compose -p <project> -f compose.yaml -f
compose.https.yaml ...` with its own explicitly selected, pre-created external
`CLASSROOM_DATA_VOLUME` and private `CLASSROOM_ENV_FILE`. Do not use the account
wrapper or account volume for a different deployment.

## Scheme and trust boundary

Waitress runs with `--url-scheme=https` in this HTTPS-only deployment. This is a
fixed WSGI scheme, not a TLS listener: TLS ends at Caddy. Caddy preserves the
public Host, including its port, so the application's exact Origin/CSRF check
continues to work. Client-supplied `X-Forwarded-Proto` and `X-Forwarded-Host` are
not trusted to change the scheme or host. No global `ProxyFix` or wildcard
trusted-proxy setting is introduced.

All public entry must go through Caddy. Do not publish backend ports, expose
Docker's API, or attach untrusted containers to this project's network. Internal
HTTP healthchecks remain valid and do not create sessions. Secure cookies are
not sent over HTTP, so use the HTTPS URL after switching.

This change does not enable forwarded client-IP trust. Existing IP-based login
and mail throttles see the proxy address, so their limits are shared among
proxied users. If individual client-IP throttling is needed, configure a reviewed
exact trusted proxy address and sanitized forwarded IP headers; do not solve
this by trusting arbitrary incoming headers. HSTS is not enabled automatically;
choose its policy only after confirming the domain and HTTPS rollout.

## Existing external TLS proxy instead of Caddy

Use the same HTTPS-only Waitress command and cookie/reset configuration, keep the
backend private, and preserve the original public Host. Do not apply the Caddy
port mappings if another edge already owns 80/443. Avoid stripping Origin or
weakening CSRF to work around a scheme mismatch.

## Repeatable verification

```sh
docker build -t classroom:https-verification .
python3 scripts/verify-https.py --allow-isolated-qa
```

This creates a uniquely named disposable Compose project, isolated external data
volume, loopback ephemeral ports, and a synthetic account. It uses only
`docker/runtime.env.example` (mail disabled), never the private runtime file or
live account volume. Caddy's localhost CA certificate is copied into a temporary
trust store: the HTTPS client verifies both trust and hostname, rather than
turning TLS verification off. Containers and test volumes are removed afterward.

The smoke test checks HTTP redirect, TLS, health, Secure/HttpOnly/SameSite cookie,
login, authenticated course catalog, logout, foreign-Origin and missing-CSRF
rejection, forwarded-header spoof rejection, and absence of backend host ports.
It does not request a public certificate, send mail, or deploy production.

Backend regression: run `PYTHONPATH=appworks python -m pytest appworks/tests -q`
in an environment with `appworks/requirements.txt` installed and both course
builds present. The HTTPS contract tests require Docker Compose; they skip when
the Docker executable is absent. They also exercise a real local Waitress server.
