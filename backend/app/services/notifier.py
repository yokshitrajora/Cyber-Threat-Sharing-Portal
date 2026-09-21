import logging
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger("shield.alerts")

class SecurityAlertService:
    """
    Alerting Engine for Critical Cybersecurity Incidents.
    Supports Twilio (SMS) and SendGrid/SMTP (Email) notifications.
    """

    @classmethod
    async def dispatch_incident_alert(cls, threat_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dispatches multi-channel alerts for Critical or High severity threats.
        """
        severity = threat_data.get("severity", "Low")
        score = threat_data.get("score", 0)

        # Trigger alerts only for Critical or High severity incidents
        if severity not in ("Critical", "High") and score < 75:
            return {"status": "skipped", "reason": "Severity below alert threshold"}

        indicator = threat_data.get("indicator", "Unknown")
        incident_id = threat_data.get("incident_code") or threat_data.get("id", "INC-ALERT")
        alert_summary = (
            f"🚨 SHIELD SOC CRITICAL ALERT [{incident_id}]\n"
            f"Indicator: {indicator}\n"
            f"Severity: {severity} (Risk: {score}/100)\n"
            f"Vector: {threat_data.get('type')}\n"
            f"Action: {threat_data.get('status')}"
        )

        results = {}

        # 1. Twilio SMS Dispatch
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.ALERT_PHONE_NUMBER:
            try:
                from twilio.rest import Client
                client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                message = client.messages.create(
                    body=alert_summary,
                    from_=settings.TWILIO_FROM_NUMBER,
                    to=settings.ALERT_PHONE_NUMBER
                )
                results["twilio_sms"] = {"status": "sent", "sid": message.sid}
            except Exception as e:
                logger.error(f"Failed to dispatch Twilio SMS: {e}")
                results["twilio_sms"] = {"status": "failed", "error": str(e)}
        else:
            results["twilio_sms"] = {"status": "simulated", "note": "No Twilio credentials configured"}

        # 2. SendGrid Email Dispatch
        if settings.SENDGRID_API_KEY and settings.ALERT_EMAIL_TO:
            try:
                from sendgrid import SendGridAPIClient
                from sendgrid.helpers.mail import Mail

                mail = Mail(
                    from_email=settings.ALERT_EMAIL_FROM,
                    to_emails=settings.ALERT_EMAIL_TO,
                    subject=f"🚨 [CRITICAL ALERT] Shield AI Detected: {indicator}",
                    html_content=f"""
                    <h2>Shield AI Threat Detection Alert</h2>
                    <p><strong>Incident ID:</strong> {incident_id}</p>
                    <p><strong>Indicator:</strong> <code>{indicator}</code></p>
                    <p><strong>Severity:</strong> <span style="color:red;font-weight:bold;">{severity}</span></p>
                    <p><strong>Risk Score:</strong> {score}/100</p>
                    <p><strong>Target Node:</strong> {threat_data.get('target')}</p>
                    <p><strong>Automated Action:</strong> {threat_data.get('status')}</p>
                    """
                )
                sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
                sg.send(mail)
                results["sendgrid_email"] = {"status": "sent"}
            except Exception as e:
                logger.error(f"Failed to dispatch SendGrid Email: {e}")
                results["sendgrid_email"] = {"status": "failed", "error": str(e)}
        else:
            results["sendgrid_email"] = {"status": "simulated", "note": "No SendGrid credentials configured"}

        logger.info(f"Multi-channel alert evaluation: {alert_summary}")
        return results
