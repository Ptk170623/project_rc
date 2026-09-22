export const IMPORT_TEMPLATE = `# Everything except song titles is optional — a plain list of
# song names, one per line, still works exactly as it does today.

Band: Radiohead
Album: In Rainbows

Lineup:
Vocal: Thom Yorke
Guitar: Jonny Greenwood
Bass: Colin Greenwood
Drums: Phil Selway

Songs:
15 Step
Bodysnatchers
Nude
Reckoner | Guitar: Ed O'Brien
House of Cards
Jigsaw Falling Into Place | Vocal: Thom Yorke, Ed O'Brien
Videotape
`;

export function downloadImportTemplate() {
  const blob = new Blob([IMPORT_TEMPLATE], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "music-journal-import-template.txt";
  a.click();
  URL.revokeObjectURL(url);
}
