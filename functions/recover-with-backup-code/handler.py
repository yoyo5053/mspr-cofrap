import io, base64, json, secrets, string, os
from datetime import datetime

import bcrypt
import qrcode
from sqlalchemy import create_engine, MetaData, Table, Column, String, LargeBinary, DateTime, Integer, select, insert, update, and_

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://cofrap:cofrap@postgres:5432/cofrap")

engine = create_engine(DATABASE_URL)
metadata = MetaData()

users = Table("users", metadata,
    Column("username", String, primary_key=True),
    Column("password_hash", LargeBinary),
    Column("totp_encrypted", LargeBinary),
    Column("gendate", DateTime),
)
backup_codes = Table("backup_codes", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("username", String),
    Column("code_hash", LargeBinary),
    Column("used_at", DateTime),
)


def _generate_password(length=24):
    alphabet = string.ascii_letters + string.digits + string.punctuation
    alphabet = alphabet.replace('"','').replace("'",'').replace('\\',' ')
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def _b64_qr(text):
    img = qrcode.make(text)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def handle(event, context):
    try:
        body = json.loads(event.body) if event.body else {}
        username = body.get("username")
        backup_code = body.get("backup_code", "").strip()

        if not username or not backup_code:
            return {"statusCode": 400, "body": json.dumps({"error": "username and backup_code required"})}

        with engine.begin() as conn:
            res = conn.execute(select(backup_codes).where(and_(
                backup_codes.c.username == username,
                backup_codes.c.used_at == None
            )))
            rows = res.fetchall()
            matched = None
            for r in rows:
                if bcrypt.checkpw(backup_code.encode(), r.code_hash):
                    matched = r
                    break

            if not matched:
                return {"statusCode": 400, "body": json.dumps({"error": "invalid_backup_code"})}

            conn.execute(update(backup_codes).where(backup_codes.c.id == matched.id).values(used_at=datetime.utcnow()))

            # Regénérer le mot de passe
            pwd = _generate_password()
            pwd_hash = bcrypt.hashpw(pwd.encode(), bcrypt.gensalt(rounds=12))
            conn.execute(update(users).where(users.c.username == username).values(
                password_hash=pwd_hash, gendate=datetime.utcnow()
            ))

        qr = _b64_qr(pwd)
        return {"statusCode": 200, "body": json.dumps({"qr_code": qr})}

    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
