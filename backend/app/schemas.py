from pydantic import BaseModel
from typing import Optional, List


class UsernameIn(BaseModel):
    username: str


class Generate2FAIn(BaseModel):
    username: str


class AuthenticateIn(BaseModel):
    username: str
    password: str
    totp_code: Optional[str] = None


class RecoverBackupIn(BaseModel):
    username: str
    backup_code: str


class QROut(BaseModel):
    qr_code: str


class Generate2FAOut(BaseModel):
    qr_code: str
    backup_codes: List[str]


class AuthenticateOut(BaseModel):
    success: bool
    expired: Optional[bool] = False
    gendate: Optional[int]
