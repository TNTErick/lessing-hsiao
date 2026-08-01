export interface LessingDictEntry {
  index: number;
  tradRom: string;
  cyrillic?: string;
  appendix?: boolean; // true = supplement/appendix entry (page >= 1159), not the main dictionary
  ocrFlags?: readonly string[];
  // Loaded in phase 2 (dict-detail.json) — undefined until the detail file arrives:
  explain?: string;
  examples?: string;
  sourceId?: string;
  imageName?: string;
  // Canonical-only (not shipped to the web): wIndex, lessingForm — see src/data/lessing-dict.json.
  wIndex?: string;
  lessingForm?: string;
}

// Canonical data lives in src/data/lessing-dict.json (edited by the OCR pipeline in scripts/ocr).
// The app loads two derived assets built by scripts/gen_web_data.py:
//   public/dict-index.json  — phase 1: index, tradRom, cyrillic, appendix, ocrFlags (list + search)
//   public/dict-detail.json — phase 2: explain, examples, sourceId, imageName (modal), merged in after
// Regenerate them after editing the data:  python scripts/gen_web_data.py
