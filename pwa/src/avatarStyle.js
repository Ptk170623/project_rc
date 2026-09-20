// Deterministic placeholder avatar (hue + initials) for a band, used until
// real artwork is wired up.
export function initialsFor(name) {
  return name
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function avatarColor(name) {
  let hue = 0;
  for (let i = 0; i < name.length; i++) {
    hue = (hue * 31 + name.charCodeAt(i)) % 360;
  }
  return `hsl(${hue}, 45%, 33%)`;
}
