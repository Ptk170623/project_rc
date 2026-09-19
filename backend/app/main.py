from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import Base, SessionLocal, engine
from .routers import albums, bands, options, songs, traits

DEFAULT_TRAIT_OPTIONS = [
    "Baixo marcante",
    "Bateria groove",
    "Riff de guitarra",
    "Vocal potente",
    "Harmonia vocal",
    "Letra profunda",
    "Produção limpa",
    "Mudança de andamento",
    "Solo instrumental",
    "Atmosfera",
]

DEFAULT_SUBTRAIT_OPTIONS = [
    "Muito bom",
    "Surpreendente",
    "Sutil",
    "Repetitivo",
    "Marcante",
    "Fora do padrão da banda",
]


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

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(bands.router)
    app.include_router(albums.router)
    app.include_router(songs.router)
    app.include_router(traits.router)
    app.include_router(options.router)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()
