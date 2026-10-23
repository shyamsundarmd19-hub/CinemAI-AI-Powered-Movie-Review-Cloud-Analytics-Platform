from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import Movie, SentimentAnalytics, Review, User
from app.schemas.schemas import MovieCreate, MovieResponse
from app.services.pdf_generator import generate_movie_sentiment_pdf
from app.services.ses import send_sentiment_digest

router = APIRouter(prefix="/movies", tags=["Movies"])

@router.get("", response_model=List[MovieResponse])
def list_movies(
    genre: Optional[str] = Query(None, description="Filter movies by genre"),
    search: Optional[str] = Query(None, description="Search by title or director"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Retrieves movies list with optional genre filtering, title/director search,
    and attached sentiment analytics.
    """
    query = db.query(Movie)
    if genre and genre.strip() and genre.lower() != "all":
        query = query.filter(Movie.genre.ilike(f"%{genre.strip()}%"))
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(or_(Movie.title.ilike(term), Movie.director.ilike(term)))

    movies = query.order_by(Movie.created_at.desc()).offset(skip).limit(limit).all()
    return movies

@router.get("/{movie_id}", response_model=MovieResponse)
def get_movie_detail(movie_id: str, db: Session = Depends(get_db)):
    """Retrieves single movie profile and attached sentiment analytics."""
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Movie with ID '{movie_id}' not found."
        )
    return movie

@router.post("", response_model=MovieResponse, status_code=status.HTTP_201_CREATED)
def create_movie(
    payload: MovieCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """
    Admin Only: Registers a new movie with synopsis, metadata, and optional S3 poster URL.
    Initializes a zeroed SentimentAnalytics record.
    """
    movie = Movie(
        title=payload.title.strip(),
        genre=payload.genre.strip(),
        director=payload.director.strip(),
        release_year=payload.release_year,
        synopsis=payload.synopsis.strip(),
        poster_s3_url=payload.poster_s3_url
    )
    db.add(movie)
    db.flush()

    # Initialize sentiment analytics row
    analytics = SentimentAnalytics(
        movie_id=movie.id,
        total_reviews=0,
        avg_rating=0.0,
        positive_pct=0.0,
        neutral_pct=0.0,
        negative_pct=0.0
    )
    db.add(analytics)
    db.commit()
    db.refresh(movie)
    return movie

@router.get("/{movie_id}/pdf")
def export_sentiment_pdf(
    movie_id: str,
    db: Session = Depends(get_db)
):
    """
    Generates an automated ReportLab Sentiment Report PDF dossier,
    persists it to AWS S3 Free Tier Vault with SSE-S3 encryption,
    and returns the presigned secure download URL.
    """
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    analytics = movie.analytics or SentimentAnalytics(total_reviews=0, avg_rating=0.0, positive_pct=0.0, neutral_pct=0.0, negative_pct=0.0)
    
    # Fetch recent non-toxic reviews
    recent_reviews = (
        db.query(Review)
        .filter(Review.movie_id == movie_id, Review.flag_toxic == False)
        .order_by(Review.created_at.desc())
        .limit(10)
        .all()
    )

    review_dicts = []
    for r in recent_reviews:
        review_dicts.append({
            "user_name": r.user.name if r.user else "Anonymous",
            "rating": r.rating,
            "sentiment_score": r.sentiment_score,
            "sentiment_label": r.sentiment_label,
            "review_text": r.review_text
        })

    analytics_dict = {
        "total_reviews": analytics.total_reviews,
        "avg_rating": analytics.avg_rating,
        "positive_pct": analytics.positive_pct,
        "neutral_pct": analytics.neutral_pct,
        "negative_pct": analytics.negative_pct
    }

    result = generate_movie_sentiment_pdf(
        movie_id=movie.id,
        title=movie.title,
        genre=movie.genre,
        director=movie.director,
        release_year=movie.release_year,
        analytics_data=analytics_dict,
        recent_reviews=review_dicts
    )

    return result

@router.post("/{movie_id}/digest")
def dispatch_movie_digest(
    movie_id: str,
    recipient_email: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Dispatches an automated AWS SES sentiment digest email with
    PDF download link to the user or specified email address.
    """
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    email = recipient_email.strip() if recipient_email else current_user.email
    analytics = movie.analytics or SentimentAnalytics(total_reviews=0, avg_rating=0.0, positive_pct=0.0, neutral_pct=0.0, negative_pct=0.0)
    
    analytics_dict = {
        "total_reviews": analytics.total_reviews,
        "avg_rating": analytics.avg_rating,
        "positive_pct": analytics.positive_pct,
        "neutral_pct": analytics.neutral_pct,
        "negative_pct": analytics.negative_pct
    }

    # Generate PDF link
    pdf_info = generate_movie_sentiment_pdf(
        movie_id=movie.id,
        title=movie.title,
        genre=movie.genre,
        director=movie.director,
        release_year=movie.release_year,
        analytics_data=analytics_dict,
        recent_reviews=[]
    )

    sent = send_sentiment_digest(
        recipient_email=email,
        movie_title=movie.title,
        analytics_data=analytics_dict,
        pdf_download_url=pdf_info.get("download_url")
    )

    return {
        "message": f"Sentiment digest dispatched via AWS SES to {email}",
        "success": sent,
        "pdf_download_url": pdf_info.get("download_url")
    }
