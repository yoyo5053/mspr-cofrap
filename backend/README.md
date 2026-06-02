# Auth Service

FastAPI service implementing OpenFaaS-like endpoints for password generation, 2FA, authentication and recovery.

Environment variables:
- `DATABASE_URL` (Postgres DSN)
- `ENCRYPTION_KEY` (Fernet key, urlsafe base64)
- `TOTP_ISSUER` (optional)

Run locally (install requirements first):

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
UVICORN_CMD="uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
export DATABASE_URL=postgresql://user:pass@localhost:5432/db
export ENCRYPTION_KEY=$(python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
$UVICORN_CMD
```

Run with Docker Compose:

```bash
cp .env.example .env
# replace ENCRYPTION_KEY in .env with a real key
docker compose up --build
```

Database migrations with Alembic:

Initialize (already included):

```bash
# create a revision with autogenerate
alembic revision --autogenerate -m "initial"
# apply migrations
alembic upgrade head
```

Alembic configuration reads `DATABASE_URL` from the environment. You can set it in `.env` before running commands.

