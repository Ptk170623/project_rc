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
        band_name=album.band.name,
        songs=album.songs,
        lineup=album.lineup,
    )


@router.delete("/albums/{album_id}", status_code=204)
def delete_album(album_id: int, db: Session = Depends(get_db)):
    album = db.get(models.Album, album_id)
    if not album:
        raise HTTPException(404, "Album not found")
    db.delete(album)
    db.commit()
