---
layout: default
title: TOTP in detail
nav_order: 3
---

# Two-Factor Authentication (TOTP)
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

TOTP stands for **Time-based One-Time Password**. It's the algorithm standardized by [RFC 6238](https://datatracker.ietf.org/doc/html/rfc6238) and used by Google Authenticator, Authy, 1Password, and the vast majority of authenticator apps.

Its strength can be summed up in one idea: **time replaces communication**. Once the secret is shared at registration, the client and server can independently compute the same code without communicating.

## The principle in three steps

### Step A — Registration (one time only)

```
Server:
  secret = random_bytes(20)                          # 160 random bits
  db.users.save(secret_2fa = encrypt(secret))        # Fernet-encrypted
  qr_url = "otpauth://totp/COFRAP:michel
           ?secret=BASE32...&issuer=COFRAP"
  return qr_code(qr_url)

Client (Google Authenticator):
  scan QR
  store { label: "COFRAP", secret: "BASE32..." }
```

The secret is shared **only once** via the QR code. From that point on, the client and server can independently compute the same codes.

### Step B — Code computation (every 30 seconds)

```
T = floor(timestamp_unix / 30)         # 30s period number
hash = HMAC-SHA1(secret, T)            # 20 bytes
offset = hash[19] AND 0x0f             # last 4 bits
truncated = hash[offset..offset+4] AND 0x7fffffff
code = truncated MOD 1_000_000         # 6 digits
```

Both parties (the server and the phone app) run this computation **independently**, using the same inputs (the shared secret and UTC time). If both clocks are in sync within 30 seconds, they get the same code.

### Step C — Authentication

```python
# The client sends:
{ "username": "michel", "password": "...", "totp_code": "847291" }

# The server:
user = db.find(username)
if not bcrypt.verify(user.password_hash, password):
    return 401

secret = decrypt(user.secret_2fa)
expected = compute_totp(secret, now())
if totp_code != expected:
    return 401

return success
```

## Why it works

- **Time acts as a free synchronization channel.** No need for a persistent connection between the app and the server.
- **Codes have a very short lifespan.** Even if intercepted, a code is unusable after 30 seconds (60 seconds max with the `valid_window=1` tolerance used in `authenticate`).
- **The secret only travels once.** After the initial scan, it stays server-side (encrypted) and app-side (in the phone's secure storage). No further transmission.

## Server-side implementation

The [`pyotp`](https://pyauth.github.io/pyotp/) library provides an RFC 6238-compliant implementation.

```python
import pyotp

# Secret generation (at registration)
secret = pyotp.random_base32()
totp_uri = pyotp.TOTP(secret).provisioning_uri(
    name="michel", issuer_name="COFRAP"
)
# totp_uri = "otpauth://totp/COFRAP:michel?secret=...&issuer=COFRAP"

# Code verification (at login)
totp = pyotp.TOTP(secret)
is_valid = totp.verify(user_input, valid_window=1)
# valid_window=1 tolerates ±30 seconds of clock drift
```

## Limitations of TOTP

{: .warning }
TOTP has three inherent weaknesses that must be understood in order to mitigate them.

### 1. Phishable

An attacker exploiting a fake COFRAP site can intercept the password + TOTP and replay them in real time on the real site. TOTP cannot tell a legitimate site apart from a fraudulent one.

**Mitigation**: user education, domain verification, future migration to WebAuthn/Passkeys.

### 2. Shared secret on the server side

The 2FA secret lives in the PostgreSQL database. If the database leaks (SQL injection, stolen backup), all secrets could be exposed.

**Mitigation**: the secret is **encrypted with Fernet** before storage. See [Security](security.html#2fa-secret-encryption).

### 3. Clock synchronization

If the phone's clock drifts by more than 60 seconds, codes stop working.

**Mitigation**: `valid_window=1` (tolerates ±30s), plus NTP on the server side.

## Comparison with other 2FA methods

| Method | Security | UX | Complexity | Phishable |
|:--------|:---------|:---|:-----------|:----------|
| SMS OTP | ❌ Weak | Average | Easy | Yes (+ SIM swap) |
| Email OTP | Average | Slow | Easy | Yes |
| **TOTP (our choice)** | **Good** | **Good** | **Medium** | **Yes** |
| Push notifications | Good | Excellent | High | Yes (fatigue attacks) |
| WebAuthn / Passkeys | Excellent | Excellent | High | **No** |

WebAuthn is the state of the art in 2026 (used by Google, GitHub, Microsoft) but requires a bigger investment. TOTP remains a solid choice for a V1.
