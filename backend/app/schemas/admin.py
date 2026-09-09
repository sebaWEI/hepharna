from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.design import DesignPublic


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    participant_id: str
    score: float
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
    overall_score: float = Field(ge=0, le=100)
    structure_score: float | None = Field(default=None, ge=0, le=100)
    interface_score: float | None = Field(default=None, ge=0, le=100)
    clash_score: float | None = Field(default=None, ge=0, le=100)
    confidence_score: float | None = Field(default=None, ge=0, le=100)


class AdminUser(BaseModel):
    id: int
    username: str
    participant_id: str
    role: str
    created_at: datetime
    submission_count: int
    best_score: float | None = None


class AdminSubmission(DesignPublic):
    username: str
    participant_id: str
    user_id: int
