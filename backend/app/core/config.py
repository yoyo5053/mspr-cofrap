import os
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken
from dotenv import load_dotenv

load_dotenv()

# Database URL used by SQLAlchemy engine
DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")

# Fernet encryption key (urlsafe base64). Required for 2FA secret encryption.
ENCRYPTION_KEY: Optional[str] = os.getenv("ENCRYPTION_KEY")

# Issuer shown in TOTP apps
ISSUER: str = os.getenv("TOTP_ISSUER", "cofrap")

# Validation: warn or fail early for invalid encryption keys.
if ENCRYPTION_KEY:
    try:
        Fernet(ENCRYPTION_KEY.encode())
    except (ValueError, InvalidToken) as exc:
        raise RuntimeError("ENCRYPTION_KEY is invalid; it must be 32 url-safe base64-encoded bytes.") from exc
else:
    try:
        import logging

        logging.getLogger(__name__).warning("ENCRYPTION_KEY is not set; 2FA operations will fail without it.")
    except Exception:
        pass
