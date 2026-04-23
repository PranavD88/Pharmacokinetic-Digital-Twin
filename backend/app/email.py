import os
import smtplib
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def _get_email_credentials() -> tuple[str, str]:
    sender = os.getenv("EMAIL_USER")
    password = os.getenv("EMAIL_PASS")
    if not sender or not password:
        raise RuntimeError("EMAIL_USER and EMAIL_PASS must be set")
    return sender, password


def _send_message(message) -> None:
    sender, password = _get_email_credentials()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(sender, password)
        server.send_message(message)


def send_email(to_email: str, subject: str, body: str) -> None:
    sender, _ = _get_email_credentials()
    msg = MIMEText(body or "")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_email
    _send_message(msg)


def send_email_with_attachment(
    to_email: str,
    subject: str,
    body: str,
    attachment_filename: str,
    attachment_bytes: bytes,
    attachment_mime_type: str = "application/pdf",
) -> None:
    sender, _ = _get_email_credentials()
    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_email
    msg.attach(MIMEText(body or "", "plain"))

    if "/" in attachment_mime_type:
        maintype, subtype = attachment_mime_type.split("/", 1)
    else:
        maintype, subtype = "application", "octet-stream"

    part = MIMEBase(maintype, subtype)
    part.set_payload(attachment_bytes)
    encoders.encode_base64(part)
    part.add_header(
        "Content-Disposition",
        f'attachment; filename="{attachment_filename or "attachment.bin"}"',
    )
    msg.attach(part)

    _send_message(msg)
