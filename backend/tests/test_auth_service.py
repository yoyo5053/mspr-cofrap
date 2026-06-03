import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine, select, insert, and_
import pyotp
import bcrypt
from cryptography.fernet import Fernet

import app.services.auth_service as auth_service
from app.db.session import metadata
from app.models import tables
from app.core import config


@pytest.fixture(autouse=True)
def setup_sqlite_db(monkeypatch):
    """Fixture to set up an in-memory SQLite database and monkeypatch the auth_service engine."""
    # Ensure encryption key is set for testing
    if not config.ENCRYPTION_KEY:
        monkeypatch.setattr(config, "ENCRYPTION_KEY", "JbI9Nx8RQVat_kBdH05QdXm58M8P7HLwOPaWRqhy6XQ=")
    
    # Create in-memory SQLite database
    test_engine = create_engine("sqlite:///:memory:")
    metadata.create_all(bind=test_engine)
    
    # Patch the engine in auth_service and db.session
    monkeypatch.setattr(auth_service, "engine", test_engine)
    yield test_engine


# ─── generate_password_for_user ───

def test_generate_password_for_user_happy_path(setup_sqlite_db):
    """should generate password and save hash when user is new"""
    username = "new_user"
    pwd = auth_service.generate_password_for_user(username)
    
    assert len(pwd) == 24
    
    # Verify DB state
    with setup_sqlite_db.begin() as conn:
        row = conn.execute(select(tables.users).where(tables.users.c.username == username)).first()
        assert row is not None
        assert bcrypt.checkpw(pwd.encode(), row.password_hash)
        assert row.gendate is not None


def test_generate_password_for_user_existing_user(setup_sqlite_db):
    """should update password and gendate when user already exists"""
    username = "existing_user"
    pwd1 = auth_service.generate_password_for_user(username)
    
    # Wait/simulate time change slightly or check new password is different
    pwd2 = auth_service.generate_password_for_user(username)
    
    assert pwd1 != pwd2
    
    with setup_sqlite_db.begin() as conn:
        row = conn.execute(select(tables.users).where(tables.users.c.username == username)).first()
        assert row is not None
        assert bcrypt.checkpw(pwd2.encode(), row.password_hash)


def test_generate_password_for_user_edge_case_special_chars(setup_sqlite_db):
    """should generate password successfully when username has special characters"""
    username = "user-with_special.chars@domain.com"
    pwd = auth_service.generate_password_for_user(username)
    
    assert len(pwd) == 24
    with setup_sqlite_db.begin() as conn:
        row = conn.execute(select(tables.users).where(tables.users.c.username == username)).first()
        assert row is not None


# ─── generate_2fa ───

def test_generate_2fa_happy_path(setup_sqlite_db):
    """should generate 2FA secret and 10 backup codes for an existing user"""
    username = "user_2fa"
    auth_service.generate_password_for_user(username)
    
    qr, codes = auth_service.generate_2fa(username)
    
    assert qr is not None
    assert len(codes) == 10
    
    with setup_sqlite_db.begin() as conn:
        row = conn.execute(select(tables.users).where(tables.users.c.username == username)).first()
        assert row.totp_encrypted is not None
        
        backup_rows = conn.execute(select(tables.backup_codes).where(tables.backup_codes.c.username == username)).fetchall()
        assert len(backup_rows) == 10


def test_generate_2fa_new_user(setup_sqlite_db):
    """should create a new user with empty password and set up 2FA if user does not exist"""
    username = "non_existent_user"
    qr, codes = auth_service.generate_2fa(username)
    
    assert qr is not None
    assert len(codes) == 10
    
    with setup_sqlite_db.begin() as conn:
        row = conn.execute(select(tables.users).where(tables.users.c.username == username)).first()
        assert row is not None
        assert row.password_hash == b""
        assert row.totp_encrypted is not None


def test_generate_2fa_cleans_old_backup_codes(setup_sqlite_db):
    """should delete old backup codes when generating 2FA a second time"""
    username = "user_rotate_2fa"
    auth_service.generate_2fa(username)
    
    # Generate 2FA again
    qr, new_codes = auth_service.generate_2fa(username)
    
    with setup_sqlite_db.begin() as conn:
        backup_rows = conn.execute(select(tables.backup_codes).where(tables.backup_codes.c.username == username)).fetchall()
        assert len(backup_rows) == 10  # Should be exactly 10, not 20


