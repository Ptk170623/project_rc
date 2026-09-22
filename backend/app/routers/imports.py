from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/import", tags=["import"])


def _parse_import_file(text: str):
    """Parses the bulk-import .txt format.

    A file with no `Band:`/`Album:`/`Lineup:`/`Songs:` markers at all is
    just a plain list of song names, one per line — the original format,
    still fully supported. Any of those markers switch on the richer
    syntax: `Band:`/`Album:` name the target (created if they don't
    exist), `Lineup:` sets the album's default performer per instrument,
    and `Songs:` lists song titles, each optionally followed by
    `| Instrument: Name` overrides for that one song.
    """
    band_name = None
    album_name = None
    lineup: list[tuple[str, str]] = []
    songs: list[tuple[str, list[tuple[str, str]]]] = []
    section = None

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        lower = line.lower()

        if lower.startswith("band:"):
            band_name = line.split(":", 1)[1].strip()
            continue
        if lower.startswith("album:"):
            album_name = line.split(":", 1)[1].strip()
            continue
        if lower == "lineup:":
            section = "lineup"
            continue
        if lower == "songs:":
            section = "songs"
            continue

        if section == "lineup":
            if ":" in line:
                instrument, performer = line.split(":", 1)
                instrument, performer = instrument.strip(), performer.strip()
                if instrument and performer:
                    lineup.append((instrument, performer))
            continue

        # A song line (covers an explicit `Songs:` section and the
        # no-markers-at-all plain-list case, where section stays None).
        if "|" in line:
            title, rest = line.split("|", 1)
            title = title.strip()
            overrides = []
            for part in rest.split(","):
                if ":" in part:
                    instrument, name = part.split(":", 1)
                    instrument, name = instrument.strip(), name.strip()
                    if instrument and name:
                        overrides.append((instrument, name))
            if title:
                songs.append((title, overrides))
        elif line:
            songs.append((line, []))

    return band_name, album_name, lineup, songs


def _find_or_create_band(db: Session, name: str) -> models.Band:
    band = (
        db.query(models.Band)
        .filter(func.lower(models.Band.name) == name.lower())
        .first()
    )
    if band:
        return band
    band = models.Band(name=name)
    db.add(band)
    db.flush()
    return band


def _find_or_create_album(db: Session, band_id: int, name: str) -> models.Album:
    album = (
        db.query(models.Album)
        .filter(
            models.Album.band_id == band_id,
            func.lower(models.Album.name) == name.lower(),
        )
        .first()
    )
    if album:
        return album
    album = models.Album(band_id=band_id, name=name)
    db.add(album)
    db.flush()
    return album


@router.post("/songs", response_model=schemas.ImportResult, status_code=201)
async def import_songs(
    file: UploadFile,
    album_id: int | None = Form(default=None),
    db: Session = Depends(get_db),
):
    raw = (await file.read()).decode("utf-8", errors="ignore")
    band_name, album_name, lineup, songs = _parse_import_file(raw)

    if band_name and album_name:
        band = _find_or_create_band(db, band_name)
        album = _find_or_create_album(db, band.id, album_name)
    elif album_id is not None:
        album = db.get(models.Album, album_id)
        if not album:
            raise HTTPException(404, "Album not found")
        band = album.band
    else:
        raise HTTPException(
            400,
            "The file needs Band: and Album: lines, or import it from inside an album.",
        )

    lineup_position = (
        db.query(func.max(models.AlbumLineup.position))
        .filter(models.AlbumLineup.album_id == album.id)
        .scalar()
        or 0
    )
    for instrument, performer in lineup:
        existing = next(
            (e for e in album.lineup if e.instrument.lower() == instrument.lower()),
            None,
        )
        if existing:
            existing.performer = performer
        else:
            lineup_position += 1
            db.add(
                models.AlbumLineup(
                    album_id=album.id,
                    instrument=instrument,
                    performer=performer,
                    position=lineup_position,
                )
            )

    position = (
        db.query(func.max(models.Song.position))
        .filter(models.Song.album_id == album.id)
        .scalar()
        or 0
    ) + 1

    created_count = 0
    skipped: list[str] = []
    for title, overrides in songs:
        if len(title) > 300:
            skipped.append(title)
            continue
        song = models.Song(album_id=album.id, name=title, position=position)
        db.add(song)
        db.flush()
        position += 1
        for i, (instrument, performer) in enumerate(overrides, start=1):
            db.add(
                models.SongTrait(
                    song_id=song.id,
                    text=instrument,
                    performer=performer,
                    position=i,
                )
            )
        created_count += 1

    db.commit()

    return schemas.ImportResult(
        band_id=band.id,
        band_name=band.name,
        album_id=album.id,
        album_name=album.name,
        created_count=created_count,
        skipped=skipped,
        lineup_count=len(lineup),
    )
