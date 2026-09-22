from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

Rating = Literal["C", "B", "G", "A", "S"]
OptionKind = Literal["trait", "subtrait"]
Highlight = Literal["strong", "less"]
RotationDay = Literal[
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "others"
]


# ---------- SongTrait ----------
class SongTraitCreate(BaseModel):
    text: str = Field(min_length=1, max_length=200)


class SongTraitUpdate(BaseModel):
    text: Optional[str] = Field(default=None, min_length=1, max_length=200)
    highlight: Optional[Highlight] = None
    clear_highlight: bool = False
    performer: Optional[str] = Field(default=None, max_length=200)
    clear_performer: bool = False


class SongTraitRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    song_id: int
    text: str
    highlight: Optional[str]
    performer: Optional[str]
    position: int


# ---------- Song ----------
class SongCreate(BaseModel):
    name: str = Field(min_length=1, max_length=300)


class SongUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=300)
    rating: Optional[Rating] = None
    clear_rating: bool = False


class SongRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    album_id: int
    name: str
    rating: Optional[str]
    position: int
    traits: list[SongTraitRead] = []


# ---------- Album ----------
class AlbumCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class AlbumRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    band_id: int
    name: str


# ---------- AlbumLineup ----------
class AlbumLineupCreate(BaseModel):
    instrument: str = Field(min_length=1, max_length=100)
    performer: str = Field(min_length=1, max_length=200)


class AlbumLineupUpdate(BaseModel):
    instrument: Optional[str] = Field(default=None, min_length=1, max_length=100)
    performer: Optional[str] = Field(default=None, min_length=1, max_length=200)


class AlbumLineupRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    album_id: int
    instrument: str
    performer: str
    position: int


class AlbumDetail(AlbumRead):
    band_name: str
    songs: list[SongRead] = []
    lineup: list[AlbumLineupRead] = []


# ---------- Import ----------
class ImportResult(BaseModel):
    band_id: int
    band_name: str
    album_id: int
    album_name: str
    created_count: int
    skipped: list[str]
    lineup_count: int


# ---------- Band ----------
class BandCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class BandRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class BandDetail(BandRead):
    albums: list[AlbumRead] = []


# ---------- QuickOption ----------
class QuickOptionCreate(BaseModel):
    kind: OptionKind
    label: str = Field(min_length=1, max_length=200)


class QuickOptionUpdate(BaseModel):
    label: str = Field(min_length=1, max_length=200)


class QuickOptionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kind: str
    label: str
    position: int


# ---------- RotationSlot ----------
class RotationSlotCreate(BaseModel):
    day: RotationDay
    band_id: int


class RotationSlotRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    day: str
    band_id: int
    position: int
    band: BandRead
