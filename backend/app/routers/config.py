from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.config import get_settings
from app.schemas.design import ChallengeConfig
from app.services.challenge import challenge_is_open

router = APIRouter(tags=["config"])


@router.get("/api/challenge/config", response_model=ChallengeConfig)
def get_challenge_config() -> ChallengeConfig:
    settings = get_settings()
    return ChallengeConfig(
        min_rna_length=settings.min_rna_length,
        max_rna_length=settings.max_rna_length,
        max_submissions_per_user=settings.max_submissions_per_user,
        challenge_start_time=settings.challenge_start_time,
        challenge_end_time=settings.challenge_end_time,
        challenge_open=challenge_is_open(),
        minecraft_server_address=settings.minecraft_server_address,
        minecraft_info=settings.minecraft_info,
        reference_rna_sequence=settings.reference_rna_sequence,
        reference_rna_name="HEPHA",
    )


@router.get("/api/health")
def health() -> dict:
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}
