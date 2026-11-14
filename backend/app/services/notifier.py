import logging
import re
from typing import Dict, Any, List, Optional
from app.core.config import settings

logger = logging.getLogger("shield.alerts")

def normalize_phone_number(phone: Optional[str]) -> Optional[str]:
    """
    Normalizes phone numbers to international E.164 format.
    Automatically prepends +91 for 10-digit Indian numbers.
    """
    if not phone:
        return None
    clean = re.sub(r"[^\d+]", "", phone.strip())
    # If 10 digits without country code, assume India (+91)
    if len(clean) == 10 and not clean.startswith("+"):
        return f"+91{clean}"
    # If 11 or 12 digits without +
    if len(clean) >= 11 and not clean.startswith("+"):
        return f"+{clean}"
    return clean

# ─── HTML Alert Email Template ────────────────────────────────────────────────

def _build_alert_html(indicator: str, incident_id: str, severity: str,
                       score: int, threat_type: str, target: str,
                       status: str, recipient_name: str = "") -> str:
    color = "#dc2626" if severity == "Critical" else "#d97706"
    return f"""
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
           background:#f8fafc;color:#1e293b;padding:20px;margin:0}}
      .container{{max-width:560px;margin:0 auto;background:#fff;border-radius:16px;
                  border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 12px rgba(15,23,42,.07)}}
      .header{{background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%);color:#fff;
               padding:28px 24px;text-align:center}}
      .header h1{{margin:0;font-size:18px;font-weight:800}}
      .header p{{margin:6px 0 0;color:#94a3b8;font-size:12px}}
      .body{{padding:24px}}
      .badge{{display:inline-block;background:{color};color:#fff;padding:4px 14px;
              border-radius:999px;font-size:12px;font-weight:800;margin-bottom:16px}}
      table{{width:100%;border-collapse:collapse;font-size:13px}}
      td{{padding:9px 12px;border-bottom:1px solid #f1f5f9}}
      td:first-child{{font-weight:700;color:#64748b;width:38%}}
      .footer{{background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 24px;
               text-align:center;font-size:11px;color:#94a3b8}}
    </style></head><body>
    <div class="container">
      <div class="header">
        <h1>🚨 Shield AI SOC — Critical Threat Alert</h1>
        <p>Real-time community cybersecurity notification</p>
      </div>
      <div class="body">
        {"<p style='font-size:13px;'>Hello <strong>" + recipient_name + "</strong>,</p>" if recipient_name else ""}
        <p style="font-size:13px;color:#475569;margin-top:0;">
          A <strong>{severity}</strong> severity threat indicator has been detected and actioned
          by the Shield AI platform. Please review and update your defenses accordingly.
        </p>
        <div class="badge">⚡ {severity.upper()} — Risk Score {score}/100</div>
        <table>
          <tr><td>Incident ID</td><td><strong>{incident_id}</strong></td></tr>
          <tr><td>Indicator</td><td><code style="background:#f1f5f9;padding:2px 6px;border-radius:4px">{indicator}</code></td></tr>
          <tr><td>Type</td><td>{threat_type}</td></tr>
          <tr><td>Severity</td><td><strong style="color:{color}">{severity}</strong></td></tr>
          <tr><td>Risk Score</td><td>{score} / 100</td></tr>
          <tr><td>Target Node</td><td>{target}</td></tr>
          <tr><td>Automated Action</td><td>{status}</td></tr>
        </table>
        <p style="font-size:11px;color:#94a3b8;margin-top:16px;">
          This alert was generated automatically by Shield AI Threat Intelligence Engine.
          If this indicator appears in your network traffic, block it immediately.
        </p>
      </div>
      <div class="footer">
        Shield AI Community Defense Portal • Sent from {settings.ALERT_EMAIL_FROM}
      </div>
    </div></body></html>
    """


