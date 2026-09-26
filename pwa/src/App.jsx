import { Link, Route, Routes } from "react-router-dom";
import AlbumPage from "./pages/AlbumPage.jsx";
import AllSongsPage from "./pages/AllSongsPage.jsx";
import BandPage from "./pages/BandPage.jsx";
import BandsPage from "./pages/BandsPage.jsx";
import RotationPage from "./pages/RotationPage.jsx";
import SectionsPage from "./pages/SectionsPage.jsx";
import BackupMenu from "./components/BackupMenu.jsx";
import InstallButton from "./components/InstallButton.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <header className="top-bar">
        <Link to="/" className="brand">
          🎧 Music Journal
        </Link>
        <div className="top-bar-actions">
          <InstallButton />
          <BackupMenu />
        </div>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<SectionsPage />} />
          <Route path="/ratings" element={<BandsPage />} />
          <Route path="/bands/:bandId" element={<BandPage />} />
          <Route path="/albums/:albumId" element={<AlbumPage />} />
          <Route path="/rotation" element={<RotationPage />} />
          <Route path="/songs" element={<AllSongsPage />} />
        </Routes>
      </main>
    </div>
  );
}
