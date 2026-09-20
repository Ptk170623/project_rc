from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import Base, SessionLocal, engine
from .routers import albums, bands, options, rotation, songs, traits

DEFAULT_TRAIT_OPTIONS = [
    "Vocal",
    "Vocals",
    "Vocal with backing vocals",
    "Guitar",
    "Bass",
    "Drums",
    "Rhythm guitar",
    "Lead guitar",
    "Guitar solo",
]

DEFAULT_SUBTRAIT_OPTIONS = ["Great", "Strong", "Low"]


def _seed_default_options() -> None:
    db = SessionLocal()
    try:
        for kind, labels in (
            ("trait", DEFAULT_TRAIT_OPTIONS),
            ("subtrait", DEFAULT_SUBTRAIT_OPTIONS),
        ):
            existing = (
                db.query(models.QuickOption)
                .filter(models.QuickOption.kind == kind)
                .count()
            )
            if existing:
                continue
            for i, label in enumerate(labels, start=1):
                db.add(models.QuickOption(kind=kind, label=label, position=i))
        db.commit()
    finally:
        db.close()


def create_app() -> FastAPI:
    Base.metadata.create_all(bind=engine)
    _seed_default_options()

    app = FastAPI(title="Music Journal API")

    # Personal/local-use app: allow any origin (localhost or a LAN IP, for
    # access from a phone) since there's no cookie-based auth involved.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(bands.router)
    app.include_router(albums.router)
    app.include_router(songs.router)
    app.include_router(traits.router)
    app.include_router(options.router)
    app.include_router(rotation.router)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()
