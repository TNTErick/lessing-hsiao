// OCR review flags attached to entries by the OCR pipeline (scripts/ocr).
// Two tiers: "crucial" — the data may be wrong; "general" — verify only.

export const CRUCIAL_FLAGS = new Set([
  "NO_HEADWORD", "EMPTY_BODY", "MERGED_HEAD", "HEADWORD_MISMATCH",
  "SPLIT_GUESS", "NO_LINE", "SUPPL_MISMATCH",
]);

export const FLAG_LABELS: Record<string, string> = {
  NO_HEADWORD: "Headword not detected by OCR",
  EMPTY_BODY: "No definition text captured",
  MERGED_HEAD: "May include the next entry's text",
  HEADWORD_MISMATCH: "OCR headword differs from the romanisation",
  SPLIT_GUESS: "Definition auto-split from a merged block — verify",
  NO_LINE: "No text line found for this entry",
  SUPPL_MISMATCH: "Supplement headword uncertain",
  CYR_LOW_CONF: "Cyrillic recognition low confidence",
  GAMMA_CHECK: "Possible γ↔y misreading",
  VOWEL_I_CHECK: "Check ai / ayi (vowel + i) romanisation",
  CROSS_PAGE: "Text continues across a page boundary",
  CROSS_COLUMN: "Text continues across a column boundary",
  SUPPL: "From a supplement / additions section",
};

export type FlagTier = "crucial" | "general" | "clean";

export function flagTier(flags?: readonly string[]): FlagTier {
  if (!flags || flags.length === 0) return "clean";
  if (flags.some((f) => CRUCIAL_FLAGS.has(f))) return "crucial";
  return "general";
}

/** Tooltip text listing each flag and its meaning. */
export function flagTitle(flags: readonly string[]): string {
  return flags.map((f) => `${CRUCIAL_FLAGS.has(f) ? "[!]" : "ⓘ"} ${FLAG_LABELS[f] ?? f}`).join("\n");
}
