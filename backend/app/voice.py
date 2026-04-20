from twilio.rest import Client
import os

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

def call_with_otp(to: str, otp: str):
    response = f"""
    <Response>
        <Say voice="alice">
            Your verification code is
        </Say>

        <Pause length="1"/>

        <Say voice="alice">
            {", ".join(list(otp))}
        </Say>

        <Pause length="1"/>

        <Say voice="alice">
            I repeat,
        </Say>

        <Pause length="1"/>

        <Say voice="alice">
            {", ".join(list(otp))}
        </Say>
    </Response>
    """

    call = client.calls.create(
        twiml=response,
        to=to,
        from_=TWILIO_PHONE_NUMBER
    )

    return call.sid