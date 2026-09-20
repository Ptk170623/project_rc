from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/rotation", tags=["rotation"])


@router.get("", response_model=list[schemas.RotationSlotRead])
def list_rotation(db: Session = Depends(get_db)):
    return (
        db.query(models.RotationSlot)
        .order_by(models.RotationSlot.day, models.RotationSlot.position)
        .all()
    )


@router.post("", response_model=schemas.RotationSlotRead, status_code=201)
def create_slot(payload: schemas.RotationSlotCreate, db: Session = Depends(get_db)):
    band = db.get(models.Band, payload.band_id)
    if not band:
        raise HTTPException(404, "Band not found")

    current_max = (
        db.query(func.max(models.RotationSlot.position))
        .filter(models.RotationSlot.day == payload.day)
        .scalar()
    )
    slot = models.RotationSlot(
        day=payload.day,
        band_id=payload.band_id,
        position=(current_max or 0) + 1,
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


@router.delete("/{slot_id}", status_code=204)
def delete_slot(slot_id: int, db: Session = Depends(get_db)):
    slot = db.get(models.RotationSlot, slot_id)
    if not slot:
        raise HTTPException(404, "Rotation slot not found")
    db.delete(slot)
    db.commit()
