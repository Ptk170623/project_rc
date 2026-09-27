from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

# This app isn't for grading music, just a quick note of how a song landed
# while listening — Like So Much, Like, or Meh, and nothing more granular
# than that. `plus` (below) covers wanting to say a bit more without
# turning it back into a rating scale.
RATING_VALUES = ("M", "L", "C")
OPTION_KINDS = ("trait", "subtrait")
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
    # Unused: albums no longer carry a rating of their own (only songs and
    # traits do). Left in place rather than dropped so existing rows aren't
    # disturbed; nothing reads or writes it anymore.
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
    # Marks a song as the strong end of its own tier (e.g. "Like So Much+")
    # for when a plain tier doesn't feel like enough, without adding a whole
    # tier of its own. Meaningless without a `rating` of its own, mirrored
    # by `SongTrait.plus` below.
    plus: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
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
        CheckConstraint(f"highlight IN {RATING_VALUES}", name="ck_trait_highlight"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    song_id: Mapped[int] = mapped_column(ForeignKey("songs.id"), nullable=False)
    text: Mapped[str] = mapped_column(String(200), nullable=False)
    # Legacy free-text classification (e.g. "Great"/"Strong"/"Low"), superseded
    # by `highlight` below. Kept only so pre-existing rows aren't dropped;
    # nothing in the app writes or reads it anymore.
    sub_text: Mapped[str | None] = mapped_column(String(200), nullable=True)
    # A trait's own rating tier (same codes as Song.rating), overriding the
    # song's color for just this trait when set; null means "use the song's
    # own tier" (the neutral/inherited look).
    highlight: Mapped[str | None] = mapped_column(String(1), nullable=True)
    # Marks this trait as standing out, independent of `highlight`: a trait
    # can be flagged this way while still just showing the song's own tier
    # (no need to also give it a separate tier of its own to highlight it).
    plus: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
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