# ─── authenticate ───

def test_authenticate_happy_path(setup_sqlite_db):
    """should authenticate successfully with correct credentials and totp"""
    username = "auth_happy"
    pwd = auth_service.generate_password_for_user(username)
    auth_service.generate_2fa(username)
    
    # Get the code
    with setup_sqlite_db.begin() as conn:
        row = conn.execute(select(tables.users).where(tables.users.c.username == username)).first()
        f = Fernet(config.ENCRYPTION_KEY.encode())
        secret = f.decrypt(row.totp_encrypted).decode()
        totp = pyotp.TOTP(secret)
        code = totp.now()
        
    res = auth_service.authenticate(username, pwd, code)
    assert res == {"success": True, "gendate": int(row.gendate.timestamp())}


def test_authenticate_error_invalid_credentials(setup_sqlite_db):
    """should return invalid_credentials error when password or username is wrong"""
    username = "auth_invalid"
    pwd = auth_service.generate_password_for_user(username)
    
    # Wrong password
    res = auth_service.authenticate(username, "wrong_password")
    assert res == {"error": "invalid_credentials"}
    
    # Non-existent user
    res = auth_service.authenticate("does_not_exist", pwd)
    assert res == {"error": "invalid_credentials"}


def test_authenticate_error_totp_issues(setup_sqlite_db):
    """should return totp_required or invalid_totp error depending on TOTP input"""
    username = "auth_totp_fail"
    pwd = auth_service.generate_password_for_user(username)
    auth_service.generate_2fa(username)
    
    # Missing TOTP
    res = auth_service.authenticate(username, pwd, None)
    assert res == {"error": "totp_required"}
    
    # Wrong TOTP
    res = auth_service.authenticate(username, pwd, "000000")
    assert res == {"error": "invalid_totp"}


def test_authenticate_edge_case_rate_limiting(setup_sqlite_db):
    """should rate limit authentication after 5 failures in the last minute"""
    username = "auth_rate_limit"
    pwd = auth_service.generate_password_for_user(username)
    
    # 5 failed attempts
    for _ in range(5):
        auth_service.authenticate(username, "wrong_password")
        
    # 6th attempt should be rate limited
    res = auth_service.authenticate(username, pwd)
    assert res == {"error": "rate_limited"}


def test_authenticate_edge_case_expiry(setup_sqlite_db, monkeypatch):
    """should flag credentials as expired if created more than 6 months ago"""
    username = "auth_expired"
    pwd = auth_service.generate_password_for_user(username)
    
    # Shift gendate to 7 months ago
    seven_months_ago = datetime.utcnow() - timedelta(days=210)
    with setup_sqlite_db.begin() as conn:
        conn.execute(
            tables.users.update()
            .where(tables.users.c.username == username)
            .values(gendate=seven_months_ago)
        )
        
    res = auth_service.authenticate(username, pwd)
    assert res == {"expired": True}


# ─── recover_with_backup_code ───

def test_recover_with_backup_code_happy_path(setup_sqlite_db):
    """should recover access and burn the used backup code"""
    username = "recover_happy"
    auth_service.generate_password_for_user(username)
    qr, codes = auth_service.generate_2fa(username)
    
    backup_code = codes[0]
    qr_new = auth_service.recover_with_backup_code(username, backup_code)
    
    assert qr_new is not None
    
    # Verify backup code is marked as used
    with setup_sqlite_db.begin() as conn:
        row = conn.execute(
            select(tables.backup_codes)
            .where(and_(tables.backup_codes.c.username == username, tables.backup_codes.c.used_at != None))
        ).first()
        assert row is not None


def test_recover_with_backup_code_errors(setup_sqlite_db):
    """should return invalid_backup_code error for invalid or already used backup codes"""
    username = "recover_errors"
    auth_service.generate_password_for_user(username)
    qr, codes = auth_service.generate_2fa(username)
    
    # Invalid code
    res = auth_service.recover_with_backup_code(username, "INVALID1")
    assert res == {"error": "invalid_backup_code"}
    
    # Use code successfully
    auth_service.recover_with_backup_code(username, codes[0])
    
    # Try using the same code again
    res = auth_service.recover_with_backup_code(username, codes[0])
    assert res == {"error": "invalid_backup_code"}
