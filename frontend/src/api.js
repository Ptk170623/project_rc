// Sem VITE_API_BASE definido, assume a API na mesma máquina que serviu a
// página (funciona tanto em localhost quanto ao acessar pelo IP da rede,
// como no celular), na porta padrão do uvicorn.
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
  bulkCreateSongs: (albumId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return request(`/albums/${albumId}/songs/bulk`, {
      method: "POST",
      body: formData,
    });
  },
  updateSong: (songId, payload) =>
    request(`/songs/${songId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteSong: (songId) => request(`/songs/${songId}`, { method: "DELETE" }),

  // Traits
  addTrait: (songId, text, subText) =>
    request(`/songs/${songId}/traits`, {
      method: "POST",
      body: JSON.stringify({ text, sub_text: subText || null }),
    }),
  updateTrait: (traitId, payload) =>
    request(`/traits/${traitId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteTrait: (traitId) => request(`/traits/${traitId}`, { method: "DELETE" }),

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
};
