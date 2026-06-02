from sqlalchemy import Table, Column, Integer, String, LargeBinary, DateTime, Boolean, ForeignKey, func
from sqlalchemy.sql import expression
from app.db.session import metadata

users = Table(
    "users",
    metadata,
    Column("username", String, primary_key=True),
    Column("password_hash", LargeBinary, nullable=False),
    Column("totp_encrypted", LargeBinary, nullable=True),
    Column("gendate", DateTime, nullable=True),
)

backup_codes = Table(
    "backup_codes",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("username", String, ForeignKey("users.username", ondelete="CASCADE"), nullable=False),
    Column("code_hash", LargeBinary, nullable=False),
    Column("used_at", DateTime, nullable=True),
)

login_attempts = Table(
    "login_attempts",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("username", String, nullable=False),
    Column("success", Boolean, nullable=False, server_default=expression.false()),
    Column("attempted_at", DateTime, nullable=False, server_default=func.now()),
)
