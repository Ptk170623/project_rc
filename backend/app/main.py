from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from . import models
from .database import Base, SessionLocal, engine
from .routers import albums, bands, imports, lineup, options, rotation, songs, traits

# Every rating code this app has ever used, past and present — used to spot
# a table whose CHECK constraint still allows a code that's since been
# dropped from RATING_VALUES (rows carrying it get nulled out by the
# migrations below, same treatment as any other value that stops being
# valid). Extend this set if a future round ever needs a code retired that
# isn't already listed here; it never needs codes removed.
_ALL_RATING_CODES_EVER = ("C", "B", "G", "A", "S", "M", "L", "E")
_DROPPED_RATING_CODES = tuple(c for c in _ALL_RATING_CODES_EVER if c not in models.RATING_VALUES)

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
    so a change to `RATING_VALUES` in models.py doesn't retroactively update
    an already-created `songs` table on someone's existing music.db — either
    a new code would violate the old constraint, or an old dropped code
    would keep being accepted. SQLite has no ALTER TABLE for CHECK
    constraints (or for adding the new `plus` column), so the table has to
    be rebuilt; this only happens once, and only when needed. Renames the
    old table out of the way so `Base.metadata.create_all` recreates `songs`
    fresh with the current constraint and columns; pair with
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
        if "plus" in current_sql and not any(
            f"'{value}'" in current_sql for value in _DROPPED_RATING_CODES
        ):
            return False  # already on the current schema
        conn.execute(text("ALTER TABLE songs RENAME TO songs_pre_migration"))
        conn.commit()
    return True


def _finish_song_rating_migration() -> None:
    with engine.connect() as conn:
        conn.execute(
            text(
                "INSERT INTO songs (id, album_id, name, rating, plus, position, created_at) "
                f"SELECT id, album_id, name, "
                f"CASE WHEN rating IN {models.RATING_VALUES} THEN rating ELSE NULL END, "
                "0, position, created_at FROM songs_pre_migration"
            )
        )
        conn.execute(text("DROP TABLE songs_pre_migration"))
        conn.commit()


def _start_album_rating_migration() -> bool:
    """Same idea as `_start_song_rating_migration`: rebuilds `albums` when
    either the `rating` column is missing entirely (a database from before
    albums had one at all) or its CHECK constraint still allows a code
    that's since been dropped from `RATING_VALUES`. Pair with
    `_finish_album_rating_migration` to copy the old rows back in."""
    inspector = inspect(engine)
    if "albums" not in inspector.get_table_names():
        return False
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT sql FROM sqlite_master WHERE type='table' AND name='albums'")
        ).fetchone()
        current_sql = row[0] if row else ""
        if "rating" in current_sql and not any(
            f"'{value}'" in current_sql for value in _DROPPED_RATING_CODES
        ):
            return False  # already migrated
        conn.execute(text("ALTER TABLE albums RENAME TO albums_pre_migration"))
        conn.commit()
    return True


def _finish_album_rating_migration() -> None:
    with engine.connect() as conn:
        columns = {
            row[1]
            for row in conn.execute(text("PRAGMA table_info(albums_pre_migration)")).fetchall()
        }
        rating_select = (
            f"CASE WHEN rating IN {models.RATING_VALUES} THEN rating ELSE NULL END"
            if "rating" in columns
            else "NULL"
        )
        conn.execute(
            text(
                "INSERT INTO albums (id, band_id, name, rating, created_at) "
                f"SELECT id, band_id, name, {rating_select}, created_at "
                "FROM albums_pre_migration"
            )
        )
        conn.execute(text("DROP TABLE albums_pre_migration"))
        conn.commit()


def _start_trait_highlight_migration() -> bool:
    """Same idea again, for `song_traits`: `highlight`'s CHECK constraint
    needs to track `RATING_VALUES` (it's had to widen in the past, and now
    narrows as Legendary/Extraordinary are dropped), and this round also
    adds the new `plus` column — both need the same rebuild-and-copy
    dance."""
    inspector = inspect(engine)
    if "song_traits" not in inspector.get_table_names():
        return False
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT sql FROM sqlite_master WHERE type='table' AND name='song_traits'")
        ).fetchone()
        current_sql = row[0] if row else ""
        if "plus" in current_sql and not any(
            f"'{value}'" in current_sql for value in _DROPPED_RATING_CODES
        ):
            return False  # already on the current schema
        conn.execute(text("ALTER TABLE song_traits RENAME TO song_traits_pre_migration"))
        conn.commit()
    return True


def _finish_trait_highlight_migration() -> None:
    # A highlight value that no longer survives the constraint (an old
    # "strong"/"less" marker, or a since-dropped rating code) is cleared to
    # NULL — the trait itself, its text and performer, are unaffected; it
    # just goes back to "no override, use the song's own tier" until
    # re-marked.
    with engine.connect() as conn:
        conn.execute(
            text(
                "INSERT INTO song_traits (id, song_id, text, sub_text, highlight, plus, performer, position, created_at) "
                f"SELECT id, song_id, text, sub_text, "
                f"CASE WHEN highlight IN {models.RATING_VALUES} THEN highlight ELSE NULL END, "
                "0, performer, position, created_at FROM song_traits_pre_migration"
            )
        )
        conn.execute(text("DROP TABLE song_traits_pre_migration"))
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
    needs_trait_highlight_migration = _start_trait_highlight_migration()
    Base.metadata.create_all(bind=engine)
    if needs_rating_migration:
        _finish_song_rating_migration()
    if needs_album_rating_migration:
        _finish_album_rating_migration()
    if needs_trait_highlight_migration:
        _finish_trait_highlight_migration()
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
