#!/usr/bin/env python
"""Apply human corrections (exported from build/review.html) into src/data/lessing-dict.ts.

CSV columns: index, verdict, cyrillic, explain.
For each row: set cyrillic/explain to the reviewed value, and clear ocrFlags — EXCEPT when
verdict is "fix" and nothing was edited (still an unresolved problem, keep the flag).

Usage: python apply_corrections.py path/to/ocr_corrections.csv [--write]
"""
import json, os, re, sys, csv

HERE = os.path.dirname(__file__)
TS = os.path.normpath(os.path.join(HERE, "..", "..", "src", "data", "lessing-dict.ts"))
args = [a for a in sys.argv[1:] if not a.startswith("--")]
WRITE = "--write" in sys.argv
csv_path = args[0] if args else os.path.join(HERE, "build", "ocr_corrections.csv")

t = open(TS, encoding="utf-8").read()
head = t[:t.index("[\n")]
data = json.loads(t[t.index("[\n"):t.rindex("]")+1])
by_i = {e["index"]: e for e in data}

rows = list(csv.DictReader(open(csv_path, encoding="utf-8-sig")))
stats = {"updated": 0, "flags_cleared": 0, "missing_index": 0, "field_changed": 0}
for r in rows:
    idx = int(r["index"]); e = by_i.get(idx)
    if e is None:
        stats["missing_index"] += 1; continue
    verdict = (r.get("verdict") or "").strip()
    new_c, new_e = r.get("cyrillic", ""), r.get("explain", "")
    edited = (new_c != (e.get("cyrillic") or "")) or (new_e != (e.get("explain") or ""))
    if edited: stats["field_changed"] += 1
    if new_c: e["cyrillic"] = new_c
    else: e.pop("cyrillic", None)
    if new_e: e["explain"] = new_e
    else: e.pop("explain", None)
    # clear the review flag once a human has resolved it (ok, or edited); keep if still "fix" unedited
    if e.get("ocrFlags") and not (verdict == "fix" and not edited):
        e.pop("ocrFlags", None); stats["flags_cleared"] += 1
    stats["updated"] += 1

print("STATS:", stats)
if WRITE:
    open(TS, "w", encoding="utf-8").write(head + json.dumps(data, ensure_ascii=False, indent=2) + " as const;\n")
    print("WROTE", TS)
else:
    print("(dry run — pass --write to apply)")
