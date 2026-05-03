from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import os
from dotenv import load_dotenv
import bcrypt

load_dotenv()

# JWT config
SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_EXPIRES_IN", "7").split("d")[0])

def hash_password(password: str) -> str:
    """Hash a password using bcrypt directly - truncate to 72 bytes for bcrypt compatibility"""
    # bcrypt has a 72-byte password limit
    password = password[:72].encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash using bcrypt directly"""
    # bcrypt has a 72-byte password limit
    plain_password = plain_password[:72].encode('utf-8')
    return bcrypt.checkpw(plain_password, hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    """Decode JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
