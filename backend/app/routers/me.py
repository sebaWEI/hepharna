from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.auth.deps import get_current_user
from app.database import get_db
from app.models import Design, User
from app.routers.auth import _me_payload
from app.schemas.auth import MeResponse
from app.schemas.design import CurrentDesignResponse, DesignPublic
from app.services.leaderboard import rank_for_user
from app.services.serialize import serialize_design

router = APIRouter(tags=["me"])


@router.get("/api/me", response_model=MeResponse)
def get_me(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> MeResponse:
    return _me_payload(user, db)


@router.get("/api/me/designs", response_model=list[DesignPublic])
def get_my_designs(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[DesignPublic]:
    rank, _score = rank_for_user(db, user.id)
    designs = (
        db.query(Design)
        .options(joinedload(Design.score))
        .filter(Design.user_id == user.id)
        .order_by(Design.created_at.desc())
        .all()
    )
    return [
        serialize_design(design, rank if design.status == "published" else None)
        for design in designs
    ]


@router.get("/api/me/current-design", response_model=CurrentDesignResponse)
def get_current_design(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> CurrentDesignResponse:
    rank, _score = rank_for_user(db, user.id)
    draft = (
        db.query(Design)
        .options(joinedload(Design.score))
        .filter(Design.user_id == user.id, Design.status == "draft")
        .order_by(Design.updated_at.desc())
        .first()
    )
    current = (
        db.query(Design)
        .options(joinedload(Design.score))
        .filter(Design.user_id == user.id, Design.status != "draft")
        .order_by(Design.submitted_at.desc(), Design.created_at.desc())
        .first()
    )
    return CurrentDesignResponse(
        design=serialize_design(current, rank if current and current.status == "published" else None)
        if current
        else None,
        draft=serialize_design(draft) if draft else None,
    )
