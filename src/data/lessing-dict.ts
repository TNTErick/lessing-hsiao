export interface LessingDictEntry {
  index: number;
  sourceId: string;
  tradRom: string;
  cyrillic?: string;
  wIndex?: string;
  explain?: string;
  examples?: string;
  lessingForm?: string;
  ocrFlags?: readonly string[];
  appendix?: boolean; // true = supplement/appendix entry (page >= 1159), not the main dictionary
  imageName: string;
}

// Canonical data lives in src/data/lessing-dict.json (edited by the OCR pipeline in scripts/ocr).
// The app loads two derived assets built by scripts/gen_web_data.py:
//   public/dict-index.json  — light (no explain/examples): list + headword search, loaded first
//   public/dict-detail.json — definitions, merged in afterwards
// Regenerate them after editing the data:  python scripts/gen_web_data.py
