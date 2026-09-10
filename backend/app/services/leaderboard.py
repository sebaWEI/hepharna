from sqlalchemy.orm import Session, joinedload

from app.models import Design, User
from app.schemas.admin import LeaderboardEntry
from app.services.challenge import utcnow


def published_best_by_user(db: Session) -> list[tuple[User, Design, float]]:
    designs = (
        db.query(Design)
        .options(joinedload(Design.user), joinedload(Design.score))
        .filter(Design.status == "published")
        .all()
    )
    best: dict[int, tuple[User, Design, float]] = {}
    for design in designs:
        if design.score is None:
            continue
        score = design.score.overall_score
        published_at = design.published_at or utcnow()
        current = best.get(design.user_id)
        if current is None:
            best[design.user_id] = (design.user, design, score)
            continue
        _, current_design, current_score = current
        current_published = current_design.published_at or utcnow()
        if score > current_score or (
            score == current_score and published_at < current_published
        ):
            best[design.user_id] = (design.user, design, score)
    ranked = list(best.values())
    ranked.sort(
        key=lambda item: (
            -item[2],
            item[1].published_at or utcnow(),
        )
    )
    return ranked


def leaderboard_entries(db: Session, limit: int | None = None) -> list[LeaderboardEntry]:
    ranked = published_best_by_user(db)
    if limit is not None:
        ranked = ranked[:limit]
    entries: list[LeaderboardEntry] = []
    for index, (user, design, score) in enumerate(ranked, start=1):
        score_row = design.score
        entries.append(
            LeaderboardEntry(
                rank=index,
                username=user.username,
                participant_id=user.participant_id,
                score=score,
                plddt=score_row.structure_score if score_row else None,
                iptm=score_row.interface_score if score_row else None,
                design_id=design.design_id,
                published_at=design.published_at,
            )
        )
    return entries


def rank_for_user(db: Session, user_id: int) -> tuple[int | None, float | None]:
    for index, (user, _design, score) in enumerate(published_best_by_user(db), start=1):
        if user.id == user_id:
            return index, score
    return None, None
