from abc import ABC, abstractmethod

from sqlalchemy.orm import Session

from app.models import Design, Score, User
from app.services.challenge import utcnow

EDITABLE_STATUSES = {"draft"}
SCOREABLE_STATUSES = {"submitted", "evaluating", "scored", "published"}


class ScoringService(ABC):
    """Extension point for future automated Boltz scoring."""

    @abstractmethod
    def save_score(
        self,
        db: Session,
        design: Design,
        overall_score: float,
        admin: User,
        structure_score: float | None = None,
        interface_score: float | None = None,
        clash_score: float | None = None,
        confidence_score: float | None = None,
    ) -> Score:
        raise NotImplementedError


class ManualScoringService(ScoringService):
    def save_score(
        self,
        db: Session,
        design: Design,
        overall_score: float,
        admin: User,
        structure_score: float | None = None,
        interface_score: float | None = None,
        clash_score: float | None = None,
        confidence_score: float | None = None,
    ) -> Score:
        score = design.score
        if score is None:
            score = Score(design_id=design.id)
            db.add(score)
            design.score = score

        score.overall_score = overall_score
        score.structure_score = structure_score
        score.interface_score = interface_score
        score.clash_score = clash_score
        score.confidence_score = confidence_score
        score.updated_by = admin.id
        score.updated_at = utcnow()

        if design.status != "published":
            design.status = "scored"
        design.updated_at = utcnow()
        db.flush()
        return score


class BoltzScoringService(ScoringService):
    """Reserved for a future GPU/Boltz job queue. Not used in MVP."""

    def save_score(self, *args, **kwargs) -> Score:
        raise NotImplementedError("Boltz scoring is not enabled in this version.")


manual_scoring_service = ManualScoringService()
