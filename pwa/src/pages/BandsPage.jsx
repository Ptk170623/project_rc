import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import InlineAddForm from "../components/InlineAddForm.jsx";

export default function BandsPage() {
  const [bands, setBands] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.listBands().then(setBands).finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Bands</h1>
        <InlineAddForm
          label="Add band"
          placeholder="Band name"
          onSubmit={async (name) => {
            await api.createBand(name);
            load();
          }}
        />
      </div>

      {loading ? (
        <p className="empty-hint">Loading…</p>
      ) : bands.length === 0 ? (
        <p className="empty-hint">No bands added yet.</p>
      ) : (
        <ul className="card-list">
          {bands.map((band) => (
            <li key={band.id}>
              <Link className="entity-card" to={`/bands/${band.id}`}>
                {band.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
