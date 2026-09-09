from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Design, User


def next_participant_id(db: Session) -> str:
    last = db.query(User).order_by(User.id.desc()).first()
    number = 1
    if last and last.participant_id:
        try:
            number = int(last.participant_id.rsplit("-", 1)[-1]) + 1
        except ValueError:
            number = (last.id or 0) + 1
    return f"HEPHA-{number:03d}"


def next_design_version(db: Session, user_id: int) -> int:
    current = (
        db.query(func.max(Design.version)).filter(Design.user_id == user_id).scalar()
    )
    return int(current or 0) + 1


def make_design_id(participant_id: str, version: int) -> str:
    number = participant_id.rsplit("-", 1)[-1]
    return f"HEPHA-D{number}-V{version:02d}"
