import io
import base64
import secrets
import string
from datetime import datetime, timedelta

import bcrypt
import pyotp
import qrcode
from cryptography.fernet import Fernet
from sqlalchemy import select, insert, update, and_, func

from app.core.config import ENCRYPTION_KEY, ISSUER
from app.db.session import engine
from app.models import tables


def _b64_png_from_text(text: str) -> str:
    img = qrcode.make(text)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def _generate_password(length: int = 24) -> str:
    alphabet = string.ascii_letters + string.digits + string.punctuation
    # remove quotes and backslash to be safe
    alphabet = alphabet.replace('"', '').replace("'", '').replace('\\', '')
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def generate_password_for_user(username: str) -> str:
    pwd = _generate_password()
    pwd_hash = bcrypt.hashpw(pwd.encode(), bcrypt.gensalt(rounds=12))
    now = datetime.utcnow()
    with engine.connect() as conn:
        # upsert
        res = conn.execute(select([tables.users.c.username]).where(tables.users.c.username == username))
        row = res.first()
        if row:
            conn.execute(
                update(tables.users)
                .where(tables.users.c.username == username)
                .values(password_hash=pwd_hash, gendate=now)
            )
        else:
            conn.execute(
                insert(tables.users).values(username=username, password_hash=pwd_hash, gendate=now)
            )
    return pwd


def generate_password_qr(username: str) -> str:
    pwd = generate_password_for_user(username)
    b64 = _b64_png_from_text(pwd)
    return b64


def generate_2fa(username: str):
    secret = pyotp.random_base32()
    if not ENCRYPTION_KEY:
        raise RuntimeError("ENCRYPTION_KEY not set")
    f = Fernet(ENCRYPTION_KEY.encode())
    enc = f.encrypt(secret.encode())
    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=username, issuer_name=ISSUER)
    qr = _b64_png_from_text(uri)

    # insert/update totp encrypted
    with engine.connect() as conn:
        res = conn.execute(select([tables.users.c.username]).where(tables.users.c.username == username))
        row = res.first()
        if row:
            conn.execute(
                update(tables.users).where(tables.users.c.username == username).values(totp_encrypted=enc)
            )
        else:
            conn.execute(
                insert(tables.users).values(username=username, password_hash=b"", totp_encrypted=enc)
            )

        # generate 10 backup codes
        codes = []
        for _ in range(10):
            raw = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
            formatted = raw[:4] + '-' + raw[4:]
            codes.append(formatted)
            hashed = bcrypt.hashpw(formatted.encode(), bcrypt.gensalt(rounds=12))
            conn.execute(
                insert(tables.backup_codes).values(username=username, code_hash=hashed)
            )

    return qr, codes


def _record_login_attempt(conn, username: str, success: bool):
    conn.execute(insert(tables.login_attempts).values(username=username, success=success, attempted_at=datetime.utcnow()))


def authenticate(username: str, password: str, totp_code: str = None):
    now = datetime.utcnow()
    with engine.connect() as conn:
        # rate limit: failures in last minute
        one_min = now - timedelta(minutes=1)
        q = select([func.count()]).select_from(tables.login_attempts).where(
            and_(tables.login_attempts.c.username == username, tables.login_attempts.c.success == False, tables.login_attempts.c.attempted_at >= one_min)
        )
        res = conn.execute(q)
        fail_count = res.scalar() or 0
        if fail_count >= 5:
            return {"error": "rate_limited"}

        # fetch user
        res = conn.execute(select([tables.users]).where(tables.users.c.username == username))
        user = res.first()
        if not user:
            _record_login_attempt(conn, username, False)
            return {"error": "invalid_credentials"}

        stored_hash = user.password_hash
        if not stored_hash:
            _record_login_attempt(conn, username, False)
            return {"error": "invalid_credentials"}

        if not bcrypt.checkpw(password.encode(), stored_hash):
            _record_login_attempt(conn, username, False)
            return {"error": "invalid_credentials"}

        # check gendate expiry
        gendate = user.gendate
        if gendate and (now - gendate).days > 30 * 6:
            _record_login_attempt(conn, username, False)
            return {"expired": True}

        # check totp
        if user.totp_encrypted:
            if not totp_code:
                _record_login_attempt(conn, username, False)
                return {"error": "totp_required"}
            if not ENCRYPTION_KEY:
                raise RuntimeError("ENCRYPTION_KEY not set")
            f = Fernet(ENCRYPTION_KEY.encode())
            secret = f.decrypt(user.totp_encrypted).decode()
            totp = pyotp.TOTP(secret)
            if not totp.verify(totp_code, valid_window=1):
                _record_login_attempt(conn, username, False)
                return {"error": "invalid_totp"}

        _record_login_attempt(conn, username, True)
        gendate_ts = int(gendate.timestamp()) if gendate else None
        return {"success": True, "gendate": gendate_ts}


def recover_with_backup_code(username: str, backup_code: str):
    # normalize
    code = backup_code.strip()
    with engine.connect() as conn:
        res = conn.execute(select([tables.backup_codes]).where(and_(tables.backup_codes.c.username == username, tables.backup_codes.c.used_at == None)))
        rows = res.fetchall()
        matched = None
        for r in rows:
            if bcrypt.checkpw(code.encode(), r.code_hash):
                matched = r
                break
        if not matched:
            return {"error": "invalid_backup_code"}

        # mark used
        conn.execute(update(tables.backup_codes).where(tables.backup_codes.c.id == matched.id).values(used_at=datetime.utcnow()))

    # regenerate password and return QR
    qr = generate_password_qr(username)
    return qr
