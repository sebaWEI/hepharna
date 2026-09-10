from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload

from app.auth.deps import get_current_user
from app.config import get_settings
from app.database import get_db
from app.models import Design, User
from app.routers.fold import FoldPublic, _to_public
from app.services.fold import fold_sequence
from app.schemas.design import DesignCreate, DesignPublic, DesignUpdate, SubmitResponse
from app.services.challenge import assert_challenge_open, utcnow
from app.services.ids import make_design_id, next_design_version
from app.services.leaderboard import rank_for_user
from app.services.rna import SequenceValidationError, validate_sequence
from app.services.serialize import serialize_design
from app.services.structures import resolve_structure_path

router = APIRouter(prefix="/api/designs", tags=["designs"])


def _owned_design(db: Session, design_pk: int, user: User) -> Design:
    design = (
        db.query(Design)
        .options(joinedload(Design.score), joinedload(Design.user))
        .filter(Design.id == design_pk)
        .first()
    )
    if design is None:
        raise HTTPException(status_code=404, detail="Design not found.")
    if design.user_id != user.id and user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this page.",
        )
    return design


@router.post("", response_model=DesignPublic)
def create_design(
    payload: DesignCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> DesignPublic:
    try:
        stats = validate_sequence(payload.sequence)
    except SequenceValidationError as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc

    existing_draft = (
        db.query(Design)
        .filter(Design.user_id == user.id, Design.status == "draft")
        .order_by(Design.updated_at.desc())
        .first()
    )
    if existing_draft and not payload.new_draft:
        existing_draft.sequence = stats.sequence
        if "name" in payload.model_fields_set:
            existing_draft.name = payload.name
        existing_draft.updated_at = utcnow()
        db.commit()
        db.refresh(existing_draft)
        return serialize_design(existing_draft)

    version = next_design_version(db, user.id)
    design = Design(
        design_id=make_design_id(user.participant_id, version),
        user_id=user.id,
        version=version,
        sequence=stats.sequence,
        name=payload.name,
        status="draft",
    )
    db.add(design)
    db.commit()
    db.refresh(design)
    return serialize_design(design)


@router.get("/{design_pk}", response_model=DesignPublic)
def get_design(
    design_pk: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> DesignPublic:
    design = _owned_design(db, design_pk, user)
    rank, _ = rank_for_user(db, design.user_id)
    return serialize_design(design, rank if design.status == "published" else None)


@router.get("/{design_pk}/fold", response_model=FoldPublic)
def preview_design(
    design_pk: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> FoldPublic:
    design = _owned_design(db, design_pk, user)
    try:
        # A historical design remains previewable if event length limits change.
        return _to_public(fold_sequence(design.sequence, against_reference=False, enforce_length=False))
    except SequenceValidationError as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc
    except Exception:
        raise HTTPException(status_code=500, detail="Could not fold this sequence. Please try again.") from None


@router.get("/{design_pk}/structure")
def download_structure(
    design_pk: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    design = _owned_design(db, design_pk, user)
    path = resolve_structure_path(design.structure_path)
    if path is None:
        raise HTTPException(status_code=404, detail="No structure file uploaded for this design.")
    media = "chemical/x-pdb" if path.suffix.lower() == ".pdb" else "chemical/x-cif"
    return FileResponse(
        path,
        media_type=media,
        filename=design.structure_filename or path.name,
    )


@router.put("/{design_pk}", response_model=DesignPublic)
def update_design(
    design_pk: int,
    payload: DesignUpdate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> DesignPublic:
    design = _owned_design(db, design_pk, user)
    if design.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this page.",
        )
    if design.status != "draft":
        raise HTTPException(
            status_code=400,
            detail="Submitted designs cannot be edited. Create a new draft instead.",
        )
    try:
        stats = validate_sequence(payload.sequence)
    except SequenceValidationError as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc
    design.sequence = stats.sequence
    if "name" in payload.model_fields_set:
        design.name = payload.name
    design.updated_at = utcnow()
    db.commit()
    db.refresh(design)
    return serialize_design(design)


@router.post("/{design_pk}/submit", response_model=SubmitResponse)
def submit_design(
    design_pk: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> SubmitResponse:
    assert_challenge_open()
    design = _owned_design(db, design_pk, user)
    if design.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this page.",
        )
    if design.status != "draft":
        raise HTTPException(status_code=400, detail="This design has already been submitted.")

    settings = get_settings()
    submitted_count = (
        db.query(Design)
        .filter(Design.user_id == user.id, Design.status != "draft")
        .count()
    )
    if submitted_count >= settings.max_submissions_per_user:
        raise HTTPException(
            status_code=400,
            detail="You have reached the submission limit.",
        )

    try:
        stats = validate_sequence(design.sequence)
    except SequenceValidationError as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc

    design.sequence = stats.sequence
    design.status = "submitted"
    design.submitted_at = utcnow()
    design.updated_at = utcnow()
    db.commit()
    db.refresh(design)
    return SubmitResponse(
        message="Design submitted successfully!",
        design=serialize_design(design),
    )
