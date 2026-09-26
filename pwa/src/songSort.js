import { RATING_TIERS } from "./ratingTiers.js";

const RANK_BY_CODE = Object.fromEntries(RATING_TIERS.map((t, i) => [t.code, i]));

export const SORT_OPTIONS = [
  { value: "rating-desc", label: "Highest rating first" },
  { value: "rating-asc", label: "Lowest rating first" },
  { value: "library", label: "Band / Album order" },
  { value: "name", label: "Name (A–Z)" },
];

function byLibraryOrder(a, b) {
  const bandCompare = a.band_name.localeCompare(b.band_name);
  if (bandCompare !== 0) return bandCompare;
  if (a.album_id !== b.album_id) return a.album_id - b.album_id;
  return a.position - b.position;
}

// Ranks by the song's *album* rating — songs don't carry their own rating
// anymore. Unrated albums always sort last, in either direction — there's
// no tier to rank them by, and burying them at the bottom (rather than
// flipping to the top for "lowest first") keeps the list predictable.
export function sortSongs(songs, mode) {
  const copy = [...songs];
  if (mode === "name") {
    return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
  if (mode === "library") {
    return copy.sort(byLibraryOrder);
  }
  const direction = mode === "rating-asc" ? -1 : 1;
  return copy.sort((a, b) => {
    const ra = a.album_rating ? RANK_BY_CODE[a.album_rating] : null;
    const rb = b.album_rating ? RANK_BY_CODE[b.album_rating] : null;
    if (ra === null && rb === null) return byLibraryOrder(a, b);
    if (ra === null) return 1;
    if (rb === null) return -1;
    if (ra !== rb) return (ra - rb) * direction;
    return byLibraryOrder(a, b);
  });
}
