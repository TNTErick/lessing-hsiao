#!/usr/bin/env python
"""Merge build/entries_out.json OCR results into src/data/lessing-dict.ts.
Policy: fill-empty-only (never overwrite existing explain/cyrillic). Adds lessingForm + ocrFlags
(the raw OCR headword + review flags) on entries we filled from OCR. Matches by unique `index`
(sourceId is NOT unique) via anchors_all global order. Dry-run unless --write."""
import re, json, os, sys

HERE = os.path.dirname(__file__)
BUILD = os.path.join(HERE, "build")
TS = os.path.normpath(os.path.join(HERE, "..", "..", "src", "data", "lessing-dict.ts"))
WRITE = "--write" in sys.argv

ents = json.load(open(os.path.join(BUILD, "entries_out.json")))
anchors = json.load(open(os.path.join(BUILD, "anchors_all.json")))

# global index order from anchors (index is unique); entries_out is in the same order
flat = sorted((e for pg in anchors.values() for e in pg), key=lambda e: e["index"])
assert len(flat) == len(ents), f"count mismatch {len(flat)} vs {len(ents)}"
for a, e in zip(flat, ents):
    assert a["sourceId"] == e["sourceId"], f"order mismatch {a['sourceId']} vs {e['sourceId']}"
by_index = {a["index"]: e for a, e in zip(flat, ents)}

t = open(TS, encoding="utf-8").read()
head = t[:t.index("[\n")]
data = json.loads(t[t.index("[\n"):t.rindex("]")+1])

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

# interface: add the two new optional fields (once)
if "lessingForm?" not in head:
    head = head.replace("  examples?: string;\n",
                        "  examples?: string;\n  lessingForm?: string;\n  ocrFlags?: readonly string[];\n")

out = head + json.dumps(data, ensure_ascii=False, indent=2) + " as const;\n"
print("STATS:", stats)
if WRITE:
    open(TS, "w", encoding="utf-8").write(out)
    print("WROTE", TS)
else:
    print("(dry run — pass --write to apply)")
