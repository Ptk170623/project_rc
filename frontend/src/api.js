// Without VITE_API_BASE set, assume the API lives on the same machine that
// served this page (works both on localhost and when accessed via LAN IP,
// e.g. from a phone), on uvicorn's default port.
const API_BASE =
  import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:8000`;

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: options.body instanceof FormData
      ? undefined
      : { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      // ignore body parse errors
    }
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Bands
  listBands: () => request("/bands"),
  createBand: (name) =>
    request("/bands", { method: "POST", body: JSON.stringify({ name }) }),
  getBand: (bandId) => request(`/bands/${bandId}`),
  deleteBand: (bandId) => request(`/bands/${bandId}`, { method: "DELETE" }),

  // Albums
  createAlbum: (bandId, name) =>
    request(`/bands/${bandId}/albums`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  getAlbum: (albumId) => request(`/albums/${albumId}`),
  deleteAlbum: (albumId) => request(`/albums/${albumId}`, { method: "DELETE" }),

  // Songs
  createSong: (albumId, name) =>
    request(`/albums/${albumId}/songs`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  updateSong: (songId, payload) =>
    request(`/songs/${songId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteSong: (songId) => request(`/songs/${songId}`, { method: "DELETE" }),

  // Traits
  addTrait: (songId, text) =>
    request(`/songs/${songId}/traits`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  updateTrait: (traitId, payload) =>
    request(`/traits/${traitId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteTrait: (traitId) => request(`/traits/${traitId}`, { method: "DELETE" }),

  // Album lineup
  addLineupEntry: (albumId, instrument, performer) =>
    request(`/albums/${albumId}/lineup`, {
      method: "POST",
      body: JSON.stringify({ instrument, performer }),
    }),
  updateLineupEntry: (id, payload) =>
    request(`/lineup/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteLineupEntry: (id) => request(`/lineup/${id}`, { method: "DELETE" }),

  // Bulk import
  importSongs: (file, albumId) => {
    const formData = new FormData();
    formData.append("file", file);
    if (albumId != null) formData.append("album_id", String(albumId));
    return request(`/import/songs`, { method: "POST", body: formData });
  },

  // Quick options
  listOptions: (kind) => request(`/options?kind=${kind}`),
  createOption: (kind, label) =>
    request("/options", {
      method: "POST",
      body: JSON.stringify({ kind, label }),
    }),
  updateOption: (id, label) =>
    request(`/options/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ label }),
    }),
  deleteOption: (id) => request(`/options/${id}`, { method: "DELETE" }),

  // Weekly rotation
  listRotation: () => request("/rotation"),
  addRotationSlot: (day, bandId) =>
    request("/rotation", {
      method: "POST",
      body: JSON.stringify({ day, band_id: bandId }),
    }),
  deleteRotationSlot: (id) => request(`/rotation/${id}`, { method: "DELETE" }),
};
