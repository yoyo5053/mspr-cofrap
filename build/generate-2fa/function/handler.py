import io, base64, json, secrets, string, os

import bcrypt
import pyotp
import qrcode
from cryptography.fernet import Fernet
from sqlalchemy import create_engine, MetaData, Table, Column, String, LargeBinary, DateTime, Integer, select, insert, update, delete

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://cofrap:cofrap@postgres:5432/cofrap")
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY") or open("/var/openfaas/secrets/encryption-key").read().strip()
ISSUER = "COFRAP"

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


def _b64_qr(text):
    img = qrcode.make(text)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def _generate_backup_codes(conn, username):
    conn.execute(delete(backup_codes).where(backup_codes.c.username == username))
    codes = []
    for _ in range(10):
        raw = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        formatted = raw[:4] + '-' + raw[4:]
        codes.append(formatted)
        hashed = bcrypt.hashpw(formatted.encode(), bcrypt.gensalt(rounds=12))
        conn.execute(insert(backup_codes).values(
            username=username, code_hash=hashed
        ))
    return codes



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
        if not username:
            return {"statusCode": 400, "body": json.dumps({"error": "username required"})}

        secret = pyotp.random_base32()
        f = Fernet(ENCRYPTION_KEY.encode())
        enc = f.encrypt(secret.encode())
        uri = pyotp.totp.TOTP(secret).provisioning_uri(name=username, issuer_name=ISSUER)
        qr = _b64_qr(uri)

        with engine.begin() as conn:
            res = conn.execute(select(users.c.username).where(users.c.username == username))
            if res.first():
                conn.execute(update(users).where(users.c.username == username).values(totp_encrypted=enc))
            else:
                conn.execute(insert(users).values(username=username, password_hash=b"", totp_encrypted=enc))
            codes = _generate_backup_codes(conn, username)

        return {"statusCode": 200, "body": json.dumps({"qr_code": qr, "backup_codes": codes})}

    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
