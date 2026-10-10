import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api.js";
import InstallButton from "./components/InstallButton.jsx";
import ExportImportMenu from "./components/ExportImportMenu.jsx";
import SearchBar from "./components/SearchBar.jsx";
import SubgenreBar from "./components/SubgenreBar.jsx";
import AlbumList from "./components/AlbumList.jsx";
import AlbumFormModal from "./components/AlbumFormModal.jsx";
import LabelManagerModal from "./components/LabelManagerModal.jsx";

export default function App() {
  const [albums, setAlbums] = useState([]);
  const [specificLabels, setSpecificLabels] = useState([]);
  const [bandNames, setBandNames] = useState([]);
  const [search, setSearch] = useState("");
  const [subgenreFilter, setSubgenreFilter] = useState(null); // label id or null
  const [loading, setLoading] = useState(true);

  const [showAddAlbum, setShowAddAlbum] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [showLabelManager, setShowLabelManager] = useState(false);

  const imageUrlsRef = useRef([]);

  const load = async () => {
    const [rawAlbums, specific, bands] = await Promise.all([
      api.listAlbums(),
      api.listLabelsWithCounts("specific"),
      api.listBandNames(),
    ]);

    imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    imageUrlsRef.current = [];
    const withImages = rawAlbums.map((a) => {
      if (!a.image) return { ...a, imageUrl: null };
      const url = URL.createObjectURL(a.image);
      imageUrlsRef.current.push(url);
      return { ...a, imageUrl: url };
    });

    setAlbums(withImages);
    setSpecificLabels(specific);
    setBandNames(bands);
    setLoading(false);
  };

  useEffect(() => {
    load();
    return () => imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const labelsById = useMemo(() => {
    const map = new Map();
    for (const l of specificLabels) map.set(l.id, l);
    return map;
  }, [specificLabels]);

  const visibleAlbums = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = albums;
    if (q) {
      result = result.filter(
        (a) => a.name.toLowerCase().includes(q) || (a.band_name || "").toLowerCase().includes(q)
      );
    }
    if (subgenreFilter != null) {
      result = result.filter((a) => a.subgenre_id === subgenreFilter);
    }
    return result;
  }, [albums, search, subgenreFilter]);

  const handleListen = async (id) => {
    await api.markListened(id);
    load();
  };

  const handleMoveTop = async (id) => {
    await api.moveToTop(id);
    load();
  };

  const handleReorder = async (orderedIds) => {
    // Optimistic: apply locally first so the drop doesn't visually snap
    // back while the write completes.
    const byId = new Map(albums.map((a) => [a.id, a]));
    setAlbums(orderedIds.map((id) => byId.get(id)).filter(Boolean));
    await api.reorderAlbums(orderedIds);
    load();
  };

  const handleImportanceChange = async (id, importance) => {
    await api.setImportance(id, importance);
    load();
  };

  if (loading) return null;

  return (
    <div className="app-shell">
      <header className="top-bar">
        <span className="brand">🗂️ Listening Queue</span>
        <div className="top-bar-actions">
          <InstallButton />
          <ExportImportMenu onImported={load} />
          <button className="btn btn-small btn-primary" onClick={() => setShowAddAlbum(true)}>
            + Add album
          </button>
        </div>
      </header>

      <main className="content">
        <div className="search-filter-row">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        <SubgenreBar
          labels={specificLabels}
          value={subgenreFilter}
          onChange={setSubgenreFilter}
          onManageLabels={() => setShowLabelManager(true)}
        />

        <AlbumList
          albums={visibleAlbums}
          labelsById={labelsById}
          onEdit={setEditingAlbum}
          onListen={handleListen}
          onMoveTop={handleMoveTop}
          onReorder={handleReorder}
          onImportanceChange={handleImportanceChange}
        />
      </main>

      {(showAddAlbum || editingAlbum) && (
        <AlbumFormModal
          album={editingAlbum}
          specificLabels={specificLabels}
          bandNames={bandNames}
          onClose={() => {
            setShowAddAlbum(false);
            setEditingAlbum(null);
          }}
          onSaved={load}
          onLabelsChanged={load}
        />
      )}

      {showLabelManager && (
        <LabelManagerModal
          kind="specific"
          title="Subgenres"
          onClose={() => setShowLabelManager(false)}
          onChanged={load}
        />
      )}
    </div>
  );
}
