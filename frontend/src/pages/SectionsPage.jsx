import { Link } from "react-router-dom";

export default function SectionsPage() {
  return (
    <div>
      <div className="page-header">
        <h1>Sections</h1>
      </div>
      <div className="section-grid">
        <Link to="/ratings" className="section-card ratings">
          <div className="icon">🎧</div>
          <h3>Ratings</h3>
          <p>Bands → albums → songs. Rate tracks and log traits as you listen.</p>
        </Link>
        <Link to="/rotation" className="section-card rotation">
          <div className="icon">🔁</div>
          <h3>Weekly Rotation</h3>
          <p>What you're spinning each day, plus an Others list for loose picks.</p>
        </Link>
        <Link to="/songs" className="section-card all-songs">
          <div className="icon">🎵</div>
          <h3>All Songs</h3>
          <p>Every song from every band in one list, with an edit lock to browse safely.</p>
        </Link>
      </div>
    </div>
  );
}
