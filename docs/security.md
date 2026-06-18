---
layout: default
title: Security
nav_order: 4
---

# The 3 enterprise-grade defenses
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

A standalone TOTP remains vulnerable to several scenarios. The three measures below turn this basic 2FA into an enterprise-grade solution that can be defended in an audit.

## 2FA Secret Encryption

The TOTP secret is stored **encrypted** in the PostgreSQL database. If the database leaks (SQL injection, stolen backup, accidental dump), the attacker only recovers data that is unusable without the key.

### Implementation: Fernet

[Fernet](https://cryptography.io/en/latest/fernet/) (from the `cryptography` library) uses AES-128-CBC for encryption and HMAC-SHA256 for authentication. 256-bit key, random IV per encryption, built-in signature. It's an opinionatedly-safe format, hard to misuse.

```python
from cryptography.fernet import Fernet
import os

# Initialized when the module loads
ENCRYPTION_KEY = os.environ['ENCRYPTION_KEY'].encode()
cipher = Fernet(ENCRYPTION_KEY)

# When creating the 2FA secret
secret = pyotp.random_base32()
encrypted_secret = cipher.encrypt(secret.encode()).decode()
db.update(user_id, secret_2fa_encrypted=encrypted_secret)

# At authentication time
encrypted = db.get(user_id).secret_2fa_encrypted
secret = cipher.decrypt(encrypted.encode()).decode()
totp = pyotp.TOTP(secret)
if not totp.verify(totp_code, valid_window=1):
    return error
```

{: .danger }
The `ENCRYPTION_KEY` is **stored in a Kubernetes Secret** and injected as an environment variable into the OpenFaaS pod. It must never appear in the Git repo or in Docker images. **Losing it makes all 2FA secrets unrecoverable.** Store it in a secrets manager (Vault, AWS Secrets Manager, HSM).

### Key generation

```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Example output:
# GqJ4Y6dM9vQ8XzN3Hk7Pa2sBcRfTwUyL5jE0iVoWnZE=
```

---

## Backup codes

When the account is created (and on every renewal), the system generates **10 codes in the `XXXX-XXXX` format** that the user must print, download, or copy into their password manager. These codes enable **self-service recovery** if the phone is lost.

### Generation and storage

```python
import secrets
import bcrypt

# Alphabet without ambiguous characters (no 0, O, 1, I, L)
BACKUP_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

def generate_backup_code():
    raw = ''.join(secrets.choice(BACKUP_CODE_ALPHABET) for _ in range(8))
    return f"{raw[:4]}-{raw[4:]}"

# At creation: 10 plaintext codes, hashed with bcrypt, stored
codes_plain = [generate_backup_code() for _ in range(10)]
for code in codes_plain:
    code_hash = bcrypt.hashpw(code.encode(), bcrypt.gensalt()).decode()
    db.backup_codes.insert(user_id, code_hash)

# Returned to the client: plaintext codes ONCE, never shown again
return {"qr_code": qr, "backup_codes": codes_plain}
```

### Using codes for recovery

The user enters their username + a backup code on `/recover`. The backend compares the submitted code against the stored hashes via `bcrypt.checkpw`. On a match:

1. The code is **marked as used** (`used_at = NOW()`)
2. A **new password** is generated
3. The consumed code will **never work again**

{: .success }
This pattern eliminates the need for administrative intervention when a phone is lost, while preserving the security model (the backup code is printed, so it's a possession factor). Used by Google, GitHub, AWS, and Atlassian.

---

## Rate limiting

The TOTP code is 6 digits, i.e. 1,000,000 combinations. Without protection, an attacker could theoretically brute-force it.

With a **max of 5 failed attempts per minute per username**, the attack becomes practically impossible: it would take thousands of days to cover the search space.

### Implementation

```python
# Before verifying the password
cur.execute(
    "SELECT COUNT(*) FROM login_attempts "
    "WHERE username = %s "
    "  AND success = FALSE "
    "  AND attempted_at > NOW() - INTERVAL '1 minute'",
    (username,)
)
failed_count = cur.fetchone()[0]

if failed_count >= 5:
    return {"success": False, "error": "rate_limited"}

# ... verify password and TOTP ...

# After verification, log the result (success or failure)
cur.execute(
    "INSERT INTO login_attempts (username, success) VALUES (%s, %s)",
    (username, is_valid)
)
```

### Audit trail

The `login_attempts` table also serves as an **audit trail**. Tracing every attempt (successful and failed) allows post-mortem detection of abnormal behavior: spikes in failures, grouped attempts across multiple usernames, etc.

---

## Guaranteed security properties

| Property | Mechanism |
|:----------|:----------|
| Password confidentiality | bcrypt with cost factor 12, random salt per password |
| TOTP secret confidentiality | Fernet (AES-128-CBC + HMAC-SHA256), key in a Kubernetes Secret |
| 2FA secret integrity | HMAC built into Fernet; tampering causes decryption to fail |
| Login non-repudiation | `login_attempts` table tracing timestamp + success |
| Brute-force resistance | Rate limiting at 5 failures/min, sliding lockout |
| Self-service recovery | 10 one-shot backup codes, valid indefinitely until used |
| Forced rotation | `gendate` field + 6-month check, automatic redirect to `/renew` |

## Known limitations and residual risks

- **TOTP phishing.** A fraudulent site can intercept and replay the code in real time. Future mitigation: migration to WebAuthn/Passkeys.
- **Phone theft with the app unlocked.** Lets an attacker generate legitimate codes. Mitigation: require a PIN or biometrics within the authenticator app.
- **Fernet key compromise.** Combined with database access, allows regenerating TOTP codes. Mitigation: periodic key rotation, HSM storage for production.
- **Rate limiting by username only.** An attacker can iterate over different usernames. Mitigation: add a per-IP rate limit at the gateway level (NGINX, Traefik).

## Production recommendations

{: .warning }
Before any production deployment, validate the following points.

1. Enable TLS on the OpenFaaS gateway (Let's Encrypt + cert-manager)
2. Store the Fernet key in an HSM or a managed KMS (AWS KMS, GCP KMS, HashiCorp Vault)
3. Add a per-IP rate limit at the gateway level (5 req/sec)
4. Set up alerts for spikes in `login_attempts` with `success=FALSE`
5. Implement a database password rotation policy (90 days)
6. Enable encrypted PostgreSQL backups
7. Regularly audit the list of Kubernetes secrets (RBAC)

## Compliance

The design follows these recommendations:

- **NIST SP 800-63B AAL2.** Authenticator Assurance Level 2: 2 independent factors, at least one of which is cryptographic.
- **RFC 6238 (TOTP).** Compliant implementation via the `pyotp` library.
- **GDPR Article 32.** Appropriate technical measures: encryption, hashing, integrity, traceability.
- **OWASP ASVS v4.0 level 2.** Verification Standard for authentication (chapter 2).
