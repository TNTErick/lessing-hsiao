#!/usr/bin/env python
"""Extract per-page anchors from public/lessing-dict.json -> build/anchors_all.json.
Anchors = the known (sourceId, dicForm, col, line, index) for every entry, grouped by
page. They are the reliable spine that segment.py aligns noisy OCR headwords against.
(`dicForm` in the anchor = the entry's `tradRom` field; the key name is kept for pipeline
compatibility.) Run whenever the dictionary data changes.
"""
import re, json, os

HERE = os.path.dirname(__file__)
DATA = os.path.normpath(os.path.join(HERE, "..", "..", "src", "data", "lessing-dict.json"))
OUT = os.path.join(HERE, "build", "anchors_all.json")

def main():
    data = json.load(open(DATA, encoding="utf-8"))
    pages = {}
    for e in data:
        m = re.match(r'L(\d+)-(\d+)-(\d+)', e["sourceId"])
        if not m:
            continue
        pg, col, ln = (int(g) for g in m.groups())
        pages.setdefault(pg, []).append({"sourceId": e["sourceId"], "dicForm": e.get("tradRom", ""),
                                         "col": col, "line": ln, "index": e["index"]})
    for pg in pages:
        pages[pg].sort(key=lambda x: (x["col"], x["line"]))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(pages, open(OUT, "w"), ensure_ascii=False)
    print(f"pages={len(pages)} entries={sum(len(v) for v in pages.values())} -> {OUT}")

if __name__ == "__main__":
    main()
