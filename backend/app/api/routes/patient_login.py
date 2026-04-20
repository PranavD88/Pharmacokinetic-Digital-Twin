from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from datetime import datetime, timedelta
import random, os
from twilio.rest import Client

from ...core.db import get_session
from ...core.patient_auth import create_patient_token
from ...core.security import decryptData, verifyPassword, hashPassword
from ...models import LoginRequest, Patient, User
from ...voice import call_with_otp

router = APIRouter(prefix="/patient-login", tags=["patient-login"])


def send_sms(to_phone: str, message: str):
    client = Client(
        os.getenv("TWILIO_ACCOUNT_SID"),
        os.getenv("TWILIO_AUTH_TOKEN")
    )

    client.messages.create(
        body=message,
        from_=os.getenv("TWILIO_PHONE_NUMBER"),
        to=to_phone
    )

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

        if user.otp != data.password:
            raise HTTPException(status_code=401, detail="Invalid OTP")

        """if datetime.utcnow() > user.otp_expires:
            raise HTTPException(status_code=401, detail="OTP expired")"""

        patient = _find_patient_by_email(session, data.email)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        phone_otp = str(random.randint(100000, 999999))
        user.phone_otp = hashPassword(phone_otp)
        user.phone_otp_expires = datetime.utcnow() + timedelta(minutes=5)
        user.is_2fa_verified = False

        session.add(user)
        session.commit()
        print("Raw Phone Value:", patient.number)
        if not patient.number:
            raise HTTPException(status_code=400, detail="No phone number on file")

        phone_number = decryptData(patient.number)
        if not phone_number.startswith("+1"):
            phone_number = "+1" + phone_number

        call_with_otp(phone_number, phone_otp)

        return {
            "firstLogin": True,
            "email": data.email,
            "requires_otp": True,
            "status": "phone_otp_sent"
        }

    if not user or not verifyPassword(data.password, user.hashedPassword):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_2fa_verified:
        raise HTTPException(status_code=403, detail="Complete 2FA setup first")

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

    patient = _find_patient_by_email(session, data.email)

    return {
        "message": "Password set successfully"
    }
    
@router.post("/verify-2fa")
def verify_2fa(data: LoginRequest, session: Session = Depends(get_session)):
    user = _find_user_by_email(session, data.email)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.phone_otp:
        raise HTTPException(status_code=400, detail="No 2FA code set")

    if not verifyPassword(data.password, user.phone_otp):
        raise HTTPException(status_code=401, detail="Invalid 2FA code")

    if datetime.utcnow() > user.phone_otp_expires:
        raise HTTPException(status_code=401, detail="2FA code expired")

    user.phone_otp = None
    user.phone_otp_expires = None
    user.is_2fa_verified = True

    session.add(user)
    session.commit()

    patient = _find_patient_by_email(session, data.email)
    token = create_patient_token(patient.id)

    return {
        "access_token": token,
        "token_type": "bearer"
    }