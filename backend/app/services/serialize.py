from app.models import Design
from app.schemas.design import DesignPublic, ScorePublic
from app.services.rna import gc_content


def serialize_design(design: Design, rank: int | None = None) -> DesignPublic:
    score_row = design.score
    return DesignPublic(
        id=design.id,
        design_id=design.design_id,
        version=design.version,
        sequence=design.sequence,
        status=design.status,
        length=len(design.sequence),
        gc_content=gc_content(design.sequence),
        score=score_row.overall_score if score_row else None,
        scores=(
            ScorePublic(
                overall_score=score_row.overall_score,
                structure_score=score_row.structure_score,
                interface_score=score_row.interface_score,
                clash_score=score_row.clash_score,
                confidence_score=score_row.confidence_score,
                published_at=score_row.published_at,
                updated_at=score_row.updated_at,
            )
            if score_row
            else None
        ),
        rank=rank,
        submitted_at=design.submitted_at,
        published_at=design.published_at,
        created_at=design.created_at,
        updated_at=design.updated_at,
    )
