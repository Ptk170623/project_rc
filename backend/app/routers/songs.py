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


@router.get("/songs", response_model=list[schemas.SongWithContext])
def list_all_songs(db: Session = Depends(get_db)):
    songs = (
        db.query(models.Song)
        .join(models.Album, models.Song.album_id == models.Album.id)
        .join(models.Band, models.Album.band_id == models.Band.id)
        .order_by(models.Band.name, models.Album.id, models.Song.position)
        .all()
    )
    return [
        schemas.SongWithContext(
            id=song.id,
            album_id=song.album_id,
            name=song.name,
            rating=song.rating,
            position=song.position,
            traits=song.traits,
            band_id=song.album.band_id,
            band_name=song.album.band.name,
            album_name=song.album.name,
            lineup=song.album.lineup,
        )
        for song in songs
    ]


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
