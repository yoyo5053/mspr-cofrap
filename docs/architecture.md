---
layout: default
title: Architecture
nav_order: 2
---

# Architecture
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

The application is fully serverless. The React SPA frontend talks to four independent OpenFaaS functions deployed on Kubernetes, which share a PostgreSQL database and use an encryption secret managed via Kubernetes Secrets.

```
+-----------------------------------------------------------------+
|                          User's browser                         |
|                  React 18 frontend (Vite, port 5174)            |
+-----------------------------------------------------------------+
                              |
                              | HTTPS (JSON)
                              v
+-----------------------------------------------------------------+
|              OpenFaaS Gateway (Kubernetes Service)               |
+-----------------------------------------------------------------+
       |                  |                   |                |
       v                  v                   v                v
+-------------+   +--------------+   +---------------+  +-------------+
| generate-   |   | generate-2fa |   | authenticate  |  | recover-    |
| password    |   | (pyotp +     |   | (pyotp +      |  | with-backup |
| (bcrypt +   |   | Fernet +     |   | Fernet +      |  | -code       |
| qrcode)     |   | bcrypt + qr) |   | rate limit)   |  | (bcrypt)    |
+-------------+   +--------------+   +---------------+  +-------------+
       |                  |                   |                |
       +------------------+--+----------------+----------------+
                             |
                             v
                  +----------------------+
                  |   PostgreSQL 16      |
                  |  - users             |
                  |  - backup_codes      |
                  |  - login_attempts    |
                  +----------------------+
```

## Components

### Frontend (`frontend/`)

React 18 Single Page Application, served in production via NGINX. Main pages:

| Route | Component | Role |
|:------|:----------|:-----|
| `/login` | `Login.jsx` | 2-step login: credentials → TOTP |
| `/create-account` | `CreateAccount.jsx` | 4-step registration: username → password → 2FA → backup codes |
| `/dashboard` | `Dashboard.jsx` | Dashboard with validity timeline |
| `/renew` | `Renew.jsx` | 4-step renewal (similar to registration) |
| `/recover` | `Recover.jsx` | 2-step recovery via backup code |

The user session is stored in `sessionStorage` (keys `username` and `gendate`). The `useIsMobile` hook adapts the layout below 900px.

### Backend (`functions/`)

Four independent OpenFaaS functions, built with the `python3` template. Each function is an isolated Docker container.

| Function | Endpoint | Description |
|:---------|:---------|:------------|
| `generate-password` | `POST /function/generate-password` | Generates a 24-character password, hashes it with bcrypt, and returns a QR code |
| `generate-2fa` | `POST /function/generate-2fa` | Generates an encrypted (Fernet) TOTP secret, 10 hashed backup codes, and returns an `otpauth://` QR code |
| `authenticate` | `POST /function/authenticate` | Verifies credentials + TOTP, applies rate limiting, returns expiration status |
| `recover-with-backup-code` | `POST /function/recover-with-backup-code` | Verifies a backup code, marks it as used, regenerates the password |

### Database (PostgreSQL)

Three tables — see [DB Schema](#db-schema).

### Secrets and configuration

Environment variables injected via Kubernetes Secrets:

| Variable | Managed by | Used by |
|:---------|:---------|:------------|
| `DATABASE_URL` | Secret `cofrap-db-url` | All functions |
| `ENCRYPTION_KEY` | Secret `cofrap-encryption-key` | `generate-2fa`, `authenticate` |

## DB Schema

```sql
CREATE TABLE users (
    id                      SERIAL PRIMARY KEY,
    username                VARCHAR(64)  NOT NULL UNIQUE,
    password_hash           VARCHAR(255) NOT NULL,    -- bcrypt
    secret_2fa_encrypted    TEXT,                     -- Fernet (AES-128-CBC + HMAC)
    gendate                 BIGINT,                   -- Unix timestamp
    created_at              TIMESTAMP DEFAULT NOW()
);

CREATE TABLE backup_codes (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash   VARCHAR(255) NOT NULL,                -- bcrypt
    used_at     TIMESTAMP,                            -- NULL = code still valid
    created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_backup_codes_user ON backup_codes(user_id);

CREATE TABLE login_attempts (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(64) NOT NULL,
    attempted_at  TIMESTAMP DEFAULT NOW(),
    success       BOOLEAN DEFAULT FALSE
);
CREATE INDEX idx_attempts_username_time
    ON login_attempts(username, attempted_at);
```

### Design decisions

- **No plaintext storage.** Password and backup codes are hashed (bcrypt), the 2FA secret is encrypted (Fernet).
- **Cascade on delete.** Deleting a user automatically deletes their backup codes.
- **Index on (username, attempted_at).** Enables O(log n) rate limiting even with millions of rows.
- **`gendate` as BIGINT.** Unix timestamp in seconds, compact format, easy to handle in both Python and JavaScript without timezone issues.
