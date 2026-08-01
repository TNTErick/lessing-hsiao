#!/usr/bin/env python
"""Split the canonical dictionary into two web assets for fast, staged loading.

  public/dict-index.json   — phase 1: only what the word-list + search need. Small, so
                             headwords appear fast. Fields: index, tradRom, cyrillic,
                             appendix, ocrFlags.
  public/dict-detail.json  — phase 2 (loaded in the background): everything the detail
                             modal + definition preview need, keyed by index. Fields:
                             explain, examples, sourceId, imageName.

Fields only used by the OCR pipeline / review.html (lessingForm, wIndex) are dropped
from the web assets entirely — they stay in the canonical src/data/lessing-dict.json.

The app renders the list from the index immediately, then merges in details when the
second file arrives. Re-run after editing src/data/lessing-dict.json.
"""
import json, os

HERE = os.path.dirname(__file__)
SRC = os.path.normpath(os.path.join(HERE, "..", "src", "data", "lessing-dict.json"))
PUB = os.path.normpath(os.path.join(HERE, "..", "public"))

# Phase-1 fields (besides "index", always kept). Anything not listed here and not a
# DETAIL field is dropped from the web assets.
INDEX_FIELDS = ("tradRom", "cyrillic", "appendix", "ocrFlags")
# Phase-2 fields, keyed by index in dict-detail.json.
DETAIL_FIELDS = ("explain", "examples", "sourceId", "imageName")

data = json.load(open(SRC, encoding="utf-8"))

index, detail = [], {}
for e in data:
    light = {"index": e["index"]}
    for k in INDEX_FIELDS:
        v = e.get(k)
        if v not in (None, "", [], False):
            light[k] = v
    index.append(light)

    d = {}
    for k in DETAIL_FIELDS:
        v = e.get(k)
        if v not in (None, "", []):
            d[k] = v
    if d:
        detail[e["index"]] = d

os.makedirs(PUB, exist_ok=True)
ipath = os.path.join(PUB, "dict-index.json")
dpath = os.path.join(PUB, "dict-detail.json")
json.dump(index, open(ipath, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
json.dump(detail, open(dpath, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
kb = lambda p: os.path.getsize(p) // 1024
print(f"dict-index.json  {kb(ipath)} KB  ({len(index)} entries)")
print(f"dict-detail.json {kb(dpath)} KB  ({len(detail)} with detail)")
