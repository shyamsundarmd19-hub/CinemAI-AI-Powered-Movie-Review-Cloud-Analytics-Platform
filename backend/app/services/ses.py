from typing import List, Dict, Any, Optional
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from app.core.config import settings

def get_ses_client():
    """Initializes boto3 SES client with region settings."""
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        return boto3.client(
            "ses",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
    return boto3.client("ses", region_name=settings.AWS_REGION)

def send_flagged_review_alert(
    admin_emails: List[str],
    review_id: str,
    movie_title: str,
    reviewer_name: str,
    review_text: str,
    toxic_reasons: List[str]
) -> bool:
    """
    Dispatches immediate alert email via AWS SES to administrators
    when the NLP engine flags an abusive or toxic movie review.
    """
    if not admin_emails:
        admin_emails = ["admin@cinemai.com"]

    subject = f"🚨 [CinemAI Alert] Toxic Review Flagged: '{movie_title}'"
    reasons_html = "".join([f"<li>⚠️ {r}</li>" for r in toxic_reasons])

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #FEFCE8; color: #881337; padding: 25px;">
        <div style="background-color: #FFFBEB; border: 2px solid #FECDD3; border-radius: 12px; padding: 24px; max-width: 600px; margin: auto;">
            <h2 style="color: #E11D48; margin-top: 0;">🛡️ Toxic Review Detected & Flagged</h2>
            <p>The NLP Moderation Engine has identified a toxic or abusive review submission.</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr><td style="padding: 6px; font-weight: bold;">Movie:</td><td>{movie_title}</td></tr>
                <tr><td style="padding: 6px; font-weight: bold;">Reviewer:</td><td>{reviewer_name}</td></tr>
                <tr><td style="padding: 6px; font-weight: bold;">Review ID:</td><td><code>{review_id}</code></td></tr>
            </table>
            <div style="background-color: #FFE4E6; border-left: 4px solid #E11D48; padding: 12px; margin: 15px 0;">
                <p style="font-weight: bold; margin: 0 0 6px 0;">Review Content:</p>
                <p style="margin: 0; font-style: italic;">"{review_text}"</p>
            </div>
            <h4 style="color: #BE123C; margin-bottom: 6px;">Flag Reasons:</h4>
            <ul>{reasons_html}</ul>
            <p style="margin-top: 20px; font-size: 13px; color: #713F12;">
                Review this entry in your CinemAI Admin Dashboard to approve or purge.
            </p>
        </div>
    </body>
    </html>
    """

    try:
        ses = get_ses_client()
        ses.send_email(
            Source=settings.SES_SENDER_EMAIL,
            Destination={"ToAddresses": admin_emails},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {"Html": {"Data": html_body, "Charset": "UTF-8"}}
            }
        )
        return True
    except (ClientError, NoCredentialsError) as e:
        print(f"[AWS SES Simulation] Alert not sent (AWS credentials not configured): {e}")
        return False

def send_sentiment_digest(
    recipient_email: str,
    movie_title: str,
    analytics_data: Dict[str, Any],
    pdf_download_url: Optional[str] = None
) -> bool:
    """
    Sends sentiment analytics digest to critics or admins with optional PDF attachment link.
    """
    subject = f"📊 [CinemAI Digest] AI Sentiment Summary for '{movie_title}'"
    
    pdf_section = ""
    if pdf_download_url:
        pdf_section = f"""
        <p style="margin-top: 15px;">
            <a href="{pdf_download_url}" style="background-color: #E11D48; color: #FFF; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                Download Sentiment Dossier (PDF)
            </a>
        </p>
        """

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #FEFCE8; color: #881337; padding: 25px;">
        <div style="background-color: #FFFBEB; border: 2px solid #FECDD3; border-radius: 12px; padding: 24px; max-width: 600px; margin: auto;">
            <h2 style="color: #E11D48; margin-top: 0;">🎬 Sentiment Analytics Digest</h2>
            <h3 style="color: #881337;">{movie_title}</h3>
            <p><strong>Total Audience Reviews:</strong> {analytics_data.get('total_reviews', 0)}</p>
            <p><strong>Average Rating:</strong> ⭐ {analytics_data.get('avg_rating', 0.0)} / 5.0</p>
            <hr style="border: 0; border-top: 1px solid #FECDD3; margin: 15px 0;">
            <p><strong>Positive Sentiment:</strong> {analytics_data.get('positive_pct', 0.0)}%</p>
            <p><strong>Neutral Sentiment:</strong> {analytics_data.get('neutral_pct', 0.0)}%</p>
            <p><strong>Negative Sentiment:</strong> {analytics_data.get('negative_pct', 0.0)}%</p>
            {pdf_section}
        </div>
    </body>
    </html>
    """

    try:
        ses = get_ses_client()
        ses.send_email(
            Source=settings.SES_SENDER_EMAIL,
            Destination={"ToAddresses": [recipient_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {"Html": {"Data": html_body, "Charset": "UTF-8"}}
            }
        )
        return True
    except (ClientError, NoCredentialsError) as e:
        print(f"[AWS SES Simulation] Digest email not sent: {e}")
        return False
