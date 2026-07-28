#!/usr/bin/env python
"""Split the canonical dictionary into two web assets for fast, staged loading:

  public/dict-index.json   — light: everything EXCEPT explain/examples (list + headword search)
  public/dict-detail.json  — heavy: {index: {explain, examples}} (loaded in the background)

The app renders the list from the index immediately, then merges in details when the
second file arrives. Re-run after editing src/data/lessing-dict.json.
"""
import json, os

HERE = os.path.dirname(__file__)
SRC = os.path.normpath(os.path.join(HERE, "..", "src", "data", "lessing-dict.json"))
PUB = os.path.normpath(os.path.join(HERE, "..", "public"))

data = json.load(open(SRC, encoding="utf-8"))

index, detail = [], {}
for e in data:
    light = {k: v for k, v in e.items() if k not in ("explain", "examples")}
    index.append(light)
    d = {}
    if e.get("explain"): d["explain"] = e["explain"]
    if e.get("examples"): d["examples"] = e["examples"]
    if d: detail[e["index"]] = d

os.makedirs(PUB, exist_ok=True)
ipath = os.path.join(PUB, "dict-index.json")
dpath = os.path.join(PUB, "dict-detail.json")
json.dump(index, open(ipath, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
json.dump(detail, open(dpath, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
kb = lambda p: os.path.getsize(p) // 1024
print(f"dict-index.json  {kb(ipath)} KB  ({len(index)} entries)")
print(f"dict-detail.json {kb(dpath)} KB  ({len(detail)} with explain/examples)")
