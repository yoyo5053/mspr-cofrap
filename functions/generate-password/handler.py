import io, base64, json, secrets, string, os
from datetime import datetime

import bcrypt
import qrcode
from sqlalchemy import create_engine, MetaData, Table, Column, String, LargeBinary, DateTime, select, insert, update


DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://cofrap:cofrap@postgres:5432/cofrap")
engine = create_engine(DATABASE_URL)
metadata = MetaData()

users = Table("users", metadata,
    Column("username", String, primary_key=True),
    Column("password_hash", LargeBinary),
    Column("totp_encrypted", LargeBinary),
    Column("gendate", DateTime),
)
metadata.create_all(engine)


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
        if not username:
            return {"statusCode": 400, "body": json.dumps({"error": "username required"})}

        pwd = _generate_password()
        pwd_hash = bcrypt.hashpw(pwd.encode(), bcrypt.gensalt(rounds=12))
        now = int(datetime.utcnow().timestamp())

        with engine.begin() as conn:
            res = conn.execute(select(users.c.username).where(users.c.username == username))
            if res.first():
                conn.execute(update(users).where(users.c.username == username).values(password_hash=pwd_hash, gendate=now))
            else:
                conn.execute(insert(users).values(username=username, password_hash=pwd_hash, gendate=now))

        qr = _b64_qr(pwd)
        return {"statusCode": 200, "body": json.dumps({"qr_code": qr})}

    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
