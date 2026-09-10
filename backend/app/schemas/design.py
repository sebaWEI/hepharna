from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class DesignInput(BaseModel):
    sequence: str = Field(min_length=1)
    name: str | None = Field(default=None, max_length=80)

    @field_validator("name", mode="before")
    @classmethod
    def normalize_name(cls, value):
        if isinstance(value, str):
            return value.strip() or None
        return value


class DesignCreate(DesignInput):
    # Explicit copies must not replace another unfinished draft.
    new_draft: bool = False


class DesignUpdate(DesignInput):
    pass


class ScorePublic(BaseModel):
    overall_score: float
    plddt: float | None = None
    iptm: float | None = None
    published_at: datetime | None = None
    updated_at: datetime | None = None


class DesignPublic(BaseModel):
    id: int
    design_id: str
    name: str | None = None
    version: int
    sequence: str
    status: str
    length: int
    gc_content: float
    score: float | None = None
    scores: ScorePublic | None = None
    rank: int | None = None
    has_structure: bool = False
    structure_filename: str | None = None
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
