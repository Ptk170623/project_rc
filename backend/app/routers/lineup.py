from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(tags=["lineup"])


@router.post(
    "/albums/{album_id}/lineup", response_model=schemas.AlbumLineupRead, status_code=201
)
def create_lineup_entry(
    album_id: int, payload: schemas.AlbumLineupCreate, db: Session = Depends(get_db)
):
    album = db.get(models.Album, album_id)
    if not album:
        raise HTTPException(404, "Album not found")

    current_max = (
        db.query(func.max(models.AlbumLineup.position))
        .filter(models.AlbumLineup.album_id == album_id)
        .scalar()
    )
    entry = models.AlbumLineup(
        album_id=album_id,
        instrument=payload.instrument.strip(),
        performer=payload.performer.strip(),
        position=(current_max or 0) + 1,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.patch("/lineup/{entry_id}", response_model=schemas.AlbumLineupRead)
def update_lineup_entry(
    entry_id: int, payload: schemas.AlbumLineupUpdate, db: Session = Depends(get_db)
):
    entry = db.get(models.AlbumLineup, entry_id)
    if not entry:
        raise HTTPException(404, "Lineup entry not found")
    if payload.instrument is not None:
        entry.instrument = payload.instrument.strip()
    if payload.performer is not None:
        entry.performer = payload.performer.strip()
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/lineup/{entry_id}", status_code=204)
def delete_lineup_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = db.get(models.AlbumLineup, entry_id)
    if not entry:
        raise HTTPException(404, "Lineup entry not found")
    db.delete(entry)
    db.commit()
