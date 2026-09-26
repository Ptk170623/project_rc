from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

RATING_VALUES = ("C", "B", "G", "A", "S", "M", "L", "E")
OPTION_KINDS = ("trait", "subtrait")
HIGHLIGHT_VALUES = ("strong", "less")
ROTATION_DAYS = (
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "others",
)


class Band(Base):
    __tablename__ = "bands"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    albums: Mapped[list["Album"]] = relationship(
        back_populates="band", cascade="all, delete-orphan", order_by="Album.id"
    )
    rotation_slots: Mapped[list["RotationSlot"]] = relationship(
        back_populates="band", cascade="all, delete-orphan"
    )


class Album(Base):
    __tablename__ = "albums"
    __table_args__ = (
        CheckConstraint(f"rating IN {RATING_VALUES}", name="ck_album_rating"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    band_id: Mapped[int] = mapped_column(ForeignKey("bands.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    # The rating lives on the album, not per song: rating every song
    # individually didn't scale, so a song's effective tier is just its
    # album's rating, with an optional Strong/Less nudge on a *trait*
    # (not the song) for anything that stood out either way.
    rating: Mapped[str | None] = mapped_column(String(1), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    band: Mapped["Band"] = relationship(back_populates="albums")
    songs: Mapped[list["Song"]] = relationship(
        back_populates="album", cascade="all, delete-orphan", order_by="Song.position"
    )
    lineup: Mapped[list["AlbumLineup"]] = relationship(
        back_populates="album",
        cascade="all, delete-orphan",
        order_by="AlbumLineup.position",
    )


class Song(Base):
    __tablename__ = "songs"
    __table_args__ = (
        CheckConstraint(f"rating IN {RATING_VALUES}", name="ck_song_rating"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    album_id: Mapped[int] = mapped_column(ForeignKey("albums.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    rating: Mapped[str | None] = mapped_column(String(1), nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    album: Mapped["Album"] = relationship(back_populates="songs")
    traits: Mapped[list["SongTrait"]] = relationship(
        back_populates="song",
        cascade="all, delete-orphan",
        order_by="SongTrait.position",
    )


class SongTrait(Base):
    __tablename__ = "song_traits"
    __table_args__ = (
        CheckConstraint(f"highlight IN {HIGHLIGHT_VALUES}", name="ck_trait_highlight"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    song_id: Mapped[int] = mapped_column(ForeignKey("songs.id"), nullable=False)
    text: Mapped[str] = mapped_column(String(200), nullable=False)
    # Legacy free-text classification (e.g. "Great"/"Strong"/"Low"), superseded
    # by `highlight` below. Kept only so pre-existing rows aren't dropped;
    # nothing in the app writes or reads it anymore.
    sub_text: Mapped[str | None] = mapped_column(String(200), nullable=True)
    highlight: Mapped[str | None] = mapped_column(String(10), nullable=True)
    performer: Mapped[str | None] = mapped_column(String(200), nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    song: Mapped["Song"] = relationship(back_populates="traits")


class QuickOption(Base):
    """Reusable quick-add options for trait text and sub-trait (classification) text."""

    __tablename__ = "quick_options"
    __table_args__ = (
        CheckConstraint(f"kind IN {OPTION_KINDS}", name="ck_option_kind"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    kind: Mapped[str] = mapped_column(String(10), nullable=False)
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0)


class RotationSlot(Base):
    """A band slot on one weekday (or the "others" catch-all) in the
    Weekly Rotation section."""

    __tablename__ = "rotation_slots"
    __table_args__ = (
        CheckConstraint(f"day IN {ROTATION_DAYS}", name="ck_rotation_day"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    day: Mapped[str] = mapped_column(String(10), nullable=False)
    band_id: Mapped[int] = mapped_column(ForeignKey("bands.id"), nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    band: Mapped["Band"] = relationship(back_populates="rotation_slots")


class AlbumLineup(Base):
    """Default performer per instrument for an album; a song's own trait
    `performer` overrides this when set."""

    __tablename__ = "album_lineup"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    album_id: Mapped[int] = mapped_column(ForeignKey("albums.id"), nullable=False)
    instrument: Mapped[str] = mapped_column(String(100), nullable=False)
    performer: Mapped[str] = mapped_column(String(200), nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0)

    album: Mapped["Album"] = relationship(back_populates="lineup")
