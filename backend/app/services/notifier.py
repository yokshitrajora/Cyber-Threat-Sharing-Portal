import logging
from typing import Dict, Any, List, Optional
from app.core.config import settings

logger = logging.getLogger("shield.alerts")

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
        if not (settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_FROM_NUMBER):
            return {"status": "simulated", "note": "No Twilio credentials configured"}
        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            msg = client.messages.create(body=body, from_=settings.TWILIO_FROM_NUMBER, to=to)
            logger.info(f"SMS sent to {to} — SID {msg.sid}")
            return {"status": "sent", "to": to, "sid": msg.sid}
        except Exception as e:
            logger.error(f"SMS failed to {to}: {e}")
            return {"status": "failed", "to": to, "error": str(e)}

    @classmethod
    def _send_email(cls, to: str, subject: str, html: str) -> Dict[str, Any]:
        """Send one SendGrid email. Returns result dict."""
        if not settings.SENDGRID_API_KEY:
            return {"status": "simulated", "note": "No SendGrid API key configured"}
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail
            mail = Mail(
                from_email=settings.ALERT_EMAIL_FROM,
                to_emails=to,
                subject=subject,
                html_content=html
            )
            sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
            sg.send(mail)
            logger.info(f"Email sent to {to}")
            return {"status": "sent", "to": to}
        except Exception as e:
            logger.error(f"Email failed to {to}: {e}")
            return {"status": "failed", "to": to, "error": str(e)}

    # ── Public API ────────────────────────────────────────────────────────────

    @classmethod
    async def dispatch_incident_alert(
        cls,
        threat_data: Dict[str, Any],
        db=None           # Optional SQLAlchemy Session
    ) -> Dict[str, Any]:
        """
        Dispatches multi-channel alerts for Critical or High severity threats
        to ALL registered users and digest subscribers.
        """
        severity = threat_data.get("severity", "Low")
        score = threat_data.get("score", 0)

        if severity not in ("Critical", "High") and score < 75:
            return {"status": "skipped", "reason": "Severity below alert threshold"}

        indicator   = threat_data.get("indicator", "Unknown")
        incident_id = threat_data.get("incident_code") or threat_data.get("id", "INC-ALERT")
        threat_type = threat_data.get("type", "Unknown")
        target      = threat_data.get("target", "Unknown")
        action      = threat_data.get("status", "Pending")

        sms_body = (
            f"🚨 SHIELD SOC CRITICAL ALERT [{incident_id}]\n"
            f"Indicator: {indicator}\n"
            f"Severity: {severity} (Risk: {score}/100)\n"
            f"Vector: {threat_type}\n"
            f"Action: {action}"
        )
        email_subject = f"🚨 [CRITICAL ALERT] Shield AI Detected: {indicator}"

        results = {
            "soc_admin_sms":   [],
            "soc_admin_email": [],
            "user_emails":     [],
            "user_sms":        [],
            "org_emails":      [],
            "org_sms":         [],
        }

        # ── 1. SOC Admin (env-var recipients — always notified) ───────────────
        if settings.ALERT_PHONE_NUMBER:
            results["soc_admin_sms"].append(
                cls._send_sms(settings.ALERT_PHONE_NUMBER, sms_body)
            )

        if settings.ALERT_EMAIL_TO:
            html = _build_alert_html(indicator, incident_id, severity, score,
                                     threat_type, target, action, "SOC Admin")
            results["soc_admin_email"].append(
                cls._send_email(settings.ALERT_EMAIL_TO, email_subject, html)
            )

        # ── 2. All registered Users ───────────────────────────────────────────
        if db is not None:
            try:
                from app.models.user import User
                users = db.query(User).filter(User.is_active == True).all()
                for u in users:
                    # Skip SOC admin email (already sent above) to avoid duplicate
                    if u.email and u.email != settings.ALERT_EMAIL_TO:
                        html = _build_alert_html(indicator, incident_id, severity, score,
                                                 threat_type, target, action,
                                                 u.username or u.email)
                        results["user_emails"].append(
                            cls._send_email(u.email, email_subject, html)
                        )
                    if u.phone_number and u.phone_number != settings.ALERT_PHONE_NUMBER:
                        results["user_sms"].append(
                            cls._send_sms(u.phone_number, sms_body)
                        )
            except Exception as e:
                logger.error(f"Failed to load users for broadcast: {e}")

            # ── 3. All active Digest Subscribers (Organisations) ──────────────
            try:
                from app.models.digest import DigestSubscription
                subs = db.query(DigestSubscription).filter(
                    DigestSubscription.is_active == True
                ).all()
                for s in subs:
                    if s.email and s.email != settings.ALERT_EMAIL_TO:
                        html = _build_alert_html(indicator, incident_id, severity, score,
                                                 threat_type, target, action,
                                                 s.organization_name or s.email)
                        results["org_emails"].append(
                            cls._send_email(s.email, email_subject, html)
                        )
                    if s.phone_number and s.phone_number != settings.ALERT_PHONE_NUMBER:
                        results["org_sms"].append(
                            cls._send_sms(s.phone_number, sms_body)
                        )
            except Exception as e:
                logger.error(f"Failed to load digest subscribers for broadcast: {e}")

        total_emails = (
            len(results["soc_admin_email"]) +
            len(results["user_emails"]) +
            len(results["org_emails"])
        )
        total_sms = (
            len(results["soc_admin_sms"]) +
            len(results["user_sms"]) +
            len(results["org_sms"])
        )
        logger.info(
            f"Alert broadcast complete — {total_emails} emails, {total_sms} SMS "
            f"for [{incident_id}] {indicator}"
        )
        results["summary"] = {
            "total_emails_dispatched": total_emails,
            "total_sms_dispatched": total_sms
        }
        return results
