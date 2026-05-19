import os
import json
import time
import base64
import secrets
import string
from io import BytesIO

import bcrypt
import psycopg2
import qrcode

DB_DSN = os.environ['DATABASE_URL']
PASSWORD_LENGTH = 24
MAX_FAILED_ATTEMPTS = 5
RATE_WINDOW = "1 minute"


def generate_strong_password():
    alphabet = string.ascii_letters + string.digits + '!@#$%^&*-_=+'
    return ''.join(secrets.choice(alphabet) for _ in range(PASSWORD_LENGTH))


def make_qr_base64(payload):
    qr = qrcode.QRCode(box_size=8, border=2)
    qr.add_data(payload)
    qr.make(fit=True)
    img = qr.make_image()
    buf = BytesIO()
    img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode()


def handle(req):
    try:
        data = json.loads(req)
    except (ValueError, TypeError):
        return json.dumps({"success": False, "error": "invalid_json"})

    username = (data.get('username') or '').strip()
    backup_code = (data.get('backup_code') or '').strip().upper()

    if not username or not backup_code:
        return json.dumps({"success": False, "error": "missing_fields"})

    with psycopg2.connect(DB_DSN) as conn:
        with conn.cursor() as cur:
            # Rate limit (same table as authenticate)
            cur.execute(
                f"""SELECT COUNT(*) FROM login_attempts
                    WHERE username = %s
                      AND success = FALSE
                      AND attempted_at > NOW() - INTERVAL '{RATE_WINDOW}'""",
                (username,),
            )
            if cur.fetchone()[0] >= MAX_FAILED_ATTEMPTS:
                return json.dumps({
                    "success": False, "error": "rate_limited",
                    "message": "Trop de tentatives. Réessayez dans 1 minute.",
                })

            cur.execute("SELECT id FROM users WHERE username = %s", (username,))
            row = cur.fetchone()
            if not row:
                cur.execute(
                    "INSERT INTO login_attempts (username, success) VALUES (%s, FALSE)",
                    (username,),
                )
                conn.commit()
                return json.dumps({"success": False, "error": "invalid_code"})

            user_id = row[0]

            # Find the matching unused backup code (linear scan, max 10 entries)
            cur.execute(
                "SELECT id, code_hash FROM backup_codes WHERE user_id = %s AND used_at IS NULL",
                (user_id,),
            )
            matching_id = None
            for cid, code_hash in cur.fetchall():
                if bcrypt.checkpw(backup_code.encode(), code_hash.encode()):
                    matching_id = cid
                    break

            if matching_id is None:
                cur.execute(
                    "INSERT INTO login_attempts (username, success) VALUES (%s, FALSE)",
                    (username,),
                )
                conn.commit()
                return json.dumps({"success": False, "error": "invalid_code"})

            # Burn the code
            cur.execute(
                "UPDATE backup_codes SET used_at = NOW() WHERE id = %s",
                (matching_id,),
            )

            # Rotate password
            new_password = generate_strong_password()
            new_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
            cur.execute(
                "UPDATE users SET password_hash = %s, gendate = %s WHERE id = %s",
                (new_hash, int(time.time()), user_id),
            )

            cur.execute(
                "INSERT INTO login_attempts (username, success) VALUES (%s, TRUE)",
                (username,),
            )
        conn.commit()

    qr_b64 = make_qr_base64(f"COFRAP:{username}:{new_password}")
    return json.dumps({"success": True, "qr_code": qr_b64})
