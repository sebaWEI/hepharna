from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.config import get_settings


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def challenge_is_open(now: datetime | None = None) -> bool:
    settings = get_settings()
    current = now or utcnow()
    if settings.challenge_start_time and current < settings.challenge_start_time:
        return False
    if settings.challenge_end_time and current > settings.challenge_end_time:
        return False
    return True


def challenge_has_ended(now: datetime | None = None) -> bool:
    settings = get_settings()
    current = now or utcnow()
    return bool(settings.challenge_end_time and current > settings.challenge_end_time)


def assert_challenge_open() -> None:
    settings = get_settings()
    now = utcnow()
    if settings.challenge_start_time and now < settings.challenge_start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The challenge has not started yet.",
        )
    if settings.challenge_end_time and now > settings.challenge_end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The challenge has ended. New submissions are closed.",
        )
