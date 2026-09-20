import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import RotationDayCard from "../components/RotationDayCard.jsx";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
];

export default function RotationPage() {
  const [slots, setSlots] = useState([]);
  const [bands, setBands] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    Promise.all([api.listRotation(), api.listBands()])
      .then(([slotsData, bandsData]) => {
        setSlots(slotsData);
        setBands(bandsData);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const slotsFor = (day) =>
    slots.filter((s) => s.day === day).sort((a, b) => a.position - b.position);

  const addToDay = async (day, name) => {
    const existing = bands.find((b) => b.name.toLowerCase() === name.toLowerCase());
    const band = existing || (await api.createBand(name));
    await api.addRotationSlot(day, band.id);
    load();
  };

  const removeSlot = async (id) => {
    await api.deleteRotationSlot(id);
    load();
  };

  if (loading) return <p className="empty-hint">Loading…</p>;

  return (
    <div>
      <Link to="/" className="breadcrumb">
        ← Sections
      </Link>
      <div className="page-header">
        <h1>Weekly Rotation</h1>
      </div>
      <p className="rotation-context">Featured pick(s) get roughly double the plays</p>
      <div className="day-stack">
        {DAYS.map((day) => (
          <RotationDayCard
            key={day.key}
            dayKey={day.key}
            label={day.label}
            slots={slotsFor(day.key)}
            bands={bands}
            onAdd={(name) => addToDay(day.key, name)}
            onRemove={removeSlot}
          />
        ))}
        <RotationDayCard
          dayKey="others"
          label="Others"
          hint="— not tied to a day, never featured"
          slots={slotsFor("others")}
          bands={bands}
          onAdd={(name) => addToDay("others", name)}
          onRemove={removeSlot}
          neverFeatured
          className="others-card"
        />
      </div>
    </div>
  );
}
