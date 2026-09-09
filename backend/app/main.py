from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import PROJECT_ROOT, get_settings
from app.database import init_db
from app.routers import admin, auth, config, designs, fold, leaderboard, me


@asynccontextmanager
async def lifespan(_app: FastAPI):
    current = get_settings()
    if not current.jwt_secret:
        raise RuntimeError(
            "JWT_SECRET is not set. Copy .env.example to .env and generate a secret."
        )
    init_db()
    yield


app = FastAPI(title="HEPHA-RNA Design Challenge", version="1.0.0", lifespan=lifespan)

_settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        _settings.frontend_url,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_error(_request: Request, exc: Exception) -> JSONResponse:
    if isinstance(exc, (StarletteHTTPException, RequestValidationError)):
        raise exc
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong. Please try again."},
    )


app.include_router(auth.router)
app.include_router(me.router)
app.include_router(designs.router)
app.include_router(leaderboard.router)
app.include_router(admin.router)
app.include_router(config.router)
app.include_router(fold.router)


def mount_frontend(application: FastAPI) -> None:
    if not _settings.serve_frontend:
        return
    dist = PROJECT_ROOT / "frontend" / "dist"
    index = dist / "index.html"
    if not index.is_file():
        return
    assets = dist / "assets"
    if assets.is_dir():
        application.mount("/assets", StaticFiles(directory=assets), name="assets")

    @application.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        target = dist / full_path
        if full_path and target.is_file():
            return FileResponse(target)
        return FileResponse(index)


mount_frontend(app)
