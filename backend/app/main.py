from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from . import models
from .database import Base, SessionLocal, engine
from .routers import albums, bands, imports, lineup, options, rotation, songs, traits

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


def _start_song_rating_migration() -> bool:
    """SQLite bakes a CHECK constraint into a table's DDL at creation time,
    so widening `RATING_VALUES` in models.py doesn't retroactively update
    an already-created `songs` table on someone's existing music.db —
    inserting one of the new rating codes would still violate the old
    constraint. SQLite has no ALTER TABLE for CHECK constraints, so the
    table has to be rebuilt; this only happens once, and only when needed.
    Renames the old table out of the way so `Base.metadata.create_all`
    recreates `songs` fresh with the current constraint; pair with
    `_finish_song_rating_migration` to copy the old rows back in.
    """
    inspector = inspect(engine)
    if "songs" not in inspector.get_table_names():
        return False  # brand new database; create_all() gets it right immediately
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT sql FROM sqlite_master WHERE type='table' AND name='songs'")
        ).fetchone()
        current_sql = row[0] if row else ""
        if all(f"'{value}'" in current_sql for value in models.RATING_VALUES):
            return False  # already covers every current rating value
        conn.execute(text("ALTER TABLE songs RENAME TO songs_pre_migration"))
        conn.commit()
    return True


def _finish_song_rating_migration() -> None:
    with engine.connect() as conn:
        conn.execute(
            text(
                "INSERT INTO songs (id, album_id, name, rating, position, created_at) "
                "SELECT id, album_id, name, rating, position, created_at FROM songs_pre_migration"
            )
        )
        conn.execute(text("DROP TABLE songs_pre_migration"))
        conn.commit()


def _start_album_rating_migration() -> bool:
    """Same idea as `_start_song_rating_migration`, but for a column that
    didn't exist at all on an older `albums` table (rating now lives on
    the album, not per song). SQLite can't ALTER TABLE in a CHECK
    constraint after the fact, so this rebuilds the table when needed;
    pair with `_finish_album_rating_migration` to copy the old rows back
    in (rating defaults to NULL for them, same as if never rated)."""
    inspector = inspect(engine)
    if "albums" not in inspector.get_table_names():
        return False
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT sql FROM sqlite_master WHERE type='table' AND name='albums'")
        ).fetchone()
        current_sql = row[0] if row else ""
        if "rating" in current_sql:
            return False  # already migrated
        conn.execute(text("ALTER TABLE albums RENAME TO albums_pre_migration"))
        conn.commit()
    return True


def _finish_album_rating_migration() -> None:
    with engine.connect() as conn:
        conn.execute(
            text(
                "INSERT INTO albums (id, band_id, name, created_at) "
                "SELECT id, band_id, name, created_at FROM albums_pre_migration"
            )
        )
        conn.execute(text("DROP TABLE albums_pre_migration"))
        conn.commit()


def _seed_default_options() -> None:
    db = SessionLocal()
    try:
        existing = (
            db.query(models.QuickOption).filter(models.QuickOption.kind == "trait").count()
        )
        if not existing:
            for i, label in enumerate(DEFAULT_TRAIT_OPTIONS, start=1):
                db.add(models.QuickOption(kind="trait", label=label, position=i))
            db.commit()
    finally:
        db.close()


def create_app() -> FastAPI:
    needs_rating_migration = _start_song_rating_migration()
    needs_album_rating_migration = _start_album_rating_migration()
    Base.metadata.create_all(bind=engine)
    if needs_rating_migration:
        _finish_song_rating_migration()
    if needs_album_rating_migration:
        _finish_album_rating_migration()
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
    app.include_router(lineup.router)
    app.include_router(imports.router)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()
