from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from datetime import datetime

from ...core.db import get_session
from ...core.patient_auth import create_patient_token
from ...core.security import decryptData, verifyPassword, hashPassword
from ...models import LoginRequest, Patient, User

router = APIRouter(prefix="/patient-login", tags=["patient-login"])


def _find_patient_by_email(session: Session, email: str) -> Patient | None:
    target = email.strip().lower()
    patients = session.exec(select(Patient)).all()
    for patient in patients:
        try:
            candidate = decryptData(patient.email).strip().lower()
        except Exception:
            candidate = str(patient.email).strip().lower()
        if candidate == target:
            return patient
    return None


def _find_user_by_email(session: Session, email: str) -> User | None:
    target = email.strip().lower()
    users = session.query(User).all()

    for user in users:
        try:
            decrypted_email = decryptData(user.email)
            if decrypted_email == email:
                return user
        except:
            continue

    return None


@router.post("/")
def patient_login(data: LoginRequest, session: Session = Depends(get_session)):
    user = _find_user_by_email(session, data.email)
    if user and user.is_first_login:
        if not user.otp:
            raise HTTPException(status_code=400, detail="No OTP set")

        #decrypted_otp = decryptData(user.otp)

        if user.otp != data.password:
            raise HTTPException(status_code=401, detail="Invalid OTP")

        if datetime.utcnow() > user.otp_expires:
            raise HTTPException(status_code=401, detail="OTP expired")

        return {
            "firstLogin": True,
            "message": "OTP valid"
        }

    if not user or not verifyPassword(data.password, user.hashedPassword):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    patient = _find_patient_by_email(session, data.email)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    user.last_login = datetime.utcnow()
    session.add(user)
    session.commit()

    token = create_patient_token(patient.id)
    return {"access_token": token, "token_type": "bearer"}

@router.post("/set-password")
def set_password(data: LoginRequest, session: Session = Depends(get_session)):
    user = _find_user_by_email(session, data.email)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashedPassword = hashPassword(data.password)
    user.is_first_login = False
    user.otp = None
    user.otp_expires = None

    session.add(user)
    session.commit()

    return {"message": "Password set successfully"}