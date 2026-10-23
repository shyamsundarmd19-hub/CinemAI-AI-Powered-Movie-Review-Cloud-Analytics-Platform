"""
================================================================================
CinemAI Concurrent Audience Load Testing Script (Locust)
Simulates 100 to 1,000 Concurrent Film Enthusiasts & Critics
Evaluating NLTK VADER NLP Sentiment Pipeline, S3 Vault, and Direct Host Latency
================================================================================

EXECUTION COMMANDS:

1. Interactive Web Dashboard Mode (Locust Web UI at http://localhost:8089):
   $ locust -f locustfile.py --host http://<EC2_PUBLIC_IP_OR_ALB>

2. Headless Automated Stress Test (100 Concurrent Users, 10 ramp-up/s, 2 minutes):
   $ locust -f locustfile.py --host http://<EC2_PUBLIC_IP> --headless \
       -u 100 -r 10 --run-time 2m --html load_test_100_users.html

3. High-Load Peak Stress Test (500 Concurrent Users, 25 ramp-up/s, 3 minutes):
   $ locust -f locustfile.py --host http://<EC2_PUBLIC_IP> --headless \
       -u 500 -r 25 --run-time 3m --html load_test_500_users.html

4. Scalability Threshold Test (1,000 Concurrent Users to evaluate Auto Scaling):
   $ locust -f locustfile.py --host http://<EC2_PUBLIC_IP> --headless \
       -u 1000 -r 50 --run-time 5m --html load_test_1000_users.html
================================================================================
"""

import uuid
import random
from locust import HttpUser, task, between, tag

# Diverse sentiment test corpus testing NLTK VADER and TextBlob polarity
POSITIVE_REVIEWS = [
    "An absolute masterpiece of cinematic vision! The visual effects and sound design are transcendental.",
    "Brilliant acting and flawless directing. One of the best movie experiences of this decade.",
    "Captivating and thought-provoking storytelling with phenomenal cinematography and emotional resonance.",
    "A stunning triumph of modern filmmaking. The score by Hans Zimmer gives goosebumps throughout.",
    "Exceptional script, extraordinary performances, and breathtaking world-building. Highly recommended!",
]

NEUTRAL_REVIEWS = [
    "A decently crafted film with competent cinematography, though the pacing drags noticeably in the second act.",
    "Enjoyable enough for a weekend watch, but it struggles to break new ground in this genre.",
    "Visually solid with high production values, but the plot twists were fairly predictable.",
    "Average execution with some interesting ideas, though the character development felt somewhat rushed.",
]

NEGATIVE_REVIEWS = [
    "A severely disappointing movie with disorganized pacing, shallow dialogue, and uninspired direction.",
    "Painfully boring and predictable. Not worth the runtime despite the famous cast.",
    "A chaotic mess of narrative cliches and unconvincing character motivations.",
    "Overlong, sluggish, and completely underwhelming. Truly a waste of cinematic potential.",
]

class CinemAIAudienceUser(HttpUser):
    # Wait between 1 and 3 seconds between user actions (realistic browsing pacing)
    wait_time = between(1, 3)

    def on_start(self):
        """Simulates user session initiation, login, and token acquisition."""
        self.movie_ids = []
        self.token = None
        self.user_email = f"loadtest_{uuid.uuid4().hex[:8]}@cinemai-test.com"

        # Register dedicated load-testing user
        reg_payload = {
            "name": f"Audience Tester {random.randint(100, 999)}",
            "email": self.user_email,
            "password": "Password123!",
            "role": random.choice(["user", "critic"])
        }

        with self.client.post("/api/auth/register", json=reg_payload, catch_response=True) as res:
            if res.status_code == 201:
                data = res.json()
                self.token = data.get("access_token")
                res.success()
            else:
                # Fallback login if already seeded
                login_payload = {"email": "user@cinemai.com", "password": "user123"}
                with self.client.post("/api/auth/login", json=login_payload, catch_response=True) as login_res:
                    if login_res.status_code == 200:
                        self.token = login_res.json().get("access_token")
                        login_res.success()
                    else:
                        login_res.failure(f"Failed to obtain auth credentials: {login_res.text}")

        # Fetch active movies list to populate target IDs
        self.fetch_movie_ids()

    def fetch_movie_ids(self):
        """Fetches available movie IDs for realistic review targeting."""
        with self.client.get("/api/movies?limit=20", catch_response=True) as res:
            if res.status_code == 200:
                movies = res.json()
                self.movie_ids = [m["id"] for m in movies if "id" in m]
                res.success()

    @tag("browse")
    @task(5)
    def browse_movie_catalog(self):
        """Simulates browsing movies with live sentiment metrics."""
        genre = random.choice([None, "Sci-Fi", "Drama", "Animation", "Action"])
        url = f"/api/movies?genre={genre}" if genre else "/api/movies"
        self.client.get(url, name="/api/movies [Catalog]")

    @tag("detail")
    @task(4)
    def view_movie_details(self):
        """Fetches detailed movie page and sentiment pulse."""
        if not self.movie_ids:
            return
        target_id = random.choice(self.movie_ids)
        self.client.get(f"/api/movies/{target_id}", name="/api/movies/[id] [Details]")
        self.client.get(f"/api/reviews/movie/{target_id}", name="/api/reviews/movie/[id] [Audience Reviews]")

    @tag("sentiment_nlp")
    @task(3)
    def submit_ai_analyzed_review(self):
        """
        Submits reviews to trigger NLTK VADER and TextBlob sentiment processing,
        toxicity screening, and database analytics recalculation.
        """
        if not self.movie_ids or not self.token:
            return

        target_id = random.choice(self.movie_ids)
        sentiment_type = random.choices(["positive", "neutral", "negative"], weights=[0.6, 0.25, 0.15])[0]

        if sentiment_type == "positive":
            text = random.choice(POSITIVE_REVIEWS)
            rating = random.choice([4, 5])
        elif sentiment_type == "neutral":
            text = random.choice(NEUTRAL_REVIEWS)
            rating = 3
        else:
            text = random.choice(NEGATIVE_REVIEWS)
            rating = random.choice([1, 2])

        headers = {"Authorization": f"Bearer {self.token}"}
        payload = {
            "movie_id": target_id,
            "rating": rating,
            "review_text": f"{text} (Simulated user ID: {self.user_email[:12]})"
        }

        with self.client.post("/api/reviews", json=payload, headers=headers, catch_response=True) as res:
            if res.status_code == 201:
                res.success()
            else:
                res.failure(f"Submit review error {res.status_code}: {res.text}")

    @tag("pdf_dossier")
    @task(1)
    def trigger_pdf_report_generation(self):
        """
        Stresses the ReportLab PDF generation engine and AWS S3 vault streaming.
        Simulates heavy CPU and cryptographic upload tasks.
        """
        if not self.movie_ids:
            return
        target_id = random.choice(self.movie_ids)
        self.client.get(f"/api/movies/{target_id}/pdf", name="/api/movies/[id]/pdf [ReportLab & S3]")

    @tag("health")
    @task(1)
    def health_check_ping(self):
        """Simulates ALB health check pings."""
        self.client.get("/api/health", name="/api/health [ALB Ping]")
