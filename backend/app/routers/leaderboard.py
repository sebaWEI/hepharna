from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.schemas.admin import LeaderboardResponse
from app.services.challenge import challenge_has_ended
from app.services.leaderboard import leaderboard_entries

router = APIRouter(tags=["leaderboard"])


@router.get("/api/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(default=50, ge=1, le=200),
) -> LeaderboardResponse:
    settings = get_settings()
    return LeaderboardResponse(
        entries=leaderboard_entries(db, limit=limit),
        challenge_start_time=settings.challenge_start_time,
        challenge_end_time=settings.challenge_end_time,
        challenge_ended=challenge_has_ended(),
        generated_at=datetime.now(timezone.utc),
    )
