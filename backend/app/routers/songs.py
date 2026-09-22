from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(tags=["songs"])


def _next_position(db: Session, album_id: int) -> int:
    current_max = (
        db.query(func.max(models.Song.position))
        .filter(models.Song.album_id == album_id)
        .scalar()
    )
    return (current_max or 0) + 1


@router.post("/albums/{album_id}/songs", response_model=schemas.SongRead, status_code=201)
def create_song(album_id: int, payload: schemas.SongCreate, db: Session = Depends(get_db)):
    album = db.get(models.Album, album_id)
    if not album:
        raise HTTPException(404, "Album not found")
    song = models.Song(
        album_id=album_id,
        name=payload.name.strip(),
        position=_next_position(db, album_id),
    )
    db.add(song)
    db.commit()
    db.refresh(song)
    return song


@router.get("/albums/{album_id}/songs", response_model=list[schemas.SongRead])
def list_songs(album_id: int, db: Session = Depends(get_db)):
    album = db.get(models.Album, album_id)
    if not album:
        raise HTTPException(404, "Album not found")
    return album.songs


@router.patch("/songs/{song_id}", response_model=schemas.SongRead)
def update_song(song_id: int, payload: schemas.SongUpdate, db: Session = Depends(get_db)):
    song = db.get(models.Song, song_id)
    if not song:
        raise HTTPException(404, "Song not found")
    if payload.name is not None:
        song.name = payload.name.strip()
    if payload.clear_rating:
        song.rating = None
    elif payload.rating is not None:
        song.rating = payload.rating
    db.commit()
    db.refresh(song)
    return song


@router.delete("/songs/{song_id}", status_code=204)
def delete_song(song_id: int, db: Session = Depends(get_db)):
    song = db.get(models.Song, song_id)
    if not song:
        raise HTTPException(404, "Song not found")
    db.delete(song)
    db.commit()
