from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=2, max_length=32)
    password: str = Field(min_length=6, max_length=128)
    confirm_password: str | None = Field(default=None, max_length=128)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserPublic"


class UserPublic(BaseModel):
    id: int
    username: str
    participant_id: str
    role: str

    model_config = {"from_attributes": True}


class MeResponse(UserPublic):
    rank: int | None = None
    best_score: float | None = None
    submission_count: int = 0
    max_submissions: int = 5
