#!/usr/bin/env python
"""Merge build/entries_out.json OCR results into src/data/lessing-dict.ts.
Policy: fill-empty-only (never overwrite existing explain/cyrillic). Adds lessingForm + ocrFlags
(the raw OCR headword + review flags) on entries we filled from OCR. Matches by unique `index`
(sourceId is NOT unique) via anchors_all global order. Dry-run unless --write."""
import re, json, os, sys

HERE = os.path.dirname(__file__)
BUILD = os.path.join(HERE, "build")
DATA = os.path.normpath(os.path.join(HERE, "..", "..", "src", "data", "lessing-dict.json"))
WRITE = "--write" in sys.argv

ents = json.load(open(os.path.join(BUILD, "entries_out.json")))
anchors = json.load(open(os.path.join(BUILD, "anchors_all.json")))

# global index order from anchors (index is unique); entries_out is in the same order
flat = sorted((e for pg in anchors.values() for e in pg), key=lambda e: e["index"])
assert len(flat) == len(ents), f"count mismatch {len(flat)} vs {len(ents)}"
for a, e in zip(flat, ents):
    assert a["sourceId"] == e["sourceId"], f"order mismatch {a['sourceId']} vs {e['sourceId']}"
by_index = {a["index"]: e for a, e in zip(flat, ents)}

data = json.load(open(DATA, encoding="utf-8"))

stats = {"explain_filled": 0, "cyr_filled": 0, "flagged": 0, "skipped_has_explain": 0, "no_ocr": 0}
for entry in data:
    oc = by_index.get(entry["index"])
    if oc is None:
        stats["no_ocr"] += 1; continue
    touched = False
    body = " ".join(oc["bodyLines"]).strip()
    if not entry.get("explain") and body:
        entry["explain"] = body; stats["explain_filled"] += 1; touched = True
    elif entry.get("explain"):
        stats["skipped_has_explain"] += 1
    if not entry.get("cyrillic") and oc["cyrillicRaw"]:
        entry["cyrillic"] = oc["cyrillicRaw"]; stats["cyr_filled"] += 1; touched = True
    if touched:
        if oc["lessingForm"]: entry["lessingForm"] = oc["lessingForm"]
        if oc["flags"]:
            entry["ocrFlags"] = oc["flags"]; stats["flagged"] += 1

# supplement pass: overwrite the tail-section entries (Buddhist Terms / Additions / Third
# Supplement) with the dedicated inline-layout parser output (these are not manual data).
suppl_path = os.path.join(BUILD, "entries_suppl.json")
if os.path.exists(suppl_path):
    suppl = {e["index"]: e for e in json.load(open(suppl_path))}
    by_i = {e["index"]: e for e in data}
    for idx, s in suppl.items():
        entry = by_i.get(idx)
        if entry is None: continue
        if s["explain"]:
            entry["explain"] = s["explain"]; stats["suppl_filled"] = stats.get("suppl_filled", 0) + 1
        entry["lessingForm"] = s["lessingForm"] or entry.get("lessingForm", "")
        entry["ocrFlags"] = s["flags"]

print("STATS:", stats)
if WRITE:
    json.dump(data, open(DATA, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("WROTE", DATA)
else:
    print("(dry run — pass --write to apply)")
