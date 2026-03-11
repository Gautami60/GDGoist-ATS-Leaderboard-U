"""
Application Configuration

Centralises all deployment-level configuration values so they are
accessible via a single import rather than scattered as hardcoded
constants throughout the codebase.

Usage:
    from app.config import HOST, PORT, ALLOWED_ORIGINS

Do NOT place scoring algorithm constants here — those live alongside
the logic they belong to (e.g., scoring_engine.py).
"""

# ── Server settings ────────────────────────────────────────────────
HOST: str = "0.0.0.0"
PORT: int = 8000

# ── FastAPI application metadata ────────────────────────────────────
APP_TITLE: str = "ATS Service with TF-IDF"
APP_DESCRIPTION: str = (
    "Resume parsing and scoring service for the Applicant Tracking System"
)
APP_VERSION: str = "2.0.0"

# ── CORS ──────────────────────────────────────────────────────────
# Origins allowed to call this service.
# In production, restrict to specific domains and remove "*".
ALLOWED_ORIGINS: list = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # React / Next.js dev server
    "*",                      # Allow all (dev convenience — restrict in prod)
]

# ── NLP / Model settings ───────────────────────────────────────────
# SBERT is disabled on Windows due to NumPy compatibility issues.
# Switch to True only when running on a compatible Linux/macOS environment.
SBERT_ENABLED: bool = False

# ── Logging ────────────────────────────────────────────────────────
LOG_LEVEL: str = "INFO"