class SecurityAlertService:
    """
    Alerting Engine for Critical Cybersecurity Incidents.

    Broadcast model:
      - Sends SMS + Email to the SOC admin (env-var ALERT_PHONE_NUMBER / ALERT_EMAIL_TO).
      - Also sends Email to every registered User who has an email address.
      - Also sends SMS  to every registered User who has a phone_number.
      - Also sends Email to every active DigestSubscription.
      - Also sends SMS  to every DigestSubscription that has a phone_number.

    db is optional — if not supplied, only env-var recipients are notified.
    """

    # ── Internal helpers ──────────────────────────────────────────────────────

    @classmethod
    def _send_sms(cls, to: str, body: str) -> Dict[str, Any]:
        """Send one Twilio SMS. Returns result dict."""
        from_number = settings.TWILIO_FROM_NUMBER or "+18777804236"
        to_norm = normalize_phone_number(to)
        if not to_norm or len(to_norm) < 11:
            err = f"Invalid phone '{to}'. Phone number must have 10 digits with country code (e.g. +91 9990055090)."
            logger.error(err)
            return {"status": "failed", "to": to, "error": err}

        if not (settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and from_number):
            logger.warning(f"SMS skipped for {to_norm}: Twilio credentials not configured.")
            return {"status": "simulated", "note": "No Twilio credentials configured"}
        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            msg = client.messages.create(body=body, from_=from_number, to=to_norm)
            logger.info(f"SMS sent successfully to {to_norm} — SID {msg.sid}")
            return {"status": "sent", "to": to_norm, "sid": msg.sid}
        except Exception as e:
            logger.error(f"Failed to dispatch Twilio SMS to {to_norm}: {e}")
            return {"status": "failed", "to": to_norm, "error": str(e)}

    @classmethod
    def _send_email(cls, to: str, subject: str, html: str) -> Dict[str, Any]:
        """Send one SendGrid email. Returns result dict."""
        from_email = settings.ALERT_EMAIL_FROM or "8yokshitrajora@gmail.com"
        if not settings.SENDGRID_API_KEY:
            logger.warning(f"Email skipped for {to}: SENDGRID_API_KEY not configured.")
            return {"status": "simulated", "note": "No SendGrid API key configured"}
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail
            mail = Mail(
                from_email=from_email,
                to_emails=to,
                subject=subject,
                html_content=html
            )
            sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
            resp = sg.send(mail)
            logger.info(f"Email sent successfully to {to} (HTTP {resp.status_code})")
            return {"status": "sent", "to": to}
        except Exception as e:
            logger.error(f"Failed to dispatch SendGrid Email to {to}: {e}")
            return {"status": "failed", "to": to, "error": str(e)}

    @classmethod
    async def dispatch_incident_alert(
        cls,
        threat_data: Dict[str, Any],
        db=None
    ) -> Dict[str, Any]:
        """
        Dispatches multi-channel alerts for threats to ALL registered users and subscribers.
        Every email entered by a subscriber or user automatically receives alerts.
        """
        severity = threat_data.get("severity", "Low")
        score = threat_data.get("score", 0)
        threat_type = threat_data.get("type", "Unknown")

        # Trigger alerts for all IPs or any threat with score >= 50 or High/Critical
        is_ip = threat_type == "IP"
        if not is_ip and severity not in ("Critical", "High") and score < 50:
            logger.info(f"Alert skipped for {threat_data.get('indicator')} (Severity {severity}, score {score})")
            return {"status": "skipped", "reason": "Severity below alert threshold"}

        indicator   = threat_data.get("indicator", "Unknown")
        incident_id = threat_data.get("incident_code") or threat_data.get("id", "INC-ALERT")
        target      = threat_data.get("target", "Web Edge (443)")
        action      = threat_data.get("status", "Auto-Blocked")

        sms_body = (
            f"🚨 SHIELD SOC CRITICAL ALERT [{incident_id}]\n"
            f"Indicator: {indicator}\n"
            f"Severity: {severity} (Risk: {score}/100)\n"
            f"Vector: {threat_type}\n"
            f"Action: {action}"
        )
        email_subject = f"🚨 [CRITICAL ALERT] Shield AI Detected: {indicator}"

        # ── Collect all unique recipient emails & phone numbers ───────────────
        email_recipients: Dict[str, str] = {}  # email -> display_name
        sms_recipients: set = set()

        # 1. Primary admin / fallback
        admin_email = (settings.ALERT_EMAIL_TO or "8yokshitrajora@gmail.com").strip().lower()
        if "@shieldcommunity.io" not in admin_email:
            email_recipients[admin_email] = "SOC Admin"

        if settings.ALERT_PHONE_NUMBER and settings.ALERT_PHONE_NUMBER != "+1234567890":
            sms_recipients.add(settings.ALERT_PHONE_NUMBER.strip())

        # 2. Database Subscribers (Every person who entered their email to subscribe)
        if db is not None:
            try:
                from app.models.digest import DigestSubscription
                subs = db.query(DigestSubscription).filter(DigestSubscription.is_active == True).all()
                for s in subs:
                    if s.email and "@shieldcommunity.io" not in s.email.lower():
                        email_recipients[s.email.strip().lower()] = s.organization_name or "Subscriber"
                    if s.phone_number:
                        sms_recipients.add(s.phone_number.strip())
            except Exception as e:
                logger.error(f"Error querying digest subscribers: {e}")

            # 3. Database Registered Users
            try:
                from app.models.user import User
                users = db.query(User).filter(User.is_active == True).all()
                for u in users:
                    if u.email and "@shieldcommunity.io" not in u.email.lower():
                        email_recipients[u.email.strip().lower()] = u.username or "Registered Analyst"
                    if u.phone_number:
                        sms_recipients.add(u.phone_number.strip())
            except Exception as e:
                logger.error(f"Error querying users: {e}")

        logger.info(
            f"Dispatching threat alert [{incident_id}] to {len(email_recipients)} email(s) "
            f"and {len(sms_recipients)} phone number(s)"
        )

        results = {
            "emails": [],
            "sms": [],
            "summary": {}
        }

        # Dispatch emails to every subscriber
        for email, name in email_recipients.items():
            html = _build_alert_html(indicator, incident_id, severity, score,
                                     threat_type, target, action, name)
            res = cls._send_email(email, email_subject, html)
            results["emails"].append(res)

        # Dispatch SMS to every phone subscriber
        for phone in sms_recipients:
            res = cls._send_sms(phone, sms_body)
            results["sms"].append(res)

        results["summary"] = {
            "total_emails_sent": sum(1 for e in results["emails"] if e.get("status") == "sent"),
            "total_emails_attempted": len(results["emails"]),
            "total_sms_sent": sum(1 for s in results["sms"] if s.get("status") == "sent"),
            "total_sms_attempted": len(results["sms"]),
        }
        return results
