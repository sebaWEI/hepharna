from pydantic import BaseModel, Field, field_validator


class RegisterRequest(BaseModel):
    username: str = Field(min_length=2, max_length=32)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=6, max_length=128)
    confirm_password: str | None = Field(default=None, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        email = value.strip().lower()
        if "@" not in email or "." not in email.split("@")[-1]:
            raise ValueError("Please enter a valid email address.")
        local, _, domain = email.partition("@")
        if not local or not domain or " " in email:
            raise ValueError("Please enter a valid email address.")
        return email


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
    email: str | None = None
    participant_id: str
    role: str

    model_config = {"from_attributes": True}


class MeResponse(UserPublic):
    rank: int | None = None
    best_score: float | None = None
    submission_count: int = 0
    max_submissions: int = 5
