from abc import ABC, abstractmethod

from sqlalchemy.orm import Session

from app.models import Design, Score, User
from app.services.challenge import utcnow

EDITABLE_STATUSES = {"draft"}
SCOREABLE_STATUSES = {"submitted", "evaluating", "scored", "published"}


def total_score(plddt: float, iptm: float) -> float:
    """Overall score is the equal average of complex_plddt and iptm (Boltz 0-1 scale)."""
    return round(0.5 * plddt + 0.5 * iptm, 6)


class ScoringService(ABC):
    """Extension point for future automated Boltz scoring."""

    @abstractmethod
    def save_score(
        self,
        db: Session,
        design: Design,
        admin: User,
        *,
        plddt: float,
        iptm: float,
    ) -> Score:
        raise NotImplementedError


class ManualScoringService(ScoringService):
    def save_score(
        self,
        db: Session,
        design: Design,
        admin: User,
        *,
        plddt: float,
        iptm: float,
    ) -> Score:
        score = design.score
        if score is None:
            score = Score(design_id=design.id)
            db.add(score)
            design.score = score

        score.structure_score = plddt
        score.interface_score = iptm
        score.overall_score = total_score(plddt, iptm)
        score.clash_score = None
        score.confidence_score = None
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
