---
layout: default
title: Deployment
nav_order: 6
---

# Local Setup and Deployment
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

Full procedure to run the stack locally: PostgreSQL database, OpenFaaS functions, React frontend. Assumes Docker Desktop, faas-cli, and Node.js 18+ are already installed.

## Prerequisites

| Tool | Version | Install |
|:------|:--------|:-------------|
| Docker Desktop | latest | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |
| Kubernetes (built into Docker Desktop, K3S, or minikube) | 1.28+ | enable in Docker Desktop > Settings > Kubernetes |
| `faas-cli` | 0.16+ | `choco install faas-cli` (Windows) or `brew install faas-cli` (macOS) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| Python | 3.11+ | needed to generate the Fernet key |
| `psql` (PostgreSQL client) | 14+ | bundled with PostgreSQL |

## Step 1 — Generate the Fernet key

```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Example output:
# GqJ4Y6dM9vQ8XzN3Hk7Pa2sBcRfTwUyL5jE0iVoWnZE=
```

{: .danger }
This key is **critical**: losing it makes all 2FA secrets in the database unrecoverable. Store it in a secrets manager (Vault, 1Password, AWS Secrets Manager) **before** continuing.

## Step 2 — Start PostgreSQL

```bash
docker compose up -d postgres
```

This starts PostgreSQL on port 5432 with:
- User: `cofrap`
- Password: `cofrap`
- Database: `cofrap`

## Step 3 — Initialize the schema

```bash
psql -h localhost -U cofrap -d cofrap -f init.sql
```

This creates the three tables: `users`, `backup_codes`, `login_attempts`, along with their indexes.

Verify:
```bash
psql -h localhost -U cofrap -d cofrap -c "\dt"
# Should show 3 tables
```

## Step 4 — Create the OpenFaaS secrets

```bash
faas-cli secret create cofrap-encryption-key \
    --from-literal="GqJ4Y6dM9vQ8XzN3Hk7Pa2sBcRfTwUyL5jE0iVoWnZE="

faas-cli secret create cofrap-db-url \
    --from-literal="postgres://cofrap:cofrap@postgres:5432/cofrap"
```

## Step 5 — Build and deploy the functions

From the project root:

```bash
faas-cli up -f stack.yml

# This runs in sequence:
# - faas-cli build (creates the 4 Docker images)
# - faas-cli push (optional, for a remote cluster)
# - faas-cli deploy (deploys to OpenFaaS)
```

Verify the functions are deployed:

```bash
faas-cli list
# Should list:
# Function                      Invocations    Replicas
# generate-password             0              1
# generate-2fa                  0              1
# authenticate                  0              1
# recover-with-backup-code      0              1
```

## Step 6 — Start the frontend

```bash
cd frontend
npm install
npm run dev

# The frontend is available at http://localhost:5173 (or 5174 if the port is busy)
```

## Step 7 — Verification

1. Open [http://localhost:5174](http://localhost:5174)
2. Click **"Create an account"** → enter a test username
3. Scan the two QR codes in sequence (password + 2FA)
4. Save the 10 backup codes (copy or download)
5. Log in with the scanned password + the TOTP code from the app
6. Confirm the Dashboard appears with the status **"Secured"**

## Recommended manual tests

### Rate limiting

1. Enter a wrong password 5 times → confirm the "Too many attempts" message appears
2. Wait 1 minute → retry with the correct password → success

### Recovery via backup code

1. Log in normally once
2. Log out
3. Click **"Forgot password?"** on Login
4. Enter username + one of the 10 backup codes
5. Confirm a new password QR code is shown
6. Confirm the used code no longer works (try a second time → error)
7. Log back in with the new password + the same 2FA code as before

### Forced renewal

To simulate an expiration:

```sql
-- Force gendate to 7 months in the past
UPDATE users SET gendate = EXTRACT(EPOCH FROM NOW() - INTERVAL '7 months')::BIGINT
WHERE username = 'your_test_user';
```

Then log in → automatic redirect to `/renew`.

## Debugging and logs

### OpenFaaS logs

```bash
# Real-time logs for a function
faas-cli logs generate-password --follow

# Logs for the last N lines
faas-cli logs authenticate --tail 100
```

### PostgreSQL logs

```bash
docker logs -f mspr-cofrap-postgres-1
```

### Common errors

| Symptom | Likely cause | Fix |
|:---------|:---------------|:---------|
| 500 on `generate-2fa` | `ENCRYPTION_KEY` missing or invalid | Check `faas-cli secret list` |
| 500 on every function | `DATABASE_URL` invalid or database unreachable | Confirm PostgreSQL is running, check the secret |
| OpenFaaS build fails | Missing Python module | Check the function's `requirements.txt` |
| Port 5432 already in use | Another local PostgreSQL instance | Stop the local instance or change the port in `docker-compose.yml` |
| Frontend doesn't load QR codes | CORS or wrong gateway URL | Check `VITE_GATEWAY_URL` in `.env` |

## Production deployment

For a production deployment, also see [Security — Production recommendations](security.html#production-recommendations).

Mandatory points before going to production:

- TLS on the OpenFaaS gateway (cert-manager + Let's Encrypt)
- Fernet key in an HSM or managed KMS
- IP-based rate limiting at the gateway level
- Encrypted PostgreSQL backups with rotation
- Monitoring: alerts on spikes in `login_attempts` with `success=FALSE`
- Kubernetes RBAC audit: who can read the secrets?
