from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.design import DesignPublic


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    participant_id: str
    score: float
    plddt: float | None = None
    iptm: float | None = None
    design_id: str
    published_at: datetime | None = None


class LeaderboardResponse(BaseModel):
    entries: list[LeaderboardEntry]
    challenge_start_time: datetime | None
    challenge_end_time: datetime | None
    challenge_ended: bool
    generated_at: datetime


class AdminDashboard(BaseModel):
    participants: int
    total_designs: int
    pending: int
    published: int
    scored: int
    drafts: int


class ScoreInput(BaseModel):
    # Boltz confidence JSON uses a 0-1 scale (e.g. complex_plddt, iptm).
    plddt: float = Field(ge=0, le=1)
    iptm: float = Field(ge=0, le=1)


class AdminUser(BaseModel):
    id: int
    username: str
    email: str | None = None
    participant_id: str
    role: str
    created_at: datetime
    submission_count: int
    best_score: float | None = None


class AdminSubmission(DesignPublic):
    username: str
    participant_id: str
    user_id: int
