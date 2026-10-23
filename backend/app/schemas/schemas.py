from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# -----------------------------------------------------------------------------
# User Schemas
# -----------------------------------------------------------------------------
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)
    role: Optional[str] = Field(default="user", pattern="^(user|critic|admin)$")
    profile_pic_s3_url: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    role: str
    profile_pic_s3_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserSummary(BaseModel):
    id: str
    name: str
    role: str
    profile_pic_s3_url: Optional[str] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# -----------------------------------------------------------------------------
# Sentiment Analytics Schemas
# -----------------------------------------------------------------------------
class SentimentAnalyticsResponse(BaseModel):
    total_reviews: int = 0
    avg_rating: float = 0.0
    positive_pct: float = 0.0
    neutral_pct: float = 0.0
    negative_pct: float = 0.0
    last_updated: Optional[datetime] = None

    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# Movie Schemas
# -----------------------------------------------------------------------------
class MovieBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    genre: str = Field(..., min_length=2, max_length=100)
    director: str = Field(..., min_length=2, max_length=120)
    release_year: int = Field(..., ge=1888, le=2100)
    synopsis: str = Field(..., min_length=10)
    poster_s3_url: Optional[str] = None

class MovieCreate(MovieBase):
    pass

class MovieUpdate(BaseModel):
    title: Optional[str] = None
    genre: Optional[str] = None
    director: Optional[str] = None
    release_year: Optional[int] = None
    synopsis: Optional[str] = None
    poster_s3_url: Optional[str] = None

class MovieResponse(MovieBase):
    id: str
    created_at: datetime
    analytics: Optional[SentimentAnalyticsResponse] = None

    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# Review Schemas
# -----------------------------------------------------------------------------
class ReviewCreate(BaseModel):
    movie_id: str
    review_text: str = Field(..., min_length=5, max_length=5000)
    rating: int = Field(..., ge=1, le=5)

class ReviewResponse(BaseModel):
    id: str
    movie_id: str
    user_id: str
    review_text: str
    rating: int
    sentiment_score: float
    sentiment_label: str
    flag_toxic: bool
    created_at: datetime
    user: Optional[UserSummary] = None

    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# Document & Presigned URL Schemas
# -----------------------------------------------------------------------------
class PresignedUrlRequest(BaseModel):
    filename: str
    file_type: str = "image/jpeg"
    folder: Optional[str] = "posters"

class PresignedUrlResponse(BaseModel):
    upload_url: str
    file_key: str
    download_url: str

# -----------------------------------------------------------------------------
# Admin Analytics Schemas
# -----------------------------------------------------------------------------
class AdminAnalyticsResponse(BaseModel):
    total_users: int
    total_movies: int
    total_reviews: int
    flagged_reviews_count: int
    overall_sentiment_breakdown: Dict[str, float]
    flagged_queue: List[ReviewResponse]
    system_metrics: Dict[str, Any]
