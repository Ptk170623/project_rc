from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/bands", tags=["bands"])


@router.get("", response_model=list[schemas.BandRead])
def list_bands(db: Session = Depends(get_db)):
    return db.query(models.Band).order_by(models.Band.name).all()


@router.post("", response_model=schemas.BandRead, status_code=201)
def create_band(payload: schemas.BandCreate, db: Session = Depends(get_db)):
    band = models.Band(name=payload.name.strip())
    db.add(band)
    db.commit()
    db.refresh(band)
    return band


@router.get("/{band_id}", response_model=schemas.BandDetail)
def get_band(band_id: int, db: Session = Depends(get_db)):
    band = db.get(models.Band, band_id)
    if not band:
        raise HTTPException(404, "Band not found")
    return band


@router.delete("/{band_id}", status_code=204)
def delete_band(band_id: int, db: Session = Depends(get_db)):
    band = db.get(models.Band, band_id)
    if not band:
        raise HTTPException(404, "Band not found")
    db.delete(band)
    db.commit()


@router.get("/{band_id}/export", response_model=schemas.BandExportFile)
def export_band(band_id: int, db: Session = Depends(get_db)):
    band = db.get(models.Band, band_id)
    if not band:
        raise HTTPException(404, "Band not found")
    return schemas.BandExportFile(
        exported_at=datetime.utcnow(),
        band=schemas.BandExport(
            name=band.name,
            albums=[
                schemas.AlbumExport(
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
                )
                for album in band.albums
            ],
        ),
    )
