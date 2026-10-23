from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models.models import User, Movie, Review, SentimentAnalytics
from app.routers import (
    auth_router,
    movies_router,
    reviews_router,
    documents_router,
    admin_router,
)
from app.services.sentiment import analyze_review_sentiment

def seed_initial_data():
    """Seeds baseline admin user, critics, and sample cinematic titles if empty."""
    db = SessionLocal()
    try:
        # 1. Create tables if they do not exist
        Base.metadata.create_all(bind=engine)

        # 2. Seed Default Users if none exist
        if db.query(User).count() == 0:
            admin_user = User(
                name="CinemAI Administrator",
                email="admin@cinemai.com",
                role="admin",
                password_hash=get_password_hash("admin123"),
            )
            critic_user = User(
                name="Elena Vance (Lead Film Critic)",
                email="critic@cinemai.com",
                role="critic",
                password_hash=get_password_hash("critic123"),
            )
            standard_user = User(
                name="Alex Mercer",
                email="user@cinemai.com",
                role="user",
                password_hash=get_password_hash("user123"),
            )
            db.add_all([admin_user, critic_user, standard_user])
            db.commit()
            db.refresh(admin_user)
            db.refresh(critic_user)
            db.refresh(standard_user)

            # 3. Seed Initial Showcase Movies
            sample_movies = [
                {
                    "title": "Interstellar",
                    "genre": "Sci-Fi / Adventure",
                    "director": "Christopher Nolan",
                    "release_year": 2014,
                    "synopsis": "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft along with a team of researchers to find a new planet for humans.",
                    "poster_s3_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80"
                },
                {
                    "title": "Dune: Part Two",
                    "genre": "Sci-Fi / Epic",
                    "director": "Denis Villeneuve",
                    "release_year": 2024,
                    "synopsis": "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future.",
                    "poster_s3_url": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80"
                },
                {
                    "title": "Oppenheimer",
                    "genre": "Biography / Drama / History",
                    "director": "Christopher Nolan",
                    "release_year": 2023,
                    "synopsis": "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during the Manhattan Project.",
                    "poster_s3_url": "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80"
                },
                {
                    "title": "Spirited Away",
                    "genre": "Animation / Fantasy",
                    "director": "Hayao Miyazaki",
                    "release_year": 2001,
                    "synopsis": "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.",
                    "poster_s3_url": "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80"
                }
            ]

            seed_reviews = [
                ("A breathtaking visual and emotional masterpiece. Hans Zimmer's score elevates Nolan's grand spectacle to cosmic heights.", 5),
                ("Visually striking with incredible scale, though the pacing drags slightly in the middle act.", 4),
                ("An astonishing triumph of modern cinema. Sound design and acting are unmatched.", 5)
            ]

            for m_data in sample_movies:
                movie = Movie(**m_data)
                db.add(movie)
                db.flush()

                # Add reviews
                rev_objs = []
                for text, rating in seed_reviews:
                    sentiment = analyze_review_sentiment(text)
                    r = Review(
                        movie_id=movie.id,
                        user_id=critic_user.id,
                        review_text=text,
                        rating=rating,
                        sentiment_score=sentiment["sentiment_score"],
                        sentiment_label=sentiment["sentiment_label"],
                        flag_toxic=sentiment["flag_toxic"]
                    )
                    rev_objs.append(r)
                db.add_all(rev_objs)
                db.flush()

                # Calculate analytics
                pos_cnt = sum(1 for r in rev_objs if r.sentiment_label == "Positive")
                neu_cnt = sum(1 for r in rev_objs if r.sentiment_label == "Neutral")
                neg_cnt = sum(1 for r in rev_objs if r.sentiment_label == "Negative")
                total = len(rev_objs)

                analytics = SentimentAnalytics(
                    movie_id=movie.id,
                    total_reviews=total,
                    avg_rating=round(sum(r.rating for r in rev_objs) / total, 2),
                    positive_pct=round((pos_cnt / total) * 100.0, 1),
                    neutral_pct=round((neu_cnt / total) * 100.0, 1),
                    negative_pct=round((neg_cnt / total) * 100.0, 1)
                )
                db.add(analytics)

            db.commit()
    except Exception as e:
        db.rollback()
        print(f"[CinemAI Seed Warning] Seeding bypassed: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables and seeds on startup
    seed_initial_data()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Cloud-Native AI-Powered Movie Review & Sentiment Analytics Network (Optimized for AWS Free Tier)",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API Routers
app.include_router(auth_router, prefix="/api")
app.include_router(movies_router, prefix="/api")
app.include_router(reviews_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(admin_router, prefix="/api")

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "CinemAI Backend",
        "database": "Connected",
        "environment": "AWS Free Tier (Direct Host EC2 / Ubuntu)",
        "version": "1.0.0"
    }

@app.get("/api", tags=["Root"])
def root():
    return {
        "message": "Welcome to CinemAI - AI-Powered Movie Review & Sentiment Analytics Network",
        "docs": "/api/docs"
    }
