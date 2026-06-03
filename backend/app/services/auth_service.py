import io
import base64
import logging
import secrets
import string
from datetime import datetime, timedelta
from typing import Optional, List, Tuple

import bcrypt
import pyotp
import qrcode
from cryptography.fernet import Fernet
from sqlalchemy import select, insert, update, and_, func, delete

from app.core.config import ENCRYPTION_KEY, ISSUER
from app.db.session import engine
from app.models import tables

logger = logging.getLogger("cofrap.auth")


def _b64_png_from_text(text: str) -> str:
    """Generate a base64-encoded PNG QR code from the given text."""
    img = qrcode.make(text)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def _generate_password(length: int = 24) -> str:
    """Generate a secure random password without quotes or backslashes."""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    # remove quotes and backslash to be safe
    alphabet = alphabet.replace('"', '').replace("'", '').replace('\\', '')
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def generate_password_for_user(username: str) -> str:
    """Generate a new password for the user, hash it, and store it in the database.

    Args:
        username: The user's username.

    Returns:
        The plain text password.
    """
    pwd = _generate_password()
    pwd_hash = bcrypt.hashpw(pwd.encode(), bcrypt.gensalt(rounds=12))
    now = datetime.utcnow()
    with engine.begin() as conn:
        # upsert
        res = conn.execute(select(tables.users.c.username).where(tables.users.c.username == username))
        row = res.first()
        if row:
            conn.execute(
                update(tables.users)
                .where(tables.users.c.username == username)
                .values(password_hash=pwd_hash, gendate=now)
            )
            logger.info("Password regenerated for existing user=%s", username)
        else:
            conn.execute(
                insert(tables.users).values(username=username, password_hash=pwd_hash, gendate=now)
            )
            logger.info("Password generated for new user=%s", username)
    return pwd


def generate_password_qr(username: str) -> str:
    """Generate a new password for the user and return its QR code in base64.

    Args:
        username: The user's username.

    Returns:
        The base64 encoded PNG QR code.
    """
    pwd = generate_password_for_user(username)
    b64 = _b64_png_from_text(pwd)
    return b64


def _generate_backup_codes(conn, username: str) -> List[str]:
    """Generate and store 10 backup codes for a user, deleting any existing ones."""
    conn.execute(delete(tables.backup_codes).where(tables.backup_codes.c.username == username))
    codes = []
    for _ in range(10):
        raw = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        formatted = raw[:4] + '-' + raw[4:]
        codes.append(formatted)
        hashed = bcrypt.hashpw(formatted.encode(), bcrypt.gensalt(rounds=12))
        conn.execute(
            insert(tables.backup_codes).values(username=username, code_hash=hashed)
        )
    logger.info("Generated %d backup codes for username=%s", len(codes), username)
    return codes


def generate_2fa(username: str) -> Tuple[str, List[str]]:
    """Generate a TOTP 2FA secret and backup codes for a user.

    Args:
        username: The username to generate 2FA for.

    Returns:
        A tuple of (qr_code_base64, backup_codes).
    """
    secret = pyotp.random_base32()
    if not ENCRYPTION_KEY:
        logger.error("ENCRYPTION_KEY not set when generating 2FA for username=%s", username)
        raise RuntimeError("ENCRYPTION_KEY not set")
    f = Fernet(ENCRYPTION_KEY.encode())
    enc = f.encrypt(secret.encode())
    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=username, issuer_name=ISSUER)
    qr = _b64_png_from_text(uri)

    with engine.begin() as conn:
        res = conn.execute(select(tables.users.c.username).where(tables.users.c.username == username))
        row = res.first()
        if row:
            conn.execute(
                update(tables.users).where(tables.users.c.username == username).values(totp_encrypted=enc)
            )
            logger.info("2FA secret updated for existing user=%s", username)
        else:
            conn.execute(
                insert(tables.users).values(username=username, password_hash=b"", totp_encrypted=enc)
            )
            logger.info("2FA secret created for new user=%s", username)

        codes = _generate_backup_codes(conn, username)

    return qr, codes


def _record_login_attempt(conn, username: str, success: bool) -> None:
    """Record a login attempt (success or failure) in the database."""
    conn.execute(
        insert(tables.login_attempts)
        .values(username=username, success=success, attempted_at=datetime.utcnow())
    )


