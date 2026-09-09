from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.auth.passwords import hash_password, verify_password
from app.auth.security import create_access_token
from app.config import get_settings
from app.database import get_db
from app.models import Design, User
from app.schemas.auth import LoginRequest, MeResponse, RegisterRequest, TokenResponse, UserPublic
from app.services.ids import next_participant_id
from app.services.leaderboard import rank_for_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _token_response(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user.id, user.role),
        user=UserPublic.model_validate(user),
    )


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Annotated[Session, Depends(get_db)]) -> TokenResponse:
    username = payload.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Nickname is required.")
    if payload.confirm_password is not None and payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="That nickname is already taken.")

    user = User(
        username=username,
        password_hash=hash_password(payload.password),
        role="user",
        participant_id=next_participant_id(db),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _token_response(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]) -> TokenResponse:
    user = db.query(User).filter(User.username == payload.username.strip()).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect nickname or password.",
        )
    return _token_response(user)


@router.get("/me", response_model=MeResponse)
def auth_me(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> MeResponse:
    return _me_payload(user, db)


def _me_payload(user: User, db: Session) -> MeResponse:
    rank, best_score = rank_for_user(db, user.id)
    submission_count = (
        db.query(Design)
        .filter(Design.user_id == user.id, Design.status != "draft")
        .count()
    )
    return MeResponse(
        id=user.id,
        username=user.username,
        participant_id=user.participant_id,
        role=user.role,
        rank=rank,
        best_score=best_score,
        submission_count=submission_count,
        max_submissions=get_settings().max_submissions_per_user,
    )
