import json, os
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
import pyotp
from cryptography.fernet import Fernet
from sqlalchemy import create_engine, MetaData, Table, Column, String, LargeBinary, DateTime, Boolean, Integer, select, insert, update, and_, func

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://cofrap:cofrap@postgres:5432/cofrap")
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY") or open("/var/openfaas/secrets/encryption-key").read().strip()

engine = create_engine(DATABASE_URL)
metadata = MetaData()

users = Table("users", metadata,
    Column("username", String, primary_key=True),
    Column("password_hash", LargeBinary),
    Column("totp_encrypted", LargeBinary),
    Column("gendate", DateTime),
)
login_attempts = Table("login_attempts", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("username", String),
    Column("success", Boolean),
    Column("attempted_at", DateTime),
)



CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def handle(event, context):
    if hasattr(event, 'method') and event.method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}
    try:
        body = json.loads(event.body) if event.body else {}
        username = body.get("username")
        password = body.get("password")
        totp_code = body.get("totp_code")

        if not username or not password:
            return {"statusCode": 400, "body": json.dumps({"error": "username and password required"})}

        now = int(datetime.utcnow().timestamp())

        with engine.begin() as conn:
            # Rate limit check
            one_min = now - timedelta(minutes=1)
            q = select(func.count()).select_from(login_attempts).where(and_(
                login_attempts.c.username == username,
                login_attempts.c.success == False,
                login_attempts.c.attempted_at >= one_min
            ))
            if (conn.execute(q).scalar() or 0) >= 5:
                return {"statusCode": 429, "body": json.dumps({"error": "rate_limited"})}

            # Get user
            res = conn.execute(select(users).where(users.c.username == username))
            user = res.first()
            if not user:
                conn.execute(insert(login_attempts).values(username=username, success=False, attempted_at=now))
                return {"statusCode": 401, "body": json.dumps({"error": "invalid_credentials"})}

            # Check password
            if not bcrypt.checkpw(password.encode(), user.password_hash):
                conn.execute(insert(login_attempts).values(username=username, success=False, attempted_at=now))
                return {"statusCode": 401, "body": json.dumps({"error": "invalid_credentials"})}

            # Check expiry (6 months)
            if user.gendate and (now - user.gendate).days > 180:
                conn.execute(insert(login_attempts).values(username=username, success=False, attempted_at=now))
                return {"statusCode": 200, "body": json.dumps({"success": False, "expired": True})}

            # Check TOTP
            if user.totp_encrypted:
                if not totp_code:
                    conn.execute(insert(login_attempts).values(username=username, success=False, attempted_at=now))
                    return {"statusCode": 401, "body": json.dumps({"error": "totp_required"})}
                f = Fernet(ENCRYPTION_KEY.encode())
                secret = f.decrypt(user.totp_encrypted).decode()
                if not pyotp.TOTP(secret).verify(totp_code, valid_window=1):
                    conn.execute(insert(login_attempts).values(username=username, success=False, attempted_at=now))
                    return {"statusCode": 401, "body": json.dumps({"error": "invalid_totp"})}

            conn.execute(insert(login_attempts).values(username=username, success=True, attempted_at=now))
            gendate_ts = int(user.gendate.timestamp()) if user.gendate else None
            return {"statusCode": 200, "body": json.dumps({"success": True, "expired": False, "gendate": gendate_ts})}

    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
