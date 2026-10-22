# Acme Payments API

> ⚠️ **INTENTIONALLY VULNERABLE.** Built for an Aikido Security demo. Every secret in this repo is fake.
> Do not deploy anywhere that holds real data.

Node.js / Express API used to demonstrate:

| Scanner | What's planted |
|---|---|
| SAST | SQLi (`/api/users`, `/api/login`), XSS (`/search`), path traversal (`/api/files`), SSRF, command injection, `eval`, MD5, `Math.random()` tokens, open redirect, JWT `none` alg |
| SCA – reachable | `lodash@4.17.15` (`_.merge`, `_.template`), `axios@0.21.1`, `jsonwebtoken@8.5.1`, `express@4.17.1` |
| SCA – NOT reachable | `handlebars@4.5.3`, `marked@0.3.6`, `moment@2.29.1` (installed, never imported) |
| SCA – dev only | `mocha@6.2.0` |
| Secrets | `src/config.js`, `.env`, `Dockerfile`, `infra/terraform/*/main.tf` |
| IaC | `infra/terraform/azure/main.tf` (Azure), `infra/terraform/aws/main.tf` (AWS, multi-cloud example), `infra/k8s/deployment.yaml`, `Dockerfile` |
| Container | `node:16-buster` base image (EOL runtime + EOL OS). Scan-only: the public deployment uses `Dockerfile.deploy` (patched Node 24.22.1) |
| CI/CD | `.github/workflows/ci.yml` (`pull_request_target` + untrusted checkout, script injection) |
| DAST | Run it and point Aikido at it, using `openapi.json` for API scanning |

## Run
```bash
npm install
npm start            # http://localhost:3000
# Optional: turn on the RCE endpoints (local only!)
ENABLE_RCE_ENDPOINTS=true npm start
```
