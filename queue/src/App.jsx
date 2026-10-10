import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api.js";
import InstallButton from "./components/InstallButton.jsx";
import ExportImportMenu from "./components/ExportImportMenu.jsx";
import SearchBar from "./components/SearchBar.jsx";
import SubgenreFilter from "./components/SubgenreFilter.jsx";
import SegmenterRow from "./components/SegmenterRow.jsx";
import AlbumList from "./components/AlbumList.jsx";
import AlbumFormModal from "./components/AlbumFormModal.jsx";
import LabelManagerModal from "./components/LabelManagerModal.jsx";

export default function App() {
  const [albums, setAlbums] = useState([]);
  const [specificLabels, setSpecificLabels] = useState([]);
  const [genericLabels, setGenericLabels] = useState([]);
  const [specificSegmenters, setSpecificSegmenters] = useState([]);
  const [genericSegmenters, setGenericSegmenters] = useState([]);
  const [bandNames, setBandNames] = useState([]);
  const [search, setSearch] = useState("");
  const [subgenreFilter, setSubgenreFilter] = useState(null); // "specific-<id>" | "generic-<id>" | null
  const [loading, setLoading] = useState(true);

  const [showAddAlbum, setShowAddAlbum] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [manageLabelsKind, setManageLabelsKind] = useState(null);

  const imageUrlsRef = useRef([]);

  const load = async () => {
    const [rawAlbums, specific, generic, segSpecific, segGeneric, bands] = await Promise.all([
      api.listAlbums(),
      api.listLabels("specific"),
      api.listLabels("generic"),
      api.listSegmenters("specific"),
      api.listSegmenters("generic"),
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
    setGenericLabels(generic);
    setSpecificSegmenters(segSpecific);
    setGenericSegmenters(segGeneric);
    setBandNames(bands);
    setLoading(false);
  };

  useEffect(() => {
    load();
    return () => imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const labelsById = useMemo(() => {
    const map = new Map();
    for (const l of [...specificLabels, ...genericLabels]) map.set(l.id, l);
    return map;
  }, [specificLabels, genericLabels]);

  const visibleAlbums = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = albums;
    if (q) {
      result = result.filter(
        (a) => a.name.toLowerCase().includes(q) || (a.band_name || "").toLowerCase().includes(q)
      );
    }
    if (subgenreFilter) {
      const [kind, idStr] = subgenreFilter.split("-");
      const id = Number(idStr);
      const field = kind === "specific" ? "subgenre_id" : "subgenre_generic_id";
      result = result.filter((a) => a[field] === id);
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

  const handleSegmenterQuantity = async (labelId, kind, qty) => {
    await api.setSegmenterQuantity(labelId, kind, qty);
    load();
  };

  const handleSegmenterReorder = async (kind, orderedLabelIds) => {
    await api.reorderSegmenters(kind, orderedLabelIds);
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
          <SubgenreFilter
            specificLabels={specificLabels}
            genericLabels={genericLabels}
            value={subgenreFilter}
            onChange={setSubgenreFilter}
          />
        </div>

        <SegmenterRow
          kind="specific"
          title="Subgenre"
          segmenters={specificSegmenters}
          onQuantityChange={handleSegmenterQuantity}
          onReorder={handleSegmenterReorder}
          onManageLabels={setManageLabelsKind}
        />
        <SegmenterRow
          kind="generic"
          title="Generic subgenre"
          segmenters={genericSegmenters}
          onQuantityChange={handleSegmenterQuantity}
          onReorder={handleSegmenterReorder}
          onManageLabels={setManageLabelsKind}
        />

        <AlbumList
          albums={visibleAlbums}
          labelsById={labelsById}
          onEdit={setEditingAlbum}
          onListen={handleListen}
          onMoveTop={handleMoveTop}
          onReorder={handleReorder}
        />
      </main>

      {(showAddAlbum || editingAlbum) && (
        <AlbumFormModal
          album={editingAlbum}
          specificLabels={specificLabels}
          genericLabels={genericLabels}
          bandNames={bandNames}
          onClose={() => {
            setShowAddAlbum(false);
            setEditingAlbum(null);
          }}
          onSaved={load}
          onLabelsChanged={load}
        />
      )}

      {manageLabelsKind && (
        <LabelManagerModal
          kind={manageLabelsKind}
          title={manageLabelsKind === "specific" ? "Subgenres" : "Generic subgenres"}
          onClose={() => setManageLabelsKind(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