def _check_rate_limit(conn, username: str, now: datetime) -> bool:
    """Check if the user is rate-limited due to too many failed login attempts."""
    one_min = now - timedelta(minutes=1)
    q = select(func.count()).select_from(tables.login_attempts).where(
        and_(
            tables.login_attempts.c.username == username,
            tables.login_attempts.c.success == False,
            tables.login_attempts.c.attempted_at >= one_min
        )
    )
    res = conn.execute(q)
    fail_count = res.scalar() or 0
    return fail_count >= 5


def _verify_credentials(conn, username: str, password: str, now: datetime):
    """Verify user credentials and password hash."""
    res = conn.execute(select(tables.users).where(tables.users.c.username == username))
    user = res.first()
    if not user:
        _record_login_attempt(conn, username, False)
        logger.warning("Authenticate invalid credentials for username=%s", username)
        return {"error": "invalid_credentials"}, None

    stored_hash = user.password_hash
    if not stored_hash or not bcrypt.checkpw(password.encode(), stored_hash):
        _record_login_attempt(conn, username, False)
        logger.warning("Authenticate invalid credentials for username=%s", username)
        return {"error": "invalid_credentials"}, None

    # check gendate expiry
    gendate = user.gendate
    if gendate and (now - gendate).days > 30 * 6:
        _record_login_attempt(conn, username, False)
        logger.info("Authenticate expired credentials for username=%s", username)
        return {"expired": True}, None

    return None, user


def _verify_totp(conn, user, totp_code: Optional[str]) -> Optional[dict]:
    """Verify TOTP code if TOTP is configured for the user."""
    if not user.totp_encrypted:
        return None
    if not totp_code:
        _record_login_attempt(conn, user.username, False)
        logger.warning("Authenticate totp required for username=%s", user.username)
        return {"error": "totp_required"}
    if not ENCRYPTION_KEY:
        logger.error("ENCRYPTION_KEY not set during authenticate for username=%s", user.username)
        raise RuntimeError("ENCRYPTION_KEY not set")
    f = Fernet(ENCRYPTION_KEY.encode())
    secret = f.decrypt(user.totp_encrypted).decode()
    totp = pyotp.TOTP(secret)
    if not totp.verify(totp_code, valid_window=1):
        _record_login_attempt(conn, user.username, False)
        logger.warning("Authenticate invalid totp for username=%s", user.username)
        return {"error": "invalid_totp"}
    return None


def authenticate(username: str, password: str, totp_code: Optional[str] = None) -> dict:
    """Authenticate a user using username, password, and optional TOTP.

    Args:
        username: User's username.
        password: User's password.
        totp_code: User's TOTP code.

    Returns:
        A dict containing success, expired, or error status.
    """
    logger.info("Authenticate attempt for username=%s", username)
    now = datetime.utcnow()
    with engine.begin() as conn:
        if _check_rate_limit(conn, username, now):
            logger.warning("Authenticate rate-limited for username=%s", username)
            return {"error": "rate_limited"}

        err, user = _verify_credentials(conn, username, password, now)
        if err:
            return err

        totp_err = _verify_totp(conn, user, totp_code)
        if totp_err:
            return totp_err

        _record_login_attempt(conn, username, True)
        gendate_ts = int(user.gendate.timestamp()) if user.gendate else None
        logger.info("Authenticate success for username=%s", username)
        return {"success": True, "gendate": gendate_ts}


def recover_with_backup_code(username: str, backup_code: str) -> dict:
    """Recover access to a user account using a backup code.

    Args:
        username: The user's username.
        backup_code: The backup code.

    Returns:
        The QR code of a new password or an error dict.
    """
    code = backup_code.strip()
    with engine.begin() as conn:
        res = conn.execute(select(tables.backup_codes).where(and_(tables.backup_codes.c.username == username, tables.backup_codes.c.used_at == None)))
        rows = res.fetchall()
        matched = None
        for r in rows:
            if bcrypt.checkpw(code.encode(), r.code_hash):
                matched = r
                break
        if not matched:
            return {"error": "invalid_backup_code"}

        conn.execute(update(tables.backup_codes).where(tables.backup_codes.c.id == matched.id).values(used_at=datetime.utcnow()))

    qr = generate_password_qr(username)
    return qr

