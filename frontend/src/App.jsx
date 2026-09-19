import { Link, Route, Routes } from "react-router-dom";
import AlbumPage from "./pages/AlbumPage.jsx";
import BandPage from "./pages/BandPage.jsx";
import BandsPage from "./pages/BandsPage.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <header className="top-bar">
        <Link to="/" className="brand">
          🎧 Music Journal
        </Link>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<BandsPage />} />
          <Route path="/bands/:bandId" element={<BandPage />} />
          <Route path="/albums/:albumId" element={<AlbumPage />} />
        </Routes>
      </main>
    </div>
  );
}
