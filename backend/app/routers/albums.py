from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(tags=["albums"])


@router.post("/bands/{band_id}/albums", response_model=schemas.AlbumRead, status_code=201)
def create_album(band_id: int, payload: schemas.AlbumCreate, db: Session = Depends(get_db)):
    band = db.get(models.Band, band_id)
    if not band:
        raise HTTPException(404, "Band not found")
    album = models.Album(band_id=band_id, name=payload.name.strip())
    db.add(album)
    db.commit()
    db.refresh(album)
    return album


@router.get("/albums/{album_id}", response_model=schemas.AlbumDetail)
def get_album(album_id: int, db: Session = Depends(get_db)):
    album = db.get(models.Album, album_id)
    if not album:
        raise HTTPException(404, "Album not found")
    return schemas.AlbumDetail(
        id=album.id,
        band_id=album.band_id,
        name=album.name,
        rating=album.rating,
        band_name=album.band.name,
        songs=album.songs,
        lineup=album.lineup,
    )


@router.patch("/albums/{album_id}", response_model=schemas.AlbumRead)
def update_album(album_id: int, payload: schemas.AlbumUpdate, db: Session = Depends(get_db)):
    album = db.get(models.Album, album_id)
    if not album:
        raise HTTPException(404, "Album not found")
    if payload.name is not None:
        album.name = payload.name.strip()
    if payload.clear_rating:
        album.rating = None
    elif payload.rating is not None:
        album.rating = payload.rating
    db.commit()
    db.refresh(album)
    return album


@router.delete("/albums/{album_id}", status_code=204)
def delete_album(album_id: int, db: Session = Depends(get_db)):
    album = db.get(models.Album, album_id)
    if not album:
        raise HTTPException(404, "Album not found")
    db.delete(album)
    db.commit()


@router.get("/albums/{album_id}/export", response_model=schemas.AlbumExportFile)
def export_album(album_id: int, db: Session = Depends(get_db)):
    album = db.get(models.Album, album_id)
    if not album:
        raise HTTPException(404, "Album not found")
    return schemas.AlbumExportFile(
        exported_at=datetime.utcnow(),
        band_name=album.band.name,
        album=schemas.AlbumExport(
            name=album.name,
            rating=album.rating,
            lineup=[
                schemas.LineupExport(instrument=e.instrument, performer=e.performer)
                for e in album.lineup
            ],
            songs=[
                schemas.SongExport(
                    name=song.name,
                    rating=song.rating,
                    traits=[
                        schemas.TraitExport(
                            text=t.text, highlight=t.highlight, performer=t.performer
                        )
                        for t in song.traits
                    ],
                )
                for song in album.songs
            ],
        ),
    )
