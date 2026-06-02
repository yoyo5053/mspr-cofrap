from fastapi import APIRouter, HTTPException

from app.schemas import UsernameIn, QROut, Generate2FAIn, Generate2FAOut, AuthenticateIn, AuthenticateOut, RecoverBackupIn
from app.services import auth_service

router = APIRouter()


@router.post("/generate-password", response_model=QROut)
def generate_password(payload: UsernameIn):
    try:
        b64 = auth_service.generate_password_qr(payload.username)
        return {"qr_code": b64}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-2fa", response_model=Generate2FAOut)
def generate_2fa(payload: Generate2FAIn):
    try:
        qr, codes = auth_service.generate_2fa(payload.username)
        return {"qr_code": qr, "backup_codes": codes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/authenticate", response_model=AuthenticateOut)
def authenticate(payload: AuthenticateIn):
    res = auth_service.authenticate(payload.username, payload.password, payload.totp_code)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    if "expired" in res and res["expired"]:
        return {"success": False, "gendate": None}
    return {"success": True, "gendate": res.get("gendate")}


@router.post("/recover-with-backup-code", response_model=QROut)
def recover(payload: RecoverBackupIn):
    res = auth_service.recover_with_backup_code(payload.username, payload.backup_code)
    if isinstance(res, dict) and "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return {"qr_code": res}
