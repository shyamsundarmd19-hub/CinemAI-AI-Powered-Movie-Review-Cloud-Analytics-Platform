import os
import platform
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_role
from app.models.models import User, Movie, Review, SentimentAnalytics
from app.schemas.schemas import AdminAnalyticsResponse, ReviewResponse
from app.routers.reviews import recalculate_movie_analytics

router = APIRouter(prefix="/admin", tags=["Admin Portal & Cloud Monitoring"])

@router.get("/analytics", response_model=AdminAnalyticsResponse)
def get_admin_analytics(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Admin Only: Returns overall system analytics, sentiment distribution across the
    entire movie network, the moderation queue of flagged toxic reviews, and AWS
    infrastructure health indicators.
    """
    total_users = db.query(User).count()
    total_movies = db.query(Movie).count()
    total_reviews = db.query(Review).count()

    flagged_reviews = (
        db.query(Review)
        .filter(Review.flag_toxic == True)
        .order_by(Review.created_at.desc())
        .all()
    )
    flagged_count = len(flagged_reviews)

    # Compute overall network sentiment breakdown
    valid_reviews = db.query(Review).filter(Review.flag_toxic == False).all()
    valid_count = len(valid_reviews)

    if valid_count > 0:
        pos_cnt = sum(1 for r in valid_reviews if r.sentiment_label == "Positive")
        neu_cnt = sum(1 for r in valid_reviews if r.sentiment_label == "Neutral")
        neg_cnt = sum(1 for r in valid_reviews if r.sentiment_label == "Negative")
        sentiment_breakdown = {
            "positive_pct": round((pos_cnt / valid_count) * 100.0, 1),
            "neutral_pct": round((neu_cnt / valid_count) * 100.0, 1),
            "negative_pct": round((neg_cnt / valid_count) * 100.0, 1)
        }
    else:
        sentiment_breakdown = {
            "positive_pct": 0.0,
            "neutral_pct": 0.0,
            "negative_pct": 0.0
        }

    # System & Free Tier telemetry
    system_metrics = {
        "status": "OPERATIONAL",
        "platform": platform.platform(),
        "python_version": platform.python_version(),
        "aws_free_tier": {
            "ec2_instance": "t2.micro / t3.micro (Direct Host venv)",
            "rds_storage": "PostgreSQL 20GB Free Tier Allocated",
            "s3_vault": "Standard SSE-S3 Encrypted Bucket",
            "ses_status": "Sandbox / Production Active"
        },
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

    return {
        "total_users": total_users,
        "total_movies": total_movies,
        "total_reviews": total_reviews,
        "flagged_reviews_count": flagged_count,
        "overall_sentiment_breakdown": sentiment_breakdown,
        "flagged_queue": flagged_reviews,
        "system_metrics": system_metrics
    }

@router.patch("/review/{review_id}/unflag")
def unflag_review(
    review_id: str,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Admin Only: Moderation action to clear the toxic flag on a false-positive review
    and restore it to public audience visibility.
    """
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    review.flag_toxic = False
    db.commit()

    recalculate_movie_analytics(review.movie_id, db)
    return {"message": "Review unflagged and restored to public audience stream", "review_id": review_id}

@router.delete("/review/{review_id}/purge")
def purge_toxic_review(
    review_id: str,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Admin Only: Permanently deletes a toxic or abusive review."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    movie_id = review.movie_id
    db.delete(review)
    db.commit()

    recalculate_movie_analytics(movie_id, db)
    return {"message": "Toxic review permanently purged", "review_id": review_id}
