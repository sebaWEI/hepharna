from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth.deps import get_current_user
from app.config import get_settings
from app.models import User
from app.services.fold import FoldResult, fold_reference, fold_sequence
from app.services.rna import SequenceValidationError

router = APIRouter(prefix="/api/rna", tags=["rna"])


class ResiduePublic(BaseModel):
    index: int
    base: str
    x: float
    y: float
    paired_to: int | None


class FoldPublic(BaseModel):
    sequence: str
    structure: str
    mfe: float
    length: int
    gc_content: float
    residues: list[ResiduePublic]
    length_delta: int | None = None
    substitutions: int | None = None
    changed_positions: list[int] | None = None


class FoldRequest(BaseModel):
    sequence: str = Field(min_length=1)


def _to_public(result: FoldResult) -> FoldPublic:
    return FoldPublic(
        sequence=result.sequence,
        structure=result.structure,
        mfe=result.mfe,
        length=result.length,
        gc_content=result.gc_content,
        residues=[
            ResiduePublic(
                index=residue.index,
                base=residue.base,
                x=residue.x,
                y=residue.y,
                paired_to=residue.paired_to,
            )
            for residue in result.residues
        ],
        length_delta=result.length_delta,
        substitutions=result.substitutions,
        changed_positions=result.changed_positions,
    )


@router.get("/reference", response_model=FoldPublic)
def get_reference_fold() -> FoldPublic:
    try:
        return _to_public(fold_reference())
    except SequenceValidationError as exc:
        raise HTTPException(status_code=500, detail=exc.message) from exc


@router.post("/fold", response_model=FoldPublic)
def fold_user_sequence(
    payload: FoldRequest,
    _user: User = Depends(get_current_user),
) -> FoldPublic:
    try:
        return _to_public(fold_sequence(payload.sequence, against_reference=True))
    except SequenceValidationError as exc:
        raise HTTPException(status_code=400, detail=exc.message) from exc
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not fold this sequence. Please try again.",
        ) from None


@router.get("/reference/sequence")
def get_reference_sequence() -> dict:
    settings = get_settings()
    return {
        "name": "HEPHA",
        "sequence": settings.reference_rna_sequence,
        "length": len(settings.reference_rna_sequence),
    }
