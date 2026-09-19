from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/options", tags=["options"])


@router.get("", response_model=list[schemas.QuickOptionRead])
def list_options(kind: schemas.OptionKind = Query(...), db: Session = Depends(get_db)):
    return (
        db.query(models.QuickOption)
        .filter(models.QuickOption.kind == kind)
        .order_by(models.QuickOption.position)
        .all()
    )


@router.post("", response_model=schemas.QuickOptionRead, status_code=201)
def create_option(payload: schemas.QuickOptionCreate, db: Session = Depends(get_db)):
    current_max = (
        db.query(func.max(models.QuickOption.position))
        .filter(models.QuickOption.kind == payload.kind)
        .scalar()
    )
    option = models.QuickOption(
        kind=payload.kind,
        label=payload.label.strip(),
        position=(current_max or 0) + 1,
    )
    db.add(option)
    db.commit()
    db.refresh(option)
    return option


@router.patch("/{option_id}", response_model=schemas.QuickOptionRead)
def update_option(option_id: int, payload: schemas.QuickOptionUpdate, db: Session = Depends(get_db)):
    option = db.get(models.QuickOption, option_id)
    if not option:
        raise HTTPException(404, "Option not found")
    option.label = payload.label.strip()
    db.commit()
    db.refresh(option)
    return option


@router.delete("/{option_id}", status_code=204)
def delete_option(option_id: int, db: Session = Depends(get_db)):
    option = db.get(models.QuickOption, option_id)
    if not option:
        raise HTTPException(404, "Option not found")
    db.delete(option)
    db.commit()
