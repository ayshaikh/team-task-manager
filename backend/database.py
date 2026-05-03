from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL (using SQLite for local development, PostgreSQL for production)
DEFAULT_SQLITE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "taskmanager.db")
DEFAULT_SQLITE_URL = f"sqlite:///{DEFAULT_SQLITE_PATH.replace(os.sep, '/')}"

env_database_url = os.getenv("DATABASE_URL")
if env_database_url and env_database_url.startswith("sqlite:///"):
    sqlite_path = env_database_url.replace("sqlite:///", "", 1)
    if sqlite_path.startswith("./") or not os.path.isabs(sqlite_path):
        DATABASE_URL = DEFAULT_SQLITE_URL
    else:
        DATABASE_URL = env_database_url
else:
    DATABASE_URL = env_database_url or DEFAULT_SQLITE_URL

# Create engine based on database type
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if DATABASE_URL.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
