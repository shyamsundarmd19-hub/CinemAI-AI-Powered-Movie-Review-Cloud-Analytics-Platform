from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Review, Movie, SentimentAnalytics, User
from app.schemas.schemas import ReviewCreate, ReviewResponse
from app.services.sentiment import analyze_review_sentiment
from app.services.ses import send_flagged_review_alert

router = APIRouter(prefix="/reviews", tags=["Reviews"])

def recalculate_movie_analytics(movie_id: str, db: Session):
    """
    Recalculates aggregated sentiment analytics (average rating, review count,
    and positive/neutral/negative percentages) ignoring toxic flagged reviews.
    """
    valid_reviews = db.query(Review).filter(
        Review.movie_id == movie_id,
        Review.flag_toxic == False
    ).all()

    total_count = len(valid_reviews)
    if total_count == 0:
        avg_rating = 0.0
        pos_pct = 0.0
        neu_pct = 0.0
        neg_pct = 0.0
    else:
        avg_rating = round(sum(r.rating for r in valid_reviews) / total_count, 2)
        pos_count = sum(1 for r in valid_reviews if r.sentiment_label == "Positive")
        neu_count = sum(1 for r in valid_reviews if r.sentiment_label == "Neutral")
        neg_count = sum(1 for r in valid_reviews if r.sentiment_label == "Negative")

        pos_pct = round((pos_count / total_count) * 100.0, 1)
        neu_pct = round((neu_count / total_count) * 100.0, 1)
        neg_pct = round((neg_count / total_count) * 100.0, 1)

    analytics = db.query(SentimentAnalytics).filter(SentimentAnalytics.movie_id == movie_id).first()
    if not analytics:
        analytics = SentimentAnalytics(movie_id=movie_id)
        db.add(analytics)

    analytics.total_reviews = total_count
    analytics.avg_rating = avg_rating
    analytics.positive_pct = pos_pct
    analytics.neutral_pct = neu_pct
    analytics.negative_pct = neg_pct
    db.commit()

@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_review(
    payload: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits a review, automatically executes NLTK/TextBlob NLP sentiment analysis,
    screens for toxicity, triggers AWS SES moderation alerts if flagged, and updates
    real-time sentiment analytics metrics.
    """
    movie = db.query(Movie).filter(Movie.id == payload.movie_id).first()
    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Movie with ID '{payload.movie_id}' does not exist."
        )

    # 1. Run AI NLP Sentiment Engine
    sentiment_result = analyze_review_sentiment(payload.review_text)

    # 2. Instantiate Review Record
    review = Review(
        movie_id=payload.movie_id,
        user_id=current_user.id,
        review_text=payload.review_text.strip(),
        rating=payload.rating,
        sentiment_score=sentiment_result["sentiment_score"],
        sentiment_label=sentiment_result["sentiment_label"],
        flag_toxic=sentiment_result["flag_toxic"]
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    # 3. If toxic, trigger SES email alert to admins
    if review.flag_toxic:
        admin_emails = [
            u.email for u in db.query(User).filter(User.role == "admin").all()
        ]
        send_flagged_review_alert(
            admin_emails=admin_emails,
            review_id=review.id,
            movie_title=movie.title,
            reviewer_name=current_user.name,
            review_text=review.review_text,
            toxic_reasons=sentiment_result.get("toxic_reasons", ["Flagged by NLP toxicity screen"])
        )

    # 4. Recalculate Aggregated Analytics
    recalculate_movie_analytics(movie.id, db)

    return review

@router.get("/movie/{movie_id}", response_model=List[ReviewResponse])
def get_movie_reviews(
    movie_id: str,
    include_flagged: bool = Query(False, description="Include toxic reviews (Admin only)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieves all reviews for a movie. Flagged reviews are hidden by default."""
    query = db.query(Review).filter(Review.movie_id == movie_id)
    if not include_flagged:
        query = query.filter(Review.flag_toxic == False)

    reviews = query.order_by(Review.created_at.desc()).offset(skip).limit(limit).all()
    return reviews

@router.delete("/{review_id}", status_code=status.HTTP_200_OK)
def delete_review(
    review_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes a review. Allowed for the review author or administrators."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")

    movie_id = review.movie_id
    db.delete(review)
    db.commit()

    # Refresh analytics
    recalculate_movie_analytics(movie_id, db)
    return {"message": "Review deleted successfully", "review_id": review_id}
