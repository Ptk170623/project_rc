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
          <h3>Listening Log</h3>
          <p>Bands → albums → songs. Jot down traits and a quick Like/Meh as you listen.</p>
        </Link>
        <Link to="/rotation" className="section-card rotation">
          <div className="icon">🔁</div>
          <h3>Weekly Rotation</h3>
          <p>What you're spinning each day, plus an Others list for loose picks.</p>
        </Link>
      </div>
    </div>
  );
}
