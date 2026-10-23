import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(120), nullable=False)
    email = Column(String(180), unique=True, index=True, nullable=False)
    role = Column(String(20), default="user", nullable=False) # 'user', 'critic', 'admin'
    password_hash = Column(String(255), nullable=False)
    profile_pic_s3_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")

class Movie(Base):
    __tablename__ = "movies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(200), index=True, nullable=False)
    genre = Column(String(100), index=True, nullable=False)
    director = Column(String(120), nullable=False)
    release_year = Column(Integer, nullable=False)
    synopsis = Column(Text, nullable=False)
    poster_s3_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    reviews = relationship("Review", back_populates="movie", cascade="all, delete-orphan")
    analytics = relationship("SentimentAnalytics", back_populates="movie", uselist=False, cascade="all, delete-orphan")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    movie_id = Column(String(36), ForeignKey("movies.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    review_text = Column(Text, nullable=False)
    rating = Column(Integer, nullable=False) # 1 - 5
    sentiment_score = Column(Float, nullable=False) # -1.0 to 1.0
    sentiment_label = Column(String(20), nullable=False) # 'Positive', 'Neutral', 'Negative'
    flag_toxic = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    movie = relationship("Movie", back_populates="reviews")
    user = relationship("User", back_populates="reviews")

class SentimentAnalytics(Base):
    __tablename__ = "sentiment_analytics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    movie_id = Column(String(36), ForeignKey("movies.id", ondelete="CASCADE"), unique=True, nullable=False)
    total_reviews = Column(Integer, default=0, nullable=False)
    avg_rating = Column(Float, default=0.0, nullable=False)
    positive_pct = Column(Float, default=0.0, nullable=False)
    neutral_pct = Column(Float, default=0.0, nullable=False)
    negative_pct = Column(Float, default=0.0, nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    movie = relationship("Movie", back_populates="analytics")
