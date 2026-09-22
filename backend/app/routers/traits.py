from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(tags=["traits"])


@router.post(
    "/songs/{song_id}/traits", response_model=schemas.SongTraitRead, status_code=201
)
def add_trait(song_id: int, payload: schemas.SongTraitCreate, db: Session = Depends(get_db)):
    song = db.get(models.Song, song_id)
    if not song:
        raise HTTPException(404, "Song not found")

    current_max = (
        db.query(func.max(models.SongTrait.position))
        .filter(models.SongTrait.song_id == song_id)
        .scalar()
    )
    trait = models.SongTrait(
        song_id=song_id,
        text=payload.text.strip(),
        position=(current_max or 0) + 1,
    )
    db.add(trait)
    db.commit()
    db.refresh(trait)
    return trait


@router.patch("/traits/{trait_id}", response_model=schemas.SongTraitRead)
def update_trait(trait_id: int, payload: schemas.SongTraitUpdate, db: Session = Depends(get_db)):
    trait = db.get(models.SongTrait, trait_id)
    if not trait:
        raise HTTPException(404, "Trait not found")
    if payload.text is not None:
        trait.text = payload.text.strip()
    if payload.clear_highlight:
        trait.highlight = None
    elif payload.highlight is not None:
        trait.highlight = payload.highlight
    if payload.clear_performer:
        trait.performer = None
    elif payload.performer is not None:
        trait.performer = payload.performer.strip()
    db.commit()
    db.refresh(trait)
    return trait


@router.delete("/traits/{trait_id}", status_code=204)
def delete_trait(trait_id: int, db: Session = Depends(get_db)):
    trait = db.get(models.SongTrait, trait_id)
    if not trait:
        raise HTTPException(404, "Trait not found")
    db.delete(trait)
    db.commit()
