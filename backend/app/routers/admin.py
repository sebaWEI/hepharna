import csv
import io
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.auth.deps import get_current_admin
from app.database import get_db
from app.models import Design, User
from app.schemas.admin import (
    AdminDashboard,
    AdminSubmission,
    AdminUser,
    ScoreInput,
)
from app.services.challenge import utcnow
from app.services.leaderboard import rank_for_user
from app.services.scoring import SCOREABLE_STATUSES, manual_scoring_service
from app.services.serialize import serialize_design

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _submission_payload(design: Design, rank: int | None = None) -> AdminSubmission:
    base = serialize_design(design, rank)
    return AdminSubmission(
        **base.model_dump(),
        username=design.user.username,
        participant_id=design.user.participant_id,
        user_id=design.user_id,
    )


def _load_submission(db: Session, design_pk: int) -> Design:
    design = (
        db.query(Design)
        .options(joinedload(Design.score), joinedload(Design.user))
        .filter(Design.id == design_pk)
        .first()
    )
    if design is None:
        raise HTTPException(status_code=404, detail="Design not found.")
    return design


@router.get("/dashboard", response_model=AdminDashboard)
def dashboard(
    _admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> AdminDashboard:
    designs = db.query(Design)
    return AdminDashboard(
        participants=db.query(User).filter(User.role == "user").count(),
        total_designs=designs.count(),
        pending=designs.filter(Design.status.in_(["submitted", "evaluating"])).count(),
        published=designs.filter(Design.status == "published").count(),
        scored=designs.filter(Design.status == "scored").count(),
        drafts=designs.filter(Design.status == "draft").count(),
    )


@router.get("/users", response_model=list[AdminUser])
def list_users(
    _admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> list[AdminUser]:
    users = db.query(User).order_by(User.created_at.asc()).all()
    payload: list[AdminUser] = []
    for user in users:
        rank, best = rank_for_user(db, user.id)
        submission_count = (
            db.query(Design)
            .filter(Design.user_id == user.id, Design.status != "draft")
            .count()
        )
        payload.append(
            AdminUser(
                id=user.id,
                username=user.username,
                participant_id=user.participant_id,
                role=user.role,
                created_at=user.created_at,
                submission_count=submission_count,
                best_score=best,
            )
        )
        _ = rank
    return payload


@router.get("/submissions", response_model=list[AdminSubmission])
def list_submissions(
    _admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
    status_filter: str | None = Query(default=None, alias="status"),
    q: str | None = None,
    sort: str = "submitted_at",
    order: str = "desc",
) -> list[AdminSubmission]:
    query = db.query(Design).options(joinedload(Design.score), joinedload(Design.user))
    if status_filter:
        query = query.filter(Design.status == status_filter)
    else:
        query = query.filter(Design.status != "draft")
    if q:
        like = f"%{q.strip()}%"
        query = query.join(User).filter(
            or_(User.username.ilike(like), Design.design_id.ilike(like), User.participant_id.ilike(like))
        )
    sort_column = {
        "submitted_at": Design.submitted_at,
        "created_at": Design.created_at,
        "status": Design.status,
        "design_id": Design.design_id,
    }.get(sort, Design.submitted_at)
    if order == "asc":
        query = query.order_by(sort_column.asc().nullslast())
    else:
        query = query.order_by(sort_column.desc().nullslast())
    designs = query.all()
    return [_submission_payload(design) for design in designs]


@router.get("/submissions/{design_pk}", response_model=AdminSubmission)
def get_submission(
    design_pk: int,
    _admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> AdminSubmission:
    design = _load_submission(db, design_pk)
    rank, _ = rank_for_user(db, design.user_id)
    return _submission_payload(design, rank if design.status == "published" else None)


def _apply_score(db: Session, design: Design, payload: ScoreInput, admin: User) -> AdminSubmission:
    if design.status == "draft":
        raise HTTPException(status_code=400, detail="Drafts cannot be scored.")
    if design.status not in SCOREABLE_STATUSES:
        raise HTTPException(status_code=400, detail="This design cannot be scored.")
    manual_scoring_service.save_score(
        db,
        design,
        overall_score=payload.overall_score,
        admin=admin,
        structure_score=payload.structure_score,
        interface_score=payload.interface_score,
        clash_score=payload.clash_score,
        confidence_score=payload.confidence_score,
    )
    db.commit()
    db.refresh(design)
    return _submission_payload(design)


@router.post("/submissions/{design_pk}/score", response_model=AdminSubmission)
def create_score(
    design_pk: int,
    payload: ScoreInput,
    admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> AdminSubmission:
    return _apply_score(db, _load_submission(db, design_pk), payload, admin)


@router.put("/submissions/{design_pk}/score", response_model=AdminSubmission)
def update_score(
    design_pk: int,
    payload: ScoreInput,
    admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> AdminSubmission:
    return _apply_score(db, _load_submission(db, design_pk), payload, admin)


@router.post("/submissions/{design_pk}/publish", response_model=AdminSubmission)
def publish_score(
    design_pk: int,
    _admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> AdminSubmission:
    design = _load_submission(db, design_pk)
    if design.score is None:
        raise HTTPException(status_code=400, detail="Save a score before publishing.")
    now = utcnow()
    design.status = "published"
    if design.published_at is None:
        design.published_at = now
    if design.score.published_at is None:
        design.score.published_at = now
    design.updated_at = now
    db.commit()
    db.refresh(design)
    rank, _ = rank_for_user(db, design.user_id)
    return _submission_payload(design, rank)


@router.post("/submissions/{design_pk}/unpublish", response_model=AdminSubmission)
def unpublish_score(
    design_pk: int,
    _admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> AdminSubmission:
    design = _load_submission(db, design_pk)
    if design.status != "published":
        raise HTTPException(status_code=400, detail="This result is not published.")
    design.status = "scored"
    design.updated_at = utcnow()
    db.commit()
    db.refresh(design)
    return _submission_payload(design)


@router.get("/export")
def export_csv(
    _admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> StreamingResponse:
    designs = (
        db.query(Design)
        .options(joinedload(Design.score), joinedload(Design.user))
        .filter(Design.status != "draft")
        .order_by(Design.submitted_at.asc().nullslast())
        .all()
    )
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "design_id",
            "participant_id",
            "nickname",
            "sequence",
            "status",
            "score",
            "submitted_at",
        ]
    )
    for design in designs:
        writer.writerow(
            [
                design.design_id,
                design.user.participant_id,
                design.user.username,
                design.sequence,
                design.status,
                "" if design.score is None else f"{design.score.overall_score:.2f}",
                design.submitted_at.isoformat() if design.submitted_at else "",
            ]
        )
    buffer.seek(0)
    filename = f"hepha-rna-submissions-{utcnow().strftime('%Y%m%d-%H%M')}.csv"
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
