---
layout: default
title: API Reference
nav_order: 5
---

# API Reference
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

The application exposes **four independent OpenFaaS functions**. Each function accepts a POST request with a JSON body and returns JSON.

[Interactive Swagger UI documentation](api.html){: .btn .btn-primary }

## Endpoints

| Function | Endpoint | Body | Response |
|:---------|:---------|:-----|:--------|
| `generate-password` | `POST /function/generate-password` | `{username}` | `{qr_code}` |
| `generate-2fa` | `POST /function/generate-2fa` | `{username}` | `{qr_code, backup_codes[10]}` |
| `authenticate` | `POST /function/authenticate` | `{username, password, totp_code}` | `{success, expired, gendate}` |
| `recover-with-backup-code` | `POST /function/recover-with-backup-code` | `{username, backup_code}` | `{success, qr_code}` |

## generate-password

Generates a random 24-character password, hashes it with bcrypt, and stores it. Creates the user if needed (renews if already existing). Returns a QR code containing the plaintext password.

**Request**
```http
POST /function/generate-password
Content-Type: application/json

{ "username": "michel.ranu" }
```

**Response 200**
```json
{ "qr_code": "iVBORw0KGgoAAAANSU..." }
```

`qr_code` is a base64 string of a PNG image. Frontend display: `<img src="data:image/png;base64,${qr_code}"/>`.

## generate-2fa

Generates a TOTP secret, encrypts it with Fernet, and stores it. Generates 10 backup codes, hashes them with bcrypt, and stores them. Returns a TOTP QR code and the 10 plaintext codes (one-time use: returned once, never shown again).

**Request**
```http
POST /function/generate-2fa
Content-Type: application/json

{ "username": "michel.ranu" }
```

**Response 200**
```json
{
  "qr_code": "iVBORw0KGgoAAAANSU...",
  "backup_codes": [
    "A2B4-C6D8", "E1F3-G5H7", "I9J2-K4L6",
    "M8N0-P2Q4", "R6S8-T1U3", "V5W7-X9Y2",
    "Z4A6-B8C1", "D3E5-F7G9", "H2I4-J6K8", "L1M3-N5P7"
  ]
}
```

{: .warning }
The `backup_codes` will never be shown again. The frontend must force the user to save them (copy, download, or print) before continuing.

## authenticate

Verifies credentials + TOTP with rate limiting. Returns the credentials' expiration status (6-month rotation).

**Request**
```http
POST /function/authenticate
Content-Type: application/json

{
  "username": "michel.ranu",
  "password": "AbCdEf1234!@#xyzPQRST567=",
  "totp_code": "847291"
}
```

**Response 200 (success)**
```json
{
  "success": true,
  "expired": false,
  "gendate": 1715000000
}
```

**Response 200 (failure)**
```json
{ "success": false, "error": "invalid_credentials" }
```

**Response 200 (rate limited)**
```json
{
  "success": false,
  "error": "rate_limited",
  "message": "Too many attempts. Try again in 1 minute."
}
```

## recover-with-backup-code

Verifies a backup code, marks it as used, and generates a new password. The 2FA secret stays unchanged: the user can log back in immediately with the new password + their usual TOTP code.

**Request**
```http
POST /function/recover-with-backup-code
Content-Type: application/json

{
  "username": "michel.ranu",
  "backup_code": "A2B4-C6D8"
}
```

**Response 200 (success)**
```json
{
  "success": true,
  "qr_code": "iVBORw0KGgoAAAANSU..."
}
```

**Response 200 (failure)**
```json
{ "success": false, "error": "invalid_code" }
```

## Standard error codes

| Code | Meaning | UI action |
|:-----|:--------------|:----------|
| `missing_fields` | A required field is empty | Show "Please fill in all fields" |
| `invalid_credentials` | Invalid username, password, or TOTP | Generic message to avoid revealing which field is wrong |
| `rate_limited` | More than 5 failures in the last minute | Show the wait time, disable the form |
| `invalid_code` | Unknown or already-used backup code | Prompt the user to try another code |
| `2fa_not_configured` | The user hasn't completed their 2FA setup | Redirect to `/create-account` or contact support |
| `user_not_found` | Username doesn't exist for `generate-2fa` | Generic error on the frontend |
| `invalid_json` | Malformed body | Generic error on the frontend |

## Cross-cutting considerations

### QR code format

All returned `qr_code` values are **base64 strings** representing PNG images. The frontend displays them directly via `data:image/png;base64,...`.

For 2FA, the encoded content is an `otpauth://totp/COFRAP:{username}?secret=...&issuer=COFRAP` URI, which apps like Google Authenticator can parse natively.

### Idempotency

`generate-password` is idempotent: calling the function multiple times for the same username simply regenerates the password (also used for renewal).

`generate-2fa` is idempotent: it regenerates the 2FA secret and the 10 backup codes. The old codes are deleted.

`authenticate` and `recover-with-backup-code` are **not** idempotent: each call logs an attempt and can trigger rate limiting.

### Headers

No function requires any special header besides `Content-Type: application/json`. The OpenFaaS gateway handles routing.

In production, the gateway should enable TLS and possibly an `Authorization` header if the functions are accessible directly (otherwise, access is frontend-only).
