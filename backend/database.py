"""
TerraLens Database Module
=========================
Supports PostgreSQL + PostGIS (Production / Enterprise GIS)
with automatic fallback to SQLite for zero-config local dev.

Set `DATABASE_URL` in `.env` to connect to PostgreSQL:
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/terralens_db
"""

from __future__ import annotations

import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parent

# Default to SQLite file if no PostgreSQL DATABASE_URL is supplied
SQLITE_DB_PATH = BASE_DIR / "terralens.db"
DEFAULT_DB_URL = f"sqlite:///{SQLITE_DB_PATH}"

DATABASE_URL = os.environ.get("DATABASE_URL", DEFAULT_DB_URL)

# Check if using SQLite or PostgreSQL
IS_POSTGRES = DATABASE_URL.startswith("postgresql")

if IS_POSTGRES:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
else:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},  # required for SQLite
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialise database tables."""
    import db_models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    print(f"[database] Database initialised using {'PostgreSQL+PostGIS' if IS_POSTGRES else 'SQLite (local)'}.", flush=True)
