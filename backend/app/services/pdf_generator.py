import io
from datetime import datetime
from typing import List, Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.services.s3 import upload_file_bytes_to_s3, generate_presigned_download_url

def generate_movie_sentiment_pdf(
    movie_id: str,
    title: str,
    genre: str,
    director: str,
    release_year: int,
    analytics_data: Dict[str, Any],
    recent_reviews: List[Dict[str, Any]]
) -> Dict[str, str]:
    """
    Builds a professional AI Sentiment Analytics Dossier in PDF format using ReportLab
    and streams directly to AWS S3 with SSE-S3 encryption.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Brand Colors matching Soft Pale Yellow & Pale Red Aesthetic
    COLOR_PRIMARY = colors.HexColor("#E11D48")     # Crimson Rose
    COLOR_TEXT = colors.HexColor("#881337")        # Deep Crimson
    COLOR_SURFACE = colors.HexColor("#FFFBEB")     # Warm Cream
    COLOR_BORDER = colors.HexColor("#FECDD3")      # Pale Red Border
    COLOR_MUTED = colors.HexColor("#9F1239")

    title_style = ParagraphStyle(
        "DossierTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=COLOR_PRIMARY,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        "DossierSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        textColor=COLOR_TEXT,
        spaceAfter=14
    )

    heading2_style = ParagraphStyle(
        "Heading2Custom",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=COLOR_TEXT,
        spaceBefore=12,
        spaceAfter=8
    )

    normal_style = ParagraphStyle(
        "NormalCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=COLOR_TEXT
    )

    story = []

    # Header Section
    story.append(Paragraph("🎬 CinemAI Intelligence Network", title_style))
    story.append(Paragraph(f"AI Sentiment Analytics Dossier & Audience Pulse — Generated {datetime.utcnow().strftime('%B %d, %Y %H:%M UTC')}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=COLOR_PRIMARY, spaceAfter=14))

    # Movie Overview Card
    movie_info = [
        [Paragraph("<b>Movie Title:</b>", normal_style), Paragraph(f"<b>{title}</b>", normal_style)],
        [Paragraph("<b>Genre:</b>", normal_style), Paragraph(genre, normal_style)],
        [Paragraph("<b>Director:</b>", normal_style), Paragraph(director, normal_style)],
        [Paragraph("<b>Release Year:</b>", normal_style), Paragraph(str(release_year), normal_style)],
    ]
    t_movie = Table(movie_info, colWidths=[120, 420])
    t_movie.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_SURFACE),
        ('BOX', (0,0), (-1,-1), 1, COLOR_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, COLOR_BORDER),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_movie)
    story.append(Spacer(1, 14))

    # Sentiment Metrics Summary Card
    story.append(Paragraph("📊 Audience Sentiment & Rating Metrics", heading2_style))
    metrics_data = [
        ["Total Reviews", "Average Rating", "Positive Sentiment", "Neutral Sentiment", "Negative Sentiment"],
        [
            str(analytics_data.get("total_reviews", 0)),
            f"⭐ {analytics_data.get('avg_rating', 0.0):.1f} / 5.0",
            f"{analytics_data.get('positive_pct', 0.0):.1f}%",
            f"{analytics_data.get('neutral_pct', 0.0):.1f}%",
            f"{analytics_data.get('negative_pct', 0.0):.1f}%"
        ]
    ]
    t_metrics = Table(metrics_data, colWidths=[108, 108, 108, 108, 108])
    t_metrics.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), COLOR_PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('BACKGROUND', (0,1), (-1,1), COLOR_SURFACE),
        ('BOX', (0,0), (-1,-1), 1, COLOR_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, COLOR_BORDER),
        ('PADDING', (0,1), (-1,1), 8),
    ]))
    story.append(t_metrics)
    story.append(Spacer(1, 16))

    # Recent Analyzed Audience Reviews
    story.append(Paragraph("💬 Representative Analyzed Reviews", heading2_style))
    
    review_rows = [["Reviewer", "Rating", "Sentiment Score", "Label", "Feedback"]]
    for rev in recent_reviews[:6]:
        label = rev.get("sentiment_label", "Neutral")
        score = rev.get("sentiment_score", 0.0)
        review_rows.append([
            rev.get("user_name", "Anonymous"),
            f"{rev.get('rating', 5)}/5",
            f"{score:+.2f}",
            label,
            Paragraph(rev.get("review_text", "")[:140] + ("..." if len(rev.get("review_text", "")) > 140 else ""), normal_style)
        ])

    if len(review_rows) > 1:
        t_reviews = Table(review_rows, colWidths=[90, 45, 80, 65, 260])
        t_reviews.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), COLOR_TEXT),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 8),
            ('ALIGN', (1,1), (3,-1), 'CENTER'),
            ('BACKGROUND', (0,1), (-1,-1), COLOR_SURFACE),
            ('BOX', (0,0), (-1,-1), 1, COLOR_BORDER),
            ('INNERGRID', (0,0), (-1,-1), 0.5, COLOR_BORDER),
            ('PADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(t_reviews)
    else:
        story.append(Paragraph("<i>No audience reviews submitted yet.</i>", normal_style))

    # Footer note
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=1, color=COLOR_BORDER, spaceAfter=8))
    footer_text = "Generated autonomously by CinemAI Cloud Intelligence. Encrypted and securely persisted in AWS S3 Free Tier Vault."
    story.append(Paragraph(f"<font size=8 color='#9F1239'><i>{footer_text}</i></font>", normal_style))

    # Build the document
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    # Upload to AWS S3
    file_key = f"reports/sentiment_dossier_{movie_id}.pdf"
    s3_url = upload_file_bytes_to_s3(pdf_bytes, file_key, content_type="application/pdf")
    presigned_download = generate_presigned_download_url(file_key, expires_in=7200)

    return {
        "s3_url": s3_url,
        "file_key": file_key,
        "download_url": presigned_download
    }
