from datetime import timedelta
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, get_current_active_user
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.token import Token

router = APIRouter()

VALID_ROLES = {"standard", "org_admin", "sys_admin"}

class QuickLoginRequest(BaseModel):
    role: str

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Registers a new SOC security analyst / operator with a chosen RBAC role."""
    existing_user = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="A user with this username or email already exists."
        )

    role = user_in.role if user_in.role in VALID_ROLES else "standard"

    user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=role,
        organization=user_in.organization or "",
        is_active=True,
        is_superuser=(role == "sys_admin")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticates operator credentials and returns a signed JWT with role claim."""
    user = db.query(User).filter(User.username == login_in.username).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.username,
        role=user.role,
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "organization": user.organization or "",
            "is_superuser": user.is_superuser,
        }
    }

@router.post("/quick-login", response_model=Token)
def quick_login(req: QuickLoginRequest, db: Session = Depends(get_db)):
    """
    Instant role authentication for the portal role picker.
    Ensures seamless 1-click access to the appropriate role dashboard.
    """
    role = req.role if req.role in VALID_ROLES else "standard"
    
    # Map role to default user
    username_map = {
        "standard": "user",
        "org_admin": "orgadmin",
        "sys_admin": "admin"
    }
    target_username = username_map.get(role, "user")
    
    user = db.query(User).filter(User.username == target_username).first()
    if not user:
        # Create user if missing
        org_map = {
            "standard": "Community Contributor",
            "org_admin": "CyberDefend Enterprise SOC",
            "sys_admin": "Autonomous SOC Command"
        }
        user = User(
            username=target_username,
            email=f"{target_username}@shieldcommunity.io",
            hashed_password=get_password_hash("ShieldAuth2026!"),
            role=role,
            organization=org_map.get(role, ""),
            is_active=True,
            is_superuser=(role == "sys_admin")
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.username,
        role=user.role,
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "organization": user.organization or "",
            "is_superuser": user.is_superuser,
        }
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    """Returns the authenticated user profile."""
    return current_user
