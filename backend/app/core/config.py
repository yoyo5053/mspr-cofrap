import os
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

# Database URL used by SQLAlchemy engine
DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")

# Fernet encryption key (urlsafe base64). Required for 2FA secret encryption.
ENCRYPTION_KEY: Optional[str] = os.getenv("ENCRYPTION_KEY")

# Issuer shown in TOTP apps
ISSUER: str = os.getenv("TOTP_ISSUER", "cofrap")

# Validation: if running without ENCRYPTION_KEY, warn early (but allow empty for some operations)
if not ENCRYPTION_KEY:
	# Only print when running interactively; in docker/k8s this will be set via env/secret
	try:
		import logging

		logging.getLogger(__name__).warning("ENCRYPTION_KEY is not set; 2FA operations will fail without it.")
	except Exception:
		pass
