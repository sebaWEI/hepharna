from datetime import datetime

from pydantic import BaseModel, Field


class DesignCreate(BaseModel):
    sequence: str = Field(min_length=1)


class DesignUpdate(BaseModel):
    sequence: str = Field(min_length=1)


class ScorePublic(BaseModel):
    overall_score: float
    structure_score: float | None = None
    interface_score: float | None = None
    clash_score: float | None = None
    confidence_score: float | None = None
    published_at: datetime | None = None
    updated_at: datetime | None = None


class DesignPublic(BaseModel):
    id: int
    design_id: str
    version: int
    sequence: str
    status: str
    length: int
    gc_content: float
    score: float | None = None
    scores: ScorePublic | None = None
    rank: int | None = None
    submitted_at: datetime | None = None
    published_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class CurrentDesignResponse(BaseModel):
    design: DesignPublic | None = None
    draft: DesignPublic | None = None


class SubmitResponse(BaseModel):
    message: str
    design: DesignPublic


class ChallengeConfig(BaseModel):
    min_rna_length: int
    max_rna_length: int
    max_submissions_per_user: int
    challenge_start_time: datetime | None
    challenge_end_time: datetime | None
    challenge_open: bool
    minecraft_server_address: str
    minecraft_info: str
    reference_rna_sequence: str
    reference_rna_name: str = "HEPHA"
