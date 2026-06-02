import logging

from fastapi import APIRouter, HTTPException

from app.schemas import UsernameIn, QROut, Generate2FAIn, Generate2FAOut, AuthenticateIn, AuthenticateOut, RecoverBackupIn
from app.services import auth_service

router = APIRouter()
logger = logging.getLogger("cofrap.api")


@router.post("/generate-password", response_model=QROut)
def generate_password(payload: UsernameIn):
    logger.info("generate-password requested for username=%s", payload.username)
    try:
        b64 = auth_service.generate_password_qr(payload.username)
        logger.info("generate-password success for username=%s", payload.username)
        return {"qr_code": b64}
    except Exception as e:
        logger.exception("generate-password failed for username=%s", payload.username)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-2fa", response_model=Generate2FAOut)
def generate_2fa(payload: Generate2FAIn):
    logger.info("generate-2fa requested for username=%s", payload.username)
    try:
        qr, codes = auth_service.generate_2fa(payload.username)
        logger.info("generate-2fa success for username=%s", payload.username)
        return {"qr_code": qr, "backup_codes": codes}
    except Exception as e:
        logger.exception("generate-2fa failed for username=%s", payload.username)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/authenticate", response_model=AuthenticateOut)
def authenticate(payload: AuthenticateIn):
    logger.info("authenticate requested for username=%s", payload.username)
    res = auth_service.authenticate(payload.username, payload.password, payload.totp_code)
    if "error" in res:
        logger.warning("authenticate failed for username=%s reason=%s", payload.username, res["error"])
        raise HTTPException(status_code=400, detail=res["error"])
    if "expired" in res and res["expired"]:
        logger.info("authenticate expired for username=%s", payload.username)
        return {"success": False, "expired": True, "gendate": None}
    logger.info("authenticate success for username=%s", payload.username)
    return {"success": True, "expired": False, "gendate": res.get("gendate")}


@router.post("/recover-with-backup-code", response_model=QROut)
def recover(payload: RecoverBackupIn):
    logger.info("recover-with-backup-code requested for username=%s", payload.username)
    res = auth_service.recover_with_backup_code(payload.username, payload.backup_code)
    if isinstance(res, dict) and "error" in res:
        logger.warning("recover-with-backup-code failed for username=%s reason=%s", payload.username, res["error"])
        raise HTTPException(status_code=400, detail=res["error"])
    logger.info("recover-with-backup-code success for username=%s", payload.username)
    return {"qr_code": res}
