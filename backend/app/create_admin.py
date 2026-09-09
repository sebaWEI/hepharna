from __future__ import annotations

import argparse
import getpass
import sys

from app.auth.passwords import hash_password
from app.config import get_settings
from app.database import SessionLocal, init_db
from app.models import User
from app.services.ids import next_participant_id


def create_admin(username: str, password: str) -> User:
    init_db()
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            raise SystemExit(f"User '{username}' already exists.")
        user = User(
            username=username,
            password_hash=hash_password(password),
            role="admin",
            participant_id=next_participant_id(db),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Create an HEPHA-RNA admin account.")
    parser.add_argument("--username", help="Admin username")
    parser.add_argument("--password", help="Admin password")
    args = parser.parse_args()

    settings = get_settings()
    if not settings.jwt_secret:
        raise SystemExit("JWT_SECRET is not set. Copy .env.example to .env first.")

    username = args.username or input("Username: ").strip()
    if not username:
        raise SystemExit("Username is required.")
    password = args.password or getpass.getpass("Password: ")
    if len(password) < 6:
        raise SystemExit("Password must be at least 6 characters.")
    user = create_admin(username, password)
    print(f"Admin created: {user.username} ({user.participant_id})")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(1)
